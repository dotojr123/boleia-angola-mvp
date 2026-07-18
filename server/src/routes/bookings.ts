// server/src/routes/bookings.ts - Módulo de Reservas (Booking) com Transação Atômica

import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import db from '../config/db';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { BookingSchema, Booking, BookingCreateInput, BookingUpdateInput, BookingValidator, BookingStateMachine } from '../entities/Booking';
import type { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Schemas de validação Zod
const BookingCreateSchema = z.object({
  ride_id: z.string().uuid('ID de viagem inválido'),
  seats_booked: z.number().int().min(1, 'Mínimo 1 assento').max(15, 'Máximo 15 assentos')
});

const BookingStatusUpdateSchema = z.object({
  status: z.enum(['confirmed', 'rejected', 'cancelled'], 'Status inválido')
});

/**
 * POST /api/bookings - Criar reserva
 * R2.1: Validar assentos disponíveis
 * R2.2: Viagem deve ser scheduled ou active
 * R2.3:Não pode reservar mesma viagem mais de uma vez (confirmed)
 * R2.4: preço total = price_per_seat × seats_booked
 * R2.5: Cria com status = confirmed
 * R2.6-R2.7: Transação atômica (INSERT + UPDATE + ROLLBACK)
 */
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    // Validar input
    const { ride_id, seats_booked } = BookingCreateSchema.parse(req.body);
    const passenger_id = req.user.id;

    // Iniciar transação
    await db.query('BEGIN');

    try {
      // Verificar viagem existente e status
      const rideResult = await db.query(
        'SELECT id, driver_id, available_seats, price_per_seat, status FROM rides WHERE id = $1',
        [ride_id]
      );

      if (rideResult.rows.length === 0) {
        await db.query('ROLLBACK');
        return res.status(404).json({ error: 'Viagem não encontrada', code: 'RIDE_NOT_FOUND' });
      }

      const ride = rideResult.rows[0];

      // R2.2: Validar status da viagem
      if (ride.status !== 'scheduled' && ride.status !== 'active') {
        await db.query('ROLLBACK');
        return res.status(400).json({
          error: 'Esta viagem não está aceitando reservas. Status atual: ' + ride.status,
          code: 'INVALID_RIDE_STATUS'
        });
      }

      // R2.1: Validar assentos disponíveis
      if (ride.available_seats < seats_booked) {
        await db.query('ROLLBACK');
        return res.status(400).json({
          error: `Não há assentos suficientes. Disponíveis: ${ride.available_seats}, Solicitados: ${seats_booked}`,
          code: 'INSUFFICIENT_SEATS'
        });
      }

      // R2.3: Verificar duplicidade
      const existingBooking = await db.query(
        'SELECT id, status FROM bookings WHERE ride_id = $1 AND passenger_id = $2',
        [ride_id, passenger_id]
      );

      const alreadyConfirmed = existingBooking.rows.some((b: any) => b.status === 'confirmed');
      
      if (alreadyConfirmed) {
        await db.query('ROLLBACK');
        return res.status(400).json({
          error: 'Você já tem uma reserva confirmada nesta viagem',
          code: 'DUPLICATE_BOOKING'
        });
      }

      // R2.4: Calcular preço total
      const total_price = parseFloat(ride.price_per_seat) * seats_booked;

      // R2.5: Criar reserva com status = confirmed
      const bookingResult = await db.query(
        `INSERT INTO bookings (ride_id, passenger_id, seats_booked, total_price, status)
         VALUES ($1, $2, $3, $4, 'confirmed')
         RETURNING *`,
        [ride_id, passenger_id, seats_booked, total_price]
      );

      // R2.6: Atualizar available_seats atomicamente
      await db.query(
        'UPDATE rides SET available_seats = available_seats - $1 WHERE id = $2',
        [seats_booked, ride_id]
      );

      // Commit
      await db.query('COMMIT');

      res.status(201).json({
        ...bookingResult.rows[0],
        message: 'Reserva criada com sucesso'
      });
    } catch (error) {
      // R2.7: Rollback em caso de erro
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors.map((e: any) => ({ field: e.path[0], message: e.message }))
      });
    }

    console.error('[BOOKINGS] Error creating booking:', error);
    res.status(500).json({ error: 'Erro ao criar reserva', code: 'CREATE_BOOKING_FAILED' });
  }
});

/**
 * GET /api/bookings/passenger - Listar reservas do passageiro
 */
router.get('/passenger', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const result = await db.query(
      `SELECT b.*, 
              r.origin_city, r.destination_city, r.departure_time, r.driver_id, r.price_per_seat,
              p.full_name as driver_name, p.phone as driver_phone, p.avatar_url as driver_avatar,
              p.rating as driver_rating,
              v.make as vehicle_make, v.model as vehicle_model, v.color as vehicle_color, v.year as vehicle_year
       FROM bookings b
       JOIN rides r ON b.ride_id = r.id
       JOIN profiles p ON r.driver_id = p.id
       LEFT JOIN vehicles v ON r.vehicle_id = v.id
       WHERE b.passenger_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('[BOOKINGS] Error fetching passenger bookings:', error);
    res.status(500).json({ error: 'Erro ao buscar reservas', code: 'LIST_BOOKINGS_FAILED' });
  }
});

/**
 * GET /api/bookings/driver - Listar reservas das viagens do motorista
 */
router.get('/driver', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const result = await db.query(
      `SELECT b.*, 
              r.origin_city, r.destination_city, r.departure_time, r.status as ride_status,
              p.full_name as passenger_name, p.phone as passenger_phone, p.avatar_url as passenger_avatar,
              p.rating as passenger_rating
       FROM bookings b
       JOIN rides r ON b.ride_id = r.id
       JOIN profiles p ON b.passenger_id = p.id
       WHERE r.driver_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('[BOOKINGS] Error fetching driver bookings:', error);
    res.status(500).json({ error: 'Erro ao buscar reservas', code: 'LIST_BOOKINGS_FAILED' });
  }
});

/**
 * GET /api/bookings/:id - Detalhes da reserva
 */
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { id } = req.params;

    const result = await db.query(
      `SELECT b.*, 
              r.origin_city, r.destination_city, r.departure_time, r.driver_id, r.status as ride_status,
              p.full_name as passenger_name, p.phone as passenger_phone,
              d.full_name as driver_name, d.phone as driver_phone
       FROM bookings b
       JOIN rides r ON b.ride_id = r.id
       JOIN profiles p ON b.passenger_id = p.id
       JOIN profiles d ON r.driver_id = d.id
       WHERE b.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva não encontrada', code: 'BOOKING_NOT_FOUND' });
    }

    const booking = result.rows[0];

    // Verificar permissão: dono da reserva, motorista da viagem, ou admin
    const canAccess = 
      req.user.role === 'admin' ||
      booking.passenger_id === req.user.id ||
      booking.driver_id === req.user.id;

    if (!canAccess) {
      return res.status(403).json({ error: 'Sem permissão para ver esta reserva', code: 'NOT_ALLOWED' });
    }

    res.json(booking);
  } catch (error) {
    console.error('[BOOKINGS] Error fetching booking:', error);
    res.status(500).json({ error: 'Erro ao buscar reserva', code: 'FETCH_BOOKING_FAILED' });
  }
});

/**
 * PATCH /api/bookings/:id/status - Atualizar status da reserva
 * R5.1: Apenas motorista dono da viagem ou admin pode alterar
 * R5.2: Status válidos = confirmed, rejected, cancelled
 * R5.3: Rejeitar/cancelar restaura assentos
 * R5.4: Apenas confirmed restaura assentos ao ser cancelado
 */
router.patch('/:id/status', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { id } = req.params;
    const { status } = BookingStatusUpdateSchema.parse(req.body);

    // Verificar reserva existente
    const bookingResult = await db.query(
      `SELECT b.*, r.driver_id 
       FROM bookings b
       JOIN rides r ON b.ride_id = r.id
       WHERE b.id = $1`,
      [id]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva não encontrada', code: 'BOOKING_NOT_FOUND' });
    }

    const booking = bookingResult.rows[0];

    // R5.1: Verificar permissão
    if (booking.driver_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para alterar esta reserva', code: 'NOT_OWNER' });
    }

    // R5.2: Verificar se status já é o desejado
    if (booking.status === status) {
      return res.status(400).json({
        error: `Reserva já está com status "${status}"`,
        code: 'STATUS_UNCHANGED'
      });
    }

    // R5.3: Verificar se transição é válida
    const canTransition = BookingStateMachine.isFinalState(booking.status);
    if (canTransition && booking.status !== status) {
      return res.status(400).json({
        error: `Não é possível alterar status de "${booking.status}" (final state)`,
        code: 'INVALID_TRANSITION'
      });
    }

    // R5.4: Restaurar assentos se estiver cancelando/rejeitando reserva confirmed
    if ((status === 'cancelled' || status === 'rejected') && booking.status === 'confirmed') {
      await db.query(
        'UPDATE rides SET available_seats = available_seats + $1 WHERE id = $2',
        [booking.seats_booked, booking.ride_id]
      );
    }

    // Atualizar status
    const updateResult = await db.query(
      `UPDATE bookings 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );

    res.json({
      ...updateResult.rows[0],
      message: `Status atualizado para "${status}"`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors.map((e: any) => ({ field: e.path[0], message: e.message }))
      });
    }

    console.error('[BOOKINGS] Error updating booking status:', error);
    res.status(500).json({ error: 'Erro ao atualizar status da reserva', code: 'UPDATE_BOOKING_FAILED' });
  }
});

/**
 * DELETE /api/bookings/:id - Cancelar reserva (passageiro)
 * Equivalent a PATCH status = 'cancelled'
 */
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { id } = req.params;

    // Verificar reserva
    const bookingResult = await db.query(
      'SELECT id, passenger_id, status, seats_booked, ride_id FROM bookings WHERE id = $1',
      [id]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva não encontrada', code: 'BOOKING_NOT_FOUND' });
    }

    const booking = bookingResult.rows[0];

    // Verificar dono
    if (booking.passenger_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para cancelar esta reserva', code: 'NOT_OWNER' });
    }

    // Apenas confirmed pode ser cancelado
    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        error: `Apenas reservas confirmed podem ser canceladas. Status atual: ${booking.status}`,
        code: 'INVALID_STATUS_FOR_CANCELLATION'
      });
    }

    // Cancelar (resto assentos)
    await db.query(
      `UPDATE bookings 
       SET status = 'cancelled', updated_at = NOW() 
       WHERE id = $1`,
      [id]
    );

    // R5.3: Restaurar assentos
    await db.query(
      'UPDATE rides SET available_seats = available_seats + $1 WHERE id = $2',
      [booking.seats_booked, booking.ride_id]
    );

    res.json({ message: 'Reserva cancelada com sucesso' });
  } catch (error) {
    console.error('[BOOKINGS] Error cancelling booking:', error);
    res.status(500).json({ error: 'Erro ao cancelar reserva', code: 'CANCEL_BOOKING_FAILED' });
  }
});

export default router;
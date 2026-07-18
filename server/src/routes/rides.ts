// server/src/routes/rides.ts - Módulo de Viagens (CRUD + Machine of States)

import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import db from '../config/db';
import { requireAuth, requireRole } from '../middleware/auth';
import { RideSchema, Ride, RideCreateInput, RideUpdateInput, RideValidator, RideStateMachine } from '../entities/Ride';
import { checkPermission } from '../middleware/auth';
import type { AuthenticatedRequest, UserRole } from '../middleware/auth';

const router = Router();

// Schemas de validação Zod
const RideCreateSchema = RideSchema.omit({
  id: true,
  available_seats: true,
  status: true,
  created_at: true,
  updated_at: true,
  currency: true,
  booking_mode: true,
  instant_booking: true,
  waypoints: true
}).extend({
  origin_city: z.string().min(2, 'Cidade de origem obrigatória').max(100),
  destination_city: z.string().min(2, 'Cidade de destino obrigatória').max(100),
  departure_time: z.string().datetime(),
  price_per_seat: z.number().positive('Preço deve ser maior que 0'),
  total_seats: z.number().int().min(1).max(15),
  vehicle_id: z.string().uuid().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  origin_exact_point: z.string().max(500).optional().nullable(),
  destination_exact_point: z.string().max(500).optional().nullable(),
  estimated_arrival: z.string().datetime().optional().nullable(),
  duration: z.string().optional().nullable(),
  baggage_policy: z.string().max(200).optional().nullable(),
  luggage_size: z.string().optional().nullable(),
  frequency: z.string().optional().nullable(),
  waypoints: z.array(z.object({
    city: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    order: z.number()
  })).optional().default([])
});

const RideUpdateSchema = RideCreateSchema.partial();

// Rotas

/**
 * POST /api/rides - Criar nova viagem
 * R1.1: Apenas driver ou admin
 * R1.2: departure_time futurário
 * R1.3: price_per_seat > 0
 * R1.4: available_seats entre 1-15
 * R1.5: vehicle_id deve pertencer ao motorista
 * R1.6: Status default = scheduled
 * R1.7: Currency default = Kz
 */
router.post('/', requireAuth, requireRole('driver', 'admin'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    // Validar dados
    const data = RideCreateSchema.parse(req.body);

    // Validar departure_time no futuro
    const departureDate = new Date(data.departure_time);
    if (departureDate <= new Date()) {
      return res.status(400).json({ 
        error: 'departure_time deve ser uma data/hora futura',
        code: 'DEPARTURE_IN_PAST'
      });
    }

    // Verificar veículo se fornecido
    if (data.vehicle_id) {
      const vehicleResult = await db.query(
        'SELECT owner_id FROM vehicles WHERE id = $1 AND is_active = true',
        [data.vehicle_id]
      );
      
      if (vehicleResult.rows.length === 0) {
        return res.status(400).json({ 
          error: 'Veículo não encontrado ou inativo',
          code: 'VEHICLE_NOT_FOUND'
        });
      }
      
      if (vehicleResult.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ 
          error: 'Veículo não pertence ao usuário',
          code: 'VEHICLE_NOT_OWNED'
        });
      }
    }

    // Calcular available_seats = total_seats inicialmente
    const availableSeats = data.total_seats;

    // Criar viagem
    const result = await db.query(
      `INSERT INTO rides (
        driver_id, vehicle_id, origin_city, destination_city, 
        origin_exact_point, destination_exact_point,
        departure_time, estimated_arrival, duration,
        price_per_seat, total_seats, available_seats,
        status, description, baggage_policy, luggage_size,
        frequency, booking_mode, instant_booking, waypoints,
        currency
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *`,
      [
        req.user.id,
        data.vehicle_id || null,
        data.origin_city,
        data.destination_city,
        data.origin_exact_point || null,
        data.destination_exact_point || null,
        data.departure_time,
        data.estimated_arrival || null,
        data.duration || null,
        data.price_per_seat,
        data.total_seats,
        availableSeats,
        'scheduled', // R1.6
        data.description || null,
        data.baggage_policy || null,
        data.luggage_size || null,
        data.frequency || null,
        data.booking_mode || 'request',
        data.instant_booking || false,
        JSON.stringify(data.waypoints || []),
        data.currency || 'Kz' // R1.7
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors.map(e => ({ field: e.path[0], message: e.message }))
      });
    }

    console.error('[RIDES] Error creating ride:', error);
    res.status(500).json({ error: 'Erro ao criar viagem', code: 'CREATE_RIDE_FAILED' });
  }
});

/**
 * GET /api/rides - Listar viagens (com filtros opcionais)
 */
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { 
      origin, 
      destination, 
      status, 
      driver_id,
      page = '1',
      limit = '20'
    } = req.query;

    let query = `
      SELECT r.*, 
             p.full_name as driver_name,
             p.avatar_url as driver_avatar,
             p.phone as driver_phone,
             p.rating as driver_rating,
             p.verification_status as driver_verification
      FROM rides r
      LEFT JOIN profiles p ON r.driver_id = p.id
      WHERE r.is_active != false
    `;
    
    const values: any[] = [];
    let paramIndex = 1;

    if (origin) {
      query += ` AND r.origin_city ILIKE $${paramIndex++}`;
      values.push(`%${origin}%`);
    }

    if (destination) {
      query += ` AND r.destination_city ILIKE $${paramIndex++}`;
      values.push(`%${destination}%`);
    }

    if (status) {
      query += ` AND r.status = $${paramIndex++}`;
      values.push(status);
    }

    if (driver_id) {
      query += ` AND r.driver_id = $${paramIndex++}`;
      values.push(driver_id);
    }

    // Only show past rides if user is driver/admin
    if (req.user?.role !== 'admin' && req.user?.role !== 'driver') {
      query += ` AND r.status != 'completed'`;
    }

    const offset = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
    query += ` ORDER BY r.departure_time ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    values.push(parseInt(limit as string, 10), offset);

    const result = await db.query(query, values);

    res.json({
      data: result.rows,
      pagination: {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        total: result.rows.length // Para paginação completa, precisaria de COUNT(*)
      }
    });
  } catch (error) {
    console.error('[RIDES] Error listing rides:', error);
    res.status(500).json({ error: 'Erro ao listar viagens', code: 'LIST_RIDES_FAILED' });
  }
});

/**
 * GET /api/rides/:id - Detalhes da viagem
 */
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT r.*,
              p.full_name as driver_name,
              p.avatar_url as driver_avatar,
              p.phone as driver_phone,
              p.rating as driver_rating,
              p.verification_status as driver_verification
       FROM rides r
       LEFT JOIN profiles p ON r.driver_id = p.id
       WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Viagem não encontrada', code: 'RIDE_NOT_FOUND' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('[RIDES] Error fetching ride:', error);
    res.status(500).json({ error: 'Erro ao buscar detalhes da viagem', code: 'FETCH_RIDE_FAILED' });
  }
});

/**
 * PUT /api/rides/:id - Atualizar viagem
 * R4.1: Apenas owner ou admin
 * R4.2: Transição de status respeitar máquina
 * R4.3: departure_time deve ser futuro
 * R4.4: available_seats entre 1-15
 * R4.5: vehicle_id deve pertenecer ao motorista
 */
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { id } = req.params;
    const data = RideUpdateSchema.parse(req.body);

    // Verificar existência e propriedade
    const rideCheck = await db.query('SELECT driver_id, status, available_seats FROM rides WHERE id = $1', [id]);
    
    if (rideCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Viagem não encontrada', code: 'RIDE_NOT_FOUND' });
    }

    const currentRide = rideCheck.rows[0];

    if (currentRide.driver_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para editar esta viagem', code: 'NOT_OWNER' });
    }

    // Validar transição de status se fornecido
    if (data.status) {
      const currentStatus = currentRide.status;
      const canTransition = RideStateMachine.canTransition(
        currentStatus as any,
        data.status as any,
        // Verificar se há reservas confirmadas (simplificado)
        false // Implementar verificação real quando booking module estiver pronto
      );

      if (!canTransition.valid) {
        return res.status(400).json({
          error: canTransition.reason || `Transição de status inválida: ${currentStatus} → ${data.status}`,
          code: 'INVALID_TRANSITION'
        });
      }
    }

    // Validar departure_time se fornecido
    if (data.departure_time) {
      const departureDate = new Date(data.departure_time);
      if (departureDate <= new Date()) {
        return res.status(400).json({
          error: 'departure_time deve ser uma data/hora futura',
          code: 'DEPARTURE_IN_PAST'
        });
      }
    }

    // Validar available_seats se fornecido
    if (data.available_seats !== undefined) {
      if (data.available_seats < 0 || data.available_seats > currentRide.total_seats) {
        return res.status(400).json({
          error: `available_seats deve ser entre 0 e ${currentRide.total_seats}`,
          code: 'INVALID_SEATS'
        });
      }
    }

    // Verificar veículo se fornecido
    if (data.vehicle_id) {
      const vehicleResult = await db.query(
        'SELECT owner_id FROM vehicles WHERE id = $1 AND is_active = true',
        [data.vehicle_id]
      );
      
      if (vehicleResult.rows.length === 0) {
        return res.status(400).json({ error: 'Veículo não encontrado', code: 'VEHICLE_NOT_FOUND' });
      }
      
      if (vehicleResult.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Veículo não pertence ao usuário', code: 'VEHICLE_NOT_OWNED' });
      }
    }

    // Build dynamic UPDATE
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.origin_city !== undefined) { updates.push(`origin_city = $${paramIndex++}`); values.push(data.origin_city); }
    if (data.destination_city !== undefined) { updates.push(`destination_city = $${paramIndex++}`); values.push(data.destination_city); }
    if (data.origin_exact_point !== undefined) { updates.push(`origin_exact_point = $${paramIndex++}`); values.push(data.origin_exact_point); }
    if (data.destination_exact_point !== undefined) { updates.push(`destination_exact_point = $${paramIndex++}`); values.push(data.destination_exact_point); }
    if (data.departure_time !== undefined) { updates.push(`departure_time = $${paramIndex++}`); values.push(data.departure_time); }
    if (data.estimated_arrival !== undefined) { updates.push(`estimated_arrival = $${paramIndex++}`); values.push(data.estimated_arrival); }
    if (data.duration !== undefined) { updates.push(`duration = $${paramIndex++}`); values.push(data.duration); }
    if (data.price_per_seat !== undefined) { updates.push(`price_per_seat = $${paramIndex++}`); values.push(data.price_per_seat); }
    if (data.total_seats !== undefined) { updates.push(`total_seats = $${paramIndex++}`); values.push(data.total_seats); }
    if (data.available_seats !== undefined) { updates.push(`available_seats = $${paramIndex++}`); values.push(data.available_seats); }
    if (data.status !== undefined) { updates.push(`status = $${paramIndex++}`); values.push(data.status); }
    if (data.description !== undefined) { updates.push(`description = $${paramIndex++}`); values.push(data.description); }
    if (data.baggage_policy !== undefined) { updates.push(`baggage_policy = $${paramIndex++}`); values.push(data.baggage_policy); }
    if (data.luggage_size !== undefined) { updates.push(`luggage_size = $${paramIndex++}`); values.push(data.luggage_size); }
    if (data.frequency !== undefined) { updates.push(`frequency = $${paramIndex++}`); values.push(data.frequency); }
    if (data.booking_mode !== undefined) { updates.push(`booking_mode = $${paramIndex++}`); values.push(data.booking_mode); }
    if (data.instant_booking !== undefined) { updates.push(`instant_booking = $${paramIndex++}`); values.push(data.instant_booking); }
    if (data.waypoints !== undefined) { updates.push(`waypoints = $${paramIndex++}`); values.push(JSON.stringify(data.waypoints)); }
    if (data.vehicle_id !== undefined) { updates.push(`vehicle_id = $${paramIndex++}`); values.push(data.vehicle_id); }
    if (data.currency !== undefined) { updates.push(`currency = $${paramIndex++}`); values.push(data.currency); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar', code: 'NO_FIELDS_TO_UPDATE' });
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    const query = `UPDATE rides SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await db.query(query, values);

    res.json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors.map(e => ({ field: e.path[0], message: e.message }))
      });
    }

    console.error('[RIDES] Error updating ride:', error);
    res.status(500).json({ error: 'Erro ao atualizar viagem', code: 'UPDATE_RIDE_FAILED' });
  }
});

/**
 * DELETE /api/rides/:id - Cancelar viagem (soft delete via status)
 * R3.1: Apenas owner ou admin
 * R3.2: NÃO pode cancelar se houver reservas confirmed
 */
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { id } = req.params;

    // Verificar existência e propriedade
    const rideCheck = await db.query(
      'SELECT driver_id, status FROM rides WHERE id = $1',
      [id]
    );

    if (rideCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Viagem não encontrada', code: 'RIDE_NOT_FOUND' });
    }

    const currentRide = rideCheck.rows[0];

    if (currentRide.driver_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para cancelar esta viagem', code: 'NOT_OWNER' });
    }

    // Verificar se há reservas confirmadas
    const bookingsCheck = await db.query(
      'SELECT COUNT(*) as count FROM bookings WHERE ride_id = $1 AND status = $2',
      [id, 'confirmed']
    );

    const confirmedBookings = parseInt(bookingsCheck.rows[0].count, 10);

    if (confirmedBookings > 0) {
      return res.status(400).json({
        error: `Não é possível cancelar viagem com ${confirmedBookings} passageiros confirmados`,
        code: 'HAS_CONFIRMED_BOOKINGS',
        confirmedBookings
      });
    }

    // Verificar se pode cancelar (status não é completed ou cancelled)
    if (currentRide.status === 'completed' || currentRide.status === 'cancelled') {
      return res.status(400).json({
        error: `Viagem não pode ser cancelada no status "${currentRide.status}"`,
        code: 'INVALID_STATUS_FOR_CANCELLATION'
      });
    }

    // Cancelar (soft delete via status)
    await db.query('UPDATE rides SET status = $1, updated_at = NOW() WHERE id = $2', ['cancelled', id]);

    res.json({ message: 'Viagem cancelada com sucesso' });
  } catch (error) {
    console.error('[RIDES] Error cancelling ride:', error);
    res.status(500).json({ error: 'Erro ao cancelar viagem', code: 'CANCEL_RIDE_FAILED' });
  }
});

/**
 * POST /api/rides/:id/start - Iniciar viagem (scheduled → active)
 */
router.post('/:id/start', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { id } = req.params;

    const rideCheck = await db.query('SELECT driver_id, status FROM rides WHERE id = $1', [id]);

    if (rideCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Viagem não encontrada', code: 'RIDE_NOT_FOUND' });
    }

    const currentRide = rideCheck.rows[0];

    if (currentRide.driver_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para iniciar esta viagem', code: 'NOT_OWNER' });
    }

    if (currentRide.status !== 'scheduled') {
      return res.status(400).json({
        error: `Como a viagem está em status "${currentRide.status}", não é possível iniciá-la. Apenas viagens "scheduled" podem ser iniciadas.`,
        code: 'INVALID_STATUS_FOR_START'
      });
    }

    await db.query(
      'UPDATE rides SET status = $1, updated_at = NOW() WHERE id = $2',
      ['active', id]
    );

    res.json({ message: 'Viagem iniciada com sucesso' });
  } catch (error) {
    console.error('[RIDES] Error starting ride:', error);
    res.status(500).json({ error: 'Erro ao iniciar viagem', code: 'START_RIDE_FAILED' });
  }
});

/**
 * POST /api/rides/:id/complete - Finalizar viagem (active → completed)
 */
router.post('/:id/complete', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { id } = req.params;

    const rideCheck = await db.query('SELECT driver_id, status FROM rides WHERE id = $1', [id]);

    if (rideCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Viagem não encontrada', code: 'RIDE_NOT_FOUND' });
    }

    const currentRide = rideCheck.rows[0];

    if (currentRide.driver_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para finalizar esta viagem', code: 'NOT_OWNER' });
    }

    if (currentRide.status !== 'active') {
      return res.status(400).json({
        error: `Como a viagem está em status "${currentRide.status}", não é possível finalizá-la. Apenas viagens "active" podem ser finalizadas.`,
        code: 'INVALID_STATUS_FOR_COMPLETE'
      });
    }

    await db.query(
      'UPDATE rides SET status = $1, updated_at = NOW() WHERE id = $2',
      ['completed', id]
    );

    res.json({ message: 'Viagem finalizada com sucesso' });
  } catch (error) {
    console.error('[RIDES] Error completing ride:', error);
    res.status(500).json({ error: 'Erro ao finalizar viagem', code: 'COMPLETE_RIDE_FAILED' });
  }
});

export default router;
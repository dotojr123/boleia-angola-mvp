// server/src/routes/alerts.ts - Módulo de Denúncias (WF3 — Fluxo de Denúncia)

import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import db from '../config/db';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { AlertCreateSchema, AlertUpdateSchema, AlertStateMachine, AlertTypeEnum } from '../entities/Alert';
import type { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Tipos
interface AlertWithReporter extends any {
  reporter_name?: string;
  reporter_avatar?: string;
  reported_name?: string;
  reported_avatar?: string;
  ride_origin?: string;
  ride_destination?: string;
}

/**
 * POST /api/alerts - Criar denúncia
 * WF3.1: Usuário reporta outro usuário/viagem
 * WF3.2: Alert criado com status = pending
 * WF3.3: Pode reportar perfil ou viagem específica
 */
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necesaria', code: 'AUTH_REQUIRED' });
    }

    // Validar input
    const { reported_id, ride_id, booking_id, alert_type, description, evidence_url } = AlertCreateSchema.parse(req.body);
    const reporter_id = req.user.id;

    // Verificar que reporter != reported
    if (reported_id === reporter_id) {
      return res.status(400).json({
        error: 'Não pode se denunciar a si próprio',
        code: 'CANT_REPORT_SELF'
      });
    }

    // Verificar se reported_id existe
    const reportedCheck = await db.query('SELECT id FROM profiles WHERE id = $1', [reported_id]);
    if (reportedCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário denunciado não encontrado', code: 'REPORTED_USER_NOT_FOUND' });
    }

    // Se tiver ride_id, verificar que existe
    if (ride_id) {
      const rideCheck = await db.query('SELECT id FROM rides WHERE id = $1', [ride_id]);
      if (rideCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Viagem não encontrada', code: 'RIDE_NOT_FOUND' });
      }
    }

    // Se tiver booking_id, verificar que existe
    if (booking_id) {
      const bookingCheck = await db.query('SELECT id FROM bookings WHERE id = $1', [booking_id]);
      if (bookingCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Reserva não encontrada', code: 'BOOKING_NOT_FOUND' });
      }
    }

    // Criar denúncia com status = pending (WF3.2)
    const result = await db.query(
      `INSERT INTO alerts (
        reporter_id, reported_id, ride_id, booking_id,
        alert_type, description, evidence_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        reporter_id,
        reported_id,
        ride_id || null,
        booking_id || null,
        alert_type,
        description || null,
        evidence_url || null,
        'pending'
      ]
    );

    res.status(201).json({
      ...result.rows[0],
      message: 'Denúncia criada com sucesso. Um admin irá revisar.'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors.map((e: any) => ({ field: e.path[0], message: e.message }))
      });
    }

    console.error('[ALERTS] Error creating alert:', error);
    res.status(500).json({ error: 'Erro ao criar denúncia', code: 'CREATE_ALERT_FAILED' });
  }
});

/**
 * GET /api/alerts/my - Minhas denúncias (feitas por mim)
 */
router.get('/my', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const result = await db.query(
      `SELECT a.*,
              p.full_name as reported_name,
              p.avatar_url as reported_avatar
       FROM alerts a
       JOIN profiles p ON a.reported_id = p.id
       WHERE a.reporter_id = $1
       ORDER BY a.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('[ALERTS] Error fetching my alerts:', error);
    res.status(500).json({ error: 'Erro ao buscar minhas denúncias', code: 'LIST_ALERTS_FAILED' });
  }
});

/**
 * GET /api/alerts/reported/:userId - Denúncias recebidas sobre mim
 */
router.get('/reported/:userId', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { userId } = req.params;

    // Só pode ver denúncias sobre si mesmo
    if (req.user.role !== 'admin' && userId !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para ver estas denúncias', code: 'NOT_ALLOWED' });
    }

    const result = await db.query(
      `SELECT a.*,
              p.full_name as reporter_name,
              p.avatar_url as reporter_avatar,
              r.origin_city,
              r.destination_city
       FROM alerts a
       JOIN profiles p ON a.reporter_id = p.id
       LEFT JOIN rides r ON a.ride_id = r.id
       WHERE a.reported_id = $1
       ORDER BY a.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('[ALERTS] Error fetched reported alerts:', error);
    res.status(500).json({ error: 'Erro ao buscar denúncias', code: 'LIST_ALERTS_FAILED' });
  }
});

/**
 * GET /api/alerts - Listar todas as denúncias (apenas admin)
 */
router.get('/', requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;

    let query = `
      SELECT a.*,
             p1.full_name as reporter_name,
             p1.avatar_url as reporter_avatar,
             p2.full_name as reported_name,
             p2.avatar_url as reported_avatar,
             r.origin_city,
             r.destination_city,
             b.seats_booked
      FROM alerts a
      JOIN profiles p1 ON a.reporter_id = p1.id
      JOIN profiles p2 ON a.reported_id = p2.id
      LEFT JOIN rides r ON a.ride_id = r.id
      LEFT JOIN bookings b ON a.booking_id = b.id
      WHERE 1=1
    `;

    const values: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND a.status = $${paramIndex++}`;
      values.push(status);
    }

    const offset = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
    query += ` ORDER BY a.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    values.push(parseInt(limit as string, 10), offset);

    const result = await db.query(query, values);

    // Count total
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM alerts ${status ? `WHERE status = $1` : ''}`,
      status ? [status] : []
    );

    res.json({
      data: result.rows,
      pagination: {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        total: parseInt(countResult.rows[0].total, 10)
      }
    });
  } catch (error) {
    console.error('[ALERTS] Error listing all alerts:', error);
    res.status(500).json({ error: 'Erro ao listar denúncias', code: 'LIST_ALERTS_FAILED' });
  }
});

/**
 * GET /api/alerts/:id - Detalhes da denúncia (admin ou envolvidos)
 */
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { id } = req.params;

    const result = await db.query(
      `SELECT a.*,
              p1.full_name as reporter_name,
              p1.avatar_url as reporter_avatar,
              p2.full_name as reported_name,
              p2.avatar_url as reported_avatar,
              r.origin_city,
              r.destination_city,
              r.id as ride_id,
              b.seats_booked
       FROM alerts a
       JOIN profiles p1 ON a.reporter_id = p1.id
       JOIN profiles p2 ON a.reported_id = p2.id
       LEFT JOIN rides r ON a.ride_id = r.id
       LEFT JOIN bookings b ON a.booking_id = b.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Denúncia não encontrada', code: 'ALERT_NOT_FOUND' });
    }

    const alert = result.rows[0];

    // Verificar permissão: admin, reporter ou reported
    const canAccess = 
      req.user.role === 'admin' ||
      alert.reporter_id === req.user.id ||
      alert.reported_id === req.user.id;

    if (!canAccess) {
      return res.status(403).json({ error: 'Sem permissão para ver esta denúncia', code: 'NOT_ALLOWED' });
    }

    res.json(alert);
  } catch (error) {
    console.error('[ALERTS] Error fetching alert:', error);
    res.status(500).json({ error: 'Erro ao buscar denúncia', code: 'FETCH_ALERT_FAILED' });
  }
});

/**
 * PATCH /api/alerts/:id/status - Atualizar status (apenas admin)
 * WF3.4: Admin review alert → PATCH /alerts/:id/status
 * WF3.5: Status muda para reviewed → resolved/dismissed
 */
router.patch('/:id/status', requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { id } = req.params;
    const { status, admin_notes, resolution } = z.object({
      status: z.enum(['reviewed', 'resolved', 'dismissed']),
      admin_notes: z.string().max(500).optional().nullable(),
      resolution: z.string().max(200).optional().nullable()
    }).parse(req.body);

    // Verificar denúncia existe
    const alertCheck = await db.query('SELECT status, reported_id FROM alerts WHERE id = $1', [id]);
    if (alertCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Denúncia não encontrada', code: 'ALERT_NOT_FOUND' });
    }

    const currentStatus = alertCheck.rows[0].status;

    // Validar transição
    const canTransition = AlertStateMachine.canTransition(currentStatus, status);
    if (!canTransition.valid) {
      return res.status(400).json({
        error: canTransition.reason || 'Transição inválida',
        code: 'INVALID_TRANSITION'
      });
    }

    // Construir UPDATE
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    updates.push(`status = $${paramIndex++}`);
    values.push(status);

    if (admin_notes !== undefined) {
      updates.push(`admin_notes = $${paramIndex++}`);
      values.push(admin_notes);
    }

    if (resolution !== undefined) {
      updates.push(`resolution = $${paramIndex++}`);
      values.push(resolution);
    }

    if (status === 'reviewed') {
      updates.push(`reviewed_at = NOW()`);
    }

    if (status === 'resolved' || status === 'dismissed') {
      updates.push(`resolved_at = NOW()`);
    }

    // Se status for "resolved" e for denúncia还的性质，绑架用户到 admin 操作
    if (status === 'resolved') {
      // Opcional: aplicar sanction (ban, warn, etc.)
      // Isso pode ser expandido no futuro
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `UPDATE alerts SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await db.query(query, values);

    res.json({
      ...result.rows[0],
      message: `Denúncia atualizada para "${status}"`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors.map((e: any) => ({ field: e.path[0], message: e.message }))
      });
    }

    console.error('[ALERTS] Error updating alert status:', error);
    res.status(500).json({ error: 'Erro ao atualizar denúncia', code: 'UPDATE_ALERT_FAILED' });
  }
});

/**
 * PATCH /api/alerts/:id - Atualizar campos administrativos
 */
router.patch('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { id } = req.params;
    const { admin_notes, resolution, alert_type } = AlertUpdateSchema.parse(req.body);

    // Verificar denúncia
    const alertCheck = await db.query('SELECT id FROM alerts WHERE id = $1', [id]);
    if (alertCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Denúncia não encontrada', code: 'ALERT_NOT_FOUND' });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (admin_notes !== undefined) { updates.push(`admin_notes = $${paramIndex++}`); values.push(admin_notes); }
    if (resolution !== undefined) { updates.push(`resolution = $${paramIndex++}`); values.push(resolution); }
    if (alert_type !== undefined) { updates.push(`alert_type = $${paramIndex++}`); values.push(alert_type); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar', code: 'NO_FIELDS_TO_UPDATE' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `UPDATE alerts SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await db.query(query, values);

    res.json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors.map((e: any) => ({ field: e.path[0], message: e.message }))
      });
    }

    console.error('[ALERTS] Error updating alert:', error);
    res.status(500).json({ error: 'Erro ao atualizar denúncia', code: 'UPDATE_ALERT_FAILED' });
  }
});

export default router;
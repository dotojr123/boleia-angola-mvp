// server/src/routes/admin.ts - Módulo Administrativo Centralizado (TypeScript estrito)

import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import db from '../config/db';
import { requireAdmin } from '../middleware/auth';
import { NotificationTypeEnum } from '../routes/notifications';
import type { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Middleware para todas rotas
router.use(requireAdmin);

// Schemas
const StatsSchema = z.object({
  period: z.enum(['today', 'week', 'month', 'all']).default('all'),
  group_by: z.enum(['day', 'week', 'month']).optional()
});

const UsersSearchParams = z.object({
  search: z.string().optional(),
  role: z.enum(['passenger', 'driver', 'admin']).optional(),
  verification_status: z.enum(['none', 'pending', 'verified', 'rejected']).optional(),
  page: z.string().regex(/^\d+$/).default('1'),
  limit: z.string().regex(/^\d+/).max('100').default('20')
});

const BanUserSchema = z.object({
  reason: z.string().min(10).max(1000),
  ban_until: z.string().datetime().optional() // undefined = permanent
});

// ==================== DASHBOARD & STATISTICS ====================

/**
 * GET /api/admin/stats/dashboard - Estatísticas gerais do sistema
 */
router.get('/stats/dashboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Contagens totais
    const [
      usersCount,
      driversCount,
      passengersCount,
      ridesCount,
      completedRidesCount,
      activeRidesCount,
      pendingRidesCount,
      bookingsCount,
      confirmedBookingsCount,
      avgRating,
      pendingAlertsCount,
      pendingDocsCount
    ] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM profiles WHERE verification_status != \'none\''),
      db.query("SELECT COUNT(*) as count FROM profiles WHERE role = 'driver' AND verification_status = 'verified'"),
      db.query("SELECT COUNT(*) as count FROM profiles WHERE role = 'passenger'"),
      db.query('SELECT COUNT(*) as count FROM rides'),
      db.query("SELECT COUNT(*) as count FROM rides WHERE status = 'completed'"),
      db.query("SELECT COUNT(*) as count FROM rides WHERE status IN ('scheduled', 'active')"),
      db.query("SELECT COUNT(*) as count FROM rides WHERE status = 'scheduled'"),
      db.query('SELECT COUNT(*) as count FROM bookings'),
      db.query("SELECT COUNT(*) as count FROM bookings WHERE status = 'confirmed'"),
      db.query('SELECT ROUND(AVG(rating), 2) as avg_rating FROM profiles WHERE rating IS NOT NULL'),
      db.query("SELECT COUNT(*) as count FROM alerts WHERE status = 'pending'"),
      db.query("SELECT COUNT(*) as count FROM user_documents WHERE status = 'pending'")
    ]);

    // Receita total (se tiver transações)
    const revenue = await db.query(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM transactions 
      WHERE status = 'completed'
    `);

    // Viagens por último mês
    const ridesLastMonth = await db.query(`
      SELECT COUNT(*) as count FROM rides 
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);

    res.json({
      users: {
        total: parseInt(usersCount.rows[0].count, 10),
        drivers: parseInt(driversCount.rows[0].count, 10),
        passengers: parseInt(passengersCount.rows[0].count, 10)
      },
      rides: {
        total: parseInt(ridesCount.rows[0].count, 10),
        completed: parseInt(completedRidesCount.rows[0].count, 10),
        active: parseInt(activeRidesCount.rows[0].count, 10),
        scheduled: parseInt(pendingRidesCount.rows[0].count, 10),
        last_30_days: parseInt(ridesLastMonth.rows[0].count, 10)
      },
      bookings: {
        total: parseInt(bookingsCount.rows[0].count, 10),
        confirmed: parseInt(confirmedBookingsCount.rows[0].count, 10)
      },
      ratings: {
        average: parseFloat(avgRating.rows[0].avg_rating) || 0,
        count: parseInt(usersCount.rows[0].count, 10)
      },
      moderation: {
        pending_alerts: parseInt(pendingAlertsCount.rows[0].count, 10),
        pending_documents: parseInt(pendingDocsCount.rows[0].count, 10)
      },
      revenue: {
        total: parseFloat(revenue.rows[0].total) || 0,
        currency: 'Kz'
      }
    });
  } catch (error) {
    console.error('[ADMIN] Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas', code: 'STATS_FAILED' });
  }
});

/**
 * GET /api/admin/stats/rides - Estatísticas de viagens
 */
router.get('/stats/rides', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { period = 'all' } = StatsSchema.parse(req.query);

    let dateFilter = '';
    if (period === 'today') {
      dateFilter = "AND created_at >= DATE_TRUNC('day', NOW())";
    } else if (period === 'week') {
      dateFilter = "AND created_at >= NOW() - INTERVAL '7 days'";
    } else if (period === 'month') {
      dateFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
    }

    const byStatus = await db.query(`
      SELECT status, COUNT(*) as count 
      FROM rides 
      WHERE 1=1 ${dateFilter}
      GROUP BY status
    `);

    const byCity = await db.query(`
      SELECT origin_city, COUNT(*) as origin_count,
             destination_city, COUNT(*) as dest_count
      FROM rides 
      WHERE 1=1 ${dateFilter}
      GROUP BY origin_city, destination_city
      ORDER BY origin_count DESC
      LIMIT 10
    `);

    const byDay = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM rides
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    res.json({
      by_status: byStatus.rows,
      top_routes: byCity.rows,
      trend_last_30_days: byDay.rows
    });
  } catch (error) {
    console.error('[ADMIN] Error fetching ride stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas de viagens', code: 'RIDE_STATS_FAILED' });
  }
});

// ==================== USER MANAGEMENT ====================

/**
 * GET /api/admin/users - Listar usuários com busca e filtros
 */
router.get('/users', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { search, role, verification_status, page = '1', limit = '20' } = UsersSearchParams.parse(req.query);

    let query = `
      SELECT p.*,
             (SELECT COUNT(*) FROM rides WHERE driver_id = p.id) as rides_count,
             (SELECT COUNT(*) FROM bookings WHERE passenger_id = p.id) as bookings_count,
             (SELECT AVG(rating) FROM reviews WHERE reviewee_id = p.id) as avg_review_rating
      FROM profiles p
      WHERE 1=1
    `;

    const values: any[] = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (p.full_name ILIKE $${paramIndex} OR p.email ILIKE $${paramIndex} OR p.phone = $${paramIndex})`;
      values.push(`%${search}%`);
    }

    if (role) {
      query += ` AND p.role = $${paramIndex++}`;
      values.push(role);
    }

    if (verification_status) {
      query += ` AND p.verification_status = $${paramIndex++}`;
      values.push(verification_status);
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    values.push(parseInt(limit, 10), offset);

    const result = await db.query(query, values);

    // Total count
    let countQuery = `SELECT COUNT(*) as total FROM profiles WHERE 1=1`;
    const countValues: any[] = [];
    let countParam = 1;

    if (search) {
      countQuery += ` AND (full_name ILIKE $${countParam++} OR email ILIKE $${countParam} OR phone = $${countParam})`;
      countValues.push(`%${search}%`);
    }

    if (role) {
      countQuery += ` AND role = $${countParam++}`;
      countValues.push(role);
    }

    if (verification_status) {
      countQuery += ` AND verification_status = $${countParam++}`;
      countValues.push(verification_status);
    }

    const countResult = await db.query(countQuery, countValues);

    res.json({
      data: result.rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: parseInt(countResult.rows[0].total, 10)
      }
    });
  } catch (error) {
    console.error('[ADMIN] Error listing users:', error);
    res.status(500).json({ error: 'Erro ao listar usuários', code: 'LIST_USERS_FAILED' });
  }
});

/**
 * GET /api/admin/users/:id - Detalhes completos de um usuário
 */
router.get('/users/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await db.query(
      `SELECT p.*,
              (SELECT COUNT(*) FROM rides WHERE driver_id = p.id) as rides_count,
              (SELECT COUNT(*) FROM bookings WHERE passenger_id = p.id) as bookings_count,
              (SELECT COUNT(*) FROM alerts WHERE reporter_id = p.id) as alerts_sent,
              (SELECT COUNT(*) FROM alerts WHERE reported_id = p.id) as alerts_received,
              (SELECT COUNT(*) FROM user_documents WHERE user_id = p.id AND status = 'pending') as pending_docs
       FROM profiles p
       WHERE p.id = $1`,
      [id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Últimas atividades
    const recentRides = await db.query(
      'SELECT * FROM rides WHERE driver_id = $1 ORDER BY created_at DESC LIMIT 5',
      [id]
    );

    const recentBookings = await db.query(
      'SELECT * FROM bookings WHERE passenger_id = $1 ORDER BY created_at DESC LIMIT 5',
      [id]
    );

    const recentAlerts = await db.query(
      'SELECT a.*, p.full_name as reported_name FROM alerts a JOIN profiles p ON a.reported_id = p.id WHERE a.reporter_id = $1 ORDER BY a.created_at DESC LIMIT 5',
      [id]
    );

    res.json({
      ...user.rows[0],
      recent_rides: recentRides.rows,
      recent_bookings: recentBookings.rows,
      recent_alerts: recentAlerts.rows
    });
  } catch (error) {
    console.error('[ADMIN] Error fetching user details:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário', code: 'FETCH_USER_FAILED' });
  }
});

/**
 * PATCH /api/admin/users/:id/verification - Aprovar/rejeitar verificação de usuário
 */
router.patch('/users/:id/verification', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { verification_status, notes } = z.object({
      verification_status: z.enum(['verified', 'rejected']),
      notes: z.string().max(500).optional().nullable()
    }).parse(req.body);

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    updates.push(`verification_status = $${paramIndex++}`);
    values.push(verification_status);
    updates.push(`updated_at = NOW()`);
    values.push(verification_status);

    // Se aprovado, atender email/phone verificados
    if (verification_status === 'verified') {
      updates.push(`email_verified = true, phone_verified = true, id_verified = true`);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `UPDATE profiles SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Criar notificação
    const notificationMsg = verification_status === 'verified'
      ? 'Sua conta foi verificada com sucesso! Você pode agora usar todas as funcionalidades de motorista.'
      : 'Sua verificação foi rejeitada. Por favor, revise os documentos e tente novamente.';

    await db.query(
      `INSERT INTO notifications (user_id, title, content, type)
       VALUES ($1, $2, $3, $4)`,
      [id, verification_status === 'verified' ? 'Detecção confirmada' : 'Detecção rejeitada', notificationMsg, 'info']
    );

    res.json({
      ...result.rows[0],
      message: `Perfil atualizado para "${verification_status}"`
    });
  } catch (error) {
    console.error('[ADMIN] Error updating verification:', error);
    res.status(500).json({ error: 'Erro ao atualizar verificação', code: 'UPDATE_VERIFICATION_FAILED' });
  }
});

/**
 * POST /api/admin/users/:id/ban - Banir usuário
 */
router.post('/users/:id/ban', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason, ban_until } = BanUserSchema.parse(req.body);

    // Verificar se usuário existe
    const userCheck = await db.query('SELECT id, role FROM profiles WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Não pode banir admin
    if (userCheck.rows[0].role === 'admin') {
      return res.status(400).json({ error: 'Não é possível banir admins' });
    }

    // Soft ban: alterar role para 'banned'
    await db.query(
      `UPDATE profiles 
       SET verification_status = 'rejected', role = 'banned' ${ban_until ? `, ban_until = $${2}` : ''}
       WHERE id = $${ban_until ? 3 : 2}`,
      ban_until ? [reason, ban_until, id] : [id] // Corrigir: adicionei índice
    );

    // Cancurar reservas ativas
    await db.query(
      `UPDATE bookings SET status = 'cancelled' 
       WHERE passenger_id = $1 AND status IN ('pending', 'confirmed')`,
      [id]
    );

    // Criar notificação
    const msg = ban_until
      ? `Sua conta foi suspensa até ${new Date(ban_until).toLocaleString()}. Razão: ${reason}`
      : `Sua conta foi banida permanentemente. Razão: ${reason}`;

    await db.query(
      `INSERT INTO notifications (user_id, title, content, type)
       VALUES ($1, $2, $3, $4)`,
      [id, 'Conta suspensa', msg, 'error']
    );

    res.json({ message: 'Usuário banido com sucesso' });
  } catch (error) {
    console.error('[ADMIN] Error banning user:', error);
    res.status(500).json({ error: 'Erro ao banir usuário', code: 'BAN_USER_FAILED' });
  }
});

/**
 * DELETE /api/admin/users/:id - Remover usuário (com cascateamento)
 */
router.delete('/users/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const userCheck = await db.query('SELECT role FROM profiles WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (userCheck.rows[0].role === 'admin') {
      return res.status(400).json({ error: 'Não é possível deletar admins' });
    }

    // Soft delete
    await db.query(
      `UPDATE profiles 
       SET verification_status = 'none', role = 'deleted', updated_at = NOW()
       WHERE id = $1`,
      [id]
    );

    res.json({ message: 'Usuário removido com sucesso' });
  } catch (error) {
    console.error('[ADMIN] Error deleting user:', error);
    res.status(500).json({ error: 'Erro ao remover usuário', code: 'DELETE_USER_FAILED' });
  }
});

// ==================== CONTENT MODERATION ====================

/**
 * GET /api/admin/alerts - Listar denuncas pendentes
 */
router.get('/alerts', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status = 'pending' } = req.query;

    const result = await db.query(
      `SELECT a.*,
              p1.full_name as reporter_name,
              p2.full_name as reported_name,
              r.origin_city,
              r.destination_city
       FROM alerts a
       JOIN profiles p1 ON a.reporter_id = p1.id
       JOIN profiles p2 ON a.reported_id = p2.id
       LEFT JOIN rides r ON a.ride_id = r.id
       WHERE a.status = $1
       ORDER BY a.created_at DESC`,
      [status]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('[ADMIN] Error listing alerts:', error);
    res.status(500).json({ error: 'Erro ao listar denúncias', code: 'LIST_ALERTS_FAILED' });
  }
});

/**
 * PATCH /api/admin/alerts/:id/resolve - Resolver denúncia
 */
router.patch('/alerts/:id/resolve', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { resolution, action_taken } = z.object({
      resolution: z.string().max(200),
      action_taken: z.enum(['none', 'warning', 'ban', 'removed_content']).optional()
    }).parse(req.body);

    const query = `
      UPDATE alerts 
      SET status = $1, resolution = $2, admin_notes = $3 ${action_taken ? ', updated_at = NOW()' : ''}
      WHERE id = $4
      RETURNING *
    `;

    const result = await db.query(query, ['resolved', resolution, action_taken ? `Acão: ${action_taken}` : null, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Denúncia não encontrada' });
    }

    // Se acão for ban, banir usuário
    if (action_taken === 'ban') {
      await db.query(
        `UPDATE profiles SET verification_status = 'rejected', role = 'banned' 
         WHERE id = $1`,
        [result.rows[0].reported_id]
      );
    }

    res.json({
      ...result.rows[0],
      message: 'Denúncia resolvida'
    });
  } catch (error) {
    console.error('[ADMIN] Error resolving alert:', error);
    res.status(500).json({ error: 'Erro ao resolver denúncia', code: 'RESOLVE_ALERT_FAILED' });
  }
});

// ==================== DOCUMENTS MODERATION ====================

/**
 * GET /api/admin/documents - Listar documentos pendentes
 */
router.get('/documents', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await db.query(
      `SELECT d.*, p.full_name as user_name, p.email
       FROM user_documents d
       JOIN profiles p ON d.user_id = p.id
       WHERE d.status = 'pending'
       ORDER BY d.created_at ASC`,
      []
    );

    res.json(result.rows);
  } catch (error) {
    console.error('[ADMIN] Error listing documents:', error);
    res.status(500).json({ error: 'Erro ao listar documentos', code: 'LIST_DOCUMENTS_FAILED' });
  }
});

/**
 * POST /api/admin/documents/:id/approve - Aprovar documento
 */
router.post('/documents/:id/approve', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { notes } = z.object({
      notes: z.string().max(500).optional().nullable()
    }).parse(req.body);

    const doc = await db.query('SELECT user_id, document_type FROM user_documents WHERE id = $1', [id]);
    if (doc.rows.length === 0) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }

    // Update documento
    await db.query(
      `UPDATE user_documents SET status = 'approved', reviewed_at = NOW(), review_notes = $1 WHERE id = $2`,
      [notes || null, id]
    );

    // Update perfil
    await db.query(
      `UPDATE profiles SET verification_status = 'verified', updated_at = NOW() WHERE id = $1`,
      [doc.rows[0].user_id]
    );

    // Notificar
    await db.query(
      `INSERT INTO notifications (user_id, title, content, type)
       VALUES ($1, $2, $3, $4)`,
      [doc.rows[0].user_id, 'Documento aprovado', `Seu documento (${doc.rows[0].document_type}) foi aprovado.`, 'info']
    );

    res.json({ message: 'Documento aprovado com sucesso' });
  } catch (error) {
    console.error('[ADMIN] Error approving document:', error);
    res.status(500).json({ error: 'Erro ao aprovar documento', code: 'APPROVE_DOCUMENT_FAILED' });
  }
});

/**
 * POST /api/admin/documents/:id/reject - Rejeitar documento
 */
router.post('/documents/:id/reject', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = z.object({
      reason: z.string().min(10).max(500)
    }).parse(req.body);

    const doc = await db.query('SELECT user_id, document_type FROM user_documents WHERE id = $1', [id]);
    if (doc.rows.length === 0) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }

    await db.query(
      `UPDATE user_documents SET status = 'rejected', reviewed_at = NOW(), review_notes = $1 WHERE id = $2`,
      [reason, id]
    );

    await db.query(
      `UPDATE profiles SET verification_status = 'pending', updated_at = NOW() WHERE id = $1`,
      [doc.rows[0].user_id]
    );

    await db.query(
      `INSERT INTO notifications (user_id, title, content, type)
       VALUES ($1, $2, $3, $4)`,
      [doc.rows[0].user_id, 'Documento rejeitado', `Seu documento (${doc.rows[0].document_type}) foi rejeitado: ${reason}`, 'warning']
    );

    res.json({ message: 'Documento rejeitado' });
  } catch (error) {
    console.error('[ADMIN] Error rejecting document:', error);
    res.status(500).json({ error: 'Erro ao rejeitar documento', code: 'REJECT_DOCUMENT_FAILED' });
  }
});

export default router;
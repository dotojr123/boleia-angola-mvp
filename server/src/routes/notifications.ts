// server/src/routes/notifications.ts - Módulo de Notificações (TypeScript estrito)

import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import db from '../config/db';
import { requireAuth } from '../middleware/auth';
import type { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Enums e schemas
export const NotificationTypeEnum = z.enum([
  'info',
  'warning',
  'error',
  'booking_confirmed',
  'booking_cancelled',
  'ride_scheduled',
  'ride_completed',
  'review_received',
  'alert_created',
  'alert_resolved',
  'driver_approved',
  'driver_rejected',
  'payment_received',
  'payment_sent'
]);

const NotificationCreateSchema = z.object({
  user_id: z.string().uuid('ID do usuário inválido'),
  title: z.string().min(5, 'Título muito curto').max(100, 'Título muito longo'),
  content: z.string().min(10, 'Conteúdo muito curto').max(1000, 'Conteúdo muito longo'),
  type: NotificationTypeEnum.default('info'),
  link: z.string().url().nullable().optional(),
  data: z.record(z.any()).optional().default({})
});

// Obs: user_id será preenchido automaticamente para user não-admin
const NotificationListSchema = z.object({
  type: NotificationTypeEnum.optional(),
  is_read: z.boolean().optional(),
  page: z.string().regex(/^\d+$/).default('1'),
  limit: z.string().regex(/^\d+$/).max('100').default('20')
});

/**
 * POST /api/notifications - Criar notificação (apenas admin ou sistema)
 * Padrão: user_id vem do admin, pode ser enviado em massa
 */
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    // Só admin pode criar notificações para outros usuários
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Only admins can create notifications',
        code: 'INSUFFICIENT_ROLE'
      });
    }

    const { user_id, title, content, type, link, data } = NotificationCreateSchema.parse(req.body);

    // Verificar se usuário existe
    const userCheck = await db.query('SELECT id FROM profiles WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado', code: 'USER_NOT_FOUND' });
    }

    const result = await db.query(
      `INSERT INTO notifications (user_id, title, content, type, link, data)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, title, content, type || 'info', link || null, JSON.stringify(data || {})]
    );

    res.status(201).json({
      ...result.rows[0],
      message: 'Notificação criada com sucesso'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors.map((e: any) => ({ field: e.path[0], message: e.message }))
      });
    }

    console.error('[NOTIFICATIONS] Error creating notification:', error);
    res.status(500).json({ error: 'Erro ao criar notificação', code: 'CREATE_NOTIFICATION_FAILED' });
  }
});

/**
 * POST /api/notifications/batch - Criar múltiplas notificações (admin apenas)
 */
router.post('/batch', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Only admins can create batch notifications',
        code: 'INSUFFICIENT_ROLE'
      });
    }

    const { notifications } = z.object({
      notifications: z.array(NotificationCreateSchema.minPartial())
    }).parse(req.body);

    if (notifications.length === 0) {
      return res.status(400).json({ error: 'Nenhuma notificação fornecida', code: 'NO_NOTIFICATIONS' });
    }

    if (notifications.length > 100) {
      return res.status(400).json({ error: 'Máximo 100 notificações por lote', code: 'BATCH_TOO_LARGE' });
    }

    const values: any[] = [];
    let paramIndex = 1;
    const queryParts: string[] = [];

    for (const notif of notifications) {
      const { user_id, title, content, type, link, data } = notif;
      queryParts.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
      values.push(user_id, title, content, type || 'info', link || null, JSON.stringify(data || {}));
    }

    const query = `
      INSERT INTO notifications (user_id, title, content, type, link, data)
      VALUES ${queryParts.join(', ')}
      RETURNING *
    `;

    const result = await db.query(query, values);

    res.status(201).json({
      created: result.rows.length,
      notifications: result.rows
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors.map((e: any) => ({ field: e.path[0], message: e.message }))
      });
    }

    console.error('[NOTIFICATIONS] Error creating batch:', error);
    res.status(500).json({ error: 'Erro ao criar notificações em lote', code: 'BATCH_FAILED' });
  }
});

/**
 * GET /api/notifications - Listar notificações do usuário autenticado
 * Suporta paginação, filters por type e is_read
 */
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    // Só admin pode ver todas notificações de todos usuários
    if (req.user.role === 'admin' && req.query.user_id) {
      // Admin precisa fornecer user_id explicitamente
    } else {
      // Usuário comum só vê suas próprias notificações
      delete (req.query as any).user_id;
    }

    const { user_id, type, is_read, page = '1', limit = '20' } = NotificationListSchema.parse(req.query);
    const targetUserId = user_id || req.user.id;

    // Admin verifica permissão para ver notificações de outros
    if (user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para ver notificações de outros', code: 'NOT_ALLOWED' });
    }

    let query = `
      SELECT * FROM notifications
      WHERE user_id = $1
    `;
    const values: any[] = [targetUserId];
    let paramIndex = 2;

    if (type) {
      query += ` AND type = $${paramIndex++}`;
      values.push(type);
    }

    if (is_read !== undefined) {
      query += ` AND is_read = $${paramIndex++}`;
      values.push(is_read);
    }

    const offset = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    values.push(parseInt(limit as string, 10), offset);

    const result = await db.query(query, values);

    // Contar total
    let countQuery = `SELECT COUNT(*) as total FROM notifications WHERE user_id = $1`;
    const countValues: any[] = [targetUserId];
    let countParamIndex = 2;

    if (type) {
      countQuery += ` AND type = $${countParamIndex++}`;
      countValues.push(type);
    }

    if (is_read !== undefined) {
      countQuery += ` AND is_read = $${countParamIndex++}`;
      countValues.push(is_read);
    }

    const countResult = await db.query(countQuery, countValues);

    res.json({
      data: result.rows,
      pagination: {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        total: parseInt(countResult.rows[0].total, 10)
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Parâmetros inválidos',
        details: error.errors.map((e: any) => ({ field: e.path[0], message: e.message }))
      });
    }

    console.error('[NOTIFICATIONS] Error listing notifications:', error);
    res.status(500).json({ error: 'Erro ao listar notificações', code: 'LIST_NOTIFICATIONS_FAILED' });
  }
});

/**
 * GET /api/notifications/unread-count - Contagem de notificações não lidas
 */
router.get('/unread-count', requireAuth, async (req: AuthenticatedRequest, res: Response, next: Function) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const result = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );

    res.json({
      count: parseInt(result.rows[0].count, 10)
    });
  } catch (error) {
    console.error('[NOTIFICATIONS] Error counting unread:', error);
    res.status(500).json({ error: 'Erro ao contar notificações não lidas', code: 'COUNT_FAILED' });
  }
});

/**
 * GET /api/notifications/:id - Detalhes de uma notificação
 */
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { id } = req.params;

    const result = await db.query('SELECT * FROM notifications WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notificação não encontrada', code: 'NOTIFICATION_NOT_FOUND' });
    }

    const notification = result.rows[0];

    // Verificar permissão
    if (notification.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para ver esta notificação', code: 'NOT_ALLOWED' });
    }

    res.json(notification);
  } catch (error) {
    console.error('[NOTIFICATIONS] Error fetching notification:', error);
    res.status(500).json({ error: 'Erro ao buscar notificação', code: 'FETCH_NOTIFICATION_FAILED' });
  }
});

/**
 * PATCH /api/notifications/:id/mark-as-read - Marcar como lida
 */
router.patch('/:id/mark-as-read', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { id } = req.params;

    const result = await db.query(
      `UPDATE notifications 
       SET is_read = true, updated_at = NOW() 
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notificação não encontrada', code: 'NOTIFICATION_NOT_FOUND' });
    }

    res.json({
      ...result.rows[0],
      message: 'Notificação marcada como lida'
    });
  } catch (error) {
    console.error('[NOTIFICATIONS] Error marking as read:', error);
    res.status(500).json({ error: 'Erro ao marcar como lida', code: 'MARK_READ_FAILED' });
  }
});

/**
 * PATCH /api/notifications/read-all - Marcar todas como lidas
 */
router.patch('/read-all', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { type } = z.object({
      type: NotificationTypeEnum.optional()
    }).parse(req.body);

    let query = 'UPDATE notifications SET is_read = true, updated_at = NOW() WHERE user_id = $1';
    const values: any[] = [req.user.id];
    let paramIndex = 2;

    if (type) {
      query += ` AND type = $${paramIndex++}`;
      values.push(type);
    }

    const result = await db.query(query, values);

    res.json({
      marked: result.rowCount,
      message: `${result.rowCount} notificações marcadas como lidas`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Parâmetros inválidos',
        details: error.errors.map((e: any) => ({ field: e.path[0], message: e.message }))
      });
    }

    console.error('[NOTIFICATIONS] Error marking all as read:', error);
    res.status(500).json({ error: 'Erro ao marcar todas como lidas', code: 'MARK_ALL_FAILED' });
  }
});

/**
 * DELETE /api/notifications/:id - Remover notificação
 */
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notificação não encontrada', code: 'NOTIFICATION_NOT_FOUND' });
    }

    res.json({ message: 'Notificação removida com sucesso' });
  } catch (error) {
    console.error('[NOTIFICATIONS] Error deleting notification:', error);
    res.status(500).json({ error: 'Erro ao remover notificação', code: 'DELETE_NOTIFICATION_FAILED' });
  }
});

/**
 * DELETE /api/notifications/clear-all - Limpar todas as notificações (opcionalmente por type)
 */
router.delete('/clear-all', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { type } = z.object({
      type: NotificationTypeEnum.optional()
    }).parse(req.query);

    let query = 'DELETE FROM notifications WHERE user_id = $1';
    const values: any[] = [req.user.id];
    let paramIndex = 2;

    if (type) {
      query += ` AND type = $${paramIndex++}`;
      values.push(type);
    }

    const result = await db.query(query, values);

    res.json({
      deleted: result.rowCount,
      message: `${result.rowCount} notificações removidas`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Parâmetros inválidos',
        details: error.errors.map((e: any) => ({ field: e.path[0], message: e.message }))
      });
    }

    console.error('[NOTIFICATIONS] Error clearing all:', error);
    res.status(500).json({ error: 'Erro ao limpar notificações', code: 'CLEAR_ALL_FAILED' });
  }
});

export default router;
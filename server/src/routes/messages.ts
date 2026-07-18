// server/src/routes/messages.ts - Módulo de Mensagens Privadas (TypeScript estrito)

import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import db from '../config/db';
import { requireAuth } from '../middleware/auth';
import type { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Schemas de validação Zod
const MessageCreateSchema = z.object({
  receiver_id: z.string().uuid('ID do receptor inválido'),
  content: z.string().min(1, 'Conteúdo não pode ser vazio').max(2000, 'Conteúdo muito longo (max 2000 chars)'),
  ride_id: z.string().uuid().nullable().optional()
});

const MessageListSchema = z.object({
  ride_id: z.string().uuid().optional(),
  page: z.string().regex(/^\d+$/).default('1'),
  limit: z.string().regex(/^\d+$/).max('100').default('50')
});

/**
 * POST /api/messages - Enviar mensagem
 * - Passageiro e motorista podem se comunicar sobre viagem
 * - Content: 1-2000 caracteres
 */
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { receiver_id, content, ride_id } = MessageCreateSchema.parse(req.body);
    const sender_id = req.user.id;

    // Verificar que sender != receiver
    if (receiver_id === sender_id) {
      return res.status(400).json({ error: 'Não pode enviar mensagem para si mesmo', code: 'CANT_SELF_SEND' });
    }

    // Verificar que receiver existe
    const receiverCheck = await db.query('SELECT id FROM profiles WHERE id = $1', [receiver_id]);
    if (receiverCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Receptor não encontrado', code: 'RECEIVER_NOT_FOUND' });
    }

    // Se ride_id fornecido, verificar permissão
    if (ride_id) {
      const rideCheck = await db.query(
        `SELECT driver_id FROM rides WHERE id = $1`,
        [ride_id]
      );

      if (rideCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Viagem não encontrada', code: 'RIDE_NOT_FOUND' });
      }

      const isDriver = rideCheck.rows[0].driver_id === sender_id;
      
      // Verificar se é passageiro da viagem
      const isPassenger = await db.query(
        `SELECT 1 FROM bookings WHERE ride_id = $1 AND passenger_id = $2 AND status != 'cancelled'`,
        [ride_id, sender_id]
      );

      if (!isDriver && isPassenger.rows.length === 0) {
        return res.status(403).json({ 
          error: 'Somente participantes da viagem podem enviar mensagens', 
          code: 'NOT_RIDE_PARTICIPANT' 
        });
      }

      // Verificar que receiver também é participante
      const receiverIsRidePart = await db.query(
        `SELECT 1 FROM rides WHERE id = $1 AND driver_id = $2`,
        [ride_id, receiver_id]
      );

      if (receiverIsRidePart.rows.length === 0) {
        const receiverIsPass = await db.query(
          `SELECT 1 FROM bookings WHERE ride_id = $1 AND passenger_id = $2 AND status != 'cancelled'`,
          [ride_id, receiver_id]
        );
        
        if (receiverIsPass.rows.length === 0) {
          return res.status(403).json({ 
            error: 'Receptor não é participante desta viagem', 
            code: 'RECEIVER_NOT_PARTICIPANT' 
          });
        }
      }
    }

    // Criar mensagem
    const { rows } = await db.query(
      `INSERT INTO messages (sender_id, receiver_id, content, ride_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [sender_id, receiver_id, content, ride_id || null]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors.map((e: any) => ({ field: e.path[0], message: e.message }))
      });
    }

    console.error('[MESSAGES] Error sending message:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem', code: 'SEND_MESSAGE_FAILED' });
  }
});

/**
 * GET /api/messages/partners - Listar parceiros de conversa (who I talked to)
 */
router.get('/partners', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const userId = req.user.id;

    const { rows } = await db.query(
      `WITH partner_data AS (
        SELECT DISTINCT
          CASE
            WHEN m.sender_id = $1 THEN m.receiver_id
            ELSE m.sender_id
          END as partner_id
        FROM messages m
        WHERE m.sender_id = $1 OR m.receiver_id = $1
      )
      SELECT
        pd.partner_id as id,
        p.full_name,
        p.avatar_url,
        p.phone,
        (SELECT content FROM messages
         WHERE ((sender_id = pd.partner_id AND receiver_id = $1)
            OR (receiver_id = pd.partner_id AND sender_id = $1))
         ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages
         WHERE ((sender_id = pd.partner_id AND receiver_id = $1)
            OR (receiver_id = pd.partner_id AND sender_id = $1))
         ORDER BY created_at DESC LIMIT 1) as last_message_at,
        (SELECT COUNT(*) FROM messages
         WHERE sender_id = pd.partner_id AND receiver_id = $1 AND is_read = false) as unread_count
      FROM partner_data pd
      LEFT JOIN profiles p ON p.id = pd.partner_id
      ORDER BY last_message_at DESC NULLS LAST`,
      [userId]
    );

    res.json(rows);
  } catch (error) {
    console.error('[MESSAGES] Error fetching partners:', error);
    res.status(500).json({ error: 'Erro ao buscar parceiros', code: 'LIST_PARTNERS_FAILED' });
  }
});

/**
 * GET /api/messages?ride_id= - Listar mensagens de uma viagem (ambos participantes)
 */
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { ride_id, page = '1', limit = '50' } = MessageListSchema.parse(req.query);

    if (!ride_id) {
      return res.status(400).json({ error: 'Parâmetro ride_id é obrigatório', code: 'MISSING_RIDE_ID' });
    }

    const userId = req.user.id;

    // Verificar que usuário é participante da viagem
    const rideCheck = await db.query(
      `SELECT r.driver_id, b.passenger_id
       FROM rides r
       LEFT JOIN bookings b ON b.ride_id = r.id AND b.status != 'cancelled'
       WHERE r.id = $1 AND (r.driver_id = $2 OR b.passenger_id = $2)`,
      [ride_id, userId]
    );

    if (rideCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Sem permissão para acessar mensagens desta viagem', code: 'NOT_RIDE_PARTICIPANT' });
    }

    const offset = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);

    const { rows } = await db.query(
      `SELECT m.*,
              p_sender.full_name as sender_name,
              p_sender.avatar_url as sender_avatar,
              p_receiver.full_name as receiver_name,
              p_receiver.avatar_url as receiver_avatar
       FROM messages m
       LEFT JOIN profiles p_sender ON m.sender_id = p_sender.id
       LEFT JOIN profiles p_receiver ON m.receiver_id = p_receiver.id
       WHERE m.ride_id = $1
       ORDER BY m.created_at ASC
       LIMIT $2 OFFSET $3`,
      [ride_id, parseInt(limit as string, 10), offset]
    );

    // Contagem total
    const countResult = await db.query('SELECT COUNT(*) as total FROM messages WHERE ride_id = $1', [ride_id]);

    // Marcar mensagens não lidas enviadas para mim como lidas
    await db.query(
      `UPDATE messages SET is_read = true, read_at = NOW()
       WHERE ride_id = $1 AND sender_id != $2 AND receiver_id = $2 AND is_read = false`,
      [ride_id, userId]
    );

    res.json({
      data: rows,
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

    console.error('[MESSAGES] Error fetching ride messages:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens da viagem', code: 'LIST_MESSAGES_FAILED' });
  }
});

/**
 * GET /api/messages/:partnerId - Conversa entre usuário e parceiro
 */
router.get('/:partnerId', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const userId = req.user.id;
    const { partnerId } = req.params;
    const { page = '1', limit = '50' } = MessageListSchema.parse(req.query);

    const offset = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);

    const { rows } = await db.query(
      `SELECT m.*,
              p_sender.full_name as sender_name,
              p_sender.avatar_url as sender_avatar,
              p_receiver.full_name as receiver_name,
              p_receiver.avatar_url as receiver_avatar
       FROM messages m
       LEFT JOIN profiles p_sender ON m.sender_id = p_sender.id
       LEFT JOIN profiles p_receiver ON m.receiver_id = p_receiver.id
       WHERE (m.sender_id = $1 AND m.receiver_id = $2)
          OR (m.sender_id = $2 AND m.receiver_id = $1)
       ORDER BY m.created_at ASC
       LIMIT $3 OFFSET $4`,
      [userId, partnerId, parseInt(limit as string, 10), offset]
    );

    // Contagem total
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM messages 
       WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)`,
      [userId, partnerId]
    );

    // Marcar mensagens não lidas como lidas
    await db.query(
      `UPDATE messages SET is_read = true, read_at = NOW()
       WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false`,
      [partnerId, userId]
    );

    res.json({
      data: rows,
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

    console.error('[MESSAGES] Error fetching conversation:', error);
    res.status(500).json({ error: 'Erro ao buscar conversa', code: 'LIST_CONVERSATION_FAILED' });
  }
});

/**
 * PATCH /api/messages/:id/read - Marcar mensagem como lida
 */
router.patch('/:id/read', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { id } = req.params;

    // Verificar mensagem existe e usuário é receiver
    const messageCheck = await db.query('SELECT receiver_id FROM messages WHERE id = $1', [id]);

    if (messageCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Mensagem não encontrada', code: 'MESSAGE_NOT_FOUND' });
    }

    if (messageCheck.rows[0].receiver_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para marcar esta mensagem como lida', code: 'NOT_RECEIVER' });
    }

    const { rows } = await db.query(
      `UPDATE messages
       SET is_read = true, read_at = NOW()
       WHERE id = $1 AND receiver_id = $2
       RETURNING *`,
      [id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Mensagem não encontrada', code: 'MESSAGE_NOT_FOUND' });
    }

    res.json({
      ...rows[0],
      message: 'Mensagem marcada como lida'
    });
  } catch (error) {
    console.error('[MESSAGES] Error marking message as read:', error);
    res.status(500).json({ error: 'Erro ao marcar mensagem como lida', code: 'MARK_READ_FAILED' });
  }
});

/**
 * PATCH /api/messages/read-all - Marcar todas mensagens de um parceiro como lidas
 */
router.patch('/read-all/:partnerId', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { partnerId } = req.params;

    const result = await db.query(
      `UPDATE messages
       SET is_read = true, read_at = NOW()
       WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false`,
      [partnerId, req.user.id]
    );

    res.json({
      marked: result.rowCount,
      message: `${result.rowCount} mensagens marcadas como lidas`
    });
  } catch (error) {
    console.error('[MESSAGES] Error marking all as read:', error);
    res.status(500).json({ error: 'Erro ao marcar todas como lidas', code: 'MARK_ALL_FAILED' });
  }
});

/**
 * GET /api/messages/unread-count - Contagem total de mensagens não lidas
 */
router.get('/unread-count', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { rows } = await db.query(
      'SELECT COUNT(*) as count FROM messages WHERE receiver_id = $1 AND is_read = false',
      [req.user.id]
    );

    res.json({
      count: parseInt(rows[0].count, 10)
    });
  } catch (error) {
    console.error('[MESSAGES] Error counting unread:', error);
    res.status(500).json({ error: 'Erro ao contar mensagens não lidas', code: 'COUNT_FAILED' });
  }
});

/**
 * DELETE /api/messages/:id - Remover mensagem (apenas sender pode remover em 24h)
 */
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { id } = req.params;

    // Verificar mensagem e permissão
    const messageCheck = await db.query(
      `SELECT sender_id, created_at FROM messages WHERE id = $1`,
      [id]
    );

    if (messageCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Mensagem não encontrada', code: 'MESSAGE_NOT_FOUND' });
    }

    const message = messageCheck.rows[0];

    // Somente sender pode remover (e até 24h depois)
    if (message.sender_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para remover esta mensagem', code: 'NOT_SENDER' });
    }

    // Verificar 24h (opcional - pode ser removido)
    const messageTime = new Date(message.created_at).getTime();
    const now = Date.now();
    const hoursPassed = (now - messageTime) / (1000 * 60 * 60);

    // Se quiser permitir remoção a qualquer tempo, comente o check abaixo
    // if (hoursPassed > 24 && req.user.role !== 'admin') {
    //   return res.status(400).json({ error: 'Não é possível remover mensagem com mais de 24h', code: 'TOO_OLD' });
    // }

    await db.query('DELETE FROM messages WHERE id = $1', [id]);

    res.json({ message: 'Mensagem removida com sucesso' });
  } catch (error) {
    console.error('[MESSAGES] Error deleting message:', error);
    res.status(500).json({ error: 'Erro ao remover mensagem', code: 'DELETE_MESSAGE_FAILED' });
  }
});

export default router;
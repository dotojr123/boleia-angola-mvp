const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/messages?ride_id= - Listar mensagens de uma viagem
router.get('/', auth, async (req, res) => {
  const { ride_id } = req.query;

  if (!ride_id) {
    return res.status(400).json({ error: 'Parâmetro ride_id é obrigatório' });
  }

  try {
    const userId = req.user.id;

    // Verify user is part of the ride (either as driver or passenger)
    const rideCheck = await db.query(
      `SELECT r.*, b.passenger_id
       FROM rides r
       LEFT JOIN bookings b ON b.ride_id = r.id AND b.status != 'cancelled'
       WHERE r.id = $1 AND (r.driver_id = $2 OR b.passenger_id = $2)`,
      [ride_id, userId]
    );

    if (rideCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Sem permissão para acessar mensagens desta viagem' });
    }

    const { rows } = await db.query(
      `SELECT m.*,
        p_sender.full_name as sender_name,
        p_sender.avatar_url as sender_avatar_url,
        p_receiver.full_name as receiver_name
       FROM messages m
       LEFT JOIN profiles p_sender ON m.sender_id = p_sender.id
       LEFT JOIN profiles p_receiver ON m.receiver_id = p_receiver.id
       WHERE m.ride_id = $1
       ORDER BY m.created_at ASC`,
      [ride_id]
    );

    // Mark messages as read
    await db.query(
      `UPDATE messages SET is_read = true, read_at = NOW()
       WHERE ride_id = $1 AND sender_id != $2 AND is_read = false`,
      [ride_id, userId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching ride messages:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens da viagem' });
  }
});

// GET /api/messages/partners - Listar parceiros de conversa do usuário
router.get('/partners', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get distinct partners (users that current user exchanged messages with)
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
        (SELECT COUNT(*) FROM messages
         WHERE sender_id = pd.partner_id AND receiver_id = $1 AND is_read = false) as unread_count
      FROM partner_data pd
      LEFT JOIN profiles p ON p.id = pd.partner_id
      ORDER BY last_message DESC`,
      [userId]
    );

    res.json(rows || []);
  } catch (error) {
    console.error('Error fetching partners:', error);
    res.status(500).json({ error: 'Erro ao buscar parceiros' });
  }
});

// GET /api/messages/:receiverId - Get messages between current user and another user
router.get('/:receiverId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { receiverId } = req.params;

    const { rows } = await db.query(
      `SELECT m.*,
        p_sender.full_name as sender_name,
        p_sender.avatar_url as sender_avatar_url,
        p_receiver.full_name as receiver_name
       FROM messages m
       LEFT JOIN profiles p_sender ON m.sender_id = p_sender.id
       LEFT JOIN profiles p_receiver ON m.receiver_id = p_receiver.id
       WHERE (m.sender_id = $1 AND m.receiver_id = $2)
          OR (m.sender_id = $2 AND m.receiver_id = $1)
       ORDER BY m.created_at ASC`,
      [userId, receiverId]
    );

    // Mark messages as read
    await db.query(
      `UPDATE messages SET is_read = true, read_at = NOW()
       WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false`,
      [receiverId, userId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

// POST /api/messages - Enviar nova mensagem
router.post('/', auth, async (req, res) => {
  const { receiver_id, content, ride_id } = req.body;
  const sender_id = req.user.id;

  if (!receiver_id || !content) {
    return res.status(400).json({ error: 'receiver_id e content são obrigatórios' });
  }

  try {
    // If ride_id is provided, verify user is part of the ride
    if (ride_id) {
      const rideCheck = await db.query(
        `SELECT 1 FROM rides WHERE id = $1 AND driver_id = $2`,
        [ride_id, sender_id]
      );

      if (rideCheck.rows.length === 0) {
        // Check if user is a passenger in the ride
        const passengerCheck = await db.query(
          `SELECT 1 FROM bookings WHERE ride_id = $1 AND passenger_id = $2 AND status != 'cancelled'`,
          [ride_id, sender_id]
        );

        if (passengerCheck.rows.length === 0) {
          return res.status(403).json({ error: 'Sem permissão para enviar mensagem nesta viagem' });
        }
      }
    }

    const { rows } = await db.query(
      `INSERT INTO messages (sender_id, receiver_id, content, ride_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [sender_id, receiver_id, content, ride_id || null]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

// PATCH /api/messages/:id/read - Marcar mensagem como lida
router.patch('/:id/read', auth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Verify message exists and user is the receiver
    const messageCheck = await db.query(
      `SELECT receiver_id FROM messages WHERE id = $1`,
      [id]
    );

    if (messageCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }

    if (messageCheck.rows[0].receiver_id !== userId) {
      return res.status(403).json({ error: 'Sem permissão para marcar esta mensagem como lida' });
    }

    const { rows } = await db.query(
      `UPDATE messages
       SET is_read = true, read_at = NOW()
       WHERE id = $1 AND receiver_id = $2
       RETURNING *`,
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }

    res.json({ message: 'Mensagem marcada como lida', message: rows[0] });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Erro ao marcar mensagem como lida' });
  }
});

module.exports = router;

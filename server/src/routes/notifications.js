const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// List my notifications
router.get('/', auth, async (req, res) => {
    try {
        const query = `
            SELECT * FROM notifications 
            WHERE user_id = $1 
            ORDER BY created_at DESC 
            LIMIT 50
        `;
        const { rows } = await db.query(query, [req.user.id]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar notificações' });
    }
});

// Mark as read
router.put('/:id/read', auth, async (req, res) => {
    try {
        await db.query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        res.json({ message: 'Notificação marcada como lida' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar notificação' });
    }
});

module.exports = router;

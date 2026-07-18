const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const db = require('../config/db');
const auth = require('../middleware/auth');

// Configure multer storage
const upload = multer({
    dest: path.join(process.cwd(), 'public', 'uploads')
});

// PUT /api/profiles/me – update profile info and avatar
router.put('/me', auth, upload.single('avatar'), async (req, res) => {
    const userId = req.user.id;
    const { full_name, phone } = req.body;
    const allowedUpdates = {};
    if (full_name) allowedUpdates.full_name = full_name;
    if (phone) allowedUpdates.phone = phone;
    if (req.file) {
        // Store relative URL
        allowedUpdates.avatar_url = `/uploads/${req.file.filename}`;
    }

    if (Object.keys(allowedUpdates).length === 0) {
        return res.status(400).json({ error: 'Nothing to update' });
    }

    const setClauses = Object.keys(allowedUpdates).map((k, idx) => `${k} = $${idx + 1}`);
    const values = Object.values(allowedUpdates);
    values.push(userId);
    const query = `UPDATE profiles SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING id, full_name, email, phone, avatar_url, verification_status`;

    try {
        const { rows } = await db.query(query, values);
        res.json({ message: 'Profile updated', profile: rows[0] });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

module.exports = router;

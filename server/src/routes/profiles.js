const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/profiles - Listar perfis (público)
router.get('/', async (req, res) => {
  try {
    const { role, verification_status, limit = 100, offset = 0 } = req.query;

    let query = 'SELECT * FROM profiles WHERE 1=1';
    const params = [];

    if (role) {
      params.push(role);
      query += ` AND role = $${params.length}`;
    }

    if (verification_status) {
      params.push(verification_status);
      query += ` AND verification_status = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    const { rows } = await db.query(query, [...params, parseInt(limit), parseInt(offset)]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar perfis' });
  }
});

// GET /api/profiles/me - Perfil do usuário autenticado (alias para /my)
router.get('/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('GET /profiles/me - User ID:', userId); // Debug log
    const { rows } = await db.query(
      'SELECT * FROM profiles WHERE id = $1',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('GET /profiles/me error:', error.message, error.stack);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

// GET /api/profiles/my - Perfil do usuário autenticado
router.get('/my', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { rows } = await db.query(
      'SELECT * FROM profiles WHERE id = $1',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

// GET /api/profiles/:id - Perfil por ID (público)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'SELECT id, full_name, email, phone, avatar_url, verification_status, rating, experience_level, travel_preferences, role, created_at, bio, location, gender FROM profiles WHERE id = $1',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

// PUT /api/profiles/:id - Atualizar perfil
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      full_name,
      phone,
      bio,
      gender,
      birthdate,
      avatar_url,
      location,
      experience_level,
      role
    } = req.body;

    // Security check: only own profile or admin
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Não autorizado a editar este perfil' });
    }

    // Validate phone if provided (Angola format: +244XXXXXXXXX or 9XXXXXXXXX)
        if (phone) {
          const cleanPhone = phone.replace(/[\s.-]/g, '');
          // Allow two formats:
          // 1. +244 followed by 9 digits (e.g. +24493456789)
          // 2. 9 followed by 8 digits (e.g. 923456789)
          const phoneRegex = /^(\+244[0-9]{9}|9[0-9]{8})$/;
          if (!phoneRegex.test(cleanPhone)) {
            return res.status(400).json({ error: 'Telefone inválido. Formato esperado: +2449XXXXXXXXX ou 9XXXXXXXXX' });
          }
        }

    const query = `
      UPDATE profiles
      SET
        first_name = COALESCE($2, first_name),
        last_name = COALESCE($3, last_name),
        full_name = COALESCE($4, full_name),
        phone = COALESCE($5, phone),
        bio = COALESCE($6, bio),
        gender = COALESCE($7, gender),
        birthdate = COALESCE($8, birthdate),
        avatar_url = COALESCE($9, avatar_url),
        location = COALESCE($10, location),
        experience_level = COALESCE($11, experience_level),
        role = COALESCE($12, role),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const { rows } = await db.query(query, [
      id,
      first_name || null,
      last_name || null,
      full_name || null,
      phone || null,
      bio || null,
      gender || null,
      birthdate || null,
      avatar_url || null,
      location || null,
      experience_level || null,
      role || null
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

// PATCH /api/profiles/me - Atualizar perfil do usuário autenticado
router.patch('/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Allowed fields for update (match profiles table schema)
    const allowedFields = [
      'first_name', 'last_name', 'full_name', 'phone', 'bio',
      'avatar_url', 'gender', 'birthdate', 'experience_level',
      'travel_preferences', 'location', 'display_name',
      'phone_verified', 'email_verified'
    ];

    const setClauses = [];
    const values = [userId];
    let paramIndex = 2;

    for (const [field, value] of Object.entries(updates)) {
      if (allowedFields.includes(field) && value !== undefined) {
        // JSONB fields need special handling
        if (field === 'travel_preferences' && typeof value === 'object') {
          setClauses.push(`${field} = $${paramIndex}::jsonb`);
          values.push(JSON.stringify(value));
        } else if (field === 'phone_verified' || field === 'email_verified') {
          setClauses.push(`${field} = $${paramIndex}::boolean`);
          values.push(value);
        } else {
          setClauses.push(`${field} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
    }

    setClauses.push('updated_at = NOW()');

    const query = `
      UPDATE profiles
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const { rows } = await db.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

// DELETE /api/profiles/:id - Remover perfil (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Security check: only own profile or admin
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Não autorizado a remover este perfil' });
    }

    // Check if user has active bookings or rides
    const activeBookings = await db.query(
      "SELECT COUNT(*) FROM bookings WHERE passenger_id = $1 AND status IN ('pending', 'confirmed')",
      [id]
    );

    if (parseInt(activeBookings.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Não é possível remover perfil com reservas ativas'
      });
    }

    // Soft delete
    const { rows } = await db.query(
      "UPDATE profiles SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *",
      [id]
    );

    res.json({ message: 'Perfil removido com sucesso', profile: rows[0] });
  } catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).json({ error: 'Erro ao remover perfil' });
  }
});

module.exports = router;

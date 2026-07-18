const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// Middleware para garantir que é ADMIN
const adminAuth = (req, res, next) => {
  if (req.user.role?.toUpperCase() !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso negado. É necessário papel de administrador.' });
  }
  next();
};

// GET /api/admin/stats - Estatísticas globais do app
router.get('/stats', auth, adminAuth, async (req, res) => {
  try {
    const usersResult = await db.query('SELECT COUNT(*) as count FROM profiles');
    const ridesResult = await db.query('SELECT COUNT(*) as count FROM rides');
    const bookingsResult = await db.query("SELECT COUNT(*) as count FROM bookings WHERE status = 'confirmed'");
    const revenueResult = await db.query("SELECT SUM(total_price) as total FROM bookings WHERE status = 'confirmed'");
    const pendingBookingsResult = await db.query("SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'");
    const activeRidesResult = await db.query("SELECT COUNT(*) as count FROM rides WHERE status = 'scheduled'");
    const driversResult = await db.query("SELECT COUNT(*) as count FROM profiles WHERE role = 'driver'");
    const vehiclesResult = await db.query('SELECT COUNT(*) as count FROM vehicles WHERE is_active = true');

    res.json({
      total_users: parseInt(usersResult.rows[0].count),
      total_rides: parseInt(ridesResult.rows[0].count),
      total_bookings: parseInt(bookingsResult.rows[0].count),
      total_revenue: parseFloat(revenueResult.rows[0].total || 0),
      pending_bookings: parseInt(pendingBookingsResult.rows[0].count),
      active_rides: parseInt(activeRidesResult.rows[0].count),
      total_drivers: parseInt(driversResult.rows[0].count),
      total_vehicles: parseInt(vehiclesResult.rows[0].count)
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// GET /api/admin/users - Listar todos usuários
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const { search, role, verification_status, limit = 100, offset = 0 } = req.query;

    let query = `
    SELECT p.*,
    COUNT(DISTINCT r.id) as total_rides,
    COUNT(DISTINCT b.id) as total_bookings
    FROM profiles p
    LEFT JOIN rides r ON p.id = r.driver_id
    LEFT JOIN bookings b ON p.id = b.passenger_id
    WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (p.full_name ILIKE $${paramIndex} OR p.email ILIKE $${paramIndex})`;
      paramIndex++;
    }

    if (role) {
      params.push(role);
      query += ` AND p.role = $${paramIndex}`;
      paramIndex++;
    }

    if (verification_status) {
      params.push(verification_status);
      query += ` AND p.verification_status = $${paramIndex}`;
      paramIndex++;
    }

    query += ` GROUP BY p.id`;
    query += ` ORDER BY p.created_at DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    const { rows } = await db.query(query, [...params, parseInt(limit), parseInt(offset)]);
    const countResult = await db.query(`SELECT COUNT(*) as count FROM profiles`);

    res.json({
      users: rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (err) {
    console.error('Error listing users:', err);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

// GET /api/admin/rides - Todas viagens
router.get('/rides', auth, adminAuth, async (req, res) => {
  try {
    const { status, driver_id, limit = 100, offset = 0 } = req.query;

    let query = `
    SELECT r.*,
    p_driver.full_name as driver_name,
    p_driver.avatar_url as driver_avatar,
    p_driver.phone as driver_phone,
    v.make as vehicle_make,
    v.model as vehicle_model,
    v.color as vehicle_color
    FROM rides r
    LEFT JOIN profiles p_driver ON r.driver_id = p_driver.id
    LEFT JOIN vehicles v ON r.vehicle_id = v.id
    WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (status) {
      params.push(status);
      query += ` AND r.status = $${paramIndex}`;
      paramIndex++;
    }

    if (driver_id) {
      params.push(driver_id);
      query += ` AND r.driver_id = $${paramIndex}`;
      paramIndex++;
    }

    query += ` ORDER BY r.departure_time DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    const { rows } = await db.query(query, [...params, parseInt(limit), parseInt(offset)]);
    const countResult = await db.query('SELECT COUNT(*) as count FROM rides');

    res.json({
      rides: rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (err) {
    console.error('Error listing rides:', err);
    res.status(500).json({ error: 'Erro ao listar viagens' });
  }
});

// GET /api/admin/bookings - Todas reservas
router.get('/bookings', auth, adminAuth, async (req, res) => {
  try {
    const { status, limit = 100, offset = 0 } = req.query;

    let query = `\n    SELECT b.*,\n    p_passenger.full_name as passenger_name,\n    p_driver.full_name as driver_name,\n    r.origin_city as origin, r.destination_city as destination, r.departure_time\n    FROM bookings b\n    JOIN rides r ON b.ride_id = r.id\n    JOIN profiles p_passenger ON b.passenger_id = p_passenger.id\n    JOIN profiles p_driver ON r.driver_id = p_driver.id\n    WHERE 1=1\n    `;

    const params = [];
    let paramIndex = 1;

    if (status) {
      params.push(status);
      query += ` AND b.status = $${paramIndex}`;
      paramIndex++;
    }

    query += ` ORDER BY b.created_at DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    const { rows } = await db.query(query, [...params, parseInt(limit), parseInt(offset)]);
    const countResult = await db.query('SELECT COUNT(*) as count FROM bookings');

    res.json({
      bookings: rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (err) {
    console.error('Error listing bookings:', err);
    res.status(500).json({ error: 'Erro ao listar reservas' });
  }
});

// PATCH /api/admin/users/:id/role - Alterar papel do usuário
router.patch('/users/:id/role', auth, adminAuth, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const validRoles = ['passenger', 'driver', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: `Papel inválido. Use um dos seguintes: ${validRoles.join(', ')}` });
  }

  try {
    // Verify user exists
    const userCheck = await db.query('SELECT id, role FROM profiles WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const oldRole = userCheck.rows[0].role;

    const { rows } = await db.query(
      `UPDATE profiles SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [role, id]
    );

    res.json({
      message: `Papel de usuário alterado de '${oldRole}' para '${role}'`,
      user: rows[0]
    });
  } catch (err) {
    console.error('Error updating user role:', err);
    res.status(500).json({ error: 'Erro ao alterar papel do usuário' });
  }
});

// PATCH /api/admin/users/:id/verify - Verificar usuário
router.patch('/users/:id/verify', auth, adminAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'verified', 'rejected'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status inválido. Use um dos seguintes: ${validStatuses.join(', ')}` });
  }

  try {
    // Verify user exists
    const userCheck = await db.query('SELECT id, verification_status FROM profiles WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const oldStatus = userCheck.rows[0].verification_status;
    const newStatus = status || 'verified';

    const { rows } = await db.query(
      `UPDATE profiles SET verification_status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [newStatus, id]
    );

    res.json({
      message: `Verificação de usuário alterada de '${oldStatus}' para '${newStatus}'`,
      user: rows[0]
    });
  } catch (err) {
    console.error('Error verifying user:', err);
    res.status(500).json({ error: 'Erro ao verificar usuário' });
  }
});

// GET /api/admin/verifications - Perfis aguardando verificação
router.get('/verifications', auth, adminAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM profiles
      WHERE verification_status IN ('pending', 'rejected')
      ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching verifications:', err);
    res.status(500).json({ error: 'Erro ao buscar verificações' });
  }
});

// PATCH /api/admin/profiles/:id/verify - Aprovar/Recusar verificação (legado)
router.patch('/profiles/:id/verify', auth, adminAuth, async (req, res) => {
  const { status } = req.body;

  try {
    const { rows } = await db.query(
      'UPDATE profiles SET verification_status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    res.json({ message: 'Status atualizado', user: rows[0] });
  } catch (err) {
    console.error('Error updating verification:', err);
    res.status(500).json({ error: 'Erro ao atualizar verificação' });
  }
});

// DELETE /api/admin/users/:id - Remover usuário
router.delete('/users/:id', auth, adminAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const userCheck = await db.query('SELECT id, role FROM profiles WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    await db.query('UPDATE profiles SET is_active = false WHERE id = $1', [id]);

    res.json({ message: 'Usuário removido com sucesso' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Erro ao remover usuário' });
  }
});

// GET /api/admin/reviews - Todas avaliações
router.get('/reviews', auth, adminAuth, async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;

    const query = `
    SELECT r.*,
    p_reviewer.full_name as reviewer_name,
    p_reviewee.full_name as reviewee_name
    FROM reviews r
    JOIN profiles p_reviewer ON r.reviewer_id = p_reviewer.id
    JOIN profiles p_reviewee ON r.reviewee_id = p_reviewee.id
    ORDER BY r.created_at DESC
    LIMIT $1 OFFSET $2
    `;

    const { rows } = await db.query(query, [parseInt(limit), parseInt(offset)]);
    const countResult = await db.query('SELECT COUNT(*) as count FROM reviews');

    res.json({
      reviews: rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (err) {
    console.error('Error listing reviews:', err);
    res.status(500).json({ error: 'Erro ao listar avaliações' });
  }
});

module.exports = router;

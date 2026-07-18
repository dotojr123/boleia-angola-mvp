const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/vehicles - List user vehicles
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM vehicles WHERE owner_id = $1 AND is_active = true',
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar veículos' });
  }
});

// GET /api/vehicles/:id - Detalhes do veículo
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await db.query(
      `SELECT v.*,
              p.full_name as owner_name,
              p.avatar_url as owner_avatar,
              p.phone as owner_phone,
              p.email as owner_email
       FROM vehicles v
       LEFT JOIN profiles p ON v.owner_id = p.id
       WHERE v.id = $1 AND v.is_active = true`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    const vehicle = rows[0];

    // Authorization: owner or admin can see details
    if (vehicle.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para ver este veículo' });
    }

    // Fetch photos
    const photosResult = await db.query(
      'SELECT * FROM vehicle_photos WHERE vehicle_id = $1 ORDER BY is_primary DESC, created_at ASC',
      [id]
    );

    res.json({
      ...vehicle,
      photos: photosResult.rows
    });
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    res.status(500).json({ error: 'Erro ao buscar detalhes do veículo' });
  }
});

// POST /api/vehicles - Add a vehicle
router.post('/', auth, async (req, res) => {
  // Only drivers and admins can add vehicles
  if (req.user.role !== 'driver' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Apenas motoristas podem adicionar veículos' });
  }

  const { make, model, year, color, plate, seats_capacity, category, comfort_level } = req.body;

  if (!make || !model) {
    return res.status(400).json({ error: 'Make e model são obrigatórios' });
  }

  try {
    const query = `
      INSERT INTO vehicles (owner_id, make, model, year, color, plate, seats_capacity, category, comfort_level)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const { rows } = await db.query(query, [
      req.user.id,
      make,
      model,
      year || null,
      color || null,
      plate || null,
      seats_capacity || 4,
      category || 'economy',
      comfort_level || 'standard'
    ]);

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ error: 'Erro ao cadastrar veículo' });
  }
});

// PUT /api/vehicles/:id - Atualizar veículo
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { make, model, year, color, plate, seats_capacity, category, comfort_level } = req.body;

  try {
    // Verify ownership
    const vehicleCheck = await db.query(
      'SELECT owner_id FROM vehicles WHERE id = $1',
      [id]
    );

    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    if (vehicleCheck.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para editar este veículo' });
    }

    const query = `
      UPDATE vehicles
      SET make = COALESCE($2, make),
          model = COALESCE($3, model),
          year = COALESCE($4, year),
          color = COALESCE($5, color),
          plate = COALESCE($6, plate),
          seats_capacity = COALESCE($7, seats_capacity),
          category = COALESCE($8, category),
          comfort_level = COALESCE($9, comfort_level),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const { rows } = await db.query(query, [
      id,
      make || null,
      model || null,
      year || null,
      color || null,
      plate || null,
      seats_capacity || null,
      category || null,
      comfort_level || null
    ]);

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ error: 'Erro ao atualizar veículo' });
  }
});

// DELETE /:id - Remove vehicle (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const vehicleCheck = await db.query(
      'SELECT owner_id FROM vehicles WHERE id = $1',
      [id]
    );

    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    if (vehicleCheck.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para remover este veículo' });
    }

    await db.query(
      'UPDATE vehicles SET is_active = false WHERE id = $1',
      [id]
    );

    res.json({ message: 'Veículo removido com sucesso' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ error: 'Erro ao remover veículo' });
  }
});

// POST /api/vehicles/:id/photos - Upload de fotos
router.post('/:id/photos', auth, async (req, res) => {
  const { id } = req.params;
  const { photo_url, is_primary } = req.body;

  try {
    // Verify ownership
    const vehicleCheck = await db.query(
      'SELECT owner_id FROM vehicles WHERE id = $1 AND is_active = true',
      [id]
    );

    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    if (vehicleCheck.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para adicionar fotos a este veículo' });
    }

    if (!photo_url) {
      return res.status(400).json({ error: 'photo_url é obrigatório' });
    }

    // If is_primary is true, unset other primary photos
    if (is_primary) {
      await db.query(
        'UPDATE vehicle_photos SET is_primary = false WHERE vehicle_id = $1',
        [id]
      );
    }

    const { rows } = await db.query(
      `INSERT INTO vehicle_photos (vehicle_id, photo_url, is_primary)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, photo_url, is_primary || false]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Erro ao fazer upload da foto' });
  }
});

// GET /api/vehicles/:id/photos - List photos
router.get('/:id/photos', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify vehicle exists and user has access
    const vehicleCheck = await db.query(
      'SELECT owner_id FROM vehicles WHERE id = $1 AND is_active = true',
      [id]
    );

    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    if (vehicleCheck.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para ver fotos deste veículo' });
    }

    const { rows } = await db.query(
      'SELECT * FROM vehicle_photos WHERE vehicle_id = $1 ORDER BY is_primary DESC, created_at ASC',
      [id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Erro ao buscar fotos' });
  }
});

module.exports = router;

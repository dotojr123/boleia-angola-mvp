const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

/**
 * POST /api/alerts - Criar alerta de viagem
 * - Passageiro define critérios de busca
 * - Sistema notifica quando houver match
 */
router.post('/', auth, async (req, res) => {
  const startTime = Date.now();
  const {
    origin,
    destination,
    travel_date
  } = req.body;

  try {
    const user_id = req.user.id;

    // Validação básica
    if (!origin || !destination || !travel_date) {
      return res.status(400).json({ error: 'Origem, destino e data são obrigatórios' });
    }

    const query = `
      INSERT INTO ride_alerts (
        passenger_id,
        origin,
        destination,
        travel_date
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const { rows } = await db.query(query, [
      user_id,
      origin,
      destination,
      travel_date
    ]);

    const duration = Date.now() - startTime;
    console.log(`[ALERTS] Alerta criado: ${rows[0].id}, tempo: ${duration}ms`);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[ALERTS] Erro ao criar alerta:', err);
    res.status(500).json({ error: 'Erro ao criar alerta' });
  }
});

/**
 * GET /api/alerts - Listar alertas do usuário
 */
router.get('/', auth, async (req, res) => {
  const startTime = Date.now();
  const user_id = req.user.id;

  try {
    const { rows } = await db.query(
      'SELECT * FROM ride_alerts WHERE passenger_id = $1 ORDER BY created_at DESC',
      [user_id]
    );

    const duration = Date.now() - startTime;
    console.log(`[ALERTS] Busca: ${rows.length} alertas, tempo: ${duration}ms`);

    res.json(rows);
  } catch (err) {
    console.error('[ALERTS] Erro na busca:', err);
    res.status(500).json({ error: 'Erro ao buscar alertas' });
  }
});

/**
 * PATCH /api/alerts/:id - Atualizar alerta
 */
router.patch('/:id', auth, async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;
  const {
    origin,
    destination,
    travel_date,
    is_active
  } = req.body;

  try {
    const user_id = req.user.id;

    // Verify ownership
    const alertCheck = await db.query(
      'SELECT passenger_id FROM ride_alerts WHERE id = $1',
      [id]
    );

    if (alertCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Alerta não encontrado' });
    }

    if (alertCheck.rows[0].passenger_id !== user_id) {
      return res.status(403).json({ error: 'Sem permissão para editar este alerta' });
    }

    // Build dynamic update
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (origin !== undefined) { updates.push(`origin = $${paramIndex++}`); values.push(origin); }
    if (destination !== undefined) { updates.push(`destination = $${paramIndex++}`); values.push(destination); }
    if (travel_date !== undefined) { updates.push(`travel_date = $${paramIndex++}`); values.push(travel_date); }
    if (is_active !== undefined) { updates.push(`is_active = $${paramIndex++}`); values.push(is_active); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE ride_alerts SET
        ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const { rows } = await db.query(query, values);

    const duration = Date.now() - startTime;
    console.log(`[ALERTS] Alerta atualizado: ${id}, tempo: ${duration}ms`);

    res.json(rows[0]);
  } catch (err) {
    console.error('[ALERTS] Erro ao atualizar alerta:', err);
    res.status(500).json({ error: 'Erro ao atualizar alerta' });
  }
});

/**
 * DELETE /api/alerts/:id - Deletar alerta
 */
router.delete('/:id', auth, async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;

  try {
    const user_id = req.user.id;

    // Verify ownership
    const alertCheck = await db.query(
      'SELECT user_id FROM ride_alerts WHERE id = $1',
      [id]
    );

    if (alertCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Alerta não encontrado' });
    }

    if (alertCheck.rows[0].user_id !== user_id) {
      return res.status(403).json({ error: 'Sem permissão para deletar este alerta' });
    }

    await db.query('DELETE FROM ride_alerts WHERE id = $1', [id]);

    const duration = Date.now() - startTime;
    console.log(`[ALERTS] Alerta deletado: ${id}, tempo: ${duration}ms`);

    res.json({ message: 'Alerta removido com sucesso' });
  } catch (err) {
    console.error('[ALERTS] Erro ao deletar alerta:', err);
    res.status(500).json({ error: 'Erro ao deletar alerta' });
  }
});

module.exports = router;
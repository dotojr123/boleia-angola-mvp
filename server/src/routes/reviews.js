const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// POST /api/reviews - Submit a review
router.post('/', auth, async (req, res) => {
  const { booking_id, reviewee_id, rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'A avaliação deve ser entre 1 e 5' });
  }
  if (!booking_id || !reviewee_id) {
    return res.status(400).json({ error: 'booking_id e reviewee_id são obrigatórios' });
  }

  try {
    // Check if review already exists
    const existingReview = await db.query(
      'SELECT id FROM reviews WHERE booking_id = $1 AND reviewer_id = $2',
      [booking_id, req.user.id]
    );
    if (existingReview.rows.length > 0) {
      return res.status(400).json({ error: 'Você já avaliou esta reserva' });
    }

    const { rows } = await db.query(
      `INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [booking_id, req.user.id, reviewee_id, rating, comment || null]
    );

    // Update reviewee's rating
    await db.query(
      `UPDATE profiles SET rating = ROUND(((COALESCE(rating, 0) * COALESCE(reviews_count, 0)) + $1) / (COALESCE(reviews_count, 0) + 1)::numeric, 2),
              reviews_count = COALESCE(reviews_count, 0) + 1
       WHERE id = $2`,
      [rating, reviewee_id]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Erro ao criar avaliação' });
  }
});

// GET /api/reviews/user/:userId - Get reviews for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT r.*, p.full_name as reviewer_name
       FROM reviews r
       JOIN profiles p ON r.reviewer_id = p.id
       WHERE r.reviewee_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.userId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Erro ao buscar avaliações' });
  }
});

// GET /api/reviews/ride/:rideId - Get reviews for a ride
router.get('/booking/:bookingId', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT r.*, p.full_name as reviewer_name
       FROM reviews r
       JOIN profiles p ON r.reviewer_id = p.id
       WHERE r.booking_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.bookingId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching ride reviews:', error);
    res.status(500).json({ error: 'Erro ao buscar avaliações' });
  }
});

// GET /api/reviews/my - Get reviews about me
router.get('/my', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT r.*, p.full_name as reviewer_name
       FROM reviews r
       JOIN profiles p ON r.reviewer_id = $1
       WHERE r.reviewee_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Erro ao buscar avaliações' });
  }
});

// GET /api/reviews/user/:userId/average - Get average rating for a user
router.get('/user/:userId/average', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT 
        ROUND(AVG(r.rating), 2) as average,
        COUNT(*) as count
       FROM reviews r
       WHERE r.reviewee_id = $1`,
      [req.params.userId]
    );
    res.json(rows[0] || { average: 0, count: 0 });
  } catch (error) {
    console.error('Error fetching average rating:', error);
    res.status(500).json({ error: 'Erro ao buscar média de avaliação' });
  }
});

// PUT /api/reviews/:id - Update a review
router.put('/:id', auth, async (req, res) => {
  const { rating, comment } = req.body;

  try {
    const existing = await db.query('SELECT * FROM reviews WHERE id = $1 AND reviewer_id = $2', [req.params.id, req.user.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }

    const { rows } = await db.query(
      `UPDATE reviews SET rating = COALESCE($1, rating), comment = COALESCE($2, comment)
       WHERE id = $3 AND reviewer_id = $4
       RETURNING *`,
      [rating, comment, req.params.id, req.user.id]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Erro ao atualizar avaliação' });
  }
});

// DELETE /api/reviews/:id - Delete a review
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM reviews WHERE id = $1 AND reviewer_id = $2 RETURNING *', [req.params.id, req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }
    res.json({ message: 'Avaliação removida' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Erro ao remover avaliação' });
  }
});

module.exports = router;

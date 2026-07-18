// server/src/routes/reviews.ts - Módulo de Avaliações (Reviews) com Cálculo de Média

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import db from '../config/db';
import { requireAuth } from '../middleware/auth';
import { ReviewSchema, Review, ReviewCreateInput } from '../entities/Review';
import type { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Schemas de validação Zod
const ReviewCreateSchema = z.object({
  booking_id: z.string().uuid('ID de reserva inválido'),
  reviewee_id: z.string().uuid('ID da pessoa avaliada inválido'),
  rating: z.number().int().min(1, 'Mínimo 1 estrela').max(5, 'Máximo 5 estrelas'),
  comment: z.string().max(500, 'Comentário muito longo').optional().nullable()
});

const ReviewUpdateSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(500).optional().nullable()
});

/**
 * POST /api/reviews - Criar avaliação
 * R6.1: Avaliação só após viagem completada (inferido)
 * R6.2: Rating entre 1-5
 * R6.3: Apenas uma avaliação por booking (inferido)
 * - Update: recalcular rating médio do.reviewee
 */
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    // Validar input
    const { booking_id, reviewee_id, rating, comment } = ReviewCreateSchema.parse(req.body);
    const reviewer_id = req.user.id;

    // Verificar se reserva existe e pertence ao reviewer
    const bookingResult = await db.query(
      `SELECT b.ride_id, b.status, r.status as ride_status, r.driver_id, r.passenger_id
       FROM bookings b
       JOIN rides r ON b.ride_id = r.id
       WHERE b.id = $1 AND b.passenger_id = $2 OR b.driver_id = $2`,
      [booking_id, reviewer_id]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Reserva não encontrada ou não pertence ao usuário',
        code: 'BOOKING_NOT_FOUND'
      });
    }

    const booking = bookingResult.rows[0];

    // R6.1: Verificar se viagem foi completada
    if (booking.ride_status !== 'completed') {
      return res.status(400).json({
        error: `Apenas viagens completadas podem ser avaliadas. Status atual: ${booking.ride_status}`,
        code: 'RIDE_NOT_COMPLETED'
      });
    }

    // Determinar quem está sendo avaliado (driver ou passageiro)
    const isEvaluatingDriver = booking.driver_id === reviewee_id;
    const isEvaluatingPassenger = booking.passenger_id === reviewee_id;

    if (!isEvaluatingDriver && !isEvaluatingPassenger) {
      return res.status(403).json({
        error: 'Você só pode avaliar o outro participante da sua viagem',
        code: 'INVALID_REVIEWEE'
      });
    }

    // R6.3: Verificar se já avaliou esta reserva
    const existingReview = await db.query(
      'SELECT id FROM reviews WHERE booking_id = $1 AND reviewer_id = $2',
      [booking_id, reviewer_id]
    );

    if (existingReview.rows.length > 0) {
      return res.status(400).json({
        error: 'Você já avaliou esta reserva',
        code: 'DUPLICATE_REVIEW'
      });
    }

    // Verificar se reviewee avaliou também (opcional - double-blind)
    const revieweeReview = await db.query(
      'SELECT id FROM reviews WHERE booking_id = $1 AND reviewer_id = $2',
      [booking_id, reviewee_id]
    );

    // Criar avaliação
    const reviewResult = await db.query(
      `INSERT INTO reviews (booking_id, ride_id, reviewer_id, reviewee_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [booking_id, booking.ride_id, reviewer_id, reviewee_id, rating, comment || null]
    );

    // Recalcular rating médio do reviewee
    const ratingStats = await db.query(
      `SELECT ROUND(AVG(rating), 2) as avg_rating, COUNT(*) as count
       FROM reviews
       WHERE reviewee_id = $1`,
      [reviewee_id]
    );

    const newRating = parseFloat(ratingStats.rows[0].avg_rating) || 5.00;
    const newCount = parseInt(ratingStats.rows[0].count, 10);

    await db.query(
      'UPDATE profiles SET rating = $1, reviews_count = $2 WHERE id = $3',
      [newRating, newCount, reviewee_id]
    );

    res.status(201).json({
      ...reviewResult.rows[0],
      message: 'Avaliação criada com sucesso'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors.map((e: any) => ({ field: e.path[0], message: e.message }))
      });
    }

    console.error('[REVIEWS] Error creating review:', error);
    res.status(500).json({ error: 'Erro ao criar avaliação', code: 'CREATE_REVIEW_FAILED' });
  }
});

/**
 * GET /api/reviews/user/:userId - Avaliações recebidas por um usuário
 */
router.get('/user/:userId', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    const result = await db.query(
      `SELECT r.*,
              p.full_name as reviewer_name,
              p.avatar_url as reviewer_avatar,
              r.id as reviewer_name,
              r2.full_name as reviewed_name
       FROM reviews r
       JOIN profiles p ON r.reviewer_id = p.id
       JOIN profiles r2 ON r.reviewee_id = r2.id
       WHERE r.reviewee_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('[REVIEWS] Error fetching user reviews:', error);
    res.status(500).json({ error: 'Erro ao buscar avaliações', code: 'LIST_REVIEWS_FAILED' });
  }
});

/**
 * GET /api/reviews/ride/:rideId - Avaliações de uma viagem específica
 */
router.get('/ride/:rideId', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { rideId } = req.params;

    const result = await db.query(
      `SELECT r.*,
              p.full_name as reviewer_name,
              p.avatar_url as reviewer_avatar
       FROM reviews r
       JOIN profiles p ON r.reviewer_id = p.id
       WHERE r.ride_id = $1
       ORDER BY r.created_at DESC`,
      [rideId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('[REVIEWS] Error fetching ride reviews:', error);
    res.status(500).json({ error: 'Erro ao buscar avaliações da viagem', code: 'LIST_REVIEWS_FAILED' });
  }
});

/**
 * GET /api/reviews/booking/:bookingId - Avaliações de uma reserva específica
 */
router.get('/booking/:bookingId', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { bookingId } = req.params;

    const result = await db.query(
      `SELECT r.*,
              p.full_name as reviewer_name,
              p.avatar_url as reviewer_avatar
       FROM reviews r
       JOIN profiles p ON r.reviewer_id = p.id
       WHERE r.booking_id = $1
       ORDER BY r.created_at DESC`,
      [bookingId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('[REVIEWS] Error fetching booking reviews:', error);
    res.status(500).json({ error: 'Erro ao buscar avaliações da reserva', code: 'LIST_REVIEWS_FAILED' });
  }
});

/**
 * GET /api/reviews/my - Avaliações recebidas por mim
 */
router.get('/my', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const result = await db.query(
      `SELECT r.*,
              p.full_name as reviewer_name,
              p.avatar_url as reviewer_avatar,
              r2.full_name as reviewed_name
       FROM reviews r
       JOIN profiles p ON r.reviewer_id = p.id
       JOIN profiles r2 ON r.reviewee_id = r2.id
       WHERE r.reviewee_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('[REVIEWS] Error fetching my reviews:', error);
    res.status(500).json({ error: 'Erro ao buscar minhas avaliações', code: 'LIST_REVIEWS_FAILED' });
  }
});

/**
 * GET /api/reviews/me-made - Avaliações feitas por mim
 */
router.get('/me-made', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const result = await db.query(
      `SELECT r.*,
              p.full_name as reviewee_name,
              p.avatar_url as reviewee_avatar,
              r2.full_name as reviewer_name
       FROM reviews r
       JOIN profiles p ON r.reviewee_id = p.id
       JOIN profiles r2 ON r.reviewer_id = r2.id
       WHERE r.reviewer_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('[REVIEWS] Error fetching reviews I made:', error);
    res.status(500).json({ error: 'Erro ao buscar avaliações feitas por mim', code: 'LIST_REVIEWS_FAILED' });
  }
});

/**
 * GET /api/reviews/:id - Detalhes de uma avaliação
 */
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { id } = req.params;

    const result = await db.query(
      `SELECT r.*,
              p.full_name as reviewer_name,
              p.avatar_url as reviewer_avatar,
              r2.full_name as reviewee_name
       FROM reviews r
       JOIN profiles p ON r.reviewer_id = p.id
       JOIN profiles r2 ON r.reviewee_id = r2.id
       WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Avaliação não encontrada', code: 'REVIEW_NOT_FOUND' });
    }

    const review = result.rows[0];

    // Verificar permissão
    const canAccess = 
      req.user.role === 'admin' ||
      review.reviewer_id === req.user.id ||
      review.reviewee_id === req.user.id;

    if (!canAccess) {
      return res.status(403).json({ error: 'Sem permissão para ver esta avaliação', code: 'NOT_ALLOWED' });
    }

    res.json(review);
  } catch (error) {
    console.error('[REVIEWS] Error fetching review:', error);
    res.status(500).json({ error: 'Erro ao buscar avaliação', code: 'FETCH_REVIEW_FAILED' });
  }
});

/**
 * PUT /api/reviews/:id - Atualizar avaliação própria
 * Nota: Normalmente reviews não são editáveis após certo tempo, mas permitimos por enquanto
 */
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { id } = req.params;
    const { rating, comment } = ReviewUpdateSchema.parse(req.body);

    // Verificar se é dono da avaliação
    const existing = await db.query(
      'SELECT id, rating, reviewee_id FROM reviews WHERE id = $1 AND reviewer_id = $2',
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Avaliação não encontrada', code: 'REVIEW_NOT_FOUND' });
    }

    const oldRating = parseFloat(existing.rows[0].rating);
    const revieweeId = existing.rows[0].reviewee_id;

    // Calcular nova média se rating mudou
    let needsRatingRecalc = false;
    if (rating !== undefined && rating !== oldRating) {
      needsRatingRecalc = true;
    }

    // Atualizar avaliação
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (rating !== undefined) { updates.push(`rating = $${paramIndex++}`); values.push(rating); }
    if (comment !== undefined) { updates.push(`comment = $${paramIndex++}`); values.push(comment); }
    values.push(id);

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar', code: 'NO_FIELDS_TO_UPDATE' });
    }

    const updateResult = await db.query(
      `UPDATE reviews SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    // Recalcular média do reviewee se rating mudou
    if (needsRatingRecalc) {
      const ratingStats = await db.query(
        `SELECT ROUND(AVG(rating), 2) as avg_rating, COUNT(*) as count
         FROM reviews
         WHERE reviewee_id = $1`,
        [revieweeId]
      );

      const newRating = parseFloat(ratingStats.rows[0].avg_rating) || 5.00;
      const newCount = parseInt(ratingStats.rows[0].count, 10);

      await db.query(
        'UPDATE profiles SET rating = $1, reviews_count = $2 WHERE id = $3',
        [newRating, newCount, revieweeId]
      );
    }

    res.json(updateResult.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors.map((e: any) => ({ field: e.path[0], message: e.message }))
      });
    }

    console.error('[REVIEWS] Error updating review:', error);
    res.status(500).json({ error: 'Erro ao atualizar avaliação', code: 'UPDATE_REVIEW_FAILED' });
  }
});

/**
 * DELETE /api/reviews/:id - Remover avaliação própria
 * Também reverte o cálculo de média do reviewee
 */
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { id } = req.params;

    // Verificar se é dono da avaliação
    const result = await db.query(
      'SELECT id, reviewee_id, rating FROM reviews WHERE id = $1 AND reviewer_id = $2',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Avaliação não encontrada', code: 'REVIEW_NOT_FOUND' });
    }

    const review = result.rows[0];
    const revieweeId = review.reviewee_id;

    // Remover avaliação
    await db.query('DELETE FROM reviews WHERE id = $1', [id]);

    // Recalcular média do reviewee
    const ratingStats = await db.query(
      `SELECT ROUND(AVG(rating), 2) as avg_rating, COUNT(*) as count
       FROM reviews
       WHERE reviewee_id = $1`,
      [revieweeId]
    );

    const newRating = parseFloat(ratingStats.rows[0].avg_rating) || 5.00;
    const newCount = parseInt(ratingStats.rows[0].count, 10);

    await db.query(
      'UPDATE profiles SET rating = $1, reviews_count = $2 WHERE id = $3',
      [newRating, newCount, revieweeId]
    );

    res.json({ message: 'Avaliação removida com sucesso' });
  } catch (error) {
    console.error('[REVIEWS] Error deleting review:', error);
    res.status(500).json({ error: 'Erro ao remover avaliação', code: 'DELETE_REVIEW_FAILED' });
  }
});

export default router;
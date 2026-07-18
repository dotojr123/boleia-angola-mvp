// src/entities/Review.ts - Entidade Review com validação Zod

import { z } from 'zod';

export const ReviewSchema = z.object({
  id: z.string().uuid(),
  ride_id: z.string().uuid(),
  reviewer_id: z.string().uuid(),
  reviewee_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500),
  created_at: z.string().datetime(),
});

export type Review = z.infer<typeof ReviewSchema>;
export type ReviewInput = z.input<typeof ReviewSchema>;
export type ReviewCreateInput = Omit<ReviewInput, 'id' | 'created_at'>;

export const ReviewValidator = {
  // R6.2 - Rating entre 1 e 5
  validateRating: (rating: number): boolean => {
    return rating >= 1 && rating <= 5;
  },

  // R6.3 - Apenas uma avaliação por booking (inferido)
  validateDuplicate: (existingReviews: Review[]): boolean => {
    return existingReviews.length === 0;
  },

  // Calcular média de ratings
  calculateAverage: (reviews: Review[]): number => {
    if (reviews.length === 0) return 5.00;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / reviews.length) * 100) / 100;
  },
};

export const createReviewDefaults = (
  rideId: string,
  reviewerId: string,
  revieweeId: string,
  rating: number,
  comment: string
): Omit<ReviewCreateInput, 'ride_id' | 'reviewer_id' | 'reviewee_id'> => ({
  rating,
  comment,
  created_at: new Date().toISOString(),
});

export default ReviewSchema;
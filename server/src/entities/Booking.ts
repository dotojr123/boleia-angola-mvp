// src/entities/Booking.ts - Entidade Booking com validação Zod e regras R2, R5

import { z } from 'zod';
import type { BookingStatus } from '../types';
import { BookingStatusEnum } from '../types';

export const BookingSchema = z.object({
  id: z.string().uuid(),
  ride_id: z.string().uuid(),
  passenger_id: z.string().uuid(),
  
  seats_booked: z.number().int().min(1).max(15),
  total_price: z.number().nonnegative(),
  
  // Máquina de estados - R5.2
  status: z.enum(['pending', 'confirmed', 'rejected', 'cancelled']),
  
  created_at: z.string().datetime(),
});

export type Booking = z.infer<typeof BookingSchema>;
export type BookingInput = z.input<typeof BookingSchema>;
export type BookingCreateInput = Omit<BookingInput, 'id' | 'created_at'>;
export type BookingUpdateInput = Partial<Omit<BookingInput, 'id' | 'ride_id' | 'passenger_id' | 'seats_booked' | 'created_at'>>;

export const BookingValidator = {
  // R2.1 - Validar assentos disponíveis
  validateSeatsAvailability: (requested: number, available: number): boolean => {
    return requested > 0 && requested <= available;
  },

  // R2.3 - Validar duplicidade (já tem reserva confirmed)
  checkDuplicate: (existingBookings: Booking[]): boolean => {
    return existingBookings.some(b => b.status === 'confirmed');
  },

  // R2.4 - Calcular preço total
  calculateTotalPrice: (pricePerSeat: number, seats: number): number => {
    return pricePerSeat * seats;
  },

  // R5.2 - Status válidos para transição
  isValidStatusChange: (
    currentStatus: BookingStatus,
    newStatus: BookingStatus
  ): { valid: boolean; reason?: string } => {
    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      pending: ['confirmed', 'rejected', 'cancelled'],
      confirmed: ['cancelled'],
      rejected: ['rejected'],
      cancelled: ['cancelled'],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      return {
        valid: false,
        reason: `Transição inválida: ${currentStatus} → ${newStatus}`
      };
    }

    return { valid: true };
  },

  // R5.3 - Determinar se assentos devem ser restaurados
  shouldRestoreSeats: (oldStatus: BookingStatus, newStatus: BookingStatus): boolean => {
    // Restaura apenas se estava confirmado e agora vai para cancelado
    return oldStatus === 'confirmed' && newStatus === 'cancelled';
  },

  // Verificar se reserva pode ser cancelada pelo passageiro
  canPassengerCancel: (booking: Booking): boolean => {
    return booking.status === 'confirmed';
  },
};

// Máquina de estados
export const BookingStateMachine = {
  initialState: 'confirmed' as BookingStatus, // Cria direto como confirmed conforme código real
  finalStates: ['rejected', 'cancelled'] as BookingStatus[],

  isFinalState: (status: BookingStatus): boolean => {
    return ['rejected', 'cancelled'].includes(status);
  },

  getPossibleTransitions: (status: BookingStatus): BookingStatus[] => {
    const transitions: Record<BookingStatus, BookingStatus[]> = {
      pending: ['confirmed', 'rejected', 'cancelled'],
      confirmed: ['cancelled'],
      rejected: [],
      cancelled: [],
    };
    return transitions[status] || [];
  },
};

export const createBookingDefaults = (
  rideId: string,
  passengerId: string,
  seats: number,
  totalPrice: number
): Omit<BookingCreateInput, 'ride_id' | 'passenger_id'> => ({
  seats_booked: seats,
  status: 'confirmed', // R2.5 - Cria direto como confirmed
  total_price: totalPrice,
  created_at: new Date().toISOString(),
});

export default BookingSchema;
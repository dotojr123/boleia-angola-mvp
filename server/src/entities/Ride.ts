// src/entities/Ride.ts - Entidade Ride com validação Zod e máquina de estados

import { z } from 'zod';
import type { RideStatus } from '../types';
import { RideStatusEnum } from '../types';

export const RideSchema = z.object({
  id: z.string().uuid(),
  driver_id: z.string().uuid(),
  vehicle_id: z.string().uuid().nullable(),
  
  // R1.2 - Cidades principais de Angola
  origin_city: z.string().min(2).max(100),
  origin_exact_point: z.string().max(500).optional().nullable(),
  destination_city: z.string().min(2).max(100),
  destination_exact_point: z.string().max(500).optional().nullable(),
  
  // R1.2 - De partida deve ser futura
  departure_time: z.string().datetime(),
  estimated_arrival: z.string().datetime().optional().nullable(),
  duration: z.string().optional().nullable(),
  
  // R1.3 - Preço > 0
  price_per_seat: z.number().positive('Preço deve ser maior que 0'),
  currency: z.enum(['Kz', 'USD', 'EUR']).default('Kz'),
  
  // R1.4 - Capacidade máx 15 (padrão BlaBlaCar)
  total_seats: z.number().int().min(1).max(15),
  available_seats: z.number().int().min(0).max(15),
  
  // Machine of state - R4.2
  status: z.enum(['scheduled', 'active', 'completed', 'cancelled']),
  
  description: z.string().max(500).optional().nullable(),
  baggage_policy: z.string().max(200).optional().nullable(),
  luggage_size: z.string().optional().nullable(),
  frequency: z.string().optional().nullable(),
  booking_mode: z.enum(['instant', 'request']).default('request'),
  instant_booking: z.boolean().default(false),
  waypoints: z.array(z.object({
    city: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    order: z.number()
  })).optional().default([]),
  
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Ride = z.infer<typeof RideSchema>;
export type RideInput = z.input<typeof RideSchema>;
export type RideCreateInput = Omit<RideInput, 'id' | 'available_seats' | 'status' | 'created_at' | 'updated_at' | 'currency' | 'booking_mode' | 'instant_booking' | 'waypoints'>;
export type RideUpdateInput = Partial<Omit<RideInput, 'id' | 'driver_id' | 'created_at' | 'available_seats'>>;

export const RideValidator = {
  // R1.2 - Verificar se data de partida é futura
  validateDepartureTime: (departureTime: Date): boolean => {
    return departureTime > new Date();
  },

  // R1.3 - Preço positivo
  validatePrice: (price: number): boolean => {
    return price > 0;
  },

  // R1.4 - Capacidade entre 1 e 15
  validateCapacity: (total: number, available: number): boolean => {
    return total >= 1 && total <= 15 && available >= 0 && available <= total;
  },

  // R4.2 - Máquina de estados de transição
  canTransition: (
    currentStatus: RideStatus,
    newStatus: RideStatus,
    hasConfirmedBookings: boolean = false
  ): { valid: boolean; reason?: string } => {
    const transitions: Record<RideStatus, RideStatus[]> = {
      scheduled: ['active', 'cancelled', 'scheduled'],
      active: ['completed', 'active'],
      completed: ['completed'],
      cancelled: ['cancelled'],
    };

    if (!transitions[currentStatus].includes(newStatus)) {
      return { 
        valid: false, 
        reason: `Transição inválida: ${currentStatus} → ${newStatus}` 
      };
    }

    // R3.2 - Não pode cancelar com reservas confirmadas
    if (currentStatus === 'scheduled' && newStatus === 'cancelled' && hasConfirmedBookings) {
      return {
        valid: false,
        reason: 'Não é possível cancelar viagem com passageiros confirmados'
      };
    }

    return { valid: true };
  },

  // Verificar se viagem pode aceitar novas reservas
  canAcceptBookings: (ride: Ride): boolean => {
    return ride.status === 'scheduled' && ride.available_seats > 0;
  },

  // Calcular assentos disponíveis após reserva
  calculateAvailableSeats: (current: number, seatsBooked: number): number => {
    return Math.max(0, current - seatsBooked);
  },
};

// Máquinas de estado como objeto para fácil consulta
export const RideStateMachine = {
  initialState: 'scheduled' as RideStatus,
  finalStates: ['completed', 'cancelled'] as RideStatus[],
  
  isFinalState: (status: RideStatus): boolean => {
    return ['completed', 'cancelled'].includes(status);
  },
  
  getPossibleTransitions: (status: RideStatus): RideStatus[] => {
    const transitions: Record<RideStatus, RideStatus[]> = {
      scheduled: ['active', 'cancelled'],
      active: ['completed'],
      completed: [],
      cancelled: [],
    };
    return transitions[status] || [];
  },
};

export const createRideDefaults = (driverId: string, vehicleId?: string): Omit<RideCreateInput, 'driver_id'> => ({
  origin_city: '',
  destination_city: '',
  departure_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  price_per_seat: 5000,
  total_seats: 4,
  description: '',
  vehicle_id: vehicleId || null,
  waypoints: [],
  instant_booking: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export default RideSchema;
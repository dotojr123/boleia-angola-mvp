// src/entities/Vehicle.ts - Entidade Vehicle com validação Zod

import { z } from 'zod';

export const VehicleSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido'),
  owner_id: z.string().uuid('ID do dono deve ser um UUID válido'),
  make: z.string().min(2, 'Marca muito curta').max(50),
  model: z.string().min(2, 'Modelo muito curto').max(50),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1),
  color: z.string().min(2).max(20),
  plate: z.string().regex(/^[A-Z]{2}-\d{4}$/, 'Placa inválida. Formato: AA-0000'),
  seats_capacity: z.number().int().min(2).max(15).default(4),
  category: z.enum(['economy', 'comfort', 'premium', 'van']).default('economy'),
  comfort_level: z.enum(['standard', 'premium', 'luxury']).default('standard'),
  is_active: z.boolean().default(true),
  photo_urls: z.array(z.string().url()).optional().default([]),

  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Vehicle = z.infer<typeof VehicleSchema>;
export type VehicleInput = z.input<typeof VehicleSchema>;
export type VehicleCreateInput = Omit<VehicleInput, 'id' | 'created_at' | 'updated_at'>;
export type VehicleUpdateInput = Partial<Omit<VehicleInput, 'id' | 'owner_id' | 'created_at'>>;

export const VehicleValidator = {
  // Validar capacidade dentro do limite BlaBlaCar (max 15)
  validateCapacity: (capacity: number): boolean => {
    return capacity >= 2 && capacity <= 15;
  },

  // Validar ano do veículo (não muito antigo)
  validateYear: (year: number): boolean => {
    const currentYear = new Date().getFullYear();
    return year >= (currentYear - 25) && year <= currentYear;
  },

  // Verificar se veículo está ativo para viagens
  isAvailable: (vehicle: Vehicle): boolean => {
    return vehicle.is_active && vehicle.verification_status !== 'rejected';
  },
};

export const createVehicleDefaults = (ownerId: string): Omit<VehicleCreateInput, 'owner_id'> => ({
  make: '',
  model: '',
  year: new Date().getFullYear(),
  color: '',
  plate: '',
  seats_capacity: 4,
  category: 'economy',
  comfort_level: 'standard',
  is_active: true,
  photo_urls: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export default VehicleSchema;
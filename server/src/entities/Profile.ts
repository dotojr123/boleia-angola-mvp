// src/entities/Profile.ts - Entidade Profile com validação Zod

import { z } from 'zod';
import type { UserRole, VerificationStatus, ExperienceLevel, TravelPreference } from '../types';

// Schema de validação
export const ProfileSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido'),
  email: z.string().email('Email inválido').min(5, 'Email muy curto').max(255),
  full_name: z.string().min(5, 'Nome completo deve ter pelo menos 5 caracteres'),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string()
    .regex(/^\+?244?9?\d{9}$/, 'Telefone inválido. Formato: +2449XXXXXXXX ou 9XXXXXXXX'),
  password_hash: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  avatar_url: z.string().url().optional().or(z.literal('')),
  role: z.enum(['passenger', 'driver', 'admin']),
  verification_status: z.enum(['none', 'pending', 'verified', 'rejected']),
  email_verified: z.boolean().default(false),
  phone_verified: z.boolean().default(false),
  experience_level: z.enum(['Principiante', 'Intermediário', 'Experiente', 'Embaixador'])
    .default('Principiante'),
  travel_preferences: z.record(z.any()).default({}),
  rating: z.number().min(0).max(5).default(5.00),
  bio: z.string().max(500).optional().or(z.literal('')),
  display_name: z.string().max(100).optional(),
  gender: z.string().max(50).optional(),
  birthdate: z.string().datetime().optional(),
  location: z.string().max(200).optional(),

  // Campos computados
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Tipos derivados
export type Profile = z.infer<typeof ProfileSchema>;
export type ProfileInput = z.input<typeof ProfileSchema>;
export type ProfileCreateInput = Omit<ProfileInput, 'id' | 'created_at' | 'updated_at'>;
export type ProfileUpdateInput = Partial<Omit<ProfileInput, 'id' | 'email' | 'password_hash' | 'created_at'>>;

// Validação de regras de negócio
export const ProfileValidator = {
  // R7.1 - Senha mínima 6 caracteres
  validatePassword: (password: string): boolean => {
    return password.length >= 6;
  },

  // R7.2 - Telefone Angola válido
  validatePhone: (phone: string): boolean => {
    const phoneRegex = /^(\+244|244|0)?9[0-9]{9}$/;
    return phoneRegex.test(phone.replace(/[\s\-]/g, ''));
  },

  // Verifica se usuário pode criar viagens (deve ser driver ou admin)
  canCreateRides: (role: UserRole): boolean => {
    return role === 'driver' || role === 'admin';
  },

  // Verifica se usuário pode acessar admin panel
  canAccessAdmin: (role: UserRole): boolean => {
    return role === 'admin';
  },

  // Verifica se usuário está verificado
  isVerified: (status: VerificationStatus): boolean => {
    return status === 'verified';
  },
};

// Factory para criar perfil com defaults
export const createProfileDefaults = (
  role: UserRole = 'passenger',
  verificationStatus: VerificationStatus = 'none'
): Omit<ProfileCreateInput, 'email' | 'password_hash'> => ({
  full_name: '',
  phone: '',
  avatar_url: '',
  role,
  verification_status: verificationStatus,
  email_verified: false,
  phone_verified: false,
  experience_level: 'Principiante',
  travel_preferences: {},
  rating: 5.00,
  bio: '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

// Exportar schema para reuso em outros módulos
export default ProfileSchema;
// src/entities/Alert.ts - Entidade Alert (Denúncia) com validação Zod

import { z } from 'zod';

export const AlertTypeEnum = z.enum([
  'harassment',
  'fraud',
  'unsafe_vehicle',
  'no_show',
  'inappropriate_behavior',
  'other'
]);

export const AlertStatusEnum = z.enum([
  'pending',
  'reviewed',
  'resolved',
  'dismissed'
]);

// Schema completo
export const AlertSchema = z.object({
  id: z.string().uuid('ID inválido'),
  reporter_id: z.string().uuid('ID do denunciante inválido'),
  reported_id: z.string().uuid('ID do denunciado inválido'),
  ride_id: z.string().uuid().nullable().optional(),
  booking_id: z.string().uuid().nullable().optional(),
  alert_type: AlertTypeEnum,
  status: AlertStatusEnum.default('pending'),
  description: z.string().max(1000, 'Descrição muito longa').optional().nullable(),
  evidence_url: z.string().url().nullable().optional(),
  admin_notes: z.string().max(500).nullable().optional(),
  resolution: z.string().max(200).nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  reviewed_at: z.string().datetime().nullable().optional(),
  resolved_at: z.string().datetime().nullable().optional()
});

// Type inference
export type Alert = z.infer<typeof AlertSchema>;
export type AlertInput = z.input<typeof AlertSchema>;
export type AlertCreateInput = Omit<AlertInput, 'id' | 'status' | 'created_at' | 'updated_at' | 'admin_notes' | 'resolution' | 'reviewed_at' | 'resolved_at'>;
export type AlertUpdateInput = Partial<Omit<AlertInput, 'id' | 'reporter_id' | 'reported_id' | 'created_at' | 'updated_at'>>;

// Schama para create
export const AlertCreateSchema = AlertSchema.omit({
  id: true,
  status: true,
  created_at: true,
  updated_at: true,
  admin_notes: true,
  resolution: true,
  reviewed_at: true,
  resolved_at: true
}).extend({
  alert_type: AlertTypeEnum,
  reported_id: z.string().uuid('ID do denunciado é obrigatório'),
  reporter_id: z.string().uuid(),
  ride_id: z.string().uuid().nullable().optional(),
  booking_id: z.string().uuid().nullable().optional(),
  description: z.string().min(10, 'Descrição muito curta (mínimo 10 caracteres)').max(1000).optional().nullable(),
  evidence_url: z.string().url().nullable().optional()
});

// Schema para update (admin apenas)
export const AlertUpdateSchema = AlertSchema.partial().extend({
  status: AlertStatusEnum.optional(),
  admin_notes: z.string().max(500).nullable().optional(),
  resolution: z.string().max(200).nullable().optional(),
  reviewed_at: z.string().datetime().nullable().optional(),
  resolved_at: z.string().datetime().nullable().optional()
});

// Máquina de estados para denúncias
export const AlertStateMachine = {
  canTransition: (current: string, next: string): { valid: boolean; reason?: string } => {
    const validTransitions: Record<string, string[]> = {
      'pending': ['reviewed', 'dismissed'],
      'reviewed': ['resolved', 'dismissed'],
      'resolved': [], // Final state
      'dismissed': [] // Final state
    };

    if (!validTransitions[current]) {
      return { valid: false, reason: `Status inválido: ${current}` };
    }

    if (validTransitions[current].includes(next)) {
      return { valid: true };
    }

    return {
      valid: false,
      reason: `Transição inválida: ${current} → ${next}. Válidas: ${validTransitions[current].join(', ') || 'nenhuma (final state)'}`
    };
  },

  isFinalState: (status: string): boolean => {
    return status === 'resolved' || status === 'dismissed';
  }
};

// Validator helpers
export const AlertValidator = {
  validateCreate: (data: AlertCreateInput): z.SafeParseReturnType<any, Alert> => {
    return AlertCreateSchema.safeParse(data);
  },

  validateUpdate: (data: Partial<Alert>): z.SafeParseReturnType<any, Alert> => {
    return AlertUpdateSchema.safeParse(data);
  },

  validateTransition: (current: string, next: string) => {
    return AlertStateMachine.canTransition(current, next);
  }
};
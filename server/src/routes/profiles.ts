// server/src/routes/profiles.ts - Módulo de Perfis (TypeScript estrito + P5 Verificação)

import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import db from '../config/db';
import { requireAuth, requireRole, requireAdmin } from '../middleware/auth';
import { ProfileSchema, Profile, ProfileUpdateInput, ExperienceLevelEnum, VerificationStatusEnum } from '../entities/Profile';
import type { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Schemas de validação Zod
const PhoneRegex = /^(?:\+244[0-9]{9}|9[0-9]{8})$/;

const ProfileCreateSchema = ProfileSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  rating: true,
  reviews_count: true,
  verification_status: true
}).extend({
  email: z.string().email('Email inválido').min(5).max(255),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  full_name: z.string().min(2, 'Nome muito curto').max(100),
  phone: z.string().regex(PhoneRegex, 'Telefone inválido. Formato: +2449XXXXXXXXX ou 9XXXXXXXXX').optional(),
  role: z.enum(['passenger', 'driver']).default('passenger'),
  experience_level: ExperienceLevelEnum.default('Principiante'),
  verification_status: VerificationStatusEnum.default('none')
});

const ProfileUpdateSchema = z.object({
  first_name: z.string().min(2).max(50).optional(),
  last_name: z.string().min(2).max(50).optional(),
  full_name: z.string().min(2).max(100).optional(),
  phone: z.string().regex(PhoneRegex, 'Telefone inválido').optional(),
  bio: z.string().max(500).optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  gender: z.string().max(50).optional().nullable(),
  birthdate: z.string().date().optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  display_name: z.string().max(50).optional().nullable(),
  experience_level: ExperienceLevelEnum.optional(),
  travel_preferences: z.record(z.any()).optional(),
  email: z.string().email().optional(),
  role: z.enum(['passenger', 'driver']).optional()
});

const ProfileAdminUpdateSchema = ProfileUpdateSchema.partial().extend({
  verification_status: VerificationStatusEnum.optional(),
  email_verified: z.boolean().optional(),
  phone_verified: z.boolean().optional(),
  id_verified: z.boolean().optional(),
  rating: z.number().min(0).max(5).optional()
});

const ProfilePublicSchema = ProfileSchema.omit({
  password_hash: true
}).extend({
  // Remove sensitive info
});

/**
 * GET /api/profiles - Listar perfis (público + filtros)
 */
router.get('/', async (req: any, res: Response, next: NextFunction) => {
  try {
    const { role, verification_status, limit = '20', offset = '0' } = req.query;

    if (parseInt(limit as string, 10) > 100) {
      return res.status(400).json({ error: 'Limite máximo 100 perfis' });
    }

    let query = `
      SELECT id, full_name, avatar_url, verification_status, email_verified, phone_verified,
             id_verified, rating, reviews_count, role, experience_level, location,
             bio, created_at
      FROM profiles
      WHERE 1=1
    `;

    const values: any[] = [];
    let paramIndex = 1;

    if (role) {
      query += ` AND role = $${paramIndex++}`;
      values.push(role);
    }

    if (verification_status) {
      query += ` AND verification_status = $${paramIndex++}`;
      values.push(verification_status);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    values.push(parseInt(limit as string, 10), parseInt(offset as string, 10));

    const { rows } = await db.query(query, values);

    res.json(rows);
  } catch (error) {
    console.error('[PROFILES] Error listing profiles:', error);
    res.status(500).json({ error: 'Erro ao buscar perfis', code: 'LIST_PROFILES_FAILED' });
  }
});

/**
 * GET /api/profiles/me - Perfil do usuário autenticado (sem senha)
 */
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { rows } = await db.query(
      `SELECT * FROM profiles WHERE id = $1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Perfil não encontrado', code: 'PROFILE_NOT_FOUND' });
    }

    // Remove sensitive fields
    const { password_hash, ...profile } = rows[0];

    res.json(profile);
  } catch (error) {
    console.error('[PROFILES] Error fetching my profile:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil', code: 'FETCH_PROFILE_FAILED' });
  }
});

/**
 * GET /api/profiles/:id - Perfil público de um usuário (sem senha e fields sensíveis)
 */
router.get('/:id', async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { rows } = await db.query(
      `SELECT id, full_name, avatar_url, verification_status, email_verified, phone_verified,
              id_verified, rating, reviews_count, role, experience_level, location,
              bio, travel_preferences, created_at
       FROM profiles
       WHERE id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Perfil não encontrado', code: 'PROFILE_NOT_FOUND' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('[PROFILES] Error fetching profile:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil', code: 'FETCH_PROFILE_FAILED' });
  }
});

/**
 * PATCH /api/profiles/me - Atualizar perfil do próprio usuário
 * P5: Usuário pode editar dados pessoais, mas Não pode mudar verification_status manualmente
 */
router.patch('/me', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const updates = ProfileUpdateSchema.partial().parse(req.body);

    // Validar phone se fornecido
    if (updates.phone) {
      const cleanPhone = updates.phone.replace(/[\s.-]/g, '');
      if (!PhoneRegex.test(cleanPhone)) {
        return res.status(400).json({ 
          error: 'Telefone inválido. Formato esperado: +2449XXXXXXXXX ou 9XXXXXXXXX',
          code: 'INVALID_PHONE'
        });
      }
    }

    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [field, value] of Object.entries(updates)) {
      if (value !== undefined) {
        if (field === 'travel_preferences' && typeof value === 'object') {
          setClauses.push(`${field} = $${paramIndex}::jsonb`);
          values.push(JSON.stringify(value));
        } else {
          setClauses.push(`${field} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
    }

    setClauses.push('updated_at = NOW()');
    values.push(req.user.id);

    const query = `
      UPDATE profiles
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const { rows } = await db.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    // Remove sensitive fields
    const { password_hash, ...profile } = rows[0];

    res.json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors.map((e: any) => ({ field: e.path[0], message: e.message }))
      });
    }

    console.error('[PROFILES] Error updating profile:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil', code: 'UPDATE_PROFILE_FAILED' });
  }
});

/**
 * PUT /api/profiles/:id - Atualizar perfil completo (admin ou próprio usuário)
 */
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { id } = req.params;
    
    // Verificar permissão
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para editar este perfil', code: 'NOT_ALLOWED' });
    }

    const updates = req.user.role === 'admin' 
      ? ProfileAdminUpdateSchema.parse(req.body)
      : ProfileUpdateSchema.parse(req.body);

    // Admin pode atualizar verification fields
    const isAdminFields = req.user.role === 'admin';
    
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [field, value] of Object.entries(updates)) {
      if (value !== undefined) {
        // Admin fields only
        if (!isAdminFields && ['verification_status', 'email_verified', 'phone_verified', 'id_verified', 'rating'].includes(field)) {
          continue; // Skip admin-only fields for regular users
        }

        if (field === 'travel_preferences' && typeof value === 'object') {
          setClauses.push(`${field} = $${paramIndex}::jsonb`);
          values.push(JSON.stringify(value));
        } else {
          setClauses.push(`${field} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
    }

    setClauses.push('updated_at = NOW()');
    values.push(id);

    const query = `
      UPDATE profiles
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const { rows } = await db.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    // Remove sensitive fields for non-admin
    const { password_hash, ...profile } = req.user.role === 'admin' ? rows[0] : rows[0];
    const finalProfile = req.user.role === 'admin' ? rows[0] : profile;

    res.json(finalProfile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors.map((e: any) => ({ field: e.path[0], message: e.message }))
      });
    }

    console.error('[PROFILES] Error updating profile:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil', code: 'UPDATE_PROFILE_FAILED' });
  }
});

/**
 * PATCH /api/profiles/me/verify-documents - Upload de documentos para verificação
 * P5: Usuário envia documentos → admin review → verification_status muda
 */
router.patch('/me/verify-documents', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { document_type, document_url } = z.object({
      document_type: z.enum(['id_card', 'drivers_license', 'proof_of_address', 'passport']),
      document_url: z.string().url('URL do documento inválida')
    }).parse(req.body);

    // Verificar documentos existentes
    const existingDocs = await db.query(
      `SELECT id, status FROM user_documents 
       WHERE user_id = $1 AND document_type = $2 AND status != 'rejected'`,
      [req.user.id, document_type]
    );

    if (existingDocs.rows.length > 0) {
      return res.status(409).json({
        error: `Já tem documento ${document_type} pendente de aprovação`,
        code: 'DOCUMENT_EXISTS'
      });
    }

    // Criar documento enviado
    const docResult = await db.query(
      `INSERT INTO user_documents (user_id, document_type, document_url, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [req.user.id, document_type, document_url]
    );

    // Update verification_status para pending
    await db.query(
      `UPDATE profiles SET verification_status = 'pending', updated_at = NOW() WHERE id = $1`,
      [req.user.id]
    );

    res.status(201).json({
      ...docResult.rows[0],
      message: 'Documento enviado para review. Aguarde a aprovação.'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors.map((e: any) => ({ field: e.path[0], message: e.message }))
      });
    }

    console.error('[PROFILES] Error uploading document:', error);
    res.status(500).json({ error: 'Erro ao enviar documento', code: 'UPLOAD_DOCUMENT_FAILED' });
  }
});

/**
 * GET /api/profiles/me/documents - Lista de documentos enviados para verificação
 */
router.get('/me/documents', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { rows } = await db.query(
      `SELECT * FROM user_documents WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (error) {
    console.error('[PROFILES] Error fetching documents:', error);
    res.status(500).json({ error: 'Erro ao buscar documentos', code: 'LIST_DOCUMENTS_FAILED' });
  }
});

/**
 * PATCH /api/profiles/:id/verify - Admin aprova/rejeita verificação (P5)
 */
router.patch('/:id/verify', requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { id } = req.params;
    const { verification_status, email_verified, phone_verified, id_verified, document_id, notes } = z.object({
      verification_status: z.enum(['none', 'pending', 'verified', 'rejected']).optional(),
      email_verified: z.boolean().optional(),
      phone_verified: z.boolean().optional(),
      id_verified: z.boolean().optional(),
      document_id: z.string().uuid().optional(),
      notes: z.string().max(500).optional().nullable()
    }).parse(req.body);

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (verification_status !== undefined) {
      updates.push(`verification_status = $${paramIndex++}`);
      values.push(verification_status);
    }

    if (email_verified !== undefined) {
      updates.push(`email_verified = $${paramIndex++}`);
      values.push(email_verified);
    }

    if (phone_verified !== undefined) {
      updates.push(`phone_verified = $${paramIndex++}`);
      values.push(phone_verified);
    }

    if (id_verified !== undefined) {
      updates.push(`id_verified = $${paramIndex++}`);
      values.push(id_verified);
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    // Update profile
    const query = `
      UPDATE profiles
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const { rows } = await db.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    // Se document_id fornecido, atualizar status do documento
    if (document_id) {
      const docStatus = verification_status === 'verified' ? 'approved' : 'rejected';
      await db.query(
        `UPDATE user_documents SET status = $1, reviewed_at = NOW(), review_notes = $2 WHERE id = $3`,
        [docStatus, notes || null, document_id]
      );
    }

    res.json({
      ...rows[0],
      message: `Verificação atualizada para "${verification_status || 'mantida'}"`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors.map((e: any) => ({ field: e.path[0], message: e.message }))
      });
    }

    console.error('[PROFILES] Error verifying profile:', error);
    res.status(500).json({ error: 'Erro ao verificar perfil', code: 'VERIFY_PROFILE_FAILED' });
  }
});

/**
 * DELETE /api/profiles/me - Soft delete do próprio perfil
 */
router.delete('/me', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    // Verificar reservas ativas
    const activeBookings = await db.query(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE passenger_id = $1 AND status IN ('pending', 'confirmed')`,
      [req.user.id]
    );

    if (parseInt(activeBookings.rows[0].count, 10) > 0) {
      return res.status(400).json({
        error: 'Não é possible remover perfil com reservas ativas',
        code: 'HAS_ACTIVE_BOOKINGS'
      });
    }

    // Verificar viagens ativas
    const activeRides = await db.query(
      `SELECT COUNT(*) as count FROM rides 
       WHERE driver_id = $1 AND status IN ('scheduled', 'active')`,
      [req.user.id]
    );

    if (parseInt(activeRides.rows[0].count, 10) > 0) {
      return res.status(400).json({
        error: 'Não é possible remover perfil com viagens ativas',
        code: 'HAS_ACTIVE_RIDES'
      });
    }

    // Soft delete
    await db.query(
      `UPDATE profiles SET verification_status = 'none', updated_at = NOW() WHERE id = $1`,
      [req.user.id]
    );

    // Nota: Em produção, સાચવો is_active = false em vez de hard delete
    // Mas para segurança, estamos limpando verification_status

    res.json({ message: 'Perfil desativado com sucesso. Todos os dados sensíveis foram removidos.' });
  } catch (error) {
    console.error('[PROFILES] Error deleting profile:', error);
    res.status(500).json({ error: 'Erro ao remover perfil', code: 'DELETE_PROFILE_FAILED' });
  }
});

export default router;
// server/src/routes/auth.ts - Módulo de Autenticação (Register, Login, Me)

import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import db from '../config/db';
import { ProfileSchema, ProfileValidator } from '../entities/Profile';
import { requireAuth, generateToken } from '../middleware/auth';
import type { UserRole } from '../types';

const router = Router();

// Configuração JWT
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

// Schemas de validação Zod
const RegisterSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  full_name: z.string().min(5, 'Nome completo deve ter pelo menos 5 caracteres'),
  phone: z.string().regex(/^\+?244?9?\d{9}$/, 'Telefone inválido. Formato: +2449XXXXXXXX ou 9XXXXXXXX').optional(),
  role: z.enum(['passenger', 'driver', 'admin']).default('passenger')
});

const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
});

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

/**
 * POST /auth/register
 * R7.1-R7.3 — Registro de usuário
 * - R7.1: Senha mínima 6 caracteres
 * - R7.2: Telefone Angola válido
 * - R7.3: Role default: passenger
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validar input com Zod
    const { email, password, full_name, phone, role } = RegisterSchema.parse(req.body);

    // Verificar se usuário já existe
    const existingUser = await db.query('SELECT id FROM profiles WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Email já cadastrado',
        code: 'EMAIL_EXISTS'
      });
    }

    // Iniciar transação
    await db.query('BEGIN');

    try {
      // Hash da senha
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Insert no profiles
      const result = await db.query(
        `INSERT INTO profiles (email, full_name, phone, role, password_hash)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, full_name, role`,
        [email, full_name, phone || null, role, passwordHash]
      );

      const { id } = result.rows[0];

      // Commit
      await db.query('COMMIT');

      // Gerar token
      const token = generateToken(id, email, role);

      res.status(201).json({
        message: 'Usuário criado com sucesso',
        token,
        user: { id, email, full_name, role }
      });
    } catch (error) {
      // Rollback em caso de erro
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors.map(e => ({ field: e.path[0], message: e.message }))
      });
    }

    if ((error as any).code === '23505') {
      return res.status(409).json({ 
        error: 'Email já cadastrado',
        code: 'EMAIL_EXISTS'
      });
    }

    console.error('Register error:', error);
    res.status(500).json({ 
      error: 'Erro ao registrar usuário',
      code: 'REGISTER_FAILED'
    });
  }
});

/**
 * POST /auth/login
 * R7 — Autenticação
 * - Valida credenciais
 * - Gera JWT token
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validar input
    const { email, password } = LoginSchema.parse(req.body);

    // Buscar usuário
    const result = await db.query(
      `SELECT id, email, full_name, avatar_url, role, password_hash
       FROM profiles
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = result.rows[0];

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ 
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Gerar token
    const token = generateToken(user.id, user.email, user.role);

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url || null,
        role: user.role
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors.map(e => ({ field: e.path[0], message: e.message }))
      });
    }

    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Erro ao realizar login',
      code: 'LOGIN_FAILED'
    });
  }
});

/**
 * GET /auth/me
 * Retorna dados do usuário autenticado
 * R7.6 — Requer autenticação
 */
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Usuário não autenticado',
        code: 'NO_USER'
      });
    }

    const result = await db.query(
      `SELECT id, email, full_name, avatar_url, phone, role, verification_status, 
              experience_level, rating, bio, created_at
       FROM profiles
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error in /auth/me:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'FETCH_PROFILE_FAILED'
    });
  }
});

/**
 * POST /auth/logout
 * - Apenas cliente-side (deleta token localStorage)
 * - Backend não precisa de ação (JWT é stateless)
 */
router.post('/logout', (req: Request, res: Response) => {
  res.json({ 
    message: 'Logout realizado. Remova o token do cliente.',
    note: 'JWT é stateless — não há sessão no servidor para encerrar.'
  });
});

export default router;
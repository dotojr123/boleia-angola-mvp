// server/src/middleware/auth.ts - Middleware de autenticação JWT com RBAC

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ProfileValidator } from '../entities/Profile';
import type { UserRole } from '../types';

// Interface estendida de Request para incluir usuário autenticado
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    iat?: number;
    exp?: number;
  };
}

// Configuração do JWT
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRY = '7d'; // R7.4 — JWT expiry: 7 dias

/**
 * Middleware requireAuth - Verifica JWT e anexa usuário ao request
 * R7.6 — Todos os endpoints excepto (register, login, me) requerem JWT
 */
export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ 
      error: 'Acesso negado. Token não fornecido.',
      code: 'NO_TOKEN'
    });
    return;
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: UserRole;
      iat?: number;
      exp?: number;
    };
    
    req.user = verified;
    next();
  } catch (err) {
    const error = err as Error;
    
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ 
        error: 'Token expirado. Faça login novamente.',
        code: 'TOKEN_EXPIRED'
      });
      return;
    }

    if (error.name === 'JsonWebTokenError') {
      res.status(403).json({ 
        error: 'Token inválido.',
        code: 'INVALID_TOKEN'
      });
      return;
    }

    res.status(403).json({ 
      error: 'Falha na autenticação.',
      code: 'AUTH_FAILED'
    });
  }
};

/**
 * Middleware requireRole - Verifica se usuário tem role específica
 * R8.1-R8.3 — RBAC: PASSENGER, DRIVER, ADMIN
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Autenticação necessária.',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: `Permissão negada. Roles permitidas: ${allowedRoles.join(', ')}`,
        code: 'INSUFFICIENT_ROLE',
        allowed: allowedRoles,
        current: req.user.role
      });
      return;
    }

    next();
  };
};

/**
 * Middleware requireAdmin - Atalho para requireRole('admin')
 * R8.3 — Admin tem privilégios completos
 */
export const requireAdmin = requireRole('admin');

/**
 * Middleware requireDriver - Atalho para requireRole('driver', 'admin')
 * R8.2 — Driver pode fazer tudo que passenger + gerenciar veículos/viagens
 */
export const requireDriver = requireRole('driver', 'admin');

/**
 * Middleware requireOwner - Verifica se usuário é dono do recurso
 * R8.4 — Ownership check em todos os recursos editáveis
 */
export const requireOwnership = (
  resourceIdField: string = 'id',
  userIdField: string = 'owner_id'
) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Autenticação necessária.', code: 'AUTH_REQUIRED' });
      return;
    }

    try {
      const resource = req.params[resourceIdField] || req.body[resourceIdField];
      
      if (!resource) {
        res.status(400).json({ 
          error: `Campo ${resourceIdField} necessário para verificação de propriedade.`,
          code: 'MISSING_RESOURCE_ID'
        });
        return;
      }

      // Verificar se o resource appartient ao usuário
      // Isso será implementado nos módulos específicos (rides, vehicles, etc.)
      // Aqui apenas validamos que o ID do usuário no token é válido
      if (req.user.id !== resource) {
        res.status(403).json({ 
          error: 'Você não tem permissão para editar este recurso.',
          code: 'NOT_OWNER'
        });
        return;
      }

      next();
    } catch (err) {
      res.status(500).json({ 
        error: 'Erro ao verificar propriedade.',
        code: 'OWNERSHIP_CHECK_FAILED'
      });
    }
  };
};

/**
 * Utility: Verificar permissão de usuário para ação específica
 * R8.1-R8.4 — Regras de permissão por role
 */
export const checkPermission = (
  userRole: UserRole,
  action: 'create' | 'read' | 'update' | 'delete' | 'moderate',
  resourceType: 'ride' | 'booking' | 'vehicle' | 'review' | 'alert' | 'user'
): boolean => {
  // R8.1 — PASSENGER permissions
  if (userRole === 'passenger') {
    return action === 'read' || action === 'create' && resourceType === 'booking';
  }

  // R8.2 — DRIVER permissions (all passenger + create rides/manage vehicles)
  if (userRole === 'driver') {
    if (action === 'read') return true;
    if (action === 'create' && ['ride', 'vehicle', 'booking', 'review'].includes(resourceType)) return true;
    if (action === 'update' && ['ride', 'vehicle'].includes(resourceType)) return true;
    if (action === 'delete' && resourceType === 'ride') return true;
  }

  // R8.3 — ADMIN permissions (tudo)
  if (userRole === 'admin') {
    return true;
  }

  return false;
};

/**
 * Utility: Criar token JWT para usuário
 * R7.4 — JWT expiry: 7 dias
 * R7.5 — Salt rounds: 10
 */
export const generateToken = (userId: string, email: string, role: UserRole): string => {
  return jwt.sign(
    { id: userId, email, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
};

/**
 * Utility: Validar token (sem anexar ao request)
 */
export const validateToken = (token: string): { valid: boolean; user?: any; error?: string } => {
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    return { valid: true, user: verified };
  } catch (err) {
    const error = err as Error;
    return { 
      valid: false, 
      error: error.name === 'TokenExpiredError' ? 'Token expirado' : 'Token inválido' 
    };
  }
};

export default requireAuth;
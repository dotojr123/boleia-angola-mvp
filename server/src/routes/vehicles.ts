// server/src/routes/vehicles.ts - Módulo de Veículos (CRUD + Photos)

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import db from '../config/db';
import { requireAuth, requireRole } from '../middleware/auth';
import { VehicleSchema, Vehicle, VehicleCreateInput, VehicleUpdateInput } from '../entities/Vehicle';
import type { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Schemas de validação Zod
const VehicleCreateSchema = VehicleSchema.pick({
  make: true,
  model: true,
  year: true,
  color: true,
  plate: true,
  seats_capacity: true,
  category: true,
  comfort_level: true
}).partial().extend({
  make: z.string().min(2, 'Marca muito curta').max(50),
  model: z.string().min(2, 'Modelo muito curto').max(50),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1).optional(),
  color: z.string().min(2).max(20).optional(),
  plate: z.string().regex(/^[A-Z]{2}-\d{4}$/, 'Placa inválida. Formato: AA-0000').optional(),
  seats_capacity: z.number().int().min(2).max(15).default(4),
  category: z.enum(['economy', 'comfort', 'premium', 'van']).default('economy'),
  comfort_level: z.enum(['standard', 'premium', 'luxury']).default('standard')
});

const VehicleUpdateSchema = VehicleCreateSchema.partial();

const PhotoCreateSchema = z.object({
  photo_url: z.string().url('URL inválida'),
  is_primary: z.boolean().default(false)
});

// Interfaces
interface VehicleWithPhotos extends Vehicle {
  owner_name?: string;
  owner_avatar?: string;
  owner_phone?: string;
  owner_email?: string;
  photos?: any[];
}

/**
 * GET /api/vehicles
 * Listar veículos do usuário autenticado (ativos)
 */
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const result = await db.query(
      'SELECT * FROM vehicles WHERE owner_id = $1 AND is_active = true ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('[VEHICLES] Error listing vehicles:', error);
    res.status(500).json({ error: 'Erro ao buscar veículos', code: 'LIST_VEHICLES_FAILED' });
  }
});

/**
 * GET /api/vehicles/:id
 * Detalhes do veículo com fotos e owner info
 */
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { id } = req.params;

    // Buscar veículo com owner info
    const vehicleResult = await db.query(
      `SELECT v.*,
              p.full_name as owner_name,
              p.avatar_url as owner_avatar,
              p.phone as owner_phone,
              p.email as owner_email
       FROM vehicles v
       LEFT JOIN profiles p ON v.owner_id = p.id
       WHERE v.id = $1 AND v.is_active = true`,
      [id]
    );

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado', code: 'VEHICLE_NOT_FOUND' });
    }

    const vehicle = vehicleResult.rows[0] as VehicleWithPhotos;

    // Authorization check: owner ou admin
    if (vehicle.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para ver este veículo', code: 'INSUFFICIENT_ROLE' });
    }

    // Buscar fotos
    const photosResult = await db.query(
      'SELECT * FROM vehicle_photos WHERE vehicle_id = $1 ORDER BY is_primary DESC, created_at ASC',
      [id]
    );

    res.json({
      ...vehicle,
      photos: photosResult.rows
    });
  } catch (error) {
    console.error('[VEHICLES] Error fetching vehicle details:', error);
    res.status(500).json({ error: 'Erro ao buscar detalhes do veículo', code: 'FETCH_VEHICLE_FAILED' });
  }
});

/**
 * POST /api/vehicles
 * Criar novo veículo (apenas drivers e admins)
 */
router.post('/', requireAuth, requireRole('driver', 'admin'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    // Validar input
    const data = VehicleCreateSchema.parse(req.body);

    const query = `
      INSERT INTO vehicles (owner_id, make, model, year, color, plate, seats_capacity, category, comfort_level)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const { rows } = await db.query(query, [
      req.user.id,
      data.make,
      data.model,
      data.year || null,
      data.color || null,
      data.plate || null,
      data.seats_capacity ?? 4,
      data.category ?? 'economy',
      data.comfort_level ?? 'standard'
    ]);

    res.status(201).json(rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors.map(e => ({ field: e.path[0], message: e.message }))
      });
    }

    if ((error as any).code === '23505') {
      return res.status(409).json({ error: 'Placa já cadastrada', code: 'PLATE_EXISTS' });
    }

    console.error('[VEHICLES] Error creating vehicle:', error);
    res.status(500).json({ error: 'Erro ao cadastrar veículo', code: 'CREATE_VEHICLE_FAILED' });
  }
});

/**
 * PUT /api/vehicles/:id
 * Atualizar veículo (apenas owner ou admin)
 */
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { id } = req.params;
    const data = VehicleUpdateSchema.parse(req.body);

    // Verificar propriedade
    const vehicleCheck = await db.query('SELECT owner_id FROM vehicles WHERE id = $1', [id]);

    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado', code: 'VEHICLE_NOT_FOUND' });
    }

    if (vehicleCheck.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para editar este veículo', code: 'NOT_OWNER' });
    }

    // Construir UPDATE dinâmico apenas com campos fornecidos
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 2;

    if (data.make !== undefined) { updates.push(`make = $${paramIndex++}`); values.push(data.make); }
    if (data.model !== undefined) { updates.push(`model = $${paramIndex++}`); values.push(data.model); }
    if (data.year !== undefined) { updates.push(`year = $${paramIndex++}`); values.push(data.year); }
    if (data.color !== undefined) { updates.push(`color = $${paramIndex++}`); values.push(data.color); }
    if (data.plate !== undefined) { updates.push(`plate = $${paramIndex++}`); values.push(data.plate); }
    if (data.seats_capacity !== undefined) { updates.push(`seats_capacity = $${paramIndex++}`); values.push(data.seats_capacity); }
    if (data.category !== undefined) { updates.push(`category = $${paramIndex++}`); values.push(data.category); }
    if (data.comfort_level !== undefined) { updates.push(`comfort_level = $${paramIndex++}`); values.push(data.comfort_level); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar', code: 'NO_FIELDS_TO_UPDATE' });
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    const query = `
      UPDATE vehicles
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const { rows } = await db.query(query, values);

    res.json(rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors.map(e => ({ field: e.path[0], message: e.message }))
      });
    }

    if ((error as any).code === '23505') {
      return res.status(409).json({ error: 'Placa já cadastrada', code: 'PLATE_EXISTS' });
    }

    console.error('[VEHICLES] Error updating vehicle:', error);
    res.status(500).json({ error: 'Erro ao atualizar veículo', code: 'UPDATE_VEHICLE_FAILED' });
  }
});

/**
 * DELETE /api/vehicles/:id
 * Soft delete do veículo (set is_active = false)
 */
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { id } = req.params;

    // Verificar propriedade
    const vehicleCheck = await db.query('SELECT owner_id FROM vehicles WHERE id = $1', [id]);

    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado', code: 'VEHICLE_NOT_FOUND' });
    }

    if (vehicleCheck.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para remover este veículo', code: 'NOT_OWNER' });
    }

    // Soft delete
    await db.query('UPDATE vehicles SET is_active = false, updated_at = NOW() WHERE id = $1', [id]);

    res.json({ message: 'Veículo removido com sucesso' });
  } catch (error) {
    console.error('[VEHICLES] Error deleting vehicle:', error);
    res.status(500).json({ error: 'Erro ao remover veículo', code: 'DELETE_VEHICLE_FAILED' });
  }
});

/**
 * POST /api/vehicles/:id/photos
 * Adicionar foto ao veículo
 */
router.post('/:id/photos', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { id } = req.params;
    const { photo_url, is_primary } = PhotoCreateSchema.parse(req.body);

    // Verificar propriedade
    const vehicleCheck = await db.query(
      'SELECT owner_id FROM vehicles WHERE id = $1 AND is_active = true',
      [id]
    );

    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado', code: 'VEHICLE_NOT_FOUND' });
    }

    if (vehicleCheck.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para adicionar fotos', code: 'NOT_OWNER' });
    }

    // Se é primary, desmarcar outras
    if (is_primary) {
      await db.query('UPDATE vehicle_photos SET is_primary = false WHERE vehicle_id = $1', [id]);
    }

    const { rows } = await db.query(
      `INSERT INTO vehicle_photos (vehicle_id, photo_url, is_primary)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, photo_url, is_primary]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors.map(e => ({ field: e.path[0], message: e.message }))
      });
    }

    console.error('[VEHICLES] Error uploading photo:', error);
    res.status(500).json({ error: 'Erro ao fazer upload da foto', code: 'UPLOAD_PHOTO_FAILED' });
  }
});

/**
 * GET /api/vehicles/:id/photos
 * Listar fotos do veículo
 */
router.get('/:id/photos', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { id } = req.params;

    // Verificar acesso
    const vehicleCheck = await db.query(
      'SELECT owner_id FROM vehicles WHERE id = $1 AND is_active = true',
      [id]
    );

    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado', code: 'VEHICLE_NOT_FOUND' });
    }

    if (vehicleCheck.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para ver fotos', code: 'NOT_OWNER' });
    }

    const { rows } = await db.query(
      'SELECT * FROM vehicle_photos WHERE vehicle_id = $1 ORDER BY is_primary DESC, created_at ASC',
      [id]
    );

    res.json(rows);
  } catch (error) {
    console.error('[VEHICLES] Error fetching photos:', error);
    res.status(500).json({ error: 'Erro ao buscar fotos', code: 'FETCH_PHOTOS_FAILED' });
  }
});

/**
 * DELETE /api/vehicles/:id/photos/:photoId
 * Remover foto do veículo
 */
router.delete('/:id/photos/:photoId', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária', code: 'AUTH_REQUIRED' });
    }

    const { id, photoId } = req.params;

    // Verificar propriedade do veículo
    const vehicleCheck = await db.query(
      'SELECT owner_id FROM vehicles WHERE id = $1 AND is_active = true',
      [id]
    );

    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado', code: 'VEHICLE_NOT_FOUND' });
    }

    if (vehicleCheck.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para remover fotos', code: 'NOT_OWNER' });
    }

    // Verificar se foto existe
    const photoCheck = await db.query(
      'SELECT image_url FROM vehicle_photos WHERE id = $1 AND vehicle_id = $2',
      [photoId, id]
    );

    if (photoCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Foto não encontrada', code: 'PHOTO_NOT_FOUND' });
    }

    // Remover foto
    await db.query('DELETE FROM vehicle_photos WHERE id = $1', [photoId]);

    res.json({ message: 'Foto removida com sucesso' });
  } catch (error) {
    console.error('[VEHICLES] Error deleting photo:', error);
    res.status(500).json({ error: 'Erro ao remover foto', code: 'DELETE_PHOTO_FAILED' });
  }
});

export default router;
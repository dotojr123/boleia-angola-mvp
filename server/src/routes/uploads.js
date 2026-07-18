const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/db');
const auth = require('../middleware/auth');
const fs = require('fs');

const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');
const ensureUploadDir = (subdir) => {
  const dir = path.join(uploadsRoot, subdir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const imageFileFilter = (req, file, cb) => {
  if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.mimetype)) {
    return cb(new Error('Apenas imagens JPG, PNG, GIF ou WebP são permitidas'));
  }
  cb(null, true);
};

// Configurar armazenamento local para avatares
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ensureUploadDir('avatars'));
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar-${req.user.id}-${Date.now()}${extension}`);
  }
});

// Configurar armazenamento local para documentos
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ensureUploadDir('documents'));
  },
  filename: (req, file, cb) => {
    const type = req.params.type || 'doc';
    cb(null, `doc-${type}-${req.user?.id || 'anonymous'}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: imageFileFilter
});

const uploadDocument = multer({
  storage: documentStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// POST /api/uploads/avatar
router.post('/avatar', auth, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    await db.query('UPDATE profiles SET avatar_url = $1, updated_at = NOW() WHERE id = $2', [avatarUrl, req.user.id]);

    res.json({
      message: 'Foto de perfil atualizada',
      avatar_url: avatarUrl
    });
  } catch (err) {
    console.error('Error uploading avatar:', err);
    const status = err.code === 'LIMIT_FILE_SIZE' || err.message?.includes('Apenas imagens') ? 400 : 500;
    res.status(status).json({
      error: err.code === 'LIMIT_FILE_SIZE' ? 'A imagem deve ter no máximo 2MB' : (err.message || 'Erro ao processar upload')
    });
  }
});

// POST /api/uploads/documents/:type
router.post('/documents/:type', auth, uploadDocument.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

    const { type } = req.params;
    const validTypes = ['bi', 'carta', 'passport', 'residence'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Tipo de documento inválido' });
    }

    const documentUrl = `/uploads/documents/${req.file.filename}`;

    // Salvar registro do documento no banco
    const { rows } = await db.query(
      `INSERT INTO documents (user_id, document_type, document_url, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [req.user.id, type, documentUrl]
    );

    res.status(201).json({
      message: 'Documento enviado com sucesso',
      document: rows[0],
      document_url: documentUrl
    });
  } catch (err) {
    console.error('Error uploading document:', err);
    res.status(500).json({ error: 'Erro ao fazer upload do documento' });
  }
});

// GET /api/uploads/documents - Listar documentos do usuário
router.get('/documents', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json(rows);
  } catch (err) {
    console.error('Error fetching documents:', err);
    res.status(500).json({ error: 'Erro ao buscar documentos' });
  }
});

module.exports = router;

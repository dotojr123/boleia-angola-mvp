const path = require('path');

// MIME types permitidos
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png'
];

// Extensões permitidas
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

// Tamanhos máximos (em bytes)
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Valida upload de avatar
 */
function validateAvatar(file) {
  const errors = [];

  if (!file) {
    errors.push('Nenhum arquivo enviado');
    return errors;
  }

  // Validar tamanho
  if (file.size > MAX_AVATAR_SIZE) {
    errors.push(`Arquivo muito grande. Máximo: 2MB`);
  }

  // Validar MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    errors.push(`Tipo de arquivo não permitido. Aceitos: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
  }

  // Validar extensão
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    errors.push(`Extensão não permitida. Aceitas: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`);
  }

  return errors;
}

/**
 * Valida upload de documento
 */
function validateDocument(file, type) {
  const errors = [];

  if (!file) {
    errors.push('Nenhum arquivo enviado');
    return errors;
  }

  // Validar tamanho
  if (file.size > MAX_DOCUMENT_SIZE) {
    errors.push(`Arquivo muito grande. Máximo: 5MB`);
  }

  // Validar MIME type
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
    errors.push(`Tipo de arquivo não permitido. Aceitos: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`);
  }

  // Validar extensão
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(ext)) {
    errors.push(`Extensão não permitida. Aceitas: ${ALLOWED_DOCUMENT_EXTENSIONS.join(', ')}`);
  }

  // Validar tipo de documento
  const validTypes = ['bi', 'carta', 'passport', 'residence'];
  if (!validTypes.includes(type)) {
    errors.push(`Tipo de documento inválido. Aceitos: ${validTypes.join(', ')}`);
  }

  return errors;
}

/**
 * Middleware para validar avatar
 */
function avatarValidator(req, res, next) {
  const file = req.file;
  const errors = validateAvatar(file);

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join('. ') });
  }

  next();
}

/**
 * Middleware para validar documento
 */
function documentValidator(req, res, next) {
  const file = req.file;
  const type = req.params.type;
  const errors = validateDocument(file, type);

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join('. ') });
  }

  next();
}

module.exports = {
  validateAvatar,
  validateDocument,
  avatarValidator,
  documentValidator,
  MAX_AVATAR_SIZE,
  MAX_DOCUMENT_SIZE
};

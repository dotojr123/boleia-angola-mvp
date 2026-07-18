const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { apiLimiter, authLimiter, loginLimiter } = require('./middleware/rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting behind nginx
app.set('trust proxy', 1);

// CORS configuration - RESTRITO para produção
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS || 'https://boleia-angola.com').split(',')
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 horas
};

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "http:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 ano
    includeSubDomains: true,
    preload: true
  },
  xFrameOptions: { action: 'deny' },
  xContentTypeOptions: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

app.use(cors(corsOptions));

// Prevent caching for API responses
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
});

// Rate limiting global
app.use(apiLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

const uploadsDir = path.join(__dirname, '..', 'uploads');

// Servir arquivos estáticos de upload (avatars, documentos)
// Os uploads são salvos em server/uploads/ e as URLs retornadas são /uploads/avatars/xxx.jpg
app.use('/uploads', express.static(uploadsDir, {
  maxAge: '7d',
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// Health check (sem rate limit)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
const authRoutes = require('./routes/auth');
const ridesRoutes = require('./routes/rides');
const profilesRoutes = require('./routes/profiles');
const bookingsRoutes = require('./routes/bookings');
const vehiclesRoutes = require('./routes/vehicles');
const messagesRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');
const reviewsRoutes = require('./routes/reviews');
const driverRoutes = require('./routes/driver');
const uploadsRoutes = require('./routes/uploads');
const notificationsRoutes = require('./routes/notifications');
const alertsRoutes = require('./routes/alerts');

// Rate limit específico para autenticação
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/rides', ridesRoutes);
app.use('/api/profiles', profilesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/alerts', alertsRoutes);

// Health check
app.get('/', (req, res) => {
res.json({ message: 'Boleia Angola API v1.0', status: 'ok' });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Global error handler
app.use((err, req, res, next) => {
console.error('Unhandled error:', err);
res.status(500).json({ error: 'Erro interno do servidor' });
});

// Start Server (only if not in test mode)
const startServer = () => {
app.listen(PORT, '0.0.0.0', () => {
const ip = '76.13.230.121';
console.log(`🚀 Boleia Angola API running on port ${PORT}`);
console.log(`📍 Local: http://localhost:${PORT}/`);
console.log(`🌐 Public: http://${ip}:${PORT}/`);
console.log(`📚 API base: http://${ip}:${PORT}/api`);
});
};

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
startServer();
}

// Export for testing
module.exports = app;

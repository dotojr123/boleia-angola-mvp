// server/test-utils/setup.js - Setup global para testes

// Mock do banco de dados
global.mockDb = {
  query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  reset: () => {
    global.mockDb.query.mockClear();
    global.mockDb.query.mockResolvedValue({ rows: [], rowCount: 0 });
  }
};

// Exportar função de reset global
global.resetMockDb = () => global.mockDb.reset();

// Mock global de db
jest.mock('../src/config/db', () => ({
  __esModule: true,
  default: global.mockDb
}));

// Configurações de ambiente para teste
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/boleia_test';

// Limpeza global antes de cada teste
beforeEach(() => {
  jest.clearAllMocks();
  if (global.mockDb && global.mockDb.query) {
    global.mockDb.query.mockClear();
  }
});
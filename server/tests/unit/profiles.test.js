const request = require('supertest');

describe('Profiles API - Validação de Telefone', () => {
  const mockPool = { query: jest.fn() };

  jest.mock('../../src/config/db', () => ({
    pool: mockPool,
  }));

  jest.mock('../../src/middleware/auth', () => (req, res, next) => {
    req.user = { id: '123', role: 'passenger' };
    next();
  });

  const app = require('../../src/index');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PUT /api/profiles/:id', () => {
    it('deve aceitar telefone válido com +244', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: '123', phone: '+244923456789' }],
      });

      await request(app)
        .put('/api/profiles/123')
        .send({ phone: '+244923456789' })
        .expect(200);
    });

    it('deve aceitar telefone válido começando com 9', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: '123', phone: '923456789' }],
      });

      await request(app)
        .put('/api/profiles/123')
        .send({ phone: '923456789' })
        .expect(200);
    });

    it('deve aceitar telefone com formatação', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: '123', phone: '+244 923-456-789' }],
      });

      await request(app)
        .put('/api/profiles/123')
        .send({ phone: '+244 923-456-789' })
        .expect(200);
    });

    it('deve rejeitar telefone inválido', async () => {
      await request(app)
        .put('/api/profiles/123')
        .send({ phone: '123456' })
        .expect(400);
    });

    it('deve rejeitar telefone com prefixo errado', async () => {
      await request(app)
        .put('/api/profiles/123')
        .send({ phone: '+243923456789' })
        .expect(400);
    });
  });
});
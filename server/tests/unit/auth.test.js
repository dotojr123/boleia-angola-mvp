const request = require('supertest');

// Import app after global mock is set up via setupFilesAfterEnv
const app = require('../../src/index');

describe('Auth API', () => {
  // Limpar mocks entre testes
  beforeEach(() => {
    global.resetMockDb();
  });

  describe('POST /api/auth/register', () => {
    it('deve registrar um novo usuário com sucesso', async () => {
      const newUser = {
        email: 'test@example.com',
        password: 'senha123',
        full_name: 'Test User',
        phone: '+244923456789',
      };

      // Mock sequence: userCheck (empty) -> BEGIN -> INSERT -> COMMIT
      global.mockDb.query
        .mockResolvedValueOnce({ rows: [] })  // userCheck - no existing user
        .mockResolvedValueOnce({})             // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: '123', ...newUser }] })  // INSERT
        .mockResolvedValueOnce({});            // COMMIT

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id', '123');
      expect(response.body.user).toHaveProperty('email', newUser.email);
    });

    it('deve retornar erro para email inválido', async () => {
      const invalidUser = {
        email: 'email-invalido',
        password: 'senha123',
        full_name: 'Test User',
      };

      await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);
    });

    it('deve retornar erro para senha fraca', async () => {
      const weakPassword = {
        email: 'test@example.com',
        password: '123',
        full_name: 'Test User',
      };

      await request(app)
        .post('/api/auth/register')
        .send(weakPassword)
        .expect(400);
    });

    it('deve retornar erro para usuário duplicado', async () => {
      const duplicateUser = {
        email: 'existing@example.com',
        password: 'senha123',
        full_name: 'Test User',
      };

      global.mockDb.query.mockRejectedValueOnce({
        code: '23505', // Unique violation
      });

      await request(app)
        .post('/api/auth/register')
        .send(duplicateUser)
        .expect(409);
    });

    describe('Validação de Telefone Angola', () => {
      const setupRegisterMock = (userData) => {
        global.mockDb.query
          .mockResolvedValueOnce({ rows: [] })  // userCheck
          .mockResolvedValueOnce({})             // BEGIN
          .mockResolvedValueOnce({ rows: [{ id: '123', ...userData }] })  // INSERT
          .mockResolvedValueOnce({});            // COMMIT
      };

      it('deve aceitar telefone válido com +244', async () => {
        const validUser = {
          email: 'test@example.com',
          password: 'senha123',
          full_name: 'Test User',
          phone: '+244923456789',
        };

        setupRegisterMock(validUser);

        await request(app)
          .post('/api/auth/register')
          .send(validUser)
          .expect(201);
      });

      it('deve aceitar telefone válido começando com 9', async () => {
        const validUser = {
          email: 'test@example.com',
          password: 'senha123',
          full_name: 'Test User',
          phone: '9234567890',
        };

        setupRegisterMock(validUser);

        await request(app)
          .post('/api/auth/register')
          .send(validUser)
          .expect(201);
      });

      it('deve aceitar telefone com formatação (espaços, hífens)', async () => {
        const validUser = {
          email: 'test@example.com',
          password: 'senha123',
          full_name: 'Test User',
          phone: '+244 923-456-789',
        };

        setupRegisterMock(validUser);

        await request(app)
          .post('/api/auth/register')
          .send(validUser)
          .expect(201);
      });

      it('deve rejeitar telefone com formato inválido', async () => {
        const invalidUser = {
          email: 'test@example.com',
          password: 'senha123',
          full_name: 'Test User',
          phone: '123456', // Muito curto
        };

        await request(app)
          .post('/api/auth/register')
          .send(invalidUser)
          .expect(400);
      });

      it('deve rejeitar telefone com prefixo inválido', async () => {
        const invalidUser = {
          email: 'test@example.com',
          password: 'senha123',
          full_name: 'Test User',
          phone: '+243923456789', // Prefixo errado (RDC)
        };

        await request(app)
          .post('/api/auth/register')
          .send(invalidUser)
          .expect(400);
      });

      it('deve aceitar registro sem telefone (opcional)', async () => {
        const noPhoneUser = {
          email: 'test@example.com',
          password: 'senha123',
          full_name: 'Test User',
        };

        setupRegisterMock(noPhoneUser);

        await request(app)
          .post('/api/auth/register')
          .send(noPhoneUser)
          .expect(201);
      });
    });
  });

  describe('POST /api/auth/login', () => {
    it('deve fazer login com sucesso', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'senha123',
      };

      global.mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: '123',
            email: credentials.email,
            password_hash: 'hashed_password',
            role: 'passenger',
            full_name: 'Test User',
            avatar_url: null,
          },
        ],
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', credentials.email);
    });

    it('deve retornar erro para email não encontrado', async () => {
      const credentials = {
        email: 'nao-existe@example.com',
        password: 'senha123',
      };

      global.mockDb.query.mockResolvedValueOnce({ rows: [] });

      await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);
    });

    it('deve retornar erro para senha incorreta', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'senha-errada',
      };

      global.mockDb.query.mockResolvedValueOnce({
        rows: [{ 
          id: '123', 
          email: credentials.email,
          password_hash: 'hashed_password',
        }],
      });

      await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);
    });
  });
});
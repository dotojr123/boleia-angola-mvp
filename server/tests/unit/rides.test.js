const request = require('supertest');

describe('Rides API', () => {
  // Setup mock db module
  const mockQuery = jest.fn();
  const mockPool = { query: mockQuery };

  // Mock database module
  jest.mock('../../src/config/db', () => ({
    query: mockQuery,
    pool: mockPool,
  }));

  // Import app after mocking db
  const app = require('../../src/index');

  const authToken = 'Bearer test_token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/rides', () => {
    it('deve listar viagens com filtros', async () => {
      const filters = {
        origin: 'Luanda',
        destination: 'Benguela',
        date: '2026-04-20',
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'ride-1',
            origin: filters.origin,
            destination: filters.destination,
            departure_time: '2026-04-20T08:00:00Z',
            price_per_seat: 5000,
            available_seats: 3,
          },
        ],
      });

      const response = await request(app)
        .get('/api/rides')
        .query(filters)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty('id', 'ride-1');
    });

    it('deve retornar lista vazia se não houver viagens', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/rides?origin=Luanda&destination=Benguela')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/rides/:id', () => {
    it('deve buscar detalhes da viagem', async () => {
      const rideId = 'ride-123';

      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: rideId,
            origin: 'Luanda',
            destination: 'Benguela',
            departure_time: '2026-04-20T08:00:00Z',
            price_per_seat: 5000,
            driver_name: 'João Silva',
          },
        ],
      });

      const response = await request(app)
        .get(`/api/rides/${rideId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', rideId);
      expect(response.body).toHaveProperty('driver_name');
    });

    it('deve retornar 404 para viagem inexistente', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await request(app)
        .get('/api/rides/invalid-id')
        .expect(404);
    });
  });

  describe('POST /api/rides', () => {
    it('deve criar nova viagem', async () => {
      const newRide = {
        origin: 'Luanda',
        destination: 'Benguela',
        departure_time: '2026-04-20T08:00:00Z',
        price_per_seat: 5000,
        seats: 4,
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'new-ride', ...newRide }],
      });

      const response = await request(app)
        .post('/api/rides')
        .set('Authorization', authToken)
        .send(newRide)
        .expect(201);

      expect(response.body).toHaveProperty('id', 'new-ride');
      expect(response.body).toMatchObject(newRide);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const newRide = {
        origin: 'Luanda',
        destination: 'Benguela',
        departure_time: '2026-04-20T08:00:00Z',
      };

      await request(app)
        .post('/api/rides')
        .send(newRide)
        .expect(401);
    });
  });
});

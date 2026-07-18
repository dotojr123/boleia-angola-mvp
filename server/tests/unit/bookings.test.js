const request = require('supertest');

describe('Bookings API', () => {
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

  describe('GET /api/bookings', () => {
    it('deve listar reservas do usuário', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'booking-1',
            ride_id: 'ride-1',
            passenger_id: 'user-1',
            status: 'confirmed',
            seats_booked: 2,
            total_price: 10000,
          },
        ],
      });

      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('id', 'booking-1');
    });
  });

  describe('POST /api/bookings', () => {
    it('deve criar nova reserva', async () => {
      const newBooking = {
        ride_id: 'ride-1',
        seats_booked: 2,
      };

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'new-booking', ...newBooking }],
      });

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', authToken)
        .send(newBooking)
        .expect(201);

      expect(response.body).toHaveProperty('id', 'new-booking');
    });

    it('deve retornar erro se assentos indisponíveis', async () => {
      const newBooking = {
        ride_id: 'ride-1',
        seats_booked: 10,
      };

      mockQuery.mockResolvedValueOnce({
        rows: [{ available_seats: 2 }],
      });

      await request(app)
        .post('/api/bookings')
        .set('Authorization', authToken)
        .send(newBooking)
        .expect(400);
    });
  });

  describe('PATCH /api/bookings/:id/status', () => {
    it('deve atualizar status da reserva', async () => {
      const bookingId = 'booking-1';
      const statusUpdate = { status: 'confirmed' };

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: bookingId, status: 'confirmed' }],
      });

      const response = await request(app)
        .patch(`/api/bookings/${bookingId}/status`)
        .set('Authorization', authToken)
        .send(statusUpdate)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'confirmed');
    });

    it('deve retornar erro para status inválido', async () => {
      await request(app)
        .patch('/api/bookings/booking-1/status')
        .set('Authorization', authToken)
        .send({ status: 'invalid-status' })
        .expect(400);
    });
  });
});

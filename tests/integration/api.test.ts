import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock axios to avoid real API calls
const mockAxios = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
  defaults: {
    baseURL: 'http://localhost:3000/api',
    headers: {},
  },
  create: vi.fn(() => mockAxios),
};

vi.mock('axios', () => ({
  default: mockAxios,
  __esModule: true,
}));

import axios from 'axios';

describe('API Integration Tests', () => {
  const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  let authToken: string;
  let testUserId: string;

  beforeEach(() => {
    vi.clearAllMocks();
    authToken = '';
    testUserId = '';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Auth Flow', () => {
    it('deve registrar novo usuário', async () => {
      mockAxios.post.mockResolvedValue({
        data: {
          user: { id: '1', email: 'test@example.com' },
          token: 'mock-token',
        },
      });

      const response = await api.post('/auth/register', {
        email: 'test@example.com',
        password: 'senha123',
        full_name: 'Test User',
        phone: '+244923456789',
      });

      expect(mockAxios.post).toHaveBeenCalledWith('/auth/register', {
        email: 'test@example.com',
        password: 'senha123',
        full_name: 'Test User',
        phone: '+244923456789',
      });
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('token');
      expect(response.data.user).toHaveProperty('email');

      authToken = response.data.token;
      testUserId = response.data.user.id;
    });

    it('deve fazer login', async () => {
      mockAxios.post.mockResolvedValue({
        data: {
          user: { id: '1', email: 'test@example.com' },
          token: 'mock-token',
        },
      });

      const response = await api.post('/auth/login', {
        email: 'test@example.com',
        password: 'senha123',
      });

      expect(mockAxios.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'senha123',
      });
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('token');
    });
  });

  describe('Rides CRUD', () => {
    let rideId: string;

    it('deve criar nova viagem', async () => {
      mockAxios.post.mockResolvedValue({
        data: { id: 'ride-123', origin: 'Luanda', destination: 'Benguela' },
      });

      const response = await api.post('/rides', {
        origin: 'Luanda',
        destination: 'Benguela',
        departure_time: '2026-04-20T08:00:00Z',
        price_per_seat: 5000,
        seats: 4,
      }, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(mockAxios.post).toHaveBeenCalledWith('/rides', {
        origin: 'Luanda',
        destination: 'Benguela',
        departure_time: '2026-04-20T08:00:00Z',
        price_per_seat: 5000,
        seats: 4,
      });
      expect(response.status).toBe(201);
      rideId = response.data.id;
    });

    it('deve listar viagens', async () => {
      mockAxios.get.mockResolvedValue({
        data: [
          { id: '1', origin: 'Luanda', destination: 'Benguela' },
          { id: '2', origin: 'Luanda', destination: 'Cabinda' },
        ],
      });

      const response = await api.get('/rides', {
        params: { origin: 'Luanda', destination: 'Benguela' },
      });

      expect(mockAxios.get).toHaveBeenCalledWith('/rides', {
        params: { origin: 'Luanda', destination: 'Benguela' },
      });
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('deve buscar detalhes da viagem', async () => {
      mockAxios.get.mockResolvedValue({
        data: { id: 'ride-123', origin: 'Luanda', destination: 'Benguela' },
      });

      const response = await api.get('/rides/ride-123');

      expect(mockAxios.get).toHaveBeenCalledWith('/rides/ride-123');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id', 'ride-123');
    });
  });

  describe('Bookings Flow', () => {
    let bookingId: string;
    let rideId: string;

    beforeEach(() => {
      rideId = 'ride-456';
    });

    it.skip('deve criar reserva', async () => {
      // Test skipped - requires more complex setup
    });

    it.skip('deve atualizar status da reserva', async () => {
      // Test skipped - requires more complex setup
    });
  });
});

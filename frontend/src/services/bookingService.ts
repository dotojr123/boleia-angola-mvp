import api from './api';

export interface Booking {
  id: string;
  ride_id: string;
  ride?: {
    id: string;
    driver_name: string;
    vehicle: string;
    origin_city: string;
    destination_city: string;
    departure_time: string;
    arrival_time?: string;
    price_per_seat: number;
  };
  passenger_id: string;
  seats: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  booked_at: string;
  updated_at: string;
}

export const bookingService = {
  // Criar reserva
  create: async (ride_id: string, seats: number) => {
    const response = await api.post('/bookings', { ride_id, seats_booked: seats });
    return response.data;
  },

  // Obter detalhes de uma reserva
  getById: async (id: string) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  // Listar reservas do passageiro logado
  listMyBookings: async () => {
    const response = await api.get('/bookings/passenger');
    return { bookings: response.data };
  },

  // Listar reservas de uma viagem (apenas motorista/admin)
  listByRide: async (ride_id: string) => {
    const response = await api.get(`/bookings/ride/${ride_id}`);
    return response.data;
  },

  // Atualizar status da reserva (apenas motorista/admin)
  updateStatus: async (id: string, status: 'confirmed' | 'rejected' | 'cancelled') => {
    const response = await api.patch(`/bookings/${id}/status`, { status });
    return response.data;
  },

  // Cancelar reserva (apenas passageiro)
  cancel: async (id: string) => {
    const response = await api.post(`/bookings/${id}/cancel`);
    return response.data;
  },
};

export default bookingService;
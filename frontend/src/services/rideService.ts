import api from './api';

export interface Ride {
  id: string;
  driver_id: string;
  driver_name?: string;
  driver_rating?: number;
  vehicle_id?: string;
  vehicle?: string;
  origin_city: string;
  origin_point?: string;
  destination_city: string;
  destination_point?: string;
  departure_time: string;
  arrival_time?: string;
  price_per_seat: number;
  available_seats: number;
  total_seats: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  description?: string;
  amenities?: string[];
  currency?: 'Kz';
  created_at: string;
  updated_at: string;
}

export interface RideFilters {
  origin_city?: string;
  destination_city?: string;
  departure_date?: string;
  min_price?: number;
  max_price?: number;
  min_seats?: number;
}

export const rideService = {
  // Buscar viagens disponíveis
  search: async (filters: RideFilters) => {
    const params = new URLSearchParams();
    if (filters.origin_city) params.append('origin', filters.origin_city);
    if (filters.destination_city) params.append('destination', filters.destination_city);
    if (filters.departure_date) params.append('date', filters.departure_date);
    if (filters.min_seats) params.append('seats', String(filters.min_seats));

    const response = await api.get(`/rides/search?${params.toString()}`);
    return response.data;
  },

  // Obter detalhes de uma viagem
  getById: async (id: string) => {
    const response = await api.get(`/rides/${id}`);
    return { ride: response.data };
  },

  // Criar viagem (apenas drivers)
  create: async (data: Partial<Ride>) => {
    const response = await api.post('/rides', data);
    return response.data;
  },

  // Atualizar viagem (apenas proprietário)
  update: async (id: string, data: Partial<Ride>) => {
    const response = await api.patch(`/rides/${id}`, data);
    return response.data;
  },

  // Cancelar viagem
  cancel: async (id: string) => {
    const response = await api.post(`/rides/${id}/cancel`);
    return response.data;
  },

  // Listar viagens do motorista logado
  listMyRides: async () => {
    const response = await api.get('/rides/my-rides');
    return response.data;
  },

  // Completar viagem
  complete: async (id: string) => {
    const response = await api.post(`/rides/${id}/complete`);
    return response.data;
  },
};

export default rideService;
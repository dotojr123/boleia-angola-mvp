import axios from 'axios';

// Configuração base da API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor para adicionar token JWT automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para lidar com erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Não redirecionar aqui; deixar o componente tratar
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  // Registrar novo usuário
  register: async (data: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role?: 'passenger' | 'driver';
  }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  // Login
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Obter perfil atual
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Verificar se usuário está logado
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Obter usuário atual
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

// Profile services
export const profileService = {
  // Atualizar perfil
  updateProfile: async (data: Partial<any>) => {
    const response = await api.patch('/profiles/me', data);
    return response.data;
  },

  // Upload de documento para verificação
  uploadDocument: async (document_type: string, document_url: string) => {
    const response = await api.patch('/profiles/me/verify-documents', {
      document_type,
      document_url,
    });
    return response.data;
  },

  // Listar documentos
  getDocuments: async () => {
    const response = await api.get('/profiles/me/documents');
    return response.data;
  },
};

// Vehicle services
export const vehicleService = {
  // Listar veículos do motorista
  list: async () => {
    const response = await api.get('/vehicles');
    return response.data;
  },

  // Obter detalhes de um veículo
  getById: async (id: string) => {
    const response = await api.get(`/vehicles/${id}`);
    return response.data;
  },

  // Criar veículo
  create: async (data: {
    make: string;
    model: string;
    year: number;
    color: string;
    license_plate: string;
    capacity: number;
  }) => {
    const response = await api.post('/vehicles', data);
    return response.data;
  },

  // Atualizar veículo
  update: async (id: string, data: Partial<any>) => {
    const response = await api.patch(`/vehicles/${id}`, data);
    return response.data;
  },

  // Excluir veículo
  delete: async (id: string) => {
    const response = await api.delete(`/vehicles/${id}`);
    return response.data;
  },
};

// Message services
export const messageService = {
  // Obter conversas do usuário
  getConversations: async () => {
    const response = await api.get('/messages/conversations');
    return response.data;
  },

  // Obter mensagens de uma conversa
  getMessages: async (user_id: string) => {
    const response = await api.get(`/messages/${user_id}`);
    return response.data;
  },

  // Enviar mensagem
  send: async (recipient_id: string, content: string) => {
    const response = await api.post('/messages', { recipient_id, content });
    return response.data;
  },
};

// Notification services
export const notificationService = {
  // Listar notificações
  list: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  // Marcar como lida
  markAsRead: async (id: string) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  // Marcar todas como lidas
  markAllAsRead: async () => {
    const response = await api.post('/notifications/mark-all-read');
    return response.data;
  },
};

// Alert services
export const alertService = {
  // Listar alertas (admin)
  list: async () => {
    const response = await api.get('/alerts');
    return response.data;
  },

  // Criar alerta
  create: async (data: {
    target_user_id: string;
    alert_type: string;
    description: string;
  }) => {
    const response = await api.post('/alerts', data);
    return response.data;
  },

  // Atualizar status do alerta
  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/alerts/${id}/status`, { status });
    return response.data;
  },
};

// Review services
export const reviewService = {
  // Listar avaliações de um usuário
  getByUser: async (user_id: string) => {
    const response = await api.get(`/reviews/user/${user_id}`);
    return response.data;
  },

  // Criar avaliação
  create: async (data: {
    target_user_id: string;
    booking_id: string;
    rating: number;
    comment?: string;
  }) => {
    const response = await api.post('/reviews', data);
    return response.data;
  },

  // Obter média de avaliação
  getAverage: async (user_id: string) => {
    const response = await api.get(`/reviews/user/${user_id}/average`);
    return response.data;
  },
};

// Admin services
export const adminService = {
  // Listar usuários
  listUsers: async (filters?: { role?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.status) params.append('status', filters.status);
    const response = await api.get(`/admin/users?${params.toString()}`);
    return response.data;
  },

  // Atualizar papel de usuário
  updateUserRole: async (user_id: string, role: string) => {
    const response = await api.patch(`/admin/users/${user_id}/role`, { role });
    return response.data;
  },

  // Bloquear/desbloquear usuário
  toggleUserStatus: async (user_id: string) => {
    const response = await api.post(`/admin/users/${user_id}/toggle-status`);
    return response.data;
  },

  // Listar todas as viagens (admin)
  listAllRides: async () => {
    const response = await api.get('/admin/rides');
    return response.data;
  },

  // Listar todas as reservas (admin)
  listAllBookings: async () => {
    const response = await api.get('/admin/bookings');
    return response.data;
  },

  // Dashboard estatísticas
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
};

// Exportar API para uso em outros serviços
export default api;
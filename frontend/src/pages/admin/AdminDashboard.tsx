import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { alertService, adminService } from '../../services/api';
import { ExclamationTriangleIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';

interface Stats {
  total_users: number;
  total_drivers: number;
  total_passengers: number;
  total_rides: number;
  completed_rides: number;
  pending_bookings: number;
  total_revenue: number;
  pending_alerts: number;
  pending_documents: number;
  avg_rating: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Buscar estatísticas administrativas
        const [statsRes, alertsRes, driversRes] = await Promise.all([
          adminService.getStats(),
          alertService.list(),
          adminService.listUsers({ role: 'driver', status: 'pending_verification' }),
        ]);

        const alertsData = alertsRes.alerts || alertsRes || [];
        const pendingDocs = driversRes.users?.filter((u: any) => u.verification_status === 'pending')?.length || 0;

        setStats({
          total_users: statsRes.total_users || 0,
          total_drivers: statsRes.total_drivers || 0,
          total_passengers: (statsRes.total_users || 0) - (statsRes.total_drivers || 0),
          total_rides: statsRes.total_rides || 0,
          completed_rides: 0, // Endpoint não retorna isso
          pending_bookings: statsRes.pending_bookings || 0,
          total_revenue: statsRes.total_revenue || 0,
          pending_alerts: alertsData.filter((a: any) => a.status === 'pending').length,
          pending_documents: pendingDocs,
          avg_rating: 0, // Endpoint não retorna média global
        });
      } catch (err: any) {
        console.error('Erro ao carregar dashboard admin:', err);
        setError(err.response?.data?.message || 'Falha ao carregar dashboard');
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading || !stats) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="card bg-red-50 border border-red-200 mb-6">
          <p className="text-red-800">Erro: {error}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="fade-in">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="mt-1 text-gray-600">Visão geral do sistema</p>
        </div>

        {/* Stats principais */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total de Usuários</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_users.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{stats.total_drivers} motoristas · {stats.total_passengers} passageiros</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total de Viagens</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_rides.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{stats.completed_rides} concluídas</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Receita Total</p>
                <p className="text-2xl font-bold text-gray-900">Kz {(stats.total_revenue / 1000000).toFixed(1)}M</p>
                <p className="text-xs text-gray-500">{stats.pending_bookings} reservas pendentes</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pendências</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending_alerts + stats.pending_documents}</p>
                <p className="text-xs text-gray-500">{stats.pending_alerts} denúncias · {stats.pending_documents} docs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas urgentes */}
        {stats.pending_alerts > 0 && (
          <div className="card mb-8 bg-red-50 border-red-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                <div>
                  <h3 className="text-lg font-semibold text-red-900">Denúncias Pendentes</h3>
                  <p className="text-red-700">
                    {stats.pending_alerts} denúncia{stats.pending_alerts > 1 ? 's' : ''} aguardando revisão
                  </p>
                </div>
              </div>
              <a href="/admin/alerts" className="btn btn-danger">
                Review Agora
              </a>
            </div>
          </div>
        )}

        {/* Documentos pendentes */}
        {stats.pending_documents > 0 && (
          <div className="card mb-8 bg-yellow-50 border-yellow-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <DocumentCheckIcon className="h-8 w-8 text-yellow-600" />
                <div>
                  <h3 className="text-lg font-semibold text-yellow-900">Documentos para Verificação</h3>
                  <p className="text-yellow-700">
                    {stats.pending_documents} documento{stats.pending_documents > 1 ? 's' : ''} aguardando aprovação
                  </p>
                </div>
              </div>
              <a href="/admin/documents" className="btn btn-secondary bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                Verificar Agora
              </a>
            </div>
          </div>
        )}

        {/* Estatísticas recentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top motoristas */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Motoristas por Rating</h2>
            <div className="space-y-3">
              {[
                { name: 'Maria Santos', rating: 4.9, rides: 127 },
                { name: 'João Silva', rating: 4.8, rides: 98 },
                { name: 'Pedro Costa', rating: 4.7, rides: 156 },
                { name: 'Ana Oliveira', rating: 4.7, rides: 89 },
              ].map((driver, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                      <span className="font-semibold text-brand-600">{driver.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{driver.name}</p>
                      <p className="text-sm text-gray-500">{driver.rides} viagens</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-semibold text-gray-900">{driver.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Atividades recentes */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Atividades Recentes</h2>
            <div className="space-y-3">
              {[
                { action: 'Nova reserva', time: '2 min atrás', type: 'booking' },
                { action: 'Documento enviado', time: '15 min atrás', type: 'document' },
                { action: 'Denúncia recebida', time: '32 min atrás', type: 'alert' },
                { action: 'Viagem concluída', time: '1 hora atrás', type: 'ride' },
                { action: 'Novo usuário registrado', time: '2 horas atrás', type: 'user' },
              ].map((activity, i) => (
                <div key={i} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'booking' ? 'bg-green-500' :
                      activity.type === 'alert' ? 'bg-red-500' :
                      activity.type === 'document' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}></div>
                    <p className="text-sm text-gray-700">{activity.action}</p>
                  </div>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
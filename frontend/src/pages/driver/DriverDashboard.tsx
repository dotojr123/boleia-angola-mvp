import { useState, useEffect } from 'react';
import { vehicleService } from '../../services/api';
import { rideService } from '../../services/rideService';
import { reviewService } from '../../services/api';
import DriverLayout from '../../components/layout/DriverLayout';

interface Stats {
  total_rides: number;
  completed_rides: number;
  pending_rides: number;
  cancelled_rides: number;
  total_passengers: number;
  total_earnings: number;
  rating: number;
  reviews_count: number;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  is_active: boolean;
}

export default function DriverDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Buscar estatísticas do motorista
        const [vehiclesRes, ridesRes, reviewsRes] = await Promise.all([
          vehicleService.list(),
          rideService.listMyRides(),
          reviewService.getAverage(JSON.parse(localStorage.getItem('user') || '{}').id || ''),
        ]);

        const vehiclesData = vehiclesRes.vehicles || vehiclesRes || [];
        setVehicles(vehiclesData);

        // Processar viagens para estatísticas
        const rides = ridesRes.rides || ridesRes || [];
        const completedRides = rides.filter((r: any) => r.status === 'completed').length;
        const pendingRides = rides.filter((r: any) => r.status === 'scheduled' || r.status === 'active').length;
        const cancelledRides = rides.filter((r: any) => r.status === 'cancelled').length;
        const totalPassengers = rides.reduce((sum: number, r: any) => sum + (r.total_seats - r.available_seats), 0);
        const totalEarnings = rides
          .filter((r: any) => r.status === 'completed')
          .reduce((sum: number, r: any) => sum + (r.price_per_seat * (r.total_seats - r.available_seats)), 0);

        const avgReview = reviewsRes?.average || 0;
        const reviewsCount = reviewsRes?.count || 0;

        setStats({
          total_rides: rides.length,
          completed_rides: completedRides,
          pending_rides: pendingRides,
          cancelled_rides: cancelledRides,
          total_passengers: totalPassengers,
          total_earnings: totalEarnings,
          rating: avgReview,
          reviews_count: reviewsCount,
        });
      } catch (err: any) {
        console.error('Erro ao carregar dashboard:', err);
        setError(err.response?.data?.message || 'Falha ao carregar dashboard');
        setVehicles([]);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <DriverLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        </div>
      </DriverLayout>
    );
  }

  if (error) {
    return (
      <DriverLayout>
        <div className="card bg-red-50 border border-red-200 mb-6">
          <p className="text-red-800">Erro: {error}</p>
        </div>
      </DriverLayout>
    );
  }

  if (!stats) {
    return (
      <DriverLayout>
        <div className="card text-center py-12">
          <h3 className="text-gray-900">Nenhum dado disponível</h3>
          <p className="text-gray-500">Crie sua primeira viagem para começar!</p>
        </div>
      </DriverLayout>
    );
  }

  return (
    <DriverLayout>
      <div className="fade-in">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-600">Visão geral das suas atividades</p>
        </div>

        {/* Estatísticas principais */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-brand-100 rounded-md p-3">
                <svg className="h-6 w-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total de Viagens</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_rides}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Concluídas</p>
                <p className="text-2xl font-bold text-green-600">{stats?.completed_rides}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats?.pending_rides}</p>
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
                <p className="text-sm font-medium text-gray-500">Total Ganho</p>
                <p className="text-2xl font-bold text-purple-600">
                  Kz {(stats?.total_earnings || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dados do motorista */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Rating & Avaliações</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-4xl font-bold text-gray-900">
                  {stats?.rating?.toFixed(1) || 'N/A'}
                </div>
                <div className="ml-3 flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`h-5 w-5 ${
                        star <= Math.round(stats?.rating || 0)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {stats?.reviews_count || 0} avaliações
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Veículos Cadastrados</h2>
            <div className="space-y-3">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </p>
                    <p className="text-sm text-gray-500">
                      {vehicle.color} • {vehicle.license_plate}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Ativo
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <a
              href="/driver/rides/new"
              className="flex flex-col items-center p-6 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
            >
              <svg className="h-8 w-8 text-brand-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium text-brand-900">Criar Nova Viagem</span>
            </a>

            <a
              href="/driver/vehicles"
              className="flex flex-col items-center p-6 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <svg className="h-8 w-8 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="font-medium text-green-900">Adicionar Veículo</span>
            </a>

            <a
              href="/driver/rides"
              className="flex flex-col items-center p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <svg className="h-8 w-8 text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="font-medium text-purple-900">Ver Todas as Viagens</span>
            </a>
          </div>
        </div>
      </div>
    </DriverLayout>
  );
}
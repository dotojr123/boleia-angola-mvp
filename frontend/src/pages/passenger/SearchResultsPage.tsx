import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Ride } from '../../services/rideService';
import { rideService } from '../../services/rideService';
import PassengerLayout from '../../components/layout/PassengerLayout';

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rides, setRides] = useState<Ride[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'time' | 'rating'>('time');

  const origin = searchParams.get('origin_city') || '';
  const destination = searchParams.get('destination_city') || '';
  const date = searchParams.get('departure_date') || '';

  useEffect(() => {
    if (!origin || !destination || !date) {
      navigate('/passenger');
      return;
    }

    const fetchRides = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await rideService.search({
          origin_city: origin,
          destination_city: destination,
          departure_date: date,
          min_seats: 1,
        });
        setRides(Array.isArray(data) ? data : data.rides || []);
      } catch (err: any) {
        console.error('Erro ao buscar viagens:', err);
        setError(err.response?.data?.message || 'Falha ao buscar viagens');
        setRides([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
  }, [origin, destination, date, navigate]);

  const sortedRides = [...rides].sort((a, b) => {
    if (sortBy === 'price') return a.price_per_seat - b.price_per_seat;
    if (sortBy === 'rating') {
      return (b.driver_rating || 0) - (a.driver_rating || 0);
    }
    return new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime();
  });

  if (!origin || !destination || !date) {
    return null;
  }

  return (
    <PassengerLayout>
      <div className="fade-in">
        {/* Header da busca */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {origin} → {destination}
              </h1>
              <p className="text-gray-600 mt-1">
                {new Date(date).toLocaleDateString('pt-AO', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div>
              <label className="text-sm text-gray-700 mr-2">Ordenar por:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="input inline-block w-auto"
              >
                <option value="time">Horário</option>
                <option value="price">Preço</option>
                <option value="rating">Avaliação</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="card bg-red-50 border border-red-200 mb-6">
            <p className="text-red-800">Erro: {error}</p>
            <button onClick={() => navigate('/passenger')} className="mt-2 text-red-600 underline">
              Voltar e tentar novamente
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
          </div>
        ) : sortedRides.length === 0 ? (
          <div className="card text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma viagem encontrada</h3>
            <p className="mt-1 text-sm text-gray-500">Tente ajustar os filtros ou buscar em outras datas.</p>
            <button
              onClick={() => navigate('/passenger')}
              className="mt-4 btn btn-primary"
            >
              Nova busca
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedRides.map((ride) => (
              <div key={ride.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Informações do motorista e veículo */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{ride.driver_name || 'Motorista'}</h3>
                        <div className="flex items-center mt-1">
                          <div className="flex items-center">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <svg
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.round(ride.driver_rating || 0)
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
                          <span className="ml-2 text-sm text-gray-600">
                            {(ride.driver_rating || 0).toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {ride.available_seats} lugares disponíveis
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">
                      {ride.vehicle || 'Veículo não especificado'}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(ride.departure_time).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {ride.origin_city} → {ride.destination_city}
                      </div>
                    </div>
                  </div>

                  {/* Preço e ação */}
                  <div className="lg:w-48 flex flex-col items-center justify-between lg:border-l lg:pl-6">
                    <div className="text-center mb-4 lg:mb-0">
                      <p className="text-sm text-gray-600">Preço por pessoa</p>
                      <p className="text-2xl font-bold text-brand-600">
                        Kz {ride.price_per_seat.toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/passenger/rides/${ride.id}`)}
                      className="btn btn-primary w-full"
                    >
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PassengerLayout>
  );
}
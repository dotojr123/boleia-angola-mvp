import { useState, useEffect } from 'react';
import type { Booking } from '../../services/bookingService';
import { bookingService } from '../../services/bookingService';
import PassengerLayout from '../../components/layout/PassengerLayout';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await bookingService.listMyBookings();
        setBookings(data.bookings || data);
      } catch (err: any) {
        console.error('Erro ao buscar reservas:', err);
        setError(err.response?.data?.message || 'Falha ao carregar reservas');
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return ['pending', 'confirmed'].includes(booking.status);
    if (filter === 'completed') return booking.status === 'completed';
    return true;
  });

  const getStatusBadge = (status: Booking['status']) => {
    const statusMap = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente' },
      confirmed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Confirmada' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Concluída' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelada' },
    };
    const { bg, text, label } = statusMap[status];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta reserva?')) return;
    try {
      await bookingService.cancel(id);
      setBookings(bookings.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Falha ao cancelar reserva');
    }
  };

  return (
    <PassengerLayout>
      <div className="fade-in">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Minhas Reservas</h1>
          <p className="mt-1 text-gray-600">Gerencie suas reservas de viagens</p>
        </div>

        {/* Filtros */}
        <div className="card mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'upcoming'
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Próximas
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Concluídas
            </button>
          </div>
        </div>

        {error && (
          <div className="card bg-red-50 border border-red-200 mb-6">
            <p className="text-red-800">Erro: {error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="card text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma reserva encontrada</h3>
            <p className="mt-1 text-sm text-gray-500">Comece buscando uma viagem!</p>
            <a href="/passenger" className="mt-4 btn btn-primary inline-block">
              Buscar Viagens
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="card">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {booking.ride?.origin_city || 'N/A'} → {booking.ride?.destination_city || 'N/A'}
                      </h3>
                      {getStatusBadge(booking.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {booking.ride?.driver_name || 'N/A'} • {booking.ride?.vehicle || 'N/A'}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(booking.ride?.departure_time || Date.now()).toLocaleDateString('pt-AO')}
                      </span>
                      <span>{booking.seats} assento{booking.seats > 1 ? 's' : ''}</span>
                      <span className="font-semibold text-brand-600">
                        Kz {booking.total_price.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {booking.status === 'confirmed' && (
                      <button 
                        onClick={() => handleCancel(booking.id)}
                        className="btn btn-secondary text-sm"
                      >
                        Cancelar
                      </button>
                    )}
                    {booking.status === 'completed' && (
                      <button className="btn btn-primary text-sm">
                        Avaliar
                      </button>
                    )}
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
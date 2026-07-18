import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Ride } from '../../services/rideService';
import { rideService } from '../../services/rideService';
import { bookingService } from '../../services/bookingService';
import PassengerLayout from '../../components/layout/PassengerLayout';

export default function RideDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ride, setRide] = useState<Ride | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchRide = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await rideService.getById(id);
        setRide(data.ride || data);
      } catch (err: any) {
        console.error('Erro ao buscar viagem:', err);
        setError(err.response?.data?.message || 'Falha ao carregar detalhes da viagem');
      } finally {
        setLoading(false);
      }
    };

    fetchRide();
  }, [id]);

  if (!id) {
    return null;
  }

  const total = seats * (ride?.price_per_seat || 0);

  const handleBook = async () => {
    if (!ride) return;
    setBookingLoading(true);
    try {
      await bookingService.create(ride.id, seats);
      navigate('/passenger/my-bookings');
    } catch (err: any) {
      console.error('Erro ao criar reserva:', err);
      setError(err.response?.data?.message || 'Falha ao criar reserva');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <PassengerLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        </div>
      </PassengerLayout>
    );
  }

  if (!ride) {
    return (
      <PassengerLayout>
        <div className="card text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Viagem não encontrada</h3>
          <button onClick={() => navigate('/passenger')} className="mt-4 btn btn-primary">
            Voltar para busca
          </button>
        </div>
      </PassengerLayout>
    );
  }

  return (
    <PassengerLayout>
      <div className="fade-in max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary mb-6 flex items-center gap-2"
        >
          ← Voltar para resultados
        </button>

        {error && (
          <div className="card bg-red-50 border border-red-200 mb-6">
            <p className="text-red-800">Erro: {error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações principais */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header da viagem */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-brand-600">
                      {(ride.driver_name || 'M').charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{ride.driver_name || 'Motorista'}</h2>
                    <div className="flex items-center text-sm">
                      <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="ml-1 text-gray-700">{(ride.driver_rating || 0).toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✓ Disponível
                </span>
              </div>

              {/* Rota */}
              <div className="relative py-4">
                <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gray-300"></div>
                <div className="space-y-6">
                  <div className="relative flex items-center gap-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full absolute left-3"></div>
                    <div className="ml-8 flex-1">
                      <p className="text-xs text-gray-500 uppercase">Origem</p>
                      <p className="font-semibold text-gray-900">{ride.origin_city}</p>
                      <p className="text-sm text-gray-600">{ride.origin_point || 'Ponto a combinar'}</p>
                    </div>
                    <p className="font-bold text-brand-600">
                      {new Date(ride.departure_time).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="relative flex items-center gap-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full absolute left-3"></div>
                    <div className="ml-8 flex-1">
                      <p className="text-xs text-gray-500 uppercase">Destino</p>
                      <p className="font-semibold text-gray-900">{ride.destination_city}</p>
                      <p className="text-sm text-gray-600">{ride.destination_point || 'Ponto a combinar'}</p>
                    </div>
                    <p className="font-bold text-brand-600">
                      {ride.arrival_time 
                        ? new Date(ride.arrival_time).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })
                        : '~' + new Date(ride.departure_time).getHours() + 'h'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Veículo */}
              {ride.vehicle && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Veículo</h3>
                  <p className="text-sm text-gray-600">{ride.vehicle}</p>
                </div>
              )}

              {/* Comodidades */}
              {ride.amenities && ride.amenities.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Comodidades</h3>
                  <div className="flex flex-wrap gap-2">
                    {ride.amenities.map((amenity, i) => (
                      <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Descrição */}
              {ride.description && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Descrição</h3>
                  <p className="text-sm text-gray-600">{ride.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Card de reserva */}
          <div className="lg:col-span-1">
            <div className="card sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Reservar assento</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de assentos
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSeats(Math.max(1, seats - 1))}
                    className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-semibold"
                  >
                    -
                  </button>
                  <span className="text-xl font-bold w-8 text-center">{seats}</span>
                  <button
                    onClick={() => setSeats(Math.min(ride.available_seats, seats + 1))}
                    className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-semibold"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {ride.available_seats} assentos disponíveis
                </p>
              </div>

              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">
                    {seats} x Kz {ride.price_per_seat.toLocaleString()}
                  </span>
                  <span className="font-medium">Kz {total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Taxas</span>
                  <span className="text-gray-500">Grátis</span>
                </div>
                <div className="border-t mt-4 pt-4 flex justify-between">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-2xl text-brand-600">Kz {total.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleBook}
                disabled={bookingLoading || seats > ride.available_seats}
                className="btn btn-primary w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bookingLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processando...
                  </>
                ) : (
                  'Confirmar Reserva'
                )}
              </button>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Ao confirmar, você concorda com os termos de viagem.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PassengerLayout>
  );
}
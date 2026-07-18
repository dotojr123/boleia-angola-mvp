import React, { useState, useEffect } from 'react';
import { ChevronLeft, ArrowRight } from 'lucide-react';
import { Ride } from '../../types';
import { MOCK_RIDES } from '../../constants';
import { RideCard } from '../../components/RideCard';
import { Button } from '../../components/Button';
import { SearchFilters, FilterState } from '../../components/SearchFilters';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Filter } from 'lucide-react';
import { api } from '../../lib/api';

const transformRide = (dbRide: any): Ride => {
  try {
    // Basic transformation for API results
    const driverData = dbRide.driver || {
      id: dbRide.driver_id,
      full_name: dbRide.driver_name,
      name: dbRide.driver_name,
      rating: dbRide.driver_rating,
      reviews_count: dbRide.driver_reviews_count,
      avatar_url: dbRide.driver_avatar_url,
      is_verified: dbRide.driver_verification_status === 'verified',
      experience_level: dbRide.driver_experience_level,
    };

    const depTimeStr = dbRide.departure_time || dbRide.date;
    const departureDateTime = depTimeStr ? new Date(depTimeStr) : new Date();
    const isDateValid = !isNaN(departureDateTime.getTime());

    return {
      id: dbRide.id || String(Math.random()),
      driver: {
        id: driverData.id || 'unknown',
        name: driverData.full_name || driverData.name || 'Motorista',
        full_name: driverData.full_name || driverData.name,
        rating: driverData.rating || 5.0,
        reviews_count: driverData.reviews_count || 0,
        avatar_url: driverData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(driverData.full_name || 'M')}`,
        is_verified: driverData.is_verified || driverData.verification_status === 'verified' || false,
        experience_level: driverData.experience_level || 'novice'
      },
      origin: dbRide.origin || 'Desconhecido',
      destination: dbRide.destination || 'Desconhecido',
      date: dbRide.date || (isDateValid ? departureDateTime.toLocaleDateString('pt-AO') : ''),
      time: dbRide.time || (isDateValid ? departureDateTime.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Luanda' }) : '00:00'),
      price: Number(dbRide.price_per_seat || dbRide.price) || 0,
      currency: dbRide.currency || 'AOA',
      availableSeats: Number(dbRide.available_seats || dbRide.availableSeats || 0),
      duration: dbRide.duration || 'N/A',
      stops: dbRide.stops || [],
      preferences: dbRide.preferences || dbRide.travel_preferences || {
        smoking: false,
        pets: false,
        music: true,
        chattiness: 'medium'
      },
      baggage_policy: dbRide.baggage_policy || dbRide.luggage_size,
      vehicle: dbRide.vehicle || (dbRide.vehicle_make ? {
        make: dbRide.vehicle_make,
        model: dbRide.vehicle_model,
        color: dbRide.vehicle_color,
        plate: dbRide.vehicle_plate
      } : undefined)
    };
  } catch (err) {
    console.error("Critical error transforming ride:", err, dbRide);
    return {
      id: dbRide.id || 'error',
      driver: { id: 'error', name: 'Erro', full_name: 'Erro', rating: 0, reviews_count: 0, avatar_url: '' },
      origin: 'Erro', destination: 'Erro', date: '', time: '', price: 0, currency: 'AOA', availableSeats: 0,
      duration: '', stops: [], preferences: { smoking: false, pets: false, music: false, chattiness: 'medium' }
    } as any;
  }
};

export const SearchResults = () => {
  const [dbRides, setDbRides] = useState<Ride[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);

  // Filter Logic
  const initialFilters: FilterState = {
    minPrice: 0,
    maxPrice: 50000,
    timeOfDay: [],
    amenities: { pets: false, smoking: false, instantBooking: false, womenOnly: false },
    baggage: [],
    driverLevel: []
  };
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const location = useLocation();
  const searchState = location.state as { origin?: string, destination?: string, date?: string } | null;

  useEffect(() => {
    const fetchRides = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/rides', {
          params: {
            origin: searchState?.origin,
            destination: searchState?.destination,
            date: searchState?.date
          }
        });
        const data = response.data;
        const transformed = Array.isArray(data) ? data.map(transformRide) : MOCK_RIDES;

        setDbRides(transformed);
        setRides(transformed);
      } catch (err: any) {
        console.error('Error fetching rides:', err);
        setError(err.message || 'Falha ao buscar caronas');
        // Fallback to mocks if API fails
        setDbRides(MOCK_RIDES);
        setRides(MOCK_RIDES);
      } finally {
        setLoading(false);
      }
    };
    fetchRides();
  }, [searchState]);

  // Apply filters
  useEffect(() => {
    let result = dbRides;

    // Price
    result = result.filter(r => r.price <= filters.maxPrice);

    // Amenities
    if (filters.amenities.pets) result = result.filter(r => r.preferences?.pets);
    if (filters.amenities.smoking) result = result.filter(r => r.preferences?.smoking);

    // Baggage
    if (filters.baggage.length > 0) {
      result = result.filter(r => r.baggage_policy && filters.baggage.includes(r.baggage_policy));
    }

    // Time of Day
    if (filters.timeOfDay.length > 0) {
      result = result.filter(r => {
        if (!r.time) return false;
        const hour = parseInt(r.time.split(':')[0]);
        if (isNaN(hour)) return false;

        const isMorning = hour >= 6 && hour <= 12;
        const isAfternoon = hour > 12 && hour <= 18;
        const isNight = hour > 18 || hour < 6;

        if (filters.timeOfDay.includes('morning') && isMorning) return true;
        if (filters.timeOfDay.includes('afternoon') && isAfternoon) return true;
        if (filters.timeOfDay.includes('night') && isNight) return true;
        return false;
      });
    }

    // Driver Level
    if (filters.driverLevel.length > 0) {
      result = result.filter(r => r.driver.experience_level && filters.driverLevel.includes(r.driver.experience_level));
    }

    setRides(result);
  }, [filters, dbRides]);

  const handleRideSelect = (ride: Ride) => {
    navigate(`/ride/${ride.id}`, { state: { ride } });
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Search Filter Header */}
      <div className="bg-white border-b border-slate-200 sticky top-20 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <Link to="/" className="p-2 hover:bg-slate-100 rounded-full text-slate-500 mr-2">
                <ChevronLeft />
              </Link>
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center">
                  {searchState?.origin || 'Caronas'} <ArrowRight size={16} className="mx-2 text-slate-400" /> {searchState?.destination || 'Disponíveis'}
                </h2>
                <p className="text-sm text-slate-500">
                  {searchState?.date ? new Date(searchState.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Todas as datas'} • 1 Passageiro
                </p>
              </div>
            </div>
            <button onClick={() => setShowFilters(true)} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-bold hover:bg-blue-100 whitespace-nowrap flex items-center">
              <Filter size={16} className="mr-2" />
              Filtros
            </button>
            <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium hover:bg-slate-200 whitespace-nowrap">Preço: Menor primeiro</button>
          </div>
        </div>
      </div>


      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-slate-500 font-medium">Buscando as melhores caronas...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 p-6 rounded-2xl mb-8">
            <p className="text-red-700 font-bold mb-2">Ops! Tivemos um problema ao conectar com o servidor.</p>
            <p className="text-red-600 text-sm mb-4">Mostrando caronas sugeridas enquanto resolvemos isso.</p>
            <button onClick={() => window.location.reload()} className="text-red-700 font-bold hover:underline py-2 px-4 bg-red-100 rounded-lg">Tentar novamente</button>
          </div>
        ) : null}

        {!loading && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-700">{rides.length} caronas disponíveis</h3>
              <span className="text-xs text-slate-400">Preços por passageiro</span>
            </div>

            <div className="space-y-4">
              {rides.length > 0 ? (
                rides.map(ride => (
                  <RideCard key={ride.id} ride={ride} onClick={handleRideSelect} />
                ))
              ) : (
                <div className="text-center py-20 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Filter size={32} className="text-slate-200" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhuma carona encontrada</h3>
                  <p className="text-slate-500 max-w-xs mx-auto mb-8">Não encontramos viagens para este trajeto ou data. Tente alterar os filtros ou a data.</p>
                  <Button onClick={() => setFilters(initialFilters)} className="px-8">Limpar Filtros</Button>
                </div>
              )}
            </div>

            <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100 text-center">
              <h4 className="font-bold text-blue-900 mb-2">Não encontrou o que procurava?</h4>
              <p className="text-blue-700 text-sm mb-4">Crie um alerta e seja notificado quando uma nova carona aparecer.</p>
              <button className="text-blue-600 font-bold hover:underline">Criar alerta de viagem</button>
            </div>
          </>
        )}
      </div>

      <SearchFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        setFilters={setFilters}
        priceRange={{ min: 0, max: 100000 }}
        totalResults={rides.length}
      />
    </div>
  );
};

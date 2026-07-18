import React, { useState, useEffect } from 'react';
import { CheckCircle, ChevronLeft, Cigarette, Music, MessageSquare, Dog, Car, Briefcase, Loader2, Star, MapPin, Clock } from 'lucide-react';
import { Button } from '../../components/Button';
import { Ride } from '../../types';
import { useLocation, useNavigate, Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LevelBadge } from '../../components/LevelBadge';
import { api } from '../../lib/api';
import { MOCK_RIDES } from '../../constants';

export const RideDetails = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [ride, setRide] = useState<Ride | null>(location.state?.ride || null);
    const [loading, setLoading] = useState(!location.state?.ride);
    const [bookingState, setBookingState] = useState<'IDLE' | 'LOADING' | 'SUCCESS'>('IDLE');

    useEffect(() => {
        if (!ride && id) {
            fetchRide();
        }
    }, [id]);

    const fetchRide = async () => {
        setLoading(true);
        try {
            // Try API first
            const { data } = await api.get(`/rides/${id}`);
            if (data && data.id) {
                // Transform API data to Ride type
                const transformedRide: Ride = {
                    id: data.id,
                    driver: {
                        id: data.driver_id,
                        name: data.driver_name || 'Motorista',
                        full_name: data.driver_name,
                        rating: data.driver_rating || 5.0,
                        reviews_count: data.driver_reviews_count || 0,
                        avatar_url: data.driver_avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.driver_name || 'M')}`,
                        is_verified: data.driver_verification_status === 'verified',
                        experience_level: data.driver_experience_level || 'novice'
                    },
                    origin: data.origin,
                    destination: data.destination,
                    date: data.departure_time ? new Date(data.departure_time).toLocaleDateString('pt-AO') : '',
                    time: data.departure_time ? new Date(data.departure_time).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Luanda' }) : '',
                    price: Number(data.price_per_seat) || 0,
                    currency: data.currency || 'AOA',
                    availableSeats: data.available_seats || 0,
                    duration: data.duration || 'N/A',
                    stops: data.waypoints ? data.waypoints.map((wp: any) => wp.city) : [],
                    preferences: typeof data.preferences === 'string' ? JSON.parse(data.preferences) : data.preferences || {},
                    vehicle: data.vehicle_make ? {
                        make: data.vehicle_make,
                        model: data.vehicle_model,
                        color: data.vehicle_color,
                        year: data.vehicle_year
                    } : undefined
                } as any;
                setRide(transformedRide);
            } else {
                // Fallback to mocks
                const foundRide = MOCK_RIDES.find(r => r.id === id);
                if (foundRide) setRide(foundRide);
            }
        } catch (err) {
            console.error('Error fetching ride:', err);
            // Fallback to mock
            const foundRide = MOCK_RIDES.find(r => r.id === id);
            if (foundRide) setRide(foundRide);
        } finally {
            setLoading(false);
        }
    };

    const handleBooking = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (!ride) return;

        setBookingState('LOADING');
        try {
            await api.post('/bookings', {
                ride_id: ride.id,
                seats_booked: 1
            });

            setBookingState('SUCCESS');
        } catch (err: any) {
            console.error('Booking error:', err);
            const errorMsg = err.response?.data?.error || 'Erro ao fazer reserva';
            alert(errorMsg);
            setBookingState('IDLE');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Carregando detalhes do trajeto...</p>
            </div>
        );
    }

    if (!ride) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-sm text-center max-w-sm">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MapPin size={32} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 mb-2">Carona não encontrada</h2>
                    <p className="text-slate-500 text-sm mb-8 leading-relaxed">Não foi possível localizar esta viagem. Ela pode ter sido cancelada ou expirada.</p>
                    <Link to="/search" className="inline-block w-full py-4 bg-blue-600 text-white rounded-2xl font-bold">Voltar para busca</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen py-8 md:py-12">
            {/* Success Modal */}
            {bookingState === 'SUCCESS' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[40px] p-10 max-w-md w-full text-center shadow-2xl">
                        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <CheckCircle className="text-emerald-600 w-12 h-12" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Reserva Solicitada!</h2>
                        <p className="text-slate-500 mb-10 leading-relaxed font-medium">
                            O motorista <strong>{ride.driver?.full_name || 'Parceiro'}</strong> recebeu seu pedido. Use o chat para confirmar os detalhes do embarque.
                        </p>
                        <Button
                            fullWidth
                            className="h-16 text-lg font-black uppercase tracking-widest bg-blue-600 shadow-xl shadow-blue-100"
                            onClick={() => navigate('/dashboard/passenger/chat', { state: { partnerId: ride.driver?.id } })}
                        >
                            Abrir Chat agora
                        </Button>
                        <button
                            onClick={() => setBookingState('IDLE')}
                            className="mt-6 text-slate-400 text-xs font-black uppercase tracking-widest hover:text-slate-600 transition-colors"
                        >
                            Fechar Janela
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-5xl mx-auto px-6">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-8 flex items-center text-slate-400 hover:text-blue-600 font-black uppercase tracking-widest text-xs transition-colors"
                >
                    <ChevronLeft size={18} className="mr-1" /> Voltar
                </button>

                <div className="grid lg:grid-cols-3 gap-10">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                                <h1 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">
                                    {new Date(ride.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </h1>
                                <p className="text-blue-600 font-bold text-xs uppercase tracking-[0.2em]">Detalhes oficiais do trajeto</p>
                            </div>

                            <div className="p-10 relative">
                                <div className="absolute left-10 top-12 bottom-12 w-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-1/2 w-full bg-blue-400" />
                                </div>

                                {/* Origin */}
                                <div className="relative pl-12 pb-12">
                                    <div className="absolute left-[-5px] top-1 w-4 h-4 bg-blue-600 border-4 border-blue-100 rounded-full z-10 shadow-sm"></div>
                                    <div className="text-2xl font-black text-slate-900 leading-none mb-1">{ride.time}</div>
                                    <div className="text-lg font-bold text-slate-600">{ride.origin}</div>
                                </div>

                                {/* Stops */}
                                {ride.stops && ride.stops.length > 0 && ride.stops.map((stop, idx) => (
                                    <div key={idx} className="relative pl-12 pb-12">
                                        <div className="absolute left-[-2px] top-1 w-3 h-3 bg-white border-2 border-slate-300 rounded-full z-10"></div>
                                        <div className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center">
                                            <MapPin size={12} className="mr-2" />
                                            Parada em {stop}
                                        </div>
                                    </div>
                                ))}

                                {/* Destination */}
                                <div className="relative pl-12">
                                    <div className="absolute left-[-5px] top-1 w-4 h-4 bg-emerald-500 border-4 border-emerald-100 rounded-full z-10 shadow-sm"></div>
                                    <div className="text-2xl font-black text-slate-900 leading-none mb-1">Chegada prevista</div>
                                    <div className="text-lg font-bold text-slate-600">{ride.destination}</div>
                                </div>
                            </div>

                            <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                                <div className="flex items-center text-slate-500">
                                    <Clock size={18} className="mr-2 text-blue-500" />
                                    <span className="text-sm font-bold uppercase tracking-widest">Duração base: {ride.duration}</span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">Conexão Confirmada</span>
                            </div>
                        </div>

                        {(ride.vehicle || ride.baggage_policy) && (
                            <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 p-8">
                                <h3 className="text-lg font-black text-slate-900 mb-6 tracking-tight flex items-center">
                                    <Car className="mr-3 text-blue-600" size={20} />
                                    Veículo e Bagagem
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {ride.vehicle && (
                                        <div className="flex items-center space-x-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                                            <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-600"><Car size={24} /></div>
                                            <div>
                                                <p className="font-black text-slate-900 text-sm leading-tight">{ride.vehicle.make} {ride.vehicle.model}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{ride.vehicle.color} • {ride.vehicle.plate || '---'}</p>
                                            </div>
                                        </div>
                                    )}
                                    {ride.baggage_policy && (
                                        <div className="flex items-center space-x-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                                            <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600"><Briefcase size={24} /></div>
                                            <div>
                                                <p className="font-black text-slate-900 text-sm leading-tight">Bagagem {
                                                    ride.baggage_policy === 'small' ? 'Pequena' :
                                                        ride.baggage_policy === 'medium' ? 'Média' : 'Grande'
                                                }</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Limite do porta-malas</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 p-8">
                            <h3 className="text-lg font-black text-slate-900 mb-6 tracking-tight">Preferências de Viagem</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className={`flex flex-col items-center justify-center p-6 rounded-[32px] border transition-all ${ride.preferences?.smoking ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100 grayscale opacity-40'}`}>
                                    <Cigarette size={24} className={ride.preferences?.smoking ? 'text-red-500 mb-3' : 'text-slate-400 mb-3'} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-center">{ride.preferences?.smoking ? 'Fumadores' : 'Não fumadores'}</span>
                                </div>
                                <div className={`flex flex-col items-center justify-center p-6 rounded-[32px] border transition-all ${ride.preferences?.music ? 'bg-blue-50 border-blue-100 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-40'}`}>
                                    <Music size={24} className={ride.preferences?.music ? 'text-blue-500 mb-3' : 'text-slate-400 mb-3'} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-center">{ride.preferences?.music ? 'Com música' : 'Silenciosa'}</span>
                                </div>
                                <div className={`flex flex-col items-center justify-center p-6 rounded-[32px] border transition-all ${ride.preferences?.pets ? 'bg-amber-50 border-amber-100 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-40'}`}>
                                    <Dog size={24} className={ride.preferences?.pets ? 'text-amber-500 mb-3' : 'text-slate-400 mb-3'} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-center">{ride.preferences?.pets ? 'Pets OK' : 'Sem Animais'}</span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-6 rounded-[32px] border border-blue-100 bg-blue-50">
                                    <MessageSquare size={24} className="text-blue-500 mb-3" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-center">
                                        {ride.preferences?.chattiness === 'talkative' ? 'Comunicativo' :
                                            ride.preferences?.chattiness === 'medium' ? 'Moderada' : 'Reservado'}
                                    </span>
                                </div>
                            </div>

                            {ride.driver?.bio && (
                                <div className="mt-10 pt-8 border-t border-slate-100">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Nota do condutor</h4>
                                    <p className="text-slate-600 leading-relaxed font-medium italic italic">"{ride.driver.bio}"</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Reservation */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-[40px] shadow-2xl shadow-blue-900/5 border border-slate-100 p-10 sticky top-32">
                            <div className="text-center pb-8 border-b border-slate-100 mb-8">
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] block mb-2">Valor da Viagem</span>
                                <div className="text-5xl font-black text-slate-900 tracking-tighter">
                                    {ride.price.toLocaleString('pt-AO')} <span className="text-lg font-bold text-slate-400 tracking-normal">Kz</span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4 mb-8 p-4 bg-slate-50 rounded-3xl">
                                <div className="relative">
                                    <img src={ride.driver?.avatar_url || `https://ui-avatars.com/api/?name=${ride.driver?.full_name}`} alt="" className="w-16 h-16 rounded-2xl object-cover shadow-sm bg-white" />
                                    {ride.driver?.is_verified && (
                                        <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1 border-2 border-white">
                                            <CheckCircle size={10} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                        <h3 className="font-black text-slate-900 truncate">{ride.driver?.full_name || 'Motorista'}</h3>
                                        {ride.driver?.experience_level && <LevelBadge level={ride.driver.experience_level} />}
                                    </div>
                                    <div className="flex items-center text-xs font-bold text-slate-500 mt-1">
                                        <Star size={12} fill="currentColor" className="text-amber-500 mr-1" />
                                        {ride.driver?.rating?.toFixed(1) || '5.0'}
                                        <span className="mx-1 text-slate-300">•</span>
                                        {ride.driver?.reviews_count || 0} reviews
                                    </div>
                                </div>
                            </div>

                            <Button
                                fullWidth
                                className="h-16 text-lg font-black uppercase tracking-widest bg-blue-600 shadow-xl shadow-blue-100 hover:scale-[1.02] transition-all"
                                onClick={handleBooking}
                                disabled={bookingState === 'LOADING' || ride.driver?.id === user?.id}
                            >
                                {bookingState === 'LOADING' ? <Loader2 size={24} className="animate-spin" /> : ride.driver?.id === user?.id ? 'Sua Carona' : 'Reservar Lugar'}
                            </Button>

                            <p className="text-[10px] text-center text-slate-400 mt-6 font-medium leading-relaxed">
                                Ao reservar, você concorda com nossos termos de conduta e política de cancelamento.
                            </p>
                        </div>

                        <div className="bg-blue-600 rounded-[32px] p-8 text-white shadow-xl">
                            <h4 className="font-black text-lg mb-2">Dúvidas?</h4>
                            <p className="text-blue-100 text-xs font-medium leading-relaxed mb-6">Fale diretamente com o motorista antes de reservar para alinhar pontos de encontro específicos.</p>
                            <Button
                                fullWidth
                                className="bg-white/20 hover:bg-white/30 text-white border-0 !shadow-none font-bold"
                                onClick={() => navigate('/dashboard/passenger/chat', { state: { partnerId: ride.driver?.id } })}
                            >
                                Iniciar Chat agora
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

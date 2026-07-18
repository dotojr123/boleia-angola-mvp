import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, ChevronRight, ChevronLeft, AlertCircle, Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { ReviewModal } from '../../components/ReviewModal';
import { api } from '../../lib/api';

export const MyRides = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState<{ bookingId: string, revieweeId: string, revieweeName: string } | null>(null);

    useEffect(() => {
        const fetchBookings = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const { data } = await api.get('/bookings');
                // Transform API response to match expected format
                const transformed = Array.isArray(data) ? data.map((b: any) => ({
                    id: b.id,
                    ride_id: b.ride_id,
                    passenger_id: b.passenger_id,
                    status: b.status,
                    seats_booked: b.seats_booked,
                    total_price: b.total_price,
                    booking_code: b.booking_code,
                    ride: {
                        id: b.ride_id,
                        origin: b.origin,
                        destination: b.destination,
                        departure_time: b.departure_time,
                        price: Number(b.unit_price || b.price_per_seat) || 0,
                        driver_id: b.driver_id,
                        driver: {
                            full_name: b.driver_name,
                            avatar_url: b.driver_avatar_url
                        }
                    }
                })) : [];
                setBookings(transformed);
            } catch (err) {
                console.error('Error fetching bookings:', err);
                setBookings([]);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [user]);

    // Filter bookings based on date (mock logic for now as we might not have real dates in all mock data)
    // Filter bookings based on date
    const upcomingBookings = bookings.filter(b => {
        const depTime = b.ride?.departure_time ? new Date(b.ride.departure_time) : new Date();
        return depTime >= new Date();
    });
    const pastBookings = bookings.filter(b => {
        const depTime = b.ride?.departure_time ? new Date(b.ride.departure_time) : new Date();
        return depTime < new Date();
    });

    const displayBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <Link to="/dashboard/passenger" className="flex items-center text-slate-500 hover:text-blue-600 mb-6 transition-colors">
                    <ChevronLeft size={20} className="mr-1" />
                    <span className="font-medium">Voltar ao Painel</span>
                </Link>
                <h1 className="text-3xl font-bold text-slate-900 mb-8">Minhas Viagens</h1>

                {/* Tabs */}
                <div className="flex space-x-1 bg-white p-1 rounded-xl border border-slate-200 mb-8 w-fit">
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'upcoming'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-500 hover:bg-slate-50'
                            }`}
                    >
                        Próximas
                    </button>
                    <button
                        onClick={() => setActiveTab('past')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'past'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-500 hover:bg-slate-50'
                            }`}
                    >
                        Histórico
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-slate-400">Carregando suas viagens...</p>
                    </div>
                ) : displayBookings.length > 0 ? (
                    <div className="space-y-4">
                        {displayBookings.map((booking) => (
                            <div key={booking.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                    <div className="flex items-start space-x-4">
                                        <div className="bg-blue-50 p-3 rounded-xl text-blue-600 font-bold text-center min-w-[60px]">
                                            <div className="text-lg">{new Date(booking.ride.departure_time || booking.ride.date).getDate()}</div>
                                            <div className="text-xs uppercase">{new Date(booking.ride.departure_time || booking.ride.date).toLocaleDateString('pt-BR', { month: 'short' })}</div>
                                        </div>
                                        <div>
                                            <div className="flex items-center text-slate-900 font-bold text-lg mb-1">
                                                {booking.ride.origin} <span className="text-slate-300 mx-2">→</span> {booking.ride.destination}
                                            </div>
                                            <div className="flex items-center text-sm text-slate-500 space-x-4">
                                                <span className="flex items-center">
                                                    <Clock size={14} className="mr-1" />
                                                    {booking.ride.departure_time ? new Date(booking.ride.departure_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : booking.ride.time}
                                                </span>
                                                <span className="flex items-center">
                                                    <MapPin size={14} className="mr-1" />
                                                    {(booking.ride.price || 0).toLocaleString('pt-AO')} Kz
                                                </span>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    booking.status === "confirmed" ? "bg-green-100 text-green-800" :
                                                    booking.status === "cancelled" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                                                }`}>
                                                    {booking.status === "confirmed" ? "Confirmada" :
                                                     booking.status === "cancelled" ? "Cancelada" : "Pendente"}
                                                </span>
                                            </div>
                                            <div className="mt-2 flex items-center">
                                                <img src={booking.ride.driver?.avatar_url || 'https://ui-avatars.com/api/?name=Driver'} className="w-6 h-6 rounded-full mr-2" alt="" />
                                                <span className="text-xs text-slate-500">Motorista: {booking.ride.driver?.full_name || 'Desconhecido'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        {activeTab === 'past' && booking.status === 'confirmed' && (
                                            <button
                                                onClick={() => setSelectedReview({
                                                    bookingId: booking.id,
                                                    revieweeId: booking.ride.driver_id,
                                                    revieweeName: booking.ride.driver?.full_name
                                                })}
                                                className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors"
                                            >
                                                <Star size={14} />
                                                <span>Avaliar</span>
                                            </button>
                                        )}
                                        <Link to={`/ride/${booking.ride_id}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                                            <ChevronRight />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 border-dashed">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <AlertCircle size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhuma viagem encontrada</h3>
                        <p className="text-slate-500 mb-6">Você ainda não tem viagens {activeTab === 'upcoming' ? 'agendadas' : 'no histórico'}.</p>
                        <Link to="/search">
                            <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">
                                Buscar Carona
                            </button>
                        </Link>
                    </div>
                )}

                {selectedReview && (
                    <ReviewModal
                        isOpen={!!selectedReview}
                        onClose={() => setSelectedReview(null)}
                        bookingId={selectedReview.bookingId}
                        revieweeId={selectedReview.revieweeId}
                        revieweeName={selectedReview.revieweeName}
                        onSuccess={() => {
                            // Poderia atualizar a lista aqui ou mostrar uma mensagem de sucesso
                            console.log('Avaliação enviada com sucesso');
                        }}
                    />
                )}
            </div>
        </div>
    );
};

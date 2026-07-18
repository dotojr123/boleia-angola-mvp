import React, { useEffect, useState } from 'react';
import { Car, MapPin, Calendar, Users, TrendingUp, Plus, Settings, ArrowRight, DollarSign, Star, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { LevelBadge } from '../../components/LevelBadge';
import { PremiumCard } from '../../components/ui/PremiumCard';
import { MeshHeader } from '../../components/ui/MeshHeader';
import { Button } from '../../components/Button';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';

export const DriverDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [rides, setRides] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeRides: 0,
        totalEarnings: 0,
        totalPassengers: 0,
        rating: 5.0
    });

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const role = user.type?.toLowerCase();

        if (role === 'passenger') {
            navigate('/dashboard/passenger');
            return;
        }

        const loadDashboard = async () => {
            try {
                // Fetch rides for this driver
                const ridesResponse = await api.get('/rides');
                const allRides = Array.isArray(ridesResponse.data) ? ridesResponse.data : [];
                const myRides = allRides.filter((r: any) => r.driver_id === user.id);
                setRides(myRides);

                // Fetch bookings as driver
                const bookingsResponse = await api.get('/bookings', { params: { role: 'driver' } });
                const bookings = Array.isArray(bookingsResponse.data) ? bookingsResponse.data : [];
                const confirmedBookings = bookings.filter((b: any) => b.status === 'confirmed');
                const totalEarnings = bookings
                    .filter((b: any) => b.status === 'confirmed')
                    .reduce((sum: number, b: any) => sum + (Number(b.total_price) || 0), 0);

                setStats({
                    activeRides: myRides.filter((r: any) => r.status === 'scheduled' || r.status === 'active').length,
                    totalEarnings,
                    totalPassengers: confirmedBookings.length,
                    rating: user.rating || 5.0
                });
            } catch (err) {
                console.error('Error loading dashboard:', err);
                // Fallback to empty state
                setStats({
                    activeRides: 0,
                    totalEarnings: 0,
                    totalPassengers: 0,
                    rating: user.rating || 5.0
                });
            }
            setLoading(false);
        };

        loadDashboard();
    }, [user, navigate]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            <MeshHeader
                variant="green"
                title={`Central do Motorista 🚗`}
                subtitle="Gerencie suas viagens com tecnologia de ponta."
            />

            <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <PremiumCard delay={0.1}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-4 bg-emerald-500/10 rounded-2xl">
                                <Car className="text-emerald-600" size={24} />
                            </div>
                            <span className="text-4xl font-black text-slate-900">{stats.activeRides}</span>
                        </div>
                        <h3 className="text-slate-500 font-semibold text-sm uppercase tracking-wider">Caronas Ativas</h3>
                    </PremiumCard>

                    <PremiumCard delay={0.2}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-4 bg-blue-500/10 rounded-2xl">
                                <Users className="text-blue-600" size={24} />
                            </div>
                            <span className="text-4xl font-black text-slate-900">{stats.totalPassengers}</span>
                        </div>
                        <h3 className="text-slate-500 font-semibold text-sm uppercase tracking-wider">Passageiros</h3>
                    </PremiumCard>

                    <PremiumCard delay={0.3}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-4 bg-purple-500/10 rounded-2xl">
                                <DollarSign className="text-purple-600" size={24} />
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black block text-slate-900">{stats.totalEarnings.toLocaleString()}</span>
                                <span className="text-[10px] font-bold text-slate-400">KZ ACUMULADOS</span>
                            </div>
                        </div>
                        <h3 className="text-slate-500 font-semibold text-sm uppercase tracking-wider">Ganhos Totais</h3>
                    </PremiumCard>

                    <PremiumCard delay={0.4}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-4 bg-amber-500/10 rounded-2xl">
                                <Star className="text-amber-500" size={24} />
                            </div>
                            <span className="text-4xl font-black text-slate-900">{stats.rating.toFixed(1)}</span>
                        </div>
                        <h3 className="text-slate-500 font-semibold text-sm uppercase tracking-wider">Avaliação</h3>
                    </PremiumCard>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid lg:grid-cols-2 gap-8"
                >
                    {/* Quick Tools */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-2xl font-bold text-slate-800">Ferramentas de Gestão</h2>
                            {user?.experience_level && <LevelBadge level={user.experience_level as any} />}
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <motion.div variants={itemVariants}>
                                <Link to="/dashboard/driver/publish" className="group flex items-center justify-between p-6 bg-emerald-600 hover:bg-emerald-700 rounded-3xl shadow-lg transition-all duration-300">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-3 bg-white/20 rounded-2xl">
                                            <Plus className="text-white" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white">Publicar Carona</h3>
                                            <p className="text-sm text-emerald-100">Criar nova oferta</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="text-white group-hover:translate-x-2 transition-transform" />
                                </Link>
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <Link to="/dashboard/driver/earnings" className="group flex items-center justify-between p-6 bg-white hover:bg-slate-50 rounded-3xl border border-slate-100 shadow-sm transition-all duration-300">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-3 bg-slate-100 rounded-2xl group-hover:bg-emerald-100 transition-colors">
                                            <TrendingUp className="text-slate-600 group-hover:text-emerald-600" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">Financeiro</h3>
                                            <p className="text-sm text-slate-500">Relatórios de ganhos</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-2 transition-all" />
                                </Link>
                            </motion.div>

                            {[
                                { to: "/dashboard/driver/vehicles", icon: Car, label: "Veículos", desc: "Gestão de frota", color: "blue" },
                                { to: "/dashboard/driver/reviews", icon: Users, label: "Reputação", desc: "Feedback de clientes", color: "purple" }
                            ].map((action, i) => (
                                <motion.div key={i} variants={itemVariants}>
                                    <Link to={action.to} className="group flex items-center justify-between p-6 bg-white hover:bg-slate-50 rounded-3xl border border-slate-100 shadow-sm transition-all duration-300">
                                        <div className="flex items-center space-x-4">
                                            <div className="p-3 bg-slate-100 rounded-2xl group-hover:bg-slate-200 transition-colors">
                                                <action.icon className="text-slate-600" size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">{action.label}</h3>
                                                <p className="text-sm text-slate-500">{action.desc}</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="text-slate-400 group-hover:translate-x-2 transition-all" />
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Progress Chart */}
                    <motion.div variants={itemVariants} className="mesh-gradient-green rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl animate-float"></div>

                        <div>
                            <h2 className="font-bold text-2xl mb-2">Desempenho VIP 🚀</h2>
                            <p className="text-emerald-100 font-medium mb-8">
                                Você está no topo! Continue mantendo a pontualidade para subir de nível.
                            </p>
                        </div>

                        <div className="bg-black/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <h3 className="font-bold text-lg">Meta de Passageiros</h3>
                                    <p className="text-xs text-emerald-200 uppercase tracking-tighter">Temporada de Janeiro</p>
                                </div>
                                <span className="text-2xl font-black">{stats.totalPassengers}<span className="text-sm opacity-50 ml-1">/50</span></span>
                            </div>

                            <div className="bg-white/10 rounded-full h-4 mb-2 overflow-hidden border border-white/5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min((stats.totalPassengers / 50) * 100, 100)}%` }}
                                    transition={{ duration: 1.5, ease: "circOut" }}
                                    className="bg-gradient-to-r from-emerald-200 to-white h-full relative"
                                >
                                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[slide_1s_linear_infinite]"></div>
                                </motion.div>
                            </div>
                            <p className="text-[10px] text-emerald-100 font-bold text-right opacity-80 uppercase tracking-widest">Faltam {Math.max(50 - stats.totalPassengers, 0)} para o próximo bônus</p>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Próximas Caronas v2.0 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-12"
                >
                    <div className="flex items-center justify-between mb-6 px-2">
                        <h2 className="text-2xl font-bold text-slate-800">Próximas Caronas 🚀</h2>
                        <Link to="/dashboard/driver/publish" className="text-sm font-bold text-emerald-600 hover:underline">Ver todas</Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-64 bg-white rounded-3xl border border-slate-100 animate-pulse"></div>
                            ))}
                        </div>
                    ) : rides.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {rides.map((ride) => (
                                <PremiumCard key={ride.id} noPad className="overflow-hidden group">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                                Ativa
                                            </div>
                                            <span className="text-lg font-black text-slate-900">{(ride.price_per_seat || 0).toLocaleString()} <span className="text-xs text-slate-400 font-bold uppercase">Kz</span></span>
                                        </div>

                                        <div className="space-y-4 mb-6">
                                            <div className="flex items-start space-x-3">
                                                <div className="mt-1 p-1 bg-slate-100 rounded-lg">
                                                    <MapPin size={14} className="text-slate-500" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Origem</p>
                                                    <p className="font-bold text-slate-700 leading-tight">{ride.origin}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start space-x-3">
                                                <div className="mt-1 p-1 bg-blue-50 rounded-lg">
                                                    <MapPin size={14} className="text-blue-500" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Destino</p>
                                                    <p className="font-bold text-slate-900 leading-tight">{ride.destination}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl mb-6">
                                            <div className="flex items-center space-x-3">
                                                <Calendar size={18} className="text-slate-400" />
                                                <span className="text-sm font-bold text-slate-600">
                                                    {new Date(ride.departure_time).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', timeZone: 'Africa/Luanda' })}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
                                                <Clock size={18} className="text-slate-400" />
                                                <span className="text-sm font-bold text-slate-600">
                                                    {new Date(ride.departure_time).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Luanda' })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex -space-x-2">
                                                {[...Array(ride.total_seats)].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center ${i < (ride.bookings?.filter((b: any) => b.status === 'confirmed').length || 0) ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                                    >
                                                        <Users size={12} className="text-white" />
                                                    </div>
                                                ))}
                                            </div>
                                            <span className="text-xs font-bold text-slate-400">
                                                {ride.bookings?.filter((b: any) => b.status === 'confirmed').length || 0}/{ride.total_seats} ocupados
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/dashboard/driver/chat?rideId=${ride.id}`)}
                                        className="w-full py-4 bg-slate-900 text-white font-bold text-sm group-hover:bg-emerald-600 transition-colors flex items-center justify-center border-none"
                                    >
                                        Gerenciar Passageiros <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </PremiumCard>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-[40px] border-2 border-dashed border-slate-200 p-12 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Car size={40} className="text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhuma carona ativa</h3>
                            <p className="text-slate-500 mb-8 max-w-xs mx-auto">Sua próxima viagem começa aqui. Publique agora e ganhe dinheiro.</p>
                            <div className="flex justify-center">
                                <button
                                    onClick={() => navigate('/dashboard/driver/publish')}
                                    className="px-8 py-3 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 transition-colors"
                                >
                                    Publicar Primeira Carona
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes slide {
                    from { background-position: 0 0; }
                    to { background-position: 40px 0; }
                }
            `}} />
        </div>
    );
};

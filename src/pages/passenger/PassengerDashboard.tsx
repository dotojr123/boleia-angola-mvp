import React, { useEffect, useState } from 'react';
import { MapPin, Calendar, Clock, TrendingUp, Star, MessageCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { PremiumCard } from '../../components/ui/PremiumCard';
import { MeshHeader } from '../../components/ui/MeshHeader';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';

export const PassengerDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [nextRide, setNextRide] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        upcomingRides: 0,
        completedRides: 0,
        savedMoney: 0
    });

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const role = user.type?.toLowerCase();

        if (role === 'driver') {
            navigate('/dashboard/driver');
            return;
        } else if (role === 'admin') {
            navigate('/admin');
            return;
        }

        fetchStats();
    }, [user, navigate]);

    const fetchStats = async () => {
        // Mock data for now to prevent crash
        setStats({
            upcomingRides: 0,
            completedRides: 0,
            savedMoney: 0
        });
        setNextRide(null);
        setLoading(false);
    };

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

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            <MeshHeader
                title={`Olá, ${user?.email?.split('@')[0]}! 👋`}
                subtitle="Bem-vindo ao seu painel de passageiro premium."
            />

            <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20">
                {/* Sua Próxima Jornada v2.0 */}
                {nextRide && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <div className="bg-white rounded-[32px] overflow-hidden shadow-2xl shadow-blue-900/10 border border-blue-50 flex flex-col md:flex-row">
                            <div className="bg-blue-600 p-8 md:w-1/3 text-white flex flex-col justify-between">
                                <div>
                                    <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">CONFIRMADA</div>
                                    <h2 className="text-3xl font-black mb-2">Sua Próxima Jornada 🚀</h2>
                                    <p className="text-blue-100 font-medium">Prepare as malas, seu motorista está te esperando!</p>
                                </div>
                                <div className="mt-8 flex items-center space-x-4">
                                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                                        <Clock size={32} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-blue-200 uppercase">Embarque em</p>
                                        <p className="text-2xl font-black">
                                            {new Date(nextRide.departure_time).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} • {new Date(nextRide.departure_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 flex-grow bg-slate-50/30">
                                <div className="grid md:grid-cols-2 gap-8 mb-8">
                                    <div className="space-y-6">
                                        <div className="flex items-start space-x-4">
                                            <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                                                <MapPin size={24} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Rota Selecionada</p>
                                                <p className="text-xl font-bold text-slate-900">{nextRide.origin} <span className="text-blue-400 mx-2">→</span> {nextRide.destination}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4 p-4 bg-white rounded-2xl border border-slate-100">
                                            <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500 overflow-hidden">
                                                {nextRide.driver?.avatar_url ? (
                                                    <img src={nextRide.driver.avatar_url} alt="Motorista" className="w-full h-full object-cover" />
                                                ) : nextRide.driver?.full_name?.charAt(0) || 'M'}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase">Seu Motorista</p>
                                                <p className="font-bold text-slate-900">{nextRide.driver?.full_name || 'Motorista Parceiro'}</p>
                                                <div className="flex items-center text-amber-500">
                                                    <Star size={12} fill="currentColor" />
                                                    <span className="text-xs font-bold ml-1">{nextRide.driver?.rating?.toFixed(1) || '5.0'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col justify-center space-y-4">
                                        <button
                                            onClick={() => navigate(`/dashboard/passenger/chat`, { state: { partnerId: nextRide.driver?.id } })}
                                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center shadow-lg hover:bg-slate-800 transition-all"
                                        >
                                            <MessageCircle className="mr-2" size={20} /> Falar com Motorista
                                        </button>
                                        <button
                                            onClick={() => navigate(`/ride/${nextRide.id}`)}
                                            className="w-full py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                                        >
                                            Ver Detalhes da Rota
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <PremiumCard delay={0.1}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-4 bg-blue-500/10 rounded-2xl">
                                <Calendar className="text-blue-600" size={24} />
                            </div>
                            <span className="text-4xl font-black text-slate-900">{stats.upcomingRides}</span>
                        </div>
                        <h3 className="text-slate-500 font-semibold text-sm uppercase tracking-wider">Viagens Agendadas</h3>
                    </PremiumCard>

                    <PremiumCard delay={0.2}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-4 bg-emerald-500/10 rounded-2xl">
                                <TrendingUp className="text-emerald-600" size={24} />
                            </div>
                            <span className="text-4xl font-black text-slate-900">{stats.completedRides}</span>
                        </div>
                        <h3 className="text-slate-500 font-semibold text-sm uppercase tracking-wider">Viagens Realizadas</h3>
                    </PremiumCard>

                    <PremiumCard delay={0.3}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-4 bg-amber-500/10 rounded-2xl">
                                <Star className="text-amber-600" size={24} />
                            </div>
                            <span className="text-4xl font-black text-slate-900">{stats.savedMoney.toLocaleString()}</span>
                        </div>
                        <h3 className="text-slate-500 font-semibold text-sm uppercase tracking-wider">Kz Economizados</h3>
                    </PremiumCard>
                </div>

                {/* Quick Actions & Tips */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid lg:grid-cols-3 gap-8"
                >
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-2xl font-bold text-slate-800 ml-2">Ações Rápidas</h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <motion.div variants={itemVariants}>
                                <Link to="/search" className="group flex items-center justify-between p-6 bg-white hover:bg-blue-600 rounded-3xl border border-slate-100 shadow-sm transition-all duration-300">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-3 bg-blue-600 group-hover:bg-white/20 rounded-2xl transition-colors">
                                            <MapPin className="text-white" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 group-hover:text-white transition-colors">Buscar Carona</h3>
                                            <p className="text-sm text-slate-500 group-hover:text-blue-100 transition-colors">Próximo destino te espera</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="text-blue-600 group-hover:text-white group-hover:translate-x-2 transition-all" />
                                </Link>
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <Link to="/dashboard/passenger/my-rides" className="group flex items-center justify-between p-6 bg-white hover:bg-slate-800 rounded-3xl border border-slate-100 shadow-sm transition-all duration-300">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-3 bg-slate-800 group-hover:bg-white/20 rounded-2xl transition-colors">
                                            <Calendar className="text-white" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 group-hover:text-white transition-colors">Minhas Viagens</h3>
                                            <p className="text-sm text-slate-500 group-hover:text-slate-300 transition-colors">Histórico e agendamentos</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="text-slate-800 group-hover:text-white group-hover:translate-x-2 transition-all" />
                                </Link>
                            </motion.div>
                        </div>
                    </div>

                    <motion.div variants={itemVariants} className="mesh-gradient-blue rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

                        <h2 className="font-bold text-2xl mb-4 relative z-10">Dica VIP 💡</h2>
                        <p className="text-blue-100 leading-relaxed mb-8 relative z-10 font-medium">
                            Economize até 70% reservando caronas com motoristas nível "Mestre". Sua segurança é nossa prioridade.
                        </p>

                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 relative z-10">
                            <div className="flex justify-between items-end mb-3">
                                <h3 className="font-bold">Meta de Economia</h3>
                                <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-lg">MENSAL</span>
                            </div>
                            <div className="bg-white/20 rounded-full h-3 mb-3 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min((stats.savedMoney / 50000) * 100, 100)}%` }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                    className="bg-white h-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                                />
                            </div>
                            <div className="flex justify-between text-xs font-bold text-blue-100">
                                <span>{stats.savedMoney.toLocaleString()} Kz</span>
                                <span>50.000 Kz</span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

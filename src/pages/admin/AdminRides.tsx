import React, { useState, useEffect } from 'react';
import { Car, Search, Filter, MoreVertical, MapPin, Calendar, Clock, Users, Trash2, XCircle, CheckCircle2, Loader2, AlertCircle, Eye, DollarSign, User, ShieldCheck, Info, X } from 'lucide-react';
import { Button } from '../../components/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';

export const AdminRides = () => {
    const [rides, setRides] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedRide, setSelectedRide] = useState<any>(null);

    useEffect(() => {
        fetchRides();
    }, []);

    const fetchRides = async () => {
        setLoading(true);
        try {
            // TODO: Implement GET /api/admin/rides
            /*
            const response = await api.get('/admin/rides');
            setRides(response.data || []);
            */
            setRides([]);
        } catch (err) {
            console.error('Error fetching rides:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelRide = async (rideId: string) => {
        if (!confirm('Tem certeza que deseja cancelar esta carona? Todos os passageiros serão notificados.')) return;

        setActionLoading(rideId);
        try {
            // await api.put(`/admin/rides/${rideId}/cancel`);
            setRides(rides.map(r => r.id === rideId ? { ...r, status: 'cancelled' } : r));
            if (selectedRide?.id === rideId) setSelectedRide({ ...selectedRide, status: 'cancelled' });
        } catch (err) {
            console.error('Error cancelling ride:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteRide = async (rideId: string) => {
        if (!confirm('Esta ação removerá permanentemente a carona do sistema. Prosseguir?')) return;

        setActionLoading(rideId);
        try {
            // await api.delete(`/admin/rides/${rideId}`);
            setRides(rides.filter(r => r.id !== rideId));
            setSelectedRide(null);
        } catch (err) {
            console.error('Error deleting ride:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredRides = rides.filter(ride => {
        const searchText = searchTerm.toLowerCase();
        const matchesSearch =
            (ride.origin || '').toLowerCase().includes(searchText) ||
            (ride.destination || '').toLowerCase().includes(searchText) ||
            (ride.driver?.full_name || '').toLowerCase().includes(searchText);

        const departTime = new Date(ride.departure_time);
        const isPast = departTime < new Date();

        // Mapeamento compatível com o banco 'scheduled' -> 'active' na UI
        const baseStatus = (ride.status === 'scheduled' || ride.status === 'active') ? 'active' : ride.status;
        const actualStatus = baseStatus === 'active' && isPast ? 'completed' : baseStatus;

        const matchesStatus = statusFilter === 'all' || actualStatus === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getTotals = () => {
        if (!rides.length) return { completedRevenue: 0, completedCount: 0, pendingRevenue: 0, pendingCount: 0 };
        return rides.reduce((acc, ride) => {
            const isPast = new Date(ride.departure_time) < new Date();
            const baseStatus = (ride.status === 'scheduled' || ride.status === 'active') ? 'active' : ride.status;
            const actualStatus = baseStatus === 'active' && isPast ? 'completed' : baseStatus;

            const numBookings = Array.isArray(ride.bookings) ? ride.bookings.length : 0;
            const revenue = numBookings * (Number(ride.price_per_seat) || 0);

            if (actualStatus === 'completed') {
                acc.completedRevenue += revenue;
                acc.completedCount++;
            } else if (actualStatus === 'active') {
                acc.pendingRevenue += revenue;
                acc.pendingCount++;
            }
            return acc;
        }, { completedRevenue: 0, completedCount: 0, pendingRevenue: 0, pendingCount: 0 });
    };

    const totals = getTotals();

    const getStatusBadge = (status: string, departureTime: string) => {
        const isPast = new Date(departureTime) < new Date();
        if (status === 'cancelled') {
            return <div className="flex items-center text-red-600 bg-red-50 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">CANCELADA</div>;
        }
        if (isPast || status === 'completed') {
            return <div className="flex items-center text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">CONCLUÍDA</div>;
        }
        return <div className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse uppercase">ATIVA</div>;
    };

    return (
        <div className="space-y-6">
            {/* Header / Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CheckCircle2 size={48} className="text-emerald-600" />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 size={18} /></div>
                        <span className="text-xl font-bold text-slate-900">{totals.completedCount}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Viagens Concluídas</p>
                    <p className="text-sm font-bold text-emerald-600 mt-1">{totals.completedRevenue.toLocaleString('pt-AO')} Kz</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Clock size={48} className="text-blue-600" />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Clock size={18} /></div>
                        <span className="text-xl font-bold text-slate-900">{totals.pendingCount}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Viagens Pendentes</p>
                    <p className="text-sm font-bold text-blue-600 mt-1">{totals.pendingRevenue.toLocaleString('pt-AO')} Kz</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign size={48} className="text-orange-600" />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><DollarSign size={18} /></div>
                        <span className="text-xl font-bold text-slate-900">{(totals.completedRevenue + totals.pendingRevenue).toLocaleString('pt-AO')}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Faturamento Estimado</p>
                    <p className="text-[10px] text-slate-400 mt-1">Total (Concluído + Ativo)</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users size={48} className="text-slate-600" />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-slate-50 text-slate-600 rounded-lg"><Users size={18} /></div>
                        <span className="text-xl font-bold text-slate-900">{rides.length}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Histórico Total</p>
                    <p className="text-[10px] text-slate-400 mt-1">Todas as caronas criadas</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Monitoramento de Caronas</h1>
                    <p className="text-slate-500 text-sm">Gerencie todas as viagens publicadas na plataforma.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar origem, destino ou motorista..."
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-80 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <Button
                            variant={showFilters ? 'primary' : 'outline'}
                            className="!py-2 shadow-sm"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter size={18} className="mr-2" /> Filtrar
                        </Button>

                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-4 space-y-4"
                                >
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-wider">Status da Viagem</label>
                                        <div className="space-y-1.5 text-xs">
                                            {['all', 'active', 'completed', 'cancelled'].map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => setStatusFilter(s as any)}
                                                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${statusFilter === s ? 'bg-blue-600 text-white font-bold' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                                                >
                                                    {s === 'all' ? 'Todas as Viagens' :
                                                        s === 'active' ? 'Ativas / Agendadas' :
                                                            s === 'completed' ? 'Já Concluídas' : 'Canceladas'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <Button fullWidth variant="ghost" className="!py-1.5 text-xs hover:bg-slate-50" onClick={() => { setStatusFilter('all'); setSearchTerm(''); }}>
                                        Limpar Filtros
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <Button variant="outline" className="!p-2 shadow-sm" onClick={fetchRides}>
                        <Loader2 size={18} className={loading ? 'animate-spin' : ''} />
                    </Button>
                </div>
            </div>

            {/* Rides Grid */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Motorista</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Rota / Percurso</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data / Horário</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ocupação</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-8">
                                            <div className="h-10 bg-slate-50 rounded-xl w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredRides.length > 0 ? filteredRides.map((ride) => {
                                const departureDate = new Date(ride.departure_time);
                                const numBookings = Array.isArray(ride.bookings) ? ride.bookings.length : 0;

                                return (
                                    <tr key={ride.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold overflow-hidden border border-slate-200 group-hover:border-blue-200 transition-colors shadow-sm">
                                                    {ride.driver?.avatar_url ? (
                                                        <img src={ride.driver.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (ride.driver?.full_name || 'M')?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 leading-tight">{ride.driver?.full_name || 'Desconhecido'}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">{ride.driver?.phone || 'Sem contato'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col space-y-1">
                                                <div className="flex items-center text-slate-900 font-medium tracking-tight">
                                                    <MapPin size={14} className="mr-1.5 text-blue-500" /> {ride.origin}
                                                </div>
                                                <div className="flex items-center text-slate-400 text-xs">
                                                    <MapPin size={14} className="mr-1.5 text-slate-300" /> {ride.destination}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center text-slate-700 font-medium">
                                                    <Calendar size={14} className="mr-1.5 text-slate-400" />
                                                    {departureDate.toLocaleDateString('pt-BR')}
                                                </div>
                                                <div className="flex items-center text-slate-400 text-[11px] mt-0.5 font-mono">
                                                    <Clock size={14} className="mr-1.5" />
                                                    {departureDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-slate-700 font-bold mb-1.5">
                                                <Users size={16} className="mr-2 text-slate-400" />
                                                {numBookings} / {ride.available_seats}
                                            </div>
                                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                <div
                                                    className={`h-full transition-all duration-700 ease-out shadow-sm ${numBookings === ride.available_seats ? 'bg-orange-500' : 'bg-blue-600'
                                                        }`}
                                                    style={{ width: `${(numBookings / ride.available_seats) * 100}%` }}
                                                ></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(ride.status, ride.departure_time)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setSelectedRide(ride)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm"
                                                    title="Ver Detalhes"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {(ride.status === 'active' || ride.status === 'scheduled') && new Date(ride.departure_time) > new Date() && (
                                                    <button
                                                        onClick={() => handleCancelRide(ride.id)}
                                                        disabled={actionLoading === ride.id}
                                                        className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all shadow-sm"
                                                        title="Cancelar Carona"
                                                    >
                                                        {actionLoading === ride.id ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteRide(ride.id)}
                                                    disabled={actionLoading === ride.id}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shadow-sm"
                                                    title="Excluir do Sistema"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="max-w-xs mx-auto">
                                            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                                <Car size={32} className="text-slate-300" />
                                            </div>
                                            <h3 className="text-slate-900 font-bold mb-1">Nenhuma carona disponível</h3>
                                            <p className="text-slate-500 text-xs mb-6 px-4">Não encontramos viagens nos critérios selecionados ou ainda não há dados no banco.</p>
                                            <Button
                                                variant="outline"
                                                className="!py-1.5 !px-4 text-xs font-bold"
                                                onClick={() => { setStatusFilter('all'); setSearchTerm(''); fetchRides(); }}
                                            >
                                                Recarregar Dados
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Ride Details Modal (Omitted for brevity, kept logic same but improved padding/colors) */}
            <AnimatePresence>
                {selectedRide && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-100"
                        >
                            {/* Modal Header */}
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-200 flex items-center justify-center">
                                        <Car size={26} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Informações da Viagem</h2>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border border-slate-100">ID DA CORRIDA</span>
                                            <span className="text-[10px] font-mono text-slate-400">{selectedRide.id}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedRide(null)}
                                    className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all active:scale-95"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-grow overflow-y-auto p-8 space-y-10">
                                {/* Route & Info Section */}
                                <div className="grid md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center">
                                            <MapPin size={14} className="mr-2 text-blue-600" /> Itinerário Completo
                                        </h3>
                                        <div className="flex flex-col space-y-6 relative pl-6 border-l-2 border-slate-100 ml-2">
                                            <div className="relative">
                                                <div className="absolute -left-[33px] top-1 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-md shadow-blue-200"></div>
                                                <p className="text-base font-bold text-slate-900 leading-tight">{selectedRide.origin}</p>
                                                <p className="text-[11px] text-slate-500 font-medium mt-1 uppercase tracking-tight">Local de Partida</p>
                                            </div>
                                            <div className="relative pt-2">
                                                <div className="absolute -left-[33px] top-4 w-4 h-4 rounded-full bg-orange-500 border-4 border-white shadow-md shadow-orange-200"></div>
                                                <p className="text-base font-bold text-slate-900 leading-tight">{selectedRide.destination}</p>
                                                <p className="text-[11px] text-slate-500 font-medium mt-1 uppercase tracking-tight">Local de Chegada</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center">
                                            <Info size={14} className="mr-2 text-blue-600" /> Logs da Viagem
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                                                <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Status Atual</p>
                                                {getStatusBadge(selectedRide.status, selectedRide.departure_time)}
                                            </div>
                                            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                                                <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Valor Assento</p>
                                                <p className="text-base font-black text-slate-900">{Number(selectedRide.price_per_seat).toLocaleString()} <span className="text-[10px]">Kz</span></p>
                                            </div>
                                            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                                                <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Data Partida</p>
                                                <p className="text-sm font-bold text-slate-700">{new Date(selectedRide.departure_time).toLocaleDateString('pt-BR')}</p>
                                            </div>
                                            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                                                <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Hora Partida</p>
                                                <p className="text-sm font-bold text-slate-700">{new Date(selectedRide.departure_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Report Card */}
                                <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-10">
                                        <DollarSign size={100} />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.3em]">Relatório de Faturamento</h3>
                                            <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-white/60 border border-white/5">
                                                Financeiro v1.0
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-8">
                                            <div>
                                                <p className="text-3xl font-black tracking-tighter">{(Array.isArray(selectedRide.bookings) ? selectedRide.bookings.length : 0) * selectedRide.price_per_seat} <span className="text-xs font-normal opacity-50">Kz</span></p>
                                                <p className="text-[10px] font-black opacity-40 uppercase mt-2 tracking-widest">Total Bruto</p>
                                            </div>
                                            <div>
                                                <p className="text-3xl font-black tracking-tighter text-blue-400">{Math.round(((Array.isArray(selectedRide.bookings) ? selectedRide.bookings.length : 0) * selectedRide.price_per_seat) * 0.1)} <span className="text-xs font-normal opacity-50 text-white">Kz</span></p>
                                                <p className="text-[10px] font-black opacity-40 uppercase mt-2 tracking-widest">Fee Sistema (10%)</p>
                                            </div>
                                            <div>
                                                <p className="text-3xl font-black tracking-tighter text-emerald-400">{(Array.isArray(selectedRide.bookings) ? selectedRide.bookings.length : 0)} / {selectedRide.available_seats}</p>
                                                <p className="text-[10px] font-black opacity-40 uppercase mt-2 tracking-widest">Pax / Ocupação</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Participants Table-like Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Manifesto de Bordo</h3>
                                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 uppercase">Confirmados: {Array.isArray(selectedRide.bookings) ? selectedRide.bookings.length : 0}</span>
                                    </div>

                                    <div className="grid gap-4">
                                        {/* Driver Card */}
                                        <div className="flex items-center justify-between p-5 bg-white border-2 border-blue-100 rounded-3xl shadow-sm hover:border-blue-200 transition-colors">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 overflow-hidden shadow-inner">
                                                    {selectedRide.driver?.avatar_url ? (
                                                        <img src={selectedRide.driver.avatar_url} className="w-full h-full object-cover" />
                                                    ) : <User size={28} className="text-blue-300" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-base font-black text-slate-900">{selectedRide.driver?.full_name}</span>
                                                        <span className="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase font-black tracking-widest">Motorista</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 font-medium mt-0.5">{selectedRide.driver?.email}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[11px] font-black font-mono text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">{selectedRide.driver?.phone || 'N/A'}</p>
                                                <div className="flex items-center justify-end text-[9px] text-emerald-600 font-black mt-2 tracking-widest">
                                                    <ShieldCheck size={12} className="mr-1" /> VERIFICADO
                                                </div>
                                            </div>
                                        </div>

                                        {/* Passenger Cards */}
                                        {Array.isArray(selectedRide.bookings) && selectedRide.bookings.length > 0 ? selectedRide.bookings.map((booking: any) => (
                                            <div key={booking.id} className="flex items-center justify-between p-5 bg-slate-50/50 border border-slate-200 border-dashed rounded-3xl hover:bg-slate-50 transition-colors group">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border border-slate-200 overflow-hidden shadow-sm group-hover:border-blue-200 transition-colors">
                                                        {booking.passenger?.avatar_url ? (
                                                            <img src={booking.passenger.avatar_url} className="w-full h-full object-cover" />
                                                        ) : <User size={22} className="text-slate-300" />}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-800 text-sm tracking-tight">{booking.passenger?.full_name || 'Usuário Boleia'}</span>
                                                        <p className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-tighter">{booking.passenger?.email}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-slate-900 tracking-tight">{Number(selectedRide.price_per_seat).toLocaleString()} <span className="text-[10px]">Kz</span></p>
                                                    <div className="flex items-center justify-end space-x-1 mt-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                        <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">Reserva Paga</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="py-12 text-center bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-100">
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm">
                                                    <Users size={20} className="text-slate-300" />
                                                </div>
                                                <p className="text-sm text-slate-400 font-bold tracking-tight px-10">Nada por aqui. Nenhum passageiro reservou esta carona ainda.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer / Actions */}
                            <div className="p-8 border-t border-slate-100 flex items-center justify-between bg-slate-50/30 backdrop-blur-sm">
                                <Button variant="ghost" className="text-red-500 hover:bg-red-50 !px-4 hover:shadow-inner" onClick={() => handleDeleteRide(selectedRide.id)}>
                                    <Trash2 size={18} className="mr-2" /> Remover Registro
                                </Button>
                                <div className="flex space-x-4">
                                    {(selectedRide.status === 'active' || selectedRide.status === 'scheduled') && (
                                        <Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50 font-bold" onClick={() => handleCancelRide(selectedRide.id)}>
                                            <XCircle size={18} className="mr-2" /> Cancelar Oficialmente
                                        </Button>
                                    )}
                                    <Button className="!px-8 font-black uppercase tracking-widest shadow-xl shadow-blue-100" onClick={() => setSelectedRide(null)}>Fechar</Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

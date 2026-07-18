import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Search, Filter, MoreVertical, CheckCircle2, XCircle, Clock, User, Mail, Phone, Award, FileText, Loader2, Database, ExternalLink, X, AlertOctagon, Info, Eye } from 'lucide-react';
import { Button } from '../../components/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';

export const AdminVerifications = () => {
    const [verifications, setVerifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected' | 'none'>('pending');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    useEffect(() => {
        fetchVerifications();
    }, []);

    const fetchVerifications = async () => {
        setLoading(true);
        try {
            // TODO: Implement GET /api/admin/verifications
            /*
            const response = await api.get('/admin/verifications');
            setVerifications(response.data || []);
            */
            setVerifications([]);
        } catch (error) {
            console.error('Error fetching verifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (userId: string, newStatus: 'verified' | 'rejected' | 'pending') => {
        const confirmMsg = newStatus === 'verified' ? 'Confirmar verificação deste usuário?' : 'Rejeitar verificação deste usuário?';
        if (!confirm(confirmMsg)) return;

        setActionLoading(userId);
        try {
            // await api.put(`/admin/verifications/${userId}`, { status: newStatus });
            setVerifications(verifications.map(v => v.id === userId ? { ...v, verification_status: newStatus } : v));
            if (selectedUser?.id === userId) setSelectedUser({ ...selectedUser, verification_status: newStatus });
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredVerifications = verifications.filter(user => {
        const matchesSearch = (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' ? true : user.verification_status === statusFilter;

        // No painel de verificação, mostramos apenas quem é motorista ou tem intenção de ser?
        // Por agora mostramos todos que não são 'none' ou se o filtro for 'all'
        return matchesSearch && matchesStatus;
    });

    const getStats = () => {
        return verifications.reduce((acc, v) => {
            if (v.verification_status === 'pending') acc.pending++;
            if (v.verification_status === 'verified') acc.verified++;
            if (v.verification_status === 'rejected') acc.rejected++;
            return acc;
        }, { pending: 0, verified: 0, rejected: 0 });
    };

    const stats = getStats();

    return (
        <div className="space-y-6">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-2 relative z-10">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Clock size={24} /></div>
                        <span className="text-3xl font-black text-slate-900">{stats.pending}</span>
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest relative z-10">Solicitações Pendentes</p>
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShieldAlert size={120} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-2 relative z-10">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><ShieldCheck size={24} /></div>
                        <span className="text-3xl font-black text-slate-900">{stats.verified}</span>
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest relative z-10">Usuários Verificados</p>
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <CheckCircle2 size={120} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-2 relative z-10">
                        <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><Shield size={24} className="rotate-180" /></div>
                        <span className="text-3xl font-black text-slate-900">{stats.rejected}</span>
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest relative z-10">Rejeitados / Bloqueados</p>
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <XCircle size={120} />
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Centro de Verificações</h1>
                    <p className="text-slate-500 text-sm font-medium">Valide a identidade e documentos dos motoristas para manter a segurança.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou email..."
                            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-80 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <Button
                            variant={showFilters ? 'primary' : 'outline'}
                            className="!py-2.5 shadow-sm"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter size={18} className="mr-2" /> Filtrar Status
                        </Button>

                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 p-6 space-y-4"
                                >
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Status da Verificação</label>
                                    <div className="space-y-1.5">
                                        {['all', 'pending', 'verified', 'rejected', 'none'].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setStatusFilter(s as any)}
                                                className={`w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                            >
                                                {s === 'all' ? 'Todos' :
                                                    s === 'pending' ? 'Pendentes' :
                                                        s === 'verified' ? 'Verificados' :
                                                            s === 'rejected' ? 'Rejeitados' : 'Não Solicitado'}
                                            </button>
                                        ))}
                                    </div>
                                    <Button fullWidth variant="ghost" className="!py-2 text-[10px] font-black border border-dashed border-slate-200" onClick={() => { setStatusFilter('pending'); setSearchTerm(''); }}>
                                        Ver Pendentes
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Verifications List */}
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Candidato</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Documento / NIF</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Data Solicitação</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-medium">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-8 py-8">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-slate-100 rounded-2xl"></div>
                                                <div className="space-y-3">
                                                    <div className="h-4 bg-slate-100 rounded-full w-48"></div>
                                                    <div className="h-3 bg-slate-50 rounded-full w-32"></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredVerifications.length > 0 ? filteredVerifications.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-all group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 rounded-[18px] bg-slate-100 flex items-center justify-center text-slate-400 font-bold overflow-hidden border border-slate-200 shadow-sm group-hover:border-blue-200 transition-all">
                                                {item.avatar_url ? (
                                                    <img src={item.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (item.full_name || item.email)?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">{item.full_name || 'Usuário Boleia'}</div>
                                                <div className="text-[11px] text-slate-500">{item.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center text-slate-700 font-bold">
                                            <FileText size={16} className="mr-2 text-slate-400" />
                                            {item.license_number || (
                                                <span className="text-slate-300 font-normal italic text-xs">Pendente / Não Inf.</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-slate-900 font-bold">
                                            {new Date(item.created_at).toLocaleDateString('pt-BR')}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                            {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        {item.verification_status === 'pending' && (
                                            <div className="inline-flex items-center text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-amber-100">
                                                <Clock size={12} className="mr-1.5" /> AGUARDANDO
                                            </div>
                                        )}
                                        {item.verification_status === 'verified' && (
                                            <div className="inline-flex items-center text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-emerald-100">
                                                <ShieldCheck size={12} className="mr-1.5" /> AUTENTICADO
                                            </div>
                                        )}
                                        {item.verification_status === 'rejected' && (
                                            <div className="inline-flex items-center text-red-600 bg-red-50 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-red-100">
                                                <AlertOctagon size={12} className="mr-1.5" /> REJEITADO
                                            </div>
                                        )}
                                        {item.verification_status === 'none' && (
                                            <div className="inline-flex items-center text-slate-400 bg-slate-50 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-slate-100">
                                                <Shield size={12} className="mr-1.5" /> SEM PEDIDO
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={() => setSelectedUser(item)}
                                                className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm active:scale-95"
                                                title="Analisar Documentos"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            {item.verification_status === 'pending' || item.verification_status === 'none' ? (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdateStatus(item.id, 'verified')}
                                                        disabled={actionLoading === item.id}
                                                        className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all shadow-sm active:scale-95"
                                                        title="Aprovar Verificação"
                                                    >
                                                        {actionLoading === item.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(item.id, 'rejected')}
                                                        disabled={actionLoading === item.id}
                                                        className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shadow-sm active:scale-95"
                                                        title="Rejeitar Solicitação"
                                                    >
                                                        {actionLoading === item.id ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => handleUpdateStatus(item.id, 'pending')}
                                                    className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all shadow-sm active:scale-95"
                                                    title="Mudar para Pendente"
                                                >
                                                    <Clock size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="max-w-xs mx-auto">
                                            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-100">
                                                <Shield size={32} className="text-slate-200" />
                                            </div>
                                            <h3 className="text-slate-900 font-black mb-2 tracking-tight">Tudo em dia!</h3>
                                            <p className="text-slate-400 text-xs px-10 leading-relaxed font-bold">Nenhuma solicitação pendente no momento para este filtro.</p>
                                            <Button
                                                variant="outline"
                                                className="mt-8 !py-2 !px-6 text-[10px] font-black uppercase tracking-widest"
                                                onClick={() => { setStatusFilter('all'); setSearchTerm(''); fetchVerifications(); }}
                                            >
                                                Ver Todos
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Verification Detail Modal */}
            <AnimatePresence>
                {selectedUser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-100"
                        >
                            {/* Header */}
                            <div className="p-10 border-b border-slate-100 relative bg-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-6">
                                        <div className="w-20 h-20 rounded-3xl bg-slate-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                                            {selectedUser.avatar_url ? (
                                                <img src={selectedUser.avatar_url} className="w-full h-full object-cover" />
                                            ) : <User size={40} className="text-slate-300" />}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Análise de Credenciais</h2>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Motorista:</span>
                                                <span className="text-sm font-bold text-slate-700">{selectedUser.full_name || 'Usuário Boleia'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedUser(null)}
                                        className="p-4 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all active:scale-95"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-grow overflow-y-auto p-10 space-y-10">
                                {/* Status Banner */}
                                <div className={`p-6 rounded-[32px] flex items-center justify-between ${selectedUser.verification_status === 'verified' ? 'bg-emerald-50 text-emerald-900' :
                                    selectedUser.verification_status === 'rejected' ? 'bg-red-50 text-red-900' :
                                        'bg-amber-50 text-amber-900'
                                    }`}>
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedUser.verification_status === 'verified' ? 'bg-emerald-600 text-white' :
                                            selectedUser.verification_status === 'rejected' ? 'bg-red-600 text-white' :
                                                'bg-amber-600 text-white'
                                            }`}>
                                            {selectedUser.verification_status === 'verified' ? <ShieldCheck size={28} /> :
                                                selectedUser.verification_status === 'rejected' ? <AlertOctagon size={28} /> :
                                                    <Clock size={28} />}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status Atual</p>
                                            <p className="text-lg font-black uppercase tracking-tight">
                                                {selectedUser.verification_status === 'verified' ? 'Autenticado e Ativo' :
                                                    selectedUser.verification_status === 'rejected' ? 'Acesso Bloqueado / Rejeitado' :
                                                        'Em Análise por Moderador'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Credentials Information */}
                                <div className="space-y-6">
                                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center">
                                        <FileText size={14} className="mr-2 text-blue-600" /> Documentos Informados
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Número da Carta de Condução / NIF</p>
                                                <p className="text-xl font-black text-slate-900 tracking-tight">{selectedUser.license_number || "NÃO FORNECIDO"}</p>
                                            </div>
                                            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-400">
                                                <Award size={24} />
                                            </div>
                                        </div>
                                        <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Telemóvel Vinculado</p>
                                                <p className="text-xl font-black text-slate-900 tracking-tight">{selectedUser.phone || "NÃO FORNECIDO"}</p>
                                            </div>
                                            <div className={`p-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest ${selectedUser.phone_verified ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'}`}>
                                                {selectedUser.phone_verified ? 'Sinal Verificado' : 'Aguardando SMS'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Support Info */}
                                <div className="p-8 bg-slate-900 rounded-[32px] text-white">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <Info size={18} className="text-blue-400" />
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Guia de Moderação</h4>
                                    </div>
                                    <p className="text-slate-400 text-xs leading-relaxed font-medium">
                                        Ao aprovar este usuário, ele receberá o selo oficial de verificação e poderá publicar caronas ilimitadas.
                                        Em caso de divergência nos dados, rejeite e informe o motivo via canal oficial.
                                    </p>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-10 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <Button variant="ghost" className="text-slate-500 hover:bg-slate-100 !px-6 font-bold" onClick={() => setSelectedUser(null)}>
                                    Voltar
                                </Button>
                                <div className="flex space-x-4">
                                    {selectedUser.verification_status !== 'rejected' && (
                                        <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 font-black uppercase tracking-widest text-[10px]" onClick={() => handleUpdateStatus(selectedUser.id, 'rejected')}>
                                            <XCircle size={18} className="mr-2" /> Rejeitar
                                        </Button>
                                    )}
                                    {selectedUser.verification_status !== 'verified' && (
                                        <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-100 font-black uppercase tracking-widest text-[10px]" onClick={() => handleUpdateStatus(selectedUser.id, 'verified')}>
                                            <CheckCircle2 size={18} className="mr-2" /> Aprovar Agora
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

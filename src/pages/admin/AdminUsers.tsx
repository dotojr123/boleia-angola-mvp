import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Search, Filter, MoreVertical, Shield, UserCheck, UserX, Mail, Phone, CheckCircle2, XCircle, Trash2, ShieldCheck, Loader2, Star, Database, ShieldAlert, Award, Calendar, ExternalLink, X, User, Eye, Info } from 'lucide-react';
import { Button } from '../../components/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';

export const AdminUsers = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'driver' | 'passenger'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'none' | 'pending'>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // TODO: Implement GET /api/admin/users
            /*
            const response = await api.get('/admin/users');
            setUsers(response.data || []);
            */
            setUsers([]);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (userId: string) => {
        if (!confirm('Deseja marcar este usuário como VERIFICADO? Isso concede selo de confiança.')) return;
        setActionLoading(userId);
        try {
            // await api.put(`/admin/users/${userId}/verify`);
            setUsers(users.map(u => u.id === userId ? { ...u, verification_status: 'verified' } : u));
            if (selectedUser?.id === userId) setSelectedUser({ ...selectedUser, verification_status: 'verified' });
        } catch (err) {
            console.error('Error verifying user:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.')) return;

        setActionLoading(userId);
        try {
            // await api.delete(`/admin/users/${userId}`);
            setUsers(users.filter(u => u.id !== userId));
            setSelectedUser(null);
        } catch (err) {
            console.error('Error deleting user:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'all' || user.verification_status === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
    });

    const getStats = () => {
        return users.reduce((acc, user) => {
            acc.total++;
            if (user.role === 'driver') acc.drivers++;
            if (user.role === 'passenger') acc.passengers++;
            if (user.verification_status === 'verified') acc.verified++;
            return acc;
        }, { total: 0, drivers: 0, passengers: 0, verified: 0 });
    };

    const stats = getStats();

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><UsersIcon size={20} /></div>
                        <span className="text-2xl font-black text-slate-900">{stats.total}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total de Usuários</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Award size={20} /></div>
                        <span className="text-2xl font-black text-slate-900">{stats.drivers}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Motoristas</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-xl"><Star size={20} /></div>
                        <span className="text-2xl font-black text-slate-900">{stats.passengers}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Passageiros</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><ShieldCheck size={20} /></div>
                        <span className="text-2xl font-black text-slate-900">{stats.verified}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Verificados</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestão de Usuários</h1>
                    <p className="text-slate-500 text-sm">Controle de acesso e verificação da base de dados.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou email..."
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
                                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-6 space-y-6"
                                >
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest">Por Cargo / Role</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['all', 'admin', 'driver', 'passenger'].map((r) => (
                                                <button
                                                    key={r}
                                                    onClick={() => setRoleFilter(r as any)}
                                                    className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${roleFilter === r ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                                >
                                                    {r === 'all' ? 'Todos' : r}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest">Por Verificação</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['all', 'verified', 'none'].map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => setStatusFilter(s as any)}
                                                    className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${statusFilter === s ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                                >
                                                    {s === 'all' ? 'Todos' : s === 'verified' ? 'Sim' : 'Não'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <Button fullWidth variant="ghost" className="!py-2 text-[10px] font-black uppercase tracking-widest border border-dashed border-slate-200" onClick={() => { setRoleFilter('all'); setStatusFilter('all'); setSearchTerm(''); }}>
                                        Resetar Filtros
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Usuário / Perfil</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cargo</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Confiança</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contatos</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Ações de Gestão</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
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
                            ) : filteredUsers.length > 0 ? filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-all group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black overflow-hidden border border-slate-200 shadow-sm group-hover:border-blue-200 transition-colors">
                                                {user.avatar_url ? (
                                                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (user.full_name || user.email)?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{user.full_name || 'Usuário Sem Nome'}</div>
                                                <div className="text-[10px] text-slate-400 font-mono mt-1 tracking-tight uppercase px-1.5 py-0.5 bg-slate-50 rounded inline-block">ID: {user?.id?.substring(0, 12)}...</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] ${user.role === 'admin' ? 'bg-indigo-600 text-white' :
                                            user.role === 'driver' ? 'bg-emerald-500 text-white' :
                                                'bg-blue-500 text-white'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center">
                                            {user.verification_status === 'verified' ? (
                                                <div className="flex items-center text-emerald-600 font-black text-[10px] tracking-wider">
                                                    <div className="w-5 h-5 bg-emerald-100 rounded-lg flex items-center justify-center mr-2">
                                                        <ShieldCheck size={12} />
                                                    </div>
                                                    VERIFICADO
                                                </div>
                                            ) : (
                                                <div className="flex items-center text-slate-400 font-black text-[10px] tracking-wider">
                                                    <div className="w-5 h-5 bg-slate-100 rounded-lg flex items-center justify-center mr-2">
                                                        <ShieldAlert size={12} />
                                                    </div>
                                                    PENDENTE
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col space-y-1.5">
                                            <div className="flex items-center text-[11px] font-bold text-slate-600">
                                                <Mail size={12} className="mr-2 text-slate-400" /> {user.email}
                                            </div>
                                            {user.phone && (
                                                <div className="flex items-center text-[11px] font-bold text-slate-600">
                                                    <Phone size={12} className="mr-2 text-slate-400" /> {user.phone}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={() => setSelectedUser(user)}
                                                className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm active:scale-90"
                                                title="Ficha do Usuário"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            {user.verification_status !== 'verified' && (
                                                <button
                                                    onClick={() => handleVerify(user.id)}
                                                    disabled={actionLoading === user.id}
                                                    className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all shadow-sm active:scale-90"
                                                    title="Validar Cadastro"
                                                >
                                                    {actionLoading === user.id ? <Loader2 size={18} className="animate-spin" /> : <UserCheck size={18} />}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                disabled={actionLoading === user.id}
                                                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shadow-sm active:scale-90"
                                                title="Banir Usuário"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="max-w-xs mx-auto">
                                            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100">
                                                <Database size={40} className="text-slate-200" />
                                            </div>
                                            <h3 className="text-slate-900 font-black mb-2 tracking-tight">Vazio por aqui</h3>
                                            <p className="text-slate-400 text-xs px-10 leading-relaxed font-bold">Nenhum usuário corresponde aos critérios. Tente redefinir os filtros acima.</p>
                                            <Button
                                                variant="outline"
                                                className="mt-8 !py-2 !px-6 text-[10px] font-black uppercase tracking-widest border-2"
                                                onClick={() => { setRoleFilter('all'); setStatusFilter('all'); setSearchTerm(''); }}
                                            >
                                                Ver Todos os Registros
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User Profile Detail Modal */}
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
                            <div className="p-10 border-b border-slate-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                                <div className="absolute bottom-0 right-10 w-20 h-20 bg-indigo-600/5 rounded-full -mb-10 blur-2xl"></div>

                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center space-x-6">
                                        <div className="w-24 h-24 rounded-[32px] bg-slate-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                                            {selectedUser.avatar_url ? (
                                                <img src={selectedUser.avatar_url} className="w-full h-full object-cover" />
                                            ) : <User size={48} className="text-slate-300" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-3 mb-1">
                                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{selectedUser.full_name || 'Sem Nome'}</h2>
                                                {selectedUser.verification_status === 'verified' && (
                                                    <div className="text-blue-600 bg-blue-50 p-1.5 rounded-xl border border-blue-100 shadow-sm" title="Verificado">
                                                        <ShieldCheck size={20} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${selectedUser.role === 'admin' ? 'bg-indigo-600 text-white' :
                                                    selectedUser.role === 'driver' ? 'bg-emerald-500 text-white' :
                                                        'bg-blue-500 text-white'
                                                    }`}>
                                                    {selectedUser.role}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 font-mono">ID: {selectedUser.id}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedUser(null)}
                                        className="p-4 hover:bg-slate-100 rounded-[20px] text-slate-400 transition-all active:scale-95"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-grow overflow-y-auto p-10 space-y-10">
                                {/* Bio / Description */}
                                <div className="space-y-4">
                                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center">
                                        <Info size={14} className="mr-2 text-blue-600" /> Biografia e Detalhes
                                    </h3>
                                    <div className="p-6 bg-slate-50/80 rounded-3xl border border-slate-100 leading-relaxed text-slate-600 font-medium italic">
                                        {selectedUser.bio || "Este usuário ainda não forneceu uma biografia descritiva no perfil."}
                                    </div>
                                </div>

                                {/* Info Grid */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Dados de Contato</p>
                                        <div className="space-y-2">
                                            <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center hover:border-blue-200 transition-colors shadow-sm">
                                                <Mail size={16} className="mr-3 text-blue-500" />
                                                <div className="overflow-hidden">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Email Registrado</p>
                                                    <p className="text-sm font-bold text-slate-700 truncate">{selectedUser.email}</p>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center hover:border-blue-200 transition-colors shadow-sm">
                                                <Phone size={16} className="mr-3 text-blue-500" />
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Telemóvel</p>
                                                    <p className="text-sm font-bold text-slate-700">{selectedUser.phone || "Não informado"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Informações de Conta</p>
                                        <div className="space-y-2">
                                            <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center hover:border-blue-200 transition-colors shadow-sm">
                                                <Calendar size={16} className="mr-3 text-emerald-500" />
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Membro Desde</p>
                                                    <p className="text-sm font-bold text-slate-700">{new Date(selectedUser.created_at).toLocaleDateString('pt-BR')}</p>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center hover:border-blue-200 transition-colors shadow-sm">
                                                <Award size={16} className="mr-3 text-orange-500" />
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Status de Verificação</p>
                                                    <p className={`text-sm font-black uppercase tracking-tight ${selectedUser.verification_status === 'verified' ? 'text-emerald-600' : 'text-orange-500'}`}>
                                                        {selectedUser.verification_status === 'verified' ? 'Conta Autenticada' : 'Aguardando Validação'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Special for Drivers */}
                                {selectedUser.role === 'driver' && (
                                    <div className="p-8 bg-indigo-600 rounded-[32px] text-white shadow-2xl shadow-indigo-100 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-8 opacity-10">
                                            <Award size={80} />
                                        </div>
                                        <div className="relative z-10">
                                            <h4 className="text-xs font-black uppercase tracking-[0.3em] mb-6 text-indigo-200">Painel do Motorista</h4>
                                            <div className="grid grid-cols-2 gap-8">
                                                <div>
                                                    <p className="text-3xl font-black">{selectedUser.rating || "5.0"}</p>
                                                    <p className="text-[10px] font-bold uppercase opacity-60 mt-1">Classificação Média</p>
                                                </div>
                                                <div>
                                                    <p className="text-3xl font-black">{selectedUser.reviews_count || "0"}</p>
                                                    <p className="text-[10px] font-bold uppercase opacity-60 mt-1">Avaliações Recebidas</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="p-10 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <Button variant="ghost" className="text-red-600 hover:bg-red-50 !px-4 hover:shadow-inner" onClick={() => handleDelete(selectedUser.id)}>
                                    <Trash2 size={20} className="mr-2" /> Deletar do Sistema
                                </Button>
                                <div className="flex space-x-4">
                                    {selectedUser.verification_status !== 'verified' && (
                                        <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-100 font-black uppercase tracking-widest text-xs" onClick={() => handleVerify(selectedUser.id)}>
                                            <UserCheck size={20} className="mr-2" /> Validar Conta
                                        </Button>
                                    )}
                                    <Button variant="outline" className="!px-8 font-black uppercase tracking-widest text-xs border-2 border-slate-200" onClick={() => setSelectedUser(null)}>Fechar</Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { Settings, Globe, Shield, DollarSign, Bell, Mail, Phone, Instagram, Facebook, Twitter, Save, Loader2, AlertTriangle, CheckCircle2, Layout, Database, Smartphone, Info } from 'lucide-react';
import { Button } from '../../components/Button';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';

export const AdminSettings = () => {
    const [settings, setSettings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'financial' | 'social' | 'advanced'>('general');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form state maps directly to our keys
    const [formData, setFormData] = useState<any>({
        app_name: '',
        support_email: '',
        support_phone: '',
        commission_rate: '',
        min_commission: '',
        maintenance_mode: false,
        'social_links.instagram': '',
        'social_links.facebook': '',
        'social_links.twitter': ''
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            // TODO: Implement GET /api/admin/settings
            /*
            const response = await api.get('/admin/settings');
            const data = response.data;
            setSettings(data);
            const newFormData: any = {};
            data.forEach((s: any) => {
                if (s.key === 'social_links') {
                    newFormData['social_links.instagram'] = s.value.instagram || '';
                    newFormData['social_links.facebook'] = s.value.facebook || '';
                    newFormData['social_links.twitter'] = s.value.twitter || '';
                } else {
                    newFormData[s.key] = s.value;
                }
            });
            setFormData(newFormData);
            */
            setFormData({
                app_name: 'Boleia Angola',
                support_email: 'suporte@boleiaangola.co.ao',
                support_phone: '+244 923 000 000',
                commission_rate: '10',
                min_commission: '500',
                maintenance_mode: false,
                'social_links.instagram': '',
                'social_links.facebook': '',
                'social_links.twitter': ''
            });
        } catch (err) {
            console.error('Error fetching settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (key: string, value: any) => {
        setFormData({ ...formData, [key]: value });
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            // TODO: Implement PUT /api/admin/settings
            /*
            await api.put('/admin/settings', formData);
            */

            // Simulating success
            setTimeout(() => {
                setMessage({ type: 'success', text: 'Configurações atualizadas com sucesso!' });
                setSaving(false);
                setTimeout(() => setMessage(null), 3000);
            }, 1000);

        } catch (err) {
            setMessage({ type: 'error', text: 'Erro de conexão ao salvar.' });
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Carregando Preferências...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Configurações do Sistema</h1>
                    <p className="text-slate-500 font-medium">Gerencie as regras de negócio, contatos e preferências da plataforma.</p>
                </div>
                <Button
                    className="bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 !px-8 font-black uppercase tracking-widest text-xs"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                    Salvar Mudanças
                </Button>
            </div>

            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl flex items-center ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}
                >
                    {message.type === 'success' ? <CheckCircle2 size={20} className="mr-3" /> : <AlertTriangle size={20} className="mr-3" />}
                    <span className="font-bold text-sm">{message.text}</span>
                </motion.div>
            )}

            <div className="flex flex-col md:flex-row gap-8">
                {/* Tabs Sidebar */}
                <div className="w-full md:w-64 space-y-2">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`w-full flex items-center space-x-3 px-6 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'general' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:bg-slate-100'}`}
                    >
                        <Globe size={18} />
                        <span>Geral</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('financial')}
                        className={`w-full flex items-center space-x-3 px-6 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'financial' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:bg-slate-100'}`}
                    >
                        <DollarSign size={18} />
                        <span>Financeiro</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('social')}
                        className={`w-full flex items-center space-x-3 px-6 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'social' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:bg-slate-100'}`}
                    >
                        <Instagram size={18} />
                        <span>Redes Sociais</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('advanced')}
                        className={`w-full flex items-center space-x-3 px-6 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'advanced' ? 'bg-white text-red-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:bg-slate-100'}`}
                    >
                        <Shield size={18} />
                        <span>Avançado</span>
                    </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm p-8 md:p-10">
                    {activeTab === 'general' && (
                        <div className="space-y-8">
                            <div className="flex items-center space-x-4 mb-2">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Globe size={24} /></div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Informações Gerais</h3>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Identidade da Plataforma</p>
                                </div>
                            </div>

                            <div className="grid gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nome do Aplicativo</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Layout size={18} /></div>
                                        <input
                                            type="text"
                                            value={formData.app_name}
                                            onChange={(e) => handleInputChange('app_name', e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-slate-700"
                                            placeholder="Ex: Boleia Angola"
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email de Suporte</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Mail size={18} /></div>
                                            <input
                                                type="email"
                                                value={formData.support_email}
                                                onChange={(e) => handleInputChange('support_email', e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-slate-700"
                                                placeholder="suporte@exemplo.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Telefone Oficial</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Phone size={18} /></div>
                                            <input
                                                type="text"
                                                value={formData.support_phone}
                                                onChange={(e) => handleInputChange('support_phone', e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-slate-700"
                                                placeholder="+244 ..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'financial' && (
                        <div className="space-y-8">
                            <div className="flex items-center space-x-4 mb-2">
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><DollarSign size={24} /></div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Comissões e Taxas</h3>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Regras Financeiras do Marketplace</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="p-8 bg-slate-50 border border-slate-100 rounded-[32px] space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Taxa de Serviço (%)</label>
                                    <div className="flex items-center space-x-4">
                                        <input
                                            type="number"
                                            value={formData.commission_rate}
                                            onChange={(e) => handleInputChange('commission_rate', e.target.value)}
                                            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-2xl font-black text-emerald-600"
                                        />
                                        <span className="text-2xl font-black text-slate-300">%</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Esta taxa será aplicada automaticamente sobre o valor base de cada carona publicada.</p>
                                </div>

                                <div className="p-8 bg-slate-50 border border-slate-100 rounded-[32px] space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Comissão Mínima (AOA)</label>
                                    <div className="flex items-center space-x-4">
                                        <input
                                            type="number"
                                            value={formData.min_commission}
                                            onChange={(e) => handleInputChange('min_commission', e.target.value)}
                                            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-2xl font-black text-emerald-600"
                                        />
                                        <span className="text-lg font-black text-slate-300">AOA</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Garante que a plataforma tenha uma rentabilidade mínima em viagens de curtíssimo curso.</p>
                                </div>
                            </div>

                            <div className="bg-emerald-600 rounded-3xl p-6 text-white flex items-center space-x-4 shadow-xl shadow-emerald-100">
                                <Info size={24} className="opacity-80 flex-shrink-0" />
                                <p className="text-[11px] font-bold leading-relaxed opacity-90 italic">Dica: Alterar estas taxas não afetará viagens que já foram publicadas ou reservadas anteriormente.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'social' && (
                        <div className="space-y-8">
                            <div className="flex items-center space-x-4 mb-2">
                                <div className="p-3 bg-pink-50 text-pink-600 rounded-2xl"><Instagram size={24} /></div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Presença Digital</h3>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Links de Redes Sociais</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500"><Instagram size={20} /></div>
                                    <input
                                        type="text"
                                        value={formData['social_links.instagram']}
                                        onChange={(e) => handleInputChange('social_links.instagram', e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all font-bold text-slate-700"
                                        placeholder="Link do Instagram"
                                    />
                                </div>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600"><Facebook size={20} /></div>
                                    <input
                                        type="text"
                                        value={formData['social_links.facebook']}
                                        onChange={(e) => handleInputChange('social_links.facebook', e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-slate-700"
                                        placeholder="Link do Facebook"
                                    />
                                </div>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-500"><Twitter size={20} /></div>
                                    <input
                                        type="text"
                                        value={formData['social_links.twitter']}
                                        onChange={(e) => handleInputChange('social_links.twitter', e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-bold text-slate-700"
                                        placeholder="Link do Twitter (X)"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'advanced' && (
                        <div className="space-y-8">
                            <div className="flex items-center space-x-4 mb-2">
                                <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><Shield size={24} /></div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Controle Crítico</h3>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Segurança e Infraestrutura</p>
                                </div>
                            </div>

                            <div className="p-8 border-2 border-dashed border-slate-100 rounded-[32px] space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="max-w-md">
                                        <h4 className="font-black text-slate-900 mb-1">Modo de Manutenção</h4>
                                        <p className="text-[11px] text-slate-400 font-medium">Bloqueia o acesso de todos os usuários (exceto admins) para atualizações críticas no sistema.</p>
                                    </div>
                                    <button
                                        onClick={() => handleInputChange('maintenance_mode', !formData.maintenance_mode)}
                                        className={`w-16 h-8 rounded-full transition-all relative ${formData.maintenance_mode ? 'bg-red-600' : 'bg-slate-200'}`}
                                    >
                                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${formData.maintenance_mode ? 'left-9 shadow-lg' : 'left-1'}`} />
                                    </button>
                                </div>

                                <div className="pt-6 border-t border-slate-100 space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Informações Técnicas</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50 rounded-2xl flex items-center">
                                            <Database size={16} className="text-slate-400 mr-3" />
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase">Banco de Dados</p>
                                                <p className="text-[10px] font-bold text-slate-700 uppercase">Supabase Connected</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl flex items-center">
                                            <Smartphone size={16} className="text-slate-400 mr-3" />
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase">Versão App</p>
                                                <p className="text-[10px] font-bold text-slate-700">v2.1.0-mvp-release</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-red-50 rounded-3xl p-8 border border-red-100 flex items-start space-x-4">
                                <AlertTriangle size={24} className="text-red-600 mt-1 flex-shrink-0" />
                                <div>
                                    <h5 className="text-red-900 font-black mb-1 tracking-tight">Cuidado com estas opções!</h5>
                                    <p className="text-red-700/70 text-[11px] font-medium leading-relaxed">Alterações nestas configurações podem interromper o acesso de milhares de usuários instantaneamente. Tenha certeza do que está fazendo antes de salvar.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

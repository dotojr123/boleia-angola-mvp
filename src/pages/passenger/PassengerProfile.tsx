import React, { useState, useEffect, useRef } from 'react';
import { User, Phone, Mail, Camera, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';
import { LevelBadge } from '../../components/LevelBadge';
import { Star } from 'lucide-react';
import { api } from '../../lib/api';

export const PassengerProfile = () => {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formDataPayload = new FormData();
        formDataPayload.append('avatar', file);

        try {
            const { data } = await api.post('/uploads/avatar', formDataPayload, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (data.avatar_url) {
                setFormData(prev => ({ ...prev, avatar_url: data.avatar_url }));
                updateUser({ avatar_url: data.avatar_url });
                setMessage({ type: 'success', text: 'Foto de perfil atualizada com sucesso!' });
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || 'Erro ao fazer upload da imagem.';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setUploading(false);
        }
    };
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        full_name: '',
        phone: '',
        bio: '',
        avatar_url: '',
        gender: '' as 'MALE' | 'FEMALE' | 'OTHER' | '',
        birthdate: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                full_name: user.full_name || '',
                phone: user.phone || '',
                bio: user.bio || '',
                avatar_url: user.avatar_url || '',
                gender: user.gender || '',
                birthdate: user.birthdate || ''
            });
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setMessage(null);

        try {
            const { data } = await api.put(`/profiles/${user.id}`, {
                first_name: formData.first_name,
                last_name: formData.last_name,
                full_name: `${formData.first_name} ${formData.last_name}`.trim(),
                phone: formData.phone,
                bio: formData.bio,
                gender: formData.gender || null,
                birthdate: formData.birthdate || null
            });

            updateUser(data);
            setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
            setLoading(false);
        } catch (error: any) {
            console.error('Erro ao atualizar perfil:', error);
            const errorMsg = error.response?.data?.error || 'Erro ao atualizar perfil.';
            setMessage({ type: 'error', text: errorMsg });
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-slate-900 mb-8">Meu Perfil</h1>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-8">
                        <div className="flex flex-col items-center mb-8">
                            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleAvatarChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <img
                                    src={formData.avatar_url ? (formData.avatar_url.startsWith('http') ? formData.avatar_url : `${formData.avatar_url}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.full_name || 'User')}&background=0D8ABC&color=fff`}
                                    alt="Profile"
                                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                                />
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    {uploading ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white" />}
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">Clique para alterar a foto</p>

                            {user.experience_level && (
                                <div className="mt-4 flex flex-col items-center">
                                    <LevelBadge level={user.experience_level as any} />
                                    <div className="flex items-center mt-2 text-xs text-slate-500 font-medium">
                                        <Star size={12} className="text-amber-400 fill-current mr-1" />
                                        <span>{user.rating || '5.0'} • {user.reviews_count || 0} avaliações</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {message && (
                            <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Primeiro Nome</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            value={formData.first_name}
                                            onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            placeholder="Ex: João"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Sobrenome</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            value={formData.last_name}
                                            onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            placeholder="Ex: Silva"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Gênero</label>
                                    <select
                                        value={formData.gender}
                                        onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="MALE">Masculino</option>
                                        <option value="FEMALE">Feminino</option>
                                        <option value="OTHER">Outro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Data de Nascimento</label>
                                    <input
                                        type="date"
                                        value={formData.birthdate}
                                        onChange={e => setFormData({ ...formData, birthdate: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Telefone</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        placeholder="+244 9XX XXX XXX"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                    <input
                                        type="email"
                                        value={user?.email}
                                        disabled
                                        className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 ml-1">O email não pode ser alterado.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Sobre Mim</label>
                                <textarea
                                    value={formData.bio}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    rows={4}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                                    placeholder="Conte um pouco sobre você..."
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-end">
                                <Button disabled={loading} className="px-8">
                                    {loading ? (
                                        <span className="flex items-center"><Loader2 className="animate-spin mr-2" size={18} /> Salvando...</span>
                                    ) : (
                                        <span className="flex items-center"><Save className="mr-2" size={18} /> Salvar Alterações</span>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

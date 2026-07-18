import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileEditor } from '../../components/profile/ProfileEditor';
import { DocumentUpload } from '../../components/profile/DocumentUpload';
import { CheckCircle, Shield, Music, MessageCircle, Cigarette, Dog } from 'lucide-react';

export const DriverProfile = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'details' | 'verification' | 'preferences'>('details');

    const renderPreferences = () => (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                <Music className="mr-2 text-blue-600" /> Preferências de Viagem
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mock de preferências - seria ideal ter um componente seletor */}
                <div className="p-4 border rounded-xl flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="bg-slate-100 p-2 rounded-full mr-3"><Music size={20} /></div>
                        <span>Música</span>
                    </div>
                    <select className="bg-transparent font-bold text-blue-600 outline-none">
                        <option>Sim, adoro!</option>
                        <option>Depende</option>
                        <option>Silêncio</option>
                    </select>
                </div>
                <div className="p-4 border rounded-xl flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="bg-slate-100 p-2 rounded-full mr-3"><Dog size={20} /></div>
                        <span>Animais</span>
                    </div>
                    <select className="bg-transparent font-bold text-blue-600 outline-none">
                        <option>Não permito</option>
                        <option>Pequeno porte</option>
                        <option>Todos</option>
                    </select>
                </div>
                <div className="p-4 border rounded-xl flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="bg-slate-100 p-2 rounded-full mr-3"><Cigarette size={20} /></div>
                        <span>Fumar</span>
                    </div>
                    <select className="bg-transparent font-bold text-blue-600 outline-none">
                        <option>Proibido</option>
                        <option>Permitido</option>
                    </select>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Meu Perfil</h1>
                        <p className="text-slate-500">Gerencie suas informações pessoais e verificação.</p>
                    </div>
                    {user?.is_verified && (
                        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full flex items-center font-bold text-sm">
                            <CheckCircle size={16} className="mr-2" /> Conta Verificada
                        </div>
                    )}
                </div>

                <div className="flex space-x-2 mb-8 overflow-x-auto pb-2">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition-colors ${activeTab === 'details' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                    >
                        Dados Pessoais
                    </button>
                    <button
                        onClick={() => setActiveTab('verification')}
                        className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition-colors ${activeTab === 'verification' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                    >
                        Verificação
                        {!user?.is_verified && <span className="ml-2 w-2 h-2 bg-red-500 rounded-full inline-block"></span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('preferences')}
                        className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition-colors ${activeTab === 'preferences' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                    >
                        Preferências
                    </button>
                </div>

                <div className="space-y-6">
                    {activeTab === 'details' && <ProfileEditor />}
                    {activeTab === 'verification' && <DocumentUpload />}
                    {activeTab === 'preferences' && renderPreferences()}
                </div>
            </div>
        </div>
    );
};

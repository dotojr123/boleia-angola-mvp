import React, { useState, useEffect } from 'react';
import { CarFront, User, Mail, Phone, Lock, Loader2 } from 'lucide-react';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const InputGroup = ({ icon: Icon, label, value, placeholder, type = "text", min, className = "", onChange }: any) => (
    <div className={`relative ${className}`}>
        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide hidden md:block">{label}</label>
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon className="text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            </div>
            <input
                type={type}
                defaultValue={value}
                onChange={onChange}
                min={min}
                className="block w-full pl-10 pr-3 py-3 md:py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                placeholder={placeholder}
            />
        </div>
    </div>
);

export const Login = () => {
    const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
    const [userType, setUserType] = useState<'PASSENGER' | 'DRIVER' | 'ADMIN'>('PASSENGER');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
    const [error, setError] = useState<string | null>(null);
    const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && !authLoading) {
            if (user.type === 'ADMIN') {
                navigate('/admin');
            } else if (user.type === 'DRIVER') {
                navigate('/dashboard/driver');
            } else if (user.type === 'PASSENGER') {
                navigate('/dashboard/passenger');
            }
        }
    }, [user, authLoading, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'REGISTER') {
                await signUp({
                    full_name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone,
                    role: userType
                });
            } else {
                await signIn(formData.email, formData.password);
            }
        } catch (err: any) {
            console.error("Erro no Auth:", err);
            setError(err.response?.data?.error || err.message || 'Erro ao processar sua solicitação.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 flex justify-center items-center">
            <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-100">

                {user && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs mr-3">
                                {user.email?.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-xs text-blue-600 font-bold uppercase tracking-tighter">Sessão Ativa</p>
                                <p className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{user.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={async () => { await signOut(); window.location.reload(); }}
                            className="bg-white text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-100 hover:bg-red-50 transition-colors"
                        >
                            Sair
                        </button>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex p-1 mb-8 bg-slate-100 rounded-xl">
                    <button
                        onClick={() => setUserType('PASSENGER')}
                        className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-bold transition-all ${userType === 'PASSENGER'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <User size={18} className="mr-2" /> Passageiro
                    </button>
                    <button
                        onClick={() => setUserType('DRIVER')}
                        className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-bold transition-all ${userType === 'DRIVER'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <CarFront size={18} className="mr-2" /> Motorista
                    </button>

                </div>

                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        {userType === 'PASSENGER' ? (
                            <User size={40} className="text-blue-600" />
                        ) : userType === 'DRIVER' ? (
                            <CarFront size={40} className="text-blue-600" />
                        ) : (
                            <Lock size={40} className="text-blue-600" />
                        )}
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        {mode === 'LOGIN' ? (
                            userType === 'PASSENGER' ? 'Login Passageiro' : userType === 'DRIVER' ? 'Login Motorista' : 'Portal Admin'
                        ) : (
                            userType === 'PASSENGER' ? 'Criar conta Passageiro' : 'Ser Motorista'
                        )}
                    </h2>
                    <p className="text-slate-500 mt-2">
                        {mode === 'LOGIN'
                            ? (userType === 'ADMIN' ? 'Acesso restrito ao gerenciamento.' : 'Entre para gerenciar suas viagens.')
                            : (userType === 'PASSENGER' ? 'Junte-se para viajar com economia.' : 'Comece a ganhar com seus lugares vazios.')}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'REGISTER' && (
                        <InputGroup
                            icon={User}
                            placeholder="Nome completo"
                            label="Nome"
                            value={formData.name}
                            onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                        />
                    )}
                    <InputGroup
                        icon={Mail}
                        placeholder="Seu melhor email"
                        type="email"
                        label="Email"
                        value={formData.email}
                        onChange={(e: any) => setFormData({ ...formData, email: e.target.value })}
                    />
                    {mode === 'REGISTER' && (
                        <InputGroup
                            icon={Phone}
                            placeholder="Número de telefone"
                            type="tel"
                            label="Telefone"
                            value={formData.phone}
                            onChange={(e: any) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    )}
                    <InputGroup
                        icon={Lock}
                        placeholder="Sua senha"
                        type="password"
                        label="Senha"
                        value={formData.password}
                        onChange={(e: any) => setFormData({ ...formData, password: e.target.value })}
                    />

                    <Button fullWidth disabled={loading} className="mt-4 h-12 text-lg">
                        {loading ? (
                            <span className="flex items-center"><Loader2 className="animate-spin mr-2" /> Processando...</span>
                        ) : (
                            mode === 'LOGIN' ? 'Acessar Conta' : (userType === 'PASSENGER' ? 'Criar Conta Grátis' : 'Cadastrar Motorista')
                        )}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-slate-600">
                        {userType !== 'ADMIN' && (
                            <>
                                {mode === 'LOGIN' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                                <button
                                    onClick={() => setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
                                    className="text-blue-600 font-bold ml-1 hover:underline focus:outline-none"
                                >
                                    {mode === 'LOGIN' ? 'Cadastre-se' : 'Entrar'}
                                </button>
                            </>
                        )}
                    </p>
                </div>


            </div>
        </div>
    );
};
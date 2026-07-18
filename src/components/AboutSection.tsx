import React from 'react';
import { Shield, Map, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AboutSection = () => {
    const navigate = useNavigate();

    return (
        <section className="py-20 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Left Content */}
                    <div className="relative z-10">
                        <div className="mb-6">
                            <span className="text-blue-600 font-bold uppercase tracking-wider text-sm mb-2 block">
                                Sobre a Boleia Angola
                            </span>
                            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-6">
                                Conectando Destinos,<br /> Criando Memórias.
                            </h2>
                            <p className="text-slate-500 text-lg leading-relaxed mb-8">
                                Uma viagem compartilhada é uma forma única e inteligente de explorar Angola.
                                Combinando a economia de dividir custos com o conforto de viajar de carro,
                                oferecemos algo para todos — desde aventureiros até famílias que visitam parentes.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-8 mb-10">
                            <div className="flex items-start space-x-4 group">
                                <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Map size={24} />
                                </div>
                                <div>
                                    <h5 className="font-bold text-slate-900 text-lg mb-2">Viagens Exclusivas</h5>
                                    <p className="text-sm text-slate-500">Milhares de destinos disponíveis. Chegue onde os ônibus não chegam.</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-4 group">
                                <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h5 className="font-bold text-slate-900 text-lg mb-2">Segurança Sempre</h5>
                                    <p className="text-sm text-slate-500">Perfis verificados e monitoramento de rota em tempo real.</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/login')}
                            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-8 py-4 rounded-full font-bold hover:bg-blue-700 transition-transform hover:-translate-y-1 shadow-lg shadow-blue-600/30"
                        >
                            <span>Saiba Mais</span>
                            <ArrowRight size={20} />
                        </button>
                    </div>

                    {/* Right Images (Composition) */}
                    <div className="relative">
                        {/* Decorative Elements */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-50/50 rounded-full blur-3xl -z-10"></div>

                        <div className="grid grid-cols-2 gap-4 items-center">
                            <div className="space-y-4 translate-y-8">
                                <img
                                    src="/images/about-interior.png"
                                    alt="Viagem de carro"
                                    className="rounded-2xl shadow-xl w-full h-64 object-cover hover:scale-105 transition-transform duration-500"
                                />
                                <img
                                    src="/images/about-road.png"
                                    alt="Estrada Angola"
                                    className="rounded-2xl shadow-xl w-full h-48 object-cover hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                            <div className="space-y-4">
                                {/* Floating Badge */}
                                <div className="bg-white p-4 rounded-full shadow-lg inline-block absolute -top-12 -right-6 z-20 animate-bounce-slow">
                                    <div className="bg-amber-400 text-slate-900 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider">
                                        COMUNIDADE VIP
                                    </div>
                                </div>

                                <img
                                    src="/images/about-friends.png"
                                    alt="Passageiros felizes"
                                    className="rounded-2xl shadow-xl w-full h-80 object-cover hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};
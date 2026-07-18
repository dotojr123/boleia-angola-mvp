import React from 'react';
import { Target, Users, Zap, Award } from 'lucide-react';

export const About = () => {
    return (
        <div className="animate-fade-in bg-white">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-600 py-24 px-4 relative overflow-hidden text-center text-white">
                <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/3 -translate-y-1/3">
                    <div className="w-96 h-96 bg-white rounded-full blur-3xl"></div>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold mb-6">Nossa História</h1>
                <p className="text-xl text-blue-100 max-w-2xl mx-auto font-medium">
                    Da dificuldade de locomoção de 4 amigos para a maior comunidade de caronas de Angola.
                </p>
            </div>

            {/* Story Section */}
            <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-600 rounded-3xl transform rotate-3 opacity-10"></div>
                        <img
                            src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=1632"
                            alt="Amigos conversando"
                            className="rounded-3xl shadow-xl transform -rotate-2 hover:rotate-0 transition-transform duration-500 relative z-10 w-full object-cover h-[400px]"
                        />
                    </div>
                    <div className="space-y-6">
                        <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 font-bold rounded-full text-sm">
                            O Início de Tudo
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900">
                            Uma ideia nascida da necessidade
                        </h2>
                        <p className="text-slate-600 leading-relaxed text-lg">
                            Tudo começou numa sexta-feira à tarde em Luanda. Éramos <strong>4 amigos</strong> tentando visitar nossas famílias em Benguela e Huambo. A rodoviária estava um caos, os preços das passagens de avião eram proibitivos e não conseguíamos encontrar ninguém de confiança que fosse fazer o mesmo trajeto.
                        </p>
                        <p className="text-slate-600 leading-relaxed text-lg">
                            Ali, entre frustrações e espera, percebemos que centenas de carros passavam vazios indo para o mesmo destino. E se pudéssemos conectar motoristas com assentos livres a passageiros que precisam viajar?
                        </p>
                        <p className="text-slate-600 leading-relaxed text-lg">
                            Assim nasceu a <strong>Boleia Angola</strong>: com a missão de tornar as viagens interprovinciais mais acessíveis, seguras e colaborativas para todos os angolanos.
                        </p>
                    </div>
                </div>
            </section>

            {/* Mission & Values */}
            <section className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900">O que nos move</h2>
                        <p className="text-slate-500 mt-4 max-w-2xl mx-auto">
                            Nossos valores fundamentais que guiam cada decisão que tomamos.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: Users, title: "Comunidade Primeiro", desc: "Acreditamos no poder da colaboração mútua. Quando compartilhamos, todos ganham." },
                            { icon: Target, title: "Inovação Real", desc: "Usamos tecnologia para resolver problemas reais do dia-a-dia dos angolanos." },
                            { icon: Award, title: "Qualidade & Confiança", desc: "Segurança não é negociável. Verificamos cada perfil para garantir a paz de espírito." }
                        ].map((item, i) => (
                            <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all text-center group">
                                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                    <item.icon size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                                <p className="text-slate-500">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team Section (Placeholder for "Os 4 Amigos") */}
            <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-slate-900">Quem faz acontecer</h2>
                    <p className="text-slate-500 mt-4">
                        Conheça os fundadores que transformaram uma ideia em realidade.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { name: "Osório Pedro", role: "CEO & Co-Founder", img: "/images/team/osorio-pedro.jpg", pos: "object-top" },
                        { name: "Roberto Oliveira", role: "COO & Co-Founder", img: "", pos: "object-top" },
                        { name: "Cristiano Tchitumba", role: "CTO & Co-Founder", img: "/images/team/member-1.jpg", pos: "object-center" },
                        { name: "Clementino Quessongo", role: "CPO & Co-Founder", img: "/images/team/member-3.jpg", pos: "object-top" }
                    ].map((member, i) => (
                        <div key={i} className="text-center group">
                            <div className="relative mb-4 mx-auto w-32 h-32 md:w-40 md:h-40">
                                <div className="absolute inset-0 bg-blue-600 rounded-full opacity-0 group-hover:opacity-10 transition-opacity"></div>
                                <img
                                    src={member.img || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&size=200`}
                                    alt={member.name}
                                    className={`w-full h-full rounded-full object-cover ${member.pos || 'object-top'} border-4 border-slate-50 group-hover:border-blue-100 transition-colors shadow-lg`}
                                />
                            </div>
                            <h3 className="font-bold text-slate-900 text-lg">{member.name}</h3>
                            <span className="text-blue-600 text-sm font-medium">{member.role}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

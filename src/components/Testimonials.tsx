import React from 'react';
import { Star, Quote } from 'lucide-react';

const testimonials = [
    {
        name: "João Manuel",
        role: "Passageiro Regular",
        image: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
        text: "Uso a Boleia Angola toda semana para ir de Luanda a Benguela. Nunca foi tão fácil e seguro encontrar transporte confiável.",
        rating: 5
    },
    {
        name: "Ana Paula",
        role: "Motorista Verificada",
        image: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
        text: "A plataforma me ajuda a cobrir os custos das minhas viagens de trabalho. Conheci pessoas incríveis e o sistema é super seguro.",
        rating: 5
    },
    {
        name: "Carlos Dundo",
        role: "Passageiro",
        image: "https://i.pravatar.cc/150?u=a04258114e29026302d",
        text: "Amei a experiência! O motorista foi super pontual e o carro era muito confortável. Recomendo a todos.",
        rating: 4
    }
];

export const Testimonials = () => {
    return (
        <section className="py-20 bg-slate-50 overflow-hidden relative">
            {/* Background Shapes (Simulados com CSS) */}
            <div className="absolute top-20 left-10 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -z-0"></div>
            <div className="absolute bottom-20 right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -z-0"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <span className="text-blue-600 font-bold uppercase tracking-wider text-sm">Depoimentos</span>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">
                        O Que Dizem Nossos Usuários
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {testimonials.map((item, index) => (
                        <div
                            key={index}
                            className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 relative group"
                        >
                            {/* Quote Icon */}
                            <div className="absolute top-8 right-8 text-blue-100 group-hover:text-blue-50 transition-colors">
                                <Quote size={48} fill="currentColor" />
                            </div>

                            {/* Profile Header */}
                            <div className="flex items-center mb-6 relative z-10">
                                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-100 mr-4">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900">{item.name}</h3>
                                    <span className="text-blue-600 text-sm font-medium">{item.role}</span>
                                </div>
                            </div>

                            {/* Rating */}
                            <div className="flex text-yellow-400 mb-4 space-x-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={16}
                                        fill={i < item.rating ? "currentColor" : "none"}
                                        className={i < item.rating ? "text-yellow-400" : "text-slate-200"}
                                    />
                                ))}
                            </div>

                            {/* Text */}
                            <p className="text-slate-600 leading-relaxed relative z-10">
                                "{item.text}"
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

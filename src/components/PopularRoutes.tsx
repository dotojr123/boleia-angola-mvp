import React from 'react';
import { Star, Clock, MapPin, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ROUTES = [
    {
        id: 1,
        origin: 'Luanda',
        destination: 'Benguela',
        image: '/images/route-benguela.jpg',
        price: 15000,
        duration: '6h 30m',
        rating: 4.9,
        reviews: 128
    },
    {
        id: 2,
        origin: 'Luanda',
        destination: 'Huambo',
        image: '/images/route-huambo.jpg',
        price: 18000,
        duration: '8h 15m',
        rating: 4.8,
        reviews: 94
    },
    {
        id: 3,
        origin: 'Benguela',
        destination: 'Lubango',
        image: '/images/route-lubango.jpg',
        price: 12000,
        duration: '4h 45m',
        rating: 4.7,
        reviews: 156
    },
    {
        id: 4,
        origin: 'Lubango',
        destination: 'Namibe',
        image: '/images/route-lubango.jpg',
        price: 5000,
        duration: '2h 10m',
        rating: 4.9,
        reviews: 210
    }
];

export const PopularRoutes = () => {
    const navigate = useNavigate();

    const handleBook = (origin: string, destination: string) => {
        navigate(`/search?from=${origin}&to=${destination}&date=${new Date().toISOString().split('T')[0]}`);
    };

    return (
        <section className="py-20 bg-slate-50 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <span className="text-blue-600 font-bold uppercase tracking-wider text-sm mb-2 block">
                        Destinos Mais Procurados
                    </span>
                    <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
                        Rotas Populares em Angola
                    </h2>
                    <p className="text-slate-500 text-lg">
                        Explore os destinos favoritos da nossa comunidade com os melhores preços e motoristas avaliados.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {ROUTES.map((route) => (
                        <div key={route.id} className="bg-white rounded-2xl shadow-lg overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-slate-100">
                            {/* Image Area */}
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={route.image}
                                    alt={`${route.origin} para ${route.destination}`}
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-900 shadow-sm flex items-center">
                                    <Star size={12} className="text-amber-400 fill-current mr-1" />
                                    {route.rating}
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-slate-900 text-lg flex items-center">
                                        {route.origin} <ArrowRight size={14} className="mx-2 text-slate-400" /> {route.destination}
                                    </h3>
                                </div>

                                <div className="flex items-center text-slate-500 text-sm mb-6">
                                    <Clock size={16} className="mr-2 text-blue-500" />
                                    <span>{route.duration} • Média</span>
                                </div>

                                <div className="flex items-end justify-between border-t border-slate-100 pt-5">
                                    <div>
                                        <span className="block text-xs text-slate-400 font-medium uppercase">A partir de</span>
                                        <span className="text-xl font-extrabold text-blue-600">
                                            {route.price.toLocaleString('pt-AO')} Kz
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleBook(route.origin, route.destination)}
                                        className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
                                    >
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-12">
                    <button
                        onClick={() => navigate('/search')}
                        className="inline-flex items-center font-bold text-slate-900 hover:text-blue-600 hover:underline transition-colors"
                    >
                        Ver todas as rotas disponíveis <ArrowRight size={16} className="ml-2" />
                    </button>
                </div>
            </div>
        </section>
    );
};

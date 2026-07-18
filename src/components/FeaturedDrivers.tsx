import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Star, ShieldCheck } from 'lucide-react';

const drivers = [
    {
        name: "Manuel António",
        role: "Motorista VIP",
        carImage: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=600",
        driverImage: "/images/driver-manuel.jpg",
        rating: 5.0,
        trips: 1240
    },
    {
        name: "Sandra Paiva",
        role: "Super Driver",
        carImage: "https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=600",
        driverImage: "https://i.pravatar.cc/300?u=sandra",
        rating: 4.9,
        trips: 850
    },
    {
        name: "Paulo Costa",
        role: "Motorista Executivo",
        carImage: "https://images.unsplash.com/photo-1503376763036-066120622c74?auto=format&fit=crop&q=80&w=600",
        driverImage: "/images/driver-paulo.jpg",
        rating: 4.95,
        trips: 980
    }
];

export const FeaturedDrivers = () => {
    return (
        <section className="py-24 bg-slate-50 relative overflow-hidden">
            {/* Background Image / Pattern */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2074"
                    alt="Background Pattern"
                    className="w-full h-full object-cover opacity-5"
                />
                <div className="absolute inset-0 bg-blue-900/5 mix-blend-overlay"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <span className="text-blue-600 font-bold uppercase tracking-wider text-sm">Top Parceiros</span>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2">
                        Motoristas em Destaque
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {drivers.map((driver, index) => (
                        <div key={index} className="group relative">
                            {/* Card Container */}
                            <div className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100 pb-6">

                                {/* Image Composition Area */}
                                <div className="relative h-[280px] mb-12">
                                    {/* Main Image (Car/Background) - Equivalent to team-img in template */}
                                    <div className="h-[220px] w-full overflow-hidden rounded-b-[40px]">
                                        <img
                                            src={driver.carImage}
                                            alt="Carro"
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-60"></div>
                                    </div>

                                    {/* Secondary Image (Driver) - Equivalent to team-img2 in template */}
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2">
                                        <div className="relative">
                                            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                                                <img
                                                    src={driver.driverImage}
                                                    alt={driver.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="absolute bottom-1 right-1 bg-blue-600 text-white p-1.5 rounded-full border-2 border-white">
                                                <ShieldCheck size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="text-center px-6">
                                    <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                                        {driver.name}
                                    </h3>
                                    <span className="text-slate-500 text-sm font-medium block mb-4">{driver.role} • {driver.trips} viagens</span>

                                    {/* Rating */}
                                    <div className="flex justify-center items-center space-x-1 mb-6">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                                        ))}
                                        <span className="text-slate-900 font-bold text-sm ml-2">{driver.rating}</span>
                                    </div>

                                    {/* Social/Action */}
                                    <div className="flex justify-center space-x-3 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                        <button className="p-2 bg-slate-100 rounded-full hover:bg-blue-100 hover:text-blue-600 transition-colors">
                                            <Facebook size={18} />
                                        </button>
                                        <button className="p-2 bg-slate-100 rounded-full hover:bg-blue-100 hover:text-blue-600 transition-colors">
                                            <Instagram size={18} />
                                        </button>
                                        <button className="p-2 bg-slate-100 rounded-full hover:bg-blue-100 hover:text-blue-600 transition-colors">
                                            <Twitter size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

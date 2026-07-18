import React from 'react';
import { X, Filter, Minus, Plus } from 'lucide-react';
import { Button } from './Button';
import { BaggagePolicy, RidePreferences, ExperienceLevel } from '../types';

export interface FilterState {
    minPrice: number;
    maxPrice: number;
    timeOfDay: ('morning' | 'afternoon' | 'night')[];
    amenities: {
        pets: boolean;
        smoking: boolean;
        instantBooking: boolean;
        womenOnly: boolean;
    };
    baggage: BaggagePolicy[];
    driverLevel: ExperienceLevel[];
}

interface SearchFiltersProps {
    isOpen: boolean;
    onClose: () => void;
    filters: FilterState;
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
    priceRange: { min: number, max: number };
    totalResults: number;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
    isOpen,
    onClose,
    filters,
    setFilters,
    priceRange,
    totalResults
}) => {
    const handleTimeToggle = (time: 'morning' | 'afternoon' | 'night') => {
        setFilters(prev => {
            const exists = prev.timeOfDay.includes(time);
            return {
                ...prev,
                timeOfDay: exists
                    ? prev.timeOfDay.filter(t => t !== time)
                    : [...prev.timeOfDay, time]
            };
        });
    };

    const handleAmenityToggle = (key: keyof typeof filters.amenities) => {
        setFilters(prev => ({
            ...prev,
            amenities: {
                ...prev.amenities,
                [key]: !prev.amenities[key]
            }
        }));
    };

    const handleBaggageToggle = (policy: BaggagePolicy) => {
        setFilters(prev => {
            const exists = prev.baggage.includes(policy);
            return {
                ...prev,
                baggage: exists
                    ? prev.baggage.filter(p => p !== policy)
                    : [...prev.baggage, policy]
            };
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center">
                        <Filter className="mr-2 text-blue-600" size={20} />
                        Filtros
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Preço */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-800">Faixa de Preço</h3>
                        <div className="px-2">
                             <div className="flex justify-between text-sm text-slate-500 mb-2">
                                <span>{filters.minPrice.toLocaleString()} Kz</span>
                                <span>{filters.maxPrice.toLocaleString()} Kz</span>
                            </div>
                            <input
                                type="range"
                                min={priceRange.min}
                                max={priceRange.max}
                                step={100}
                                value={filters.maxPrice}
                                onChange={(e) => setFilters(prev => ({...prev, maxPrice: parseInt(e.target.value)}))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>
                    </div>

                    {/* Horário */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-800">Horário de Saída</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleTimeToggle('morning')}
                                className={`p-3 rounded-xl border text-sm font-medium transition-all ${filters.timeOfDay.includes('morning') ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                Manhã (06:00 - 12:00)
                            </button>
                            <button
                                onClick={() => handleTimeToggle('afternoon')}
                                className={`p-3 rounded-xl border text-sm font-medium transition-all ${filters.timeOfDay.includes('afternoon') ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                Tarde (12:01 - 18:00)
                            </button>
                            <button
                                onClick={() => handleTimeToggle('night')}
                                className={`p-3 rounded-xl border text-sm font-medium transition-all ${filters.timeOfDay.includes('night') ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                Noite (18:01 - 05:59)
                            </button>
                        </div>
                    </div>

                    {/* Comodidades */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-800">Comodidades</h3>
                        <div className="space-y-3">
                            <label className="flex items-center space-x-3 cursor-pointer p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={filters.amenities.pets}
                                    onChange={() => handleAmenityToggle('pets')}
                                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                />
                                <span className="text-slate-700 font-medium">Aceita Animais 🐾</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={filters.amenities.smoking}
                                    onChange={() => handleAmenityToggle('smoking')}
                                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                />
                                <span className="text-slate-700 font-medium">Permitido Fumar 🚬</span>
                            </label>
                        </div>
                    </div>

                    {/* Bagagem */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-800">Bagagem Permitida</h3>
                        <div className="space-y-2">
                             <label className="flex items-center space-x-3">
                                <input type="checkbox" checked={filters.baggage.includes('small')} onChange={() => handleBaggageToggle('small')} className="rounded text-blue-600" />
                                <span className="text-slate-600">Pequena (Mochila)</span>
                            </label>
                            <label className="flex items-center space-x-3">
                                <input type="checkbox" checked={filters.baggage.includes('medium')} onChange={() => handleBaggageToggle('medium')} className="rounded text-blue-600" />
                                <span className="text-slate-600">Média (Mala de Mão)</span>
                            </label>
                            <label className="flex items-center space-x-3">
                                <input type="checkbox" checked={filters.baggage.includes('large')} onChange={() => handleBaggageToggle('large')} className="rounded text-blue-600" />
                                <span className="text-slate-600">Grande (Despachada)</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-white sticky bottom-0">
                    <Button fullWidth onClick={onClose} className="py-4 text-lg">
                        Ver {totalResults} caronas
                    </Button>
                </div>
            </div>
        </div>
    );
};

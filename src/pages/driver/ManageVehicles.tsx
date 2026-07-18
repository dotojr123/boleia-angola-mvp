import React, { useState, useEffect } from 'react';
import { Car, Trash2, Plus, Loader2, ChevronLeft, Star, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Vehicle, VehicleCategory, ComfortLevel } from '../../types';
import { api } from '../../lib/api';

export const ManageVehicles = () => {
    const { user } = useAuth();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [form, setForm] = useState({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        plate: '',
        seats_capacity: 4,
        category: 'SEDAN' as VehicleCategory,
        comfort_level: 'NORMAL' as ComfortLevel
    });

    useEffect(() => {
        fetchVehicles();
    }, [user]);

    const fetchVehicles = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data } = await api.get('/vehicles');
            setVehicles(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching vehicles", err);
            setVehicles([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este veículo?')) return;

        try {
            await api.delete(`/vehicles/${id}`);
            setMessage({ type: 'success', text: 'Veículo removido com sucesso!' });
            fetchVehicles();
        } catch (err) {
            setMessage({ type: 'error', text: 'Erro ao remover veículo.' });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            await api.post('/vehicles', {
                ...form
            });
            setMessage({ type: 'success', text: 'Veículo cadastrado com sucesso!' });
            setShowForm(false);
            setForm({ make: '', model: '', year: new Date().getFullYear(), color: '', plate: '', seats_capacity: 4, category: 'SEDAN', comfort_level: 'NORMAL' });
            fetchVehicles();
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || err.message || 'Erro desconhecido';
            setMessage({ type: 'error', text: 'Erro ao cadastrar veículo: ' + errorMsg });
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <Link to="/dashboard/driver" className="flex items-center text-slate-500 hover:text-blue-600 mb-6 transition-colors">
                    <ChevronLeft size={20} className="mr-1" />
                    <span className="font-medium">Voltar ao Painel</span>
                </Link>
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Meus Veículos</h1>
                    {!showForm && (
                        <Button onClick={() => setShowForm(true)}>
                            <Plus size={20} className="mr-2" /> Adicionar Veículo
                        </Button>
                    )}
                </div>

                {message && (
                    <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                {showForm && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 animate-in slide-in-from-top-4">
                        <h2 className="text-lg font-bold mb-4">Novo Veículo</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Dados Básicos */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Marca</label>
                                    <input type="text" required className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" placeholder="Ex: Toyota"
                                        value={form.make} onChange={e => setForm({ ...form, make: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Modelo</label>
                                    <input type="text" required className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" placeholder="Ex: Corolla"
                                        value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Ano</label>
                                    <input type="number" required className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200"
                                        value={form.year} onChange={e => setForm({ ...form, year: parseInt(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Cor</label>
                                    <input type="text" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" placeholder="Ex: Prata"
                                        value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Placa</label>
                                    <input type="text" required className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" placeholder="LD-XX-XX-XX"
                                        value={form.plate} onChange={e => setForm({ ...form, plate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Lugares Disponíveis</label>
                                    <input type="number" min="1" max="8" required className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200"
                                        value={form.seats_capacity} onChange={e => setForm({ ...form, seats_capacity: parseInt(e.target.value) })} />
                                </div>
                            </div>

                            {/* Categoria e Conforto v2.0 */}
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Categoria</label>
                                    <select
                                        className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 appearance-none"
                                        value={form.category}
                                        onChange={e => setForm({ ...form, category: e.target.value as VehicleCategory })}
                                    >
                                        <option value="SEDAN">Sedan</option>
                                        <option value="SUV">SUV</option>
                                        <option value="VAN">Van</option>
                                        <option value="WAGON">Perua/Wagon</option>
                                        <option value="TOURISM">Turismo</option>
                                        <option value="CONVERTIBLE">Conversível</option>
                                        <option value="SMALL_UTILITY">Utilitário Pequeno</option>
                                        <option value="BIG_UTILITY">Utilitário Grande</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Nível de Conforto</label>
                                    <select
                                        className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 appearance-none"
                                        value={form.comfort_level}
                                        onChange={e => setForm({ ...form, comfort_level: e.target.value as ComfortLevel })}
                                    >
                                        <option value="BASIC">Básico</option>
                                        <option value="NORMAL">Normal</option>
                                        <option value="COMFORT">Confortável</option>
                                        <option value="LUXURY">Luxo</option>
                                    </select>
                                </div>
                            </div>

                            {/* Conforto e Extras */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 mb-3">Conforto e Detalhes</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <label className="flex items-center space-x-2 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
                                        <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
                                        <span className="text-sm text-slate-600">Ar Condicionado</span>
                                    </label>
                                    <label className="flex items-center space-x-2 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
                                        <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
                                        <span className="text-sm text-slate-600">Porta-malas Grande</span>
                                    </label>
                                    <label className="flex items-center space-x-2 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
                                        <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
                                        <span className="text-sm text-slate-600">Wi-Fi a Bordo</span>
                                    </label>
                                    <label className="flex items-center space-x-2 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
                                        <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
                                        <span className="text-sm text-slate-600">Bancos de Couro</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                                <Button type="submit">Salvar Veículo</Button>
                            </div>
                        </form>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-12"><Loader2 className="animate-spin mx-auto text-blue-500" /></div>
                ) : vehicles.length > 0 ? (
                    <div className="space-y-4">
                        {vehicles.map(vehicle => (
                            <div key={vehicle.id} className="bg-white p-6 rounded-2xl border border-slate-200 flex justify-between items-center group">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                                        <Car size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{vehicle.make} {vehicle.model}</h3>
                                        <p className="text-sm text-slate-500">{vehicle.color} • {vehicle.year}</p>
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 rounded text-xs font-mono font-medium text-slate-600">
                                            {vehicle.plate}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(vehicle.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 border-dashed">
                        <Car size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Sem veículos cadastrados</h3>
                        <p className="text-slate-500 mb-6">Cadastre seu carro para começar a oferecer caronas.</p>
                        <Button onClick={() => setShowForm(true)}>Cadastrar Agora</Button>
                    </div>
                )}
            </div>
        </div>
    );
};

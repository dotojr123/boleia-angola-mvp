import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';
import { MapPin, Calendar, Clock, Car, Briefcase, Plus, Loader2, ChevronLeft, Repeat, Zap, XCircle } from 'lucide-react';
import { Vehicle, BaggagePolicy, RideFrequency, BookingMode, LuggageSize } from '../../types';
import { api } from '../../lib/api';

export const PublishRide = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [fetchingVehicles, setFetchingVehicles] = useState(true);

    // Form States - Atualizado v2.0
    const [formData, setFormData] = useState({
        origin: '',
        destination: '',
        date: '',
        time: '',
        price: '',
        seats: 3,
        vehicle_id: '',
        baggage_policy: 'medium' as BaggagePolicy,
        luggage_size: 'MEDIUM' as LuggageSize,
        frequency: 'UNIQUE' as RideFrequency,
        booking_mode: 'manual' as BookingMode,
        instant_booking: false,
        description: ''
    });
    const [waypoints, setWaypoints] = useState<string[]>([]);

    useEffect(() => {
        const fetchVehicles = async () => {
            if (!user) return;
            try {
                const { data } = await api.get('/vehicles');
                const vehicleList = Array.isArray(data) ? data : [];
                setVehicles(vehicleList);
                if (vehicleList.length > 0) {
                    setFormData(prev => ({ ...prev, vehicle_id: vehicleList[0].id }));
                }
            } catch (err) {
                console.error("Error fetching vehicles", err);
                setVehicles([]);
            } finally {
                setFetchingVehicles(false);
            }
        };
        fetchVehicles();
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!formData.vehicle_id) {
            alert('Por favor, cadastre um veículo antes de publicar uma carona.');
            return;
        }

        setLoading(true);
        try {
            // Fix timezone: Angola uses WAT (UTC+1)
            const departureTime = `${formData.date}T${formData.time}:00+01:00`;

            await api.post('/rides', {
                origin: formData.origin,
                destination: formData.destination,
                departure_time: departureTime,
                price_per_seat: parseFloat(formData.price),
                total_seats: formData.seats,
                available_seats: formData.seats,
                vehicle_id: formData.vehicle_id,
                baggage_policy: formData.baggage_policy,
                luggage_size: formData.luggage_size,
                frequency: formData.frequency,
                booking_mode: formData.booking_mode,
                instant_booking: formData.instant_booking,
                description: formData.description,
                currency: 'AOA',
                waypoints: waypoints.filter(wp => wp.trim() !== '')
            });

            navigate('/dashboard/driver');
        } catch (err: any) {
            console.error(err);
            const errorMsg = err.response?.data?.error || err.message || 'Erro desconhecido';
            alert('Erro ao publicar carona: ' + errorMsg);
            setLoading(false);
        }
    };

    if (fetchingVehicles) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
    }

    if (vehicles.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full">
                    <Car size={64} className="mx-auto text-slate-300 mb-6" />
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Cadastre um Veículo</h2>
                    <p className="text-slate-500 mb-8">Para publicar uma carona, você precisa primeiro cadastrar o carro que irá utilizar.</p>
                    <Button fullWidth onClick={() => navigate('/vehicles')}>
                        Cadastrar Veículo
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <Link to="/dashboard/driver" className="flex items-center text-slate-500 hover:text-blue-600 mb-6 transition-colors">
                    <ChevronLeft size={20} className="mr-1" />
                    <span className="font-medium">Voltar ao Painel</span>
                </Link>
                <h1 className="text-3xl font-bold text-slate-900 mb-8">Publicar Carona</h1>

                <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-8">
                    {/* Rota */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold flex items-center"><MapPin className="mr-2 text-blue-500" size={20} /> Rota</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Origem</label>
                                <input type="text" required className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200"
                                    value={formData.origin} onChange={e => setFormData({ ...formData, origin: e.target.value })} placeholder="Ex: Luanda" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Destino</label>
                                <input type="text" required className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200"
                                    value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} placeholder="Ex: Benguela" />
                            </div>
                        </div>

                        {/* Waypoints v2.0 */}
                        <div className="space-y-3 mt-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Paradas no Caminho (Opcional)</label>
                            {waypoints.map((wp, index) => (
                                <div key={index} className="flex items-center space-x-2 animate-in slide-in-from-left-2 duration-200">
                                    <div className="flex-grow relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                        </div>
                                        <input
                                            type="text"
                                            value={wp}
                                            onChange={(e) => {
                                                const newWps = [...waypoints];
                                                newWps[index] = e.target.value;
                                                setWaypoints(newWps);
                                            }}
                                            placeholder="Cidade ou ponto de parada"
                                            className="w-full pl-8 pr-3 py-2 bg-slate-50/50 rounded-xl border border-slate-100 text-sm focus:bg-white transition-all"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setWaypoints(waypoints.filter((_, i) => i !== index))}
                                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                        <XCircle size={20} />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => setWaypoints([...waypoints, ''])}
                                className="flex items-center space-x-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors py-1"
                            >
                                <Plus size={16} />
                                <span>Adicionar parada intermediária</span>
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-6 space-y-4">
                        <h2 className="text-lg font-bold flex items-center"><Calendar className="mr-2 text-blue-500" size={20} /> Data e Hora</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Data</label>
                                <input type="date" required className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200"
                                    value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} min={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Horário</label>
                                <input type="time" required className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200"
                                    value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Veículo e Bagagem */}
                    <div className="border-t border-slate-100 pt-6 space-y-4">
                        <h2 className="text-lg font-bold flex items-center"><Car className="mr-2 text-blue-500" size={20} /> Veículo e Detalhes</h2>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Selecione o Veículo</label>
                            <div className="grid gap-3">
                                {vehicles.map(vehicle => (
                                    <div key={vehicle.id}
                                        onClick={() => setFormData({ ...formData, vehicle_id: vehicle.id })}
                                        className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${formData.vehicle_id === vehicle.id ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-blue-200'}`}
                                    >
                                        <div>
                                            <p className="font-bold text-slate-900">{vehicle.make} {vehicle.model}</p>
                                            <p className="text-xs text-slate-500">{vehicle.plate} • {vehicle.color}</p>
                                        </div>
                                        {formData.vehicle_id === vehicle.id && <div className="w-4 h-4 bg-blue-500 rounded-full"></div>}
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={() => navigate('/vehicles')} className="mt-2 text-sm text-blue-600 font-bold hover:underline flex items-center">
                                <Plus size={14} className="mr-1" /> Adicionar outro veículo
                            </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 pt-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Política de Bagagem</label>
                                <select
                                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 appearance-none"
                                    value={formData.baggage_policy}
                                    onChange={e => setFormData({ ...formData, baggage_policy: e.target.value as BaggagePolicy })}
                                >
                                    <option value="small">Pequena (Mochila)</option>
                                    <option value="medium">Média (Mala de Mão)</option>
                                    <option value="large">Grande (Mala despachada)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Preço por Lugar (Kz)</label>
                                <input type="number" required min="500" step="500" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200"
                                    value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="Ex: 5000" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Lugares Disponíveis</label>
                            <div className="flex items-center space-x-4">
                                {[1, 2, 3, 4].map(num => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, seats: num })}
                                        className={`w-12 h-12 rounded-xl font-bold flex items-center justify-center transition-all ${formData.seats === num ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Opções Avançadas v2.0 */}
                    <div className="border-t border-slate-100 pt-6 space-y-4">
                        <h2 className="text-lg font-bold flex items-center"><Repeat className="mr-2 text-blue-500" size={20} /> Opções Avançadas</h2>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Frequência da Viagem</label>
                                <select
                                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 appearance-none"
                                    value={formData.frequency}
                                    onChange={e => setFormData({ ...formData, frequency: e.target.value as RideFrequency })}
                                >
                                    <option value="UNIQUE">Viagem Única</option>
                                    <option value="DAILY">Diária</option>
                                    <option value="WEEKLY">Semanal</option>
                                    <option value="WEEKDAYS">Dias Úteis</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Modo de Reserva</label>
                                <select
                                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 appearance-none"
                                    value={formData.booking_mode}
                                    onChange={e => setFormData({ ...formData, booking_mode: e.target.value as BookingMode })}
                                >
                                    <option value="manual">Manual (Aprovar cada reserva)</option>
                                    <option value="auto">Automático (Aceitar todas)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                            <div className="flex items-center">
                                <Zap className="text-amber-500 mr-3" size={24} />
                                <div>
                                    <p className="font-bold text-slate-900">Reserva Instantânea</p>
                                    <p className="text-sm text-slate-500">Passageiros podem reservar sem sua aprovação</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, instant_booking: !formData.instant_booking })}
                                className={`w-14 h-8 rounded-full transition-all ${formData.instant_booking ? 'bg-amber-500' : 'bg-slate-300'}`}
                            >
                                <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all ${formData.instant_booking ? 'translate-x-7' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>

                    <div className="pt-6">
                        <Button fullWidth disabled={loading} className="text-lg py-4">
                            {loading ? <Loader2 className="animate-spin" /> : 'Publicar Carona'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

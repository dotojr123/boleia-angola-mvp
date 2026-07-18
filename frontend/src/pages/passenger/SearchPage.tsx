import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PassengerLayout from '../../components/layout/PassengerLayout';

export default function SearchPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    origin_city: '',
    destination_city: '',
    departure_date: new Date().toISOString().split('T')[0],
    passengers: 1,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redireciona para resultados de busca
    const params = new URLSearchParams({
      origin_city: formData.origin_city,
      destination_city: formData.destination_city,
      departure_date: formData.departure_date,
      passengers: String(formData.passengers),
    });
    navigate(`/passenger/search?${params.toString()}`);
  };

  const cities = [
    'Luanda',
    'Benguela',
    'Huíla',
    'Huambo',
    'Cabinda',
    'Lubango',
    'Malanje',
    'Namibe',
    'Uíge',
    'Soyo',
    'Cabola',
    'Kuito',
  ];

  return (
    <PassengerLayout>
      <div className="fade-in max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Encontre sua próxima viagem
          </h1>
          <p className="text-lg text-gray-600">
            Compareça a destinos em toda Angola com preços acessíveis
          </p>
        </div>

        {/* Formulário de busca */}
        <div className="card mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="origin_city" className="block text-sm font-medium text-gray-700 mb-2">
                  Origem *
                </label>
                <select
                  id="origin_city"
                  name="origin_city"
                  required
                  value={formData.origin_city}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Selecione a cidade de origem</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="destination_city" className="block text-sm font-medium text-gray-700 mb-2">
                  Destino *
                </label>
                <select
                  id="destination_city"
                  name="destination_city"
                  required
                  value={formData.destination_city}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Selecione o destino</option>
                  {cities.filter((c) => c !== formData.origin_city).map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="departure_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Data de viagem *
                </label>
                <input
                  id="departure_date"
                  name="departure_date"
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.departure_date}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="passengers" className="block text-sm font-medium text-gray-700 mb-2">
                  Número de passageiros *
                </label>
                <select
                  id="passengers"
                  name="passengers"
                  required
                  value={formData.passengers}
                  onChange={handleChange}
                  className="input"
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num}>{num} {num === 1 ? 'passageiro' : 'passageiros'}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="btn btn-primary w-full py-3 text-lg flex items-center justify-center gap-2"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Buscar Viagens
              </button>
            </div>
          </form>
        </div>

        {/* Viagens populares */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Rotas Populares</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { from: 'Luanda', to: 'Benguela', price: 5000 },
              { from: 'Luanda', to: 'Huambo', price: 6000 },
              { from: 'Luanda', to: 'Lubango', price: 7000 },
            ].map((route, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg hover:border-brand-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => {
                  setFormData({
                    origin_city: route.from,
                    destination_city: route.to,
                    departure_date: formData.departure_date,
                    passengers: 1,
                  });
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">{route.from}</span>
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <span className="font-semibold text-gray-900">{route.to}</span>
                </div>
                <p className="text-sm text-gray-600">
                  A partir de <span className="font-bold text-brand-600">Kz {route.price.toLocaleString()}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Dicas */}
        <div className="mt-8 card bg-blue-50 border-blue-200">
          <div className="flex items-start gap-4">
            <svg className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Dicas para sua viagem</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Reserve com antecedência para garantir melhor preço</li>
                <li>• Verifique a avaliação do motorista antes de confirmar</li>
                <li>• Chegue 15 minutos antes do horário marcado</li>
                <li>• Lebe documento de identificação para embarque</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PassengerLayout>
  );
}
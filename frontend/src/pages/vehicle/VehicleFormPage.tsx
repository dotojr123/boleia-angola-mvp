import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DriverLayout from '../../components/layout/DriverLayout';

export default function VehicleFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    license_plate: '',
    capacity: 4,
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulação de save - substituir por chamada API
    try {
      // await api.post('/vehicles', formData);
      // Para demo:
      console.log('Salvando veículo:', formData);
      
      setTimeout(() => {
        navigate('/driver/vehicles');
      }, 500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar veículo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DriverLayout>
      <div className="fade-in max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Editar Veículo' : 'Novo Veículo'}
          </h1>
          <p className="mt-1 text-gray-600">
            {isEdit ? 'Atualize as informações do veículo' : 'Adicione um novo veículo à sua frota'}
          </p>
        </div>

        <div className="card">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="make" className="block text-sm font-medium text-gray-700">
                  Marca *
                </label>
                <input
                  id="make"
                  name="make"
                  type="text"
                  required
                  value={formData.make}
                  onChange={handleChange}
                  className="input mt-1"
                  placeholder="ex: Toyota, Honda, Hyundai"
                />
              </div>

              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                  Modelo *
                </label>
                <input
                  id="model"
                  name="model"
                  type="text"
                  required
                  value={formData.model}
                  onChange={handleChange}
                  className="input mt-1"
                  placeholder="ex: Corolla, Civic, Tucson"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                  Ano *
                </label>
                <input
                  id="year"
                  name="year"
                  type="number"
                  required
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={handleChange}
                  className="input mt-1"
                />
              </div>

              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700">
                  Cor *
                </label>
                <input
                  id="color"
                  name="color"
                  type="text"
                  required
                  value={formData.color}
                  onChange={handleChange}
                  className="input mt-1"
                  placeholder="ex: Preto, Branco, Prata"
                />
              </div>
            </div>

            <div>
              <label htmlFor="license_plate" className="block text-sm font-medium text-gray-700">
                Placa *
              </label>
              <input
                id="license_plate"
                name="license_plate"
                type="text"
                required
                value={formData.license_plate}
                onChange={handleChange}
                className="input mt-1"
                placeholder="ex: AA-123-BC"
                pattern="[A-Z]{2}-[0-9]{3}-[A-Z]{2}"
              />
              <p className="mt-1 text-xs text-gray-500">
                Formato: AA-123-BC (duas letras, três números, duas letras)
              </p>
            </div>

            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                Capacidade (lugares) *
              </label>
              <select
                id="capacity"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                className="input mt-1"
              >
                {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'lugar' : 'lugares'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descrição (opcional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="input mt-1"
                placeholder="Descreva o veículo, destaques, etc."
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex-1 flex items-center justify-center disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Salvando...
                  </>
                ) : (
                  isEdit ? 'Atualizar Veículo' : 'Adicionar Veículo'
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/driver/vehicles')}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </DriverLayout>
  );
}
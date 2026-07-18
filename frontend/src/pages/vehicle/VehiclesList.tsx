import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DriverLayout from '../../components/layout/DriverLayout';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  capacity: number;
  is_active: boolean;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dados mockados - substituir por chamada API
    setVehicles([
      {
        id: '1',
        make: 'Toyota',
        model: 'Corolla',
        year: 2020,
        color: 'Prata',
        license_plate: 'AA-123-BC',
        capacity: 4,
        is_active: true,
      },
      {
        id: '2',
        make: 'Honda',
        model: 'Civic',
        year: 2019,
        color: 'Preto',
        license_plate: 'AB-456-DE',
        capacity: 4,
        is_active: true,
      },
      {
        id: '3',
        make: 'Hyundai',
        model: 'Tucson',
        year: 2021,
        color: 'Branco',
        license_plate: 'AC-789-FG',
        capacity: 5,
        is_active: false,
      },
    ]);
    setLoading(false);
  }, []);

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este veículo?')) {
      setVehicles(vehicles.filter((v) => v.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    setVehicles(
      vehicles.map((v) =>
        v.id === id ? { ...v, is_active: !v.is_active } : v
      )
    );
  };

  if (loading) {
    return (
      <DriverLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        </div>
      </DriverLayout>
    );
  }

  return (
    <DriverLayout>
      <div className="fade-in">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meus Veículos</h1>
            <p className="mt-1 text-gray-600">Gerencie seus veículos cadastrados</p>
          </div>
          <Link
            to="/driver/vehicles/new"
            className="btn btn-primary flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Adicionar Veículo
          </Link>
        </div>

        {vehicles.length === 0 ? (
          <div className="card text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum veículo cadastrado</h3>
            <p className="mt-1 text-sm text-gray-500">Comece adicionando seu primeiro veículo.</p>
            <div className="mt-6">
              <Link to="/driver/vehicles/new" className="btn btn-primary">
                Adicionar Veículo
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="text-sm text-gray-500">{vehicle.color}</p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      vehicle.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {vehicle.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    <span className="text-gray-600">Placa: {vehicle.license_plate}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-gray-600">{vehicle.capacity} lugares</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Link
                    to={`/driver/vehicles/${vehicle.id}/edit`}
                    className="btn btn-secondary flex-1 text-center text-sm"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => handleToggleActive(vehicle.id)}
                    className={`btn flex-1 text-sm ${
                      vehicle.is_active ? 'btn-secondary' : 'btn-primary'
                    }`}
                  >
                    {vehicle.is_active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => handleDelete(vehicle.id)}
                    className="btn px-3 bg-red-50 hover:bg-red-100 text-red-600"
                    title="Remover veículo"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DriverLayout>
  );
}
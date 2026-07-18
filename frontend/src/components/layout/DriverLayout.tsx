import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon,
  MapPinIcon,
  CalendarIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
const CarIcon = HomeIcon; // Placeholder até instalar heroicons completo

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { to: '/driver', label: 'Dashboard', icon: HomeIcon },
    { to: '/driver/vehicles', label: 'Veículos', icon: CarIcon },
    { to: '/driver/rides', label: 'Minhas Viagens', icon: MapPinIcon },
    { to: '/driver/rides/new', label: 'Nova Viagem', icon: CalendarIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar superior */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-brand-600">
                Boleia Angola
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-gray-700 text-sm">
                Olá, {user?.full_name}
              </span>
              <button
                onClick={logout}
                className="btn btn-secondary flex items-center gap-2"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Navegação do motorista */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-brand-600 text-brand-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>
    </div>
  );
}
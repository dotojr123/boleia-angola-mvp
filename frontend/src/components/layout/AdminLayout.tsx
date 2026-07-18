import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  MagnifyingGlassIcon as ChartBarIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  DocumentCheckIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Verificação de admin
  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card text-center max-w-md">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-4">Você não tem permissão para acessar esta área.</p>
          <a href="/" className="btn btn-primary">Voltar para Home</a>
        </div>
      </div>
    );
  }

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: ChartBarIcon },
    { to: '/admin/users', label: 'Usuários', icon: UserGroupIcon },
    { to: '/admin/alerts', label: 'Denúncias', icon: ExclamationTriangleIcon },
    { to: '/admin/documents', label: 'Verificações', icon: DocumentCheckIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar superior */}
      <nav className="bg-gray-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">Boleia Admin</h1>
              <span className="ml-4 px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-full">
                ADMIN
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-gray-300 text-sm">
                Olá, {user?.full_name}
              </span>
              <button
                onClick={logout}
                className="btn bg-gray-700 hover:bg-gray-600 text-white flex items-center gap-2"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Navegação do admin */}
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
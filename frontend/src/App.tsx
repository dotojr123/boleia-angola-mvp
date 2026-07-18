import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DriverDashboard from './pages/driver/DriverDashboard';
import VehiclesList from './pages/vehicle/VehiclesList';
import VehicleFormPage from './pages/vehicle/VehicleFormPage';
import SearchPage from './pages/passenger/SearchPage';
import SearchResultsPage from './pages/passenger/SearchResultsPage';
import RideDetailsPage from './pages/ride/RideDetailsPage';
import MyBookingsPage from './pages/passenger/MyBookingsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersManagement from './pages/admin/UsersManagement';
import AlertsManagement from './pages/admin/AlertsManagement';
import DocumentsVerification from './pages/admin/DocumentsVerification';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-brand-600">Boleia Angola</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Olá, {user?.full_name}</span>
              <a href="/passenger" className="btn btn-primary">Passageiro</a>
              <a href="/driver" className="btn btn-secondary">Motorista</a>
              <a href="/admin" className="btn bg-gray-900 hover:bg-gray-800 text-white">Admin</a>
              <button onClick={logout} className="btn btn-secondary">Sair</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="card text-center py-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Bem-vindo ao Boleia Angola!</h2>
            <p className="text-lg text-gray-600 mb-8">Plataforma de compartilhamento de viagens em Angola</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="card border-2 border-brand-200 hover:border-brand-400">
                <h3 className="text-xl font-bold mb-2">Passageiro</h3>
                <p className="text-gray-600 mb-4">Buscar e reservar viagens</p>
                <a href="/passenger" className="btn btn-primary w-full">Como Passageiro</a>
              </div>
              <div className="card border-2 border-green-200 hover:border-green-400">
                <h3 className="text-xl font-bold mb-2">Motorista</h3>
                <p className="text-gray-600 mb-4">Criar viagens e ganhar dinheiro</p>
                <a href="/driver" className="btn btn-secondary w-full">Como Motorista</a>
              </div>
              <div className="card border-2 border-gray-700 hover:border-gray-900">
                <h3 className="text-xl font-bold mb-2">Admin</h3>
                <p className="text-gray-600 mb-4">Painel de administração</p>
                <a href="/admin" className="btn bg-gray-900 hover:bg-gray-800 text-white w-full">Acessar Admin</a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />

      {/* Driver Routes */}
      <Route path="/driver" element={<ProtectedRoute><DriverDashboard /></ProtectedRoute>} />
      <Route path="/driver/vehicles" element={<ProtectedRoute><VehiclesList /></ProtectedRoute>} />
      <Route path="/driver/vehicles/new" element={<ProtectedRoute><VehicleFormPage /></ProtectedRoute>} />
      <Route path="/driver/vehicles/:id/edit" element={<ProtectedRoute><VehicleFormPage /></ProtectedRoute>} />
      <Route path="/driver/rides" element={<ProtectedRoute><div className="card p-6"><h2 className="text-2xl font-bold">Minhas Viagens (em breve)</h2></div></ProtectedRoute>} />

      {/* Passenger Routes */}
      <Route path="/passenger" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
      <Route path="/passenger/search" element={<ProtectedRoute><SearchResultsPage /></ProtectedRoute>} />
      <Route path="/passenger/rides/:id" element={<ProtectedRoute><RideDetailsPage /></ProtectedRoute>} />
      <Route path="/passenger/my-bookings" element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute><UsersManagement /></ProtectedRoute>} />
      <Route path="/admin/alerts" element={<ProtectedRoute><AlertsManagement /></ProtectedRoute>} />
      <Route path="/admin/documents" element={<ProtectedRoute><DocumentsVerification /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
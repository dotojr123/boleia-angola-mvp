import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './src/contexts/AuthContext';
import { Navbar } from './src/components/layout/Navbar';
import { Footer } from './src/components/layout/Footer';
import { Home } from './src/pages/public/Home';
import { About } from './src/pages/public/About';
import { SearchResults } from './src/pages/public/SearchResults';
import { RideDetails } from './src/pages/public/RideDetails';
import { Login } from './src/pages/auth/Login';
import { Chat } from './src/pages/passenger/Chat';
import { PassengerProfile } from './src/pages/passenger/PassengerProfile';
import { ProfileWrapper } from './src/pages/ProfileWrapper';
import { MyRides } from './src/pages/passenger/MyRides';
import { PassengerDashboard } from './src/pages/passenger/PassengerDashboard';
import { DriverDashboard } from './src/pages/driver/DriverDashboard';
import { AdminDashboard } from './src/pages/admin/AdminDashboard';
import { AdminUsers } from './src/pages/admin/AdminUsers';
import { AdminRides } from './src/pages/admin/AdminRides';
import { AdminVerifications } from './src/pages/admin/AdminVerifications';
import { AdminSettings } from './src/pages/admin/AdminSettings';
import { ManageVehicles } from './src/pages/driver/ManageVehicles';
import { PublishRide } from './src/pages/driver/PublishRide';
import ScrollToTop from './src/components/ScrollToTop';
import { DriverEarnings } from './src/pages/driver/DriverEarnings';
import { DriverReviews } from './src/pages/driver/DriverReviews';
import { DriverChat } from './src/pages/driver/DriverChat';
import { DashboardLayout } from './src/components/layout/DashboardLayout';
import { ComingSoon } from './src/pages/ComingSoon';

const PublicLayout: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
    <Navbar />
    <main className="flex-grow">
      <Outlet />
    </main>
    <Footer />
  </div>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/ride/:id" element={<RideDetails />} />
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Legacy Redirects */}
          <Route path="/chat" element={<Navigate to="/dashboard/passenger/chat" replace />} />
          <Route path="/my-rides" element={<Navigate to="/dashboard/passenger/my-rides" replace />} />
          <Route path="/vehicles" element={<Navigate to="/dashboard/driver/vehicles" replace />} />
          <Route path="/publish" element={<Navigate to="/dashboard/driver/publish" replace />} />

          {/* Dashboard Routes (Shared Layout) */}
          <Route element={<DashboardLayout><Outlet /></DashboardLayout>}>
            {/* Passenger */}
            <Route path="/dashboard/passenger" element={<PassengerDashboard />} />
            <Route path="/dashboard/passenger/my-rides" element={<MyRides />} />
            <Route path="/dashboard/passenger/chat" element={<Chat />} />

            {/* Driver */}
            <Route path="/dashboard/driver" element={<DriverDashboard />} />
            <Route path="/dashboard/driver/earnings" element={<DriverEarnings />} />
            <Route path="/dashboard/driver/reviews" element={<DriverReviews />} />
            <Route path="/dashboard/driver/chat" element={<DriverChat />} />
            <Route path="/dashboard/driver/vehicles" element={<ManageVehicles />} />
            <Route path="/dashboard/driver/publish" element={<PublishRide />} />
            <Route path="/dashboard/driver/my-rides" element={<ComingSoon title="Minhas Caronas Publicadas" />} />

            {/* Admin */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/rides" element={<AdminRides />} />
            <Route path="/admin/verifications" element={<AdminVerifications />} />
            <Route path="/admin/settings" element={<AdminSettings />} />

            {/* Profile */}
            <Route path="/profile" element={<ProfileWrapper />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
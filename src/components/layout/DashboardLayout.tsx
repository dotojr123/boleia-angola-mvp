import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import {
    Bell,
    Search,
    Menu,
    X,
    LayoutDashboard,
    Calendar,
    MessageCircle,
    User,
    PlusCircle
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const { user } = useAuth();
    const userRole = user?.type?.toUpperCase() || 'PASSENGER';

    const mobileMenu = {
        PASSENGER: [
            { icon: Search, label: 'Buscar', path: '/search' },
            { icon: Calendar, label: 'Viagens', path: '/dashboard/passenger/my-rides' },
            { icon: PlusCircle, label: 'Pequena', path: '/', isCenter: true }, // Placeholder for main action
            { icon: MessageCircle, label: 'Chat', path: '/dashboard/passenger/chat' },
            { icon: User, label: 'Perfil', path: '/profile' },
        ],
        DRIVER: [
            { icon: LayoutDashboard, label: 'Painel', path: '/dashboard/driver' },
            { icon: MessageCircle, label: 'Chat', path: '/dashboard/driver/chat' },
            { icon: PlusCircle, label: 'Publicar', path: '/dashboard/driver/publish', isCenter: true },
            { icon: Calendar, label: 'Caronas', path: '/dashboard/driver/my-rides' },
            { icon: User, label: 'Perfil', path: '/profile' },
        ],
        ADMIN: [
            { icon: LayoutDashboard, label: 'Painel', path: '/admin' },
            { icon: Calendar, label: 'Viagens', path: '/admin/rides' },
            { icon: PlusCircle, label: 'Novo', path: '/admin/settings', isCenter: true },
            { icon: MessageCircle, label: 'Chat', path: '/admin/verifications' },
            { icon: User, label: 'Perfil', path: '/profile' },
        ]
    };

    const currentMobileItems = mobileMenu[userRole as keyof typeof mobileMenu] || mobileMenu.PASSENGER;

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
                <Sidebar
                    isCollapsed={isSidebarCollapsed}
                    onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />
            </div>

            {/* Main Content Area */}
            <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'} pb-24 lg:pb-0`}>
                {/* Dashboard Top Header (Desktop only or shared) */}
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-6 flex items-center justify-between">
                    <div className="lg:hidden">
                        <img
                            src="/images/logo-full.png"
                            alt="Logo"
                            className="h-8 w-auto"
                        />
                    </div>

                    <div className="hidden lg:block">
                        <h2 className="text-xl font-bold text-slate-800">
                            {userRole === 'ADMIN' ? 'Painel de Controle' : userRole === 'DRIVER' ? 'Modo Motorista' : 'Área do Passageiro'}
                        </h2>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all relative">
                            <Bell size={22} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden sm:block"></div>
                        <div className="flex items-center space-x-3 cursor-pointer group">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{user?.full_name?.split(' ')[0] || 'Olá'}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{userRole}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                                {user?.avatar_url ? (
                                    <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={20} className="text-slate-400" />
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 px-2 pb-safe-area flex items-center justify-around z-50 h-20">
                {currentMobileItems.map((item, index) => (
                    <NavLink
                        key={index}
                        to={item.path}
                        className={({ isActive }) => `
                            flex flex-col items-center justify-center py-2 transition-all duration-200
                            ${item.isCenter ? '-mt-10 mb-5' : ''}
                            ${isActive && !item.isCenter ? 'text-blue-600' : 'text-slate-400'}
                        `}
                    >
                        <div className={`
                            ${item.isCenter
                                ? 'w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/40 border-4 border-slate-50'
                                : 'p-1'}
                        `}>
                            <item.icon size={item.isCenter ? 28 : 24} />
                        </div>
                        {!item.isCenter && <span className="text-[10px] font-bold mt-1 uppercase tracking-tight">{item.label}</span>}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
};

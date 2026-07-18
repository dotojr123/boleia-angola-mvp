import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Search,
    Calendar,
    MessageCircle,
    User,
    PlusCircle,
    Car,
    DollarSign,
    Star,
    Users,
    MapPin,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Settings,
    Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const userRole = user?.type?.toUpperCase() || 'PASSENGER';

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const menuItems = {
        PASSENGER: [
            { icon: LayoutDashboard, label: 'Painel', path: '/dashboard/passenger' },
            { icon: Search, label: 'Buscar Carona', path: '/search' },
            { icon: Calendar, label: 'Minhas Viagens', path: '/dashboard/passenger/my-rides' },
            { icon: MessageCircle, label: 'Mensagens', path: '/dashboard/passenger/chat' },
            { icon: User, label: 'Meu Perfil', path: '/profile' },
        ],
        DRIVER: [
            { icon: LayoutDashboard, label: 'Painel', path: '/dashboard/driver' },
            { icon: PlusCircle, label: 'Publicar Carona', path: '/dashboard/driver/publish' },
            { icon: Car, label: 'Minhas Caronas', path: '/dashboard/driver/my-rides' }, // Added to plan
            { icon: DollarSign, label: 'Meus Ganhos', path: '/dashboard/driver/earnings' },
            { icon: Star, label: 'Avaliações', path: '/dashboard/driver/reviews' },
            { icon: MessageCircle, label: 'Chat', path: '/dashboard/driver/chat' },
            { icon: User, label: 'Meu Perfil', path: '/profile' },
        ],
        ADMIN: [
            { icon: LayoutDashboard, label: 'Estatísticas', path: '/admin' },
            { icon: Users, label: 'Usuários', path: '/admin/users' },
            { icon: MapPin, label: 'Caronas Ativas', path: '/admin/rides' },
            { icon: Shield, label: 'Verificações', path: '/admin/verifications' },
            { icon: Settings, label: 'Configurações', path: '/admin/settings' },
        ]
    };

    const currentItems = menuItems[userRole as keyof typeof menuItems] || menuItems.PASSENGER;

    const accentColor = userRole === 'ADMIN' ? 'indigo' : userRole === 'DRIVER' ? 'emerald' : 'blue';

    return (
        <aside
            className={`fixed left-0 top-0 h-full bg-white border-r border-slate-200 z-50 transition-all duration-300 flex flex-col ${isCollapsed ? 'w-20' : 'w-72'
                }`}
        >
            {/* Logo Section */}
            <div className="p-6 flex items-center justify-between">
                {!isCollapsed && (
                    <img
                        src="/images/logo-full.png"
                        alt="Boleia Angola"
                        className="h-10 w-auto object-contain"
                    />
                )}
                {isCollapsed && (
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                        B
                    </div>
                )}
                <button
                    onClick={onToggle}
                    className="p-1 px-1 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {/* User Profile Summary */}
            {!isCollapsed && (
                <div className="px-6 py-4 mb-4">
                    <div className="bg-slate-50 p-4 rounded-2xl flex items-center space-x-3 border border-slate-100">
                        <div className={`w-10 h-10 rounded-full bg-${accentColor}-100 flex items-center justify-center text-${accentColor}-600 font-bold`}>
                            {user?.full_name?.substring(0, 1) || user?.email?.substring(0, 1).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-slate-900 truncate">{user?.full_name || 'Usuário'}</p>
                            <p className={`text-[10px] font-bold text-${accentColor}-600 uppercase tracking-wider`}>{userRole}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Menu */}
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
                {currentItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
                            flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group
                            ${isActive
                                ? `bg-${accentColor}-50 text-${accentColor}-600 font-bold shadow-sm`
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
                        `}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon
                                    size={22}
                                    className={isActive ? `text-${accentColor}-600` : 'text-slate-400 group-hover:text-slate-600'}
                                />
                                {!isCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-sm"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 mt-auto border-t border-slate-100 space-y-2">
                {!isCollapsed && (
                    <div className={`p-4 rounded-2xl bg-${accentColor}-600 text-white shadow-lg shadow-${accentColor}-600/20 mb-4`}>
                        <p className="text-xs font-bold opacity-80 uppercase tracking-tighter mb-1">Precisa de Ajuda?</p>
                        <p className="text-sm font-medium leading-tight">Acesse nossa central de suporte 24/7.</p>
                    </div>
                )}

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors font-bold text-sm"
                >
                    <LogOut size={22} />
                    {!isCollapsed && <span>Sair da Conta</span>}
                </button>
            </div>
        </aside>
    );
};

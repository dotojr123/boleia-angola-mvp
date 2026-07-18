import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  MessageCircle
} from 'lucide-react';

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const location = useLocation();

  const userRole = user?.type?.toUpperCase();

  // Handle Scroll Effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Active Link Helper
  const isActive = (path: string) => location.pathname === path;

  // Filtragem de Links baseada no Role
  const getNavLinks = () => {
    const baseLinks = [
      { name: 'Início', path: '/' },
    ];

    if (user) {
      if (userRole === 'DRIVER') {
        // Motorista vê Início e Publicar
        baseLinks.push({ name: 'Publicar Carona', path: '/dashboard/driver/publish' });
      } else if (userRole === 'PASSENGER') {
        // Passageiro vê Início, Buscar e Sobre Nós
        baseLinks.push({ name: 'Buscar Carona', path: '/search' });
        baseLinks.push({ name: 'Sobre Nós', path: '/about' });
      }
    } else {
      // Visitante apenas vê Início e Sobre Nós
      baseLinks.push({ name: 'Sobre Nós', path: '/about' });
    }

    return baseLinks;
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Main Header */}
      <header
        className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-lg py-2 top-0' : 'bg-white/95 backdrop-blur-md py-4 top-0'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to={user ? (userRole === 'ADMIN' ? '/admin' : (userRole === 'DRIVER' ? '/dashboard/driver' : '/dashboard/passenger')) : "/"} className="flex items-center group">
              <img
                src="/images/logo-full.png"
                alt="Boleia Angola"
                className={`transition-all duration-300 object-cover object-center ${isScrolled ? 'h-12 w-32' : 'h-20 w-48'
                  }`}
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-base font-bold uppercase tracking-wide hover:text-blue-600 transition-colors ${isActive(link.path) ? 'text-blue-600' : 'text-slate-600'
                    }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* User Actions */}
            <div className="hidden lg:flex items-center space-x-4">
              {!user ? (
                <>
                  <Link to="/login" className="text-slate-600 font-bold text-base hover:text-blue-600">
                    Entrar
                  </Link>
                  <Link
                    to="/login"
                    className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold text-base shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center"
                  >
                    <User size={18} className="mr-2" />
                    Criar Conta
                  </Link>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  {/* My Dashboard Link - Only show if role is loaded */}
                  {userRole && (
                    <Link
                      to={userRole === 'ADMIN' ? '/admin' : (userRole === 'DRIVER' ? '/dashboard/driver' : '/dashboard/passenger')}
                      className="flex items-center text-slate-600 hover:text-blue-600 font-medium"
                    >
                      <LayoutDashboard size={18} className="mr-2" />
                      Painel
                    </Link>
                  )}

                  {/* Unread Messages */}
                  {location.pathname.startsWith('/dashboard') && (
                    <Link to="/dashboard/driver/chat" className="relative text-slate-500 hover:text-blue-600 transition-colors">
                      <MessageCircle size={22} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  )}

                  {/* User Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                      className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-100 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                        {user.email?.substring(0, 2)}
                      </div>
                      <ChevronDown size={14} className="text-slate-400" />
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-50 animate-fade-in">
                        <div className="px-4 py-3 border-b border-slate-50">
                          <p className="text-sm font-bold text-slate-900 truncate">{user.full_name || user.name || 'Usuário'}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                          <p className="text-[10px] font-bold text-blue-500 uppercase mt-1 tracking-wider border border-blue-100 bg-blue-50 inline-block px-1.5 rounded">{user.type}</p>
                        </div>

                        <div className="py-2">
                          <Link
                            to={userRole?.toUpperCase() === 'ADMIN' ? '/admin' : (userRole?.toUpperCase() === 'DRIVER' ? '/dashboard/driver' : '/dashboard/passenger')}
                            className="block px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            Meu Painel
                          </Link>
                          {userRole === 'DRIVER' && (
                            <Link
                              to="/dashboard/driver/vehicles"
                              className="block px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                              onClick={() => setIsProfileMenuOpen(false)}
                            >
                              Meus Veículos
                            </Link>
                          )}
                          {userRole === 'PASSENGER' && (
                            <Link
                              to="/dashboard/passenger/my-rides"
                              className="block px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                              onClick={() => setIsProfileMenuOpen(false)}
                            >
                              Minhas Viagens
                            </Link>
                          )}
                          <Link
                            to="/profile"
                            className="block px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            Configurações
                          </Link>
                        </div>

                        <div className="border-t border-slate-50 pt-2 pb-1">
                          <button
                            onClick={() => { signOut(); setIsProfileMenuOpen(false); }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                          >
                            <LogOut size={14} className="mr-2" /> Sair
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-slate-600 hover:text-blue-600 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden bg-white border-t border-slate-100 absolute w-full shadow-xl transition-all duration-300 origin-top ${isMenuOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 h-0 overflow-hidden'
          }`}>
          <div className="px-4 py-6 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={`block text-lg font-bold ${isActive(link.path) ? 'text-blue-600' : 'text-slate-700'
                  }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="border-t border-slate-100 pt-4 mt-4">
              {!user ? (
                <div className="grid grid-cols-2 gap-4">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-center py-3 rounded-xl font-bold text-slate-600 bg-slate-50"
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-center py-3 rounded-xl font-bold text-white bg-blue-600"
                  >
                    Criar Conta
                  </Link>
                </div>
              ) : (
                <button
                  onClick={() => { signOut(); setIsMenuOpen(false); }}
                  className="w-full py-3 flex items-center justify-center text-red-500 font-bold bg-red-50 rounded-xl"
                >
                  <LogOut size={18} className="mr-2" />
                  Sair da Conta
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Click outside to close menu */}
      {isProfileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsProfileMenuOpen(false)}></div>
      )}

      {/* Spacer to prevent content overlap with fixed header */}
      <div className="h-[100px]"></div>
    </>
  );
};

import { useState, useEffect, type ReactNode } from 'react';
import { createContext, useContext } from 'react';
import { authService } from '../services/api';

interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'passenger' | 'driver' | 'admin';
  verification_status: 'none' | 'pending' | 'verified' | 'rejected';
  avatar_url?: string;
  rating?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar usuário do localStorage no mount
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (token && storedUser) {
      // Validar token com o backend
      authService
        .getProfile()
        .then(() => {
          setUser(JSON.parse(storedUser));
        })
        .catch(() => {
          // Token inválido
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const userData = await authService.login(email, password);
    if (userData.token) {
      localStorage.setItem('token', userData.token);
      localStorage.setItem('user', JSON.stringify(userData.user));
      setUser(userData.user);
    }
  };

  const register = async (registerData: any) => {
    await authService.register(registerData);
    // Após registro, fazer login automático
    await login(registerData.email, registerData.password);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
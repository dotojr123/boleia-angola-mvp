import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as SupaUser } from '@supabase/supabase-js'; // Keeping for type compat temporarily or remove
import { User } from '../types';
import { api } from '../lib/api';

// New Auth Types
interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    role: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: any) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => { },
  signUp: async () => { },
  signOut: async () => { },
  isAuthenticated: false,
  updateUser: () => { }
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const updateUser = (data: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      localStorage.setItem('auth_user', JSON.stringify(updated));
      return updated;
    });
  };

  // Check for token on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          // Verify token or fetch profile
          // Since our API currently doesn't have a /me endpoint, we might rely on localStorage user data OR impl /me
          // For MVP reliability, let's decode existing user data or fetch generic profile if ID known.
          // Better: We stored 'auth_user' in localStorage on login too?

          const storedUser = localStorage.getItem('auth_user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            // Normalizar role
            let role = parsedUser.role || 'PASSENGER';
            if (role.toLowerCase() === 'driver') role = 'DRIVER';
            else if (role.toLowerCase() === 'passenger') role = 'PASSENGER';
            else if (role.toLowerCase() === 'admin') role = 'ADMIN';
            else role = role.toUpperCase();

            setUser({ ...parsedUser, type: role } as any);
          }
        } catch (error) {
          console.error("Auth init error", error);
          localStorage.removeItem('auth_token');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', { email, password });
      const { token, user: apiUser } = response.data;

      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(apiUser));

      // Normalizar role
      let role = apiUser.role || 'PASSENGER';
      if (role.toLowerCase() === 'driver') role = 'DRIVER';
      else if (role.toLowerCase() === 'passenger') role = 'PASSENGER';
      else if (role.toLowerCase() === 'admin') role = 'ADMIN';
      else role = role.toUpperCase();

      setUser({ ...apiUser, type: role } as any);
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  };

  const signUp = async (data: any) => {
    try {
      const response = await api.post<AuthResponse>('/auth/register', data);
      const { token, user: apiUser } = response.data;

      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(apiUser));

      setUser({ ...apiUser, type: 'PASSENGER' } as any); // Default role
    } catch (error) {
      console.error('Signup failed', error);
      throw error;
    }
  };

  const signOut = async () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut,
      isAuthenticated: !!user,
      updateUser
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

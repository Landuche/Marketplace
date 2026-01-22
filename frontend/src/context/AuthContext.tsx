import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserInterface } from '../interfaces/interfaces';
import api from '../services/api';
import { toast } from 'sonner';

interface AuthContextInterface {
  user: UserInterface | null;
  login: (tokens: { access: string; refresh: string }) => void;
  logout: () => Promise<void>;
  loading: boolean;
  fetchMe: () => Promise<void>;
}

interface AuthProviderInterface {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextInterface | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderInterface) => {
  const [user, setUser] = useState<UserInterface | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const fetchMe = async () => {
    try {
      const response = await api.get('/users/me/');
      if (response.status === 200) setUser(response.data);
    } catch {
      setUser(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');

    if (token) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, []);

  const login = (tokens: { access: string; refresh: string }) => {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    fetchMe();
  };

  const logout = async () => {
    const token = localStorage.getItem('refresh_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    navigate('/', { replace: true });

    Promise.resolve().then(() => {
      setUser(null);
      toast.success('Successfully logged out');
    });

    if (token) {
      try {
        await api.post('/token/blacklist/', { refresh: token });
      } catch {}
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

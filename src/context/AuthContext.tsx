import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, storage } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  login: (identifier: string, password: string) => Promise<void>;
  register: (username: string, mail: string, password: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => storage.getUser());
  const [token, setToken] = useState<string | null>(() => storage.getToken());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const existingToken = storage.getToken();
      if (existingToken) {
        try {
          const profile = await api.getMe();
          setUser(profile);
          setToken(existingToken);
        } catch (err) {
          console.warn('Session verification failed, logging out:', err);
          storage.clear();
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const clearError = () => setError(null);

  const login = async (identifier: string, pass: string) => {
    setError(null);
    try {
      const res = await api.login(identifier, pass);
      setUser(res.user);
      setToken(res.token);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
      throw err;
    }
  };

  const register = async (username: string, mail: string, pass: string) => {
    setError(null);
    try {
      const res = await api.register(username, mail, pass);
      setUser(res.user);
      setToken(res.token);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      throw err;
    }
  };

  const demoLogin = async () => {
    setError(null);
    try {
      const res = await api.login('alex_finance', 'password123');
      setUser(res.user);
      setToken(res.token);
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
      throw err;
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        error,
        clearError,
        login,
        register,
        demoLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

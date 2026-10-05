import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Initialize and check user session via /api/auth/me
  const checkAuth = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/auth/me');
      if (res && res.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      // 401 simply means not logged in
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      if (res && res.success && res.data?.user) {
        setUser(res.data.user);
        if (res.data.token) {
          localStorage.setItem('fitpilot_token', res.data.token);
        }
        return { success: true, user: res.data.user };
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      const msg = err.message || 'Invalid credentials';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  const register = async (name, email, password) => {
    setAuthError(null);
    try {
      const res = await apiClient.post('/auth/register', { name, email, password });
      if (res && res.success && res.data?.user) {
        setUser(res.data.user);
        if (res.data.token) {
          localStorage.setItem('fitpilot_token', res.data.token);
        }
        return { success: true, user: res.data.user };
      }
      throw new Error(res.message || 'Registration failed');
    } catch (err) {
      const msg = err.message || 'Registration failed';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      // Ignore server logout error, still clear client state
    } finally {
      localStorage.removeItem('fitpilot_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        authError,
        setAuthError,
        login,
        register,
        logout,
        checkAuth,
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

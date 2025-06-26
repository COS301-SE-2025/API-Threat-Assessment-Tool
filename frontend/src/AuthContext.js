import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('at_at_token') || '');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await axios.get('http://localhost:3001/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setCurrentUser(res.data.data.user);
        } else {
          logout();
        }
      } catch {
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const login = async (identifier, password) => {
    setIsLoading(true);
    try {
      const res = await axios.post('http://localhost:3001/api/auth/login', {
        [identifier.includes('@') ? 'email' : 'username']: identifier,
        password
      });

      const { token, user } = res.data.data;
      localStorage.setItem('at_at_token', token);
      setToken(token);
      setCurrentUser(user);

      return { success: true, user };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Login failed'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData) => {
    setIsLoading(true);
    try {
      const res = await axios.post('http://localhost:3001/api/auth/signup', userData);
      if (res.data.success) {
        const loginRes = await login(userData.email, userData.password);
        if (loginRes.success) {
          return { success: true, user: loginRes.user };
        } else {
          return { success: false, error: 'Signup succeeded but auto-login failed.' };
        }
      } else {
        return { success: false, error: res.data.message };
      }
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Signup failed'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('at_at_token');
    setCurrentUser(null);
    setToken('');
  };

  const updateProfile = async (updatedData) => {
    if (!token || !currentUser) return { success: false, error: 'Not authenticated' };

    setIsLoading(true);
    try {
      const res = await axios.put('http://localhost:3001/api/user/update', updatedData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setCurrentUser(res.data.data.user);
        return { success: true, user: res.data.data.user };
      } else {
        return { success: false, error: res.data.message };
      }
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Update failed'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = () => !!token && !!currentUser;

  const getUserFullName = () => {
    if (!currentUser) return 'Guest';
    return `${currentUser.firstName} ${currentUser.lastName}`;
  };

  const value = {
    currentUser,
    isLoading,
    login,
    signup,
    logout,
    updateProfile,
    isAuthenticated,
    getUserFullName
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
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

  // Base API URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // Use the new user profile endpoint
        const res = await axios.get(`${API_BASE_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.success) {
          setCurrentUser(res.data.data.user);
        } else {
          console.error('Failed to fetch profile:', res.data.message);
          logout();
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
        if (error.response?.status === 401) {
          logout();
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const login = async (identifier, password) => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        [identifier.includes('@') ? 'email' : 'username']: identifier,
        password
      });

      if (res.data.success) {
        const { token: newToken, user } = res.data.data;
        localStorage.setItem('at_at_token', newToken);
        setToken(newToken);
        setCurrentUser(user);

        return { success: true, user };
      } else {
        return { success: false, error: res.data.message };
      }
    } catch (err) {
      console.error('Login error:', err);
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
      const res = await axios.post(`${API_BASE_URL}/api/auth/signup`, userData);
      
      if (res.data.success) {
        // Auto-login after successful signup
        const loginRes = await login(userData.email, userData.password);
        if (loginRes.success) {
          return { success: true, user: loginRes.user };
        } else {
          return { 
            success: false, 
            error: 'Signup succeeded but auto-login failed. Please log in manually.' 
          };
        }
      } else {
        return { success: false, error: res.data.message };
      }
    } catch (err) {
      console.error('Signup error:', err);
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
    if (!token || !currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    setIsLoading(true);
    try {
      const res = await axios.put(`${API_BASE_URL}/api/user/update`, updatedData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        const updatedUser = res.data.data.user;
        setCurrentUser(updatedUser);
        return { success: true, user: updatedUser };
      } else {
        return { success: false, error: res.data.message };
      }
    } catch (err) {
      console.error('Profile update error:', err);
      return {
        success: false,
        error: err.response?.data?.message || 'Update failed'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (currentPassword, newPassword) => {
    if (!token || !currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    setIsLoading(true);
    try {
      const res = await axios.put(`${API_BASE_URL}/api/user/password`, {
        currentPassword,
        newPassword,
        confirmPassword: newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        return { success: true };
      } else {
        return { success: false, error: res.data.message };
      }
    } catch (err) {
      console.error('Password update error:', err);
      return {
        success: false,
        error: err.response?.data?.message || 'Password update failed'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const getUserPreferences = async () => {
    if (!token || !currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/api/user/preferences`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        return { success: true, preferences: res.data.data.preferences };
      } else {
        return { success: false, error: res.data.message };
      }
    } catch (err) {
      console.error('Get preferences error:', err);
      return {
        success: false,
        error: err.response?.data?.message || 'Failed to load preferences'
      };
    }
  };

  const updatePreferences = async (preferences) => {
    if (!token || !currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const res = await axios.put(`${API_BASE_URL}/api/user/preferences`, { preferences }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        return { success: true };
      } else {
        return { success: false, error: res.data.message };
      }
    } catch (err) {
      console.error('Update preferences error:', err);
      return {
        success: false,
        error: err.response?.data?.message || 'Failed to update preferences'
      };
    }
  };

  const refreshProfile = async () => {
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setCurrentUser(res.data.data.user);
        return { success: true, user: res.data.data.user };
      } else {
        return { success: false, error: res.data.message };
      }
    } catch (err) {
      console.error('Profile refresh error:', err);
      return {
        success: false,
        error: err.response?.data?.message || 'Failed to refresh profile'
      };
    }
  };

  const isAuthenticated = () => {
    return !!token && !!currentUser;
  };

  const getUserFullName = () => {
    if (!currentUser) return 'Guest';
    
    const firstName = currentUser.firstName || '';
    const lastName = currentUser.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else if (currentUser.username) {
      return currentUser.username;
    } else {
      return 'User';
    }
  };

  const getUserInitials = () => {
    if (!currentUser) return 'U';
    
    const firstName = currentUser.firstName || '';
    const lastName = currentUser.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (lastName) {
      return lastName.charAt(0).toUpperCase();
    } else if (currentUser.username) {
      return currentUser.username.charAt(0).toUpperCase();
    } else if (currentUser.email) {
      return currentUser.email.charAt(0).toUpperCase();
    } else {
      return 'U';
    }
  };

  const hasPermission = (permission) => {
    // Placeholder for role-based permissions
    // For now, all authenticated users have all permissions
    return isAuthenticated();
  };

  const getAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const value = {
    // State
    currentUser,
    isLoading,
    token,

    // Authentication methods
    login,
    signup,
    logout,
    isAuthenticated,

    // Profile management
    updateProfile,
    updatePassword,
    refreshProfile,
    getUserFullName,
    getUserInitials,

    // Preferences management
    getUserPreferences,
    updatePreferences,

    // Utility methods
    hasPermission,
    getAuthHeaders
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
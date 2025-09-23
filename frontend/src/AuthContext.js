import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const AuthContext = createContext();

// Initialize Supabase client for Google OAuth only
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,     // Fixed: Changed to true for proper session handling
      persistSession: true,       // Fixed: Changed to true to persist OAuth sessions
      detectSessionInUrl: true,
      storage: window.localStorage,
      flowType: 'pkce'
    }
  });
}

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
  const [oAuthProcessing, setOAuthProcessing] = useState(false);

  // Base API URL - matches your backend
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // Use your existing profile endpoint
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

  // Fixed: Improved OAuth session detection and handling
  useEffect(() => {
    const checkOAuthSession = async () => {
      if (!supabase) return;

      try {
        console.log('Checking for OAuth session...');
        console.log('Current URL:', window.location.href);
        
        // Check if this is an OAuth callback
        const isOAuthCallback = window.location.hash.includes('access_token') || 
                               window.location.search.includes('code') ||
                               window.location.hash.includes('error');

        if (!isOAuthCallback) {
          console.log('Not an OAuth callback');
          return;
        }

        console.log('OAuth callback detected, processing...');
        setOAuthProcessing(true);

        // Handle OAuth errors first
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
        
        const error = urlParams.get('error') || hashParams.get('error');
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
        
        if (error) {
          console.error('OAuth error:', error, errorDescription);
          // Clean URL and show error to user
          window.history.replaceState({}, document.title, window.location.pathname);
          setOAuthProcessing(false);
          return;
        }

        // Get the session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }
        
        if (session && session.user) {
          console.log('Valid OAuth session found:', session.user.email);
          await handleGoogleOAuthSuccess(session.user);
          // Clean URL after successful processing
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          console.log('No valid session found');
        }
      } catch (error) {
        console.error('OAuth session check error:', error);
        // Clean URL even on error
        window.history.replaceState({}, document.title, window.location.pathname);
      } finally {
        setOAuthProcessing(false);
      }
    };

    // Process OAuth callback immediately
    checkOAuthSession();

    // Fixed: Better auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event);
        
        if (event === 'SIGNED_IN' && session?.user && !oAuthProcessing) {
          console.log('Auth state: signed in with', session.user.email);
          setOAuthProcessing(true);
          try {
            await handleGoogleOAuthSuccess(session.user);
          } catch (error) {
            console.error('Auth state change error:', error);
          } finally {
            setOAuthProcessing(false);
          }
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  /**
   * Handle successful Google OAuth and create/login user
   */
  const handleGoogleOAuthSuccess = async (googleUser) => {
    try {
      setIsLoading(true);
      console.log('Processing Google OAuth for:', googleUser.email);

      // Fixed: Better data extraction from Google user
      const metadata = googleUser.user_metadata || {};
      const fullName = metadata.full_name || metadata.name || '';
      const nameParts = fullName.split(' ');

      const userData = {
        email: googleUser.email,
        firstName: metadata.given_name || nameParts[0] || '',
        lastName: metadata.family_name || nameParts.slice(1).join(' ') || '',
        name: fullName || googleUser.email.split('@')[0],
        profilePicture: metadata.avatar_url || metadata.picture || '',
        googleId: googleUser.id,
        provider: 'google'
      };

      console.log('Sending to backend:', userData.email);

      // Send to your existing backend Google login endpoint
      const res = await axios.post(`${API_BASE_URL}/api/auth/google-login`, userData);

      if (res.data.success) {
        const { token: newToken, user } = res.data.data;
        localStorage.setItem('at_at_token', newToken);
        setToken(newToken);
        setCurrentUser(user);

        // Clean up Supabase session after successful backend processing
        await supabase.auth.signOut();

        console.log('Google OAuth successful, user logged in');
        return { success: true, user };
      } else {
        throw new Error(res.data.message || 'Google login failed');
      }
    } catch (error) {
      console.error('Google OAuth backend error:', error);
      // Clean up Supabase session on error
      if (supabase) await supabase.auth.signOut();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initiate Google OAuth login
   */
  const loginWithGoogle = async () => {
    if (!supabase) {
      return {
        success: false,
        error: 'Google login not configured. Please check environment variables.'
      };
    }

    try {
      setIsLoading(true);
      console.log('Initiating Google OAuth...');

      // Fixed: Better redirect URL construction
      const redirectUrl = window.location.origin + window.location.pathname;
      console.log('Using redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error('OAuth initiation error:', error);
        throw error;
      }

      console.log('OAuth initiation successful');
      // OAuth will redirect, so this won't execute immediately
      return { success: true, data };
    } catch (error) {
      console.error('Google OAuth initiation error:', error);
      setIsLoading(false);
      return {
        success: false,
        error: error.message || 'Failed to initiate Google login'
      };
    }
  };

  const login = async (identifier, password) => {
    setIsLoading(true);
    try {
      // Use your existing login endpoint structure
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
      // Use your existing signup endpoint
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

  const logout = async () => {
    localStorage.removeItem('at_at_token');
    setCurrentUser(null);
    setToken('');

    // Also sign out from Supabase if there's an active session
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.warn('Supabase logout error:', error);
      }
    }
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
    return isAuthenticated();
  };

  const getAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const value = {
    // State
    currentUser,
    isLoading: isLoading || oAuthProcessing, // Fixed: Include OAuth processing in loading state
    token,

    // Authentication methods
    login,
    loginWithGoogle, // Google OAuth method
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
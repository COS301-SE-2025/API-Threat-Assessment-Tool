import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Default demo users for testing
const DEFAULT_USERS = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    username: 'johndoe',
    password: 'password123'
  },
  {
    id: 2,
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    username: 'janesmith',
    password: 'demo123'
  }
];

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize users and check for existing session
  useEffect(() => {
    // Initialize default users if not exists
    const existingUsers = JSON.parse(localStorage.getItem('at_at_users') || '[]');
    if (existingUsers.length === 0) {
      localStorage.setItem('at_at_users', JSON.stringify(DEFAULT_USERS));
    }

    // Check for existing session
    const sessionUser = JSON.parse(localStorage.getItem('at_at_current_user') || 'null');
    const sessionExpiry = localStorage.getItem('at_at_session_expiry');
    
    if (sessionUser && sessionExpiry && new Date().getTime() < parseInt(sessionExpiry)) {
      setCurrentUser(sessionUser);
    } else {
      // Clear expired session
      localStorage.removeItem('at_at_current_user');
      localStorage.removeItem('at_at_session_expiry');
    }
    
    setIsLoading(false);
  }, []);

  // Get all users from localStorage
  const getUsers = () => {
    return JSON.parse(localStorage.getItem('at_at_users') || '[]');
  };

  // Save users to localStorage
  const saveUsers = (users) => {
    localStorage.setItem('at_at_users', JSON.stringify(users));
  };

  // Create session with 24-hour expiry
  const createSession = (user) => {
    const expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000); // 24 hours
    localStorage.setItem('at_at_current_user', JSON.stringify(user));
    localStorage.setItem('at_at_session_expiry', expiryTime.toString());
    setCurrentUser(user);
  };

  // Clear session
  const clearSession = () => {
    localStorage.removeItem('at_at_current_user');
    localStorage.removeItem('at_at_session_expiry');
    setCurrentUser(null);
  };

  // Login function
  const login = async (username, password) => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const users = getUsers();
    const user = users.find(u => 
      (u.username === username || u.email === username) && u.password === password
    );
    
    if (user) {
      // Remove password from user object for security
      const { password: _, ...userWithoutPassword } = user;
      createSession(userWithoutPassword);
      setIsLoading(false);
      return { success: true, user: userWithoutPassword };
    } else {
      setIsLoading(false);
      return { success: false, error: 'Invalid username/email or password' };
    }
  };

  // Signup function
  const signup = async (userData) => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const users = getUsers();
    
    // Check if user already exists
    const existingUser = users.find(u => 
      u.email === userData.email || u.username === userData.username
    );
    
    if (existingUser) {
      setIsLoading(false);
      if (existingUser.email === userData.email) {
        return { success: false, error: 'Email address is already registered' };
      } else {
        return { success: false, error: 'Username is already taken' };
      }
    }
    
    // Create new user
    const newUser = {
      id: users.length + 1,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      username: userData.username,
      password: userData.password,
      createdAt: new Date().toISOString()
    };
    
    // Add to users array
    const updatedUsers = [...users, newUser];
    saveUsers(updatedUsers);
    
    setIsLoading(false);
    return { success: true, message: 'Account created successfully!' };
  };

  // Logout function
  const logout = () => {
    clearSession();
  };

  // Update user profile
  const updateProfile = async (updatedData) => {
    if (!currentUser) return { success: false, error: 'No user logged in' };
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex !== -1) {
      // Update user data
      const updatedUser = { 
        ...users[userIndex], 
        ...updatedData,
        updatedAt: new Date().toISOString()
      };
      
      users[userIndex] = updatedUser;
      saveUsers(users);
      
      // Update current session
      const { password: _, ...userWithoutPassword } = updatedUser;
      createSession(userWithoutPassword);
      
      setIsLoading(false);
      return { success: true, user: userWithoutPassword };
    }
    
    setIsLoading(false);
    return { success: false, error: 'User not found' };
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return currentUser !== null;
  };

  // Get user's full name
  const getUserFullName = () => {
    if (!currentUser) return 'Guest';
    return `${currentUser.firstName} ${currentUser.lastName}`;
  };

  // Demo function to reset to default users (for testing)
  const resetToDefaults = () => {
    localStorage.setItem('at_at_users', JSON.stringify(DEFAULT_USERS));
    clearSession();
  };

  const value = {
    currentUser,
    isLoading,
    login,
    signup,
    logout,
    updateProfile,
    isAuthenticated,
    getUserFullName,
    resetToDefaults
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
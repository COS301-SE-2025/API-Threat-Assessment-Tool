import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ThemeContext } from './App';
import { useAuth } from './AuthContext';
import Logo from "./components/Logo";
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { login, isLoading, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  const handleInputChange = (field, value) => {
    if (field === 'username') setUsername(value);
    if (field === 'password') setPassword(value);
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password) {
      setError('Please enter both username/email and password');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await login(username.trim(), password);
      
      if (result.success) {
        // Navigate to the page they were trying to access, or dashboard
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      // Simulate Google OAuth flow
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, create a Google user
      const googleUser = {
        firstName: 'Google',
        lastName: 'User',
        email: 'google.user@gmail.com',
        username: 'googleuser',
        loginMethod: 'google'
      };

      // Simulate successful Google login
      const result = await login('demo@google.com', 'google_demo_password');
      
      if (!result.success) {
        // If Google user doesn't exist, show success message anyway (in real app, would create account)
        alert('Google login successful! In a real application, this would create your account automatically.');
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError('Google login failed. Please try again or use email/password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (demoUsername, demoPassword) => {
    setUsername(demoUsername);
    setPassword(demoPassword);
    setError('');
    
    // Small delay to show the form update
    setTimeout(async () => {
      setIsSubmitting(true);
      try {
        const result = await login(demoUsername, demoPassword);
        if (result.success) {
          const from = location.state?.from?.pathname || '/dashboard';
          navigate(from, { replace: true });
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Demo login failed. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }, 300);
  };

  return (
    <div className="login-container">
      <header className="login-header">
        <div className="logo" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Logo />
          <span style={{
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: 2,
            color: darkMode ? "#fff" : "#222",
            userSelect: "none"
          }}>
            AT-AT
          </span>
        </div>
        <div className="user-info">
          <button onClick={toggleDarkMode} className="theme-toggle-btn">
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </header>

      <main className="login-main">
        <section className="login-form-section">
          <h1>Welcome Back</h1>
          <p className="login-subtitle">Sign in to your AT-AT account</p>
          
          <button 
            onClick={handleGoogleLogin} 
            className="google-login-btn"
            disabled={isSubmitting}
          >
            <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" />
            Continue with Google
          </button>
          
          <div className="or-separator">
            <span>or</span>
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username">Username or Email:</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                disabled={isSubmitting}
                placeholder="Enter your username or email"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={isSubmitting}
                placeholder="Enter your password"
                required
              />
            </div>
            <button type="submit" className="login-btn" disabled={isSubmitting || isLoading}>
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="demo-section">
            <h3>Quick Demo Login</h3>
            <p>Try the application with these demo accounts:</p>
            <div className="demo-buttons">
              <button 
                onClick={() => handleDemoLogin('johndoe', 'password123')}
                className="demo-btn"
                disabled={isSubmitting}
              >
                Login as John Doe
              </button>
              <button 
                onClick={() => handleDemoLogin('janesmith', 'demo123')}
                className="demo-btn"
                disabled={isSubmitting}
              >
                Login as Jane Smith
              </button>
            </div>
          </div>

          <div className="login-links">
            <Link to="/signup" className="create-account-link">Create Account</Link>
            <Link to="/forgot-password" className="forgot-password-link">Forgot Password?</Link>
          </div>
        </section>
      </main>

      <footer className="login-footer">
        <p>© 2025 AT-AT (API Threat Assessment Tool) • COS301 Capstone Project. All rights reserved.</p>
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
};

export default Login;
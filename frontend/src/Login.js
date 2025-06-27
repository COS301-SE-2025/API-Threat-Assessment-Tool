import React, { useContext, useState, useEffect, useRef } from 'react';
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
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [animationPhase, setAnimationPhase] = useState('entering');

  const formRef = useRef(null);
  const errorRef = useRef(null);
  const submitButtonRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFormVisible(true);
      setAnimationPhase('visible');
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isAuthenticated()) {
      setAnimationPhase('exiting');
      const from = location.state?.from?.pathname || '/dashboard';
      setTimeout(() => navigate(from, { replace: true }), 300);
    }
  }, [isAuthenticated, navigate, location.state]);

  const handleInputChange = (field, value) => {
    if (field === 'identifier') setIdentifier(value);
    if (field === 'password') setPassword(value);
    if (error) {
      setError('');
      if (errorRef.current) errorRef.current.style.animation = 'fadeOut 0.3s ease-out';
    }
  };

  const getButtonContent = (text) => isSubmitting ? (<><span className="loading-spinner"></span>{text}</>) : text;

  const showError = (message) => {
    setError(message);
    if (formRef.current) {
      formRef.current.style.animation = 'shake 0.5s ease-in-out';
      setTimeout(() => formRef.current.style.animation = '', 500);
    }
  };

  const showSuccessMessage = (message) => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      showError('Please enter both identifier and password');
      return;
    }

    setIsSubmitting(true);
    setError('');
    if (submitButtonRef.current) {
      submitButtonRef.current.style.animation = 'buttonPress 0.2s ease';
    }

    try {
      const result = await login(identifier.trim(), password);
      if (result.success) {
        showSuccessMessage('Login successful! Redirecting...');
        setAnimationPhase('success');
        setTimeout(() => {
          const from = location.state?.from?.pathname || '/dashboard';
          navigate(from, { replace: true });
        }, 800);
      } else {
        showError(result.error);
      }
    } catch (err) {
      showError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
      if (submitButtonRef.current) submitButtonRef.current.style.animation = '';
    }
  };

  const handleThemeToggle = () => {
    document.body.style.transition = 'all 0.3s ease';
    toggleDarkMode();
    setTimeout(() => {
      document.body.style.transition = '';
    }, 300);
  };

  return (
    <div className={`login-page ${darkMode ? 'dark-mode' : ''}`}>
      <div className={`login-container ${animationPhase}`}>
        <header className="login-header">
          <div className="logo" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Logo />
            <span style={{ fontWeight: 700, fontSize: 24, letterSpacing: 2, color: darkMode ? "#fff" : "#222", userSelect: "none" }}>
              AT-AT
            </span>
          </div>
          <div className="user-info">
            <button onClick={handleThemeToggle} className="theme-toggle-btn" aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}>
              {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>
        </header>

        <main className="login-main">
          <section className="login-form-section" ref={formRef}>
            <h1>Welcome Back</h1>
            <p className="login-subtitle">Sign in to your AT-AT account</p>

            <div className="or-separator"><span>Login</span></div>

            {showSuccess && <div className="success-message">✅ Login successful! Redirecting to dashboard...</div>}
            {error && <div className="error-message" ref={errorRef}>⚠️ {error}</div>}

            <form onSubmit={handleLogin} noValidate>
              <div className={`form-group ${error && !identifier.trim() ? 'error' : ''}`}>
                <label htmlFor="identifier">Username or Email:</label>
                <input
                  type="text"
                  id="identifier"
                  value={identifier}
                  onChange={(e) => handleInputChange('identifier', e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Enter your username or email"
                  required
                  autoComplete="username"
                />
              </div>
              <div className={`form-group ${error && !password ? 'error' : ''}`}>
                <label htmlFor="password">Password:</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                className="login-btn"
                disabled={isSubmitting || isLoading}
                ref={submitButtonRef}
                aria-label={isSubmitting ? 'Signing in...' : 'Sign in'}
              >
                {getButtonContent(isSubmitting ? 'Signing In...' : 'Sign In')}
              </button>
            </form>

            <div className="login-links">
              <Link to="/signup" className="create-account-link" aria-label="Create new account">Create Account</Link>
              <Link to="/forgot-password" className="forgot-password-link" aria-label="Reset forgotten password">Forgot Password?</Link>
            </div>
          </section>
        </main>

        <footer className="login-footer">
          <p>© 2025 AT-AT (API Threat Assessment Tool) • COS301 Capstone Project. All rights reserved.</p>
          <div className="footer-links">
            <a href="#" aria-label="Privacy Policy">Privacy Policy</a>
            <a href="#" aria-label="Terms of Service">Terms of Service</a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Login;
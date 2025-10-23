// Login.js

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
  const { login, loginWithGoogle, isLoading, isAuthenticated } = useAuth();
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [animationPhase, setAnimationPhase] = useState('entering');

  const formRef = useRef(null);
  const errorRef = useRef(null);
  const submitButtonRef = useRef(null);
  const demoButtonRef = useRef(null); // Ref for the new Demo button

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFormVisible(true);
      setAnimationPhase('visible');
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Fixed: Better OAuth callback error handling
  useEffect(() => {
    // Check for OAuth errors in URL
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
    
    const oauthError = urlParams.get('error') || hashParams.get('error');
    const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
    
    if (oauthError) {
      console.log('OAuth error detected:', oauthError, errorDescription);
      
      // Map OAuth errors to user-friendly messages
      let errorMessage = 'Google sign-in failed. Please try again.';
      if (oauthError === 'access_denied') {
        errorMessage = 'You cancelled the Google sign-in process.';
      } else if (oauthError === 'invalid_request') {
        errorMessage = 'Invalid Google sign-in request. Please try again.';
      } else if (errorDescription) {
        errorMessage = errorDescription;
      }
      
      showError(errorMessage);
      // Clean the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
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
  
  // Fixed: Better Google button content with loading state awareness
  const getGoogleButtonContent = () => {
    if (isGoogleLoading) {
      return (
        <>
          <span className="loading-spinner"></span>
          Redirecting to Google...
        </>
      );
    }
    
    if (isLoading) {
      return (
        <>
          <span className="loading-spinner"></span>
          Processing...
        </>
      );
    }
    
    return (
      <>
        <img 
          src="https://developers.google.com/identity/images/g-logo.png" 
          alt="Google"
          width="18"
          height="18"
        />
        Continue with Google
      </>
    );
  };

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

  // Fixed: Improved Google login handling
  const handleGoogleLogin = async () => {
    if (isGoogleLoading || isSubmitting || isLoading) return;
    
    setIsGoogleLoading(true);
    setError('');

    try {
      console.log('Initiating Google login...');
      const result = await loginWithGoogle();
      
      if (result.success) {
        console.log('Google login initiated successfully');
        // Don't show success message as user will be redirected to Google
        // The success will be handled when they return
      } else {
        console.error('Google login failed:', result.error);
        showError(result.error || 'Google login failed. Please try again.');
      }
    } catch (err) {
      console.error('Google login error:', err);
      showError('Google login failed. Please try again or use regular login.');
    } finally {
      // Keep loading state for a bit longer as OAuth redirect might be happening
      setTimeout(() => {
        setIsGoogleLoading(false);
      }, 2000);
    }
  };

  const handleLoginLogic = async (username, password, buttonRef) => {
    setIsSubmitting(true);
    setError('');
    
    if (buttonRef && buttonRef.current) {
      buttonRef.current.style.animation = 'buttonPress 0.2s ease';
    }

    try {
      const result = await login(username, password);
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
      if (buttonRef && buttonRef.current) buttonRef.current.style.animation = '';
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      showError('Please enter both identifier and password');
      return;
    }

    await handleLoginLogic(identifier.trim(), password, submitButtonRef);
  };
  
  // NEW: Demo Login Handler
  const handleDemoLogin = async () => {
    if (isAnyLoading) return;

    // Use specific demo credentials
    const demoUsername = "ProjectDayDemo";
    const demoPassword = "P@ssword!";
    
    // Auto-fill form fields (optional, but good UX)
    setIdentifier(demoUsername);
    setPassword(demoPassword);

    await handleLoginLogic(demoUsername, demoPassword, demoButtonRef);
  };

  const handleThemeToggle = () => {
    document.body.style.transition = 'all 0.3s ease';
    toggleDarkMode();
    setTimeout(() => {
      document.body.style.transition = '';
    }, 300);
  };

  // Fixed: Better loading state awareness
  const isAnyLoading = isLoading || isSubmitting || isGoogleLoading;

  return (
    <div className={`login-page ${darkMode ? 'dark-mode' : ''}`}>
      <div className={`login-container ${animationPhase}`}>
        <header className="login-header">
          <div className="logo" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Logo />
            <span style={{ fontWeight: 700, fontSize: 24, letterSpacing: 2, color: darkMode ? "#fff" : "#222", userSelect: "none" }}>
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

            {/* Fixed: Show processing state for OAuth */}
            {isLoading && !isSubmitting && !isGoogleLoading && (
              <div className="processing-message">
                <span className="loading-spinner"></span>
                Processing your login...
              </div>
            )}

            {showSuccess && <div className="success-message">✅ Login successful! Redirecting to dashboard...</div>}
            {error && <div className="error-message" ref={errorRef}>⚠️ {error}</div>}

            {/* Google Login Button */}
            <button
              type="button"
              className="google-login-btn"
              onClick={handleGoogleLogin}
              disabled={isAnyLoading}
              aria-label="Sign in with Google"
            >
              {getGoogleButtonContent()}
            </button>

            <div className="or-separator"><span>Or</span></div>

            <form onSubmit={handleLogin} noValidate>
              <div className={`form-group ${error && !identifier.trim() ? 'error' : ''}`}>
                <label htmlFor="identifier">Username or Email:</label>
                <input
                  type="text"
                  id="identifier"
                  value={identifier}
                  onChange={(e) => handleInputChange('identifier', e.target.value)}
                  disabled={isAnyLoading}
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
                  disabled={isAnyLoading}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                className="login-btn"
                disabled={isAnyLoading}
                ref={submitButtonRef}
                aria-label={isSubmitting ? 'Signing in...' : 'Sign in'}
              >
                {getButtonContent(isSubmitting ? 'Signing In...' : 'Sign In')}
              </button>
            </form>
            
            {/* NEW: Demo Login Button */}
            <button
              type="button"
              className="demo-login-btn"
              onClick={handleDemoLogin}
              disabled={isAnyLoading}
              ref={demoButtonRef}
              aria-label="Sign in with demo account"
            >
              {getButtonContent(isSubmitting ? 'Logging In...' : 'Demo Login')}
            </button>

            <div className="login-links">
              <Link to="/signup" className="create-account-link" aria-label="Create new account">Create Account</Link>
              <Link to="/forgot-password" className="forgot-password-link" aria-label="Reset forgotten password">Forgot Password?</Link>
            </div>
          </section>
        </main>

        <footer className="login-footer">
          <p>© 2025 AT-AT (API Threat Assessment Tool) • COS301 Capstone Project. All rights reserved.</p>
          <div className="footer-links">
            <Link to="/privacy" className="footer-link-btn">Privacy Policy</Link>
            <Link to="/terms" className="footer-link-btn">Terms of Service</Link>
            <Link to="/contact" className="footer-link-btn">Contact Us</Link>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Login;
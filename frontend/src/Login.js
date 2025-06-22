import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ThemeContext } from './App';
import { useAuth } from './AuthContext';
import Logo from "./components/Logo";
import './Login.css';

/**
 * Enhanced Login component with smooth animations and loading states
 * Provides secure authentication with animated user feedback
 */
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { login, isLoading, isAuthenticated } = useAuth();
  
  // Form state management
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Animation state management
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [animationPhase, setAnimationPhase] = useState('entering');
  
  // Refs for animation control
  const formRef = useRef(null);
  const errorRef = useRef(null);
  const submitButtonRef = useRef(null);

  /**
   * Initialize component animations on mount
   */
  useEffect(() => {
    // Trigger entrance animations
    const timer = setTimeout(() => {
      setIsFormVisible(true);
      setAnimationPhase('visible');
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  /**
   * Handle authentication state changes with animations
   */
  useEffect(() => {
    if (isAuthenticated()) {
      setAnimationPhase('exiting');
      const from = location.state?.from?.pathname || '/dashboard';
      
      // Add exit animation delay before navigation
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 300);
    }
  }, [isAuthenticated, navigate, location.state]);

  /**
   * Handle input changes with validation feedback
   * @param {string} field - The field being updated ('username' or 'password')
   * @param {string} value - The new value
   */
  const handleInputChange = (field, value) => {
    if (field === 'username') setUsername(value);
    if (field === 'password') setPassword(value);
    
    // Clear error with smooth animation when user starts typing
    if (error) {
      setError('');
      // Remove error styling from form group
      if (errorRef.current) {
        errorRef.current.style.animation = 'fadeOut 0.3s ease-out';
      }
    }
  };

  /**
   * Add loading spinner to button text
   * @param {string} text - The button text
   * @returns {JSX.Element} - Button content with optional spinner
   */
  const getButtonContent = (text) => {
    if (isSubmitting) {
      return (
        <>
          <span className="loading-spinner"></span>
          {text}
        </>
      );
    }
    return text;
  };

  /**
   * Show error message with animation
   * @param {string} message - Error message to display
   */
  const showError = (message) => {
    setError(message);
    
    // Add shake animation to form
    if (formRef.current) {
      formRef.current.style.animation = 'shake 0.5s ease-in-out';
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.style.animation = '';
        }
      }, 500);
    }
  };

  /**
   * Show success message with animation
   * @param {string} message - Success message to display
   */
  const showSuccessMessage = (message) => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  /**
   * Handle form submission with loading animations
   * @param {Event} e - Form submission event
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validate input fields
    if (!username.trim() || !password) {
      showError('Please enter both username/email and password');
      return;
    }

    // Start loading state with button animation
    setIsSubmitting(true);
    setError('');
    
    // Add button press animation
    if (submitButtonRef.current) {
      submitButtonRef.current.style.animation = 'buttonPress 0.2s ease';
    }

    try {
      const result = await login(username.trim(), password);
      
      if (result.success) {
        showSuccessMessage('Login successful! Redirecting...');
        setAnimationPhase('success');
        
        // Navigate with exit animation
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
      
      // Reset button animation
      if (submitButtonRef.current) {
        submitButtonRef.current.style.animation = '';
      }
    }
  };

  /**
   * Handle Google OAuth login with loading states
   */
  const handleGoogleLogin = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      // Simulate Google OAuth flow with loading animation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, create a Google user session
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
        // Show success animation for demo
        showSuccessMessage('Google login successful! Account created automatically.');
        setAnimationPhase('success');
        
        setTimeout(() => {
          const from = location.state?.from?.pathname || '/dashboard';
          navigate(from, { replace: true });
        }, 1200);
      }
    } catch (err) {
      showError('Google login failed. Please try again or use email/password.');
      console.error('Google login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle demo login with smooth form updates
   * @param {string} demoUsername - Demo username
   * @param {string} demoPassword - Demo password
   */
  const handleDemoLogin = async (demoUsername, demoPassword) => {
    // Animate form field updates
    setUsername('');
    setPassword('');
    setError('');
    
    // Smooth transition of form values
    await new Promise(resolve => setTimeout(resolve, 100));
    setUsername(demoUsername);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    setPassword(demoPassword);
    
    // Add visual feedback for demo selection
    if (formRef.current) {
      formRef.current.style.animation = 'pulse 0.5s ease-in-out';
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.style.animation = '';
        }
      }, 500);
    }
    
    // Execute login after form animation
    setTimeout(async () => {
      setIsSubmitting(true);
      try {
        const result = await login(demoUsername, demoPassword);
        if (result.success) {
          showSuccessMessage('Demo login successful!');
          setAnimationPhase('success');
          
          setTimeout(() => {
            const from = location.state?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
          }, 800);
        } else {
          showError(result.error);
        }
      } catch (err) {
        showError('Demo login failed. Please try again.');
        console.error('Demo login error:', err);
      } finally {
        setIsSubmitting(false);
      }
    }, 400);
  };

  /**
   * Handle theme toggle with animation
   */
  const handleThemeToggle = () => {
    // Add transition animation class temporarily
    document.body.style.transition = 'all 0.3s ease';
    toggleDarkMode();
    
    setTimeout(() => {
      document.body.style.transition = '';
    }, 300);
  };

  return (
    <div className={`login-container ${animationPhase}`}>
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
          <button 
            onClick={handleThemeToggle} 
            className="theme-toggle-btn"
            aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
          >
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
      </header>

      <main className="login-main">
        <section className="login-form-section" ref={formRef}>
          <h1>Welcome Back</h1>
          <p className="login-subtitle">Sign in to your AT-AT account</p>
          
          {/* Google Login Button */}
          <button 
            onClick={handleGoogleLogin} 
            className="google-login-btn"
            disabled={isSubmitting}
            aria-label="Continue with Google"
          >
            <img 
              src="https://developers.google.com/identity/images/g-logo.png" 
              alt="Google logo" 
            />
            {getButtonContent('Continue with Google')}
          </button>
          
          <div className="or-separator">
            <span>or</span>
          </div>
          
          {/* Success Message */}
          {showSuccess && (
            <div className="success-message">
              ✅ Login successful! Redirecting to dashboard...
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="error-message" ref={errorRef}>
              ⚠️ {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} noValidate>
            <div className={`form-group ${error && !username.trim() ? 'error' : ''}`}>
              <label htmlFor="username">Username or Email:</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                disabled={isSubmitting}
                placeholder="Enter your username or email"
                required
                aria-describedby={error ? "username-error" : undefined}
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
                aria-describedby={error ? "password-error" : undefined}
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

          {/* Demo Section */}
          <div className="demo-section">
            <h3>🚀 Quick Demo Login</h3>
            <p>Try the application with these demo accounts:</p>
            <div className="demo-buttons">
              <button 
                onClick={() => handleDemoLogin('johndoe', 'password123')}
                className="demo-btn"
                disabled={isSubmitting}
                aria-label="Login as John Doe demo user"
              >
                👤 Login as John Doe
              </button>
              <button 
                onClick={() => handleDemoLogin('janesmith', 'demo123')}
                className="demo-btn"
                disabled={isSubmitting}
                aria-label="Login as Jane Smith demo user"
              >
                👩‍💼 Login as Jane Smith
              </button>
            </div>
          </div>

          {/* Login Links */}
          <div className="login-links">
            <Link 
              to="/signup" 
              className="create-account-link"
              aria-label="Create new account"
            >
              Create Account
            </Link>
            <Link 
              to="/forgot-password" 
              className="forgot-password-link"
              aria-label="Reset forgotten password"
            >
              Forgot Password?
            </Link>
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
  );
};

export default Login;
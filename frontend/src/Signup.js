import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ThemeContext } from './App';
import { useAuth } from './AuthContext';
import Logo from "./components/Logo";
import './Signup.css';

const Signup = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { signup, loginWithGoogle, isLoading, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
      let errorMessage = 'Google sign-up failed. Please try again.';
      if (oauthError === 'access_denied') {
        errorMessage = 'You cancelled the Google sign-up process.';
      } else if (oauthError === 'invalid_request') {
        errorMessage = 'Invalid Google sign-up request. Please try again.';
      } else if (errorDescription) {
        errorMessage = errorDescription;
      }
      
      showError(errorMessage);
      // Clean the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleInputChange = ({ target: { name, value } }) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const validateForm = () => {
    const { firstName, lastName, email, username, password, confirmPassword } = formData;
    if (!firstName.trim()) return setError('First name is required'), false;
    if (!lastName.trim()) return setError('Last name is required'), false;
    if (!email.trim()) return setError('Email is required'), false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Invalid email'), false;
    if (!username.trim()) return setError('Username is required'), false;
    if (username.length < 3) return setError('Username too short'), false;
    if (!password) return setError('Password required'), false;
    if (password.length < 8) return setError('Password too short'), false;
    if (password !== confirmPassword) return setError('Passwords must match'), false;
    if (!agreeToTerms) return setError('Please agree to terms'), false;
    return true;
  };

  const showSuccessMessage = (message) => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const showError = (message) => {
    setError(message);
    // Add shake animation to form
    const formSection = document.querySelector('.signup-form-section');
    if (formSection) {
      formSection.style.animation = 'shake 0.5s ease-in-out';
      setTimeout(() => formSection.style.animation = '', 500);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError('');
    
    try {
      const result = await signup({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        username: formData.username.trim().toLowerCase(),
        password: formData.password
      });

      if (result.success) {
        showSuccessMessage('Account created successfully! Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        showError(result.error || 'Signup failed');
      }
    } catch (err) {
      console.error('Signup error:', err);
      showError('Unexpected error. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fixed: Improved Google signup handling (consistent with Login)
  const handleGoogleSignup = async () => {
    if (isGoogleLoading || isSubmitting || isLoading) return;
    
    setIsGoogleLoading(true);
    setError('');

    try {
      console.log('Initiating Google signup...');
      const result = await loginWithGoogle();
      
      if (result.success) {
        console.log('Google signup initiated successfully');
        // Don't show success message as user will be redirected to Google
        // The success will be handled when they return
      } else {
        console.error('Google signup failed:', result.error);
        showError(result.error || 'Google signup failed. Please try again.');
      }
    } catch (err) {
      console.error('Google signup error:', err);
      showError('Google signup failed. Please try again or use regular signup.');
    } finally {
      // Keep loading state for a bit longer as OAuth redirect might be happening
      setTimeout(() => {
        setIsGoogleLoading(false);
      }, 2000);
    }
  };

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
        Sign up with Google
      </>
    );
  };

  const isAnyLoading = isLoading || isSubmitting || isGoogleLoading;

  return (
    <div className={`signup-page ${darkMode ? 'dark-mode' : ''}`}>
      <div className="signup-container">
        <header className="signup-header">
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
          <button 
            onClick={toggleDarkMode} 
            className="theme-toggle-btn" 
            aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
          >
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </header>

        <main className="signup-main">
          <section className="signup-form-section">
            <h1>Create Your Account</h1>
            <p className="signup-subtitle">Join AT-AT to start securing your APIs</p>

            {/* Fixed: Show processing state for OAuth */}
            {isLoading && !isSubmitting && !isGoogleLoading && (
              <div className="processing-message">
                <span className="loading-spinner"></span>
                Processing your signup...
              </div>
            )}

            {showSuccess && (
              <div className="success-message">
                ✅ Account created successfully! Redirecting to dashboard...
              </div>
            )}

            {error && (
              <div className="error-message" role="alert">
                ⚠️ {error}
              </div>
            )}

            {/* Google Signup Button */}
            <button 
              onClick={handleGoogleSignup} 
              className="google-signup-btn" 
              disabled={isAnyLoading}
              aria-label="Sign up with Google"
            >
              {getGoogleButtonContent()}
            </button>

            <div className="or-separator"><span>or</span></div>

            <form onSubmit={handleSignup} className="signup-form" noValidate>
              <div className="name-row">
                <div className="form-group half-width">
                  <label htmlFor="firstName">First Name *</label>
                  <input 
                    type="text" 
                    id="firstName" 
                    name="firstName" 
                    value={formData.firstName} 
                    onChange={handleInputChange} 
                    required 
                    disabled={isAnyLoading}
                    placeholder="Enter your first name"
                    autoComplete="given-name"
                  />
                </div>
                <div className="form-group half-width">
                  <label htmlFor="lastName">Last Name *</label>
                  <input 
                    type="text" 
                    id="lastName" 
                    name="lastName" 
                    value={formData.lastName} 
                    onChange={handleInputChange} 
                    required 
                    disabled={isAnyLoading}
                    placeholder="Enter your last name"
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleInputChange} 
                  required 
                  disabled={isAnyLoading}
                  placeholder="Enter your email address"
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="username">Username *</label>
                <input 
                  type="text" 
                  id="username" 
                  name="username" 
                  value={formData.username} 
                  onChange={handleInputChange} 
                  required 
                  disabled={isAnyLoading}
                  placeholder="Choose a username"
                  autoComplete="username"
                />
                <small className="input-hint">At least 3 characters</small>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input 
                  type="password" 
                  id="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleInputChange} 
                  required 
                  disabled={isAnyLoading}
                  placeholder="Create a password"
                  autoComplete="new-password"
                />
                <small className="password-hint">At least 8 characters</small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input 
                  type="password" 
                  id="confirmPassword" 
                  name="confirmPassword" 
                  value={formData.confirmPassword} 
                  onChange={handleInputChange} 
                  required 
                  disabled={isAnyLoading}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={agreeToTerms} 
                    onChange={(e) => setAgreeToTerms(e.target.checked)} 
                    required 
                    disabled={isAnyLoading}
                  />
                  <span className="checkbox-text">
                    I agree to the{' '}
                    <button 
                      type="button" 
                      className="terms-link" 
                      onClick={() => console.log('Terms of Service')}
                    >
                      Terms of Service
                    </button>
                    {' '}and{' '}
                    <button 
                      type="button" 
                      className="terms-link" 
                      onClick={() => console.log('Privacy Policy')}
                    >
                      Privacy Policy
                    </button>
                  </span>
                </label>
              </div>

              <button 
                type="submit" 
                className="signup-btn" 
                disabled={isAnyLoading}
                aria-label={isSubmitting ? 'Creating account...' : 'Create account'}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading-spinner"></span>
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="login-redirect">
              <p>
                Already have an account?{' '}
                <Link to="/login" className="login-link">
                  Sign in here
                </Link>
              </p>
            </div>
          </section>
        </main>

        <footer className="signup-footer">
          <p>© 2025 AT-AT (API Threat Assessment Tool) • COS301 Capstone Project. All rights reserved.</p>
          <div className="footer-links">
            <button 
              type="button" 
              onClick={() => console.log('Privacy Policy')} 
              className="footer-link-btn"
            >
              Privacy Policy
            </button>
            <button 
              type="button" 
              onClick={() => console.log('Terms of Service')} 
              className="footer-link-btn"
            >
              Terms of Service
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Signup;
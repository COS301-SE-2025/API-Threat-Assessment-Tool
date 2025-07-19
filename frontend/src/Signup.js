import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ThemeContext } from './App';
import { useAuth } from './AuthContext';
import Logo from "./components/Logo";
import './Signup.css';

const Signup = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { signup, isLoading } = useAuth();

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

    alert('Account created successfully! Redirecting to dashboard...');
    navigate('/dashboard');

      } else {
        setError(result.error || 'Signup failed');
      }
    } catch {
      setError('Unexpected error. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = () => {
    alert('Google signup will be implemented in future!');
  };

  return (
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
        <button onClick={toggleDarkMode} className="theme-toggle-btn" aria-label="Toggle theme">
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </header>

      <main className="signup-main">
        <section className="signup-form-section">
          <h1>Create Your Account</h1>
          <p className="signup-subtitle">Join AT-AT to start securing your APIs</p>

          <button onClick={handleGoogleSignup} className="google-signup-btn" disabled={isSubmitting}>
            <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" />
            Sign up with Google
          </button>

          <div className="or-separator"><span>or</span></div>

          {error && <div className="error-message" role="alert">{error}</div>}

          <form onSubmit={handleSignup} className="signup-form" noValidate>
            <div className="name-row">
              <div className="form-group half-width">
                <label htmlFor="firstName">First Name *</label>
                <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required disabled={isSubmitting} />
              </div>
              <div className="form-group half-width">
                <label htmlFor="lastName">Last Name *</label>
                <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} required disabled={isSubmitting} />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required disabled={isSubmitting} />
            </div>

            <div className="form-group">
              <label htmlFor="username">Username *</label>
              <input type="text" id="username" name="username" value={formData.username} onChange={handleInputChange} required disabled={isSubmitting} />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input type="password" id="password" name="password" value={formData.password} onChange={handleInputChange} required disabled={isSubmitting} />
              <small className="password-hint">At least 8 characters</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required disabled={isSubmitting} />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input type="checkbox" checked={agreeToTerms} onChange={(e) => setAgreeToTerms(e.target.checked)} required disabled={isSubmitting} />
                I agree to the <a href="#" className="terms-link">Terms of Service</a> and <a href="#" className="terms-link">Privacy Policy</a>
              </label>
            </div>

            <button type="submit" className="signup-btn" disabled={isSubmitting || isLoading}>
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="login-redirect">
            <p>Already have an account? <Link to="/login" className="login-link">Sign in here</Link></p>
          </div>
        </section>
      </main>

      <footer className="signup-footer">
        <p>© 2025 AT-AT (API Threat Assessment Tool) • COS301 Capstone Project. All rights reserved.</p>
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
};

export default Signup;

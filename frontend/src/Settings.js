import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from './App';
import { useAuth } from './AuthContext';
import axios from 'axios';
import Cookies from 'js-cookie';
import Logo from './components/Logo';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { currentUser, logout, getUserFullName, updateProfile } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  const [isVisible, setIsVisible] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [error, setError] = useState(null);

  const formRef = useRef(null);

  // Form data state with proper error tracking
  const [formData, setFormData] = useState({
    // Profile data (stored in database)
    firstName: '',
    lastName: '', 
    username: '',
    email: '',
    
    // Extended data (stored in user_profile_extended table)
    phone: '',
    company: '',
    position: '',
    timezone: 'UTC+02:00',
    avatar: '',
    bio: '',
    website: '',
    location: '',
    
    // Preferences data (stored in user_preferences table)
    notifications: {
      scanCompleted: true,
      criticalFindings: true,
      weeklyReport: false,
      productUpdates: true,
      emailDigest: true,
      smsAlerts: false,
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: '30',
      loginNotifications: true,
    },
    preferences: {
      theme: 'auto',
      defaultScanProfile: 'owasp',
      autoSaveReports: true,
      emailFrequency: 'weekly',
    },
  });

  // Password change form with validation
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Form validation states
  const [fieldErrors, setFieldErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(true);

  // Animation effects
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({
              ...prev,
              [entry.target.id]: true,
            }));
          }
        });
      },
      observerOptions
    );

    const sections = document.querySelectorAll('.animate-on-scroll');
    if (sections.length > 0) {
      sections.forEach((section) => observer.observe(section));
    }

    return () => observer.disconnect();
  }, []);

  // Load user data on component mount with comprehensive error handling
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) return;

      setIsLoading(true);
      setError(null);

      try {
        // Load basic profile data from current user
        setFormData(prev => ({
          ...prev,
          firstName: currentUser.firstName || '',
          lastName: currentUser.lastName || '',
          username: currentUser.username || '',
          email: currentUser.email || '',
        }));

        const token = localStorage.getItem('at_at_token');
        if (!token) {
          throw new Error('Authentication token not found. Please log in again.');
        }

        const headers = { Authorization: `Bearer ${token}` };

        // Load preferences from database
        try {
          const preferencesResponse = await axios.get(
            'http://localhost:3001/api/user/preferences',
            { headers, timeout: 10000 }
          );

          if (preferencesResponse.data.success && preferencesResponse.data.data.preferences) {
            const prefs = preferencesResponse.data.data.preferences;
            setFormData(prev => ({
              ...prev,
              notifications: { ...prev.notifications, ...prefs.notifications },
              security: { ...prev.security, ...prefs.security },
              preferences: { ...prev.preferences, ...prefs.preferences }
            }));
          }
        } catch (prefError) {
          console.warn('Could not load preferences:', prefError.message);
          if (prefError.response?.status === 401) {
            throw new Error('Session expired. Please log in again.');
          }
          // Continue with defaults if preferences can't be loaded
        }

        // Load extended profile data from database
        try {
          const extendedResponse = await axios.get(
            'http://localhost:3001/api/user/extended-profile',
            { headers, timeout: 10000 }
          );

          if (extendedResponse.data.success && extendedResponse.data.data.profile) {
            const extProfile = extendedResponse.data.data.profile;
            setFormData(prev => ({
              ...prev,
              phone: extProfile.phone || '',
              company: extProfile.company || '',
              position: extProfile.position || '',
              timezone: extProfile.timezone || 'UTC+02:00',
              avatar: extProfile.avatar_url || '',
              bio: extProfile.bio || '',
              website: extProfile.website_url || '',
              location: extProfile.location || ''
            }));
          }
        } catch (extError) {
          console.warn('Could not load extended profile:', extError.message);
          // Continue with defaults if extended profile can't be loaded
        }

      } catch (error) {
        console.error('Error loading user data:', error);
        if (error.message.includes('Session expired') || error.message.includes('Authentication token')) {
          setError(error.message);
          setTimeout(() => {
            logout();
            navigate('/login');
          }, 3000);
        } else {
          setError('Failed to load user data. Some settings may not be available.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [currentUser, logout, navigate]);

  // Validation functions
  const validateField = (name, value) => {
    const errors = {};

    switch (name) {
      case 'firstName':
        if (!value.trim()) {
          errors.firstName = 'First name is required';
        } else if (value.trim().length < 2) {
          errors.firstName = 'First name must be at least 2 characters';
        } else if (value.trim().length > 50) {
          errors.firstName = 'First name must be less than 50 characters';
        }
        break;

      case 'lastName':
        if (!value.trim()) {
          errors.lastName = 'Last name is required';
        } else if (value.trim().length < 2) {
          errors.lastName = 'Last name must be at least 2 characters';
        } else if (value.trim().length > 50) {
          errors.lastName = 'Last name must be less than 50 characters';
        }
        break;

      case 'username':
        if (value.trim() && value.trim().length < 3) {
          errors.username = 'Username must be at least 3 characters';
        } else if (value.trim() && value.trim().length > 30) {
          errors.username = 'Username must be less than 30 characters';
        } else if (value.trim() && !/^[a-zA-Z0-9_-]+$/.test(value.trim())) {
          errors.username = 'Username can only contain letters, numbers, underscores, and dashes';
        }
        break;

      case 'phone':
        if (value.trim() && !/^[\+]?[0-9\s\-\(\)]+$/.test(value.trim())) {
          errors.phone = 'Please enter a valid phone number';
        }
        break;

      case 'website':
        if (value.trim() && !/^https?:\/\/.+/.test(value.trim())) {
          errors.website = 'Website URL must start with http:// or https://';
        }
        break;

      case 'bio':
        if (value.length > 500) {
          errors.bio = 'Bio must be less than 500 characters';
        }
        break;

      default:
        break;
    }

    return errors;
  };

  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'New password must be at least 8 characters';
    } else if (!/(?=.*[a-z])/.test(passwordForm.newPassword)) {
      errors.newPassword = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(passwordForm.newPassword)) {
      errors.newPassword = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(passwordForm.newPassword)) {
      errors.newPassword = 'Password must contain at least one number';
    }

    if (passwordForm.newPassword && passwordForm.confirmPassword && 
        passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Password confirmation does not match';
    }

    if (passwordForm.currentPassword && passwordForm.newPassword && 
        passwordForm.currentPassword === passwordForm.newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }

    return errors;
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login', { replace: true });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Update form data
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear previous errors for this field
    setFieldErrors(prev => ({
      ...prev,
      [name]: undefined
    }));

    // Validate field in real-time
    const fieldError = validateField(name, value);
    if (Object.keys(fieldError).length > 0) {
      setFieldErrors(prev => ({
        ...prev,
        ...fieldError
      }));
    }

    clearMessages();
  };

  const handleNestedChange = (section, key, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
    clearMessages();
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear previous errors for this field
    setFieldErrors(prev => ({
      ...prev,
      [field]: undefined
    }));

    clearMessages();
  };

  const clearMessages = () => {
    if (error) setError(null);
    if (saveMessage) setSaveMessage('');
  };

  const showError = (message) => {
    setError(message);
    if (formRef.current) {
      formRef.current.style.animation = 'shake 0.5s ease-in-out';
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.style.animation = '';
        }
      }, 500);
    }
  };

  const showSuccess = (message) => {
    setSaveMessage(message);
    setTimeout(() => setSaveMessage(''), 5000);
  };

  const makeApiCall = async (url, method, data, timeoutMs = 15000) => {
    const token = localStorage.getItem('at_at_token');
    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }

    const config = {
      method,
      url,
      headers: { Authorization: `Bearer ${token}` },
      timeout: timeoutMs,
    };

    if (method.toLowerCase() !== 'get' && data) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return response;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please check your connection and try again.');
      } else if (error.response?.status === 401) {
        throw new Error('Session expired. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to perform this action.');
      } else if (error.response?.status === 409) {
        throw new Error('Username already exists. Please choose a different username.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (!error.response) {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setFieldErrors({});

    try {
      if (activeTab === 'profile') {
        // Validate profile fields
        const profileValidation = {
          ...validateField('firstName', formData.firstName),
          ...validateField('lastName', formData.lastName),
          ...validateField('username', formData.username)
        };

        if (Object.keys(profileValidation).length > 0) {
          setFieldErrors(profileValidation);
          throw new Error('Please fix the validation errors above.');
        }

        // Update basic profile in users table
        const profileUpdateData = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          username: formData.username.trim()
        };

        const profileResponse = await makeApiCall(
          'http://localhost:3001/api/user/update',
          'PUT',
          profileUpdateData
        );

        if (profileResponse.data.success) {
          // Update the auth context with new user data
          await updateProfile(profileUpdateData);

          // Update extended profile data
          const extendedValidation = {
            ...validateField('phone', formData.phone),
            ...validateField('website', formData.website),
            ...validateField('bio', formData.bio)
          };

          if (Object.keys(extendedValidation).length > 0) {
            setFieldErrors(extendedValidation);
            showError('Profile updated but some extended fields have errors.');
            return;
          }

          const extendedUpdateData = {
            phone: formData.phone.trim(),
            company: formData.company.trim(),
            position: formData.position.trim(),
            timezone: formData.timezone,
            bio: formData.bio.trim(),
            website_url: formData.website.trim(),
            location: formData.location.trim()
          };

          try {
            await makeApiCall(
              'http://localhost:3001/api/user/extended-profile',
              'PUT',
              extendedUpdateData
            );
          } catch (extError) {
            console.warn('Extended profile update failed:', extError);
            showSuccess('✅ Basic profile updated successfully! (Some extended fields may not have saved)');
            return;
          }

          showSuccess('✅ Profile information saved successfully!');
        } else {
          throw new Error(profileResponse.data.message || 'Profile update failed');
        }

      } else if (activeTab === 'notifications' || activeTab === 'security' || activeTab === 'preferences') {
        // Update preferences in user_preferences table
        const preferencesData = {
          notifications: formData.notifications,
          security: formData.security,
          preferences: formData.preferences
        };

        const response = await makeApiCall(
          'http://localhost:3001/api/user/preferences',
          'PUT',
          { preferences: preferencesData }
        );

        if (response.data.success) {
          let message = '';
          switch (activeTab) {
            case 'notifications':
              message = '✅ Notification preferences saved successfully!';
              break;
            case 'security':
              message = '✅ Security settings saved successfully!';
              break;
            case 'preferences':
              message = '✅ Application preferences saved successfully!';
              break;
            default:
              message = '✅ Settings saved successfully!';
          }
          showSuccess(message);
        } else {
          throw new Error(response.data.message || 'Preferences update failed');
        }
      }

    } catch (err) {
      console.error('Save error:', err);
      
      if (err.message.includes('Session expired') || err.message.includes('Authentication token')) {
        showError(err.message);
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 3000);
      } else if (err.response?.data?.errors) {
        // Handle validation errors from server
        let errorMessage = 'Validation failed';
        if (Array.isArray(err.response.data.errors)) {
          errorMessage = err.response.data.errors.map(e => e.message || e).join(', ');
          // Map server errors to field errors if possible
          const serverFieldErrors = {};
          err.response.data.errors.forEach(error => {
            if (error.field) {
              serverFieldErrors[error.field] = error.message;
            }
          });
          setFieldErrors(serverFieldErrors);
        } else if (typeof err.response.data.errors === 'string') {
          errorMessage = err.response.data.errors;
        }
        showError(errorMessage);
      } else {
        showError(err.message || 'Failed to save settings. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password form
    const passwordErrors = validatePasswordForm();
    if (Object.keys(passwordErrors).length > 0) {
      setFieldErrors(passwordErrors);
      showError('Please fix the validation errors above.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setFieldErrors({});

    try {
      const response = await makeApiCall(
        'http://localhost:3001/api/user/password',
        'PUT',
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword
        }
      );

      if (response.data.success) {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showSuccess('✅ Password updated successfully!');
      } else {
        throw new Error(response.data.message || 'Password update failed');
      }

    } catch (err) {
      console.error('Password update error:', err);
      
      if (err.message.includes('Session expired')) {
        showError(err.message);
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 3000);
      } else if (err.response?.status === 400) {
        showError(err.response.data.message || 'Current password is incorrect');
      } else {
        showError(err.message || 'Failed to update password');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to reset all changes?')) {
      // Reset to current user data
      setFormData(prev => ({
        ...prev,
        firstName: currentUser?.firstName || '',
        lastName: currentUser?.lastName || '',
        username: currentUser?.username || '',
        email: currentUser?.email || '',
      }));
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setFieldErrors({});
      clearMessages();
      showSuccess('🔄 Settings reset to current values');
    }
  };

  const settingsTabs = [
    { id: 'profile', name: 'Profile', icon: '👤', description: 'Personal information and account details' },
    { id: 'notifications', name: 'Notifications', icon: '🔔', description: 'Manage your notification preferences' },
    { id: 'security', name: 'Security', icon: '🔒', description: 'Security settings and authentication' },
    { id: 'preferences', name: 'Preferences', icon: '⚙️', description: 'Application preferences and defaults' },
  ];

  if (!currentUser) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Settings...</p>
      </div>
    );
  }

  const userFullName = getUserFullName() || (currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName}` : 'User');

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <header className="settings-header">
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Logo />
          <span className="logo-text">AT-AT</span>
        </div>

        <nav className="settings-nav">
          <Link to="/home" className={location.pathname === '/home' ? 'active' : ''}>
            Home
          </Link>
          <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
            Dashboard
          </Link>
          <Link to="/manage-apis" className={location.pathname === '/manage-apis' ? 'active' : ''}>API Management</Link>
          <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>
            Settings
          </Link>
        </nav>
        <div className="user-info">
          <div className="user-profile">
            <span className="user-avatar">
              {currentUser.firstName?.charAt(0)?.toUpperCase() || 'U'}
            </span>
            <div className="user-details">
              <span className="user-greeting">Welcome back,</span>
              <span className="user-name">{userFullName}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn" title="Logout">
            Logout
          </button>
          <button onClick={toggleDarkMode} className="theme-toggle-btn" title="Toggle Theme">
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="settings-main">
        <section className="settings-hero">
          <div className="hero-content">
            <h1 className="hero-title">
              Account <span className="gradient-text">Settings</span>
            </h1>
            <p className="hero-description">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},
              {currentUser.firstName}! Manage your account preferences, security settings, and notification options.
            </p>
          </div>
        </section>

        <section
          id="settings-nav-section"
          className={`settings-nav-section animate-on-scroll ${isVisible['settings-nav-section'] ? 'visible' : ''}`}
        >
          <div className="settings-tabs">
            {settingsTabs.map((tab, index) => (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <span className="tab-icon">{tab.icon}</span>
                <div className="tab-content">
                  <span className="tab-name">{tab.name}</span>
                  <span className="tab-description">{tab.description}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section
          id="settings-content-section"
          className={`settings-content-section animate-on-scroll ${isVisible['settings-content-section'] ? 'visible' : ''}`}
        >
          <div className="settings-content">
            {activeTab === 'profile' && (
              <div className="settings-panel">
                <div className="panel-header">
                  <h2 className="panel-title">👤 Profile Information</h2>
                  <p className="panel-description">Update your personal information and account details</p>
                </div>

                <form onSubmit={handleSubmit} className="settings-form" ref={formRef}>
                  <div className="avatar-section">
                    <div className="avatar-container">
                      <div className="avatar-display">
                        {formData.avatar ? (
                          <img src={formData.avatar} alt="Profile" />
                        ) : (
                          <span className="avatar-initials">
                            {(formData.firstName?.charAt(0) || '') + (formData.lastName?.charAt(0) || '')}
                          </span>
                        )}
                      </div>
                      <div className="avatar-actions">
                        <button type="button" className="btn btn-outline">
                          Change Photo
                        </button>
                        <button type="button" className="btn btn-text">
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="firstName">First Name *</label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="Enter your first name"
                        required
                        disabled={isSaving}
                        className={fieldErrors.firstName ? 'error' : ''}
                      />
                      {fieldErrors.firstName && <span className="field-error">{fieldErrors.firstName}</span>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="lastName">Last Name *</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Enter your last name"
                        required
                        disabled={isSaving}
                        className={fieldErrors.lastName ? 'error' : ''}
                      />
                      {fieldErrors.lastName && <span className="field-error">{fieldErrors.lastName}</span>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="username">Username</label>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="Enter your username"
                        disabled={isSaving}
                        className={fieldErrors.username ? 'error' : ''}
                      />
                      {fieldErrors.username && <span className="field-error">{fieldErrors.username}</span>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="email">Email Address</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email"
                        disabled={true}
                        title="Email changes require verification - contact support"
                      />
                      <small className="form-note">Email changes require verification - contact support</small>
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone">Phone Number</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Enter your phone number"
                        disabled={isSaving}
                        className={fieldErrors.phone ? 'error' : ''}
                      />
                      {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="company">Company</label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        placeholder="Enter your company name"
                        disabled={isSaving}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="position">Position</label>
                      <input
                        type="text"
                        id="position"
                        name="position"
                        value={formData.position}
                        onChange={handleInputChange}
                        placeholder="Enter your job title"
                        disabled={isSaving}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="location">Location</label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="Enter your location"
                        disabled={isSaving}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="website">Website</label>
                      <input
                        type="url"
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        placeholder="https://example.com"
                        disabled={isSaving}
                        className={fieldErrors.website ? 'error' : ''}
                      />
                      {fieldErrors.website && <span className="field-error">{fieldErrors.website}</span>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="timezone">Timezone</label>
                      <select
                        id="timezone"
                        name="timezone"
                        value={formData.timezone}
                        onChange={handleInputChange}
                        disabled={isSaving}
                      >
                        <option value="UTC-12:00">🌎 UTC-12:00 - Baker Island</option>
                        <option value="UTC-08:00">🇺🇸 UTC-08:00 - Los Angeles</option>
                        <option value="UTC-05:00">🇺🇸 UTC-05:00 - New York</option>
                        <option value="UTC+00:00">🇬🇧 UTC+00:00 - London</option>
                        <option value="UTC+01:00">🇩🇪 UTC+01:00 - Berlin</option>
                        <option value="UTC+02:00">🇿🇦 UTC+02:00 - Johannesburg</option>
                        <option value="UTC+03:00">🇷🇺 UTC+03:00 - Moscow</option>
                        <option value="UTC+08:00">🇨🇳 UTC+08:00 - Beijing</option>
                        <option value="UTC+09:00">🇯🇵 UTC+09:00 - Tokyo</option>
                        <option value="UTC+11:00">🇦🇺 UTC+11:00 - Sydney</option>
                      </select>
                    </div>
                    <div className="form-group full-width">
                      <label htmlFor="bio">Bio</label>
                      <textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="Tell us about yourself..."
                        disabled={isSaving}
                        rows={4}
                        maxLength={500}
                        className={fieldErrors.bio ? 'error' : ''}
                      />
                      <small className="form-note">
                        {formData.bio.length}/500 characters
                        {fieldErrors.bio && <span className="field-error"> - {fieldErrors.bio}</span>}
                      </small>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={isSaving}>
                      Reset Changes
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                      {isSaving ? '⏳ Saving...' : '💾 Save Profile'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="settings-panel">
                <div className="panel-header">
                  <h2 className="panel-title">🔒 Security Settings</h2>
                  <p className="panel-description">Manage your account security and authentication preferences</p>
                </div>

                <div className="security-sections">
                  {/* Password Change Section */}
                  <div className="security-section">
                    <h3 className="section-title">🔑 Change Password</h3>
                    <form onSubmit={handlePasswordSubmit} className="password-form">
                      <div className="form-group">
                        <label htmlFor="currentPassword">Current Password</label>
                        <input
                          type="password"
                          id="currentPassword"
                          value={passwordForm.currentPassword}
                          onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                          placeholder="Enter your current password"
                          required
                          disabled={isSaving}
                          className={fieldErrors.currentPassword ? 'error' : ''}
                        />
                        {fieldErrors.currentPassword && <span className="field-error">{fieldErrors.currentPassword}</span>}
                      </div>
                      <div className="form-group">
                        <label htmlFor="newPassword">New Password</label>
                        <input
                          type="password"
                          id="newPassword"
                          value={passwordForm.newPassword}
                          onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                          placeholder="Enter your new password"
                          required
                          disabled={isSaving}
                          minLength={8}
                          className={fieldErrors.newPassword ? 'error' : ''}
                        />
                        <small className="form-note">
                          Password must be at least 8 characters with uppercase, lowercase, and number
                        </small>
                        {fieldErrors.newPassword && <span className="field-error">{fieldErrors.newPassword}</span>}
                      </div>
                      <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <input
                          type="password"
                          id="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                          placeholder="Confirm your new password"
                          required
                          disabled={isSaving}
                          className={fieldErrors.confirmPassword ? 'error' : ''}
                        />
                        {fieldErrors.confirmPassword && <span className="field-error">{fieldErrors.confirmPassword}</span>}
                      </div>
                      <button type="submit" className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? '⏳ Updating...' : '🔒 Update Password'}
                      </button>
                    </form>
                  </div>

                  {/* Security Preferences Section */}
                  <form onSubmit={handleSubmit} className="settings-form">
                    <div className="security-section">
                      <h3 className="section-title">🛡️ Authentication</h3>
                      <div className="security-item">
                        <div className="security-info">
                          <h4>Two-Factor Authentication</h4>
                          <p>Add an extra layer of security to your account</p>
                        </div>
                        <div className="security-action">
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={formData.security.twoFactorAuth}
                              onChange={(e) =>
                                handleNestedChange('security', 'twoFactorAuth', e.target.checked)
                              }
                              disabled={isSaving}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                          <button type="button" className="btn btn-outline" disabled>
                            Configure
                          </button>
                        </div>
                      </div>
                      <div className="security-item">
                        <div className="security-info">
                          <h4>Login Notifications</h4>
                          <p>Get notified when someone logs into your account</p>
                        </div>
                        <div className="security-action">
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={formData.security.loginNotifications}
                              onChange={(e) =>
                                handleNestedChange('security', 'loginNotifications', e.target.checked)
                              }
                              disabled={isSaving}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="security-section">
                      <h3 className="section-title">⏱️ Session Management</h3>
                      <div className="form-group">
                        <label htmlFor="sessionTimeout">Session Timeout (minutes)</label>
                        <select
                          id="sessionTimeout"
                          name="sessionTimeout"
                          value={formData.security.sessionTimeout}
                          onChange={(e) =>
                            handleNestedChange('security', 'sessionTimeout', e.target.value)
                          }
                          disabled={isSaving}
                        >
                          <option value="15">15 minutes</option>
                          <option value="30">30 minutes</option>
                          <option value="60">1 hour</option>
                          <option value="120">2 hours</option>
                          <option value="480">8 hours</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-actions">
                      <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={isSaving}>
                        Reset Changes
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? '⏳ Saving...' : '💾 Save Security Settings'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="settings-panel">
                <div className="panel-header">
                  <h2 className="panel-title">🔔 Notification Preferences</h2>
                  <p className="panel-description">Choose how and when you want to be notified</p>
                </div>

                <form onSubmit={handleSubmit} className="settings-form">
                  <div className="notifications-grid">
                    <div className="notification-group">
                      <h3 className="group-title">📧 Email Notifications</h3>
                      <div className="notification-item">
                        <div className="notification-info">
                          <h4>Scan Completed</h4>
                          <p>Get notified when your API security scans finish</p>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={formData.notifications.scanCompleted}
                            onChange={(e) =>
                              handleNestedChange('notifications', 'scanCompleted', e.target.checked)
                            }
                            disabled={isSaving}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                      <div className="notification-item">
                        <div className="notification-info">
                          <h4>Critical Findings</h4>
                          <p>Immediate alerts for critical security vulnerabilities</p>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={formData.notifications.criticalFindings}
                            onChange={(e) =>
                              handleNestedChange('notifications', 'criticalFindings', e.target.checked)
                            }
                            disabled={isSaving}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                      <div className="notification-item">
                        <div className="notification-info">
                          <h4>Weekly Digest</h4>
                          <p>Weekly summary of your API security status and trends</p>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={formData.notifications.emailDigest}
                            onChange={(e) =>
                              handleNestedChange('notifications', 'emailDigest', e.target.checked)
                            }
                            disabled={isSaving}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>

                    <div className="notification-group">
                      <h3 className="group-title">📱 Mobile Notifications</h3>
                      <div className="notification-item">
                        <div className="notification-info">
                          <h4>SMS Alerts</h4>
                          <p>Text messages for urgent security issues</p>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={formData.notifications.smsAlerts}
                            onChange={(e) =>
                              handleNestedChange('notifications', 'smsAlerts', e.target.checked)
                            }
                            disabled={isSaving}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                      <div className="notification-item">
                        <div className="notification-info">
                          <h4>Product Updates</h4>
                          <p>New features, updates, and product announcements</p>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={formData.notifications.productUpdates}
                            onChange={(e) =>
                              handleNestedChange('notifications', 'productUpdates', e.target.checked)
                            }
                            disabled={isSaving}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={isSaving}>
                      Reset Changes
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                      {isSaving ? '⏳ Saving...' : '💾 Save Notification Settings'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="settings-panel">
                <div className="panel-header">
                  <h2 className="panel-title">⚙️ Application Preferences</h2>
                  <p className="panel-description">Customize your AT-AT experience and default settings</p>
                </div>

                <form onSubmit={handleSubmit} className="settings-form">
                  <div className="preferences-grid">
                    <div className="form-group">
                      <label htmlFor="defaultScanProfile">Default Scan Profile</label>
                      <select
                        id="defaultScanProfile"
                        name="defaultScanProfile"
                        value={formData.preferences.defaultScanProfile}
                        onChange={(e) =>
                          handleNestedChange('preferences', 'defaultScanProfile', e.target.value)
                        }
                        disabled={isSaving}
                      >
                        <option value="owasp">🛡️ OWASP Top 10 Quick Scan</option>
                        <option value="comprehensive">🔍 Full Comprehensive Scan</option>
                        <option value="auth">🔐 Authentication Focus</option>
                        <option value="performance">⚡ Performance Testing</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="emailFrequency">Report Email Frequency</label>
                      <select
                        id="emailFrequency"
                        name="emailFrequency"
                        value={formData.preferences.emailFrequency}
                        onChange={(e) =>
                          handleNestedChange('preferences', 'emailFrequency', e.target.value)
                        }
                        disabled={isSaving}
                      >
                        <option value="daily">📅 Daily</option>
                        <option value="weekly">📊 Weekly</option>
                        <option value="monthly">📈 Monthly</option>
                        <option value="never">🚫 Never</option>
                      </select>
                    </div>

                    <div className="preference-item">
                      <div className="preference-info">
                        <h4>Auto-save Reports</h4>
                        <p>Automatically save scan reports to your account</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={formData.preferences.autoSaveReports}
                          onChange={(e) =>
                            handleNestedChange('preferences', 'autoSaveReports', e.target.checked)
                          }
                          disabled={isSaving}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={isSaving}>
                      Reset Changes
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                      {isSaving ? '⏳ Saving...' : '💾 Save Preferences'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {saveMessage && <div className="save-message success">{saveMessage}</div>}
          {error && <div className="save-message error">❌ {error}</div>}
        </section>
      </main>

      <footer className="settings-footer">
        <p>© 2025 AT-AT (API Threat Assessment Tool) • COS301 Capstone Project. All rights reserved.</p>
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Help Center</a>
        </div>
      </footer>
    </div>
  );
};

export default Settings;
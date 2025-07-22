import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from './App';
import { useAuth } from './AuthContext';
import Cookies from 'js-cookie';
import Logo from './components/Logo';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { currentUser, logout, getUserFullName } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  const [isVisible, setIsVisible] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [error, setError] = useState(null);

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

  const defaultFormData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    company: 'AT-AT Inc.',
    position: 'Security Engineer',
    timezone: 'UTC+02:00',
    language: 'en',
    avatar: '',
    phone: '+27 11 123 4567',
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
  };

  const [formData, setFormData] = useState(() => {
    try {
      const savedData = Cookies.get('settingsFormData');
      return savedData ? JSON.parse(savedData) : defaultFormData;
    } catch (e) {
      console.error('Error parsing cookies:', e);
      return defaultFormData;
    }
  });

  useEffect(() => {
    Cookies.set('settingsFormData', JSON.stringify(formData), { expires: 7 });
  }, [formData]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login', { replace: true });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNestedChange = (section, key, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      let message = '';
      switch (activeTab) {
        case 'profile':
          message = '✅ Profile information saved successfully!';
          break;
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
      
      setSaveMessage(message);
    } catch (err) {
      setError('Failed to save settings. Please try again.');
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        setSaveMessage('');
        setError(null);
      }, 3000);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to reset all changes?')) {
      setFormData(defaultFormData);
      Cookies.set('settingsFormData', JSON.stringify(defaultFormData), { expires: 7 });
      setSaveMessage('🔄 Settings reset to default');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const settingsTabs = [
    { id: 'profile', name: 'Profile', icon: '👤', description: 'Personal information and account details' },
    { id: 'notifications', name: 'Notifications', icon: '🔔', description: 'Manage your notification preferences' },
    // { id: 'security', name: 'Security', icon: '🔒', description: 'Security settings and authentication' },
    // { id: 'preferences', name: 'Preferences', icon: '⚙️', description: 'Application preferences and defaults' },
  ];

  if (!currentUser) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Settings...</p>
      </div>
    );
  }

  const userFullName = getUserFullName() || (currentUser.firstName ? `${currentUser.firstName} Doe` : 'User');

  return (
    <div className="settings-container">
      <header className="settings-header">
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Logo />
          <span className="logo-text">
            AT-AT
          </span>
        </div>

        <nav className="settings-nav">
          <Link to="/home" className={location.pathname === '/home' ? 'active' : ''}>
            Home
          </Link>
          <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
            Dashboard
          </Link>
          <Link to="/public-templates" className={location.pathname === '/public-templates' ? 'active' : ''}>
            Public Templates
          </Link>
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

                <form onSubmit={handleSubmit} className="settings-form">
                  <div className="avatar-section">
                    <div className="avatar-container">
                      <div className="avatar-display">
                        {formData.avatar ? (
                          <img src={formData.avatar} alt="Profile" />
                        ) : (
                          <span className="avatar-initials">
                            {formData.name.split(' ').map((n) => n[0]).join('')}
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
                      <label htmlFor="name">Full Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        required
                      />
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
                        required
                      />
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
                      />
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
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="timezone">Timezone</label>
                      <select
                        id="timezone"
                        name="timezone"
                        value={formData.timezone}
                        onChange={handleInputChange}
                      >
                        <option value="UTC-12:00">🌍 UTC-12:00 - Baker Island</option>
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
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                      Reset to Default
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                      {isSaving ? '⏳ Saving...' : '💾 Save Changes'}
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

                <form onSubmit={handleSubmit} className="settings-form">
                  <div className="security-grid">
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
                            />
                            <span className="toggle-slider"></span>
                          </label>
                          <button type="button" className="btn btn-outline">
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
                        >
                          <option value="15">15 minutes</option>
                          <option value="30">30 minutes</option>
                          <option value="60">1 hour</option>
                          <option value="120">2 hours</option>
                          <option value="480">8 hours</option>
                        </select>
                      </div>
                    </div>

                    <div className="security-section">
                      <h3 className="section-title">🔑 Password Management</h3>
                      <div className="password-actions">
                        <button type="button" className="btn btn-outline">Change Password</button>
                        <button type="button" className="btn btn-outline">Download Recovery Codes</button>
                        <button type="button" className="btn btn-danger">Revoke All Sessions</button>
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                      Reset to Default
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                      {isSaving ? '⏳ Saving...' : '💾 Save Security Settings'}
                    </button>
                  </div>
                </form>
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
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                      Reset to Default
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
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                      Reset to Default
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                      {isSaving ? '⏳ Saving...' : '💾 Save Preferences'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {saveMessage && <div className="save-message">{saveMessage}</div>}
          {error && <div className="save-message error">{error}</div>}
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
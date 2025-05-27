import React, { useState, useContext, useEffect } from 'react'; // Add useEffect for cookie loading
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from './App';
import { useAuth } from './AuthContext';
import Cookies from 'js-cookie'; // Import js-cookie for cookie handling
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { currentUser, logout, getUserFullName } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile');

  // Default form data if no cookie exists
  const defaultFormData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    company: 'AT-AT Inc.',
    position: 'Security Engineer',
    timezone: 'UTC+02:00',
    notifications: {
      scanCompleted: true,
      criticalFindings: true,
      weeklyReport: false,
      productUpdates: true
    }
  };

  // Load form data from cookies if available, otherwise use default
  const [formData, setFormData] = useState(() => {
    const savedData = Cookies.get('settingsFormData');
    return savedData ? JSON.parse(savedData) : defaultFormData;
  });

  // Save form data to cookies whenever it changes
  useEffect(() => {
    Cookies.set('settingsFormData', JSON.stringify(formData), { expires: 7 }); // Expires in 7 days
  }, [formData]);

  const handleLogout = () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      logout();
      navigate('/login', { replace: true });
    }
  };

  if (!currentUser) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: darkMode ? '#1e1e1e' : '#f5f5f5',
        color: darkMode ? 'white' : '#333',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid #333',
            borderTop: '3px solid #6b46c1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Loading Settings...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  const userFullName = getUserFullName() || (currentUser.firstName ? `${currentUser.firstName} Doe` : 'User');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleNotificationChange = (key) => {
    setFormData({
      ...formData,
      notifications: {
        ...formData.notifications,
        [key]: !formData.notifications[key]
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Saving settings to cookies:', formData);
    alert('Settings saved successfully! (Stored in cookies for demo)');
  };

  // Reset form data to default and clear cookies
  const handleCancel = () => {
    setFormData(defaultFormData);
    Cookies.set('settingsFormData', JSON.stringify(defaultFormData), { expires: 7 });
  };

  return (
    <div className="settings-container">
      <header className="settings-header">
        <div className="logo">AT-AT</div>
        <nav className="settings-nav">
          <Link to="/home" className={location.pathname === '/home' ? 'active' : ''}>Home</Link>
          <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>Dashboard</Link>
          <Link to="/public-templates" className={location.pathname === '/public-templates' ? 'active' : ''}>Public Templates</Link>
          <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>Settings</Link>
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
        <h1 className="settings-title">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {currentUser.firstName}! Manage Your Settings
        </h1>

        <div className="settings-grid">
          <aside className="settings-sidebar">
            <ul className="settings-menu">
              <li>
                <Link
                  to="#profile"
                  className={activeTab === 'profile' ? 'active' : ''}
                  onClick={() => setActiveTab('profile')}
                >
                  Profile
                </Link>
              </li>
              <li>
                <Link
                  to="#notifications"
                  className={activeTab === 'notifications' ? 'active' : ''}
                  onClick={() => setActiveTab('notifications')}
                >
                  Notifications
                </Link>
              </li>
            </ul>
          </aside>

          <div className="settings-content">
            {activeTab === 'profile' && (
              <div>
                <h2 className="section-title">Profile Settings</h2>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
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
                      <option value="UTC-12:00">UTC-12:00</option>
                      <option value="UTC-11:00">UTC-11:00</option>
                      <option value="UTC-10:00">UTC-10:00</option>
                      <option value="UTC-09:00">UTC-09:00</option>
                      <option value="UTC-08:00">UTC-08:00</option>
                      <option value="UTC-07:00">UTC-07:00</option>
                      <option value="UTC-06:00">UTC-06:00</option>
                      <option value="UTC-05:00">UTC-05:00</option>
                      <option value="UTC-04:00">UTC-04:00</option>
                      <option value="UTC-03:00">UTC-03:00</option>
                      <option value="UTC-02:00">UTC-02:00</option>
                      <option value="UTC-01:00">UTC-01:00</option>
                      <option value="UTC+00:00">UTC+00:00</option>
                      <option value="UTC+01:00">UTC+01:00</option>
                      <option value="UTC+02:00">UTC+02:00</option>
                      <option value="UTC+03:00">UTC+03:00</option>
                      <option value="UTC+04:00">UTC+04:00</option>
                      <option value="UTC+05:00">UTC+05:00</option>
                      <option value="UTC+06:00">UTC+06:00</option>
                      <option value="UTC+07:00">UTC+07:00</option>
                      <option value="UTC+08:00">UTC+08:00</option>
                      <option value="UTC+09:00">UTC+09:00</option>
                      <option value="UTC+10:00">UTC+10:00</option>
                      <option value="UTC+11:00">UTC+11:00</option>
                      <option value="UTC+12:00">UTC+12:00</option>
                    </select>
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">Save Changes</button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2 className="section-title">Notification Settings</h2>
                <div className="notification-item">
                  <div>
                    <h4>Scan Completed</h4>
                    <p>Receive a notification when a scan is completed.</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={formData.notifications.scanCompleted}
                      onChange={() => handleNotificationChange('scanCompleted')}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="notification-item">
                  <div>
                    <h4>Critical Findings</h4>
                    <p>Get alerted when critical vulnerabilities are found.</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={formData.notifications.criticalFindings}
                      onChange={() => handleNotificationChange('criticalFindings')}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="notification-item">
                  <div>
                    <h4>Weekly Report</h4>
                    <p>Receive a weekly summary of your API security status.</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={formData.notifications.weeklyReport}
                      onChange={() => handleNotificationChange('weeklyReport')}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="notification-item">
                  <div>
                    <h4>Product Updates</h4>
                    <p>Stay informed about new features and updates.</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={formData.notifications.productUpdates}
                      onChange={() => handleNotificationChange('productUpdates')}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-primary" onClick={handleSubmit}>
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
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
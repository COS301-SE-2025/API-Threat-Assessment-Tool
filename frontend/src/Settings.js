import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeContext } from './App';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
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
  });

  const handleLogout = () => {
    navigate('/login');
  };

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
    // Add save logic here
    alert('Settings saved successfully!');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <form onSubmit={handleSubmit}>
            <div className="avatar-container">
              <div className="avatar">
                <span>JD</span>
              </div>
              <div className="avatar-actions">
                <button type="button" className="btn btn-secondary">Change</button>
                <button type="button" className="btn btn-secondary">Remove</button>
              </div>
            </div>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Company</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Position</label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Timezone</label>
              <select
                name="timezone"
                value={formData.timezone}
                onChange={handleInputChange}
              >
                <option value="UTC+00:00">UTC+00:00 (London)</option>
                <option value="UTC+01:00">UTC+01:00 (Paris)</option>
                <option value="UTC+02:00">UTC+02:00 (Athens)</option>
                <option value="UTC-05:00">UTC-05:00 (New York)</option>
                <option value="UTC-08:00">UTC-08:00 (Los Angeles)</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary">Save Changes</button>
            </div>
          </form>
        );
      case 'notifications':
        return (
          <div>
            <h3 className="section-title">Notification Preferences</h3>
            <div className="notification-item">
              <div>
                <h4>Scan Completed</h4>
                <p>Receive notifications when scans are completed</p>
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
                <p>Receive immediate alerts for critical vulnerabilities</p>
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
                <p>Receive a weekly summary of all activities</p>
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
                <p>Receive news about new features and updates</p>
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
              <button type="button" className="btn btn-secondary">Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleSubmit}>Save Changes</button>
            </div>
          </div>
        );
      case 'security':
        return (
          <div>
            <h3 className="section-title">Security Settings</h3>
            <div className="form-group">
              <label>Change Password</label>
              <input
                type="password"
                placeholder="Current Password"
                className="form-control"
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                placeholder="New Password"
                className="form-control"
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                placeholder="Confirm New Password"
                className="form-control"
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary">Cancel</button>
              <button type="button" className="btn btn-primary">Update Password</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="settings-container">
      <header className="settings-header">
        <div className="logo">AT-AT</div>
        <nav className="dashboard-nav">
          <Link to="/home">Home</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/public-templates">Public Templates</Link>
          <Link to="/settings">Settings</Link>
        </nav>
        <div className="user-info">
          <span>Welcome, User!</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
          <button onClick={toggleDarkMode} className="theme-toggle-btn">
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </header>

      <main className="settings-main">
        <h1 className="settings-title">Settings</h1>
        <div className="settings-grid">
          <div className="settings-sidebar">
            <ul className="settings-menu">
              <li>
                <a
                  href="#profile"
                  className={activeTab === 'profile' ? 'active' : ''}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('profile');
                  }}
                >
                  Profile
                </a>
              </li>
              <li>
                <a
                  href="#notifications"
                  className={activeTab === 'notifications' ? 'active' : ''}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('notifications');
                  }}
                >
                  Notifications
                </a>
              </li>
              <li>
                <a
                  href="#security"
                  className={activeTab === 'security' ? 'active' : ''}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('security');
                  }}
                >
                  Security
                </a>
              </li>
            </ul>
          </div>
          <div className="settings-content">
            {renderTabContent()}
          </div>
        </div>
      </main>

      <footer className="dashboard-footer">
        <p>© 2025 AT-AT (API Threat Assessment Tool) • COS301 Capstone Project. All rights reserved.</p>
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
};

export default Settings;
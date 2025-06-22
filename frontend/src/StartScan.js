import React, { useState, useContext, useEffect } from 'react'; // Add useEffect import
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from './App';
import { useAuth } from './AuthContext';
import ScanProgress from './ScanProgress';
import Logo from "./components/Logo";
import './StartScan.css';

const StartScan = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { currentUser, logout, getUserFullName } = useAuth();
  const [api, setApi] = useState('');
  const [profile, setProfile] = useState('');
  const [scanStarted, setScanStarted] = useState(false);
  const [selectedApiName, setSelectedApiName] = useState('');

  // API options with display names
  const apiOptions = {
    'api1': 'My E-commerce Site API',
    'api2': 'Client Project API',
    'api3': 'Internal User Service'
  };

  // Prefill form with selections from Dashboard (if provided)
  useEffect(() => {
    if (location.state) {
      const { api: passedApi, profile: passedProfile } = location.state;
      if (passedApi) setApi(passedApi);
      if (passedProfile) setProfile(passedProfile);
    }
  }, [location.state]);

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
          <p>Loading Scan Setup...</p>
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (api && profile) {
      setSelectedApiName(apiOptions[api]);
      setScanStarted(true);
    } else {
      alert('Please select an API and a testing profile to start the scan.');
    }
  };

  const handleScanComplete = (finalReport) => {
    console.log('Scan completed:', finalReport);
  };

  const handleScanCancel = () => {
    setScanStarted(false);
    setApi('');
    setProfile('');
    setSelectedApiName('');
  };

  if (scanStarted) {
    return (
      <div className="start-scan-container">
        <header className="start-scan-header">
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
          <nav className="start-scan-nav">
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

        <main className="start-scan-main">
          <ScanProgress 
            apiName={selectedApiName}
            profile={profile}
            onComplete={handleScanComplete}
            onCancel={handleScanCancel}
          />
        </main>

        <footer className="start-scan-footer">
          <p>© 2025 AT-AT (API Threat Assessment Tool) • COS301 Capstone Project. All rights reserved.</p>
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Help Center</a>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="start-scan-container">
      <header className="start-scan-header">
        <div className="logo">AT-AT</div>
        <nav className="start-scan-nav">
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

      <main className="start-scan-main">
        <section className="start-scan-header-section">
          <h1>Start a New Scan</h1>
          <Link to="/dashboard" className="back-btn">Back to Dashboard</Link>
        </section>

        <section className="scan-form-section">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="api-select">Select API to Assess:</label>
              <select
                id="api-select"
                value={api}
                onChange={(e) => setApi(e.target.value)}
              >
                <option value="">-- Choose an API --</option>
                <option value="api1">My E-commerce Site API</option>
                <option value="api2">Client Project API</option>
                <option value="api3">Internal User Service</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="profile-select">Select Testing Profile:</label>
              <select
                id="profile-select"
                value={profile}
                onChange={(e) => setProfile(e.target.value)}
              >
                <option value="">-- Choose a Profile --</option>
                <option value="owasp">OWASP Top 10 Quick Scan (~30 seconds)</option>
                <option value="full">Full Comprehensive Scan (~45 seconds)</option>
                <option value="auth">Authentication & Authorization Focus (~25 seconds)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Advanced Options (Optional):</label>
              <div className="advanced-options">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  Enable Detailed Logging
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" />
                  Include Deprecated Endpoints
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" />
                  Generate Executive Summary
                </label>
              </div>
            </div>

            <div className="scan-preview">
              {api && profile && (
                <div className="preview-info">
                  <h3>🔍 Scan Preview</h3>
                  <p><strong>API:</strong> {apiOptions[api]}</p>
                  <p><strong>Profile:</strong> {profile === 'owasp' ? 'OWASP Top 10 Quick Scan' : 
                                               profile === 'full' ? 'Full Comprehensive Scan' : 
                                               'Authentication & Authorization Focus'}</p>
                  <p><strong>Estimated Duration:</strong> {
                    profile === 'owasp' ? '~30 seconds' : 
                    profile === 'full' ? '~45 seconds' : 
                    '~25 seconds'
                  }</p>
                  <div className="scan-phases">
                    <strong>Scan Phases:</strong>
                    <ul>
                      <li>🔍 Discovery & Enumeration</li>
                      <li>🔐 Authentication Testing</li>
                      <li>🛡️ Authorization Testing</li>
                      <li>📝 Input Validation</li>
                      <li>🔒 Security Headers Analysis</li>
                      <li>⚠️ Vulnerability Assessment</li>
                      <li>📊 Report Generation</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="button-container">
              <button type="submit" className="start-scan-btn">
                🚀 Start Security Scan
              </button>
            </div>
          </form>
        </section>
      </main>

      <footer className="start-scan-footer">
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

export default StartScan;
import React, { useState, useContext, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from './App';
import { useAuth } from './AuthContext';
import Logo from './components/Logo';
import ScanProgress from './ScanProgress';
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
  const [advancedOptions, setAdvancedOptions] = useState({
    detailedLogging: false,
    includeDeprecated: false,
    executiveSummary: true
  });
  const [isVisible, setIsVisible] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiOptions = {
    'api1': {
      name: 'E-commerce API',
      description: 'Main API for the e-commerce platform',
      url: 'https://api.ecommerce.com/v1',
      endpoints: 45
    },
    'api2': {
      name: 'Payment Gateway API',
      description: 'Secure payment processing API',
      url: 'https://api.payments.com/v2',
      endpoints: 28
    },
    'api3': {
      name: 'User Management Service',
      description: 'Internal user authentication service',
      url: 'https://api.users.internal/v1',
      endpoints: 32
    },
    'api4': {
      name: 'Analytics API',
      description: 'Data analytics and reporting API',
      url: 'https://api.analytics.com/v3',
      endpoints: 38
    }
  };

  const profileOptions = {
    'owasp': {
      name: 'OWASP Top 10 Quick Scan',
      description: 'Focuses on OWASP API Security Top 10 vulnerabilities',
      duration: '~30 seconds',
      coverage: 'Essential',
      icon: '🛡️'
    },
    'full': {
      name: 'Full Comprehensive Scan',
      description: 'Complete security assessment covering all vulnerability categories',
      duration: '~45 seconds',
      coverage: 'Comprehensive',
      icon: '🔍'
    },
    'auth': {
      name: 'Authentication & Authorization Focus',
      description: 'Specialized scan focusing on authentication and authorization issues',
      duration: '~25 seconds',
      coverage: 'Authentication',
      icon: '🔐'
    }
  };

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.target.id) {
          setIsVisible(prev => ({
            ...prev,
            [entry.target.id]: true
          }));
        }
      });
    }, observerOptions);

    const sections = document.querySelectorAll('.animate-on-scroll');
    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (location.state) {
      const { api: passedApi, profile: passedProfile } = location.state;
      if (passedApi && apiOptions[passedApi]) setApi(passedApi);
      if (passedProfile && profileOptions[passedProfile]) setProfile(passedProfile);
    }
  }, [location.state]);

  const handleLogout = useCallback(() => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      logout();
      navigate('/login', { replace: true });
    }
  }, [logout, navigate]);

  const userFullName = getUserFullName() || (currentUser?.firstName ? `${currentUser.firstName} User` : 'User');

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError(null);

    if (!api || !profile) {
      setError('Please select both an API and a testing profile to start the scan.');
      return;
    }

    const selectedApi = apiOptions[api];
    if (!selectedApi) {
      setError('Invalid API selection. Please choose a valid API.');
      return;
    }

    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 1000));

    setSelectedApiName(selectedApi.name);
    setScanStarted(true);
    setIsLoading(false);
  }, [api, profile, apiOptions]);

  const handleScanComplete = useCallback((finalReport) => {
    console.log('Scan completed:', finalReport);
  }, []);

  const handleScanCancel = useCallback(() => {
    setScanStarted(false);
    setApi('');
    setProfile('');
    setSelectedApiName('');
    setAdvancedOptions({
      detailedLogging: false,
      includeDeprecated: false,
      executiveSummary: true
    });
    setError(null);
  }, []);

  const handleAdvancedOptionChange = useCallback((option, value) => {
    setAdvancedOptions(prev => ({
      ...prev,
      [option]: value
    }));
  }, []);

  const getScanPhases = useCallback(() => {
    return [
      '🔍 Discovery & Enumeration',
      '🔐 Authentication Testing',
      '🛡️ Authorization Testing',
      '📝 Input Validation',
      '🔒 Security Headers Analysis',
      '⚠️ Vulnerability Assessment',
      '📊 Report Generation'
    ];
  }, []);

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
      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: darkMode ? '#ef5350' : '#dc3545',
          color: 'white',
          padding: '15px 25px',
          borderRadius: '8px',
          zIndex: 1001,
          maxWidth: '400px'
        }}>
          {error}
          <button 
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              marginLeft: '10px',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>
      )}

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
        <section className="start-scan-header-section">
          <h1 className="section-title">
            Start Security 
            <span className="gradient-text"> Scan</span>
          </h1>
          <Link to="/dashboard" className="back-btn">
            ← Back to Dashboard
          </Link>
        </section>

        <section 
          id="scan-form" 
          className={`scan-form-section animate-on-scroll ${isVisible['scan-form'] ? 'visible' : ''}`}
        >
          <div className="scan-form-container">
            <div className="form-header">
              <h2 className="form-title">🚀 Configure Your Scan</h2>
              <p className="form-description">Select an API and testing profile to begin security assessment</p>
            </div>
            
            <form onSubmit={handleSubmit} className="scan-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="api-select">
                    🔗 Select API to Assess:
                  </label>
                  <select
                    id="api-select"
                    value={api}
                    onChange={(e) => setApi(e.target.value)}
                    required
                  >
                    <option value="">-- Choose an API --</option>
                    {Object.entries(apiOptions).map(([key, apiData]) => (
                      <option key={key} value={key}>
                        {apiData.name} ({apiData.endpoints} endpoints)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="profile-select">
                    ⚙️ Select Testing Profile:
                  </label>
                  <select
                    id="profile-select"
                    value={profile}
                    onChange={(e) => setProfile(e.target.value)}
                    required
                  >
                    <option value="">-- Choose a Profile --</option>
                    {Object.entries(profileOptions).map(([key, profileData]) => (
                      <option key={key} value={key}>
                        {profileData.icon} {profileData.name} ({profileData.duration})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>🔧 Advanced Options:</label>
                  <div className="advanced-options">
                    <div className="advanced-title">
                      ⚡ Customize Scan Behavior
                    </div>
                    <div className="options-grid">
                      <label className="checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={advancedOptions.detailedLogging}
                          onChange={(e) => handleAdvancedOptionChange('detailedLogging', e.target.checked)}
                        />
                        📝 Enable Detailed Logging
                      </label>
                      <label className="checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={advancedOptions.includeDeprecated}
                          onChange={(e) => handleAdvancedOptionChange('includeDeprecated', e.target.checked)}
                        />
                        🗂️ Include Deprecated Endpoints
                      </label>
                      <label className="checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={advancedOptions.executiveSummary}
                          onChange={(e) => handleAdvancedOptionChange('executiveSummary', e.target.checked)}
                        />
                        📋 Generate Executive Summary
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {api && profile && (
                <div className="scan-preview">
                  <div className="preview-info">
                    <h3>🔍 Scan Preview</h3>
                    <div className="preview-details">
                      <div className="preview-item">
                        <strong>API Target:</strong>
                        <span>{apiOptions[api].name}</span>
                      </div>
                      <div className="preview-item">
                        <strong>Base URL:</strong>
                        <span>{apiOptions[api].url}</span>
                      </div>
                      <div className="preview-item">
                        <strong>Testing Profile:</strong>
                        <span>{profileOptions[profile].name}</span>
                      </div>
                      <div className="preview-item">
                        <strong>Estimated Duration:</strong>
                        <span>{profileOptions[profile].duration}</span>
                      </div>
                      <div className="preview-item">
                        <strong>Coverage Level:</strong>
                        <span>{profileOptions[profile].coverage}</span>
                      </div>
                      <div className="preview-item">
                        <strong>Endpoints to Test:</strong>
                        <span>{apiOptions[api].endpoints} endpoints</span>
                      </div>
                    </div>
                    
                    <div className="scan-phases">
                      <div className="phases-title">
                        📋 Scan Phases:
                      </div>
                      <ul className="phases-list">
                        {getScanPhases().map((phase, index) => (
                          <li key={index}>{phase}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="button-container">
                <button 
                  type="submit" 
                  className="start-scan-btn"
                  disabled={isLoading || !api || !profile}
                >
                  {isLoading ? (
                    <>
                      <div className="progress-spinner"></div>
                      Preparing Scan...
                    </>
                  ) : (
                    <>
                      🚀 Start Security Scan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
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
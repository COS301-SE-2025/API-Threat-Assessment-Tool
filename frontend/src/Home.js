import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from './App';
import { useAuth } from './AuthContext';
import Logo from "./components/Logo";
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { currentUser, logout, getUserFullName } = useAuth();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(prev => ({
            ...prev,
            [entry.target.id]: true
          }));
        }
      });
    }, observerOptions);

    // Observe all sections with animation
    const sections = document.querySelectorAll('.animate-on-scroll');
    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const handleLogout = () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      logout();
      navigate('/login', { replace: true });
    }
  };

  // Loading state
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
          <p>Loading...</p>
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

  const whatIsATAT = [
    { 
      title: 'API Security Scanner', 
      description: 'Comprehensive vulnerability assessment for REST APIs using industry-standard testing methodologies.',
      icon: '🔍'
    },
    { 
      title: 'OWASP Compliance', 
      description: 'Built-in testing profiles for OWASP Top 10 API security risks and custom security frameworks.',
      icon: '🛡️'
    },
    { 
      title: 'Automated Testing', 
      description: 'Intelligent automated testing that identifies authentication flaws, injection attacks, and data exposure.',
      icon: '🤖'
    },
    { 
      title: 'Actionable Reports', 
      description: 'Detailed security reports with prioritized recommendations and step-by-step remediation guides.',
      icon: '📊'
    }
  ];

  const howItWorksSteps = [
    {
      step: '1',
      title: 'Import Your API',
      description: 'Upload OpenAPI specs or manually configure your API endpoints',
      icon: '📤'
    },
    {
      step: '2',
      title: 'Choose Scan Profile',
      description: 'Select from OWASP Top 10, comprehensive scans, or custom profiles',
      icon: '⚙️'
    },
    {
      step: '3',
      title: 'Run Security Tests',
      description: 'AT-AT performs automated security testing across all endpoints',
      icon: '🔬'
    },
    {
      step: '4',
      title: 'Get Actionable Results',
      description: 'Receive detailed reports with prioritized fixes and recommendations',
      icon: '📋'
    }
  ];

  const securityThreats = [
    {
      threat: 'SQL Injection',
      severity: 'Critical',
      percentage: '23%',
      trend: 'up'
    },
    {
      threat: 'Broken Authentication',
      severity: 'High',
      percentage: '19%',
      trend: 'down'
    },
    {
      threat: 'Sensitive Data Exposure',
      severity: 'High',
      percentage: '16%',
      trend: 'up'
    },
    {
      threat: 'XML External Entities',
      severity: 'Medium',
      percentage: '12%',
      trend: 'stable'
    }
  ];

  return (
    <div className="home-container">
      <header className="home-header">
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
        <nav className="home-nav">
          <Link to="/home" className={location.pathname === '/home' ? 'active' : ''}>Home</Link>
          <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>Dashboard</Link>
          <Link to="/manage-apis" className={location.pathname === '/manage-apis' ? 'active' : ''}>API Management</Link>
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

      <main className="home-main">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              Secure Your APIs with 
              <span className="gradient-text"> AT-AT</span>
            </h1>
            <p className="hero-description">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {currentUser.firstName}! 
              Comprehensive API security scanning powered by OWASP standards. 
              Identify vulnerabilities, ensure compliance, and protect your digital assets.
            </p>
            <div className="cta-buttons">
              <Link to="/start-scan" className="cta-btn primary">
                🚀 Start Security Scan
              </Link>
              <Link to="/reports" className="cta-btn secondary">
                📊 View Reports
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="security-shield">
              <div className="shield-inner">🛡️</div>
            </div>
          </div>
        </section>

        {/* What is AT-AT Section */}
        <section 
          id="what-is-atat-section" 
          className={`what-is-atat-section animate-on-scroll ${isVisible['what-is-atat-section'] ? 'visible' : ''}`}
        >
          <div className="section-header">
            <h2>What is AT-AT?</h2>
            <p>API Threat Assessment Tool - Your comprehensive solution for API security testing</p>
          </div>
          <div className="what-is-grid">
            {whatIsATAT.map((item, index) => (
              <div key={index} className="what-is-card" style={{animationDelay: `${index * 0.1}s`}}>
                <div className="what-is-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section 
          id="features-section" 
          className={`features-section animate-on-scroll ${isVisible['features-section'] ? 'visible' : ''}`}
        >
          <h2>Why Choose AT-AT?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Comprehensive Scanning</h3>
              <p>Advanced vulnerability detection covering OWASP Top 10, injection attacks, authentication flaws, and custom security patterns.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚙️</div>
              <h3>Customizable Profiles</h3>
              <p>Pre-built security templates and custom scan configurations tailored to your specific API architecture and business requirements.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Actionable Reports</h3>
              <p>Detailed security insights with risk prioritization, remediation guidance, and compliance mapping for immediate action.</p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section 
          id="how-it-works" 
          className={`how-it-works-section animate-on-scroll ${isVisible['how-it-works'] ? 'visible' : ''}`}
        >
          <h2>How AT-AT Works</h2>
          <div className="steps-container">
            {howItWorksSteps.map((step, index) => (
              <div key={index} className="step-card" style={{animationDelay: `${index * 0.2}s`}}>
                <div className="step-number">{step.step}</div>
                <div className="step-icon">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Security Threats Section */}
        <section 
          id="threats-section" 
          className={`threats-section animate-on-scroll ${isVisible['threats-section'] ? 'visible' : ''}`}
        >
          <h2>Current API Security Landscape</h2>
          <div className="threats-grid">
            <div className="threats-info">
              <h3>Top API Vulnerabilities (2025)</h3>
              <p>Based on our analysis of thousands of API scans, these are the most common security issues we discover:</p>
            </div>
            <div className="threats-list">
              {securityThreats.map((threat, index) => (
                <div key={index} className="threat-item" style={{animationDelay: `${index * 0.1}s`}}>
                  <div className="threat-info">
                    <span className="threat-name">{threat.threat}</span>
                    <span className={`threat-severity ${threat.severity.toLowerCase()}`}>
                      {threat.severity}
                    </span>
                  </div>
                  <div className="threat-stats">
                    <span className="threat-percentage">{threat.percentage}</span>
                    <span className={`threat-trend ${threat.trend}`}>
                      {threat.trend === 'up' ? '↗️' : threat.trend === 'down' ? '↘️' : '➡️'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Actions Section */}
        <section 
          id="quick-actions" 
          className={`quick-actions-section animate-on-scroll ${isVisible['quick-actions'] ? 'visible' : ''}`}
        >
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/start-scan" className="action-card">
              <div className="action-icon">🔍</div>
              <h3>Run a Scan</h3>
              <p>Start a new security assessment</p>
            </Link>
            <Link to="/public-templates" className="action-card">
              <div className="action-icon">📋</div>
              <h3>Explore Templates</h3>
              <p>Browse community scan profiles</p>
            </Link>
            <Link to="/reports" className="action-card">
              <div className="action-icon">📊</div>
              <h3>View Reports</h3>
              <p>Access your security reports</p>
            </Link>
            <Link to="/manage-apis" className="action-card">
              <div className="action-icon">⚙️</div>
              <h3>Manage APIs</h3>
              <p>Configure your API endpoints</p>
            </Link>
          </div>
        </section>

        {/* Security Tips Section */}
        <section 
          id="security-tips" 
          className={`security-tips-section animate-on-scroll ${isVisible['security-tips'] ? 'visible' : ''}`}
        >
          <h2>💡 Security Tips</h2>
          <div className="tips-container">
            <div className="tip-card">
              <h4>🔐 Authentication Best Practices</h4>
              <p>Always use strong authentication mechanisms like OAuth 2.0 or JWT tokens with proper validation and expiration.</p>
            </div>
            <div className="tip-card">
              <h4>🛡️ Input Validation</h4>
              <p>Implement comprehensive input validation and sanitization to prevent injection attacks and data corruption.</p>
            </div>
            <div className="tip-card">
              <h4>📈 Rate Limiting</h4>
              <p>Protect your APIs from abuse by implementing rate limiting and throttling mechanisms for all endpoints.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="home-footer">
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

export default Home;
import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from './App';
import { useAuth } from './AuthContext';
import Logo from "./components/Logo";
import './Home.css';

// A simple service to fetch dashboard overview data
const dashboardService = {
  async getOverview() {
    // This assumes your authentication setup provides a token for API requests.
    // You might need to adjust this to include an Authorization header if needed.
    const res = await fetch('/api/dashboard/overview');
    const data = await res.json();
    if (!res.ok || !data.success) {
      // Don't throw an error for the home page, just return null
      console.error(data.message || 'Failed to fetch overview stats.');
      return null;
    }
    return data.data;
  }
};

const Home = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { currentUser, logout, getUserFullName } = useAuth();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState({});
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (currentUser) {
      dashboardService.getOverview().then(setStats);
    }
  }, [currentUser]);

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

    const sections = document.querySelectorAll('.animate-on-scroll');
    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const handleLogout = () => {
    // Using a simpler confirmation approach
    if (window.confirm('Are you sure you want to logout?')) {
        logout();
        navigate('/login', { replace: true });
    }
  };

  if (!currentUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: darkMode ? '#1e1e1e' : '#f5f5f5' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const userFullName = getUserFullName() || 'User';

  const whatIsATAT = [
    { title: 'API Security Scanner', description: 'Comprehensive vulnerability assessment for REST APIs using industry-standard testing methodologies.', icon: '🔍' },
    { title: 'OWASP Compliance', description: 'Built-in testing profiles for OWASP Top 10 API security risks and custom security frameworks.', icon: '🛡️' },
    { title: 'Automated Testing', description: 'Intelligent automated testing that identifies authentication flaws, injection attacks, and data exposure.', icon: '🤖' },
    { title: 'Actionable Reports', description: 'Detailed security reports with prioritized recommendations and step-by-step remediation guides.', icon: '📊' }
  ];
  
  const howItWorksSteps = [
    { step: '1', title: 'Import Your API', description: 'Upload OpenAPI specs or manually configure your API endpoints', icon: '📤' },
    { step: '2', title: 'Choose Scan Profile', description: 'Select from OWASP Top 10, comprehensive scans, or custom profiles', icon: '⚙️' },
    { step: '3', title: 'Run Security Tests', description: 'AT-AT performs automated security testing across all endpoints', icon: '🔬' },
    { step: '4', title: 'Get Actionable Results', description: 'Receive detailed reports with prioritized fixes and recommendations', icon: '📋' }
  ];

  return (
    <div className={`home-container ${darkMode ? 'dark-mode' : ''}`}>
      <header className="home-header">
        <div className="logo" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Logo />
        </div>
        <nav className="home-nav">
          <Link to="/home" className={location.pathname === '/home' ? 'active' : ''}>Home</Link>
          <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>Dashboard</Link>
          <Link to="/manage-apis" className={location.pathname === '/manage-apis' ? 'active' : ''}>API Management</Link>
          <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>Settings</Link>
        </nav>
        <div className="user-info">
          <div className="user-profile">
            <span className="user-avatar">{currentUser.firstName?.charAt(0)?.toUpperCase() || 'U'}</span>
            <div className="user-details">
              <span className="user-greeting">Welcome back,</span>
              <span className="user-name">{userFullName}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn" title="Logout">Logout</button>
          <button onClick={toggleDarkMode} className="theme-toggle-btn" title="Toggle Theme">{darkMode ? '☀️' : '🌙'}</button>
        </div>
      </header>

      <main className="home-main">
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              Secure Your APIs with<span className="gradient-text"> AT-AT</span>
            </h1>
            <p className="hero-description">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {currentUser.firstName}! 
              Comprehensive API security scanning powered by OWASP standards. 
              Identify vulnerabilities, ensure compliance, and protect your digital assets.
            </p>
            <div className="cta-buttons">
              <Link to="/manage-apis" className="cta-btn primary">
                🚀 Manage APIs Here
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="security-shield">
              <div className="shield-inner">🛡️</div>
            </div>
          </div>
        </section>

        <section id="what-is-atat-section" className={`what-is-atat-section animate-on-scroll ${isVisible['what-is-atat-section'] ? 'visible' : ''}`}>
          <div className="section-header"><h2>What is AT-AT?</h2><p>Your comprehensive solution for API security testing</p></div>
          <div className="what-is-grid">
            {whatIsATAT.map((item, index) => (
              <div key={index} className="what-is-card" style={{animationDelay: `${index * 0.1}s`}}>
                <div className="what-is-icon">{item.icon}</div><h3>{item.title}</h3><p>{item.description}</p>
              </div>
            ))}
          </div>
        </section>
        
        <section id="how-it-works" className={`how-it-works-section animate-on-scroll ${isVisible['how-it-works'] ? 'visible' : ''}`}>
          <h2>How AT-AT Works</h2>
          <div className="steps-container">
            {howItWorksSteps.map((step, index) => (
              <div key={index} className="step-card" style={{animationDelay: `${index * 0.2}s`}}>
                <div className="step-number">{step.step}</div><div className="step-icon">{step.icon}</div>
                <h3>{step.title}</h3><p>{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="quick-actions" className={`quick-actions-section animate-on-scroll ${isVisible['quick-actions'] ? 'visible' : ''}`}>
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/manage-apis" className="action-card"><div className="action-icon">⚙️</div><h3>Manage APIs</h3><p>Configure your API endpoints</p></Link>
            <Link to="/dashboard" className="action-card"><div className="action-icon">🔍</div><h3>View Dashboard</h3><p>Analyze metrics based on your activity</p></Link>
            <Link to="/manage-apis" className="action-card"><div className="action-icon">📊</div><h3>View Reports</h3><p>Access your security reports</p></Link>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <p>© 2025 AT-AT (API Threat Assessment Tool) • COS301 Capstone Project. All rights reserved.</p>
        <div className="footer-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/documentation">Documentation</Link>
          <Link to="/contact">Contact Us</Link>
        </div>
      </footer>
    </div>
  );
};

export default Home;
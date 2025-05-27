import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from './App';
import { useAuth } from './AuthContext';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { currentUser, logout, getUserFullName } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      logout();
      navigate('/login', { replace: true });
    }
  };

  // Loading state similar to Dashboard
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

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="logo">AT-AT</div>
        <nav className="home-nav">
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

      <main className="home-main">
        <section className="welcome-section">
          <h1>Welcome to AT-AT</h1>
          <p>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {currentUser.firstName}! API Threat Assessment Tool (AT-AT) helps you secure your APIs by identifying vulnerabilities and ensuring best practices. 
            Start a new scan, explore public templates, or review your recent activity below.
          </p>
          <div className="cta-buttons">
            <Link to="/start-scan" className="cta-btn">Start a New Scan</Link>
            <Link to="/reports" className="cta-btn secondary">View Reports</Link>
          </div>
        </section>

        <section className="features-section">
          <h2>Why Use AT-AT?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>Comprehensive Scanning</h3>
              <p>Run detailed scans to identify OWASP Top 10 vulnerabilities and more.</p>
            </div>
            <div className="feature-card">
              <h3>Customizable Profiles</h3>
              <p>Choose from predefined profiles or create your own for tailored testing.</p>
            </div>
            <div className="feature-card">
              <h3>Actionable Reports</h3>
              <p>Get clear, actionable insights to improve your API security posture.</p>
            </div>
          </div>
        </section>

        <section className="quick-links">
          <h2>Quick Links</h2>
          <div className="links-grid">
            <Link to="/start-scan" className="link-card">Run a Scan</Link>
            <Link to="/public-templates" className="link-card">Explore Templates</Link>
            <Link to="/reports" className="link-card">View Reports</Link>
            <Link to="/settings" className="link-card">Account Settings</Link>
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
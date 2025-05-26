import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Add logout logic here (e.g., clear tokens, state, etc.)
    navigate('/login');
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="logo">AT-AT</div>
        <nav className="home-nav">
          <Link to="/home">Home</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/public-templates">Public Templates</Link>
          <Link to="/settings">Settings</Link>
        </nav>
        <div className="user-info">
          <span>Welcome, User!</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="home-main">
        <section className="welcome-section">
          <h1>Welcome to AT-AT</h1>
          <p>
            API Threat Assessment Tool (AT-AT) helps you secure your APIs by identifying vulnerabilities and ensuring best practices. 
            Start a new scan, explore public templates, or review your recent activity below.
          </p>
          <div className="cta-buttons">
            <Link to="/dashboard" className="cta-btn">Start a New Scan</Link>
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
            <Link to="/dashboard" className="link-card">Run a Scan</Link>
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
        </div>
      </footer>
    </div>
  );
};

export default Home;
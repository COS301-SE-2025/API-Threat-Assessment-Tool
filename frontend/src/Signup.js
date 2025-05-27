import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeContext } from './App';
import './StartScan.css';

const StartScan = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const [api, setApi] = useState('');
  const [profile, setProfile] = useState('');

  const handleLogout = () => {
    navigate('/login');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (api && profile) {
      navigate('/dashboard');
    } else {
      alert('Please select an API and a testing profile to start the scan.');
    }
  };

  return (
    <div className="start-scan-container">
      <header className="start-scan-header">
        <div className="logo">AT-AT</div>
        <nav className="start-scan-nav">
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
                <option value="owasp">OWASP Top 10 Quick Scan</option>
                <option value="full">Full Comprehensive Scan</option>
                <option value="auth">Authentication & Authorization Focus</option>
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
              </div>
            </div>

            <div className="button-container">
              <button type="submit" className="start-scan-btn">Start Scan Now</button>
            </div>
          </form>
        </section>
      </main>

      <footer className="start-scan-footer">
        <p>© 2025 AT-AT (API Threat Assessment Tool) • COS301 Capstone Project. All rights reserved.</p>
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
};

export default StartScan;
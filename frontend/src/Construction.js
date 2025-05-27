import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Construction.css';

const Construction = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Add logout logic here (e.g., clear tokens, state, etc.)
    navigate('/login');
  };

  return (
    <div className="construction-container">
      <header className="construction-header">
        <div className="logo">AT-AT</div>
        <nav className="construction-nav">
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

      <main className="construction-main">
        <section className="construction-content">
          <h1>Page Under Construction</h1>
          <p>
            We're working hard to bring this feature to you! Please check back later.
          </p>
          <p>
            Current Date and Time: Tuesday, May 27, 2025, 12:58 PM SAST
          </p>
          <Link to="/dashboard" className="back-btn">Back to Dashboard</Link>
        </section>
      </main>

      <footer className="construction-footer">
        <p>© 2025 AT-AT (API Threat Assessment Tool) • COS301 Capstone Project. All rights reserved.</p>
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
};

export default Construction;
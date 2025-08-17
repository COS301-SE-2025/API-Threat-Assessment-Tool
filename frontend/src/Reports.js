import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from './App';
import { useAuth } from './AuthContext';
import Logo from "./components/Logo";
import './Reports.css';

const Reports = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { currentUser, logout, getUserFullName } = useAuth();
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

  const reportsData = [
    {
      id: 1,
      apiName: 'My E-commerce Site API',
      profile: 'OWASP Top 10 Quick Scan',
      date: 'May 14, 2025, 12:29 PM SAST',
      status: 'Completed',
      score: 'A-',
      link: '/report/1',
      linkText: 'View Report'
    },
    {
      id: 2,
      apiName: 'Client Project API',
      profile: 'Full Comprehensive Scan',
      date: 'May 12, 2025, 10:15 AM SAST',
      status: 'Completed',
      score: 'C+',
      link: '/report/2',
      linkText: 'View Report'
    },
    {
      id: 3,
      apiName: 'Internal User Service',
      profile: 'Authentication & Authorization Focus',
      date: 'May 10, 2025, 9:00 AM SAST',
      status: 'Failed',
      score: 'N/A',
      link: '/details/3',
      linkText: 'View Details'
    },
    {
      id: 4,
      apiName: 'My E-commerce Site API',
      profile: 'Full Comprehensive Scan',
      date: 'May 08, 2025, 2:30 PM SAST',
      status: 'In Progress',
      score: 'N/A',
      link: '/progress/4',
      linkText: 'View Progress'
    },
    {
      id: 5,
      apiName: 'Client Project API',
      profile: 'OWASP Top 10 Quick Scan',
      date: 'May 05, 2025, 11:45 AM SAST',
      status: 'Completed',
      score: 'B',
      link: '/report/5',
      linkText: 'View Report'
    }
  ];

  return (
    <div className="reports-container">
      <header className="reports-header">
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
        <nav className="reports-nav">
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

      <main className="reports-main">
        <section 
          id="reports-header-section" 
          className={`reports-header-section animate-on-scroll ${isVisible['reports-header-section'] ? 'visible' : ''}`}
        >
          <h1>All Scan Reports</h1>
          <Link to="/dashboard" className="back-btn">Back to Dashboard</Link>
        </section>

        <section 
          id="reports-table-section" 
          className={`reports-table-section animate-on-scroll ${isVisible['reports-table-section'] ? 'visible' : ''}`}
        >
          <table className="reports-table">
            <thead>
              <tr>
                <th>API Name</th>
                <th>Profile Used</th>
                <th>Date</th>
                <th>Status</th>
                <th>Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reportsData.map((report, index) => (
                <tr key={report.id} style={{ animationDelay: `${index * 0.1}s` }}>
                  <td>{report.apiName}</td>
                  <td>{report.profile}</td>
                  <td>{report.date}</td>
                  <td>{report.status}</td>
                  <td>{report.score}</td>
                  <td><Link to={report.link}>{report.linkText}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>

      <footer className="reports-footer">
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

export default Reports;
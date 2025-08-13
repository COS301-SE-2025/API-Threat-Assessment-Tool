import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from './App';
import { useAuth } from './AuthContext';
import Logo from "./components/Logo";
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { currentUser, logout, getUserFullName } = useAuth();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState({});

  // State to track selected API and profile
  const [selectedApi, setSelectedApi] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('');
  const [showAllScans, setShowAllScans] = useState(false);

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
          <p>Loading Dashboard...</p>
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

  // Handle navigation to StartScan with selected configurations
  const handleRunScan = () => {
    if (!selectedApi || !selectedProfile) {
      alert('Please select both an API and a testing profile to proceed.');
      return;
    }
    navigate('/start-scan', {
      state: {
        api: selectedApi,
        profile: selectedProfile
      }
    });
  };

  // Extended scan data
  const allScans = [
    {
      id: 1,
      apiName: "My E-commerce Site API",
      apiIcon: "🌐",
      profile: "OWASP Top 10 Quick Scan",
      date: "May 14, 2025",
      status: "completed",
      score: "A-",
      vulnerabilities: 3,
      duration: "12 min"
    },
    {
      id: 2,
      apiName: "Client Project API",
      apiIcon: "💼",
      profile: "Full Comprehensive Scan",
      date: "May 12, 2025",
      status: "completed",
      score: "C+",
      vulnerabilities: 8,
      duration: "24 min"
    },
    {
      id: 3,
      apiName: "Internal User Service",
      apiIcon: "👥",
      profile: "Authentication & Authorization Focus",
      date: "May 10, 2025",
      status: "failed",
      score: "N/A",
      vulnerabilities: 0,
      duration: "5 min"
    },
    {
      id: 4,
      apiName: "My E-commerce Site API",
      apiIcon: "🌐",
      profile: "Full Comprehensive Scan",
      date: "May 08, 2025",
      status: "in-progress",
      score: "N/A",
      vulnerabilities: 0,
      duration: "15 min"
    },
    {
      id: 5,
      apiName: "Payment Gateway API",
      apiIcon: "💳",
      profile: "OWASP Top 10 Quick Scan",
      date: "May 06, 2025",
      status: "completed",
      score: "B+",
      vulnerabilities: 5,
      duration: "18 min"
    },
    {
      id: 6,
      apiName: "Authentication Service",
      apiIcon: "🔐",
      profile: "Authentication & Authorization Focus",
      date: "May 04, 2025",
      status: "completed",
      score: "A",
      vulnerabilities: 1,
      duration: "22 min"
    }
  ];

  const displayedScans = showAllScans ? allScans : allScans.slice(0, 4);

  const weeklyData = [
    { day: 'Mon', scans: 3, vulnerabilities: 2 },
    { day: 'Tue', scans: 5, vulnerabilities: 4 },
    { day: 'Wed', scans: 2, vulnerabilities: 1 },
    { day: 'Thu', scans: 7, vulnerabilities: 8 },
    { day: 'Fri', scans: 4, vulnerabilities: 3 },
    { day: 'Sat', scans: 1, vulnerabilities: 0 },
    { day: 'Sun', scans: 2, vulnerabilities: 1 }
  ];

  const maxScans = Math.max(...weeklyData.map(d => d.scans));
  const maxVulns = Math.max(...weeklyData.map(d => d.vulnerabilities));

  const threatTrends = [
    { type: "SQL Injection", count: 15, trend: "up", severity: "critical" },
    { type: "XSS", count: 12, trend: "down", severity: "high" },
    { type: "Broken Auth", count: 8, trend: "up", severity: "high" },
    { type: "Data Exposure", count: 5, trend: "stable", severity: "medium" }
  ];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
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

        <nav className="dashboard-nav">
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

      <main className="dashboard-main">
        {/* Hero Dashboard Section */}
        <section className="dashboard-hero">
          <div className="dashboard-top">
            <div className="welcome-section">
              <h1>Security Dashboard</h1>
              <p className="dashboard-subtitle">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {currentUser.firstName}! 
                Monitor your API security posture and track vulnerability trends.
              </p>
            </div>
            <div className="hero-actions">
              <Link to="/start-scan" className="start-scan-btn primary">
                🚀 Start New Scan
              </Link>
              <Link to="/reports" className="start-scan-btn secondary">
                📊 View Reports
              </Link>
            </div>
          </div>
        </section>

        {/* Enhanced Stats Section */}
        <section 
          id="stats-section" 
          className={`stats-section animate-on-scroll ${isVisible['stats-section'] ? 'visible' : ''}`}
        >
          <div className="stats-grid">
            <div className="stat-card" style={{animationDelay: '0s'}}>
              <div className="stat-header">
                <div className="stat-icon">🔗</div>
                <div className="stat-trend positive">+1</div>
              </div>
              <h3>Total APIs Managed</h3>
              <p className="stat-number">3</p>
              <p className="stat-change positive">+1 this month</p>
              <div className="stat-progress">
                <div className="progress-bar" style={{width: '75%'}}></div>
              </div>
            </div>
            
            <div className="stat-card" style={{animationDelay: '0.1s'}}>
              <div className="stat-header">
                <div className="stat-icon">📊</div>
                <div className="stat-trend positive">+4</div>
              </div>
              <h3>Scans This Month</h3>
              <p className="stat-number">12</p>
              <p className="stat-change positive">+4 from last month</p>
              <div className="stat-progress">
                <div className="progress-bar" style={{width: '60%'}}></div>
              </div>
            </div>
            
            <div className="stat-card" style={{animationDelay: '0.2s'}}>
              <div className="stat-header">
                <div className="stat-icon">🛡️</div>
                <div className="stat-trend neutral">0</div>
              </div>
              <h3>Avg. Security Score</h3>
              <p className="stat-number green">B+</p>
              <p className="stat-change neutral">Same as last month</p>
              <div className="stat-progress">
                <div className="progress-bar green" style={{width: '82%'}}></div>
              </div>
            </div>
            
            <div className="stat-card" style={{animationDelay: '0.3s'}}>
              <div className="stat-header">
                <div className="stat-icon">⚠️</div>
                <div className="stat-trend negative">+1</div>
              </div>
              <h3>Critical Alerts</h3>
              <p className="stat-number red">2</p>
              <p className="stat-change negative">+1 from last week</p>
              <div className="stat-progress">
                <div className="progress-bar red" style={{width: '25%'}}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Scan Configuration */}
        <section 
          id="scan-config" 
          className={`scan-config animate-on-scroll ${isVisible['scan-config'] ? 'visible' : ''}`}
        >
          <div className="config-header">
            <h2>🔍 Quick Scan Configuration</h2>
            <p>Configure and launch a security scan in seconds</p>
          </div>
          <div className="config-content">
            <div className="config-options">
              <div className="config-item">
                <label htmlFor="api-select">Select API to Assess:</label>
                <select
                  id="api-select"
                  value={selectedApi}
                  onChange={(e) => setSelectedApi(e.target.value)}
                  className="enhanced-select"
                >
                  <option value="">-- Choose an API --</option>
                  <option value="api1">🌐 My E-commerce Site API</option>
                  <option value="api2">💼 Client Project API</option>
                  <option value="api3">👥 Internal User Service</option>
                  <option value="api4">💳 Payment Gateway API</option>
                </select>
              </div>
              <div className="config-item">
                <label htmlFor="profile-select">Select Testing Profile:</label>
                <select
                  id="profile-select"
                  value={selectedProfile}
                  onChange={(e) => setSelectedProfile(e.target.value)}
                  className="enhanced-select"
                >
                  <option value="">-- Choose a Profile --</option>
                  <option value="owasp">⚡ OWASP Top 10 Quick Scan (5-10 min)</option>
                  <option value="full">🔍 Full Comprehensive Scan (20-30 min)</option>
                  <option value="auth">🔐 Authentication & Authorization Focus (15 min)</option>
                </select>
              </div>
            </div>
            <button onClick={handleRunScan} className="run-scan-btn enhanced">
              🚀 Run Scan with Selected Configuration
            </button>
          </div>
        </section>

        {/* Weekly Activity Chart */}
        <section 
          id="activity-chart" 
          className={`activity-chart-section animate-on-scroll ${isVisible['activity-chart'] ? 'visible' : ''}`}
        >
          <h2>📈 Weekly Activity Overview</h2>
          <div className="chart-container">
            <div className="chart-grid">
              {weeklyData.map((day, index) => (
                <div key={day.day} className="chart-bar-container" style={{animationDelay: `${index * 0.1}s`}}>
                  <div className="chart-bars">
                    <div 
                      className="chart-bar scans" 
                      style={{height: `${(day.scans / maxScans) * 100}%`}}
                      title={`${day.scans} scans`}
                    ></div>
                    <div 
                      className="chart-bar vulnerabilities" 
                      style={{height: `${(day.vulnerabilities / maxVulns) * 100}%`}}
                      title={`${day.vulnerabilities} vulnerabilities`}
                    ></div>
                  </div>
                  <span className="chart-label">{day.day}</span>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-color scans"></span>
                <span>Scans Performed</span>
              </div>
              <div className="legend-item">
                <span className="legend-color vulnerabilities"></span>
                <span>Vulnerabilities Found</span>
              </div>
            </div>
          </div>
        </section>

        {/* Threat Trends */}
        <section 
          id="threat-trends" 
          className={`threat-trends-section animate-on-scroll ${isVisible['threat-trends'] ? 'visible' : ''}`}
        >
          <h2>🎯 Top Vulnerability Trends</h2>
          <div className="threats-grid">
            {threatTrends.map((threat, index) => (
              <div key={threat.type} className="threat-card" style={{animationDelay: `${index * 0.1}s`}}>
                <div className="threat-header">
                  <h4>{threat.type}</h4>
                  <span className={`severity-badge ${threat.severity}`}>
                    {threat.severity}
                  </span>
                </div>
                <div className="threat-stats">
                  <span className="threat-count">{threat.count}</span>
                  <span className={`trend-indicator ${threat.trend}`}>
                    {threat.trend === 'up' ? '↗️' : threat.trend === 'down' ? '↘️' : '➡️'}
                    {threat.trend}
                  </span>
                </div>
                <div className="threat-progress">
                  <div 
                    className={`progress-fill ${threat.severity}`} 
                    style={{width: `${(threat.count / 15) * 100}%`}}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Enhanced Recent Activity */}
        <section 
          id="recent-activity" 
          className={`recent-activity animate-on-scroll ${isVisible['recent-activity'] ? 'visible' : ''}`}
        >
          <div className="activity-header">
            <h2>🕐 Recent Scan Activity</h2>
            <Link to="/reports" className="view-all-link">View All Reports →</Link>
          </div>
          <div className="table-container">
            <div className="enhanced-table">
              {displayedScans.map((scan, index) => (
                <div key={scan.id} className="scan-row" style={{animationDelay: `${index * 0.1}s`}}>
                  <div className="scan-info">
                    <div className="api-details">
                      <span className="api-icon">{scan.apiIcon}</span>
                      <div className="api-text">
                        <h4>{scan.apiName}</h4>
                        <p>{scan.profile}</p>
                      </div>
                    </div>
                  </div>
                  <div className="scan-meta">
                    <div className="meta-item">
                      <span className="meta-label">Date</span>
                      <span className="meta-value">{scan.date}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Duration</span>
                      <span className="meta-value">{scan.duration}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Status</span>
                      <span className={`status-badge ${scan.status}`}>
                        {scan.status === 'completed' && '✅'}
                        {scan.status === 'failed' && '❌'}
                        {scan.status === 'in-progress' && '⏳'}
                        {scan.status.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Score</span>
                      <span className={`score-badge ${scan.score === 'N/A' ? 'na' : scan.score.includes('A') ? 'good' : scan.score.includes('B') ? 'average' : 'poor'}`}>
                        {scan.score}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Vulnerabilities</span>
                      <span className="vuln-count">{scan.vulnerabilities}</span>
                    </div>
                  </div>
                  <div className="scan-actions">
                    <Link to={`/report/${scan.id}`} className="action-btn primary">
                      View Report
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <button 
              className="load-more-btn"
              onClick={() => setShowAllScans(!showAllScans)}
            >
              {showAllScans ? 'Show Less' : `Load More Scans (${allScans.length - 4} more)`}
            </button>
          </div>
        </section>

        {/* Enhanced Quick Actions */}
        <section 
          id="quick-actions" 
          className={`quick-actions animate-on-scroll ${isVisible['quick-actions'] ? 'visible' : ''}`}
        >
          <h2>⚡ Quick Actions</h2>
          <div className="actions-grid">
    
            <Link to="/manage-apis" className="action-card">
              <div className="action-icon">🔧</div>
              <div className="action-content">
                <h4>Manage APIs</h4>
                <p>Add, edit, or remove APIs from your collection</p>
                <span className="action-arrow">→</span>
              </div>
            </Link>
            <Link to="/public-templates" className="action-card">
              <div className="action-icon">📋</div>
              <div className="action-content">
                <h4>Scan Templates</h4>
                <p>Browse and customize security testing profiles</p>
                <span className="action-arrow">→</span>
              </div>
            </Link>
            <Link to="/settings" className="action-card">
              <div className="action-icon">⚙️</div>
              <div className="action-content">
                <h4>Account Settings</h4>
                <p>Update your profile and notification preferences</p>
                <span className="action-arrow">→</span>
              </div>
            </Link>
            <Link to="/documentation" className="action-card">
              <div className="action-icon">📖</div>
              <div className="action-content">
                <h4>Documentation</h4>
                <p>Learn about API security best practices</p>
                <span className="action-arrow">→</span>
              </div>
            </Link>


          </div>
        </section>
      </main>

      <footer className="dashboard-footer">
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

export default Dashboard;
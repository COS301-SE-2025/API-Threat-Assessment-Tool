import React, { useContext, useState } from 'react'; // Ensure useState is imported
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from './App';
import { useAuth } from './AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { currentUser, logout, getUserFullName } = useAuth();
  const location = useLocation();

  // State to track selected API and profile
  const [selectedApi, setSelectedApi] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('');

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

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo">AT-AT</div>
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
        <section className="dashboard-top">
          <div className="welcome-section">
            <h1>Dashboard</h1>
            <p className="dashboard-subtitle">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {currentUser.firstName}! Here's your API security overview.
            </p>
          </div>
          <Link to="/start-scan" className="start-scan-btn">
            <span>+</span> Start New Scan
          </Link>
        </section>

        <section className="scan-config">
          <h2>Quick Scan Configuration</h2>
          <div className="config-options">
            <div className="config-item">
              <label htmlFor="api-select">Select API to Assess:</label>
              <select
                id="api-select"
                value={selectedApi}
                onChange={(e) => setSelectedApi(e.target.value)}
              >
                <option value="">-- Choose an API --</option>
                <option value="api1">My E-commerce Site API</option>
                <option value="api2">Client Project API</option>
                <option value="api3">Internal User Service</option>
              </select>
            </div>
            <div className="config-item">
              <label htmlFor="profile-select">Select Testing Profile:</label>
              <select
                id="profile-select"
                value={selectedProfile}
                onChange={(e) => setSelectedProfile(e.target.value)}
              >
                <option value="">-- Choose a Profile --</option>
                <option value="owasp">OWASP Top 10 Quick Scan</option>
                <option value="full">Full Comprehensive Scan</option>
                <option value="auth">Authentication & Authorization Focus</option>
              </select>
            </div>
            <button onClick={handleRunScan} className="run-scan-btn">
              Run Scan with Selected Configuration
            </button>
          </div>
        </section>

        <section className="stats">
          <div className="stat-card">
            <div className="stat-icon">🔗</div>
            <h3>Total APIs Managed</h3>
            <p className="stat-number">3</p>
            <p className="stat-change positive">+1 this month</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <h3>Scans This Month</h3>
            <p className="stat-number">12</p>
            <p className="stat-change positive">+4 from last month</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🛡️</div>
            <h3>Avg. Security Score</h3>
            <p className="stat-number green">B+</p>
            <p className="stat-change neutral">Same as last month</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚠️</div>
            <h3>Critical Alerts</h3>
            <p className="stat-number red">2</p>
            <p className="stat-change negative">+1 from last week</p>
          </div>
        </section>

        <section className="recent-activity">
          <div className="activity-header">
            <h2>Recent Scan Activity</h2>
            <Link to="/reports" className="view-all-link">View All Reports →</Link>
          </div>
          <div className="table-container">
            <table className="activity-table">
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
                <tr>
                  <td>
                    <div className="api-name">
                      <span className="api-icon">🌐</span>
                      My E-commerce Site API
                    </div>
                  </td>
                  <td>OWASP Top 10 Quick Scan</td>
                  <td>May 14, 2025</td>
                  <td><span className="status completed">Completed</span></td>
                  <td><span className="score good">A-</span></td>
                  <td><Link to="/report/1" className="action-link">View Report</Link></td>
                </tr>
                <tr>
                  <td>
                    <div className="api-name">
                      <span className="api-icon">💼</span>
                      Client Project API
                    </div>
                  </td>
                  <td>Full Comprehensive Scan</td>
                  <td>May 12, 2025</td>
                  <td><span className="status completed">Completed</span></td>
                  <td><span className="score average">C+</span></td>
                  <td><Link to="/report/2" className="action-link">View Report</Link></td>
                </tr>
                <tr>
                  <td>
                    <div className="api-name">
                      <span className="api-icon">👥</span>
                      Internal User Service
                    </div>
                  </td>
                  <td>Authentication & Authorization Focus</td>
                  <td>May 10, 2025</td>
                  <td><span className="status failed">Failed</span></td>
                  <td><span className="score na">N/A</span></td>
                  <td><Link to="/details/3" className="action-link">View Details</Link></td>
                </tr>
                <tr>
                  <td>
                    <div className="api-name">
                      <span className="api-icon">🌐</span>
                      My E-commerce Site API
                    </div>
                  </td>
                  <td>Full Comprehensive Scan</td>
                  <td>May 08, 2025</td>
                  <td><span className="status in-progress">In Progress</span></td>
                  <td><span className="score na">N/A</span></td>
                  <td><Link to="/progress/4" className="action-link">View Progress</Link></td>
                </tr>
              </tbody>
            </table>
          </div>
<<<<<<< HEAD
=======
          <table className="activity-table">
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
              <tr>
                <td>My E-commerce Site API</td>
                <td>OWASP Top 10 Quick Scan</td>
                <td>May 14, 2025</td>
                <td>Completed</td>
                <td>A-</td>
                <td><Link to="/Report1">View Report</Link></td>
              </tr>
              <tr>
                <td>Client Project API</td>
                <td>Full Comprehensive Scan</td>
                <td>May 12, 2025</td>
                <td>Completed</td>
                <td>C+</td>
                <td><Link to="/Report2">View Report</Link></td>
              </tr>
              <tr>
                <td>Internal User Service</td>
                <td>Authentication & Authorization Focus</td>
                <td>May 10, 2025</td>
                <td>Failed</td>
                <td>N/A</td>
                <td><Link to="/details/3">View Details</Link></td>
              </tr>
              <tr>
                <td>My E-commerce Site API</td>
                <td>Full Comprehensive Scan</td>
                <td>May 08, 2025</td>
                <td>In Progress</td>
                <td>N/A</td>
                <td><Link to="/progress/4">View Progress</Link></td>
              </tr>
            </tbody>
          </table>
>>>>>>> origin/dev
          <button className="load-more-btn">Load More Scans</button>
        </section>

        <section className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <div className="action-card">
              <span className="action-icon">🔧</span>
              <div className="action-content">
                <h4><Link to="/manage-apis" className="action-link">Manage APIs</Link></h4>
                <p className="action-desc">Add, edit, or remove APIs from your collection</p>
              </div>
            </div>
            <div className="action-card">
              <span className="action-icon">📋</span>
              <div className="action-content">
                <h4><Link to="/public-templates" className="action-link">Manage Templates</Link></h4>
                <p className="action-desc">Create, edit, or share scan templates</p>
              </div>
            </div>
            <div className="action-card">
              <span className="action-icon">⚙️</span>
              <div className="action-content">
                <h4><Link to="/settings" className="action-link">Account Settings</Link></h4>
                <p className="action-desc">Update your profile and preferences</p>
              </div>
            </div>
            <div className="action-card">
              <span className="action-icon">📖</span>
              <div className="action-content">
                <h4><Link to="/documentation" className="action-link">Documentation</Link></h4>
                <p className="action-desc">Help and comprehensive how-to guides</p>
              </div>
            </div>
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
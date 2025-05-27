import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Add logout logic here (e.g., clear tokens, state, etc.)
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo">AT-AT</div>
        <nav className="dashboard-nav">
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

      <main className="dashboard-main">
        <section className="dashboard-top">
          <h1>Dashboard</h1>
          <button className="start-scan-btn">+ Start New Scan</button>
        </section>

        <section className="scan-config">
          <h2>Scan Configuration</h2>
          <div className="config-options">
            <div className="config-item">
              <label>Select API to Assess:</label>
              <select>
                <option value="">-- Choose an API --</option>
                <option value="api1">My E-commerce Site API</option>
                <option value="api2">Client Project API</option>
                <option value="api3">Internal User Service</option>
              </select>
            </div>
            <div className="config-item">
              <label>Select Testing Profile:</label>
              <select>
                <option value="">-- Choose a Profile --</option>
                <option value="owasp">OWASP Top 10 Quick Scan</option>
                <option value="full">Full Comprehensive Scan</option>
                <option value="auth">Authentication & Authorization Focus</option>
              </select>
            </div>
            <button className="run-scan-btn">Run Scan with Selected Configuration</button>
          </div>
        </section>

        <section className="stats">
          <div className="stat-card">
            <h3>Total APIs Managed</h3>
            <p className="stat-number">3</p>
          </div>
          <div className="stat-card">
            <h3>Scans This Month</h3>
            <p className="stat-number">12</p>
          </div>
          <div className="stat-card">
            <h3>Avg. Security Score</h3>
            <p className="stat-number green">B+</p>
          </div>
          <div className="stat-card">
            <h3>Critical Alerts</h3>
            <p className="stat-number red">2</p>
          </div>
        </section>

        <section className="recent-activity">
          <div className="activity-header">
            <h2>Recent Scan Activity</h2>
            <Link to="/reports">View All Reports</Link>
          </div>
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
          <button className="load-more-btn">Load More Scans</button>
        </section>

        <section className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <div className="action-card">
              <span className="action-icon">+</span>
              <p><Link to="/manage-apis" className="action-link">Manage APIs</Link></p>
              <p className="action-desc">Add, edit, or remove APIs</p>
            </div>
            <div className="action-card">
              <span className="action-icon">📋</span>
              <p>Manage Templates</p>
              <p className="action-desc">Create, edit, or share scan templates</p>
            </div>
            <div className="action-card">
              <span className="action-icon">⚙️</span>
              <p><Link to="/settings" className="action-link">Account Settings</Link></p>
              <p className="action-desc">Update your profile and preferences</p>
            </div>
            <div className="action-card">
              <span className="action-icon">📖</span>
              <p>Documentation</p>
              <p className="action-desc">Help and how-to guides</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="dashboard-footer">
        <p>© 2025 AT-AT (API Threat Assessment Tool) • COS301 Capstone Project. All rights reserved.</p>
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
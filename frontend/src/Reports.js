import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Reports.css';

const Reports = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Add logout logic here (e.g., clear tokens, state, etc.)
    navigate('/login');
  };

  return (
    <div className="reports-container">
      <header className="reports-header">
        <div className="logo">AT-AT</div>
        <nav className="reports-nav">
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

      <main className="reports-main">
        <section className="reports-header-section">
          <h1>All Scan Reports</h1>
          <Link to="/dashboard" className="back-btn">Back to Dashboard</Link>
        </section>

        <section className="reports-table-section">
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
              <tr>
                <td>My E-commerce Site API</td>
                <td>OWASP Top 10 Quick Scan</td>
                <td>May 14, 2025, 12:29 PM SAST</td>
                <td>Completed</td>
                <td>A-</td>
                <td><Link to="/report/1">View Report</Link></td>
              </tr>
              <tr>
                <td>Client Project API</td>
                <td>Full Comprehensive Scan</td>
                <td>May 12, 2025, 10:15 AM SAST</td>
                <td>Completed</td>
                <td>C+</td>
                <td><Link to="/report/2">View Report</Link></td>
              </tr>
              <tr>
                <td>Internal User Service</td>
                <td>Authentication & Authorization Focus</td>
                <td>May 10, 2025, 9:00 AM SAST</td>
                <td>Failed</td>
                <td>N/A</td>
                <td><Link to="/details/3">View Details</Link></td>
              </tr>
              <tr>
                <td>My E-commerce Site API</td>
                <td>Full Comprehensive Scan</td>
                <td>May 08, 2025, 2:30 PM SAST</td>
                <td>In Progress</td>
                <td>N/A</td>
                <td><Link to="/progress/4">View Progress</Link></td>
              </tr>
              <tr>
                <td>Client Project API</td>
                <td>OWASP Top 10 Quick Scan</td>
                <td>May 05, 2025, 11:45 AM SAST</td>
                <td>Completed</td>
                <td>B</td>
                <td><Link to="/report/5">View Report</Link></td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>

      <footer className="reports-footer">
        <p>© 2025 AT-AT (API Threat Assessment Tool) • COS301 Capstone Project. All rights reserved.</p>
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
};

export default Reports;
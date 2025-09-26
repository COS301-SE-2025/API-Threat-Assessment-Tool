import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from './App';
import { useAuth } from './AuthContext';
import Logo from "./components/Logo";
import './Dashboard.css';

// Added the apiService object with the required function
const apiService = {
  async fetchUserApis(userId) {
    if (!userId) throw new Error("User ID is required.");
    const res = await fetch(`/api/apis?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch APIs.');
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch APIs.');
    return data.data.apis || [];
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { currentUser, logout, getUserFullName } = useAuth();
  const location = useLocation();

  const [dashboardData, setDashboardData] = useState(null);
  const [userApis, setUserApis] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedApi, setSelectedApi] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('OWASP_API_10');

  const fetchDashboardData = useCallback(async () => {
    if (!currentUser?.id) return;
    console.log(currentUser)
    setIsLoading(true);
    setError('');
    try {
      const overviewPromise = fetch(`/api/dashboard/overview?user_id=${currentUser.id}`).then(res => res.json());

      const apisPromise = apiService.fetchUserApis(currentUser.id);

      const [overviewRes, apis] = await Promise.all([overviewPromise, apisPromise]);

      if (!overviewRes.success) throw new Error(overviewRes.message || 'Failed to load dashboard data');
      
      setDashboardData(overviewRes.data);
      setUserApis(apis);

    } catch (err) {
      setError(err.message);
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login', { replace: true });
    }
  };

  const handleRunScan = () => {
    if (!selectedApi || !selectedProfile) {
      alert('Please select both an API and a testing profile.');
      return;
    }
    // Navigate to ManageAPIs page and pass state to open the scan modal
    navigate('/manage-apis', {
      state: {
        startScanForApi: selectedApi,
        scanProfile: selectedProfile
      }
    });
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }
  
  const userFullName = getUserFullName() || 'User';
  
  const stats = {
    totalApis: dashboardData?.total_apis || 0,
    scansThisMonth: dashboardData?.total_scans || 0, // This is total scans, can be refined
    totalVulnerabilities: dashboardData?.total_vulnerabilities || 0,
    criticalAlerts: dashboardData?.critical_vulnerabilities || 0,
  };

  const weeklyData = dashboardData?.scan_activity_weekly || [];
  const maxScans = Math.max(...weeklyData.map(d => d.scans), 1); // Avoid division by zero
  const maxVulns = Math.max(...weeklyData.map(d => d.vulnerabilities), 1);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Logo />
        </div>
        <nav className="dashboard-nav">
          <Link to="/home" className={location.pathname === '/home' ? 'active' : ''}>Home</Link>
          <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>Dashboard</Link>
          <Link to="/manage-apis" className={location.pathname === '/manage-apis' ? 'active' : ''}>API Management</Link>
          <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>Settings</Link>
        </nav>
        <div className="user-info">
          <div className="user-profile">
            <span className="user-avatar">{currentUser.firstName?.charAt(0)?.toUpperCase() || 'U'}</span>
            <div className="user-details"><span className="user-greeting">Welcome back,</span><span className="user-name">{userFullName}</span></div>
          </div>
          <button onClick={handleLogout} className="logout-btn" title="Logout">Logout</button>
          <button onClick={toggleDarkMode} className="theme-toggle-btn" title="Toggle Theme">{darkMode ? '☀️' : '🌙'}</button>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="dashboard-hero">
          <div className="welcome-section">
            <h1>Security Dashboard</h1>
            <p className="dashboard-subtitle">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {currentUser.firstName}! 
              Here's an overview of your API security posture.
            </p>
          </div>
        </section>

        {error && <div className="error-banner">Could not load dashboard data: {error}</div>}

        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-header"><div className="stat-icon">🔗</div></div><h3>Total APIs Managed</h3><p className="stat-number">{stats.totalApis}</p></div>
            <div className="stat-card"><div className="stat-header"><div className="stat-icon">📊</div></div><h3>Total Scans</h3><p className="stat-number">{stats.scansThisMonth}</p></div>
            <div className="stat-card"><div className="stat-header"><div className="stat-icon">🛡️</div></div><h3>Vulnerabilities</h3><p className="stat-number green">{stats.totalVulnerabilities}</p></div>
            <div className="stat-card"><div className="stat-header"><div className="stat-icon">⚠️</div></div><h3>Critical Alerts</h3><p className="stat-number red">{stats.criticalAlerts}</p></div>
          </div>
        </section>

        <div className="dashboard-grid">
            <section className="activity-chart-section">
              <h2>📈 Weekly Activity</h2>
              <div className="chart-container">
                <div className="chart-grid">
                  {weeklyData.map((day, index) => (
                    <div key={day.day} className="chart-bar-container" style={{animationDelay: `${index * 0.1}s`}}>
                      <div className="chart-bars">
                        <div className="chart-bar scans" style={{height: `${(day.scans / maxScans) * 100}%`}} title={`${day.scans} scans`}></div>
                        <div className="chart-bar vulnerabilities" style={{height: `${(day.vulnerabilities / maxVulns) * 100}%`}} title={`${day.vulnerabilities} vulnerabilities`}></div>
                      </div>
                      <span className="chart-label">{day.day}</span>
                    </div>
                  ))}
                </div>
                <div className="chart-legend">
                  <div className="legend-item"><span className="legend-color scans"></span><span>Scans</span></div>
                  <div className="legend-item"><span className="legend-color vulnerabilities"></span><span>Vulnerabilities</span></div>
                </div>
              </div>
            </section>
            
            <section className="threat-trends-section">
                <h2>🎯 Top Vulnerability Types</h2>
                <div className="threats-list-container">
                    {dashboardData?.top_vuln_types?.length > 0 ? dashboardData.top_vuln_types.map(threat => (
                        <div key={threat.type} className="threat-item">
                            <span className="threat-name">{threat.type}</span>
                            <span className="threat-count">{threat.count} found</span>
                        </div>
                    )) : <p className="no-data-message">No vulnerabilities recorded yet.</p>}
                </div>
            </section>
        </div>

        <section className="recent-activity">
          <div className="activity-header"><h2>🕐 Recent Scan Activity</h2><Link to="/manage-apis" className="view-all-link">View All →</Link></div>
          <div className="table-container">
            {dashboardData?.recent_scans?.length > 0 ? (
              <div className="enhanced-table">
                {dashboardData.recent_scans.map(scan => (
                  <div key={scan.id} className="scan-row">
                    <div className="scan-info">
                      <div className="api-details"><span className="api-icon">🌐</span><div className="api-text"><h4>{scan.apiName}</h4><p>{new Date(scan.date).toLocaleString()}</p></div></div>
                    </div>
                    <div className="scan-meta">
                      <div className="meta-item"><span className="meta-label">Status</span><span className={`status-badge ${scan.status}`}>{scan.status}</span></div>
                      <div className="meta-item"><span className="meta-label">Vulnerabilities</span><span className="vuln-count">{scan.vulnerabilities}</span></div>
                    </div>
                    <div className="scan-actions"><Link to={`/report/${scan.id}`} className="action-btn primary">View Report</Link></div>
                  </div>
                ))}
              </div>
            ) : <p className="no-data-message">No recent scan activity. Run a scan to get started!</p>}
          </div>
        </section>
      </main>

      <footer className="dashboard-footer">
        <p>© 2025 AT-AT (API Threat Assessment Tool) • COS301 Capstone Project. All rights reserved.</p>
        <div className="footer-links"><a href="#">Privacy Policy</a><a href="#">Terms of Service</a><a href="#">Help Center</a></div>
      </footer>
    </div>
  );
};

export default Dashboard;
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Add useLocation for active nav
import { ThemeContext } from './App';
import { useAuth } from './AuthContext'; // Import useAuth
import { mockApi } from './mockData';
import './PublicTemplates.css';

const PublicTemplates = () => {
  const navigate = useNavigate();
  const location = useLocation(); // For active nav link highlighting
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { currentUser, logout, getUserFullName } = useAuth(); // Add useAuth for user info

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const templatesPerPage = 4;

  useEffect(() => {
    mockApi.getTemplates().then(data => {
      setTemplates(data);
      setLoading(false);
    });
  }, []);

  const handleLogout = () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      logout();
      navigate('/login', { replace: true });
    }
  };

  const handleUseTemplate = (template) => {
    setLoading(true);
    mockApi.useTemplate(template.id).then(response => {
      if (response.success) {
        setMessage(response.message);
        setTemplates(templates.map(t => 
          t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t
        ));
      } else {
        setMessage('Error: ' + response.message);
      }
      setTimeout(() => setMessage(''), 3000);
      setLoading(false);
    });
  };

  const handleViewDetails = (template) => {
    setSelectedTemplate(template);
  };

  const handleCloseModal = () => {
    setSelectedTemplate(null);
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'popular' && template.usageCount > 50) ||
                         (filter === 'recent' && new Date(template.dateAdded) > new Date('2025-04-01'));
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredTemplates.length / templatesPerPage);
  const startIndex = (currentPage - 1) * templatesPerPage;
  const currentTemplates = filteredTemplates.slice(startIndex, startIndex + templatesPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add loading state for user authentication
  if (!currentUser || loading) {
    return (
      <div className="public-templates-container">
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
            <p>{!currentUser ? 'Loading User...' : 'Loading Templates...'}</p>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>
      </div>
    );
  }

  // Get user full name
  const userFullName = getUserFullName() || (currentUser.firstName ? `${currentUser.firstName} Doe` : 'User');

  return (
    <div className="public-templates-container">
      <header className="public-templates-header">
        <div className="logo">AT-AT</div>
        <nav className="public-templates-nav">
          <Link to="/home" className={location.pathname === '/home' ? 'active' : ''}>Home</Link>
          <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>Dashboard</Link>
          <Link to="/public-templates" className={location.pathname === '/public-templates' ? 'active' : ''}>Public Templates</Link>
          <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>Settings</Link>
        </nav>
        <div className="user-info">
          <div className="user-profile">
            <span className="user-avatar">
              {currentUser.firstName?.charAt(0)?.toUpperCase() || 'U'} {/* Display first initial */}
            </span>
            <div className="user-details">
              <span className="user-greeting">Welcome back,</span>
              <span className="user-name">{userFullName}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
          <button onClick={toggleDarkMode} className="theme-toggle-btn">
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="public-templates-main">
        <section className="public-templates-top">
          <h1>Public Templates</h1>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </section>

        <div className="filter-controls">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === 'popular' ? 'active' : ''}`}
            onClick={() => setFilter('popular')}
          >
            Popular
          </button>
          <button
            className={`filter-btn ${filter === 'recent' ? 'active' : ''}`}
            onClick={() => setFilter('recent')}
          >
            Recent
          </button>
        </div>

        <div className="templates-grid">
          {currentTemplates.length > 0 ? (
            currentTemplates.map((template) => (
              <div key={template.id} className="template-card">
                <div className="template-image">Preview</div>
                <div className="template-content">
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                  <div className="template-meta">
                    <span>By: {template.author}</span>
                    <span>Added: {template.dateAdded}</span>
                  </div>
                  <div className="template-actions">
                    <button
                      className="use-template-btn"
                      onClick={() => handleUseTemplate(template)}
                      disabled={loading}
                    >
                      {loading ? 'Applying...' : 'Use Template'}
                    </button>
                    <button
                      className="view-details-btn"
                      onClick={() => handleViewDetails(template)}
                      disabled={loading}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-templates-message">
              No templates found matching your criteria.
            </div>
          )}
        </div>

        {message && (
          <div style={{
            textAlign: 'center',
            marginTop: '10px',
            color: message.includes('Error') ? '#dc3545' : '#28a745'
          }}>
            {message}
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
              <button
                key={page}
                className={currentPage === page ? 'active' : ''}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
            {currentPage < totalPages && (
              <button onClick={() => handlePageChange(currentPage + 1)}>Next</button>
            )}
            {currentPage > 1 && (
              <button onClick={() => handlePageChange(currentPage - 1)}>Previous</button>
            )}
          </div>
        )}
      </main>

      {selectedTemplate && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{selectedTemplate.name} Details</h2>
              <button onClick={handleCloseModal} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <p><strong>Description:</strong> {selectedTemplate.description}</p>
              <p><strong>Author:</strong> {selectedTemplate.author}</p>
              <p><strong>Added:</strong> {selectedTemplate.dateAdded}</p>
              <p><strong>Usage Count:</strong> {selectedTemplate.usageCount}</p>
              <p><strong>Features:</strong> Vulnerability scanning, OWASP compliance, detailed reporting</p>
            </div>
            <div className="modal-actions">
              <button onClick={handleCloseModal} className="cancel-btn">Close</button>
            </div>
          </div>
        </div>
      )}

      <footer className="public-templates-footer">
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

export default PublicTemplates;
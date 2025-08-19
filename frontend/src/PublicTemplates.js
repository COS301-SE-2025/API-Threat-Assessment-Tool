import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from './App';
import { useAuth } from './AuthContext';
import { mockApi } from './mockData';
import Logo from "./components/Logo";
import './PublicTemplates.css';

const PublicTemplates = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { currentUser, logout, getUserFullName } = useAuth();
  const [isVisible, setIsVisible] = useState({});

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const templatesPerPage = 6; // Increased from 4 to 6

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

  useEffect(() => {
    // Fallback template data in case mockApi is not available
    const fallbackTemplates = [
      {
        id: 1,
        name: "OWASP Top 10 Quick Scan",
        description: "A quick scan based on the OWASP Top 10 vulnerabilities.",
        author: "OWASP Community",
        dateAdded: "2025-05-01",
        usageCount: 1250
      },
      {
        id: 2,
        name: "Full Comprehensive Scan",
        description: "A thorough scan covering all API security aspects.",
        author: "AT-AT Team",
        dateAdded: "2025-04-15",
        usageCount: 850
      },
      {
        id: 3,
        name: "Authentication & Authorization Focus",
        description: "Specialized scan for auth and access control issues.",
        author: "Security Experts",
        dateAdded: "2025-03-20",
        usageCount: 630
      },
      {
        id: 4,
        name: "SQL Injection Detection",
        description: "Focused testing for SQL injection vulnerabilities.",
        author: "Database Security Team",
        dateAdded: "2025-04-28",
        usageCount: 920
      },
      {
        id: 5,
        name: "XSS & Input Validation",
        description: "Cross-site scripting and input validation testing.",
        author: "Web Security Guild",
        dateAdded: "2025-04-10",
        usageCount: 740
      },
      {
        id: 6,
        name: "API Rate Limiting Test",
        description: "Test API rate limiting and throttling mechanisms.",
        author: "Performance Team",
        dateAdded: "2025-04-22",
        usageCount: 560
      },
      {
        id: 7,
        name: "Data Exposure Scanner",
        description: "Detect sensitive data exposure and information leakage.",
        author: "Privacy Experts",
        dateAdded: "2025-04-05",
        usageCount: 480
      },
      {
        id: 8,
        name: "Business Logic Flaws",
        description: "Identify business logic vulnerabilities and flaws.",
        author: "Logic Security Team",
        dateAdded: "2025-03-15",
        usageCount: 390
      }
    ];

    // Try to get templates from mockApi, fallback to hardcoded data
    if (typeof mockApi !== 'undefined' && mockApi.getTemplates) {
      mockApi.getTemplates()
        .then(data => {
          console.log('Templates loaded from mockApi:', data);
          setTemplates(data && data.length > 0 ? data : fallbackTemplates);
          setLoading(false);
        })
        .catch(error => {
          console.warn('Failed to load templates from mockApi, using fallback data:', error);
          setTemplates(fallbackTemplates);
          setLoading(false);
        });
    } else {
      console.warn('mockApi not available, using fallback template data');
      console.log('Loading fallback templates:', fallbackTemplates);
      setTemplates(fallbackTemplates);
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      logout();
      navigate('/login', { replace: true });
    }
  };

  const handleUseTemplate = (template) => {
    // Mock the template usage functionality since mockApi might not be available
    setMessage(`✅ Template "${template.name}" applied successfully!`);
    setTemplates(templates.map(t => 
      t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t
    ));
    setTimeout(() => setMessage(''), 4000);
    
    // Try to use mockApi if available, but don't block the UI
    if (typeof mockApi !== 'undefined' && mockApi.useTemplate) {
      mockApi.useTemplate(template.id).catch(error => {
        console.warn('mockApi.useTemplate failed:', error);
      });
    }
  };

  const handleViewDetails = (template) => {
    setSelectedTemplate(template);
  };

  const handleCloseModal = () => {
    setSelectedTemplate(null);
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.author.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = false;
    
    switch(filter) {
      case 'all':
        matchesFilter = true;
        break;
      case 'popular':
        matchesFilter = template.usageCount > 500;
        break;
      case 'recent':
        matchesFilter = new Date(template.dateAdded) > new Date('2025-04-01');
        break;
      case 'security':
        matchesFilter = template.name.toLowerCase().includes('security') || 
                       template.name.toLowerCase().includes('owasp') ||
                       template.name.toLowerCase().includes('injection') ||
                       template.name.toLowerCase().includes('xss') ||
                       template.name.toLowerCase().includes('auth') ||
                       template.description.toLowerCase().includes('security') ||
                       template.description.toLowerCase().includes('vulnerabilit');
        break;
      case 'performance':
        matchesFilter = template.name.toLowerCase().includes('performance') ||
                       template.name.toLowerCase().includes('rate') ||
                       template.name.toLowerCase().includes('limiting') ||
                       template.description.toLowerCase().includes('performance') ||
                       template.description.toLowerCase().includes('throttling');
        break;
      default:
        matchesFilter = true;
    }
    
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredTemplates.length / templatesPerPage);
  const startIndex = (currentPage - 1) * templatesPerPage;
  const currentTemplates = filteredTemplates.slice(startIndex, startIndex + templatesPerPage);

  // Debug logging
  console.log('Templates state:', {
    allTemplates: templates.length,
    filteredTemplates: filteredTemplates.length,
    currentTemplates: currentTemplates.length,
    currentFilter: filter,
    searchTerm: searchTerm,
    loading: loading
  });

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Template statistics
  const templateStats = {
    total: templates.length,
    popular: templates.filter(t => t.usageCount > 50).length,
    recent: templates.filter(t => new Date(t.dateAdded) > new Date('2025-04-01')).length,
    totalUsage: templates.reduce((sum, t) => sum + t.usageCount, 0)
  };

  // Categories for enhanced filtering
  const categories = [
    { id: 'all', name: 'All Templates', icon: '📋', count: templateStats.total },
    { id: 'popular', name: 'Popular', icon: '🔥', count: templateStats.popular },
    { id: 'recent', name: 'Recent', icon: '🆕', count: templateStats.recent },
    { id: 'security', name: 'Security Focus', icon: '🛡️', count: Math.floor(templateStats.total * 0.6) },
    { id: 'performance', name: 'Performance', icon: '⚡', count: Math.floor(templateStats.total * 0.3) }
  ];

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

  const userFullName = getUserFullName() || (currentUser.firstName ? `${currentUser.firstName} Doe` : 'User');

  return (
    <div className="public-templates-container">
      <header className="public-templates-header">
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
        <nav className="public-templates-nav">
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
          <button onClick={handleLogout} className="logout-btn">Logout</button>
          <button onClick={toggleDarkMode} className="theme-toggle-btn">
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="public-templates-main">
        {/* Hero Section */}
        <section className="templates-hero">
          <div className="hero-content">
            <h1 className="hero-title">
              Discover Security 
              <span className="gradient-text"> Templates</span>
            </h1>
            <p className="hero-description">
              Choose from our curated collection of API security testing templates, 
              created by security experts and the community.
            </p>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">{templateStats.total}</span>
                <span className="stat-label">Templates Available</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{templateStats.totalUsage.toLocaleString()}</span>
                <span className="stat-label">Total Uses</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{templateStats.recent}</span>
                <span className="stat-label">New This Month</span>
              </div>
            </div>
          </div>
        </section>

        {/* Search and Filter Section */}
        <section 
          id="search-section" 
          className={`search-filter-section animate-on-scroll ${isVisible['search-section'] ? 'visible' : ''}`}
        >
          <div className="search-container">
            <div className="search-bar-enhanced">
              <div className="search-icon">🔍</div>
              <input
                type="text"
                placeholder="Search templates by name, description, or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input-enhanced"
              />
              {searchTerm && (
                <button 
                  className="clear-search"
                  onClick={() => setSearchTerm('')}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="filter-tabs">
            {categories.map((category, index) => (
              <button
                key={category.id}
                className={`filter-tab ${filter === category.id ? 'active' : ''}`}
                onClick={() => setFilter(category.id)}
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <span className="tab-icon">{category.icon}</span>
                <span className="tab-text">{category.name}</span>
                <span className="tab-count">{category.count}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Results Summary */}
        <section 
          id="results-section" 
          className={`results-summary animate-on-scroll ${isVisible['results-section'] ? 'visible' : ''}`}
        >
          <div className="results-header">
            <h2>
              {filteredTemplates.length > 0 
                ? `${filteredTemplates.length} template${filteredTemplates.length !== 1 ? 's' : ''} found`
                : 'No templates found'
              }
            </h2>
            {searchTerm && (
              <p className="search-context">
                Showing results for "<strong>{searchTerm}</strong>"
              </p>
            )}
          </div>
        </section>

        {/* Templates Grid */}
        <section 
          id="templates-grid" 
          className={`templates-section animate-on-scroll ${isVisible['templates-grid'] ? 'visible' : ''}`}
        >
          <div className="templates-grid">
            {currentTemplates.length > 0 ? (
              currentTemplates.map((template, index) => (
                <div 
                  key={template.id} 
                  className="template-card"
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <div className="template-header">
                    <div className="template-icon">
                      {template.name.includes('OWASP') ? '🛡️' : 
                       template.name.includes('Performance') ? '⚡' : 
                       template.name.includes('Auth') ? '🔐' : '📋'}
                    </div>
                    <div className="template-badge">
                      {template.usageCount > 100 ? '🔥 Popular' : 
                       new Date(template.dateAdded) > new Date('2025-04-01') ? '🆕 New' : ''}
                    </div>
                  </div>
                  <div className="template-content">
                    <h3>{template.name}</h3>
                    <p>{template.description}</p>
                    <div className="template-features">
                      <span className="feature-tag">Security</span>
                      <span className="feature-tag">OWASP</span>
                      <span className="feature-tag">Automated</span>
                    </div>
                    <div className="template-meta">
                      <div className="meta-item">
                        <span className="meta-icon">👤</span>
                        <span>{template.author}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-icon">📅</span>
                        <span>{template.dateAdded}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-icon">📊</span>
                        <span>{template.usageCount} uses</span>
                      </div>
                    </div>
                  </div>
                  <div className="template-actions">
                    <button
                      className="use-template-btn"
                      onClick={() => handleUseTemplate(template)}
                    >
                      🚀 Use Template
                    </button>
                    <button
                      className="view-details-btn"
                      onClick={() => handleViewDetails(template)}
                    >
                      👁️ View Details
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-templates-message">
                <div className="empty-state">
                  <div className="empty-icon">🔍</div>
                  <h3>No templates found</h3>
                  <p>Try adjusting your search criteria or browse all templates.</p>
                  <button 
                    className="reset-filters-btn"
                    onClick={() => {
                      setSearchTerm('');
                      setFilter('all');
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {message && (
            <div className="success-message">
              {message}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination-enhanced">
              <button 
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ← Previous
              </button>
              
              <div className="page-numbers">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
                  <button
                    key={page}
                    className={`page-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button 
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Enhanced Modal */}
      {selectedTemplate && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <h2>{selectedTemplate.name}</h2>
                <div className="modal-badge">
                  {selectedTemplate.usageCount > 100 ? '🔥 Popular' : 
                   new Date(selectedTemplate.dateAdded) > new Date('2025-04-01') ? '🆕 New' : '📋 Template'}
                </div>
              </div>
              <button onClick={handleCloseModal} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="modal-section">
                <h4>📝 Description</h4>
                <p>{selectedTemplate.description}</p>
              </div>
              
              <div className="modal-grid">
                <div className="modal-info-item">
                  <span className="info-label">👤 Author</span>
                  <span className="info-value">{selectedTemplate.author}</span>
                </div>
                <div className="modal-info-item">
                  <span className="info-label">📅 Added</span>
                  <span className="info-value">{selectedTemplate.dateAdded}</span>
                </div>
                <div className="modal-info-item">
                  <span className="info-label">📊 Usage Count</span>
                  <span className="info-value">{selectedTemplate.usageCount}</span>
                </div>
                <div className="modal-info-item">
                  <span className="info-label">⏱️ Est. Runtime</span>
                  <span className="info-value">15-20 minutes</span>
                </div>
              </div>

              <div className="modal-section">
                <h4>✨ Features</h4>
                <div className="features-list">
                  <div className="feature-item">🔍 Vulnerability scanning</div>
                  <div className="feature-item">🛡️ OWASP compliance testing</div>
                  <div className="feature-item">📊 Detailed security reporting</div>
                  <div className="feature-item">🤖 Automated test execution</div>
                  <div className="feature-item">📈 Risk assessment</div>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="modal-use-btn"
                onClick={() => {
                  handleUseTemplate(selectedTemplate);
                  handleCloseModal();
                }}
              >
                🚀 Use This Template
              </button>
              <button onClick={handleCloseModal} className="modal-close-btn">
                Close
              </button>
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
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './PublicTemplates.css';

const PublicTemplates = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    navigate('/login');
  };

  const templates = [
    {
      id: 1,
      name: 'OWASP Top 10 Quick Scan',
      description: 'Comprehensive scan for OWASP Top 10 vulnerabilities',
      category: 'security',
      downloads: 1245,
      rating: 4.8,
      author: 'Security Team'
    },
    {
      id: 2,
      name: 'REST API Full Assessment',
      description: 'Complete assessment for REST API endpoints',
      category: 'rest',
      downloads: 892,
      rating: 4.6,
      author: 'API Experts'
    },
    {
      id: 3,
      name: 'Authentication Test Suite',
      description: 'Focuses on authentication and authorization vulnerabilities',
      category: 'auth',
      downloads: 756,
      rating: 4.5,
      author: 'Auth Specialists'
    },
    {
      id: 4,
      name: 'GraphQL Security Scan',
      description: 'Specialized scan for GraphQL API vulnerabilities',
      category: 'graphql',
      downloads: 532,
      rating: 4.3,
      author: 'GraphQL Team'
    },
    {
      id: 5,
      name: 'PCI Compliance Check',
      description: 'Verifies compliance with PCI DSS requirements',
      category: 'compliance',
      downloads: 421,
      rating: 4.7,
      author: 'Compliance Group'
    },
    {
      id: 6,
      name: 'Basic API Health Check',
      description: 'Quick health check for any API endpoint',
      category: 'health',
      downloads: 1203,
      rating: 4.2,
      author: 'API Health'
    }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesFilter = activeFilter === 'all' || template.category === activeFilter;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="public-templates-container">
      <header className="public-templates-header">
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

      <main className="public-templates-main">
        <section className="public-templates-top">
          <h1>Public Templates</h1>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </section>

        <div className="filter-controls">
          <button
            className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All Templates
          </button>
          <button
            className={`filter-btn ${activeFilter === 'security' ? 'active' : ''}`}
            onClick={() => setActiveFilter('security')}
          >
            Security
          </button>
          <button
            className={`filter-btn ${activeFilter === 'rest' ? 'active' : ''}`}
            onClick={() => setActiveFilter('rest')}
          >
            REST API
          </button>
          <button
            className={`filter-btn ${activeFilter === 'auth' ? 'active' : ''}`}
            onClick={() => setActiveFilter('auth')}
          >
            Authentication
          </button>
          <button
            className={`filter-btn ${activeFilter === 'graphql' ? 'active' : ''}`}
            onClick={() => setActiveFilter('graphql')}
          >
            GraphQL
          </button>
        </div>

        <div className="templates-grid">
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map(template => (
              <div key={template.id} className="template-card">
                <div className="template-image">
                  {template.category.toUpperCase()}
                </div>
                <div className="template-content">
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                  <div className="template-meta">
                    <span>Downloads: {template.downloads}</span>
                    <span>Rating: {template.rating}/5</span>
                  </div>
                  <div className="template-meta">
                    <span>By: {template.author}</span>
                  </div>
                  <div className="template-actions">
                    <button className="use-template-btn">Use Template</button>
                    <button className="view-details-btn">View Details</button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
              No templates found matching your criteria.
            </div>
          )}
        </div>

        <div className="pagination">
          <button className="active">1</button>
          <button>2</button>
          <button>3</button>
          <button>Next</button>
        </div>
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

export default PublicTemplates;
import React, { useState, useContext, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from './App';
import { useAuth } from './AuthContext';
import Logo from './components/Logo';
import './Documentation.css';

const Documentation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { currentUser, logout, getUserFullName } = useAuth();

  const [isVisible, setIsVisible] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [openFAQ, setOpenFAQ] = useState(null);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.target.id) {
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

  const handleLogout = useCallback(() => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      logout();
      navigate('/login', { replace: true });
    }
  }, [logout, navigate]);

  if (!currentUser) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Documentation...</p>
      </div>
    );
  }

  const userFullName = getUserFullName() || (currentUser?.firstName ? `${currentUser.firstName} User` : 'User');

  // FAQ Data
  const faqData = [
    {
      id: 'what-is-atat',
      question: 'What is AT-AT and how does it work?',
      answer: 'AT-AT (API Threat Assessment Tool) is a comprehensive security testing platform that automatically scans APIs for vulnerabilities, misconfigurations, and compliance issues. It uses advanced testing techniques including fuzzing, injection testing, and business logic analysis to identify security risks.'
    },
    {
      id: 'scan-frequency',
      question: 'How often should I scan my APIs?',
      answer: 'We recommend scanning critical APIs daily, high-priority APIs weekly, and all others at least monthly. Set up automated scans to ensure continuous monitoring, especially after deployments or configuration changes.'
    },
    {
      id: 'api-limits',
      question: 'Are there limits on the number of APIs I can scan?',
      answer: 'Limits depend on your subscription plan. Free accounts can scan up to 5 APIs, while premium plans support unlimited APIs with advanced features like automated scheduling and detailed reporting.'
    },
    {
      id: 'compliance-standards',
      question: 'Which compliance standards does AT-AT support?',
      answer: 'AT-AT supports multiple compliance frameworks including OWASP API Security Top 10, PCI-DSS, GDPR, SOX, HIPAA, and ISO 27001. Custom compliance profiles can be created for specific industry requirements.'
    },
    {
      id: 'false-positives',
      question: 'How do I handle false positives in scan results?',
      answer: 'Skill Issue.'
    },
    {
      id: 'integration-support',
      question: 'Can AT-AT integrate with my existing security tools?',
      answer: 'Yes! AT-AT supports integrations with popular tools like Jira, Slack, Jenkins, GitHub Actions, and SIEM platforms. Use our REST API or webhooks for custom integrations.'
    }
  ];

  return (
    <div className={`documentation-container ${darkMode ? 'dark-mode' : ''}`}>
      <header className="documentation-header">
        <div className="logo">
          <Logo />
        </div>
        <nav className="documentation-nav">
                  <Link to="/home" className={location.pathname === '/home' ? 'active' : ''}>Home</Link>
                  <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>Dashboard</Link>
                  <Link to="/manage-apis" className={location.pathname === '/manage-apis' ? 'active' : ''}>API Management</Link>
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

      <main className="documentation-main">
        {/* Hero Section */}
        <section className="documentation-hero">
          <div className="hero-content">
            <h1 className="hero-title">
              AT-AT <span className="gradient-text">Documentation</span>
            </h1>
            <p className="hero-description">
              Comprehensive guides and tutorials to help you master API security testing with AT-AT
            </p>
          </div>
        </section>

        {/* Search Bar */}

        {/* Quick Actions */}
        <section className="quick-actions-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="quick-actions-grid">
            <div className="quick-action-card" onClick={() => document.getElementById('getting-started')?.scrollIntoView({ behavior: 'smooth' })}>
              <div className="quick-action-icon">🚀</div>
              <h3 className="quick-action-title">Quick Start Guide</h3>
              <p className="quick-action-description">Get up and running with AT-AT in minutes</p>
              <div className="quick-action-arrow">→</div>
            </div>
            <div className="quick-action-card" onClick={() => document.getElementById('advanced-features')?.scrollIntoView({ behavior: 'smooth' })}>
              <div className="quick-action-icon">⚙️</div>
              <h3 className="quick-action-title">Advanced Features</h3>
              <p className="quick-action-description">Master complex scanning configurations</p>
              <div className="quick-action-arrow">→</div>
            </div>
            <div className="quick-action-card" onClick={() => document.getElementById('troubleshooting')?.scrollIntoView({ behavior: 'smooth' })}>
              <div className="quick-action-icon">🔍</div>
              <h3 className="quick-action-title">Troubleshooting</h3>
              <p className="quick-action-description">Resolve common issues and errors</p>
              <div className="quick-action-arrow">→</div>
            </div>
            <div className="quick-action-card" onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}>
              <div className="quick-action-icon">❓</div>
              <h3 className="quick-action-title">FAQ</h3>
              <p className="quick-action-description">Find answers to common questions</p>
              <div className="quick-action-arrow">→</div>
            </div>
          </div>
        </section>

        {/* Getting Started Section */}
        <section 
          id="getting-started" 
          className={`guides-section animate-on-scroll ${isVisible['getting-started'] ? 'visible' : ''}`}
        >
          <div className="section-header">
            <div className="section-title-wrapper">
              <span className="section-icon">🚀</span>
              <h2 className="section-title">Getting Started</h2>
            </div>
            <p className="section-description">Essential guides to get you up and running quickly</p>
          </div>
          
          <div className="guides-grid">
            <div className="guide-card">
              <div className="guide-header">
                <div className="guide-category">Beginner</div>
                <h3 className="guide-title">How to Set Up Your First Scan</h3>
                <p className="guide-description">Learn the steps to configure and run your first API security scan with AT-AT.</p>
              </div>
              <div className="guide-content">
                <div className="guide-steps">
                  <div className="guide-step">
                    <span className="step-number">1</span>
                    <span className="step-text">Navigate to the Dashboard and click "New Scan"</span>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">2</span>
                    <span className="step-text">Enter your API endpoint URL (e.g., https://api.example.com)</span>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">3</span>
                    <span className="step-text">Select authentication method if required</span>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">4</span>
                    <span className="step-text">Choose a scan profile or use the default "Quick Scan"</span>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">5</span>
                    <span className="step-text">Click "Start Scan" and monitor progress in real-time</span>
                  </div>
                </div>
              </div>
              <div className="guide-meta">
                <div className="guide-difficulty">
                  <span>Difficulty:</span>
                  <div className="difficulty-dots">
                    <div className="difficulty-dot active"></div>
                    <div className="difficulty-dot"></div>
                    <div className="difficulty-dot"></div>
                  </div>
                </div>
                <div className="guide-read-time">📖 5 min</div>
              </div>
            </div>

            <div className="guide-card">
              <div className="guide-header">
                <div className="guide-category">Beginner</div>
                <h3 className="guide-title">Understanding Scan Results</h3>
                <p className="guide-description">Interpret security scores, alerts, and reports generated by AT-AT.</p>
              </div>
              <div className="guide-content">
                <div className="guide-steps">
                  <div className="guide-step">
                    <span className="step-number">1</span>
                    <span className="step-text">Navigate to the Reports section after scan completion</span>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">2</span>
                    <span className="step-text">Review the overall security score (0-100 scale)</span>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">3</span>
                    <span className="step-text">Examine detailed vulnerability findings</span>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">4</span>
                    <span className="step-text">Prioritize issues based on severity levels</span>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">5</span>
                    <span className="step-text">Export reports for your security team</span>
                  </div>
                </div>
              </div>
              <div className="guide-meta">
                <div className="guide-difficulty">
                  <span>Difficulty:</span>
                  <div className="difficulty-dots">
                    <div className="difficulty-dot active"></div>
                    <div className="difficulty-dot"></div>
                    <div className="difficulty-dot"></div>
                  </div>
                </div>
                <div className="guide-read-time">📖 7 min</div>
              </div>
            </div>
          </div>
        </section>

        {/* Advanced Features Section */}
        <section 
          id="advanced-features" 
          className={`guides-section animate-on-scroll ${isVisible['advanced-features'] ? 'visible' : ''}`}
        >
          <div className="section-header">
            <div className="section-title-wrapper">
              <span className="section-icon">⚙️</span>
              <h2 className="section-title">Advanced Features</h2>
            </div>
            <p className="section-description">Unlock the full potential of AT-AT with advanced configurations</p>
          </div>
          
          <div className="guides-grid">
            <div className="guide-card">
              <div className="guide-header">
                <div className="guide-category">Intermediate</div>
                <h3 className="guide-title">Customizing Testing Profiles</h3>
                <p className="guide-description">Create and manage custom scan profiles tailored to your needs.</p>
              </div>
              <div className="guide-content">
                <div className="guide-steps">
                  <div className="guide-step">
                    <span className="step-number">1</span>
                    <span className="step-text">Access the Templates section from the navigation</span>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">2</span>
                    <span className="step-text">Click "Create Custom Profile"</span>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">3</span>
                    <span className="step-text">Configure test parameters and vulnerability checks</span>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">4</span>
                    <span className="step-text">Set authentication and rate limiting options</span>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">5</span>
                    <span className="step-text">Save and apply to your API scans</span>
                  </div>
                </div>
              </div>
              <div className="guide-meta">
                <div className="guide-difficulty">
                  <span>Difficulty:</span>
                  <div className="difficulty-dots">
                    <div className="difficulty-dot active"></div>
                    <div className="difficulty-dot active"></div>
                    <div className="difficulty-dot"></div>
                  </div>
                </div>
                <div className="guide-read-time">📖 10 min</div>
              </div>
            </div>

            <div className="guide-card">
              <div className="guide-header">
                <div className="guide-category">Intermediate</div>
                <h3 className="guide-title">Managing API Inventory</h3>
                <p className="guide-description">Add, edit, or remove APIs from your inventory for scanning.</p>
              </div>
              <div className="guide-content">
                <div className="guide-steps">
                  <div className="guide-step">
                    <span className="step-number">1</span>
                    <span className="step-text">Navigate to "Manage APIs" in the main menu</span>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">2</span>
                    <span className="step-text">Click "Add New API" to register endpoints</span>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">3</span>
                    <span className="step-text">Import APIs from OpenAPI/Swagger specifications</span>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">4</span>
                    <span className="step-text">Organize APIs with tags and categories</span>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">5</span>
                    <span className="step-text">Set up automated discovery and monitoring</span>
                  </div>
                </div>
              </div>
              <div className="guide-meta">
                <div className="guide-difficulty">
                  <span>Difficulty:</span>
                  <div className="difficulty-dots">
                    <div className="difficulty-dot active"></div>
                    <div className="difficulty-dot active"></div>
                    <div className="difficulty-dot"></div>
                  </div>
                </div>
                <div className="guide-read-time">📖 8 min</div>
              </div>
            </div>
          </div>
        </section>

        {/* Troubleshooting Section */}
        <section 
          id="troubleshooting" 
          className={`guides-section animate-on-scroll ${isVisible['troubleshooting'] ? 'visible' : ''}`}
        >
          <div className="section-header">
            <div className="section-title-wrapper">
              <span className="section-icon">🔍</span>
              <h2 className="section-title">Troubleshooting</h2>
            </div>
            <p className="section-description">Resolve common issues and optimize your scanning experience</p>
          </div>
          
          <div className="guides-grid">
            <div className="guide-card">
              <div className="guide-header">
                <div className="guide-category">Intermediate</div>
                <h3 className="guide-title">Resolving Failed Scans</h3>
                <p className="guide-description">Steps to troubleshoot and fix issues with failed scan attempts.</p>
              </div>
              <div className="guide-content">
                <div className="guide-steps">
                  <div className="guide-step">
                    <span className="step-number">1</span>
                    <span className="step-text">Check the scan logs for error messages</span>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">2</span>
                    <span className="step-text">Verify API endpoint accessibility and authentication</span>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">3</span>
                    <span className="step-text">Review network connectivity and firewall settings</span>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">4</span>
                    <span className="step-text">Adjust rate limiting and timeout configurations</span>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">5</span>
                    <span className="step-text">Contact support if issues persist</span>
                  </div>
                </div>
              </div>
              <div className="guide-meta">
                <div className="guide-difficulty">
                  <span>Difficulty:</span>
                  <div className="difficulty-dots">
                    <div className="difficulty-dot active"></div>
                    <div className="difficulty-dot active"></div>
                    <div className="difficulty-dot"></div>
                  </div>
                </div>
                <div className="guide-read-time">📖 6 min</div>
              </div>
            </div>

            <div className="guide-card">
              <div className="guide-header">
                <div className="guide-category">Beginner</div>
                <h3 className="guide-title">Contacting Support</h3>
                <p className="guide-description">Get help from our support team or community forums.</p>
              </div>
              <div className="guide-content">
                <div className="guide-steps">
                  <div className="guide-step">
                    <span className="step-number">1</span>
                    <span className="step-text">Use the in-app chat widget for immediate assistance</span>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">2</span>
                    <span className="step-text">Email support@atat.com with detailed issue descriptions</span>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">3</span>
                    <span className="step-text">Join our community forum for peer support</span>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">4</span>
                    <span className="step-text">Check the status page for known issues</span>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">5</span>
                    <span className="step-text">Schedule a call with our technical team</span>
                  </div>
                </div>
              </div>
              <div className="guide-meta">
                <div className="guide-difficulty">
                  <span>Difficulty:</span>
                  <div className="difficulty-dots">
                    <div className="difficulty-dot active"></div>
                    <div className="difficulty-dot"></div>
                    <div className="difficulty-dot"></div>
                  </div>
                </div>
                <div className="guide-read-time">📖 3 min</div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section 
          id="faq" 
          className={`faq-section animate-on-scroll ${isVisible['faq'] ? 'visible' : ''}`}
        >
          <div className="section-header">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-description">Find quick answers to common questions</p>
          </div>
          
          <div className="faq-container">
            {faqData.map((faq) => (
              <div 
                key={faq.id} 
                className={`faq-item ${openFAQ === faq.id ? 'open' : ''}`}
              >
                <div 
                  className="faq-question"
                  onClick={() => setOpenFAQ(openFAQ === faq.id ? null : faq.id)}
                >
                  <h3>{faq.question}</h3>
                  <span className="faq-toggle">+</span>
                </div>
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Support Section */}
        <section className="support-section">
          <div className="section-header">
            <h2 className="section-title">Need More Help?</h2>
            <p className="section-description">Get support from our team and community</p>
          </div>
            <div className="support-card">
              <div className="support-icon">📧</div>
              <h3 className="support-title">Email Support</h3>
              <p className="support-description">Send us detailed questions or bug reports</p>
            </div>
            <div className="support-card">
              <div className="support-icon">📖</div>
              <h3 className="support-title">User Manual</h3>
              <p className="support-description">Technical documentation for developers</p>
            </div>
        </section>
      </main>

      <footer className="documentation-footer">
              <p>© 2025 AT-AT (API Threat Assessment Tool) • COS301 Capstone Project. All rights reserved.</p>
              <div className="footer-links">
                <Link to="/privacy">Privacy Policy</Link>
                <Link to="/terms">Terms of Service</Link>
                <Link to="/documentation">Documentation</Link>
                <Link to="/contact">Contact Us</Link>
              </div>
            </footer>
    </div>
  );
};

export default Documentation;

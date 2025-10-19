import React, { useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from './App';
import Logo from "./components/Logo";
import './LegalPages.css';

/**
 * Contact Page Component
 * 
 * Displays contact information and support resources for AT-AT platform.
 * Features:
 * - Primary contact email with mailto functionality
 * - Different inquiry types with clear categorization
 * - Response time expectations
 * - Support resources and self-service options
 * - Enhanced user experience with quick email templates
 * - Consistent theming and navigation
 */
const Contact = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleEmailContact = (subject, category) => {
    const emailSubject = encodeURIComponent(`${subject} - AT-AT Platform`);
    const body = encodeURIComponent(`Hello AT-AT Team,\n\n[${category}]\n\n[Please describe your inquiry in detail here]\n\n--- \nSent from AT-AT Contact Page\nThank you for your time.`);
    window.open(`mailto:skillissue.capstone@gmail.com?subject=${emailSubject}&body=${body}`, '_blank');
  };

  const inquiryTypes = [
    {
      title: 'General Support',
      subject: '[SUPPORT]',
      description: 'For general platform questions, account issues, or usage guidance.',
      category: 'General Support Request'
    },
    {
      title: 'Technical Issues', 
      subject: '[TECHNICAL]',
      description: 'For technical problems, bugs, or platform errors.',
      category: 'Technical Issue Report'
    },
    {
      title: 'Security Concerns',
      subject: '[SECURITY]', 
      description: 'For security vulnerabilities, incidents, or privacy concerns.',
      category: 'Security Concern Report'
    },
    {
      title: 'Feature Requests',
      subject: '[FEATURE]',
      description: 'For suggestions about new features or improvements.',
      category: 'Feature Request'
    },
    {
      title: 'Business Inquiries',
      subject: '[BUSINESS]',
      description: 'For partnerships, enterprise sales, or business development.',
      category: 'Business Inquiry'
    },
    {
      title: 'Privacy & Legal',
      subject: '[LEGAL]',
      description: 'For privacy policy questions, data requests, or legal matters.',
      category: 'Legal/Privacy Matter'
    }
  ];

  return (
    <div className={`legal-page-container ${darkMode ? 'dark-mode' : ''}`}>
      {/* Header - Simplified for public access */}
      <header className="legal-header">
        <div className="logo-section">
          <Logo />
          <span className="brand-tagline">API Security Made Simple</span>
        </div>
        
        {/* Simple public navigation */}
        <nav className="legal-nav">
          <Link to="/landing">Home</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Sign Up</Link>
        </nav>
        
        <div className="user-info">
          <button onClick={toggleDarkMode} className="theme-toggle" title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}>
            <span className="theme-icon">{darkMode ? '☀️' : '🌙'}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="legal-content">
        <div className="legal-container fade-in">
          <div className="legal-header-section">
            <h1>Contact Us</h1>
            <p className="last-updated">We're here to help! Reach out to us for any questions, support, or feedback regarding the AT-AT platform.</p>
          </div>

          <div className="legal-body">
            <div className="highlight-box">
              <p>
                <strong>Need help?</strong> Choose the appropriate inquiry type below for faster response times, 
                or contact us directly for general questions.
              </p>
            </div>

            <section className="legal-section">
              <h2>Get in Touch</h2>
              <div className="contact-info primary-contact">
                <h3>Primary Contact</h3>
                <p><strong>Email:</strong> <a href="mailto:skillissue.capstone@gmail.com">skillissue.capstone@gmail.com</a></p>
                <p className="contact-note">We typically respond within 24-48 hours during business days.</p>
                <button 
                  onClick={() => handleEmailContact('[GENERAL]', 'General Inquiry')} 
                  className="cta-btn primary"
                  style={{
                    marginTop: '15px',
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'var(--legal-primary-color)',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'var(--legal-transition)',
                    fontSize: '1em',
                    fontWeight: '600'
                  }}
                >
                  📧 Send General Inquiry
                </button>
              </div>
            </section>

            <section className="legal-section">
              <h2>Inquiry Types</h2>
              <p>To help us route your inquiry efficiently, please select the appropriate category:</p>
              
              <div className="inquiry-types" style={{ display: 'grid', gap: '20px', marginTop: '25px' }}>
                {inquiryTypes.map((inquiry, index) => (
                  <div key={index} className="inquiry-item" style={{
                    background: 'var(--legal-bg-primary)',
                    padding: '20px',
                    borderRadius: 'var(--legal-border-radius-small)',
                    border: '1px solid var(--legal-secondary-color)',
                    transition: 'var(--legal-transition)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 10px 0', color: 'var(--legal-text-primary)' }}>{inquiry.title}</h3>
                        <p style={{ margin: '0 0 10px 0', color: 'var(--legal-text-secondary)', fontSize: '0.9em' }}>
                          <strong>Subject:</strong> {inquiry.subject}
                        </p>
                        <p style={{ margin: '0', color: 'var(--legal-text-primary)' }}>{inquiry.description}</p>
                      </div>
                      <button 
                        onClick={() => handleEmailContact(inquiry.subject, inquiry.category)}
                        style={{
                          padding: '8px 16px',
                          border: '2px solid var(--legal-primary-color)',
                          background: 'transparent',
                          color: 'var(--legal-primary-color)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'var(--legal-transition)',
                          fontSize: '0.9em',
                          fontWeight: '500',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.background = 'var(--legal-primary-color)';
                          e.target.style.color = 'white';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.style.color = 'var(--legal-primary-color)';
                        }}
                      >
                        Send Email
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="legal-section">
              <h2>Response Times</h2>
              <div className="response-times" style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
                <div className="response-item" style={{
                  background: 'var(--legal-bg-primary)',
                  padding: '15px',
                  borderRadius: 'var(--legal-border-radius-small)',
                  borderLeft: '4px solid var(--legal-danger-color)'
                }}>
                  <h3 style={{ margin: '0 0 8px 0', color: 'var(--legal-text-primary)' }}>Security Issues</h3>
                  <p style={{ margin: '0 0 5px 0' }}><strong>Response Time:</strong> Within 24 hours</p>
                  <p style={{ margin: '0', color: 'var(--legal-text-secondary)', fontSize: '0.9em' }}>Security vulnerabilities and incidents receive priority handling.</p>
                </div>

                <div className="response-item" style={{
                  background: 'var(--legal-bg-primary)',
                  padding: '15px',
                  borderRadius: 'var(--legal-border-radius-small)',
                  borderLeft: '4px solid var(--legal-warning-color)'
                }}>
                  <h3 style={{ margin: '0 0 8px 0', color: 'var(--legal-text-primary)' }}>Technical Support</h3>
                  <p style={{ margin: '0 0 5px 0' }}><strong>Response Time:</strong> 24-48 hours</p>
                  <p style={{ margin: '0', color: 'var(--legal-text-secondary)', fontSize: '0.9em' }}>Technical issues and platform problems are addressed promptly.</p>
                </div>

                <div className="response-item" style={{
                  background: 'var(--legal-bg-primary)',
                  padding: '15px',
                  borderRadius: 'var(--legal-border-radius-small)',
                  borderLeft: '4px solid var(--legal-info-color)'
                }}>
                  <h3 style={{ margin: '0 0 8px 0', color: 'var(--legal-text-primary)' }}>General Inquiries</h3>
                  <p style={{ margin: '0 0 5px 0' }}><strong>Response Time:</strong> 2-3 business days</p>
                  <p style={{ margin: '0', color: 'var(--legal-text-secondary)', fontSize: '0.9em' }}>General questions and support requests during business hours.</p>
                </div>

                <div className="response-item" style={{
                  background: 'var(--legal-bg-primary)',
                  padding: '15px',
                  borderRadius: 'var(--legal-border-radius-small)',
                  borderLeft: '4px solid var(--legal-success-color)'
                }}>
                  <h3 style={{ margin: '0 0 8px 0', color: 'var(--legal-text-primary)' }}>Feature Requests</h3>
                  <p style={{ margin: '0 0 5px 0' }}><strong>Response Time:</strong> 3-5 business days</p>
                  <p style={{ margin: '0', color: 'var(--legal-text-secondary)', fontSize: '0.9em' }}>Feature suggestions are reviewed and acknowledged promptly.</p>
                </div>
              </div>
            </section>

            <section className="legal-section">
              <h2>Self-Service Resources</h2>
              <p>Before contacting us, you might find answers in our self-service resources:</p>
              <ul>
                <li><Link to="/documentation" style={{ color: 'var(--legal-primary-color)', textDecoration: 'none' }}>Documentation</Link> - Comprehensive guides and tutorials</li>
                <li><strong>FAQ Section</strong> - Common questions and answers (coming soon)</li>
                <li><strong>Video Tutorials</strong> - Step-by-step platform walkthroughs (coming soon)</li>
                <li><strong>API Documentation</strong> - Technical reference materials</li>
                <li><strong>Best Practices</strong> - Security testing recommendations and guides</li>
                <li><strong>Community Forum</strong> - Connect with other users and share experiences</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>What to Include in Your Message</h2>
              <p>To help us assist you more effectively, please include:</p>
              
              <h3>For Technical Issues:</h3>
              <ul>
                <li><strong>Problem Description:</strong> Detailed description of the issue you're experiencing</li>
                <li><strong>Reproduction Steps:</strong> Step-by-step instructions to reproduce the problem</li>
                <li><strong>System Information:</strong> Browser type/version and operating system</li>
                <li><strong>Screenshots:</strong> Visual evidence of errors or unexpected behavior</li>
                <li><strong>Account Details:</strong> Your account email (for account-specific issues)</li>
                <li><strong>Error Messages:</strong> Exact text of any error messages received</li>
              </ul>

              <h3>For General Inquiries:</h3>
              <ul>
                <li><strong>Clear Description:</strong> Specific question or request details</li>
                <li><strong>Context:</strong> Relevant background information or use case</li>
                <li><strong>Account Info:</strong> Your account information (if applicable)</li>
                <li><strong>Timeline:</strong> Any specific deadlines or urgency indicators</li>
                <li><strong>Previous Attempts:</strong> What you've already tried or researched</li>
              </ul>

              <h3>For Security Reports:</h3>
              <ul>
                <li><strong>Vulnerability Details:</strong> Detailed description of the security issue</li>
                <li><strong>Impact Assessment:</strong> Potential impact and severity evaluation</li>
                <li><strong>Supporting Evidence:</strong> Screenshots, logs, or other documentation</li>
                <li><strong>Disclosure Timeline:</strong> Your expectations for response and resolution</li>
                <li><strong>Contact Preference:</strong> Preferred method for follow-up communication</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>Office Hours & Availability</h2>
              <p>While we monitor our email regularly, our primary support hours are:</p>
              <div className="office-hours" style={{
                background: 'var(--legal-bg-primary)',
                padding: '20px',
                borderRadius: 'var(--legal-border-radius-small)',
                marginTop: '15px'
              }}>
                <p style={{ margin: '0 0 10px 0' }}><strong>Monday - Friday:</strong> 9:00 AM - 5:00 PM (UTC+2, South Africa Time)</p>
                <p style={{ margin: '0 0 10px 0' }}><strong>Weekend:</strong> Limited availability for urgent issues only</p>
                <p style={{ margin: '0' }}><strong>Security Issues:</strong> Monitored 24/7 for critical vulnerabilities</p>
              </div>
            </section>

            <section className="legal-section">
              <h2>Alternative Resources</h2>
              <div className="alternative-resources" style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
                <div className="resource-item" style={{
                  background: 'var(--legal-bg-primary)',
                  padding: '15px',
                  borderRadius: 'var(--legal-border-radius-small)'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', color: 'var(--legal-text-primary)' }}>Platform Status</h3>
                  <p style={{ margin: '0', color: 'var(--legal-text-secondary)' }}>Check our status page for real-time platform availability and maintenance updates.</p>
                </div>

                <div className="resource-item" style={{
                  background: 'var(--legal-bg-primary)',
                  padding: '15px',
                  borderRadius: 'var(--legal-border-radius-small)'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', color: 'var(--legal-text-primary)' }}>Community Forum</h3>
                  <p style={{ margin: '0', color: 'var(--legal-text-secondary)' }}>Connect with other users, share experiences, and get community support.</p>
                </div>

                <div className="resource-item" style={{
                  background: 'var(--legal-bg-primary)',
                  padding: '15px',
                  borderRadius: 'var(--legal-border-radius-small)'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', color: 'var(--legal-text-primary)' }}>Knowledge Base</h3>
                  <p style={{ margin: '0', color: 'var(--legal-text-secondary)' }}>Search our comprehensive knowledge base for detailed articles and troubleshooting guides.</p>
                </div>
              </div>
            </section>

            <section className="legal-section">
              <h2>Emergency Contact</h2>
              <p>For critical security incidents or urgent platform issues affecting multiple users:</p>
              <div className="contact-info emergency-contact" style={{
                background: 'rgba(220, 53, 69, 0.1)',
                border: '1px solid var(--legal-danger-color)',
                padding: '20px',
                borderRadius: 'var(--legal-border-radius-small)',
                marginTop: '15px'
              }}>
                <p style={{ margin: '0 0 10px 0' }}><strong>Email:</strong> <a href="mailto:skillissue.capstone@gmail.com" style={{ color: 'var(--legal-danger-color)' }}>skillissue.capstone@gmail.com</a></p>
                <p style={{ margin: '0 0 10px 0' }}><strong>Subject:</strong> [URGENT] - Brief description</p>
                <p style={{ margin: '0 0 15px 0' }}><strong>Response:</strong> Within 4 hours for critical issues</p>
                <button 
                  onClick={() => handleEmailContact('[URGENT]', 'Emergency/Critical Issue')}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    background: 'var(--legal-danger-color)',
                    color: 'white',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9em',
                    fontWeight: '600',
                    transition: 'var(--legal-transition)'
                  }}
                >
                  🚨 Send Emergency Report
                </button>
              </div>
            </section>

            <section className="legal-section">
              <h2>Feedback & Suggestions</h2>
              <p>
                We value your feedback and suggestions for improving AT-AT. Whether it's about new features, 
                user experience improvements, or general platform feedback, we'd love to hear from you.
              </p>
              <p>Your input helps us prioritize development efforts and create a better experience for all users.</p>
              <div style={{ marginTop: '15px' }}>
                <button 
                  onClick={() => handleEmailContact('[FEEDBACK]', 'User Feedback')}
                  style={{
                    padding: '12px 24px',
                    border: '2px solid var(--legal-success-color)',
                    background: 'transparent',
                    color: 'var(--legal-success-color)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1em',
                    fontWeight: '600',
                    transition: 'var(--legal-transition)'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'var(--legal-success-color)';
                    e.target.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = 'var(--legal-success-color)';
                  }}
                >
                  💡 Share Feedback
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="legal-footer">
        <div className="footer-content">
          <div className="footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/contact">Contact Us</Link>
            <Link to="/documentation">Documentation</Link>
          </div>
          <p>&copy; 2025 AT-AT (API Threat Assessment Tool). All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
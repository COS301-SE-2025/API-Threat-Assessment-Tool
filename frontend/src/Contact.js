import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from './App';
import Logo from "./components/Logo";
import './LegalPages.css';

/**
 * Contact Page Component
 * 
 * Displays contact information and support resources for AT-AT platform.
 * Features:
 * - Primary contact email
 * - Different inquiry types
 * - Response time expectations
 * - Support resources
 */
const Contact = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  return (
    <div className="legal-page-container">
      {/* Header */}
      <header className="legal-header">
        <div className="header-content">
          <div className="logo-section">
            <Logo />
            <span className="brand-tagline">API Security Made Simple</span>
          </div>
          <nav className="legal-nav">
            <Link to="/landing">Home</Link>
            <Link to="/login">Login</Link>
          </nav>
          <div className="header-actions">
            <button onClick={toggleDarkMode} className="theme-toggle" title="Toggle Theme">
              <span className="theme-icon">{darkMode ? '☀️' : '🌙'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="legal-content">
        <div className="legal-container">
          <div className="legal-header-section">
            <h1>Contact Us</h1>
            <p className="contact-intro">We're here to help! Reach out to us for any questions, support, or feedback regarding the AT-AT platform.</p>
          </div>

          <div className="legal-body">
            <section className="legal-section contact-main">
              <h2>Get in Touch</h2>
              <div className="contact-info primary-contact">
                <h3>Primary Contact</h3>
                <p><strong>Email:</strong> <a href="mailto:skillissue.capstone@gmail.com">skillissue.capstone@gmail.com</a></p>
                <p className="contact-note">We typically respond within 24-48 hours during business days.</p>
              </div>
            </section>

            <section className="legal-section">
              <h2>Inquiry Types</h2>
              <p>To help us route your inquiry efficiently, please include the appropriate subject line:</p>
              
              <div className="inquiry-types">
                <div className="inquiry-item">
                  <h3>General Support</h3>
                  <p><strong>Subject:</strong> [SUPPORT] - Your question</p>
                  <p>For general platform questions, account issues, or usage guidance.</p>
                </div>

                <div className="inquiry-item">
                  <h3>Technical Issues</h3>
                  <p><strong>Subject:</strong> [TECHNICAL] - Brief description</p>
                  <p>For technical problems, bugs, or platform errors.</p>
                </div>

                <div className="inquiry-item">
                  <h3>Security Concerns</h3>
                  <p><strong>Subject:</strong> [SECURITY] - Brief description</p>
                  <p>For security vulnerabilities, incidents, or privacy concerns.</p>
                </div>

                <div className="inquiry-item">
                  <h3>Feature Requests</h3>
                  <p><strong>Subject:</strong> [FEATURE] - Feature name</p>
                  <p>For suggestions about new features or improvements.</p>
                </div>

                <div className="inquiry-item">
                  <h3>Business Inquiries</h3>
                  <p><strong>Subject:</strong> [BUSINESS] - Inquiry type</p>
                  <p>For partnerships, enterprise sales, or business development.</p>
                </div>

                <div className="inquiry-item">
                  <h3>Privacy & Legal</h3>
                  <p><strong>Subject:</strong> [LEGAL] - Request type</p>
                  <p>For privacy policy questions, data requests, or legal matters.</p>
                </div>
              </div>
            </section>

            <section className="legal-section">
              <h2>Response Times</h2>
              <div className="response-times">
                <div className="response-item">
                  <h3>Security Issues</h3>
                  <p><strong>Response Time:</strong> Within 24 hours</p>
                  <p>Security vulnerabilities and incidents receive priority handling.</p>
                </div>

                <div className="response-item">
                  <h3>Technical Support</h3>
                  <p><strong>Response Time:</strong> 24-48 hours</p>
                  <p>Technical issues and platform problems are addressed promptly.</p>
                </div>

                <div className="response-item">
                  <h3>General Inquiries</h3>
                  <p><strong>Response Time:</strong> 2-3 business days</p>
                  <p>General questions and support requests during business hours.</p>
                </div>

                <div className="response-item">
                  <h3>Feature Requests</h3>
                  <p><strong>Response Time:</strong> 3-5 business days</p>
                  <p>Feature suggestions are reviewed and acknowledged promptly.</p>
                </div>
              </div>
            </section>

            <section className="legal-section">
              <h2>Self-Service Resources</h2>
              <p>Before contacting us, you might find answers in our self-service resources:</p>
              <ul>
                <li><Link to="/documentation">Documentation</Link> - Comprehensive guides and tutorials</li>
                <li><strong>FAQ Section</strong> - Common questions and answers</li>
                <li><strong>Video Tutorials</strong> - Step-by-step platform walkthroughs</li>
                <li><strong>API Documentation</strong> - Technical reference materials</li>
                <li><strong>Best Practices</strong> - Security testing recommendations</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>What to Include in Your Message</h2>
              <p>To help us assist you more effectively, please include:</p>
              
              <h3>For Technical Issues:</h3>
              <ul>
                <li>Detailed description of the problem</li>
                <li>Steps to reproduce the issue</li>
                <li>Browser and operating system information</li>
                <li>Screenshots or error messages (if applicable)</li>
                <li>Your account email (for account-specific issues)</li>
              </ul>

              <h3>For General Inquiries:</h3>
              <ul>
                <li>Clear description of your question or request</li>
                <li>Relevant context or background information</li>
                <li>Your account information (if applicable)</li>
                <li>Any specific deadlines or urgency</li>
              </ul>

              <h3>For Security Reports:</h3>
              <ul>
                <li>Detailed description of the vulnerability</li>
                <li>Steps to reproduce (if safe to share)</li>
                <li>Potential impact assessment</li>
                <li>Any supporting evidence or documentation</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>Office Hours</h2>
              <p>While we monitor our email regularly, our primary support hours are:</p>
              <div className="office-hours">
                <p><strong>Monday - Friday:</strong> 9:00 AM - 5:00 PM (UTC)</p>
                <p><strong>Weekend:</strong> Limited availability for urgent issues</p>
                <p><strong>Security Issues:</strong> Monitored 24/7</p>
              </div>
            </section>

            <section className="legal-section">
              <h2>Alternative Resources</h2>
              <div className="alternative-resources">
                <div className="resource-item">
                  <h3>Platform Status</h3>
                  <p>Check our status page for real-time platform availability and maintenance updates.</p>
                </div>

                <div className="resource-item">
                  <h3>Community Forum</h3>
                  <p>Connect with other users, share experiences, and get community support.</p>
                </div>

                <div className="resource-item">
                  <h3>Knowledge Base</h3>
                  <p>Search our comprehensive knowledge base for detailed articles and guides.</p>
                </div>
              </div>
            </section>

            <section className="legal-section">
              <h2>Emergency Contact</h2>
              <p>For critical security incidents or urgent platform issues affecting multiple users:</p>
              <div className="contact-info emergency-contact">
                <p><strong>Email:</strong> <a href="mailto:skillissue.capstone@gmail.com">skillissue.capstone@gmail.com</a></p>
                <p><strong>Subject:</strong> [URGENT] - Brief description</p>
                <p><strong>Response:</strong> Within 4 hours for critical issues</p>
              </div>
            </section>

            <section className="legal-section">
              <h2>Feedback</h2>
              <p>We value your feedback and suggestions for improving AT-AT. Whether it's about new features, user experience improvements, or general platform feedback, we'd love to hear from you.</p>
              <p>Use the subject line <strong>[FEEDBACK]</strong> when sharing your thoughts and suggestions.</p>
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
            <Link to="/security">Security</Link>
            <Link to="/contact">Contact Us</Link>
          </div>
          <p>&copy; 2025 AT-AT (API Threat Assessment Tool). All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
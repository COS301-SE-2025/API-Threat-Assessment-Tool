import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeContext } from './App';
import { useAuth } from './AuthContext';
import Logo from "./components/Logo";
import './LegalPages.css';

/**
 * Privacy Policy Component
 * 
 * Displays comprehensive privacy policy for AT-AT platform.
 * Features:
 * - Clear data handling practices with consistent theming
 * - User rights and controls information
 * - Security measures documentation
 * - Contact information for privacy concerns
 * - Responsive design with dark mode support
 * - Smooth scrolling to sections
 */
const PrivacyPolicy = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { currentUser, logout, getUserFullName } = useAuth();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('');

  // Handle logout
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  // Handle smooth scrolling to sections and update active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('.legal-section');
      const scrollPosition = window.scrollY + 100;

      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.querySelector('h2')?.textContent;

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          setActiveSection(sectionId || '');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleEmailContact = () => {
    const subject = encodeURIComponent('Privacy Policy Inquiry - AT-AT Platform');
    const body = encodeURIComponent('Hello AT-AT Team,\n\nI have a question regarding your privacy policy:\n\n[Please describe your inquiry here]\n\nThank you for your time.');
    window.open(`mailto:skillissue.capstone@gmail.com?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className={`legal-page-container ${darkMode ? 'dark-mode' : ''}`}>
      {/* Header - Matches Home.js structure exactly */}
      <header className="legal-header">
        <div className="logo-section">
          <Logo />
          <span className="brand-tagline">API Security Made Simple</span>
        </div>
        
        {/* Navigation - matches Home/Dashboard pattern exactly */}
        {currentUser ? (
          // Logged in user navigation
          <>
            <nav className="legal-nav">
              <Link to="/home" className={location.pathname === '/home' ? 'active' : ''}>Home</Link>
              <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>Dashboard</Link>
              <Link to="/manage-apis" className={location.pathname === '/manage-apis' ? 'active' : ''}>API Management</Link>
              <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>Settings</Link>
            </nav>
            <div className="user-info">
              <div className="user-profile">
                <span className="user-avatar">{currentUser.firstName?.charAt(0)?.toUpperCase() || 'U'}</span>
                <div className="user-details">
                  <span className="user-greeting">Welcome back,</span>
                  <span className="user-name">{getUserFullName() || 'User'}</span>
                </div>
              </div>
              <button onClick={handleLogout} className="logout-btn" title="Logout">Logout</button>
              <button onClick={toggleDarkMode} className="theme-toggle" title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}>
                <span className="theme-icon">{darkMode ? '☀️' : '🌙'}</span>
              </button>
            </div>
          </>
        ) : (
          // Not logged in navigation
          <>
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
          </>
        )}
      </header>

      {/* Main Content */}
      <main className="legal-content">
        <div className="legal-container fade-in">
          <div className="legal-header-section">
            <h1>Privacy Policy</h1>
            <p className="last-updated">Last updated: September 27, 2025</p>
          </div>

          <div className="legal-body">
            <div className="highlight-box">
              <p>
                <strong>Your privacy matters to us.</strong> This policy explains how AT-AT collects, 
                uses, and protects your personal information while providing comprehensive API security testing services.
              </p>
            </div>

            <section className="legal-section">
              <h2>1. Information We Collect</h2>
              
              <h3>Account Information</h3>
              <p>
                When you create an AT-AT account, we collect information such as your name, email address, 
                and company information to provide our API security testing services. This information is 
                essential for account management and service delivery.
              </p>
              
              <h3>API Data</h3>
              <p>
                We collect and analyze API endpoint information, security scan results, and vulnerability 
                data necessary to provide our security testing services. This data is processed securely 
                and used solely for security analysis purposes. We implement strict access controls to 
                ensure this sensitive information remains protected.
              </p>
              
              <h3>Usage Information</h3>
              <p>
                We automatically collect information about how you use our platform, including scan frequency, 
                feature usage, and performance metrics to improve our services. This helps us understand user 
                behavior and enhance the platform experience.
              </p>

              <h3>Technical Information</h3>
              <p>
                We collect technical information such as IP addresses, browser types, device information, 
                and access logs to ensure platform security and optimal performance.
              </p>
            </section>

            <section className="legal-section">
              <h2>2. How We Use Your Information</h2>
              <p>We use your information for the following purposes:</p>
              <ul>
                <li><strong>Service Provision:</strong> Provide and maintain our API security testing services</li>
                <li><strong>Security Analysis:</strong> Perform security scans and vulnerability assessments</li>
                <li><strong>Communications:</strong> Send you security reports, platform notifications, and important updates</li>
                <li><strong>Platform Improvement:</strong> Improve our security detection algorithms and user experience</li>
                <li><strong>Customer Support:</strong> Provide technical assistance and resolve issues</li>
                <li><strong>Legal Compliance:</strong> Comply with legal obligations and security requirements</li>
                <li><strong>Fraud Prevention:</strong> Detect and prevent fraudulent activities and security breaches</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>3. Data Security</h2>
              <p>We implement comprehensive security measures to protect your data:</p>
              <ul>
                <li><strong>Encryption:</strong> End-to-end encryption for all data transmission using TLS 1.3</li>
                <li><strong>Storage Security:</strong> Secure storage with AES-256 encryption at rest</li>
                <li><strong>Security Audits:</strong> Regular security audits and penetration testing by third-party experts</li>
                <li><strong>Access Controls:</strong> Multi-factor authentication and role-based access controls</li>
                <li><strong>Data Retention:</strong> Automated data retention policies and secure deletion procedures</li>
                <li><strong>Monitoring:</strong> 24/7 security monitoring and incident response capabilities</li>
                <li><strong>Staff Training:</strong> Regular security training for all personnel handling data</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>4. Data Sharing and Disclosure</h2>
              <p>We do not sell, trade, or otherwise transfer your personal information to third parties except in the following circumstances:</p>
              <ul>
                <li><strong>With Your Consent:</strong> When you have given explicit consent for specific sharing</li>
                <li><strong>Legal Requirements:</strong> To comply with applicable laws, regulations, or legal processes</li>
                <li><strong>Protection of Rights:</strong> To protect our rights, property, or safety, or that of our users</li>
                <li><strong>Service Providers:</strong> With trusted service providers who assist in operating our platform under strict confidentiality agreements</li>
                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets (with prior notice to users)</li>
                <li><strong>Emergency Situations:</strong> To protect against imminent harm to persons or property</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>5. Your Privacy Rights</h2>
              <p>You have the following rights regarding your personal data:</p>
              <ul>
                <li><strong>Access:</strong> Request copies of your personal data and information about how it's processed</li>
                <li><strong>Rectification:</strong> Request correction of inaccurate or incomplete data</li>
                <li><strong>Erasure:</strong> Request deletion of your personal data (subject to legal requirements)</li>
                <li><strong>Portability:</strong> Request transfer of your data in a structured, machine-readable format</li>
                <li><strong>Objection:</strong> Object to processing of your data for specific purposes</li>
                <li><strong>Restriction:</strong> Request restriction of data processing in certain circumstances</li>
                <li><strong>Withdrawal:</strong> Withdraw consent for processing at any time (where consent is the legal basis)</li>
              </ul>
              <p>
                To exercise these rights, please contact us using the information provided in the "Contact Us" section below. 
                We will respond to your request within 30 days and may require verification of your identity for security purposes.
              </p>
            </section>

            <section className="legal-section">
              <h2>6. Data Retention</h2>
              <p>
                We retain your personal data only as long as necessary to provide our services and comply with legal obligations:
              </p>
              <ul>
                <li><strong>Account Data:</strong> Retained while your account is active and for 2 years after account closure</li>
                <li><strong>Security Scan Data:</strong> Retained for 12 months for trend analysis and security improvements</li>
                <li><strong>Legal Records:</strong> Retained as required by applicable laws and regulations</li>
                <li><strong>Communication Records:</strong> Support communications retained for 3 years for quality assurance</li>
              </ul>
              <p>
                After the retention period expires, data is securely deleted using industry-standard data destruction methods.
              </p>
            </section>

            <section className="legal-section">
              <h2>7. International Data Transfers</h2>
              <p>
                Your data may be transferred to and processed in countries other than your country of residence. 
                We ensure adequate protection through appropriate safeguards, including:
              </p>
              <ul>
                <li>Standard contractual clauses approved by relevant data protection authorities</li>
                <li>Adequacy decisions by the European Commission or other relevant authorities</li>
                <li>Certification schemes and codes of conduct</li>
                <li>Binding corporate rules for intra-group transfers</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>8. Cookies and Tracking Technologies</h2>
              <p>We use the following types of cookies and tracking technologies:</p>
              <ul>
                <li><strong>Essential Cookies:</strong> Required for basic platform functionality and security</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our platform</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                <li><strong>Security Cookies:</strong> Detect fraudulent activity and enhance platform security</li>
              </ul>
              <p>
                You can control cookie preferences through your browser settings. Note that disabling essential 
                cookies may impact platform functionality.
              </p>
            </section>

            <section className="legal-section">
              <h2>9. Third-Party Services</h2>
              <p>
                Our platform may integrate with third-party services for enhanced functionality. These services 
                have their own privacy policies, and we encourage you to review them. We are not responsible 
                for the privacy practices of third-party services.
              </p>
            </section>

            <section className="legal-section">
              <h2>10. Children's Privacy</h2>
              <p>
                Our services are not intended for children under 16 years of age. We do not knowingly collect 
                personal information from children under 16. If we become aware that we have collected personal 
                information from a child under 16, we will take steps to delete such information promptly.
              </p>
            </section>

            <section className="legal-section">
              <h2>11. Data Breach Notification</h2>
              <p>
                In the unlikely event of a data breach that affects your personal information, we will:
              </p>
              <ul>
                <li>Notify relevant authorities within 72 hours as required by law</li>
                <li>Inform affected users promptly via email or platform notification</li>
                <li>Provide details about the nature of the breach and steps taken to address it</li>
                <li>Offer guidance on protective measures you can take</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>12. Changes to This Policy</h2>
              <p>
                We may update this privacy policy periodically to reflect changes in our practices or for legal, 
                operational, or regulatory reasons. We will:
              </p>
              <ul>
                <li>Notify you of material changes via email or prominent platform notices</li>
                <li>Post the updated policy on our website with the revision date</li>
                <li>Provide a summary of key changes when significant updates are made</li>
                <li>Allow a reasonable period for you to review changes before they take effect</li>
              </ul>
              <p>
                Continued use of our services after changes take effect constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="legal-section">
              <h2>13. Contact Us</h2>
              <p>
                For privacy-related questions, to exercise your rights, or to report privacy concerns, 
                please contact us:
              </p>
              <div className="contact-info">
                <p><strong>Email:</strong> skillissue.capstone@gmail.com</p>
                <p><strong>Subject Line:</strong> Privacy Policy Inquiry - AT-AT Platform</p>
                <p><strong>Response Time:</strong> We aim to respond within 48 hours</p>
                <button 
                  onClick={handleEmailContact} 
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
                  📧 Send Privacy Inquiry
                </button>
              </div>
              <p>
                <strong>Privacy Officer:</strong> For complex privacy matters, you may request to speak with our 
                designated privacy officer who can provide specialized assistance with data protection concerns.
              </p>
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

export default PrivacyPolicy;
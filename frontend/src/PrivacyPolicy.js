import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from './App';
import Logo from "./components/Logo";
import './LegalPages.css';

/**
 * Privacy Policy Component
 * 
 * Displays comprehensive privacy policy for AT-AT platform.
 * Features:
 * - Clear data handling practices
 * - User rights and controls
 * - Security measures
 * - Contact information for privacy concerns
 */
const PrivacyPolicy = () => {
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
            <h1>Privacy Policy</h1>
            <p className="last-updated">Last updated: September 27, 2025</p>
          </div>

          <div className="legal-body">
            <section className="legal-section">
              <h2>1. Information We Collect</h2>
              <h3>Account Information</h3>
              <p>When you create an AT-AT account, we collect information such as your name, email address, and company information to provide our API security testing services.</p>
              
              <h3>API Data</h3>
              <p>We collect and analyze API endpoint information, security scan results, and vulnerability data necessary to provide our security testing services. This data is processed securely and used solely for security analysis purposes.</p>
              
              <h3>Usage Information</h3>
              <p>We automatically collect information about how you use our platform, including scan frequency, feature usage, and performance metrics to improve our services.</p>
            </section>

            <section className="legal-section">
              <h2>2. How We Use Your Information</h2>
              <ul>
                <li>Provide and maintain our API security testing services</li>
                <li>Perform security scans and vulnerability assessments</li>
                <li>Send you security reports and platform notifications</li>
                <li>Improve our security detection algorithms</li>
                <li>Provide customer support and technical assistance</li>
                <li>Comply with legal obligations and security requirements</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>3. Data Security</h2>
              <p>We implement industry-standard security measures to protect your data:</p>
              <ul>
                <li>End-to-end encryption for all data transmission</li>
                <li>Secure storage with AES-256 encryption</li>
                <li>Regular security audits and penetration testing</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Data retention policies and secure deletion procedures</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>4. Data Sharing</h2>
              <p>We do not sell, trade, or otherwise transfer your personal information to third parties except:</p>
              <ul>
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and prevent fraud</li>
                <li>With trusted service providers who assist in operating our platform (under strict confidentiality agreements)</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>5. Your Rights</h2>
              <p>You have the following rights regarding your personal data:</p>
              <ul>
                <li><strong>Access:</strong> Request copies of your personal data</li>
                <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
                <li><strong>Erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Request transfer of your data</li>
                <li><strong>Objection:</strong> Object to processing of your data</li>
                <li><strong>Restriction:</strong> Request restriction of data processing</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>6. Data Retention</h2>
              <p>We retain your personal data only as long as necessary to provide our services and comply with legal obligations. Security scan data is typically retained for 12 months for trend analysis, after which it is securely deleted unless required for ongoing security purposes.</p>
            </section>

            <section className="legal-section">
              <h2>7. International Transfers</h2>
              <p>Your data may be transferred to and processed in countries other than your country of residence. We ensure adequate protection through appropriate safeguards, including standard contractual clauses and adequacy decisions.</p>
            </section>

            <section className="legal-section">
              <h2>8. Cookies and Tracking</h2>
              <p>We use essential cookies to operate our platform and optional analytics cookies to improve our services. You can control cookie preferences through your browser settings.</p>
            </section>

            <section className="legal-section">
              <h2>9. Children's Privacy</h2>
              <p>Our services are not intended for children under 16 years of age. We do not knowingly collect personal information from children under 16.</p>
            </section>

            <section className="legal-section">
              <h2>10. Changes to This Policy</h2>
              <p>We may update this privacy policy periodically. We will notify you of material changes via email or platform notifications. Continued use of our services after changes constitutes acceptance of the updated policy.</p>
            </section>

            <section className="legal-section">
              <h2>11. Contact Us</h2>
              <p>For privacy-related questions or to exercise your rights, contact us at:</p>
              <div className="contact-info">
                <p><strong>Email:</strong> skillissue.capstone@gmail.com</p>
                <p><strong>Subject Line:</strong> Privacy Policy Inquiry</p>
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
            <Link to="/security">Security</Link>
            <Link to="/contact">Contact Us</Link>
          </div>
          <p>&copy; 2025 AT-AT (API Threat Assessment Tool). All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
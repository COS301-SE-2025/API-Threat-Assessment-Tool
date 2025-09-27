import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from './App';
import Logo from "./components/Logo";
import './LegalPages.css';

/**
 * Terms of Service Component
 * 
 * Displays comprehensive terms and conditions for AT-AT platform.
 * Features:
 * - Service usage terms and conditions
 * - User responsibilities and obligations
 * - Limitation of liability
 * - Account management policies
 */
const TermsOfService = () => {
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
            <h1>Terms of Service</h1>
            <p className="last-updated">Last updated: September 27, 2025</p>
          </div>

          <div className="legal-body">
            <section className="legal-section">
              <h2>1. Acceptance of Terms</h2>
              <p>By accessing and using AT-AT (API Threat Assessment Tool), you accept and agree to be bound by the terms and provision of this agreement. These Terms of Service constitute a legally binding agreement between you and AT-AT.</p>
            </section>

            <section className="legal-section">
              <h2>2. Description of Service</h2>
              <p>AT-AT provides API security testing and vulnerability assessment services. Our platform helps organizations identify security weaknesses, ensure OWASP compliance, and protect their digital assets through automated and comprehensive security testing.</p>
            </section>

            <section className="legal-section">
              <h2>3. User Accounts and Registration</h2>
              <h3>Account Creation</h3>
              <p>To use our services, you must create an account by providing accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials.</p>
              
              <h3>Account Responsibilities</h3>
              <ul>
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and update your account information</li>
                <li>Maintain the security of your password and account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>4. Acceptable Use Policy</h2>
              <h3>Permitted Uses</h3>
              <p>You may use AT-AT to:</p>
              <ul>
                <li>Test APIs that you own or have explicit permission to test</li>
                <li>Conduct security assessments for legitimate business purposes</li>
                <li>Generate security reports for compliance and risk management</li>
                <li>Access educational resources and documentation</li>
              </ul>

              <h3>Prohibited Activities</h3>
              <p>You agree not to:</p>
              <ul>
                <li>Test APIs without proper authorization</li>
                <li>Use our services for illegal or malicious purposes</li>
                <li>Attempt to bypass security measures or access restrictions</li>
                <li>Interfere with the operation of our platform</li>
                <li>Upload malicious code, viruses, or harmful content</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Reverse engineer or decompile our software</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>5. Data and Privacy</h2>
              <p>Your use of AT-AT is governed by our Privacy Policy, which is incorporated into these Terms by reference. You retain ownership of your data, and we process it solely to provide our security testing services.</p>
              
              <h3>Data Security</h3>
              <p>We implement appropriate technical and organizational measures to protect your data, but you acknowledge that no system is completely secure.</p>
            </section>

            <section className="legal-section">
              <h2>6. Intellectual Property</h2>
              <h3>Our Intellectual Property</h3>
              <p>AT-AT and all related technology, content, and materials are protected by intellectual property rights. You receive a limited, non-exclusive license to use our services for their intended purpose.</p>
              
              <h3>Your Content</h3>
              <p>You retain ownership of any content you provide to our platform. By using our services, you grant us a limited license to process your data for security testing purposes.</p>
            </section>

            <section className="legal-section">
              <h2>7. Service Availability and Modifications</h2>
              <h3>Service Availability</h3>
              <p>We strive to maintain service availability but cannot guarantee uninterrupted access. We may temporarily suspend services for maintenance, updates, or security reasons.</p>
              
              <h3>Service Modifications</h3>
              <p>We may modify, update, or discontinue features of our service at any time. We will provide reasonable notice of significant changes that affect your use of the platform.</p>
            </section>

            <section className="legal-section">
              <h2>8. Limitation of Liability</h2>
              <p>To the maximum extent permitted by law:</p>
              <ul>
                <li>AT-AT provides services "as is" without warranties of any kind</li>
                <li>We shall not be liable for indirect, incidental, or consequential damages</li>
                <li>Our total liability shall not exceed the amount you paid for our services</li>
                <li>We do not warrant that our services will be error-free or uninterrupted</li>
                <li>You assume responsibility for your use of security testing results</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>9. Indemnification</h2>
              <p>You agree to indemnify and hold harmless AT-AT from any claims, damages, or expenses arising from:</p>
              <ul>
                <li>Your use of our services in violation of these Terms</li>
                <li>Your violation of any law or third-party rights</li>
                <li>Unauthorized testing of APIs or systems</li>
                <li>Any content you provide to our platform</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>10. Termination</h2>
              <h3>By You</h3>
              <p>You may terminate your account at any time by contacting us or using account deletion features.</p>
              
              <h3>By AT-AT</h3>
              <p>We may suspend or terminate your account for:</p>
              <ul>
                <li>Violation of these Terms of Service</li>
                <li>Non-payment of fees</li>
                <li>Fraudulent or illegal activity</li>
                <li>Extended periods of inactivity</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>11. Governing Law and Disputes</h2>
              <p>These Terms are governed by the laws of [Your Jurisdiction]. Any disputes will be resolved through binding arbitration or in the courts of [Your Jurisdiction].</p>
            </section>

            <section className="legal-section">
              <h2>12. Changes to Terms</h2>
              <p>We may update these Terms periodically. Material changes will be communicated via email or platform notifications. Continued use after changes constitutes acceptance of the updated Terms.</p>
            </section>

            <section className="legal-section">
              <h2>13. Contact Information</h2>
              <p>For questions about these Terms of Service, contact us at:</p>
              <div className="contact-info">
                <p><strong>Email:</strong> skillissue.capstone@gmail.com</p>
                <p><strong>Subject Line:</strong> Terms of Service Inquiry</p>
              </div>
            </section>

            <section className="legal-section">
              <h2>14. Severability</h2>
              <p>If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.</p>
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

export default TermsOfService;
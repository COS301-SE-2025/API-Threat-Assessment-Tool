import React, { useContext, useEffect } from 'react';
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
 * - Consistent navigation and theming
 * - Enhanced user experience with email contact functionality
 */
const TermsOfService = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleEmailContact = () => {
    const subject = encodeURIComponent('Terms of Service Inquiry - AT-AT Platform');
    const body = encodeURIComponent('Hello AT-AT Team,\n\nI have a question regarding your terms of service:\n\n[Please describe your inquiry here]\n\nThank you for your time.');
    window.open(`mailto:skillissue.capstone@gmail.com?subject=${subject}&body=${body}`, '_blank');
  };

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
            <h1>Terms of Service</h1>
            <p className="last-updated">Last updated: September 27, 2025</p>
          </div>

          <div className="legal-body">
            <div className="highlight-box">
              <p>
                <strong>Important Legal Agreement:</strong> These terms govern your use of AT-AT. 
                Please read them carefully as they contain important information about your rights and obligations.
              </p>
            </div>

            <section className="legal-section">
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing and using AT-AT (API Threat Assessment Tool), you accept and agree to be bound by 
                the terms and provision of this agreement. These Terms of Service constitute a legally binding 
                agreement between you and AT-AT. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section className="legal-section">
              <h2>2. Description of Service</h2>
              <p>
                AT-AT provides comprehensive API security testing and vulnerability assessment services. Our platform 
                helps organizations identify security weaknesses, ensure OWASP compliance, and protect their digital 
                assets through automated and comprehensive security testing methodologies.
              </p>
              <p>
                Our services include but are not limited to: automated vulnerability scanning, security report generation, 
                compliance checking, and educational resources for API security best practices.
              </p>
            </section>

            <section className="legal-section">
              <h2>3. User Accounts and Registration</h2>
              
              <h3>Account Creation</h3>
              <p>
                To use our services, you must create an account by providing accurate and complete information. 
                You are responsible for maintaining the confidentiality of your account credentials and for all 
                activities that occur under your account.
              </p>
              
              <h3>Account Responsibilities</h3>
              <p>By creating an account, you agree to:</p>
              <ul>
                <li><strong>Accuracy:</strong> Provide accurate, current, and complete information during registration</li>
                <li><strong>Maintenance:</strong> Maintain and promptly update your account information</li>
                <li><strong>Security:</strong> Maintain the security of your password and account credentials</li>
                <li><strong>Notification:</strong> Notify us immediately of any unauthorized use of your account</li>
                <li><strong>Responsibility:</strong> Accept responsibility for all activities under your account</li>
                <li><strong>Age Requirement:</strong> Confirm that you are at least 18 years old or have parental consent</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>4. Acceptable Use Policy</h2>
              
              <h3>Permitted Uses</h3>
              <p>You may use AT-AT to:</p>
              <ul>
                <li><strong>Authorized Testing:</strong> Test APIs that you own or have explicit written permission to test</li>
                <li><strong>Security Assessments:</strong> Conduct legitimate security assessments for business purposes</li>
                <li><strong>Compliance:</strong> Generate security reports for compliance and risk management</li>
                <li><strong>Education:</strong> Access educational resources and documentation for learning purposes</li>
                <li><strong>Research:</strong> Conduct security research within legal and ethical boundaries</li>
              </ul>

              <h3>Prohibited Activities</h3>
              <p>You agree not to:</p>
              <ul>
                <li><strong>Unauthorized Testing:</strong> Test APIs without proper authorization or consent</li>
                <li><strong>Illegal Activities:</strong> Use our services for illegal, fraudulent, or malicious purposes</li>
                <li><strong>Security Bypass:</strong> Attempt to bypass security measures or access restrictions</li>
                <li><strong>Platform Interference:</strong> Interfere with the operation or security of our platform</li>
                <li><strong>Malicious Content:</strong> Upload malicious code, viruses, or harmful content</li>
                <li><strong>Law Violations:</strong> Violate any applicable laws, regulations, or third-party rights</li>
                <li><strong>Reverse Engineering:</strong> Reverse engineer, decompile, or disassemble our software</li>
                <li><strong>Data Mining:</strong> Use automated systems to extract data without permission</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>5. Data and Privacy</h2>
              <p>
                Your use of AT-AT is governed by our Privacy Policy, which is incorporated into these Terms by reference. 
                You retain ownership of your data, and we process it solely to provide our security testing services.
              </p>
              
              <h3>Data Security</h3>
              <p>
                We implement appropriate technical and organizational measures to protect your data, including encryption, 
                access controls, and regular security audits. However, you acknowledge that no system is completely secure, 
                and you use our services at your own risk.
              </p>

              <h3>Data Retention</h3>
              <p>
                We retain your data only as long as necessary to provide services and comply with legal obligations. 
                You may request data deletion in accordance with our Privacy Policy.
              </p>
            </section>

            <section className="legal-section">
              <h2>6. Intellectual Property</h2>
              
              <h3>Our Intellectual Property</h3>
              <p>
                AT-AT and all related technology, content, materials, trademarks, and intellectual property are owned by 
                AT-AT and protected by applicable intellectual property laws. You receive a limited, non-exclusive, 
                non-transferable license to use our services for their intended purpose.
              </p>
              
              <h3>Your Content</h3>
              <p>
                You retain ownership of any content, data, or information you provide to our platform. By using our 
                services, you grant us a limited, non-exclusive license to process your data for security testing 
                purposes and to provide our services to you.
              </p>

              <h3>Respect for Third-Party Rights</h3>
              <p>
                You agree to respect the intellectual property rights of others and not to use our services in a way 
                that infringes upon third-party rights.
              </p>
            </section>

            <section className="legal-section">
              <h2>7. Service Availability and Modifications</h2>
              
              <h3>Service Availability</h3>
              <p>
                We strive to maintain high service availability but cannot guarantee uninterrupted access. We may 
                temporarily suspend services for maintenance, updates, security reasons, or force majeure events.
              </p>
              
              <h3>Service Modifications</h3>
              <p>
                We reserve the right to modify, update, or discontinue features of our service at any time. We will 
                provide reasonable notice of significant changes that materially affect your use of the platform.
              </p>

              <h3>Planned Maintenance</h3>
              <p>
                Scheduled maintenance will be announced in advance when possible. Emergency maintenance may be 
                performed without prior notice when necessary for security or operational reasons.
              </p>
            </section>

            <section className="legal-section">
              <h2>8. Limitation of Liability</h2>
              <p>To the maximum extent permitted by applicable law:</p>
              <ul>
                <li><strong>As-Is Service:</strong> AT-AT provides services "as is" and "as available" without warranties of any kind</li>
                <li><strong>No Consequential Damages:</strong> We shall not be liable for indirect, incidental, special, or consequential damages</li>
                <li><strong>Liability Cap:</strong> Our total liability shall not exceed the amount you paid for our services in the 12 months preceding the claim</li>
                <li><strong>No Guarantees:</strong> We do not warrant that our services will be error-free, uninterrupted, or secure</li>
                <li><strong>User Responsibility:</strong> You assume responsibility for your use of security testing results and any actions taken based on them</li>
                <li><strong>Third-Party Content:</strong> We are not responsible for third-party content, services, or websites</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>9. Indemnification</h2>
              <p>You agree to indemnify, defend, and hold harmless AT-AT, its officers, directors, employees, and agents from any claims, damages, costs, or expenses (including reasonable attorney fees) arising from:</p>
              <ul>
                <li><strong>Terms Violation:</strong> Your use of our services in violation of these Terms</li>
                <li><strong>Law Violation:</strong> Your violation of any law, regulation, or third-party rights</li>
                <li><strong>Unauthorized Testing:</strong> Unauthorized testing of APIs, systems, or networks</li>
                <li><strong>User Content:</strong> Any content, data, or information you provide to our platform</li>
                <li><strong>Negligent Acts:</strong> Your negligent or wrongful acts or omissions</li>
                <li><strong>Third-Party Claims:</strong> Any third-party claims related to your use of our services</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>10. Termination</h2>
              
              <h3>Termination by You</h3>
              <p>
                You may terminate your account at any time by contacting us or using account deletion features. 
                Upon termination, your access to the services will cease, and we will delete your data in accordance 
                with our Privacy Policy.
              </p>
              
              <h3>Termination by AT-AT</h3>
              <p>We may suspend or terminate your account immediately for:</p>
              <ul>
                <li><strong>Terms Violation:</strong> Material violation of these Terms of Service</li>
                <li><strong>Payment Issues:</strong> Non-payment of fees or fraudulent payment activity</li>
                <li><strong>Illegal Activity:</strong> Fraudulent, illegal, or harmful activity</li>
                <li><strong>Security Risks:</strong> Activities that pose security risks to our platform or users</li>
                <li><strong>Inactivity:</strong> Extended periods of inactivity (with prior notice)</li>
              </ul>

              <h3>Effect of Termination</h3>
              <p>
                Upon termination, all rights and licenses granted to you will cease, and you must stop using our services. 
                Provisions that by their nature should survive termination will remain in effect.
              </p>
            </section>

            <section className="legal-section">
              <h2>11. Governing Law and Disputes</h2>
              <p>
                These Terms are governed by and construed in accordance with the laws of South Africa, without regard 
                to conflict of law principles. Any disputes arising from these Terms or your use of our services will 
                be resolved through binding arbitration or in the competent courts of South Africa.
              </p>
              
              <h3>Dispute Resolution</h3>
              <p>
                Before initiating formal proceedings, parties agree to attempt good-faith negotiations to resolve disputes. 
                If negotiations fail, disputes will be resolved through binding arbitration under the rules of the 
                applicable arbitration authority.
              </p>
            </section>

            <section className="legal-section">
              <h2>12. Changes to Terms</h2>
              <p>
                We may update these Terms periodically to reflect changes in our services, legal requirements, or 
                business practices. Material changes will be communicated via:
              </p>
              <ul>
                <li>Email notification to registered users</li>
                <li>Prominent notices on our platform</li>
                <li>Updated terms posted on our website</li>
              </ul>
              <p>
                Continued use of our services after changes take effect constitutes acceptance of the updated Terms. 
                If you do not agree to the changes, you may terminate your account.
              </p>
            </section>

            <section className="legal-section">
              <h2>13. Contact Information</h2>
              <p>For questions about these Terms of Service, contact us:</p>
              <div className="contact-info">
                <p><strong>Email:</strong> skillissue.capstone@gmail.com</p>
                <p><strong>Subject Line:</strong> Terms of Service Inquiry - AT-AT Platform</p>
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
                  📧 Send Terms Inquiry
                </button>
              </div>
            </section>

            <section className="legal-section">
              <h2>14. Severability and Waiver</h2>
              <h3>Severability</h3>
              <p>
                If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining 
                provisions will continue in full force and effect, and the invalid provision will be modified to 
                the minimum extent necessary to make it valid and enforceable.
              </p>
              
              <h3>Waiver</h3>
              <p>
                Our failure to enforce any provision of these Terms does not constitute a waiver of that provision 
                or any other provision. Any waiver must be in writing and signed by an authorized representative.
              </p>
            </section>

            <section className="legal-section">
              <h2>15. Entire Agreement</h2>
              <p>
                These Terms, together with our Privacy Policy and any other policies referenced herein, constitute 
                the entire agreement between you and AT-AT regarding your use of our services and supersede all 
                prior agreements and understandings.
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

export default TermsOfService;
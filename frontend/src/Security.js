import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from './App';
import Logo from "./components/Logo";
import './LegalPages.css';

/**
 * Security Page Component
 * 
 * Displays comprehensive security practices and measures for AT-AT platform.
 * Features:
 * - Platform security architecture
 * - Data protection measures
 * - Compliance standards
 * - Security incident reporting
 */
const Security = () => {
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
            <h1>Security</h1>
            <p className="last-updated">Last updated: September 27, 2025</p>
            <p className="security-intro">At AT-AT, security is at the core of everything we do. We implement comprehensive security measures to protect your data and maintain the integrity of our API security testing platform.</p>
          </div>

          <div className="legal-body">
            <section className="legal-section">
              <h2>🔒 Data Protection</h2>
              <h3>Encryption Standards</h3>
              <ul>
                <li><strong>Data in Transit:</strong> All data transmission uses TLS 1.3 encryption</li>
                <li><strong>Data at Rest:</strong> AES-256 encryption for all stored data</li>
                <li><strong>Database Encryption:</strong> Full database encryption with rotating keys</li>
                <li><strong>Backup Security:</strong> Encrypted backups with secure key management</li>
              </ul>

              <h3>Access Controls</h3>
              <ul>
                <li>Multi-factor authentication (MFA) for all user accounts</li>
                <li>Role-based access control (RBAC) with principle of least privilege</li>
                <li>Regular access reviews and automated deprovisioning</li>
                <li>Session management with secure timeout policies</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>🏗️ Infrastructure Security</h2>
              <h3>Cloud Architecture</h3>
              <p>Our platform is built on enterprise-grade cloud infrastructure with:</p>
              <ul>
                <li>Isolated network environments with VPC segmentation</li>
                <li>Web Application Firewall (WAF) protection</li>
                <li>DDoS protection and traffic filtering</li>
                <li>Automated security patching and updates</li>
                <li>Container security with runtime protection</li>
              </ul>

              <h3>Monitoring and Detection</h3>
              <ul>
                <li>24/7 security monitoring with SIEM integration</li>
                <li>Real-time threat detection and alerting</li>
                <li>Automated incident response workflows</li>
                <li>Log retention and forensic capabilities</li>
                <li>Vulnerability scanning and penetration testing</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>🛡️ Application Security</h2>
              <h3>Secure Development Lifecycle</h3>
              <p>We follow industry best practices for secure software development:</p>
              <ul>
                <li>Security code reviews and static analysis</li>
                <li>Dynamic application security testing (DAST)</li>
                <li>Dependency scanning and vulnerability management</li>
                <li>Secure coding standards and training</li>
                <li>Regular security assessments and audits</li>
              </ul>

              <h3>API Security</h3>
              <ul>
                <li>OAuth 2.0 and JWT token-based authentication</li>
                <li>Rate limiting and throttling mechanisms</li>
                <li>Input validation and sanitization</li>
                <li>API versioning and deprecation policies</li>
                <li>Comprehensive API security testing</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>📋 Compliance and Standards</h2>
              <h3>Security Frameworks</h3>
              <p>AT-AT adheres to recognized security frameworks and standards:</p>
              <ul>
                <li><strong>OWASP:</strong> Following OWASP Top 10 and ASVS guidelines</li>
                <li><strong>ISO 27001:</strong> Information security management principles</li>
                <li><strong>SOC 2 Type II:</strong> Security, availability, and confidentiality controls</li>
                <li><strong>NIST Framework:</strong> Cybersecurity risk management practices</li>
                <li><strong>GDPR:</strong> Data protection and privacy compliance</li>
              </ul>

              <h3>Regular Assessments</h3>
              <ul>
                <li>Annual third-party security audits</li>
                <li>Quarterly penetration testing</li>
                <li>Continuous vulnerability assessments</li>
                <li>Compliance monitoring and reporting</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>🔐 Data Handling Practices</h2>
              <h3>Data Minimization</h3>
              <p>We collect and process only the minimum data necessary to provide our security testing services:</p>
              <ul>
                <li>API metadata for security analysis</li>
                <li>Scan results and vulnerability reports</li>
                <li>User account and authentication data</li>
                <li>Platform usage and performance metrics</li>
              </ul>

              <h3>Data Retention</h3>
              <ul>
                <li>Security scan data: 12 months (configurable)</li>
                <li>Audit logs: 7 years for compliance</li>
                <li>User account data: Duration of account plus 30 days</li>
                <li>Automated deletion processes for expired data</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>🚨 Incident Response</h2>
              <h3>Security Incident Management</h3>
              <p>We maintain a comprehensive incident response program:</p>
              <ul>
                <li>24/7 security operations center (SOC)</li>
                <li>Defined incident classification and escalation procedures</li>
                <li>Forensic investigation capabilities</li>
                <li>Customer notification protocols</li>
                <li>Post-incident analysis and improvement processes</li>
              </ul>

              <h3>Reporting Security Issues</h3>
              <p>If you discover a security vulnerability or have security concerns:</p>
              <div className="contact-info security-contact">
                <p><strong>Security Email:</strong> skillissue.capstone@gmail.com</p>
                <p><strong>Subject Line:</strong> [SECURITY] - Brief Description</p>
                <p><strong>Response Time:</strong> We acknowledge security reports within 24 hours</p>
              </div>
            </section>

            <section className="legal-section">
              <h2>👥 Employee Security</h2>
              <h3>Personnel Security</h3>
              <ul>
                <li>Background checks for all employees with data access</li>
                <li>Regular security awareness training</li>
                <li>Secure development training for engineering teams</li>
                <li>Confidentiality agreements and security policies</li>
                <li>Regular security culture assessments</li>
              </ul>

              <h3>Access Management</h3>
              <ul>
                <li>Principle of least privilege for all system access</li>
                <li>Regular access reviews and certifications</li>
                <li>Automated provisioning and deprovisioning</li>
                <li>Privileged access management (PAM) systems</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>🔄 Business Continuity</h2>
              <h3>Disaster Recovery</h3>
              <ul>
                <li>Multi-region data backup and replication</li>
                <li>Automated failover capabilities</li>
                <li>Regular disaster recovery testing</li>
                <li>Business continuity planning and procedures</li>
                <li>Recovery time objective (RTO): 4 hours</li>
                <li>Recovery point objective (RPO): 1 hour</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>📞 Security Contact</h2>
              <p>For security-related inquiries, vulnerability reports, or incident notifications:</p>
              <div className="contact-info">
                <p><strong>Email:</strong> skillissue.capstone@gmail.com</p>
                <p><strong>Security Reports:</strong> Use subject line [SECURITY]</p>
                <p><strong>Response Time:</strong> 24 hours for security issues</p>
                <p><strong>PGP Key:</strong> Available upon request</p>
              </div>
            </section>

            <section className="legal-section">
              <h2>📋 Security Updates</h2>
              <p>This security documentation is reviewed and updated regularly to reflect our current security practices. For the most up-to-date information about our security measures, please check this page periodically or contact our security team.</p>
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

export default Security;
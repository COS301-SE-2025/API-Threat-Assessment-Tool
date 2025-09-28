import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from './App';
import { useAuth } from './AuthContext';
import Logo from "./components/Logo";
import './LandingPage.css';

/**
 * Landing Page Component
 * 
 * Public marketing page that introduces AT-AT to potential users.
 * Features:
 * - Hero section with compelling value proposition
 * - Feature highlights and benefits
 * - Social proof and statistics
 * - Clear call-to-action for signup
 * - Responsive design with animations
 * - Theme-aware styling
 */
const LandingPage = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { isAuthenticated } = useAuth();
  const [isVisible, setIsVisible] = useState({});

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated()) {
      window.location.href = '/dashboard';
    }
  }, [isAuthenticated]);

  // Intersection Observer for scroll animations
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

  // Statistics data - focused on value proposition
  const statistics = [
    { number: 'Free', label: 'During Beta', icon: '🎉' },
    { number: 'OWASP', label: 'Compliant', icon: '🛡️' },
    { number: 'Complete', label: 'Coverage', icon: '🔍' },
    { number: '5min', label: 'Setup', icon: '⏰' }
  ];

  // Feature highlights
  const features = [
    {
      icon: '🔍',
      title: 'Comprehensive Security Scanning',
      description: 'Advanced vulnerability detection covering OWASP Top 10, injection attacks, authentication flaws, and custom security patterns.',
      benefits: ['OWASP Top 10 Coverage', 'Custom Security Rules', 'Real-time Scanning']
    },
    {
      icon: '⚙️',
      title: 'Intelligent Automation',
      description: 'Automated testing workflows that adapt to your API architecture with minimal configuration required.',
      benefits: ['Zero-Config Setup', 'Smart Detection', 'Auto-scaling']
    },
    {
      icon: '📊',
      title: 'Actionable Insights',
      description: 'Detailed reports with risk prioritization, step-by-step remediation guides, and compliance mapping.',
      benefits: ['Risk Prioritization', 'Remediation Guides', 'Compliance Reports']
    }
  ];

  // Current offering tiers (free beta)
  const offeringTiers = [
    {
      name: 'Beta Access',
      price: 'Free',
      period: 'during beta',
      description: 'Full access to all features',
      features: [
        'Unlimited API endpoints',
        'Complete OWASP Top 10 testing',
        'Custom scan profiles',
        'Detailed security reports',
        'Community support',
        'Beta feature previews',
        'Feedback directly to dev team'
      ],
      cta: 'Join Beta Now',
      popular: true
    },
    {
      name: 'Future Pro',
      price: 'TBD',
      period: 'post-launch',
      description: 'Enhanced features for teams',
      features: [
        'Everything in Beta',
        'Priority support',
        'Advanced integrations',
        'Team collaboration tools',
        'Custom compliance frameworks',
        'API for automation',
        'Enterprise security features'
      ],
      cta: 'Get Notified',
      popular: false
    },
    {
      name: 'Enterprise',
      price: 'Contact',
      period: 'for organizations',
      description: 'Tailored for large teams',
      features: [
        'Everything in Pro',
        'Dedicated support',
        'On-premise deployment',
        'SSO integration',
        'Custom security rules',
        'Advanced compliance reporting',
        'Professional services'
      ],
      cta: 'Contact Us',
      popular: false
    }
  ];

  return (
    <div className="landing-container">
      {/* Navigation Header */}
      <header className="landing-header">
        <div className="header-content">
          <div className="logo-section">
            <Logo />
            <span className="brand-tagline">API Security Made Simple</span>
          </div>
          <nav className="landing-nav">
            <a href="#features">Features</a>
            <a href="#pricing">Beta Access</a>
            <a href="#community">Community</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="header-actions">
            <button onClick={toggleDarkMode} className="theme-toggle" title="Toggle Theme">
              <span className="theme-icon">{darkMode ? '☀️' : '🌙'}</span>
            </button>
            <Link to="/login" className="login-link">Login</Link>
            <Link to="/signup" className="signup-btn">Get Started Free</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <p></p> {/* Empty paragraph added here */}
            <h1 className="hero-title">
              Secure Your APIs with 
              <span className="gradient-text"> Confidence </span>
            </h1>
            <p className="hero-description">
              AT-AT is a comprehensive API security testing platform that helps developers and security teams 
              identify vulnerabilities, ensure OWASP compliance, and protect their digital assets. 
              Currently in beta with full access to all features - completely free during development.
            </p>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">Free</span>
                <span className="stat-label">Beta Access</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">OWASP</span>
                <span className="stat-label">Standards</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">5min</span>
                <span className="stat-label">Quick Setup</span>
              </div>
            </div>
            <div className="hero-actions">
              <Link to="/signup" className="cta-primary">
                🚀 Join Beta Program
              </Link>
              <a href="#community" className="cta-secondary">
                📖 Learn More
              </a>
            </div>
            <div className="trust-indicators">
              <span>✓ Completely free during beta</span>
              <span>✓ 5-minute setup</span>
              <span>✓ OWASP compliant</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="security-dashboard">
              <div className="dashboard-header">
                <div className="dashboard-title">Security Dashboard</div>
                <div className="dashboard-status">🟢 All Systems Secure</div>
              </div>
              <div className="dashboard-content">
                <div className="security-metric">
                  <span className="metric-label">Vulnerabilities Found</span>
                  <span className="metric-value success">0 Critical</span>
                </div>
                <div className="security-metric">
                  <span className="metric-label">APIs Scanned</span>
                  <span className="metric-value">23 Endpoints</span>
                </div>
                <div className="security-metric">
                  <span className="metric-label">Last Scan</span>
                  <span className="metric-value">2 minutes ago</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section 
        id="stats-section" 
        className={`stats-section animate-on-scroll ${isVisible['stats-section'] ? 'visible' : ''}`}
      >
        <div className="stats-grid">
          {statistics.map((stat, index) => (
            <div key={index} className="stat-card" style={{animationDelay: `${index * 0.1}s`}}>
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section 
        id="features" 
        className={`features-section animate-on-scroll ${isVisible['features'] ? 'visible' : ''}`}
      >
        <div className="section-header">
          <h2>Why Choose AT-AT?</h2>
          <p>Comprehensive API security testing that scales with your needs</p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card" style={{animationDelay: `${index * 0.2}s`}}>
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <ul className="feature-benefits">
                {feature.benefits.map((benefit, idx) => (
                  <li key={idx}>✓ {benefit}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section 
        id="how-it-works" 
        className={`how-it-works-section animate-on-scroll ${isVisible['how-it-works'] ? 'visible' : ''}`}
      >
        <div className="section-header">
          <h2>Get Started in Minutes</h2>
          <p>Simple, powerful API security testing in just a few steps</p>
        </div>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Import Your API</h3>
              <p>Upload OpenAPI specs, Postman collections, or manually configure endpoints</p>
            </div>
          </div>
          <div className="step-connector"></div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Configure Scan</h3>
              <p>Choose from OWASP profiles or create custom security test suites</p>
            </div>
          </div>
          <div className="step-connector"></div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Run Tests</h3>
              <p>AT-AT automatically tests your APIs for vulnerabilities and compliance</p>
            </div>
          </div>
          <div className="step-connector"></div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Get Results</h3>
              <p>Receive detailed reports with prioritized fixes and remediation steps</p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section 
        id="community" 
        className={`testimonials-section animate-on-scroll ${isVisible['community'] ? 'visible' : ''}`}
      >
        <div className="section-header">
          <h2>Join Our Community</h2>
          <p>Be part of the future of API security testing</p>
        </div>
        <div className="community-container">
          <div className="community-card">
            <div className="community-content">
              <div className="community-icon">🚀</div>
              <h3>Beta Testers</h3>
              <p>Get early access to cutting-edge API security features and directly influence our product roadmap. Your feedback shapes the future of API security testing.</p>
              <Link to="/signup" className="community-cta">Join Beta Program</Link>
            </div>
          </div>
          <div className="community-card">
            <div className="community-content">
              <div className="community-icon">💬</div>
              <h3>Developer Community</h3>
              <p>Connect with security-minded developers, share experiences, and learn best practices for API security in modern applications.</p>
              <a href="#contact" className="community-cta">Get in Touch</a>
            </div>
          </div>
          <div className="community-card">
            <div className="community-content">
              <div className="community-icon">🛡️</div>
              <h3>Security Focus</h3>
              <p>Stay ahead of emerging API security threats with comprehensive testing that covers OWASP Top 10 and custom vulnerability patterns.</p>
              <a href="#features" className="community-cta">Learn More</a>
            </div>
          </div>
        </div>
      </section>

      {/* Offering Section */}
      <section 
        id="pricing" 
        className={`pricing-section animate-on-scroll ${isVisible['pricing'] ? 'visible' : ''}`}
      >
        <div className="section-header">
          <h2>Join Our Beta Program</h2>
          <p>Get full access to AT-AT during our beta phase - completely free</p>
        </div>
        <div className="pricing-grid">
          {offeringTiers.map((tier, index) => (
            <div 
              key={index} 
              className={`pricing-card ${tier.popular ? 'popular' : ''}`}
              style={{animationDelay: `${index * 0.1}s`}}
            >
              {tier.popular && <div className="popular-badge">Most Popular</div>}
              <div className="pricing-header">
                <h3>{tier.name}</h3>
                <div className="price">
                  <span className="price-amount">{tier.price}</span>
                  <span className="price-period">/{tier.period}</span>
                </div>
                <p className="pricing-description">{tier.description}</p>
              </div>
              <ul className="pricing-features">
                {tier.features.map((feature, idx) => (
                  <li key={idx}>✓ {feature}</li>
                ))}
              </ul>
              {tier.name === 'Enterprise' ? (
                <a 
                  href="#contact"
                  className={`pricing-cta ${tier.popular ? 'primary' : 'secondary'}`}
                >
                  {tier.cta}
                </a>
              ) : tier.name === 'Future Pro' ? (
                <a 
                  href="#contact"
                  className={`pricing-cta ${tier.popular ? 'primary' : 'secondary'}`}
                >
                  {tier.cta}
                </a>
              ) : (
                <Link 
                  to="/signup" 
                  className={`pricing-cta ${tier.popular ? 'primary' : 'secondary'}`}
                >
                  {tier.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Secure Your APIs?</h2>
          <p>Join our beta program and get full access to AT-AT - completely free during development</p>
          <div className="cta-actions">
            <Link to="/signup" className="cta-primary large">
              Join Beta Program
            </Link>
            <a href="#community" className="cta-secondary large">
              Learn More
            </a>
          </div>
          <div className="cta-guarantee">
            <span>🆓 Completely free during beta</span>
            <span>🚀 Early access to new features</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-brand">
              <Logo />
              <span className="footer-brand-name">AT-AT</span>
              <p>Comprehensive API security testing platform. Protecting digital assets through advanced vulnerability detection.</p>
            </div>
          </div>
          <div className="footer-section">
            <h4>Product</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Beta Access</a></li>
              <li><a href="/documentation">Documentation</a></li>
              <li><a href="#security">Security</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Community</h4>
            <ul>
              <li><a href="#community">Beta Program</a></li>
              <li><a href="#contact">Feedback</a></li>
              <li><a href="#help">Help Center</a></li>
              <li><a href="#about">About Us</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li><a href="#help">Help Center</a></li>
              <li><a href="#contact">Contact Us</a></li>
              <li><a href="#feedback">Report Issues</a></li>
              <li><a href="#feedback">Feature Requests</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
              <li><a href="#beta-terms">Beta Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 AT-AT (API Threat Assessment Tool). All rights reserved.</p>
          <div className="footer-social">
            <a href="#linkedin" aria-label="LinkedIn">💼</a>
            <a href="#email" aria-label="Email">📧</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
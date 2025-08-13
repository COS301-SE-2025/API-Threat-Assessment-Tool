// ScanReport.js - Professional API Security Scan Report Component
import React from 'react';
import { Link } from 'react-router-dom';
import './ScanReport.css';

const ScanReport = ({ reportData, onBackToDashboard }) => {
  if (!reportData) {
    return (
      <div className="scan-report-container">
        <div className="loading-message">
          <h2>📄 Generating Report...</h2>
          <p>Please wait while we compile your security assessment results.</p>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const getSeverityClass = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'severity-critical';
      case 'HIGH': return 'severity-high';
      case 'MEDIUM': return 'severity-medium';
      case 'LOW': return 'severity-low';
      default: return 'severity-info';
    }
  };

  const getScoreColor = (grade) => {
    switch (grade) {
      case 'A': return 'text-green-600';
      case 'B': return 'text-blue-600';
      case 'C': return 'text-yellow-600';
      case 'D': return 'text-orange-600';
      case 'F': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOWASPCategory = (vulnerabilityType) => {
    const owaspMapping = {
      'SQL Injection': 'API8:2023 - Security Misconfiguration',
      'Authentication Bypass': 'API2:2023 - Broken Authentication',
      'Broken Access Control': 'API1:2023 - Broken Object Level Authorization',
      'Sensitive Data Exposure': 'API3:2023 - Broken Object Property Level Authorization',
      'Rate Limiting Missing': 'API4:2023 - Unrestricted Resource Consumption',
      'Weak Encryption': 'API8:2023 - Security Misconfiguration',
      'Information Disclosure': 'API9:2023 - Improper Inventory Management',
      'CORS Misconfiguration': 'API8:2023 - Security Misconfiguration'
    };
    return owaspMapping[vulnerabilityType] || 'API Security Issue';
  };

  const generateEvidence = (vulnerability) => {
    const examples = {
      'SQL Injection': `REQUEST: GET ${vulnerability.endpoint}?search=admin' OR 1=1--
Authorization: Bearer [TOKEN]

RESPONSE: 200 OK
{
  "users": [
    {"id": 1, "username": "admin", "email": "admin@api.com"},
    {"id": 2, "username": "user", "email": "user@api.com"}
  ]
}`,
      'Authentication Bypass': `REQUEST: GET ${vulnerability.endpoint}
(No Authorization header)

RESPONSE: 200 OK
{
  "admin_data": "sensitive information",
  "users": [...],
  "system_info": [...]
}`,
      'Broken Access Control': `REQUEST: GET ${vulnerability.endpoint}
Authorization: Bearer USER_A_TOKEN

RESPONSE: 200 OK
{
  "userId": "USER_B_ID",
  "data": "USER_B_PRIVATE_DATA",
  "email": "userb@example.com"
}`
    };
    
    return examples[vulnerability.type] || `REQUEST: ${vulnerability.endpoint}
Evidence shows ${vulnerability.description.toLowerCase()}

RESPONSE: Vulnerability confirmed`;
  };

  return (
    <div className="scan-report-container">
      <div className="print-container">
        <header className="report-header">
          <div className="header-top">
            <div className="report-title">
              <h1>AT-AT Scan Report</h1>
              <p>API Threat Assessment Tool</p>
            </div>
            <div className="header-actions">
              <button onClick={handlePrint} className="print-btn no-print">
                <svg className="print-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Report
              </button>
            </div>
          </div>
          
          <div className="report-details">
            <div className="detail-item">
              <strong>API Assessed:</strong>
              <p>{reportData.apiName}</p>
            </div>
            <div className="detail-item">
              <strong>Scan Date:</strong>
              <p>{formatDate(reportData.completionTime)}</p>
            </div>
            <div className="detail-item">
              <strong>Testing Profile:</strong>
              <p>{reportData.profile}</p>
            </div>
          </div>
          
          <div className="security-score">
            <p className="score-label">Overall Security Score:</p>
            <p className={`score-grade ${getScoreColor(reportData.securityScore.grade)}`}>
              {reportData.securityScore.grade}
            </p>
            <p className="score-subtitle">
              {reportData.securityScore.numeric}/100 (Based on weighted severity of findings)
            </p>
          </div>
        </header>

        <section className="summary-section">
          <h2 className="section-title">Scan Summary</h2>
          <div className="metrics-grid">
            <div className="metric-card critical">
              <span className="metric-value">{reportData.vulnerabilityBreakdown.critical}</span>
              <span className="metric-label">Critical</span>
            </div>
            <div className="metric-card high">
              <span className="metric-value">{reportData.vulnerabilityBreakdown.high}</span>
              <span className="metric-label">High</span>
            </div>
            <div className="metric-card medium">
              <span className="metric-value">{reportData.vulnerabilityBreakdown.medium}</span>
              <span className="metric-label">Medium</span>
            </div>
            <div className="metric-card low">
              <span className="metric-value">{reportData.vulnerabilityBreakdown.low}</span>
              <span className="metric-label">Low</span>
            </div>
            <div className="metric-card total">
              <span className="metric-value">{reportData.totalVulnerabilities}</span>
              <span className="metric-label">Total Findings</span>
            </div>
          </div>
        </section>

        <section className="findings-section">
          <h2 className="section-title">Detailed Findings</h2>
          
          {reportData.vulnerabilities && reportData.vulnerabilities.length > 0 ? (
            reportData.vulnerabilities.map((vulnerability, index) => (
              <div key={vulnerability.id || index} className="vulnerability-card">
                <div className="vuln-header">
                  <h3 className="vuln-title">
                    {getOWASPCategory(vulnerability.type)} - {vulnerability.type}
                  </h3>
                  <span className={`severity-badge ${getSeverityClass(vulnerability.severity)}`}>
                    {vulnerability.severity}
                  </span>
                </div>
                
                <div className="vuln-meta">
                  <p><strong>Endpoint:</strong> <code>{vulnerability.endpoint}</code></p>
                  <p><strong>OWASP Category:</strong> {getOWASPCategory(vulnerability.type)}</p>
                  {vulnerability.cvss && (
                    <p><strong>CVSS Score:</strong> {vulnerability.cvss}/10</p>
                  )}
                </div>

                <div className="vuln-section">
                  <h4>Description:</h4>
                  <p>{vulnerability.description}</p>
                  {vulnerability.impact && (
                    <p className="impact-text"><strong>Impact:</strong> {vulnerability.impact}</p>
                  )}
                </div>

                <div className="vuln-section">
                  <h4>Evidence:</h4>
                  <pre className="code-snippet">
                    <code>{generateEvidence(vulnerability)}</code>
                  </pre>
                </div>

                <div className="vuln-section">
                  <h4>Recommendation:</h4>
                  <div className="recommendation">
                    {vulnerability.recommendation}
                    <br />
                    <strong>Reference:</strong>{' '}
                    <a 
                      href="https://owasp.org/API-Security/editions/2023/en/"
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="owasp-link"
                    >
                      OWASP API Security Top 10 2023
                    </a>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-vulnerabilities">
              <div className="success-icon">✅</div>
              <h3>Excellent Security Posture!</h3>
              <p>No vulnerabilities were detected during this scan. Your API appears to follow security best practices.</p>
              <div className="success-recommendations">
                <h4>Continue maintaining security by:</h4>
                <ul>
                  <li>Running regular security scans</li>
                  <li>Keeping dependencies up to date</li>
                  <li>Implementing continuous security monitoring</li>
                  <li>Conducting periodic security reviews</li>
                </ul>
              </div>
            </div>
          )}
        </section>

        {reportData.recommendations && reportData.recommendations.length > 0 && (
          <section className="recommendations-section">
            <h2 className="section-title">Executive Recommendations</h2>
            {reportData.recommendations.map((rec, index) => (
              <div key={index} className={`recommendation-card ${rec.priority.toLowerCase()}`}>
                <div className="rec-header">
                  <h3>{rec.title}</h3>
                  <span className={`priority-badge priority-${rec.priority.toLowerCase()}`}>
                    {rec.priority}
                  </span>
                </div>
                <p>{rec.description}</p>
              </div>
            ))}
          </section>
        )}

        <footer className="report-footer">
          <p>This report was generated by AT-AT (API Threat Assessment Tool) on {formatDate(reportData.completionTime)}.</p>
          <p>Scan ID: {reportData.scanId}</p>
          <p className="no-print">
            <button onClick={onBackToDashboard} className="back-link">
              ← Back to Dashboard
            </button>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default ScanReport;
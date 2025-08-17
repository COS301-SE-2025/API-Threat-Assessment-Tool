// scanSimulation.js - API Security Scan Simulation Module

export class ScanSimulation {
  constructor() {
    this.scanId = null;
    this.currentPhase = 0;
    this.progress = 0;
    this.isRunning = false;
    this.results = [];
    this.callbacks = {};
    
    // Scan phases with realistic timing
    this.phases = [
      { name: 'Initializing', duration: 2000, weight: 5 },
      { name: 'Discovery & Enumeration', duration: 8000, weight: 20 },
      { name: 'Authentication Testing', duration: 6000, weight: 15 },
      { name: 'Authorization Testing', duration: 7000, weight: 18 },
      { name: 'Input Validation', duration: 9000, weight: 22 },
      { name: 'Security Headers Analysis', duration: 4000, weight: 10 },
      { name: 'Vulnerability Assessment', duration: 5000, weight: 15 },
      { name: 'Report Generation', duration: 3000, weight: 5 }
    ];

    // Simulated vulnerabilities database
    this.vulnerabilityTemplates = {
      critical: [
        {
          type: 'SQL Injection',
          endpoint: '/api/v1/users/search',
          description: 'SQL injection vulnerability found in search parameter',
          impact: 'Complete database compromise possible',
          cvss: 9.8,
          recommendation: 'Use parameterized queries and input validation'
        },
        {
          type: 'Authentication Bypass',
          endpoint: '/api/v1/admin/users',
          description: 'Administrative endpoints accessible without authentication',
          impact: 'Unauthorized access to sensitive operations',
          cvss: 9.1,
          recommendation: 'Implement proper authentication checks for all admin endpoints'
        },
        {
          type: 'Remote Code Execution',
          endpoint: '/api/v1/upload',
          description: 'File upload allows execution of arbitrary code',
          impact: 'Complete server compromise possible',
          cvss: 9.9,
          recommendation: 'Implement strict file type validation and sandboxing'
        }
      ],
      high: [
        {
          type: 'Broken Access Control',
          endpoint: '/api/v1/users/{id}',
          description: 'User can access other users\' data by manipulating ID parameter',
          impact: 'Unauthorized access to user data',
          cvss: 8.5,
          recommendation: 'Implement proper authorization checks for user-specific resources'
        },
        {
          type: 'Sensitive Data Exposure',
          endpoint: '/api/v1/users/profile',
          description: 'Password hashes exposed in API responses',
          impact: 'User credentials at risk',
          cvss: 7.8,
          recommendation: 'Remove sensitive fields from API responses'
        },
        {
          type: 'Insecure Direct Object References',
          endpoint: '/api/v1/documents/{docId}',
          description: 'Users can access documents by guessing document IDs',
          impact: 'Unauthorized document access',
          cvss: 8.2,
          recommendation: 'Implement proper access controls and use UUIDs for resource identifiers'
        },
        {
          type: 'JWT Token Manipulation',
          endpoint: '/api/v1/auth/verify',
          description: 'JWT tokens can be manipulated to escalate privileges',
          impact: 'Authentication bypass and privilege escalation',
          cvss: 8.7,
          recommendation: 'Use strong JWT signing algorithms and validate token integrity'
        }
      ],
      medium: [
        {
          type: 'Rate Limiting Missing',
          endpoint: '/api/v1/auth/login',
          description: 'No rate limiting on authentication endpoints',
          impact: 'Brute force attacks possible',
          cvss: 6.1,
          recommendation: 'Implement rate limiting and account lockout mechanisms'
        },
        {
          type: 'Weak Encryption',
          endpoint: '/api/v1/data/export',
          description: 'Data transmitted using weak encryption algorithms',
          impact: 'Data interception possible',
          cvss: 5.9,
          recommendation: 'Use strong encryption standards (AES-256, TLS 1.3)'
        },
        {
          type: 'Session Management Issues',
          endpoint: '/api/v1/auth/session',
          description: 'Session tokens do not expire and lack secure flags',
          impact: 'Session hijacking possible',
          cvss: 6.5,
          recommendation: 'Implement proper session timeout and secure cookie flags'
        },
        {
          type: 'Input Validation Bypass',
          endpoint: '/api/v1/comments',
          description: 'Input validation can be bypassed with encoded payloads',
          impact: 'XSS and injection attacks possible',
          cvss: 6.8,
          recommendation: 'Implement comprehensive input validation and encoding'
        },
        {
          type: 'API Versioning Issues',
          endpoint: '/api/v1/legacy',
          description: 'Legacy API versions exposed with known vulnerabilities',
          impact: 'Exploitation of deprecated endpoints',
          cvss: 6.3,
          recommendation: 'Disable legacy API versions and implement proper versioning strategy'
        }
      ],
      low: [
        {
          type: 'Information Disclosure',
          endpoint: '/api/v1/status',
          description: 'Server version information exposed in headers',
          impact: 'Information gathering for targeted attacks',
          cvss: 3.1,
          recommendation: 'Remove or obfuscate server version headers'
        },
        {
          type: 'CORS Misconfiguration',
          endpoint: '/api/v1/*',
          description: 'Overly permissive CORS policy',
          impact: 'Cross-origin attacks possible',
          cvss: 4.2,
          recommendation: 'Implement strict CORS policy with specific origins'
        },
        {
          type: 'Missing Security Headers',
          endpoint: '/api/v1/*',
          description: 'Security headers like HSTS and CSP are missing',
          impact: 'Various client-side attacks possible',
          cvss: 3.8,
          recommendation: 'Implement comprehensive security headers'
        },
        {
          type: 'Verbose Error Messages',
          endpoint: '/api/v1/error-test',
          description: 'Error messages reveal internal system information',
          impact: 'Information disclosure for attack planning',
          cvss: 3.5,
          recommendation: 'Implement generic error messages for production'
        },
        {
          type: 'HTTP Methods Not Restricted',
          endpoint: '/api/v1/products',
          description: 'Unnecessary HTTP methods (TRACE, OPTIONS) are enabled',
          impact: 'Potential for method-based attacks',
          cvss: 3.2,
          recommendation: 'Disable unnecessary HTTP methods and implement method validation'
        },
        {
          type: 'Cache Control Issues',
          endpoint: '/api/v1/sensitive-data',
          description: 'Sensitive data cached by browsers and proxies',
          impact: 'Data exposure through caching',
          cvss: 4.1,
          recommendation: 'Implement proper cache control headers for sensitive endpoints'
        }
      ]
    };

    this.scanProfiles = {
      'owasp': {
        name: 'OWASP Top 10 Quick Scan',
        vulnerabilityChance: { critical: 0.15, high: 0.25, medium: 0.45, low: 0.65 },
        duration: 30000,
        description: 'Focuses on OWASP API Security Top 10 vulnerabilities'
      },
      'full': {
        name: 'Full Comprehensive Scan',
        vulnerabilityChance: { critical: 0.20, high: 0.35, medium: 0.55, low: 0.75 },
        duration: 45000,
        description: 'Complete security assessment covering all vulnerability categories'
      },
      'auth': {
        name: 'Authentication & Authorization Focus',
        vulnerabilityChance: { critical: 0.25, high: 0.40, medium: 0.35, low: 0.50 },
        duration: 25000,
        description: 'Specialized scan focusing on authentication and authorization issues'
      }
    };
  }

  // Event handling system
  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  emit(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data));
    }
  }

  // Remove event listener
  off(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    }
  }

  // Generate unique scan ID
  generateScanId() {
    return 'scan_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Start scan simulation
  async startScan(apiName, profile, options = {}) {
    if (this.isRunning) {
      throw new Error('A scan is already running');
    }

    this.scanId = this.generateScanId();
    this.isRunning = true;
    this.currentPhase = 0;
    this.progress = 0;
    this.results = [];

    const selectedProfile = this.scanProfiles[profile] || this.scanProfiles['owasp'];
    
    // Emit scan started event
    this.emit('scanStarted', {
      scanId: this.scanId,
      apiName,
      profile: selectedProfile.name,
      estimatedDuration: selectedProfile.duration,
      timestamp: new Date().toISOString(),
      options
    });

    console.log(`🚀 Starting ${selectedProfile.name} for ${apiName}`);
    console.log(`📊 Scan ID: ${this.scanId}`);
    console.log(`⏱️ Estimated duration: ${selectedProfile.duration / 1000}s`);

    try {
      // Execute scan phases
      for (let i = 0; i < this.phases.length; i++) {
        if (!this.isRunning) break; // Allow cancellation
        
        this.currentPhase = i;
        await this.executePhase(i, selectedProfile, options);
      }

      if (this.isRunning) {
        return this.completeScan(apiName, selectedProfile);
      }
    } catch (error) {
      this.emit('scanError', { 
        scanId: this.scanId, 
        error: error.message,
        timestamp: new Date().toISOString()
      });
      console.error('❌ Scan failed:', error.message);
      this.isRunning = false;
      throw error;
    }
  }

  // Execute individual scan phase
  async executePhase(phaseIndex, profile, options) {
    const phase = this.phases[phaseIndex];
    const startTime = Date.now();
    
    console.log(`🔍 Phase ${phaseIndex + 1}/${this.phases.length}: ${phase.name}`);
    
    this.emit('phaseStarted', {
      scanId: this.scanId,
      phase: phaseIndex + 1,
      phaseName: phase.name,
      totalPhases: this.phases.length,
      timestamp: new Date().toISOString()
    });

    // Simulate phase work with progress updates
    const updateInterval = Math.max(100, phase.duration / 25); // 25 updates per phase
    let phaseProgress = 0;
    let lastVulnCheck = 0;

    const progressTimer = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(progressTimer);
        return;
      }

      const elapsed = Date.now() - startTime;
      phaseProgress = Math.min(100, (elapsed / phase.duration) * 100);
      
      // Calculate overall progress
      const previousPhasesWeight = this.phases.slice(0, phaseIndex)
        .reduce((sum, p) => sum + p.weight, 0);
      const currentPhaseContribution = (phaseProgress / 100) * phase.weight;
      this.progress = Math.min(100, previousPhasesWeight + currentPhaseContribution);

      this.emit('progressUpdate', {
        scanId: this.scanId,
        overallProgress: Math.round(this.progress),
        currentPhase: phaseIndex + 1,
        phaseName: phase.name,
        phaseProgress: Math.round(phaseProgress),
        timestamp: new Date().toISOString()
      });

      // Simulate finding vulnerabilities during certain phases (not initialization)
      if (phaseIndex >= 1 && elapsed - lastVulnCheck > 2000) {
        if (Math.random() < 0.4) { // 40% chance to find vulnerability every 2 seconds
          this.simulateVulnerabilityFound(profile, phaseIndex);
          lastVulnCheck = elapsed;
        }
      }
    }, updateInterval);

    // Wait for phase completion
    await new Promise(resolve => setTimeout(resolve, phase.duration));
    clearInterval(progressTimer);

    this.emit('phaseCompleted', {
      scanId: this.scanId,
      phase: phaseIndex + 1,
      phaseName: phase.name,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });

    console.log(`✅ Completed: ${phase.name} (${Date.now() - startTime}ms)`);
  }

  // Simulate vulnerability discovery
  simulateVulnerabilityFound(profile, phaseIndex) {
    const severities = ['critical', 'high', 'medium', 'low'];
    
    // Adjust vulnerability likelihood based on scan phase
    const phaseMultipliers = {
      1: { critical: 0.3, high: 0.5, medium: 0.7, low: 1.0 }, // Discovery
      2: { critical: 1.2, high: 1.0, medium: 0.8, low: 0.6 }, // Auth testing
      3: { critical: 1.1, high: 1.1, medium: 0.9, low: 0.7 }, // Authorization
      4: { critical: 0.9, high: 1.0, medium: 1.2, low: 1.0 }, // Input validation
      5: { critical: 0.4, high: 0.6, medium: 0.9, low: 1.2 }, // Security headers
      6: { critical: 1.0, high: 1.0, medium: 1.0, low: 1.0 }, // Vulnerability assessment
      7: { critical: 0.1, high: 0.2, medium: 0.3, low: 0.5 }  // Report generation
    };

    const multiplier = phaseMultipliers[phaseIndex] || { critical: 1, high: 1, medium: 1, low: 1 };
    
    for (const severity of severities) {
      const adjustedChance = profile.vulnerabilityChance[severity] * multiplier[severity];
      
      if (Math.random() < adjustedChance) {
        const templates = this.vulnerabilityTemplates[severity];
        if (templates.length === 0) continue;
        
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        // Check if this type was already found to avoid duplicates
        const alreadyFound = this.results.some(r => r.type === template.type && r.endpoint === template.endpoint);
        if (alreadyFound) continue;
        
        const vulnerability = { 
          ...template,
          id: 'vuln_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          severity: severity.toUpperCase(),
          foundAt: new Date().toISOString(),
          status: 'confirmed',
          phase: this.phases[phaseIndex].name,
          scanId: this.scanId
        };

        this.results.push(vulnerability);
        
        this.emit('vulnerabilityFound', {
          scanId: this.scanId,
          vulnerability,
          totalFound: this.results.length,
          phase: phaseIndex + 1,
          timestamp: new Date().toISOString()
        });

        console.log(`⚠️  ${severity.toUpperCase()}: ${vulnerability.type} found at ${vulnerability.endpoint}`);
        break; // Only one vulnerability per check to avoid spam
      }
    }
  }

  // Complete scan and generate final report
  completeScan(apiName, profile) {
    this.isRunning = false;
    this.progress = 100;

    // Calculate security score based on findings
    const score = this.calculateSecurityScore();
    
    const finalReport = {
      scanId: this.scanId,
      apiName,
      profile: profile.name,
      startTime: new Date(Date.now() - profile.duration).toISOString(),
      completionTime: new Date().toISOString(),
      duration: profile.duration,
      status: 'completed',
      securityScore: score,
      totalVulnerabilities: this.results.length,
      vulnerabilityBreakdown: this.getVulnerabilityBreakdown(),
      vulnerabilities: this.results.sort((a, b) => {
        // Sort by severity (critical first, then by CVSS score)
        const severityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        return (b.cvss || 0) - (a.cvss || 0);
      }),
      recommendations: this.generateRecommendations(),
      scanMetadata: {
        phasesCompleted: this.phases.length,
        profileUsed: profile.name,
        scanDuration: profile.duration,
        vulnerabilityCategories: this.getVulnerabilityCategories()
      }
    };

    this.emit('scanCompleted', finalReport);
    
    console.log(`🎉 Scan completed! Security Score: ${score.grade} (${score.numeric}/100)`);
    console.log(`📋 Found ${this.results.length} vulnerabilities`);
    console.log(`📊 Breakdown: ${finalReport.vulnerabilityBreakdown.critical}C/${finalReport.vulnerabilityBreakdown.high}H/${finalReport.vulnerabilityBreakdown.medium}M/${finalReport.vulnerabilityBreakdown.low}L`);
    
    return finalReport;
  }

  // Calculate security score based on vulnerabilities found
  calculateSecurityScore() {
    let score = 100;
    const breakdown = this.getVulnerabilityBreakdown();
    
    // Deduct points based on severity with diminishing returns
    score -= Math.min(breakdown.critical * 25, 75);  // Critical: -25 points each, max -75
    score -= Math.min(breakdown.high * 15, 60);      // High: -15 points each, max -60
    score -= Math.min(breakdown.medium * 8, 40);     // Medium: -8 points each, max -40
    score -= Math.min(breakdown.low * 3, 20);        // Low: -3 points each, max -20
    
    score = Math.max(0, Math.round(score));
    
    // Assign letter grade
    let grade;
    if (score >= 95) grade = 'A+';
    else if (score >= 90) grade = 'A';
    else if (score >= 85) grade = 'A-';
    else if (score >= 80) grade = 'B+';
    else if (score >= 75) grade = 'B';
    else if (score >= 70) grade = 'B-';
    else if (score >= 65) grade = 'C+';
    else if (score >= 60) grade = 'C';
    else if (score >= 55) grade = 'C-';
    else if (score >= 50) grade = 'D+';
    else if (score >= 45) grade = 'D';
    else if (score >= 40) grade = 'D-';
    else grade = 'F';
    
    return { numeric: score, grade };
  }

  // Get vulnerability breakdown by severity
  getVulnerabilityBreakdown() {
    return {
      critical: this.results.filter(v => v.severity === 'CRITICAL').length,
      high: this.results.filter(v => v.severity === 'HIGH').length,
      medium: this.results.filter(v => v.severity === 'MEDIUM').length,
      low: this.results.filter(v => v.severity === 'LOW').length
    };
  }

  // Get vulnerability categories for analysis
  getVulnerabilityCategories() {
    const categories = {};
    this.results.forEach(vuln => {
      categories[vuln.type] = (categories[vuln.type] || 0) + 1;
    });
    return categories;
  }

  // Generate recommendations based on findings
  generateRecommendations() {
    const recommendations = [];
    const breakdown = this.getVulnerabilityBreakdown();
    const categories = this.getVulnerabilityCategories();
    
    if (breakdown.critical > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        title: 'Address Critical Vulnerabilities Immediately',
        description: `${breakdown.critical} critical vulnerabilities require immediate attention. These pose severe security risks and should be patched within 24 hours to prevent potential system compromise.`
      });
    }
    
    if (breakdown.high > 0) {
      recommendations.push({
        priority: 'HIGH',
        title: 'Fix High-Severity Issues Within 48-72 Hours',
        description: `${breakdown.high} high-severity vulnerabilities should be addressed within 48-72 hours to prevent potential security breaches and data compromise.`
      });
    }
    
    if (breakdown.medium > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        title: 'Improve Security Posture',
        description: `${breakdown.medium} medium-severity issues identified. Plan fixes within the next sprint or development cycle to strengthen overall security.`
      });
    }
    
    if (breakdown.low > 0) {
      recommendations.push({
        priority: 'LOW',
        title: 'Address Low-Priority Issues During Maintenance',
        description: `${breakdown.low} low-severity issues found. These should be addressed during regular maintenance cycles to improve security hygiene.`
      });
    }

    // Add specific recommendations based on vulnerability types found
    if (categories['SQL Injection']) {
      recommendations.push({
        priority: 'CRITICAL',
        title: 'Implement Parameterized Queries',
        description: 'SQL injection vulnerabilities detected. Immediately implement parameterized queries and input validation across all database interactions.'
      });
    }

    if (categories['Authentication Bypass'] || categories['Broken Access Control']) {
      recommendations.push({
        priority: 'HIGH',
        title: 'Strengthen Authentication and Authorization',
        description: 'Access control issues detected. Review and strengthen authentication mechanisms and implement proper authorization checks.'
      });
    }

    if (categories['Rate Limiting Missing']) {
      recommendations.push({
        priority: 'MEDIUM',
        title: 'Implement Rate Limiting',
        description: 'Add rate limiting to all API endpoints to prevent abuse and brute force attacks.'
      });
    }

    // Add general recommendations
    recommendations.push({
      priority: 'INFO',
      title: 'Implement Security Best Practices',
      description: 'Maintain regular security scans, implement code reviews, provide security training, and establish a comprehensive vulnerability management process.'
    });

    if (this.results.length === 0) {
      recommendations.push({
        priority: 'INFO',
        title: 'Maintain Excellent Security Posture',
        description: 'No vulnerabilities detected! Continue following security best practices, conduct regular assessments, and stay updated with latest security trends.'
      });
    }
    
    return recommendations;
  }

  // Stop running scan
  stopScan() {
    if (this.isRunning) {
      this.isRunning = false;
      this.emit('scanStopped', { 
        scanId: this.scanId, 
        stoppedAt: new Date().toISOString(),
        progress: this.progress,
        phase: this.currentPhase + 1,
        vulnerabilitiesFound: this.results.length
      });
      console.log(`🛑 Scan ${this.scanId} stopped by user at ${this.progress}% completion`);
    }
  }

  // Get current scan status
  getStatus() {
    return {
      scanId: this.scanId,
      isRunning: this.isRunning,
      progress: this.progress,
      currentPhase: this.currentPhase + 1,
      totalPhases: this.phases.length,
      currentPhaseName: this.phases[this.currentPhase]?.name || 'Complete',
      vulnerabilitiesFound: this.results.length,
      startTime: this.scanId ? new Date(parseInt(this.scanId.split('_')[1])).toISOString() : null
    };
  }

  // Reset scanner state
  reset() {
    this.scanId = null;
    this.currentPhase = 0;
    this.progress = 0;
    this.isRunning = false;
    this.results = [];
    console.log('🔄 Scanner reset and ready for new scan');
  }

  // Get scan history (mock implementation)
  getScanHistory() {
    // In a real implementation, this would fetch from a database
    return {
      totalScans: Math.floor(Math.random() * 50) + 10,
      lastScan: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      averageScore: Math.floor(Math.random() * 30) + 70,
      trendImproving: Math.random() > 0.5
    };
  }
}

// Demo class for testing and development
export class ScanDemo {
  constructor() {
    this.scanner = new ScanSimulation();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.scanner.on('scanStarted', (data) => {
      console.log('📱 Scan Started:', data);
    });

    this.scanner.on('phaseStarted', (data) => {
      console.log(`🔄 Phase ${data.phase}: ${data.phaseName} started`);
    });

    this.scanner.on('progressUpdate', (data) => {
      if (data.overallProgress % 10 === 0) { // Log every 10%
        console.log(`📊 Progress: ${data.overallProgress}% | ${data.phaseName}`);
      }
    });

    this.scanner.on('vulnerabilityFound', (data) => {
      console.log(`🚨 VULNERABILITY: ${data.vulnerability.severity} - ${data.vulnerability.type} at ${data.vulnerability.endpoint}`);
    });

    this.scanner.on('phaseCompleted', (data) => {
      console.log(`✅ Phase Complete: ${data.phaseName} (${data.duration}ms)`);
    });

    this.scanner.on('scanCompleted', (data) => {
      console.log('🎯 SCAN COMPLETE!');
      console.log(`📊 Security Score: ${data.securityScore.grade} (${data.securityScore.numeric}/100)`);
      console.log(`🔍 Vulnerabilities: ${data.totalVulnerabilities} total`);
      console.log('📋 Full Report:', data);
    });

    this.scanner.on('scanError', (data) => {
      console.error('❌ Scan Error:', data);
    });

    this.scanner.on('scanStopped', (data) => {
      console.log('⏹️ Scan Stopped:', data);
    });
  }

  // Demo method to run a sample scan
  async runDemo(apiName = 'Demo API', profile = 'owasp') {
    console.log('🎮 Starting API Security Scan Demo');
    console.log('=====================================');
    
    try {
      const result = await this.scanner.startScan(apiName, profile, { 
        detailedLogging: true,
        demo: true
      });
      return result;
    } catch (error) {
      console.error('Demo failed:', error.message);
      return null;
    }
  }

  // Interactive controls for demo
  stopDemo() {
    this.scanner.stopScan();
  }

  getStatus() {
    return this.scanner.getStatus();
  }

  reset() {
    this.scanner.reset();
  }
}

// Export utility functions
export const createScanSimulation = () => new ScanSimulation();
export const createScanDemo = () => new ScanDemo();

// Default export
export default ScanSimulation;
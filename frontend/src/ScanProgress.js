// ScanProgress.js - React Component for Real-time Scan Progress
import React, { useState, useEffect, useContext } from 'react';
import { ScanContext } from './App';
import ScanReport from './ScanReport';
import './ScanProgress.css';

const ScanProgress = ({ apiName, profile, onComplete, onCancel }) => {
  const { scanSimulation } = useContext(ScanContext);
  const [scanStatus, setScanStatus] = useState({
    isRunning: false,
    progress: 0,
    currentPhase: 1,
    totalPhases: 8,
    currentPhaseName: 'Initializing',
    vulnerabilitiesFound: 0,
    scanId: null
  });
  
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [scanLogs, setScanLogs] = useState([]);
  const [finalReport, setFinalReport] = useState(null);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    // Use the scanSimulation from context instead of creating a new instance
    if (scanSimulation) {
      setupScannerEvents();
      startScan();
    }

    // Cleanup on unmount
    return () => {
      if (scanSimulation?.isRunning) {
        scanSimulation.stopScan();
      }
    };
  }, [scanSimulation]);

  const setupScannerEvents = () => {
    const scanner = scanSimulation;

    scanner.on('scanStarted', (data) => {
      addLog(`🚀 Scan started: ${data.profile}`, 'info');
      setScanStatus(prev => ({
        ...prev,
        isRunning: true,
        scanId: data.scanId
      }));
    });

    scanner.on('phaseStarted', (data) => {
      addLog(`🔍 Starting: ${data.phaseName}`, 'phase');
      setScanStatus(prev => ({
        ...prev,
        currentPhase: data.phase,
        currentPhaseName: data.phaseName,
        totalPhases: data.totalPhases
      }));
    });

    scanner.on('progressUpdate', (data) => {
      setScanStatus(prev => ({
        ...prev,
        progress: data.overallProgress,
        currentPhase: data.currentPhase,
        currentPhaseName: data.phaseName
      }));
    });

    scanner.on('vulnerabilityFound', (data) => {
      const vuln = data.vulnerability;
      addLog(`⚠️ ${vuln.severity}: ${vuln.type} found`, 'vulnerability');
      setVulnerabilities(prev => [...prev, vuln]);
      setScanStatus(prev => ({
        ...prev,
        vulnerabilitiesFound: data.totalFound
      }));
    });

    scanner.on('phaseCompleted', (data) => {
      addLog(`✅ Completed: ${data.phaseName}`, 'success');
    });

    scanner.on('scanCompleted', (data) => {
      addLog(`🎉 Scan completed! Score: ${data.securityScore.grade}`, 'success');
      setScanStatus(prev => ({
        ...prev,
        isRunning: false,
        progress: 100
      }));
      setFinalReport(data);
      
      // Show the professional report after a brief delay
      setTimeout(() => {
        setShowReport(true);
      }, 2000);
      
      if (onComplete) {
        onComplete(data);
      }
    });

    scanner.on('scanError', (data) => {
      addLog(`❌ Error: ${data.error}`, 'error');
      setScanStatus(prev => ({ ...prev, isRunning: false }));
    });

    scanner.on('scanStopped', (data) => {
      addLog('🛑 Scan stopped by user', 'warning');
      setScanStatus(prev => ({ ...prev, isRunning: false }));
    });
  };

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setScanLogs(prev => [...prev, { 
      id: Date.now() + Math.random(), 
      message, 
      type, 
      timestamp 
    }]);
  };

  const startScan = async () => {
    try {
      addLog('Initializing security scan...', 'info');
      await scanSimulation.startScan(apiName, profile);
    } catch (error) {
      addLog(`Failed to start scan: ${error.message}`, 'error');
    }
  };

  const stopScan = () => {
    if (scanSimulation?.isRunning) {
      scanSimulation.stopScan();
    }
    if (onCancel) {
      onCancel();
    }
  };

  const handleBackToDashboard = () => {
    // Navigate back to dashboard after viewing the report
    if (onCancel) {
      onCancel();
    }
  };

  // If we should show the professional report, render it instead
  if (showReport && finalReport) {
    return (
      <ScanReport 
        reportData={finalReport}
        onBackToDashboard={handleBackToDashboard}
      />
    );
  }

  const getSeverityColor = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return '#dc3545';
      case 'HIGH': return '#fd7e14';
      case 'MEDIUM': return '#ffc107';
      case 'LOW': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getProgressColor = () => {
    if (scanStatus.progress < 30) return '#dc3545';
    if (scanStatus.progress < 70) return '#ffc107';
    return '#28a745';
  };

  return (
    <div className="scan-progress-container">
      <div className="scan-header">
        <div className="scan-info">
          <h2>🔍 Security Scan in Progress</h2>
          <p>API: <strong>{apiName}</strong> | Profile: <strong>{profile}</strong></p>
          <p>Scan ID: <code>{scanStatus.scanId}</code></p>
        </div>
        <div className="scan-controls">
          {scanStatus.isRunning && (
            <button onClick={stopScan} className="stop-btn">
              🛑 Stop Scan
            </button>
          )}
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-header">
          <span>Overall Progress: {scanStatus.progress}%</span>
          <span>Phase {scanStatus.currentPhase}/{scanStatus.totalPhases}: {scanStatus.currentPhaseName}</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ 
              width: `${scanStatus.progress}%`,
              backgroundColor: getProgressColor()
            }}
          ></div>
        </div>
      </div>

      <div className="scan-grid">
        <div className="vulnerabilities-section">
          <h3>🚨 Vulnerabilities Found ({scanStatus.vulnerabilitiesFound})</h3>
          <div className="vulnerabilities-list">
            {vulnerabilities.length === 0 ? (
              <div className="no-vulns">
                {scanStatus.isRunning ? 'Scanning for vulnerabilities...' : 'No vulnerabilities found yet'}
              </div>
            ) : (
              vulnerabilities.map(vuln => (
                <div key={vuln.id} className="vulnerability-item">
                  <div className="vuln-header">
                    <span 
                      className="severity-badge"
                      style={{ backgroundColor: getSeverityColor(vuln.severity) }}
                    >
                      {vuln.severity}
                    </span>
                    <span className="vuln-type">{vuln.type}</span>
                    <span className="cvss-score">CVSS: {vuln.cvss}</span>
                  </div>
                  <div className="vuln-details">
                    <div className="endpoint">📍 {vuln.endpoint}</div>
                    <div className="description">{vuln.description}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="logs-section">
          <h3>📋 Scan Logs</h3>
          <div className="logs-container">
            {scanLogs.map(log => (
              <div key={log.id} className={`log-entry log-${log.type}`}>
                <span className="log-time">{log.timestamp}</span>
                <span className="log-message">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {finalReport && !showReport && (
        <div className="final-report">
          <h3>📊 Scan Complete - Generating Professional Report...</h3>
          <div className="report-summary">
            <div className="score-card">
              <div className="score-grade">{finalReport.securityScore.grade}</div>
              <div className="score-numeric">{finalReport.securityScore.numeric}/100</div>
              <div className="score-label">Security Score</div>
            </div>
            <div className="summary-stats">
              <div className="stat">
                <div className="stat-number">{finalReport.totalVulnerabilities}</div>
                <div className="stat-label">Total Issues</div>
              </div>
              <div className="stat">
                <div className="stat-number">{Math.round(finalReport.duration / 1000)}s</div>
                <div className="stat-label">Duration</div>
              </div>
              <div className="stat">
                <div className="stat-number">{finalReport.vulnerabilityBreakdown.critical}</div>
                <div className="stat-label">Critical</div>
              </div>
            </div>
          </div>
          <div className="report-loading">
            <div className="loading-spinner"></div>
            <p>Preparing detailed professional report...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanProgress;
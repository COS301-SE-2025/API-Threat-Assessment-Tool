import React, { useState, useContext, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from './App';
import { useAuth } from './AuthContext';
import YAML from 'js-yaml';
import Logo from './components/Logo';
import './ManageAPIs.css';

export {
  fetchAllTags,
  fetchApiEndpoints,
  addTagsToEndpoint,
  removeTagsFromEndpoint,
  replaceTagsOnEndpoint,
  fetchEndpointDetails,
  saveApisToLocal,
  loadApisFromLocal,
  APIS_LOCAL_STORAGE_KEY,
  // UI
  EndpointTagEditor,
};

// API functions
async function fetchAllTags() {
  const res = await fetch('/api/tags', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch tags');
  return data.data.tags;
}

async function fetchApiEndpoints(api_id) {
  const res = await fetch('/api/endpoints', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_id }),
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch endpoints');
  return data.data;
}

async function addTagsToEndpoint({ path, method, tags }) {
  const res = await fetch('/api/endpoints/tags/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ path, method, tags }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Failed to add tags");
  return data.data;
}

async function fetchEndpointDetails({ endpoint_id, path, method }) {
  const res = await fetch('/api/endpoints/details', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ endpoint_id, path, method }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Failed to fetch endpoint details");
  return data.data;
}

async function removeTagsFromEndpoint({ path, method, tags }) {
  const res = await fetch('/api/endpoints/tags/remove', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ path, method, tags }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Failed to remove tags");
  return data.data;
}

async function replaceTagsOnEndpoint({ path, method, tags }) {
  const res = await fetch('/api/endpoints/tags/replace', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ path, method, tags }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Failed to replace tags");
  return data.data;
}

// Tag Editor Component
function EndpointTagEditor({ endpoint, onTagsAdded, onTagsRemoved, allTags = [], tagsLoading = false, tagsError = "", onRefreshTags }) {
  const [tagInput, setTagInput] = React.useState('');
  const [removeInput, setRemoveInput] = React.useState('');
  const [replaceInput, setReplaceInput] = React.useState('');
  const [adding, setAdding] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);
  const [replacing, setReplacing] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [currentTags, setCurrentTags] = React.useState(endpoint.tags || []);

  React.useEffect(() => {
    setCurrentTags(endpoint.tags || []);
  }, [endpoint.tags]);

  const handleAddTags = async () => {
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    if (tags.length === 0) {
      setMessage('Please enter at least one tag.');
      return;
    }
    setAdding(true);
    setMessage('');
    try {
      await addTagsToEndpoint({
        path: endpoint.path || endpoint.url,
        method: (endpoint.method || "GET").toUpperCase(),
        tags,
      });
      setMessage('✅ Tags added!');
      setTagInput('');
      
      const newTags = [...new Set([...currentTags, ...tags])];
      setCurrentTags(newTags);
      
      if (onRefreshTags) {
        onRefreshTags();
      }
      
      if (onTagsAdded) onTagsAdded(tags);
    } catch (err) {
      setMessage('❌ ' + err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveTags = async () => {
    const tags = removeInput.split(',').map(t => t.trim()).filter(Boolean);
    if (tags.length === 0) {
      setMessage('Please enter at least one tag to remove.');
      return;
    }
    setRemoving(true);
    setMessage('');
    try {
      await removeTagsFromEndpoint({
        path: endpoint.path || endpoint.url,
        method: (endpoint.method || "GET").toUpperCase(),
        tags,
      });
      setMessage('✅ Tags removed!');
      setRemoveInput('');
      
      const newTags = currentTags.filter(tag => !tags.includes(tag));
      setCurrentTags(newTags);
      
      if (onRefreshTags) {
        onRefreshTags();
      }
      
      if (onTagsRemoved) onTagsRemoved(tags);
    } catch (err) {
      setMessage('❌ ' + err.message);
    } finally {
      setRemoving(false);
    }
  };

  const handleReplaceTags = async () => {
    const tags = replaceInput.split(',').map(t => t.trim()).filter(Boolean);
    if (tags.length === 0) {
      setMessage('Please enter tags to replace.');
      return;
    }
    setReplacing(true);
    setMessage('');
    try {
      await replaceTagsOnEndpoint({
        path: endpoint.path || endpoint.url,
        method: (endpoint.method || "GET").toUpperCase(),
        tags,
      });
      setMessage('✅ Tags replaced!');
      setReplaceInput('');
      
      setCurrentTags(tags);
      
      if (onRefreshTags) {
        onRefreshTags();
      }
      
      if (onTagsAdded) onTagsAdded(tags);
    } catch (err) {
      setMessage('❌ ' + err.message);
    } finally {
      setReplacing(false);
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 4 }}>
          Current Tags:
        </div>
        {currentTags && currentTags.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {currentTags.map(tag => (
              <span key={tag} style={{
                display: 'inline-block', 
                background: "#22c55e", 
                color: "white",
                borderRadius: 8, 
                padding: "2px 8px", 
                fontSize: 11,
                fontWeight: 600
              }}>
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "#999", fontStyle: 'italic' }}>
            No tags assigned
          </div>
        )}
      </div>

      {tagsLoading ? (
        <div style={{ fontSize: 13, color: "#888" }}>Loading tags...</div>
      ) : tagsError ? (
        <div style={{ fontSize: 13, color: "#e53e3e" }}>❌ {tagsError}</div>
      ) : allTags && allTags.length > 0 ? (
        <div style={{ marginBottom: 5, fontSize: 12, color: "#888", whiteSpace: 'pre-line' }}>
          <strong>Available tags:</strong>{" "}
          {allTags.map(tag => (
            <span key={tag} style={{
              display: 'inline-block', background: "#f3f4f6", color: "#6366f1",
              borderRadius: 8, padding: "2px 8px", marginRight: 4, marginBottom: 2, fontWeight: 600
            }}>{tag}</span>
          ))}
        </div>
      ) : null}

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
        <input
          type="text"
          placeholder="Add tags (comma separated)"
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          disabled={adding}
          style={{ padding: 4, borderRadius: 4, minWidth: 120 }}
        />
        <button
          onClick={handleAddTags}
          disabled={adding}
          style={{
            marginLeft: 6,
            padding: '4px 12px',
            borderRadius: 4,
            background: '#818cf8',
            color: 'white',
            fontWeight: 600,
            cursor: adding ? 'not-allowed' : 'pointer'
          }}
        >
          {adding ? "Adding..." : "Add Tag"}
        </button>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Remove tags (comma separated)"
          value={removeInput}
          onChange={e => setRemoveInput(e.target.value)}
          disabled={removing}
          style={{ padding: 4, borderRadius: 4, minWidth: 120 }}
        />
        <button
          onClick={handleRemoveTags}
          disabled={removing}
          style={{
            marginLeft: 6,
            padding: '4px 12px',
            borderRadius: 4,
            background: '#f87171',
            color: 'white',
            fontWeight: 600,
            cursor: removing ? 'not-allowed' : 'pointer'
          }}
        >
          {removing ? "Removing..." : "Remove Tag"}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', marginTop: 6 }}>
        <input
          type="text"
          placeholder="Replace all tags (comma separated)"
          value={replaceInput}
          onChange={e => setReplaceInput(e.target.value)}
          disabled={replacing}
          style={{ padding: 4, borderRadius: 4, minWidth: 120 }}
        />
        <button
          onClick={handleReplaceTags}
          disabled={replacing}
          style={{
            marginLeft: 6,
            padding: '4px 12px',
            borderRadius: 4,
            background: '#34d399',
            color: 'white',
            fontWeight: 600,
            cursor: replacing ? 'not-allowed' : 'pointer'
          }}
        >
          {replacing ? "Replacing..." : "Replace Tags"}
        </button>
      </div>
      {message && <div style={{ fontSize: 13, marginTop: 3 }}>{message}</div>}
    </div>
  );
}

// Local Storage functions
const APIS_LOCAL_STORAGE_KEY = 'apiList';
const IMPORTED_APIS_LOCAL_STORAGE_KEY = 'importedApiList';

function saveApisToLocal(apis) {
  localStorage.setItem(APIS_LOCAL_STORAGE_KEY, JSON.stringify(apis));
}

function loadApisFromLocal() {
  try {
    return JSON.parse(localStorage.getItem(APIS_LOCAL_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveImportedApisToLocal(apis) {
  console.log('Saving imported APIs to localStorage:', apis);
  localStorage.setItem(IMPORTED_APIS_LOCAL_STORAGE_KEY, JSON.stringify(apis));
}

function loadImportedApisFromLocal() {
  try {
    const stored = localStorage.getItem(IMPORTED_APIS_LOCAL_STORAGE_KEY);
    const parsed = JSON.parse(stored) || [];
    console.log('Loaded imported APIs from localStorage:', parsed);
    return parsed;
  } catch {
    console.log('Failed to load imported APIs from localStorage, returning empty array');
    return [];
  }
}

const SCAN_TYPES = [
  "OWASP_API_10",
  "Sensitive Data Exposure",
  "Broken Authentication", 
  "SQL Injection",
  "Command Injection",
  "Rate Limit Bypass",
  "OpenAPI Validator",
  "Security Misconfig",
  "XSS Test",
  "SSRF Attempt",
  "Fuzzing Suite"
];

// Enhanced scan progress tracking
const SCAN_STEPS = [
  { id: 'init', label: 'Initializing scan...', duration: 100 },
  { id: 'discovery', label: 'Discovering endpoints...', duration: 100 },
  { id: 'bola', label: 'Testing Object Level Authorization...', duration: 100 },
  { id: 'auth', label: 'Analyzing authentication mechanisms...', duration: 100 },
  { id: 'bopla', label: 'Checking Property Level Authorization...', duration: 100 },
  { id: 'bfla', label: 'Testing Function Level Authorization...', duration: 100 },
  { id: 'security', label: 'Scanning security configurations...', duration: 100 },
  { id: 'inventory', label: 'Checking inventory management...', duration: 100 },
  { id: 'consumption', label: 'Testing API consumption safety...', duration: 100 },
  { id: 'finalize', label: 'Finalizing results...', duration: 100 }
];

// Enhanced scan monitoring service with realistic progress
class ScanMonitoringService {
  constructor() {
    this.activeScanIntervals = new Map();
    this.scanProgress = new Map();
  }

  async checkScanResults(scanId) {
    try {
      const response = await fetch(`/api/scan/results?scan_id=${scanId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!response.ok) {
        return { hasResults: false, error: `HTTP ${response.status}` };
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        return { 
          hasResults: true, 
          results: data.data,
          isComplete: true
        };
      }
      
      return { hasResults: false };
    } catch (error) {
      console.error('Error checking scan results:', error);
      return { hasResults: false, error: error.message };
    }
  }

  startMonitoring(scanId, callbacks, options = {}) {
    const { 
      pollInterval = 10000,
      maxAttempts = 30,
      onProgress,
      onComplete,
      onError,
      onStepComplete
    } = options;

    if (this.activeScanIntervals.has(scanId)) {
      console.warn(`Already monitoring scan ${scanId}`);
      return;
    }

    let attempts = 0;
    let currentStepIndex = 0;
    
    // Initialize progress
    this.scanProgress.set(scanId, {
      currentStep: 0,
      totalSteps: SCAN_STEPS.length,
      currentStepLabel: SCAN_STEPS[0].label,
      progress: 0
    });

    console.log(`🔄 Starting enhanced scan monitoring for ${scanId}`);

    // Start realistic progress simulation
    this.simulateProgress(scanId, onProgress, onStepComplete);

    const poll = async () => {
      attempts++;
      console.log(`📊 Checking scan results (attempt ${attempts}/${maxAttempts})`);
      
      const result = await this.checkScanResults(scanId);
      
      if (result.hasResults && result.isComplete) {
        console.log('✅ Scan completed with results');
        this.stopMonitoring(scanId);
        if (onComplete) {
          onComplete(result.results);
        }
        return;
      }
      
      if (result.error) {
        console.error('❌ Error checking scan results:', result.error);
      }
      
      if (attempts >= maxAttempts) {
        console.log('⏰ Maximum polling attempts reached');
        this.stopMonitoring(scanId);
        if (onError) {
          onError(new Error('Scan timeout - results not available after maximum attempts'));
        }
        return;
      }
      
      // Continue polling
      const timeoutId = setTimeout(poll, pollInterval);
      this.activeScanIntervals.set(scanId, timeoutId);
    };

    // Start first poll after 5 seconds
    const initialTimeoutId = setTimeout(poll, 5000);
    this.activeScanIntervals.set(scanId, initialTimeoutId);
  }

  simulateProgress(scanId, onProgress, onStepComplete) {
    let currentStepIndex = 0;
    
    const executeStep = () => {
      if (currentStepIndex >= SCAN_STEPS.length) {
        return;
      }

      const step = SCAN_STEPS[currentStepIndex];
      const progress = Math.round(((currentStepIndex + 1) / SCAN_STEPS.length) * 100);
      
      // Update progress
      this.scanProgress.set(scanId, {
        currentStep: currentStepIndex + 1,
        totalSteps: SCAN_STEPS.length,
        currentStepLabel: step.label,
        progress: progress
      });

      if (onProgress) {
        onProgress({
          step: currentStepIndex + 1,
          totalSteps: SCAN_STEPS.length,
          stepLabel: step.label,
          progress: progress
        });
      }

      if (onStepComplete) {
        onStepComplete(step);
      }

      currentStepIndex++;
      
      // Schedule next step
      if (currentStepIndex < SCAN_STEPS.length) {
        setTimeout(executeStep, step.duration);
      }
    };

    // Start simulation
    executeStep();
  }

  stopMonitoring(scanId) {
    const intervalId = this.activeScanIntervals.get(scanId);
    if (intervalId) {
      clearTimeout(intervalId);
      this.activeScanIntervals.delete(scanId);
      this.scanProgress.delete(scanId);
      console.log(`🛑 Stopped monitoring scan ${scanId}`);
    }
  }

  stopAllMonitoring() {
    for (const [scanId] of this.activeScanIntervals) {
      this.stopMonitoring(scanId);
    }
  }

  getProgress(scanId) {
    return this.scanProgress.get(scanId) || { currentStep: 0, totalSteps: 1, progress: 0 };
  }
}

// Enhanced Results Modal Component
const ScanResultsModal = ({ isOpen, onClose, results, apiName }) => {
  if (!isOpen || !results) return null;

  // Handle both formats: results.result or results.vulnerabilities
  const vulnerabilities = results.result || results.vulnerabilities || [];
  
  // Group vulnerabilities by type
  const groupedVulns = vulnerabilities.reduce((acc, vuln) => {
    const type = vuln.vulnerability_name;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(vuln);
    return acc;
  }, {});

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high': return '#dc2626';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Security Scan Report - ${apiName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .summary { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .vulnerability { border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
            .severity-high { border-left: 4px solid #dc2626; }
            .severity-medium { border-left: 4px solid #f59e0b; }
            .severity-low { border-left: 4px solid #10b981; }
            .vuln-title { font-weight: bold; margin-bottom: 10px; }
            .vuln-details { margin-bottom: 8px; }
            .evidence { background: #f1f1f1; padding: 10px; border-radius: 4px; font-family: monospace; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔒 Security Scan Report</h1>
            <h2>API: ${apiName}</h2>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="summary">
            <h3>📊 Summary</h3>
            <p><strong>Total Vulnerabilities:</strong> ${vulnerabilities.length}</p>
            <p><strong>High Severity:</strong> ${vulnerabilities.filter(v => v.severity?.toLowerCase() === 'high').length}</p>
            <p><strong>Medium Severity:</strong> ${vulnerabilities.filter(v => v.severity?.toLowerCase() === 'medium').length}</p>
            <p><strong>Low Severity:</strong> ${vulnerabilities.filter(v => v.severity?.toLowerCase() === 'low').length}</p>
          </div>

          ${Object.entries(groupedVulns).map(([type, vulns]) => `
            <h3>🔍 ${type}</h3>
            ${vulns.map(vuln => `
              <div class="vulnerability severity-${vuln.severity?.toLowerCase()}">
                <div class="vuln-title">${vuln.vulnerability_name}</div>
                <div class="vuln-details"><strong>Severity:</strong> ${vuln.severity} (CVSS: ${vuln.cvss_score})</div>
                <div class="vuln-details"><strong>Description:</strong> ${vuln.description}</div>
                <div class="vuln-details"><strong>Recommendation:</strong> ${vuln.recommendation}</div>
                ${vuln.evidence ? `<div class="vuln-details"><strong>Evidence:</strong></div><div class="evidence">${vuln.evidence}</div>` : ''}
              </div>
            `).join('')}
          `).join('')}
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1003 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ 
        minWidth: '800px', 
        maxWidth: '90vw', 
        maxHeight: '90vh', 
        overflow: 'auto',
        background: 'white'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '20px 30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
              🔒 Security Scan Report
            </h2>
            <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>
              API: {apiName}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={exportToPDF}
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '6px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              📄 Export PDF
            </button>
            <button 
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '5px'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '30px' }}>
          {/* Summary Section */}
          <div style={{
            background: '#f8f9fa',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '30px',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>📊 Scan Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6c757d' }}>
                  {vulnerabilities.length}
                </div>
                <div style={{ fontSize: '14px', color: '#6c757d' }}>Total Issues</div>
              </div>
              <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>
                  {vulnerabilities.filter(v => v.severity?.toLowerCase() === 'high').length}
                </div>
                <div style={{ fontSize: '14px', color: '#6c757d' }}>High Severity</div>
              </div>
              <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                  {vulnerabilities.filter(v => v.severity?.toLowerCase() === 'medium').length}
                </div>
                <div style={{ fontSize: '14px', color: '#6c757d' }}>Medium Severity</div>
              </div>
              <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                  {vulnerabilities.filter(v => v.severity?.toLowerCase() === 'low').length}
                </div>
                <div style={{ fontSize: '14px', color: '#6c757d' }}>Low Severity</div>
              </div>
            </div>
          </div>

          {/* Vulnerabilities by Type */}
          {Object.entries(groupedVulns).length > 0 ? (
            Object.entries(groupedVulns).map(([type, vulns]) => (
              <div key={type} style={{ marginBottom: '30px' }}>
                <h3 style={{ 
                  color: '#495057', 
                  borderBottom: '2px solid #e9ecef', 
                  paddingBottom: '10px',
                  marginBottom: '20px'
                }}>
                  🔍 {type} ({vulns.length} issue{vulns.length !== 1 ? 's' : ''})
                </h3>
                
                {vulns.map((vuln, index) => (
                  <div key={index} style={{
                    border: '1px solid #dee2e6',
                    borderLeft: `4px solid ${getSeverityColor(vuln.severity)}`,
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '15px',
                    background: 'white'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      marginBottom: '15px'
                    }}>
                      <h4 style={{ 
                        margin: 0, 
                        color: '#212529',
                        fontSize: '18px'
                      }}>
                        {vuln.vulnerability_name}
                      </h4>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        background: getSeverityColor(vuln.severity) + '15',
                        padding: '4px 12px',
                        borderRadius: '20px'
                      }}>
                        <span>{getSeverityIcon(vuln.severity)}</span>
                        <span style={{ 
                          color: getSeverityColor(vuln.severity),
                          fontWeight: 'bold',
                          fontSize: '14px'
                        }}>
                          {vuln.severity} (CVSS: {vuln.cvss_score})
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '12px' }}>
                      <strong style={{ color: '#495057' }}>Description:</strong>
                      <p style={{ margin: '5px 0', color: '#6c757d', lineHeight: '1.5' }}>
                        {vuln.description}
                      </p>
                    </div>
                    
                    <div style={{ marginBottom: '12px' }}>
                      <strong style={{ color: '#495057' }}>Recommendation:</strong>
                      <p style={{ margin: '5px 0', color: '#6c757d', lineHeight: '1.5' }}>
                        {vuln.recommendation}
                      </p>
                    </div>
                    
                    {vuln.evidence && (
                      <div>
                        <strong style={{ color: '#495057' }}>Evidence:</strong>
                        <pre style={{
                          background: '#f8f9fa',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          padding: '12px',
                          margin: '5px 0',
                          fontSize: '13px',
                          color: '#495057',
                          overflow: 'auto',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {vuln.evidence}
                        </pre>
                      </div>
                    )}

                    {vuln.test_name && (
                      <div style={{ marginTop: '12px' }}>
                        <strong style={{ color: '#495057' }}>Test:</strong>
                        <span style={{ margin: '0 0 0 8px', color: '#6c757d' }}>
                          {vuln.test_name}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              background: '#d1fae5',
              borderRadius: '12px',
              border: '1px solid #a7f3d0'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>🎉</div>
              <h3 style={{ color: '#065f46', margin: '0 0 10px 0' }}>
                No Vulnerabilities Found!
              </h3>
              <p style={{ color: '#047857', margin: 0 }}>
                Your API appears to be secure based on the selected scan profile.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced Progress Modal Component
const ScanProgressModal = ({ isOpen, onClose, progress, apiName }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1002 }}>
      <div className="modal-content" style={{
        minWidth: '500px',
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '20px 30px',
          textAlign: 'center'
        }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>
            🔍 Scanning in Progress
          </h2>
          <p style={{ margin: 0, opacity: 0.9 }}>
            {apiName}
          </p>
        </div>

        {/* Progress Content */}
        <div style={{ padding: '30px' }}>
          {/* Progress Bar */}
          <div style={{
            background: '#e5e7eb',
            borderRadius: '10px',
            height: '20px',
            marginBottom: '20px',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(90deg, #10b981, #059669)',
              height: '100%',
              width: `${progress.progress || 0}%`,
              borderRadius: '10px',
              transition: 'width 0.5s ease-in-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '12px'
            }}>
              {progress.progress || 0}%
            </div>
          </div>

          {/* Current Step */}
          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <div style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              {progress.currentStepLabel || 'Initializing...'}
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>
              Step {progress.currentStep || 0} of {progress.totalSteps || 1}
            </div>
          </div>

          {/* Animated Scanning Icon */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              margin: '0 auto',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>

          {/* Live Updates */}
          <div style={{
            background: '#f9fafb',
            borderRadius: '8px',
            padding: '15px',
            fontSize: '14px',
            color: '#4b5563',
            textAlign: 'center'
          }}>
            💡 Scanning for OWASP API Top 10 vulnerabilities...
            <br />
            This may take a few minutes to complete.
          </div>
        </div>

        {/* CSS for animation */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

const ManageAPIs = () => {
  // All state variables
  const [formData, setFormData] = useState({
    name: '',
    baseUrl: '',
    description: '',
    file: null
  });
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [selectedApi, setSelectedApi] = useState(null);
  const [selectedApiEndpoints, setSelectedApiEndpoints] = useState(null);
  const [selectedApiForEndpoints, setSelectedApiForEndpoints] = useState(null);
  const [endpointsLoading, setEndpointsLoading] = useState(false);
  const [endpointsError, setEndpointsError] = useState('');
  const [allTags, setAllTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagsError, setTagsError] = useState('');
  const [endpointDetail, setEndpointDetail] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanTargetApi, setScanTargetApi] = useState(null);
  const [selectedScanType, setSelectedScanType] = useState("OWASP_API_10");
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [currentScanId, setCurrentScanId] = useState(null);
  const [detailedResults, setDetailedResults] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [scanMonitoringService] = useState(() => new ScanMonitoringService());
  
  // New enhanced scan progress state
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [scanProgress, setScanProgress] = useState({
    currentStep: 0,
    totalSteps: 1,
    currentStepLabel: 'Initializing...',
    progress: 0
  });
  
  // New state for imported APIs
  const [importedApis, setImportedApis] = useState(() => loadImportedApisFromLocal());
  
  const navigate = useNavigate?.() || { push: () => {}, replace: () => {} };
  const location = useLocation?.() || { pathname: '/manage-apis' };
  
  const themeContext = useContext(ThemeContext) || { darkMode: false, toggleDarkMode: () => {} };
  const { darkMode = false, toggleDarkMode = () => {} } = themeContext;
  
  const authContext = useAuth() || { currentUser: null, logout: () => {}, getUserFullName: () => 'User' };
  const { currentUser = null, logout = () => {}, getUserFullName = () => 'User' } = authContext;
  
  useEffect(() => {
    const classTarget = document.body;
    if (darkMode) {
      classTarget.classList.add('dark-mode');
    } else {
      classTarget.classList.remove('dark-mode');
    }
    return () => {
      classTarget.classList.remove('dark-mode');
    };
  }, [darkMode]);

  // Save imported APIs to localStorage whenever it changes
  useEffect(() => {
    saveImportedApisToLocal(importedApis);
  }, [importedApis]);

  // Cleanup scan monitoring on unmount
  useEffect(() => {
    return () => {
      scanMonitoringService.stopAllMonitoring();
    };
  }, [scanMonitoringService]);

  const fallbackApis = [
    {
      id: 1,
      name: 'E-commerce API',
      baseUrl: 'https://api.ecommerce.com/v1',
      description: 'Main API for the e-commerce platform with user authentication and product management',
      lastScanned: '2025-06-20',
      status: 'Active',
      scanCount: 12,
      lastScanResult: 'Clean'
    },
    {
      id: 2,
      name: 'Payment Gateway API',
      baseUrl: 'https://api.payments.com/v2',
      description: 'Secure payment processing API with PCI compliance',
      lastScanned: '2025-06-18',
      status: 'Active',
      scanCount: 8,
      lastScanResult: 'Issues Found'
    },
    {
      id: 3,
      name: 'User Management Service',
      baseUrl: 'https://api.users.internal/v1',
      description: 'Internal user authentication and profile management service',
      lastScanned: '2025-06-15',
      status: 'Inactive',
      scanCount: 5,
      lastScanResult: 'Pending'
    },
    {
      id: 4,
      name: 'Analytics API',
      baseUrl: 'https://api.analytics.com/v3',
      description: 'Data analytics and reporting API for business intelligence',
      lastScanned: '2025-06-22',
      status: 'Active',
      scanCount: 15,
      lastScanResult: 'Clean'
    }
  ];

  const [apis, setApis] = useState(() => {
    const local = loadApisFromLocal();
    return local.length > 0 ? local : fallbackApis;
  });

  useEffect(() => {
    saveApisToLocal(apis);
  }, [apis]);

  const [isVisible, setIsVisible] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentApi, setCurrentApi] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [apiToDelete, setApiToDelete] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);

  // Refresh tags function
  const refreshAllTags = useCallback(async () => {
    setTagsLoading(true);
    setTagsError('');
    try {
      const tags = await fetchAllTags();
      setAllTags(Array.isArray(tags) ? tags : []);
    } catch (e) {
      setTagsError(e.message || "Failed to fetch tags");
    } finally {
      setTagsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAllTags();
  }, [refreshAllTags]);

  // ENHANCED API scanning handler with realistic progress
  const handleScanImportedApi = async (targetApi) => {
    console.log('🚀 === STARTING ENHANCED SCAN WORKFLOW ===');
    console.log('📋 TargetApi received:', targetApi);

    setScanLoading(true);
    setScanResult(null);
    setScanError("");
    setDetailedResults(null);
    setShowProgressModal(true);
    setScanProgress({
      currentStep: 0,
      totalSteps: SCAN_STEPS.length,
      currentStepLabel: 'Initializing scan...',
      progress: 0
    });

    try {
      // Validate required fields
      if (!targetApi) {
        throw new Error("No API selected for scanning");
      }

      // Determine if this is an imported API or regular API
      const isImportedApi = importedApis.some(api => api.id === targetApi.id);
      const isRegularApi = apis.some(api => api.id === targetApi.id);
      
      console.log('🔍 API Type Detection:', { 
        isImportedApi, 
        isRegularApi, 
        targetApiId: targetApi.id
      });

      // Extract client_id and api_name based on API type
      let clientId, apiName;
      
      if (isImportedApi) {
        clientId = targetApi.api_id || targetApi.apiId || targetApi.client_id || targetApi.id;
        apiName = targetApi.filename || targetApi.name || targetApi.fileName || `API_${clientId}`;
      } else if (isRegularApi) {
        clientId = targetApi.id;
        apiName = targetApi.name || `API_${clientId}`;
      } else {
        throw new Error(`API not found in either imported or regular APIs. ID: ${targetApi.id}`);
      }

      console.log('🔍 Extracted values:', { clientId, apiName, selectedScanType });

      if (!clientId || !apiName) {
        throw new Error(`Missing required data: clientId=${clientId}, apiName=${apiName}`);
      }

      showMessage(`🔍 Starting enhanced scan for "${apiName}"...`, "info");

      // 🔨 STEP 1: Create Scan
      console.log('🔨 Step 1: Creating scan...');
      const createScanResponse = await fetch("/api/scan/create", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({ 
          client_id: clientId,
          scan_profile: selectedScanType || "OWASP_API_10"
        }),
      });

      const createScanResult = await createScanResponse.json();
      
      if (!createScanResponse.ok || !createScanResult.success) {
        console.error('❌ Create scan failed:', createScanResult);
        throw new Error(createScanResult.message || "Failed to create scan");
      }

      console.log('✅ Step 1 Complete - Scan created');

      // 🚀 STEP 2: Start Scan  
      console.log('🚀 Step 2: Starting scan...');
      const startScanResponse = await fetch("/api/scan/start", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({ 
          api_name: apiName,
          scan_profile: selectedScanType || "OWASP_API_10"
        }),
      });

      const startScanResult = await startScanResponse.json();
      
      if (!startScanResponse.ok || !startScanResult.success) {
        console.error('❌ Start scan failed:', startScanResult);
        if (startScanResponse.status === 503) {
          throw new Error("A scan is already in progress. Please wait for it to complete.");
        }
        throw new Error(startScanResult.message || "Failed to start scan");
      }

      console.log('✅ Step 2 Complete - Scan started:', startScanResult);

      // 💾 STEP 3: Store scan_id and update state
      const scanId = startScanResult.data?.scan_id;
      if (!scanId) {
        throw new Error('No scan_id returned from start scan');
      }

      console.log('💾 Step 3: Storing scan_id:', scanId);
      setCurrentScanId(scanId);
      
      // Update the correct state array based on API type
      if (isImportedApi) {
        setImportedApis(prev => prev.map(api => 
          api.id === targetApi.id ? {
            ...api,
            scan_id: scanId,
            scanStatus: 'Running'
          } : api
        ));
      } else if (isRegularApi) {
        setApis(prev => prev.map(api => 
          api.id === targetApi.id ? {
            ...api,
            scan_id: scanId,
            scanStatus: 'Running',
            lastScanned: new Date().toISOString().split('T')[0]
          } : api
        ));
      }

      showMessage(`🔄 Enhanced scan started with ID: ${scanId}. Monitoring with realistic progress...`, "info");

      // 📊 STEP 4: Start enhanced results monitoring with progress simulation
      console.log('📊 Step 4: Starting enhanced results monitoring...');
      startEnhancedScanMonitoring(scanId, targetApi, isImportedApi, isRegularApi, apiName);

    } catch (error) {
      console.error("❌ Enhanced scan workflow failed:", error);
      setScanError(error.message || "Scan failed");
      showMessage(`❌ Scan failed: ${error.message}`, "error");
      setScanLoading(false);
      setCurrentScanId(null);
      setShowProgressModal(false);
    }
  };

  const startEnhancedScanMonitoring = (scanId, targetApi, isImportedApi, isRegularApi, apiName) => {
    scanMonitoringService.startMonitoring(scanId, {}, {
      pollInterval: 10000, // 10 seconds
      maxAttempts: 30, // 5 minutes total
      onProgress: (progressInfo) => {
        setScanProgress(progressInfo);
        showMessage(`🔄 ${progressInfo.stepLabel} (${progressInfo.progress}%)`, "info");
      },
      onStepComplete: (step) => {
        console.log(`✅ Completed: ${step.label}`);
      },
      onComplete: (results) => {
        handleEnhancedScanComplete(scanId, results, targetApi, isImportedApi, isRegularApi, apiName);
      },
      onError: (error) => {
        handleEnhancedScanError(scanId, error, targetApi, isImportedApi, isRegularApi);
      }
    });
  };

  const handleEnhancedScanComplete = (scanId, results, targetApi, isImportedApi, isRegularApi, apiName) => {
    console.log('✅ Enhanced scan completed with results:', results);
    
    setDetailedResults(results);
    const vulnCount = results?.result?.length || results?.vulnerabilities?.length || 0;
    setScanResult(`✅ Scan completed! Found ${vulnCount} vulnerabilities.`);
    setScanLoading(false);
    setCurrentScanId(null);
    setShowProgressModal(false);
    
    // Show results modal immediately
    setShowResultsModal(true);
    setIsScanModalOpen(false);
    
    // Update the correct state array
    if (isImportedApi) {
      setImportedApis(prev => prev.map(api => 
        api.id === targetApi.id ? {
          ...api,
          lastScanned: new Date().toISOString().split('T')[0],
          scanStatus: 'Completed',
          vulnerabilitiesFound: vulnCount,
          scanResults: results
        } : api
      ));
    } else if (isRegularApi) {
      setApis(prev => prev.map(api => 
        api.id === targetApi.id ? {
          ...api,
          lastScanned: new Date().toISOString().split('T')[0],
          scanStatus: 'Completed',
          scanCount: (api.scanCount || 0) + 1,
          lastScanResult: vulnCount > 0 ? 'Issues Found' : 'Clean',
          vulnerabilitiesFound: vulnCount,
          scanResults: results
        } : api
      ));
    }
    
    showMessage(`✅ Enhanced scan completed! Found ${vulnCount} vulnerabilities. Results displayed.`, 'success');
  };

  const handleEnhancedScanError = (scanId, error, targetApi, isImportedApi, isRegularApi) => {
    console.error('❌ Enhanced scan monitoring failed:', error);
    setScanError(error.message || 'Scan monitoring failed');
    setScanLoading(false);
    setCurrentScanId(null);
    setShowProgressModal(false);
    
    // Update status to failed
    if (isImportedApi) {
      setImportedApis(prev => prev.map(api => 
        api.id === targetApi.id ? {
          ...api,
          scanStatus: 'Failed'
        } : api
      ));
    } else if (isRegularApi) {
      setApis(prev => prev.map(api => 
        api.id === targetApi.id ? {
          ...api,
          lastScanResult: 'Failed'
        } : api
      ));
    }
    
    showMessage(`❌ Enhanced scan monitoring failed: ${error.message}`, 'error');
  };

  // Safe intersection observer setup
  useEffect(() => {
    try {
      if (typeof IntersectionObserver === 'undefined') {
        console.warn('IntersectionObserver not supported');
        return;
      }

      const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      };

      const observer = new IntersectionObserver((entries) => {
        try {
          entries.forEach(entry => {
            if (entry.isIntersecting && entry.target.id) {
              setIsVisible(prev => ({
                ...prev,
                [entry.target.id]: true
              }));
            }
          });
        } catch (error) {
          console.warn('Error in intersection observer callback:', error);
        }
      }, observerOptions);

      const setupObserver = () => {
        try {
          const sections = document.querySelectorAll('.animate-on-scroll');
          if (sections.length > 0) {
            sections.forEach(section => {
              if (section) observer.observe(section);
            });
          }
        } catch (error) {
          console.warn('Error setting up intersection observer:', error);
        }
      };

      const timeoutId = setTimeout(setupObserver, 100);

      return () => {
        clearTimeout(timeoutId);
        try {
          observer.disconnect();
        } catch (error) {
          console.warn('Error disconnecting observer:', error);
        }
      };
    } catch (error) {
      console.warn('Error setting up intersection observer:', error);
    }
  }, []);

  const handleViewDetails = async (endpoint) => {
    setDetailLoading(true);
    setDetailError('');
    try {
      const details = await fetchEndpointDetails({
        endpoint_id: endpoint.id,
        path: endpoint.path,
        method: endpoint.method
      });
      setEndpointDetail(details);
      setDetailModalOpen(true);
    } catch (e) {
      setDetailError(e.message);
    }
    setDetailLoading(false);
  };

  const handleViewEndpoints = async (api) => {
    setEndpointsLoading(true);
    setEndpointsError('');
    setSelectedApiForEndpoints(api);

    try {
      const id = api.api_id || api.id;
      const endpointsData = await fetchApiEndpoints(id);
      
      let endpoints = endpointsData;
      if (endpoints && typeof endpoints === 'object' && Array.isArray(endpoints.endpoints)) {
        endpoints = endpoints.endpoints;
      } else if (!Array.isArray(endpoints)) {
        endpoints = [];
      }
      
      const endpointsWithTags = endpoints.map(endpoint => ({
        ...endpoint,
        tags: endpoint.tags || []
      }));
      
      setSelectedApiEndpoints(endpointsWithTags);
      await refreshAllTags();
      
    } catch (err) {
      setEndpointsError(err.message || "Failed to load endpoints");
      setSelectedApiEndpoints([]);
    }

    setEndpointsLoading(false);
  };

  const closeEndpointsModal = () => {
    setSelectedApiEndpoints(null);
    setSelectedApiForEndpoints(null);
    setEndpointsError('');
  };

  const handleLogout = useCallback(() => {
    try {
      const confirmLogout = window.confirm('Are you sure you want to logout?');
      if (confirmLogout) {
        logout();
        if (navigate?.replace) {
          navigate.replace('/login');
        } else if (navigate) {
          navigate('/login');
        } else {
          window.location.href = '/login';
        }
      }
    } catch (error) {
      console.error('Error during logout:', error);
      setError('Error during logout. Please try again.');
    }
  }, [logout, navigate]);

  const showMessage = useCallback((text, type = 'info') => {
    try {
      setMessage({ text, type });
      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 4000);
    } catch (error) {
      console.error('Error showing message:', error);
    }
  }, []);

  const safeCurrentUser = currentUser || { firstName: 'Demo' };
  const userFullName = (() => {
    try {
      return getUserFullName() || 
             (safeCurrentUser.firstName ? `${safeCurrentUser.firstName} User` : 'User');
    } catch (error) {
      console.warn('Error getting user full name:', error);
      return 'User';
    }
  })();

  const apiStats = (() => {
    try {
      const total = apis.length + importedApis.length;
      const active = apis.filter(api => api.status === 'Active').length + importedApis.filter(api => api.status === 'Active').length;
      const totalScans = apis.reduce((sum, api) => sum + (api.scanCount || 0), 0) + importedApis.reduce((sum, api) => sum + (api.scanCount || 0), 0);
      const issuesFound = apis.filter(api => api.lastScanResult === 'Issues Found').length + importedApis.filter(api => (api.vulnerabilitiesFound || 0) > 0).length;
      
      return { total, active, totalScans, issuesFound };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return { total: 0, active: 0, totalScans: 0, issuesFound: 0 };
    }
  })();

  const handleAddApi = useCallback(() => {
    try {
      setCurrentApi({
        id: null,
        name: '',
        baseUrl: '',
        description: '',
        status: 'Active',
        scanCount: 0,
        lastScanResult: 'Pending'
      });
      setIsModalOpen(true);
      setError(null);
      setPendingFile(null);
      setScanResult(null);
      setScanError("");
    } catch (error) {
      console.error('Error opening add API modal:', error);
      setError('Error opening form. Please try again.');
    }
  }, []);

  const handleEditApi = useCallback((api) => {
    try {
      if (!api) return;
      setCurrentApi({ ...api });
      setIsModalOpen(true);
      setError(null);
    } catch (error) {
      console.error('Error opening edit API modal:', error);
      setError('Error opening edit form. Please try again.');
    }
  }, []);

  const handleDeleteApi = useCallback((api) => {
    try {
      if (!api) return;
      setApiToDelete(api);
      setIsDeleteConfirmOpen(true);
    } catch (error) {
      console.error('Error opening delete confirmation:', error);
      setError('Error opening delete confirmation. Please try again.');
    }
  }, []);

  const handleDeleteImportedApi = useCallback((api) => {
    try {
      if (!api) return;
      const confirmDelete = window.confirm(`Are you sure you want to delete "${api.filename}"?`);
      if (confirmDelete) {
        setImportedApis(prev => prev.filter(imported => imported.id !== api.id));
        showMessage(`🗑️ Imported API "${api.filename}" deleted successfully!`, 'success');
      }
    } catch (error) {
      console.error('Error deleting imported API:', error);
      showMessage('Error deleting imported API. Please try again.', 'error');
    }
  }, [showMessage]);

  const handleInputChange = useCallback((e) => {
    try {
      if (!e?.target) return;
      
      const { name, value } = e.target;
      if (!name) return;
      
      setCurrentApi(prevApi => ({
        ...prevApi,
        [name]: value
      }));
    } catch (error) {
      console.error('Error handling input change:', error);
      setError('Error updating field. Please try again.');
    }
  }, []);
  
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const processFile = useCallback((file) => {
    if (!file) {
      setPendingFile(null);
      setScanResult(null);
      setScanError("");
      return;
    }
    
    if (!file.name.toLowerCase().endsWith('.json') && 
        !file.name.toLowerCase().endsWith('.yaml') && 
        !file.name.toLowerCase().endsWith('.yml')) {
      showMessage('Please upload a JSON, YAML, or YML file.', 'error');
      setPendingFile(null);
      return;
    }

    setPendingFile(file);
    setScanResult(null);
    setScanError("");
    showMessage(`📁 File "${file.name}" selected and ready for upload.`, 'info');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        let apiData;

        if (file.name.toLowerCase().endsWith('.json')) {
          apiData = JSON.parse(content);
        } else {
          apiData = YAML.load(content);
        }

        const isOpenAPI = apiData.openapi || apiData.swagger;
        let name, baseUrl, description;

        if (isOpenAPI) {
          name = apiData.info?.title || currentApi?.name || '';
          baseUrl = apiData.servers?.[0]?.url || currentApi?.baseUrl || '';
          description = apiData.info?.description || currentApi?.description || '';
        } else {
          name = apiData.name || currentApi?.name || '';
          baseUrl = apiData.baseUrl || currentApi?.baseUrl || '';
          description = apiData.description || currentApi?.description || '';
        }

        setCurrentApi(prev => ({
          ...prev,
          name: prev?.name?.trim() ? prev.name : name,
          baseUrl: prev?.baseUrl?.trim() ? prev.baseUrl : baseUrl,
          description: prev?.description?.trim() ? prev.description : description,
          status: apiData.status || prev?.status || 'Active'
        }));

        showMessage(`✅ Form fields updated from "${file.name}".`, 'success');
      } catch (error) {
        console.error('Error parsing file:', error);
        showMessage('Error parsing file content.', 'error');
      }
    };

    reader.onerror = () => {
      showMessage('Error reading file.', 'error');
    };

    reader.readAsText(file);
  }, [currentApi, showMessage]);

  const handleFileUploadInModal = useCallback((e) => {
    processFile(e.target.files?.[0]);
  }, [processFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);

  const handleImportAPISubmit = async (e) => {
    e.preventDefault();
    setImportLoading(true);
    setImportError("");
    const fileInput = document.getElementById("import-api-file");
    const file = fileInput.files[0];
    if (!file) {
      setImportError("Please select a file.");
      setImportLoading(false);
      return;
    }
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Import failed");

      const { filename, api_id } = result.data;
      
      // Validate that we got the required data
      if (!filename) {
        console.error('No filename in import response:', result.data);
        throw new Error("Import response missing filename");
      }
      
      if (!api_id) {
        console.error('No api_id in import response:', result.data);
        throw new Error("Import response missing API ID");
      }

      console.log('Import successful:', { filename, api_id });
      
      // Add to imported APIs list instead of regular APIs
      const newImportedApi = {
        id: Math.max(...importedApis.map(a => a.id), 0) + 1,
        filename: filename,
        name: filename.replace(/\.[^/.]+$/, ''), // Remove file extension for display name
        api_id: api_id,
        uploadDate: new Date().toISOString().split('T')[0],
        status: "Active",
        lastScanned: "Never",
        scanCount: 0,
        scanStatus: "Ready",
        vulnerabilitiesFound: 0
      };
      
      console.log('Adding new imported API:', newImportedApi);
      
      setImportedApis(prev => [...prev, newImportedApi]);
      showMessage(`✅ Imported API "${filename}" successfully! You can now scan it.`, "success");
      setIsImportModalOpen(false);
      
      // Reset file input
      fileInput.value = '';
      
    } catch (err) {
      console.error('Import error:', err);
      setImportError(err.message || "Unexpected error.");
    } finally {
      setImportLoading(false);
    }
  };

  const handleSaveApi = useCallback(async () => {
    try {
      if (!currentApi) return;
      
      setIsLoading(true);
      setError(null);
      
      if (!currentApi.name?.trim()) {
        setError('API name is required');
        setIsLoading(false);
        return;
      }
      
      if (!currentApi.baseUrl?.trim()) {
        setError('Base URL is required');
        setIsLoading(false);
        return;
      }

      let apiToSave = { ...currentApi };

      if (pendingFile) {
        try {
          showMessage(`📤 Uploading file "${pendingFile.name}"...`, 'info');
          
          const formData = new FormData();
          formData.append("file", pendingFile);

          const res = await fetch("/api/import", {
            method: "POST",
            body: formData,
            credentials: "include",
          });
          
          const result = await res.json();
          
          if (!res.ok || !result.success) {
            throw new Error(result.message || "Upload failed");
          }

          const { filename, api_id } = result.data;
          
          apiToSave = {
            ...apiToSave,
            api_id: api_id,
            filename: filename
          };

          showMessage(`✅ File "${filename}" uploaded successfully!`, "success");
        } catch (uploadError) {
          setError(`File upload failed: ${uploadError.message}`);
          setIsLoading(false);
          return;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      if (apiToSave.id) {
        setApis(prevApis => 
          prevApis.map(api => 
            api.id === apiToSave.id ? { 
              ...apiToSave, 
              lastScanned: api.lastScanned || 'Never' 
            } : api
          )
        );
        showMessage(`✅ API "${apiToSave.name}" updated successfully!`, 'success');
      } else {
        const newApi = {
          ...apiToSave,
          id: Math.max(...apis.map(a => a.id), 0) + 1,
          lastScanned: 'Never',
          scanCount: 0,
          lastScanResult: 'Pending'
        };
        setApis(prevApis => [...prevApis, newApi]);
        showMessage(`✅ API "${apiToSave.name}" added successfully!`, 'success');
      }
      
      setIsModalOpen(false);
      setCurrentApi(null);
      setPendingFile(null);
    } catch (error) {
      console.error('Error saving API:', error);
      setError('Failed to save API. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentApi, apis, showMessage, pendingFile]);

  const confirmDelete = useCallback(async () => {
    try {
      if (!apiToDelete) return;
      
      setIsLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setApis(prevApis => prevApis.filter(api => api.id !== apiToDelete.id));
      showMessage(`🗑️ API "${apiToDelete.name}" deleted successfully!`, 'success');
      setIsDeleteConfirmOpen(false);
      setApiToDelete(null);
    } catch (error) {
      console.error('Error deleting API:', error);
      showMessage('Error deleting API. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [apiToDelete, showMessage]);

  if (!safeCurrentUser && currentUser === null) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: darkMode ? '#1e1e1e' : '#f5f5f5',
        color: darkMode ? 'white' : '#333',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid #333',
            borderTop: '3px solid #6b46c1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Loading APIs...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="manage-apis-container">
        {error && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#dc3545',
            color: 'white',
            padding: '15px 25px',
            borderRadius: '8px',
            zIndex: 1001,
            maxWidth: '400px'
          }}>
            {error}
            <button 
              onClick={() => setError(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                marginLeft: '10px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>
        )}
        
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <header className="manage-apis-header">
          <div className="logo" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {Logo && <Logo />}
            <span style={{
              fontWeight: 700,
              fontSize: 24,
              letterSpacing: 2,
              color: darkMode ? "#fff" : "#222",
              userSelect: "none"
            }}>
              AT-AT
            </span>
          </div>

          <nav className="manage-apis-nav">
            <Link to="/home" className={location.pathname === '/home' ? 'active' : ''}>Home</Link>
            <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>Dashboard</Link>
            <Link to="/public-templates" className={location.pathname === '/public-templates' ? 'active' : ''}>Public Templates</Link>
            <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>Settings</Link>
          </nav>

          <div className="user-info">
            <div className="user-profile">
              <span className="user-avatar">
                {safeCurrentUser.firstName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
              <div className="user-details">
                <span className="user-greeting">Welcome back,</span>
                <span className="user-name">{userFullName}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="logout-btn" title="Logout">
              Logout
            </button>
            <button onClick={toggleDarkMode} className="theme-toggle-btn" title="Toggle Theme">
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        <main className="manage-apis-main">
          <section className="manage-apis-hero">
            <div className="hero-content">
              <h1 className="hero-title">
                API 
                <span className="gradient-text"> Management</span>
              </h1>
              <p className="hero-description">
                Good {(() => {
                  try {
                    const hour = new Date().getHours();
                    return hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
                  } catch {
                    return 'day';
                  }
                })()}, {safeCurrentUser.firstName || 'there'}! 
                Centrally manage your API endpoints, configure security scans, and monitor your API ecosystem.
              </p>
              <div className="hero-actions">
                <button onClick={handleAddApi} className="add-api-btn">🚀 Add New API</button>
                <button
                  onClick={() => { setIsImportModalOpen(true); setImportError(""); }}
                  className="import-api-btn"
                  style={{
                    marginLeft: 16,
                    background: "#a78bfa",
                    color: "#222",
                    borderRadius: 7,
                    fontWeight: 700,
                    padding: "9px 24px"
                  }}
                >
                  ⬆️ Import API Spec
                </button>
              </div>
            </div> 
          </section>
          
          <section 
            id="api-stats" 
            className={`api-stats-section animate-on-scroll ${isVisible['api-stats'] ? 'visible' : ''}`}
          >
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🔗</div>
                <span className="stat-number">{apiStats.total}</span>
                <span className="stat-label">Total APIs</span>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <span className="stat-number">{apiStats.active}</span>
                <span className="stat-label">Active APIs</span>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔍</div>
                <span className="stat-number">{apiStats.totalScans}</span>
                <span className="stat-label">Total Scans</span>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⚠️</div>
                <span className="stat-number">{apiStats.issuesFound}</span>
                <span className="stat-label">Issues Found</span>
              </div>
            </div>
          </section>

          {/* Imported APIs Section */}
          {importedApis.length > 0 && (
            <section 
              id="imported-apis" 
              className={`apis-list-section animate-on-scroll ${isVisible['imported-apis'] ? 'visible' : ''}`}
            >
              <div className="apis-list">
                <div className="apis-list-header">
                  <h3 className="list-title">📁 Imported API Files</h3>
                  <p className="list-description">Ready for security scanning</p>
                </div>
                <div className="apis-grid">
                  {importedApis.map((importedApi, index) => (
                    <div key={importedApi.id} className="api-card" style={{
                      animationDelay: `${index * 0.1}s`,
                      border: '2px solid #8b5cf6',
                      background: 'linear-gradient(135deg, #8b5cf6, #6366f1)'
                    }}>
                      <div className="api-card-header">
                        <h4 className="api-name" style={{ color: 'white' }}>{importedApi.filename}</h4>
                        <span className={`api-status ${importedApi.status.toLowerCase()}`} style={{
                          background: importedApi.scanStatus === 'Running' ? '#fbbf24' : 
                                     importedApi.scanStatus === 'Completed' ? '#10b981' : '#6b7280',
                          color: 'white'
                        }}>
                          {importedApi.scanStatus}
                        </span>
                      </div>
                      
                      <div className="api-url" style={{ color: '#e0e7ff' }}>
                        API ID: {importedApi.api_id}
                      </div>
                      
                      <div className="api-meta" style={{ color: '#c7d2fe' }}>
                        <span>Uploaded: {importedApi.uploadDate}</span>
                        <span>Last scanned: {importedApi.lastScanned}</span>
                        {importedApi.vulnerabilitiesFound > 0 && (
                          <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>
                            ⚠️ {importedApi.vulnerabilitiesFound} vulnerabilities
                          </span>
                        )}
                      </div>

                      <div className="api-card-actions">
                        <button
                          onClick={() => {
                            console.log('Selected imported API for scan:', importedApi);
                            setScanTargetApi(importedApi);
                            setIsScanModalOpen(true);
                            setSelectedScanType("OWASP_API_10");
                            setScanResult(null);
                            setScanError("");
                          }}
                          className="action-btn scan"
                          title="Start Security Scan"
                          disabled={scanLoading && currentScanId === importedApi.scan_id}
                          style={{
                            background: scanLoading && currentScanId === importedApi.scan_id ? '#fbbf24' : '#10b981',
                            color: 'white'
                          }}
                        >
                          {scanLoading && currentScanId === importedApi.scan_id ? '🔄 Scanning...' : '🔍 Scan'}
                        </button>

                        {importedApi.vulnerabilitiesFound > 0 && (
                          <button
                            onClick={() => {
                              if (importedApi.scanResults) {
                                setDetailedResults(importedApi.scanResults);
                                setScanTargetApi(importedApi);
                                setShowResultsModal(true);
                              } else {
                                showMessage('No detailed results available yet.', 'info');
                              }
                            }}
                            className="action-btn"
                            title="View Scan Results"
                            style={{ background: "#f59e0b", color: "white" }}
                          >
                            📊 Results
                          </button>
                        )}

                        <button
                          onClick={() => handleViewEndpoints(importedApi)}
                          className="action-btn endpoints"
                          title="View Endpoints"
                          style={{ background: "#6366f1", color: "#fff" }}
                        >
                          📂 Endpoints
                        </button>

                        <button
                          onClick={() => handleDeleteImportedApi(importedApi)}
                          className="action-btn delete"
                          title="Delete Imported API"
                          style={{ background: "#ef4444", color: "white" }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="manage-apis-top">
            <h2 className="section-title">Your APIs</h2>
            <button onClick={handleAddApi} className="add-api-btn">
              ➕ Add API
            </button>
          </section>

          <section 
            id="apis-list" 
            className={`apis-list-section animate-on-scroll ${isVisible['apis-list'] ? 'visible' : ''}`}
          >
            <div className="apis-list">
              {apis.length > 0 ? (
                <>
                  <div className="apis-list-header">
                    <h3 className="list-title">🔗 API Endpoints</h3>
                    <p className="list-description">Manage and monitor your API security</p>
                  </div>
                  <div className="apis-grid">
                    {apis.map((api, index) => (
                      <div key={api.id} className="api-card" style={{animationDelay: `${index * 0.1}s`}}>
                        <div className="api-card-header">
                          <h4 className="api-name">{api.name}</h4>
                          <span className={`api-status ${api.status.toLowerCase()}`}>
                            {api.status}
                          </span>
                        </div>
                        
                        <div className="api-url">{api.baseUrl}</div>
                        
                        {api.description && (
                          <p className="api-description">{api.description}</p>
                        )}
                        
                        <div className="api-meta">
                          <span>Last scanned: {api.lastScanned}</span>
                          <span>Scans: {api.scanCount}</span>
                        </div>

                        <div className="api-card-actions">
                          <button
                            onClick={() => {
                              setScanTargetApi(api);
                              setIsScanModalOpen(true);
                              setSelectedScanType("OWASP_API_10");
                              setScanResult(null);
                              setScanError("");
                            }}
                            className="action-btn scan"
                            title="Start Security Scan"
                          >
                            🔍 Scan
                          </button>

                          <button 
                            onClick={() => handleEditApi(api)} 
                            className="action-btn edit"
                            title="Edit API"
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteApi(api)} 
                            className="action-btn delete"
                            title="Delete API"
                          >
                            🗑️ Delete
                          </button>
                          <button
                            onClick={() => handleViewEndpoints(api)}
                            className="action-btn endpoints"
                            title="View Endpoints"
                            style={{ background: "#6366f1", color: "#fff" }}
                          >
                            📂 Endpoints
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="no-apis">
                  <div className="no-apis-icon">🔗</div>
                  <h3>No APIs Found</h3>
                  <p>Get started by adding your first API endpoint to begin security scanning.</p>
                  <button onClick={handleAddApi} className="add-api-btn">
                    ➕ Add Your First API
                  </button>
                </div>
              )}
            </div>
          </section>
        </main>

        {/* Enhanced Scan Progress Modal */}
        <ScanProgressModal
          isOpen={showProgressModal}
          onClose={() => setShowProgressModal(false)}
          progress={scanProgress}
          apiName={scanTargetApi?.name || scanTargetApi?.filename || 'Unknown API'}
        />

        {/* Enhanced Scan Results Modal */}
        <ScanResultsModal
          isOpen={showResultsModal}
          onClose={() => setShowResultsModal(false)}
          results={detailedResults}
          apiName={scanTargetApi?.name || scanTargetApi?.filename || 'Unknown API'}
        />

        {/* Add/Edit API Modal */}
        {isModalOpen && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
            <div className="modal-content">
              <div className="modal-header">
                <h2>{currentApi?.id ? '✏️ Edit API' : '➕ Add New API'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="close-btn">×</button>
              </div>
              
              <form className="modal-form" onSubmit={(e) => e.preventDefault()}>
                <div className="form-group">
                  <label htmlFor="api-name">API Name *</label>
                  <input
                    id="api-name"
                    type="text"
                    name="name"
                    value={currentApi?.name || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., E-commerce API"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="base-url">Base URL *</label>
                  <input
                    id="base-url"
                    type="url"
                    name="baseUrl"
                    value={currentApi?.baseUrl || ''}
                    onChange={handleInputChange}
                    placeholder="https://api.example.com/v1"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="api-description">Description</label>
                  <textarea
                    id="api-description"
                    name="description"
                    value={currentApi?.description || ''}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Brief description of this API..."
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="api-status">Status</label>
                  <select
                    id="api-status"
                    name="status"
                    value={currentApi?.status || 'Active'}
                    onChange={handleInputChange}
                  >
                    <option value="Active">✅ Active</option>
                    <option value="Inactive">⏸️ Inactive</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="api-file">Import from File</label>
                  <div
                    className={`file-upload-zone ${dragActive ? 'active' : ''}`}
                    onClick={() => document.getElementById('api-file').click()}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      id="api-file"
                      type="file"
                      accept=".json,.yaml,.yml"
                      onChange={handleFileUploadInModal}
                      style={{ display: "none" }}
                    />
                    <div className="file-upload-content">
                      <i className="fas fa-cloud-upload-alt upload-icon"></i>
                      <p>Drag & drop your file here, or <span className="file-select-text">click to browse</span></p>
                      {pendingFile && (
                        <div style={{ marginTop: 8 }}>
                          <p className="file-name" style={{ margin: 0, fontWeight: 600, color: "#059669" }}>
                            📄 {pendingFile.name}
                          </p>
                          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#6b7280" }}>
                            Ready for upload
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </form>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="cancel-btn"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                
                <button
                  type="button"
                  onClick={handleSaveApi}
                  className="save-btn"
                  disabled={isLoading}
                >
                  {isLoading ? '⏳ Saving...' : (currentApi?.id ? '💾 Update API' : '➕ Add API')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteConfirmOpen && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsDeleteConfirmOpen(false)}>
            <div className="modal-content">
              <div className="modal-header">
                <h2>🗑️ Confirm Delete</h2>
                <button onClick={() => setIsDeleteConfirmOpen(false)} className="close-btn">×</button>
              </div>
              
              <div style={{ padding: '30px 40px' }}>
                <p style={{ fontSize: '1.1em', lineHeight: '1.6', margin: '0 0 20px 0' }}>
                  Are you sure you want to delete <strong>"{apiToDelete?.name}"</strong>? 
                </p>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                  This action cannot be undone. All scan history and configurations will be permanently removed.
                </p>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setIsDeleteConfirmOpen(false)} 
                  className="cancel-btn"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={confirmDelete} 
                  className="delete-confirm-btn"
                  disabled={isLoading}
                >
                  {isLoading ? '⏳ Deleting...' : '🗑️ Delete API'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import API Modal */}
        {isImportModalOpen && (
          <div
            className="modal-overlay"
            onClick={(e) => e.target === e.currentTarget && setIsImportModalOpen(false)}
          >
            <div className="modal-content" style={{ minWidth: 380 }}>
              <div className="modal-header">
                <h2>⬆️ Import API Spec</h2>
                <button onClick={() => setIsImportModalOpen(false)} className="close-btn">
                  ×
                </button>
              </div>

              <form
                className="modal-form"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                  marginTop: 10
                }}
                onSubmit={handleImportAPISubmit}
              >
                <label style={{ fontWeight: 600, marginBottom: -8 }}>
                  Choose .json, .yaml, or .yml file:
                </label>

                <div
                  className={`file-drop-zone ${dragActive ? "active" : ""}`}
                  onClick={() => document.getElementById("import-api-file").click()}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    id="import-api-file"
                    type="file"
                    accept=".json,.yaml,.yml"
                    style={{ display: "none" }}
                    disabled={importLoading}
                  />
                  <p style={{ margin: 0, color: "#aaa" }}>
                    Drag & drop your file here or{" "}
                    <span style={{ color: "#6366f1", fontWeight: 600 }}>click to select</span>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={importLoading}
                  style={{
                    background: "#6366f1",
                    color: "#fff",
                    borderRadius: 7,
                    fontWeight: 700,
                    padding: "12px 0",
                    fontSize: 16,
                    marginTop: 10,
                    cursor: importLoading ? "not-allowed" : "pointer"
                  }}
                >
                  {importLoading ? "Uploading..." : "Import API"}
                </button>

                {importError && (
                  <div
                    style={{
                      background: "#ef444420",
                      color: "#f87171",
                      borderRadius: 8,
                      marginTop: 10,
                      padding: "8px 12px",
                      fontWeight: 600
                    }}
                  >
                    ❌ {importError}
                  </div>
                )}
              </form>

              <div style={{ fontSize: 13, color: "#bbb", marginTop: 12 }}>
                Accepted: OpenAPI or Swagger .json/.yaml/.yml<br />
                Files will appear in the "Imported API Files" section ready for scanning.
              </div>
            </div>
          </div>
        )}

        {/* Endpoints Modal */}
        {selectedApiEndpoints !== null && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeEndpointsModal()}>
            <div className="modal-content" style={{ minWidth: 420, maxHeight: 540, overflow: 'auto' }}>
              <div className="modal-header">
                <h2>📂 Endpoints for "{selectedApiForEndpoints?.name || selectedApiForEndpoints?.filename || ''}"</h2>
                <button onClick={closeEndpointsModal} className="close-btn">×</button>
              </div>
              <div style={{ padding: 16 }}>
                {endpointsLoading ? (
                  <div>Loading endpoints...</div>
                ) : endpointsError ? (
                  <div style={{ color: '#e53e3e' }}>❌ {endpointsError}</div>
                ) : !Array.isArray(selectedApiEndpoints) ? (
                  <div>No endpoints found.</div>
                ) : selectedApiEndpoints.length === 0 ? (
                  <div>No endpoints found.</div>
                ) : (
                  <ul className="endpoint-list">
                    {selectedApiEndpoints.map((ep, idx) => (
                      <li key={idx} className="endpoint-card">
                        <div className="endpoint-method-path">
                          <span className={`endpoint-method ${ep.method || "DEFAULT"}`}>
                            {(ep.method || "GET").toUpperCase()}
                          </span>
                          <span className="endpoint-path">{ep.path || ep.url || '(no path)'}</span>
                        </div>
                        {ep.summary || ep.description ? (
                          <div className="endpoint-summary">{ep.summary || ep.description}</div>
                        ) : null}
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                         <EndpointTagEditor 
                          endpoint={ep}
                          allTags={allTags}
                          tagsLoading={tagsLoading}
                          tagsError={tagsError}
                          onRefreshTags={refreshAllTags} 
                        />
                          <button
                            onClick={() => handleViewDetails(ep)}
                            className="action-btn details"
                            style={{
                              marginLeft: 4,
                              background: "#a78bfa",
                              color: "#222",
                              borderRadius: 6,
                              padding: "4px 10px",
                              fontWeight: 600,
                              border: "none",
                              cursor: "pointer"
                            }}
                          >
                            📖 View Details
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Endpoint Details Modal */}
        {detailModalOpen && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDetailModalOpen(false)}>
            <div className="modal-content" style={{ minWidth: 340, maxWidth: 540, maxHeight: 540, overflow: 'auto' }}>
              <div className="modal-header">
                <h2>📖 Endpoint Details</h2>
                <button onClick={() => setDetailModalOpen(false)} className="close-btn">×</button>
              </div>
              <div style={{ padding: 18 }}>
                {detailLoading ? (
                  <div>Loading...</div>
                ) : detailError ? (
                  <div style={{ color: '#e53e3e' }}>❌ {detailError}</div>
                ) : endpointDetail ? (
                  <pre style={{ fontSize: 13, background: "#23232b", color: "#fff", padding: 12, borderRadius: 8, whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(endpointDetail, null, 2)}
                  </pre>
                ) : (
                  <div>No detail available.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Scan Modal */}
        {isScanModalOpen && scanTargetApi && (
          <div className="modal-overlay" style={{
            background: "rgba(60, 60, 120, 0.70)",
            backdropFilter: "blur(3px)",
            zIndex: 1002,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }} onClick={e => e.target === e.currentTarget && setIsScanModalOpen(false)}>
            <div className="modal-content"
              style={{
                minWidth: 380,
                maxWidth: 440,
                background: "var(--bg-secondary)",
                borderRadius: "var(--border-radius)",
                boxShadow: "0 8px 32px rgba(107,70,193,0.18)",
                padding: 0,
                overflow: "hidden",
                border: "2px solid var(--primary-color)",
                animation: "slideInUp 0.3s"
              }}>
              <div className="modal-header"
                style={{
                  background: "linear-gradient(90deg, var(--primary-color) 0%, var(--primary-light) 100%)",
                  color: "#fff",
                  padding: "22px 32px 14px 32px",
                  borderTopLeftRadius: "var(--border-radius)",
                  borderTopRightRadius: "var(--border-radius)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                <h2 style={{
                  fontWeight: 800,
                  fontSize: 22,
                  letterSpacing: 1,
                  margin: 0
                }}>
                  🔍 Scan: <span style={{ color: "#fbbf24" }}>{scanTargetApi.name || scanTargetApi.filename}</span>
                </h2>
                <button onClick={() => setIsScanModalOpen(false)}
                  className="close-btn"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#fff",
                    fontSize: 28,
                    fontWeight: 700,
                    cursor: "pointer",
                    marginLeft: 12
                  }}
                  aria-label="Close">×</button>
              </div>
              <div style={{ padding: "28px 32px 22px 32px", background: "var(--bg-primary)" }}>
                <p style={{
                  fontWeight: 600,
                  fontSize: 15,
                  marginBottom: 14,
                  color: "var(--text-primary)"
                }}>
                  Select a scan type to perform:
                </p>
                <ul style={{
                  padding: 0,
                  margin: 0,
                  listStyle: 'none',
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px 18px"
                }}>
                  {SCAN_TYPES.map(type => (
                    <li key={type}>
                      <label style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: scanLoading ? "not-allowed" : "pointer",
                        background: selectedScanType === type ? "var(--primary-light)" : "var(--bg-secondary)",
                        border: selectedScanType === type ? "2px solid var(--primary-color)" : "1px solid var(--secondary-color)",
                        borderRadius: "var(--border-radius-small)",
                        padding: "8px 10px",
                        fontWeight: selectedScanType === type ? 700 : 500,
                        color: selectedScanType === type ? "#fff" : "var(--text-primary)",
                        boxShadow: selectedScanType === type ? "0 2px 8px #6366f140" : "none",
                        transition: "all 0.18s"
                      }}>
                        <input
                          type="radio"
                          name="scan-type"
                          value={type}
                          checked={selectedScanType === type}
                          onChange={() => setSelectedScanType(type)}
                          disabled={scanLoading}
                          style={{
                            accentColor: "var(--primary-color)",
                            width: 18,
                            height: 18,
                            marginRight: 2
                          }}
                        />
                        {type}
                      </label>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => handleScanImportedApi(scanTargetApi)}
                  disabled={!selectedScanType || scanLoading}
                  style={{
                    marginTop: 22,
                    background: scanLoading ? "var(--success-color)" : "var(--primary-color)",
                    color: "#fff",
                    borderRadius: "var(--border-radius-small)",
                    padding: "12px 0",
                    fontWeight: 700,
                    border: "none",
                    fontSize: 16,
                    width: "100%",
                    boxShadow: scanLoading ? "none" : "0 2px 8px #34d39940",
                    cursor: !selectedScanType || scanLoading ? "not-allowed" : "pointer",
                    transition: "background 0.18s"
                  }}
                >
                  {scanLoading ? (
                    <span>
                      <span className="spinner" style={{
                        display: "inline-block",
                        width: 18,
                        height: 18,
                        border: "3px solid #fff",
                        borderTop: "3px solid var(--success-color)",
                        borderRadius: "50%",
                        marginRight: 8,
                        verticalAlign: "middle",
                        animation: "spin .8s linear infinite"
                      }}></span>
                      Starting scan...
                    </span>
                  ) : "🔍 Run Scan"}
                </button>
                
                {scanResult && (
                  <div style={{
                    marginTop: 16,
                    color: "var(--success-color)",
                    fontWeight: 700,
                    background: "#d1fae5",
                    borderRadius: "var(--border-radius-small)",
                    padding: "10px 14px",
                    fontSize: 15,
                    boxShadow: "0 1px 4px #10b98122"
                  }}>
                    ✅ {scanResult}
                  </div>
                )}
                
                {scanError && (
                  <div style={{
                    marginTop: 16,
                    color: "var(--danger-color)",
                    fontWeight: 700,
                    background: "#fee2e2",
                    borderRadius: "var(--border-radius-small)",
                    padding: "10px 14px",
                    fontSize: 15,
                    boxShadow: "0 1px 4px #ef444422"
                  }}>
                    ❌ {scanError}
                  </div>
                )}
              </div>
            </div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg);}
                100% { transform: rotate(360deg);}
              }
            `}</style>
          </div>
        )}

        <footer className="manage-apis-footer">
          <p>© 2025 AT-AT (API Threat Assessment Tool) • COS301 Capstone Project. All rights reserved.</p>
          <div className="footer-links">
            <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
            <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>
            <a href="#" onClick={(e) => e.preventDefault()}>Help Center</a>
          </div>
        </footer>
      </div>
    </>
  );
};

export default ManageAPIs;
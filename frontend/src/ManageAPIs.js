import React, { useState, useContext, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from './App';
import { useAuth } from './AuthContext';
import YAML from 'js-yaml';
import Logo from './components/Logo';
import './ManageAPIs.css';
import logoImage from './img/logo-blue.png';
import logoImageW from './img/logo-white.png';

export {
  fetchAllTags,
  fetchApiEndpoints,
  addTagsToEndpoint,
  removeTagsFromEndpoint,
  replaceTagsOnEndpoint,
  fetchEndpointDetails,
  // UI
  EndpointTagEditor,
};

// API functions
async function fetchAllTags(api_id) {
  const user_id = localStorage.getItem('currentUser_id') || 'default_user'; 
  const res = await fetch(`http://localhost:3001/api/tags?user_id=${user_id}&api_id=${api_id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch tags');
  return data.data.tags;
}

async function fetchApiEndpoints(api_id) {
  const user_id = localStorage.getItem('currentUser_id') || 'default_user';
  const res = await fetch('http://localhost:3001/api/endpoints', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_id: api_id, user_id: user_id }),
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch endpoints');
  return data.data;
}

async function addTagsToEndpoint({ path, method, tags, api_id, endpoint_id }) {
  const user_id = localStorage.getItem('currentUser_id') || 'default_user';
  const res = await fetch('http://localhost:3001/api/endpoints/tags/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ path: path, method: method, tags: tags, user_id: user_id, api_id: api_id, endpoint_id: endpoint_id }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Failed to add tags");
  return data.data;
}

async function fetchEndpointDetails({ endpoint_id, path, method, api_id }) {
  const user_id = localStorage.getItem('currentUser_id') || 'default_user';
  const res = await fetch('http://localhost:3001/api/endpoints/details', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ endpoint_id, path, method, user_id, api_id }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Failed to fetch endpoint details");
  return data.data;
}

async function removeTagsFromEndpoint({ path, method, tags, api_id, endpoint_id }) {
  const user_id = localStorage.getItem('currentUser_id') || 'default_user';
  const res = await fetch('http://localhost:3001/api/endpoints/tags/remove', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ path, method, tags, user_id, api_id, endpoint_id: endpoint_id}),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Failed to remove tags");
  return data.data;
}

async function replaceTagsOnEndpoint({ path, method, tags, endpoint_id}) {
  const res = await fetch('http://localhost:3001/api/endpoints/tags/replace', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ path, method, tags, endpoint_id: endpoint_id}),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Failed to replace tags");
  return data.data;
}

// Backend API functions
async function fetchAllApis() {
  const user_id = localStorage.getItem('currentUser_id') || 'default_user';
  console.log('🔍 Fetching APIs for user_id:', user_id);
  
  const res = await fetch(`http://localhost:3001/api/apis?user_id=${user_id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  
  const data = await res.json();
  console.log('📡 Raw API response:', data);
  
  if (!res.ok || !data.success) {
    console.error('❌ API request failed:', data);
    throw new Error(data.message || 'Failed to fetch APIs');
  }
  
  // Extract the actual APIs array from the response
  let apis = data.data;
  console.log('📊 Extracted data.data:', apis);
  
  // Handle different possible data structures
  if (apis && typeof apis === 'object') {
    // If data.data is an object with an apis property
    if (apis.apis && Array.isArray(apis.apis)) {
      apis = apis.apis;
      console.log('🔄 Using data.data.apis:', apis);
    }
    // If data.data is an object with a result property
    else if (apis.result && Array.isArray(apis.result)) {
      apis = apis.result;
      console.log('🔄 Using data.data.result:', apis);
    }
    // If data.data is an object but not an array, convert to array
    else if (!Array.isArray(apis)) {
      console.log('🔄 Converting object to array');
      apis = Object.values(apis).filter(item => 
        item && typeof item === 'object' && (item.id || item.api_id)
      );
    }
  }
  
  // Ensure we always return an array
  if (!Array.isArray(apis)) {
    console.warn('⚠️ APIs data is not an array, returning empty array');
    return [];
  }
  
  console.log('✅ Final processed APIs:', apis.length, 'items:', apis);
  return apis;
}

async function createApi({ name, description, baseUrl }) {
  const user_id = localStorage.getItem('currentUser_id') || 'default_user';
  const res = await fetch('http://localhost:3001/api/apis/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      user_id,
      name,
      description,
      base_url: baseUrl
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to create API');
  }
  return data.data;
}

async function updateApi({ api_id, name, description, baseUrl }) {
  const user_id = localStorage.getItem('currentUser_id') || 'default_user';
  const res = await fetch('http://localhost:3001/api/apis/update', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      user_id,
      api_id,
      name,
      description,
      base_url: baseUrl
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to update API');
  }
  return data.data;
}

async function deleteApi(api_id) {
  const user_id = localStorage.getItem('currentUser_id') || 'default_user';
  const res = await fetch('http://localhost:3001/api/apis/delete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      user_id,
      api_id
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to delete API');
  }
  return data.data;
}

async function getApiDetails(api_id) {
  const user_id = localStorage.getItem('currentUser_id') || 'default_user';
  const res = await fetch(`http://localhost:3001/api/apis/details?user_id=${user_id}&api_id=${api_id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to get API details');
  }
  return data.data;
}

// Flag management functions
async function addFlagsToEndpoint({ endpoint_id, flag, api_id }) {
  const user_id = localStorage.getItem('currentUser_id') || 'default_user';
  const res = await fetch('http://localhost:3001/api/endpoints/flags/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ endpoint_id, flags: flag, user_id, api_id }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Failed to add flag");
  return data.data;
}

async function removeFlagsFromEndpoint({ endpoint_id, flag, api_id }) {
  const user_id = localStorage.getItem('currentUser_id') || 'default_user';
  const res = await fetch('http://localhost:3001/api/endpoints/flags/remove', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ endpoint_id, flags: flag, user_id, api_id }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Failed to remove flag");
  return data.data;
}

// Tag Editor Component
function EndpointTagEditor({ endpoint, onTagsAdded, onTagsRemoved, allTags = [], tagsLoading = false, tagsError = "", onRefreshTags, api_id }) {
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
    if (!api_id) {
      setMessage('⚠ API ID is missing. Cannot add tags.');
      return;
    }
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
        api_id: api_id,
        endpoint_id: endpoint.id
      });
      setMessage('✅ Tags added!');
      setTagInput('');
      
      const newTags = [...new Set([...currentTags, ...tags])];
      setCurrentTags(newTags);
      
      if (onRefreshTags) {
        onRefreshTags(api_id);
      }
      
      if (onTagsAdded) onTagsAdded(tags);
    } catch (err) {
      setMessage('⚠ ' + err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveTags = async () => {
    if (!api_id) {
        setMessage('⚠ API ID is missing. Cannot remove tags.');
        return;
    }
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
        api_id: api_id,
        endpoint_id: endpoint.id
      });
      setMessage('✅ Tags removed!');
      setRemoveInput('');
      
      const newTags = currentTags.filter(tag => !tags.includes(tag));
      setCurrentTags(newTags);
      
      if (onRefreshTags) {
        onRefreshTags(api_id);
      }
      
      if (onTagsRemoved) onTagsRemoved(tags);
    } catch (err) {
      setMessage('⚠ ' + err.message);
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
          api_id: api_id,          
          endpoint_id: endpoint.id 
        });
      setMessage('✅ Tags replaced!');
      setReplaceInput('');
      
      setCurrentTags(tags);
      
      if (onRefreshTags) {
        onRefreshTags(api_id);
      }
      
      if (onTagsAdded) onTagsAdded(tags);
    } catch (err) {
      setMessage('⚠ ' + err.message);
    } finally {
      setReplacing(false);
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
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

// Flag Editor Component
function EndpointFlagEditor({ endpoint, allFlags = [], onFlagsChanged, api_id }) {
  const [flagInput, setFlagInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');
  const [currentFlags, setCurrentFlags] = useState(endpoint.flags || []);

  useEffect(() => {
    setCurrentFlags(endpoint.flags || []);
  }, [endpoint.flags]);

  const handleAddFlag = async () => {
    if (!api_id) {
      setMessage('⚠ API ID is missing. Cannot add flag.');
      return;
    }
    const flag = flagInput.trim();
    if (!flag) {
      setMessage('Please enter a flag.');
      return;
    }
    
    if (currentFlags.includes(flag)) {
      setMessage('Flag already exists.');
      return;
    }

    setAdding(true);
    setMessage('');
    try {
      await addFlagsToEndpoint({
        endpoint_id: endpoint.id,
        flag,
        api_id: api_id
      });
      setMessage('✅ Flag added!');
      setFlagInput('');
      
      const newFlags = [...currentFlags, flag];
      setCurrentFlags(newFlags);
      
      if (onFlagsChanged) onFlagsChanged(newFlags);
    } catch (err) {
      setMessage('⚠ ' + err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveFlag = async (flagToRemove) => {
    if (!api_id) {
      setMessage('⚠ API ID is missing. Cannot remove flag.');
      return;
    }
    try {
      await removeFlagsFromEndpoint({
        endpoint_id: endpoint.id,
        flag: flagToRemove,
        api_id: api_id
      });
      
      const newFlags = currentFlags.filter(flag => flag !== flagToRemove);
      setCurrentFlags(newFlags);
      
      if (onFlagsChanged) onFlagsChanged(newFlags);
    } catch (err) {
      setMessage('⚠ ' + err.message);
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 4 }}>
          Current Flags:
        </div>
        {currentFlags && currentFlags.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {currentFlags.map(flag => (
              <span key={flag} style={{
                display: 'inline-block', 
                background: "#3b82f6", 
                color: "white",
                borderRadius: 8, 
                padding: "2px 8px", 
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer'
              }}
              onClick={() => handleRemoveFlag(flag)}
              title="Click to remove flag">
                {flag} ×
              </span>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "#999", fontStyle: 'italic' }}>
            No flags assigned
          </div>
        )}
      </div>

      {allFlags && allFlags.length > 0 ? (
        <div style={{ marginBottom: 5, fontSize: 12, color: "#888", whiteSpace: 'pre-line' }}>
          <strong>Available flags:</strong>{" "}
          {allFlags.map(flag => (
            <span key={flag} style={{
              display: 'inline-block', background: "#f3f4f6", color: "#6366f1",
              borderRadius: 8, padding: "2px 8px", marginRight: 4, marginBottom: 2, fontWeight: 600
            }}>{flag}</span>
          ))}
        </div>
      ) : null}

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
        <input
          type="text"
          placeholder="Add flag"
          value={flagInput}
          onChange={e => setFlagInput(e.target.value)}
          disabled={adding}
          style={{ padding: 4, borderRadius: 4, minWidth: 120 }}
        />
        <button
          onClick={handleAddFlag}
          disabled={adding}
          style={{
            marginLeft: 6,
            padding: '4px 12px',
            borderRadius: 4,
            background: '#3b82f6',
            color: 'white',
            fontWeight: 600,
            cursor: adding ? 'not-allowed' : 'pointer'
          }}
        >
          {adding ? "Adding..." : "Add Flag"}
        </button>
      </div>
      {message && <div style={{ fontSize: 13, marginTop: 3 }}>{message}</div>}
    </div>
  );
}

const SCAN_TYPES = [
  "OWASP_API_10",
  "Sensitive Data Exposure",
  "Broken Authentication", 
  "SQL Injection",
  "Command Injection",
  "Rate Limit Bypass",
  "Security Misconfig",
  "XSS Test",
  "SSRF Attempt",
  "Fuzzing Suite"
];

const AVAILABLE_FLAGS = [
  "BOLA", "BKEN_AUTH", "BOPLA", "URC", "BFLA", "UABF", "SSRF", 
  "SEC_MISC", "IIM", "UCAPI", "SKIP"
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
      const response = await fetch(`/api/scan/details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ scan_id: scanId })
      });

      if (!response.ok) {
        return { hasResults: false, error: `HTTP ${response.status}` };
      }
      
      const data = await response.json();
      
      if (!data.success) {
        return { hasResults: false, error: data.message || 'Polling request failed' };
      }

      if (data.data && data.data.status === 'completed') {
        return { 
          hasResults: true, 
          results: data.data.results,
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
      pollInterval = 5000,
      maxAttempts = 36,
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
    this.simulateProgress(scanId, onProgress, onStepComplete);

    const poll = async () => {
      attempts++;
      
      const result = await this.checkScanResults(scanId);
      
      if (result.isComplete) {
        this.stopMonitoring(scanId);
        if (onComplete) {
          onComplete(result.results);
        }
        return;
      }
      
      if (result.error) {
        this.stopMonitoring(scanId);
        if (onError) {
          onError(new Error(result.error));
        }
        return;
      }
      
      if (attempts >= maxAttempts) {
        this.stopMonitoring(scanId);
        if (onError) {
          onError(new Error('Scan timeout - results not available after maximum attempts'));
        }
        return;
      }
      
      const timeoutId = setTimeout(poll, pollInterval);
      this.activeScanIntervals.set(scanId, timeoutId);
    };

    const initialTimeoutId = setTimeout(poll, pollInterval);
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
      
      if (currentStepIndex < SCAN_STEPS.length) {
        setTimeout(executeStep, step.duration);
      }
    };

    executeStep();
  }

  stopMonitoring(scanId) {
    const timeoutId = this.activeScanIntervals.get(scanId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.activeScanIntervals.delete(scanId);
      this.scanProgress.delete(scanId);
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

  const vulnerabilities = results.result || results.vulnerabilities || results.results || [];
  
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
    // This function remains the same
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
            .evidence { background: #f1f1f1; padding: 10px; border-radius: 4px; font-family: monospace; white-space: pre-wrap; word-wrap: break-word; }
          </style>
        </head>
        <body>
          <div class="header" style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h1>🔒 Security Scan Report</h1>
              <h2>API: ${apiName}</h2>
              <p>Generated: ${new Date().toLocaleString()}</p>
            </div>
            <img src="${logoImage}" alt="Company Logo" style="height: 150px; width: auto;" />
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
                ${vuln.evidence ? `<div class="vuln-details"><strong>Evidence:</strong></div><div class="evidence">${typeof vuln.evidence === 'object' ? JSON.stringify(vuln.evidence, null, 2) : vuln.evidence}</div>` : ''}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
              🔒 Security Scan Report
            </h2>
            <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>
              API: {apiName}
            </p>
          </div>
          <img src={logoImageW} alt="Company Logo" style={{ height: '80px', width: 'auto', marginLeft: '-20px' }} />
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
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all'
                        }}>
                          {/* FIX: Check if evidence is an object and stringify it if so */}
                          {typeof vuln.evidence === 'object' 
                            ? JSON.stringify(vuln.evidence, null, 2) 
                            : vuln.evidence}
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
              {progress.currentStepLabel || 'ATAT deployed - API scan underway...'}
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

// New: Scan Profile Selection Modal
const ScanProfileModal = ({ 
  isOpen, 
  onClose, 
  api, 
  onProfileSelected,
  scanLoading 
}) => {
  const [selectedScanType, setSelectedScanType] = useState("OWASP_API_10");
  const [creatingScan, setCreatingScan] = useState(false);
  const [error, setError] = useState('');

  const handleCreateScan = async () => {
    if (!api) return;
    const user_id = localStorage.getItem('currentUser_id') || 'default_user';
    
    setCreatingScan(true);
    setError('');
    try {
      const api_id = api.api_id || api.id;
      
      const response = await fetch("/api/scan/create", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({ 
          user_id: user_id,
          api_id: api_id,
          scan_profile: selectedScanType
        }),
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create scan");
      }

      onProfileSelected(result.data.scan_id, selectedScanType);
      onClose();
    } catch (error) {
      setError(error.message || "Failed to create scan");
    } finally {
      setCreatingScan(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1004 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ 
        minWidth: '500px', 
        maxWidth: '90vw', 
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
              ⚙️ Select Scan Profile
            </h2>
            <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>
              API: {api.name || api.filename}
            </p>
          </div>
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

        {/* Content */}
        <div className="modal-form">
          <div style={{ marginBottom: '20px' }}>
          <h3>Select Scan Profile:</h3>
            <select
              value={selectedScanType}
              onChange={(e) => setSelectedScanType(e.target.value)}
              disabled={creatingScan}
              style={{ 
                padding: '8px 12px', 
                borderRadius: '4px', 
                border: '1px solid #ddd',
                width: '100%',
                maxWidth: '300px'
              }}
            >
              {SCAN_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            
            <button
              onClick={handleCreateScan}
              disabled={creatingScan}
              style={{
                marginTop: '15px',
                padding: '10px 20px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: creatingScan ? 'not-allowed' : 'pointer',
                fontWeight: '600'
              }}
            >
              {creatingScan ? 'Creating Scan...' : 'Create Scan & Set Flags'}
            </button>
          </div>

          {error && (
            <div style={{ 
              padding: '10px', 
              background: '#fee2e2', 
              color: '#dc2626', 
              borderRadius: '4px',
              marginBottom: '20px'
            }}>
              ⚠ {error}
            </div>
          )}

          <div style={{ fontSize: '14px', color: '#666' }}>
            <p>This will:</p>
            <ol style={{ paddingLeft: '20px', marginTop: '10px' }}>
              <li>Create a new scan with the selected profile</li>
              <li>Automatically set appropriate flags for each endpoint</li>
              <li>Allow you to review and modify flags before starting the scan</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

// New: Endpoint Flags Modal
const EndpointFlagsModal = ({ 
  isOpen, 
  onClose, 
  api, 
  scanId,
  scanProfile,
  onScanStart,
  scanLoading 
}) => {
  const [endpoints, setEndpoints] = useState([]);
  const [endpointsLoading, setEndpointsLoading] = useState(false);
  const [endpointsError, setEndpointsError] = useState('');
  const [expandedEndpoint, setExpandedEndpoint] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && api) {
      fetchEndpoints();
    }
  }, [isOpen, api]);

  const fetchEndpoints = async () => {
    setEndpointsLoading(true);
    setEndpointsError('');
    try {
      const id = api.api_id || api.id;
      const endpointsData = await fetchApiEndpoints(id);
      
      let endpoints = endpointsData;
      if (endpoints && typeof endpoints === 'object' && Array.isArray(endpoints.endpoints)) {
        endpoints = endpoints.endpoints;
      } else if (!Array.isArray(endpoints)) {
        endpoints = [];
      }
      
      // Fetch details for each endpoint to get flags
      const endpointsWithDetails = await Promise.all(
        endpoints.map(async endpoint => {
          try {
            const details = await fetchEndpointDetails({
              endpoint_id: endpoint.id,
              path: endpoint.path,
              method: endpoint.method,
              api_id: id
            });
            return { ...endpoint, flags: details.flags || [] };
          } catch (error) {
            console.error('Error fetching endpoint details:', error);
            return { ...endpoint, flags: [] };
          }
        })
      );
      
      setEndpoints(endpointsWithDetails);
    } catch (err) {
      setEndpointsError(err.message || "Failed to load endpoints");
      setEndpoints([]);
    } finally {
      setEndpointsLoading(false);
    }
  };

const handleStartScan = () => {
  if (scanProfile) {
    onScanStart(scanProfile);
    onClose();
  } else {
    console.warn("⚠️ scanId missing!");
  }
};

  if (!isOpen) return null;

    return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1005 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ 
        minWidth: '800px', 
        maxWidth: '90vw', 
        maxHeight: '90vh', 
        overflow: 'auto',
        background: 'white'
      }}>
        {/* Header */}
        <div style={{
          background: 'var(--primary-gradient, linear-gradient(135deg, #667eea 0%, #764ba2 100%))',
          color: 'white',
          padding: '20px 30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
              🚩 Endpoint Flags
            </h2>
            <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>
              API: {api.name || api.filename} | Scan ID: {scanId}
            </p>
          </div>
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

        {/* Content */}
        <div style={{ 
          padding: '20px', 
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: 'var(--text-primary)' }}>Review and Modify Flags</h3>
            <p style={{ 
              fontSize: '14px', 
              color: 'var(--text-secondary)' 
            }}>
              Review the automatically assigned flags for each endpoint. You can modify them if needed before starting the scan.
            </p>
          </div>

          {endpointsError && (
            <div style={{ 
              padding: '10px', 
              background: 'rgba(var(--danger-color-rgb), 0.1)', 
              color: 'var(--danger-color)', 
              borderRadius: '4px',
              marginBottom: '20px',
              border: '1px solid var(--danger-color)'
            }}>
              ⚠ {endpointsError}
            </div>
          )}

          {/* Search Bar */}
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Search endpoints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                width: '100%',
                maxWidth: '400px'
              }}
            />
          </div>

          {/* Endpoints and Flags */}
          <div>
            <div style={{ 
              maxHeight: '500px', 
              overflow: 'auto',
              border: '1px solid var(--secondary-color)',
              borderRadius: '4px',
              padding: '10px',
              background: 'var(--bg-primary)'
            }}>
              {endpointsLoading ? (
                <div style={{ color: 'var(--text-secondary)' }}>Loading endpoints...</div>
              ) : endpoints.filter(endpoint => 
                  (endpoint.path || endpoint.url || '').toLowerCase().includes(searchTerm.toLowerCase())
                ).length === 0 ? (
                <div style={{ color: 'var(--text-secondary)' }}>
                  {searchTerm ? `No endpoints found matching "${searchTerm}"` : 'No endpoints found.'}
                </div>
              ) : (
                endpoints
                  .filter(endpoint => 
                    (endpoint.path || endpoint.url || '').toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((endpoint, index) => (
                    <div key={index} style={{ 
                      marginBottom: '15px', 
                      padding: '10px',
                      border: '1px solid var(--secondary-color)',
                      borderRadius: '4px',
                      background: 'var(--bg-secondary)'
                    }}>
                      <div 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          cursor: 'pointer',
                          color: 'var(--text-primary)'
                        }}
                        onClick={() => setExpandedEndpoint(expandedEndpoint === index ? null : index)}
                      >
                        <div>
                          <strong style={{ 
                            padding: '2px 6px', 
                            borderRadius: '3px', 
                            background: '#3b82f6', 
                            color: 'white',
                            marginRight: '8px',
                            fontSize: '12px'
                          }}>
                            {endpoint.method || 'GET'}
                          </strong>
                          <span>{endpoint.path || endpoint.url}</span>
                        </div>
                        <span>{expandedEndpoint === index ? '▲' : '▼'}</span>
                      </div>
                      
                      {expandedEndpoint === index && (
                        <div style={{ marginTop: '10px' }}>
                          <EndpointFlagEditor 
                            endpoint={endpoint}
                            allFlags={AVAILABLE_FLAGS}
                            api_id={api?.api_id || api?.id}
                            onFlagsChanged={(newFlags) => {
                              const updatedEndpoints = [...endpoints];
                              updatedEndpoints[index].flags = newFlags;
                              setEndpoints(updatedEndpoints);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
            
            <div style={{ 
              marginTop: '20px', 
              display: 'flex', 
              gap: '10px',
              paddingTop: '20px',
              borderTop: '1px solid var(--secondary-color)'
            }}>
              <button
                onClick={() => handleStartScan()}
                disabled={scanLoading}
                className="save-btn"
              >
                {scanLoading ? 'Starting...' : 'Start Scan'}
              </button>
              
              <button
                onClick={onClose}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ManageAPIs = () => {
  // All state variables - declared first to avoid temporal dead zone issues
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
  const [isScanProfileModalOpen, setIsScanProfileModalOpen] = useState(false);
  const [isEndpointFlagsModalOpen, setIsEndpointFlagsModalOpen] = useState(false);
  const [scanTargetApi, setScanTargetApi] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [currentScanId, setCurrentScanId] = useState(null);
  const [detailedResults, setDetailedResults] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [scanMonitoringService] = useState(() => new ScanMonitoringService());
  const [selectedScanProfile, setSelectedScanProfile] = useState(null);
    const [currentApi, setCurrentApi] = useState(null);
  
  // New enhanced scan progress state
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [scanProgress, setScanProgress] = useState({
    currentStep: 0,
    totalSteps: 1,
    currentStepLabel: 'Deploying ATAT...',
    progress: 0
  });
  
  // Backend APIs state (replacing localStorage)
  const [apis, setApis] = useState([]);
  const [apisLoading, setApisLoading] = useState(false);
  const [apisError, setApisError] = useState('');
  
  // Additional state variables that were declared later

  
  // New state for past scan selection modal
  const [pastScans, setPastScans] = useState(null);
  const [showScanSelectionModal, setShowScanSelectionModal] = useState(false);
  const [selectedScanId, setSelectedScanId] = useState(null);
  const [scanSelectionApi, setScanSelectionApi] = useState(null);
  
  const navigate = useNavigate?.() || { push: () => {}, replace: () => {} };
  const location = useLocation?.() || { pathname: '/manage-apis' };
  
  const themeContext = useContext(ThemeContext) || { darkMode: false, toggleDarkMode: () => {} };
  const { darkMode = false, toggleDarkMode = () => {} } = themeContext;
  
  const authContext = useAuth() || { currentUser: null, logout: () => {}, getUserFullName: () => 'User' };
  const userId = authContext.currentUser?.id;
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

  // Load APIs from backend on component mount
  useEffect(() => {
    loadApisFromBackend();
  }, []);

  // Cleanup scan monitoring on unmount
  useEffect(() => {
    return () => {
      scanMonitoringService.stopAllMonitoring();
    };
  }, [scanMonitoringService]);

  // Backend API functions
  const loadApisFromBackend = async () => {
    setApisLoading(true);
    setApisError('');
    try {
      const apisData = await fetchAllApis();
      setApis(Array.isArray(apisData) ? apisData : []);
    } catch (error) {
      console.error('Error loading APIs:', error);
      setApisError(error.message || 'Failed to load APIs');
      setApis([]);
    } finally {
      setApisLoading(false);
    }
  };

  const fetchPastScans = async (api) => {
    const user_id = localStorage.getItem('currentUser_id') || 'default_user';
    setScanSelectionApi(api);

    try {
      const res = await fetch(`http://localhost:3001/api/scan/list?user_id=${user_id}`, { method: 'GET' });
      const body = await res.json();

      if (!body || !body.success || !body.data || !body.data.result) {
        showMessage('No past scans found.', 'info');
        return;
      }

      const resultObj = body.data.result || {};

      const safeParseJSON = (maybeJson) => {
        if (maybeJson == null) return maybeJson;
        if (typeof maybeJson === 'object') return maybeJson;
        if (typeof maybeJson !== 'string') return maybeJson;
        try { return JSON.parse(maybeJson); } catch (e) { return maybeJson; }
      };

      const scans = Object.entries(resultObj).map(([scanId, rawResults]) => {
        let normalized = Array.isArray(rawResults)
          ? rawResults.map(r => safeParseJSON(r)).filter(Boolean)
          : [];

        if (normalized.length === 1) {
          const first = normalized[0];
          if (first && Array.isArray(first.result)) normalized = first.result;
          else if (first && Array.isArray(first.vulnerabilities)) normalized = first.vulnerabilities;
        }

        normalized = normalized.map(item => {
          if (item && item.result && Array.isArray(item.result)) return item.result;
          if (item && item.vulnerabilities && Array.isArray(item.vulnerabilities)) return item.vulnerabilities;
          return item;
        }).flat();

        const firstTsItem = normalized.find(r => r && (r.timestamp || r.date));
        const firstTs = firstTsItem && firstTsItem.timestamp ? new Date(firstTsItem.timestamp).getTime() : 0;

        return { scanId, results: normalized, firstTimestamp: firstTs };
      });

      if (!scans.length) {
        showMessage('No past scans found.', 'info');
        return;
      }

      scans.sort((a, b) => b.firstTimestamp - a.firstTimestamp);

      setPastScans(scans);
      setShowScanSelectionModal(true);
      setSelectedScanId(scans[0].scanId);
    } catch (err) {
      console.error('Error fetching past scans:', err);
      showMessage('Failed to fetch past scans.', 'error');
    }
  };

  // Fetches tags for a specific API
  const refreshApiTags = useCallback(async (api_id) => {
    if (!api_id) return;
    setTagsLoading(true);
    setTagsError('');
    try {
      const tags = await fetchAllTags(api_id);
      setAllTags(Array.isArray(tags) ? tags : []);
    } catch (e) {
      setTagsError(e.message || "Failed to fetch tags for this API");
    } finally {
      setTagsLoading(false);
    }
  }, []);

  // Handler for when a profile is selected and scan is created
  const handleProfileSelected = (scanId, scanProfile) => {
    setCurrentScanId(scanId);
    setSelectedScanProfile(scanProfile);
    setIsScanProfileModalOpen(false);
    setIsEndpointFlagsModalOpen(true);
  };

  // ENHANCED API scanning handler with realistic progress
  const handleScanStart = async (scanProfile) => {
    setScanLoading(true);
    setScanResult(null);
    setScanError("");
    setDetailedResults(null);
    setShowProgressModal(true);
    setScanProgress({
      currentStep: 0,
      totalSteps: SCAN_STEPS.length,
      currentStepLabel: 'Deploying ATAT...',
      progress: 0
    });

    try {
      // Determine the API from the current scanTargetApi
      const api = scanTargetApi;
      const apiName = api.filename || api.name || api.fileName || `API_${api.api_id || api.id}`;

      if (!apiName) {
        throw new Error(`Missing required data: apiName=${apiName}`);
      }

      showMessage(`🔍 Starting enhanced scan for "${apiName}"...`, "info");

      const user_id = localStorage.getItem('currentUser_id') || 'default_user'; 
      const startScanResponse = await fetch("/api/scan/start", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({ 
          api_id: api.api_id || api.id,
          scan_profile: scanProfile || "OWASP_API_10",
          user_id: user_id
        }),
      });

      const startScanResult = await startScanResponse.json();
      
      if (!startScanResponse.ok || !startScanResult.success) {
        console.error('Start scan failed:', startScanResult);
        if (startScanResponse.status === 503) {
          throw new Error("A scan is already in progress. Please wait for it to complete.");
        }
        throw new Error(startScanResult.message || "Failed to start scan");
      }

      const returnedScanId = startScanResult.data?.scan_id || startScanResult.scan_id;

      if (!returnedScanId) {
        throw new Error('No scan_id returned from start scan');
      }

      setCurrentScanId(returnedScanId);
      
      // Update the API in the backend to reflect the scan status
      setApis(prev => prev.map(apiItem => 
        apiItem.id === api.id || apiItem.api_id === api.api_id ? {
          ...apiItem,
          scan_id: returnedScanId,
          scanStatus: 'Running'
        } : apiItem
      ));

      showMessage(`🔥 Enhanced scan started with ID: ${returnedScanId}. Monitoring with realistic progress...`, "info");

      startEnhancedScanMonitoring(returnedScanId, api, apiName);

    } catch (error) {
      setScanError(error.message || "Scan failed");
      showMessage(`⚠ Scan failed: ${error.message}`, "error");
      setScanLoading(false);
      setCurrentScanId(null);
      setShowProgressModal(false);
    }
  };

  const startEnhancedScanMonitoring = (scanId, targetApi, apiName) => {
    scanMonitoringService.startMonitoring(scanId, {}, {
      pollInterval: 10000,
      maxAttempts: 30,
      onProgress: (progressInfo) => {
        setScanProgress(progressInfo);
        showMessage(`🔥 ${progressInfo.stepLabel} (${progressInfo.progress}%)`, "info");
      },
      onStepComplete: (step) => {
        // console.log(`✅ Completed: ${step.label}`); 
      },
      onComplete: (results) => {
        handleEnhancedScanComplete(scanId, results, targetApi, apiName);
      },
      onError: (error) => {
        handleEnhancedScanError(scanId, error, targetApi);
      }
    });
  };

const handleEnhancedScanComplete = (scanId, results, targetApi, apiName) => {
    console.log('✅ Enhanced scan completed with results:', results);
    
    setDetailedResults(results);
    const vulnCount = results?.result?.length || results?.vulnerabilities?.length || results?.results?.length || 0;
    setScanResult(`✅ Scan completed! Found ${vulnCount} vulnerabilities.`);
    setScanLoading(false);
    setCurrentScanId(null);
    setShowProgressModal(false);
    
    setShowResultsModal(true);
    setIsEndpointFlagsModalOpen(false);
    
    // Update the API state
    setApis(prev => prev.map(api => 
      api.id === targetApi.id || api.api_id === targetApi.api_id ? {
        ...api,
        lastScanned: new Date().toISOString().split('T')[0],
        scanStatus: 'Completed',
        scanCount: (api.scanCount || 0) + 1,
        lastScanResult: vulnCount > 0 ? 'Issues Found' : 'Clean',
        vulnerabilitiesFound: vulnCount,
        scanResults: results
      } : api
    ));
    
    showMessage(`✅ Enhanced scan completed! Found ${vulnCount} vulnerabilities. Results displayed.`, 'success');
  };

  const handleEnhancedScanError = (scanId, error, targetApi) => {
    console.error('⚠ Enhanced scan monitoring failed:', error);
    setScanError(error.message || 'Scan monitoring failed');
    setScanLoading(false);
    setCurrentScanId(null);
    setShowProgressModal(false);
    
    setApis(prev => prev.map(api => 
      api.id === targetApi.id || api.api_id === targetApi.api_id ? {
        ...api,
        lastScanResult: 'Failed'
      } : api
    ));
    
    showMessage(`⚠ Enhanced scan monitoring failed: ${error.message}`, 'error');
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
      method: endpoint.method,
      api_id: selectedApiForEndpoints?.api_id || selectedApiForEndpoints?.id
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
      await refreshApiTags(id); 

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
      const total = apis.length;
      const active = apis.filter(api => api.status === 'Active').length;
      const totalScans = apis.reduce((sum, api) => sum + (api.scanCount || 0), 0);
      const issuesFound = apis.filter(api => api.lastScanResult === 'Issues Found').length;
      
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

  const handleDeleteApi = useCallback(async (api) => {
    try {
      if (!api) return;
      const confirmDelete = window.confirm(`Are you sure you want to delete "${api.name || api.filename}"?`);
      if (confirmDelete) {
        await deleteApi(api.api_id || api.id);
        await loadApisFromBackend(); // Refresh the APIs list
        showMessage(`🗑️ API "${api.name || api.filename}" deleted successfully!`, 'success');
      }
    } catch (error) {
      console.error('Error deleting API:', error);
      showMessage('Error deleting API. Please try again.', 'error');
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
    showMessage(`🔍 File "${file.name}" selected and ready for upload.`, 'info');

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
    formData.append("user_id", userId);

    try {
      const res = await fetch("http://localhost:3001/api/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Import failed");

      const { filename, api_id } = result.data;
      
      if (!filename) {
        console.error('No filename in import response:', result.data);
        throw new Error("Import response missing filename");
      }
      
      if (!api_id) {
        console.error('No api_id in import response:', result.data);
        throw new Error("Import response missing API ID");
      }

      showMessage(`✅ Imported API "${filename}" successfully! You can now scan it.`, "success");
      setIsImportModalOpen(false);
      
      // Refresh APIs list from backend
      await loadApisFromBackend();
      
      fileInput.value = '';
      
    } catch (err) {
      console.error('Import error:', err);
      setImportError(err.message || "Unexpected error.");
    } finally {
      setImportLoading(false);
    }
  };

const handleSaveApi = async () => {
  if (!currentApi || !currentApi.name || !currentApi.baseUrl) {
    alert("Please fill out Name and Base URL before saving.");
    return;
  }

  try {
    if (currentApi.id || currentApi.api_id) {
      // Update existing API
      await updateApi({
        api_id: currentApi.api_id || currentApi.id,
        name: currentApi.name,
        description: currentApi.description,
        baseUrl: currentApi.baseUrl
      });
      showMessage('✅ API updated successfully!', 'success');
    } else {
      // Create new API
      await createApi({
        name: currentApi.name,
        description: currentApi.description,
        baseUrl: currentApi.baseUrl
      });
      showMessage('✅ API created successfully!', 'success');
    }
    
    // Refresh APIs list
    await loadApisFromBackend();
    
    setIsModalOpen(false);
    setCurrentApi(null);
  } catch (error) {
    console.error('Error saving API:', error);
    showMessage(`Error saving API: ${error.message}`, 'error');
  }
};

  const [isVisible, setIsVisible] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);

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
            <Link to="/manage-apis" className={location.pathname === '/manage-apis' ? 'active' : ''}>API Management</Link>
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

          {/* Backend APIs Section */}
          {apisLoading ? (
            <section className="apis-list-section">
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div>Loading APIs from backend...</div>
              </div>
            </section>
          ) : apisError ? (
            <section className="apis-list-section">
              <div style={{ textAlign: 'center', padding: '40px', color: '#dc2626' }}>
                Error loading APIs: {apisError}
                <br />
                <button onClick={loadApisFromBackend} style={{ marginTop: '10px' }}>
                  Retry
                </button>
              </div>
            </section>
          ) : apis.length > 0 ? (
            <section 
              id="backend-apis" 
              className={`apis-list-section animate-on-scroll ${isVisible['backend-apis'] ? 'visible' : ''}`}
            >
              <div className="apis-list">
                <div className="apis-list-header">
                  <h3 className="list-title">🔧 Backend APIs</h3>
                  <p className="list-description">Managed APIs from backend</p>
                </div>
                <div className="apis-grid">
                  {apis.map((api, index) => (
                    <div key={api.id || api.api_id} className="api-card" style={{
                      animationDelay: `${index * 0.1}s`,
                      border: '2px solid #240042ff',
                      background: 'linear-gradient(135deg, #741c80ff, #24003bff)'
                    }}>
                      <div className="api-card-header">
                        <h4 className="api-name" style={{ color: 'white' }}>
                          {api.name || api.filename || 'Unnamed API'}
                        </h4>
                        <span className={`api-status ${(api.status || 'Active').toLowerCase()}`} style={{
                          background: api.scanStatus === 'Running' ? '#fbbf24' : 
                                     api.scanStatus === 'Completed' ? '#10b981' : '#6b7280',
                          color: 'white'
                        }}>
                          {api.scanStatus || api.status || 'Active'}
                        </span>
                      </div>
                      
                      <div className="api-url" style={{ color: '#e0e7ff' }}>
                        {api.base_url || api.baseUrl || `API ID: ${api.api_id || api.id}`}
                      </div>
                      
                      <div className="api-meta" style={{ color: '#c7d2fe' }}>
                        <span>Last scanned: {api.lastScanned || 'Never'}</span>
                        {api.vulnerabilitiesFound > 0 && (
                          <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>
                            ⚠️ {api.vulnerabilitiesFound} vulnerabilities
                          </span>
                        )}
                      </div>

                      <div className="api-card-actions">
                        <button
                          onClick={() => {
                            setScanTargetApi(api);
                            setIsScanProfileModalOpen(true);
                          }}
                          className="action-btn scan"
                          title="Select Scan Profile"
                          disabled={scanLoading && currentScanId === api.scan_id}
                          style={{
                            background: scanLoading && currentScanId === api.scan_id ? '#fbbf24' : '#10b981',
                            color: 'white'
                          }}
                        >
                          {scanLoading && currentScanId === api.scan_id ? '🔄 Scanning...' : '⚙️ Select Profile'}
                        </button>

                        {api.vulnerabilitiesFound > 0 && (
                        <button
                          onClick={() => {
                            fetchPastScans(api);
                          }}
                          className="action-btn"
                          title="View Scan Results"
                          style={{ background: "#f59e0b", color: "white" }}
                        >
                          📊 Results
                        </button>
                        )}

                        <button
                          onClick={() => handleViewEndpoints(api)}
                          className="action-btn endpoints"
                          title="View Endpoints"
                          style={{ background: "#081dd6ff", color: "#fff" }}
                        >
                          📂 Tags
                        </button>

                        <button
                          onClick={() => handleEditApi(api)}
                          className="action-btn edit"
                          title="Edit API"
                          style={{ background: "#3b82f6", color: "white" }}
                        >
                          ✏️ Edit
                        </button>
                        
                        <button
                          onClick={() => handleDeleteApi(api)}
                          className="action-btn delete"
                          title="Delete API"
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
          ) : (
            <section className="apis-list-section">
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p>No APIs found. Create or import an API to get started.</p>
              </div>
            </section>
          )}
          
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

        {/* Scan Profile Selection Modal */}
        <ScanProfileModal
          isOpen={isScanProfileModalOpen}
          onClose={() => setIsScanProfileModalOpen(false)}
          api={scanTargetApi}
          onProfileSelected={handleProfileSelected}
          scanLoading={scanLoading}
        />

        {/* Past Scans Selection Modal */}
        {showScanSelectionModal && pastScans && (
          <div
            className="modal-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000
            }}
          >
            <div
              className="modal-card"
              style={{
                width: 'min(820px, 96%)',
                background: 'linear-gradient(135deg, rgba(70,38,75,0.96), rgba(27,0,27,0.96))',
                borderRadius: 10,
                padding: 20,
                boxShadow: '0 12px 40px rgba(2,6,23,0.6)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'var(--text-on-dark, #e6eef8)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, color: 'inherit' }}>Select a past scan</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="action-btn"
                    onClick={() => {
                      setShowScanSelectionModal(false);
                      setPastScans(null);
                    }}
                    title="Close"
                    style={{ background: '#ef4444', color: 'white' }}
                  >
                    ✖ Close
                  </button>
                </div>
              </div>

              <div
                style={{
                  maxHeight: '52vh',
                  overflowY: 'auto',
                  padding: 12,
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.02)'
                }}
              >
                {pastScans.length === 0 && (
                  <div style={{ padding: 12, color: '#cbd5e1' }}>No past scans found.</div>
                )}

                {pastScans.map((scan) => (
                  <div
                    key={scan.scanId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 6px',
                      borderBottom: '1px solid rgba(255,255,255,0.03)'
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: 'monospace', color: 'var(--text-muted, #e6eef8)' }}>{scan.scanId}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>
                        {scan.results && scan.results.length
                          ? `Results: ${scan.results.length} • First: ${new Date(scan.firstTimestamp).toLocaleString()}`
                          : 'No results'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="action-btn"
                        onClick={() => {
                          if (!scan.results || !scan.results.length) {
                            showMessage('No detailed results available for that scan.', 'info');
                            return;
                          }

                          const safeParseJSON = (maybeJson) => {
                            if (maybeJson == null) return maybeJson;
                            if (typeof maybeJson === 'object') return maybeJson;
                            try { return JSON.parse(maybeJson); } catch (e) { return maybeJson; }
                          };

                          const parsed = scan.results.map(r => safeParseJSON(r)).filter(Boolean);

                          const payload = {
                            result: parsed,
                            vulnerabilities: parsed,
                            [scan.scanId]: parsed
                          };

                          setDetailedResults(payload);
                          setScanTargetApi(scanSelectionApi);
                          setShowScanSelectionModal(false);
                          setScanSelectionApi(null);
                          setPastScans(null);
                          setShowResultsModal(true);
                        }}
                        title="View Result"
                        style={{ background: "#f59e0b", color: "white" }}
                      >
                        View Result
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Endpoint Flags Modal */}
        <EndpointFlagsModal
          isOpen={isEndpointFlagsModalOpen}
          onClose={() => setIsEndpointFlagsModalOpen(false)}
          api={scanTargetApi}
          scanId={currentScanId}
          scanProfile={selectedScanProfile}
          onScanStart={handleScanStart}
          scanLoading={scanLoading}
        />

        {/* Add/Edit API Modal */}
        {isModalOpen && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
            <div className="modal-content">
              <div className="modal-header">
                <h2>{currentApi?.id || currentApi?.api_id ? '✏️ Edit API' : '➕ Add New API'}</h2>
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
                  {isLoading ? '⏳ Saving...' : (currentApi?.id || currentApi?.api_id ? '💾 Update API' : '➕ Add API')}
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
                    ⚠ {importError}
                  </div>
                )}
              </form>

              <div style={{ fontSize: 13, color: "#bbb", marginTop: 12 }}>
                Accepted: OpenAPI or Swagger .json/.yaml/.yml<br />
                Files will be processed and stored in the backend database.
              </div>
            </div>
          </div>
        )}

        {/* Endpoints Modal */}
        {selectedApiEndpoints !== null && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeEndpointsModal()}>
            <div className="modal-content" style={{ minWidth: 420, maxHeight: 540, overflow: 'auto' }}>
              <div className="modal-header">
                <h2>📂 Tags for "{selectedApiForEndpoints?.name || selectedApiForEndpoints?.filename || ''}"</h2>
                <button onClick={closeEndpointsModal} className="close-btn">×</button>
              </div>
              <div style={{ padding: 16 }}>
                {endpointsLoading ? (
                  <div>Loading endpoints...</div>
                ) : endpointsError ? (
                  <div style={{ color: '#e53e3e' }}>⚠ {endpointsError}</div>
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
                            api_id={selectedApiForEndpoints?.api_id}
                            onRefreshTags={refreshApiTags}
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
                <h2>📖 Tags Details</h2>
                <button onClick={() => setDetailModalOpen(false)} className="close-btn">×</button>
              </div>
              <div style={{ padding: 18 }}>
                {detailLoading ? (
                  <div>Loading...</div>
                ) : detailError ? (
                  <div style={{ color: '#e53e3e' }}>⚠ {detailError}</div>
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
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

function EndpointTagEditor({ endpoint, onTagsAdded, onTagsRemoved, allTags = [], tagsLoading = false, tagsError = "", onRefreshTags }) {
  const [tagInput, setTagInput] = React.useState('');
  const [removeInput, setRemoveInput] = React.useState('');
  const [replaceInput, setReplaceInput] = React.useState('');
  const [adding, setAdding] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);
  const [replacing, setReplacing] = React.useState(false);
  const [message, setMessage] = React.useState('');
  // Add state to track current endpoint tags
  const [currentTags, setCurrentTags] = React.useState(endpoint.tags || []);

  // Update current tags when endpoint changes
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
      
      // Update local state immediately
      const newTags = [...new Set([...currentTags, ...tags])];
      setCurrentTags(newTags);
      
      // Refresh available tags to include any new tags
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
      
      // Update local state immediately
      const newTags = currentTags.filter(tag => !tags.includes(tag));
      setCurrentTags(newTags);
      
      // Refresh available tags (some tags might no longer be used anywhere)
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
      
      // Update local state immediately
      setCurrentTags(tags);
      
      // Refresh available tags to include any new tags and remove unused ones
      if (onRefreshTags) {
        onRefreshTags();
      }
      
      if (onTagsAdded) onTagsAdded(tags); // Or a dedicated onTagsReplaced callback
    } catch (err) {
      setMessage('❌ ' + err.message);
    } finally {
      setReplacing(false);
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      {/* Display Current Tags */}
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

      {/* Add tags */}
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
      
      {/* Remove tags */}
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

      {/* Replace tags */}
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

const APIS_LOCAL_STORAGE_KEY = 'apiList';

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

const SCAN_TYPES = [
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

const ManageAPIs = () => {
  // Safe hooks with error handling
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
  const [selectedScanType, setSelectedScanType] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const navigate = useNavigate?.() || { push: () => {}, replace: () => {} };
  const location = useLocation?.() || { pathname: '/manage-apis' };
  
  // Safe context usage
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

  // State management with safe defaults
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

  // FIXED: Define refreshAllTags with useCallback and proper dependencies
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
  }, []); // Empty dependency array since it doesn't depend on any props or state

  // FIXED: Load tags only once when component mounts
  useEffect(() => {
    refreshAllTags();
  }, [refreshAllTags]);

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

  // Safe View Endpoint handler
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
    
    // Ensure each endpoint has a tags array - this is the key fix
    const endpointsWithTags = endpoints.map(endpoint => ({
      ...endpoint,
      tags: endpoint.tags || [] // Ensure tags is always an array
    }));
    
    setSelectedApiEndpoints(endpointsWithTags);
    
    // Force fetchAllTags to run and update the tags
    await refreshAllTags();  // Force reload of all tags
    
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

  // Safe logout handler
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

  // Show message with auto-hide
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

  // Safe user info handling
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

  // Calculate stats safely
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

  // Safe modal handlers
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

  const handleScanApi = useCallback((api) => {
    try {
      if (!api) return;
      showMessage(`🔍 Starting security scan for "${api.name}"...`, 'info');
      // Here you would typically trigger the actual scan
      setTimeout(() => {
        showMessage(`✅ Scan completed for "${api.name}"`, 'success');
      }, 2000);
    } catch (error) {
      console.error('Error starting scan:', error);
      showMessage('Error starting scan. Please try again.', 'error');
    }
  }, [showMessage]);

  // Safe input change handler
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
  
const handleFileUploadInModal = useCallback((e) => {
  try {
    const file = e.target.files?.[0];
    if (!file) {
      setPendingFile(null);
      return;
    }
    
    if (!file.name.toLowerCase().endsWith('.json') && 
        !file.name.toLowerCase().endsWith('.yaml') && 
        !file.name.toLowerCase().endsWith('.yml')) {
      showMessage('Please upload a JSON, YAML, or YML file.', 'error');
      setPendingFile(null);
      return;
    }

    // Store the file for later upload, don't upload immediately
    setPendingFile(file);
    showMessage(`📁 File "${file.name}" selected and ready for upload when you save the API.`, 'info');
    
    // Optionally, you can still parse the file locally to auto-fill form fields
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        let apiData;

        // Parse file content based on extension
        if (file.name.toLowerCase().endsWith('.json')) {
          try {
            apiData = JSON.parse(content);
          } catch (jsonError) {
            showMessage('Invalid JSON file format.', 'error');
            return;
          }
        } else if (file.name.toLowerCase().endsWith('.yaml') || file.name.toLowerCase().endsWith('.yml')) {
          try {
            apiData = YAML.parse(content);
          } catch (yamlError) {
            showMessage('Invalid YAML file format.', 'error');
            return;
          }
        }

        // Auto-fill form fields based on file content
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

        // Update form fields with parsed data
        setCurrentApi(prev => ({
          ...prev,
          name: prev?.name?.trim() ? prev.name : name,
          baseUrl: prev?.baseUrl?.trim() ? prev.baseUrl : baseUrl,
          description: prev?.description?.trim() ? prev.description : description,
          status: apiData.status || prev?.status || 'Active'
        }));

        showMessage(`✅ Form fields updated from "${file.name}". File will be uploaded when you save.`, 'success');
      } catch (error) {
        console.error('Error parsing file:', error);
        showMessage('Error parsing file content.', 'error');
      }
    };

    reader.onerror = () => {
      showMessage('Error reading file.', 'error');
    };

    reader.readAsText(file);
  } catch (error) {
    console.error('Error in file selection handler:', error);
    showMessage('Error processing file. Please try again.', 'error');
  }
}, [currentApi, showMessage]);




  // ----------- IMPORT API MODAL (BACKEND) -----------
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

      // Add to API list (extract name from filename for now)
      const { filename, api_id } = result.data;
      setApis((prevApis) => [
        ...prevApis,
        {
          id: Math.max(...prevApis.map(a => a.id), 0) + 1,
          name: filename.replace(/\.[^/.]+$/, ''),
          baseUrl: "",
          description: `Imported from ${filename}. Edit details as needed.`,
          status: "Active",
          lastScanned: "Never",
          scanCount: 0,
          lastScanResult: "Pending",
          api_id: api_id,
          filename: filename,
        }
      ]);
      showMessage(`✅ Imported API "${filename}" successfully!`, "success");
      setIsImportModalOpen(false);
    } catch (err) {
      setImportError(err.message || "Unexpected error.");
    } finally {
      setImportLoading(false);
    }
  };

  // Safe API save handler
const handleSaveApi = useCallback(async () => {
  try {
    if (!currentApi) return;
    
    setIsLoading(true);
    setError(null);
    
    // Validate required fields
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

    // If there's a pending file, upload it first
    if (pendingFile) {
      try {
        showMessage(`🔄 Uploading file "${pendingFile.name}"...`, 'info');
        
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
        
        // Update API data with upload results
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

    // Simulate API save delay (replace with your actual API call)
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (apiToSave.id) {
      // Update existing API
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
      // Add new API
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
    setPendingFile(null); // Clear the pending file
  } catch (error) {
    console.error('Error saving API:', error);
    setError('Failed to save API. Please try again.');
  } finally {
    setIsLoading(false);
  }
}, [currentApi, apis, showMessage, pendingFile]);

  // Safe delete confirmation handler
  const confirmDelete = useCallback(async () => {
    try {
      if (!apiToDelete) return;
      
      setIsLoading(true);
      
      // Simulate delete delay
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

  // Safe file upload handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    try {
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileUpload({ target: { files: e.dataTransfer.files } });
      }
    } catch (error) {
      console.error('Error handling file drop:', error);
      showMessage('Error processing dropped file.', 'error');
    }
  }, []);

const handleFileUpload = useCallback((e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) {
        showMessage('No file selected.', 'error');
        return;
      }

      const lowerName = file.name.toLowerCase();
      if (!lowerName.endsWith('.json') && !lowerName.endsWith('.yaml') && !lowerName.endsWith('.yml')) {
        showMessage('Please upload a JSON or YAML file.', 'error');
        return;
      }

      // Keep current form data, add file
      setFormData((prev) => ({ ...prev, file }));

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        let apiData;

        try {
          apiData = lowerName.endsWith('.json')
            ? JSON.parse(content)
            : YAML.parse(content);
        } catch {
          showMessage(`Invalid ${lowerName.endsWith('.json') ? 'JSON' : 'YAML'} file format.`, 'error');
          return;
        }

        const isOpenAPI = apiData.openapi || apiData.swagger;
        const nameFromFile = isOpenAPI
          ? apiData.info?.title || 'Imported OpenAPI'
          : apiData.name || '';
        const baseUrlFromFile = isOpenAPI
          ? apiData.servers?.[0]?.url || ''
          : apiData.baseUrl || '';
        const descriptionFromFile = isOpenAPI
          ? apiData.info?.description || ''
          : apiData.description || '';

        if (!baseUrlFromFile) {
          showMessage('No valid "baseUrl" or "servers.url" found in file.', 'error');
          return;
        }

        // Keep existing typed values if present
        setFormData((prev) => ({
          ...prev,
          name: prev.name || nameFromFile,
          baseUrl: prev.baseUrl || baseUrlFromFile,
          description: prev.description || descriptionFromFile
        }));

        const newApi = {
          id: Math.max(...apis.map((a) => a.id), 0) + 1,
          name: nameFromFile,
          baseUrl: baseUrlFromFile,
          description: descriptionFromFile,
          status: apiData.status || 'Active',
          lastScanned: 'Never',
          scanCount: 0,
          lastScanResult: 'Pending'
        };

        setApis((prev) => [...prev, newApi]);
        showMessage(`✅ API "${nameFromFile}" imported successfully!`, 'success');
        setIsModalOpen(false);

        if (e.target) e.target.value = '';
      };

      reader.onerror = () => {
        showMessage('Error reading file.', 'error');
      };

      reader.readAsText(file);
    } catch (error) {
      console.error('Error in file upload handler:', error);
      showMessage('Error uploading file. Please try again.', 'error');
    }
  }, [apis, showMessage, setApis]);

  // Loading state
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
        {/* Error Display */}
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
        {/* Message Display */}
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
          {/* Hero Section */}
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
          
          {/* API Statistics */}
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

          {/* Management Top Section */}
          <section className="manage-apis-top">
            <h2 className="section-title">Your APIs</h2>
            <button onClick={handleAddApi} className="add-api-btn">
              ➕ Add API
            </button>
          </section>

          {/* APIs List */}
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

                        {/* GROUP BUTTONS IN A CONTAINER */}
                        <div className="api-card-actions">
                          <button
                            onClick={() => {
                              setScanTargetApi(api);
                              setIsScanModalOpen(true);
                              setSelectedScanType(null);
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
                        {/* END GROUP */}
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

        {/* Add/Edit API Modal */}
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
          <label htmlFor="api-file">Import from File (Optional)</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              id="api-file"
              type="file"
              accept=".json,.yaml,.yml"
              onChange={handleFileUploadInModal}
              style={{
                padding: "8px",
                background: "#23232b",
                color: "#fff",
                borderRadius: 7,
                fontWeight: 600,
                border: "1px solid #444"
              }}
            />
            <small style={{ color: "#888", fontSize: "12px" }}>
              Upload OpenAPI/Swagger .json/.yaml/.yml file to auto-fill fields
            </small>
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
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setIsImportModalOpen(false)}>
            <div className="modal-content" style={{ minWidth: 380 }}>
              <div className="modal-header">
                <h2>⬆️ Import API Spec</h2>
                <button onClick={() => setIsImportModalOpen(false)} className="close-btn">×</button>
              </div>
              <form
                className="modal-form"
                style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 10 }}
                onSubmit={handleImportAPISubmit}
              >
                <label style={{ fontWeight: 600 }}>
                  <span>Choose .json, .yaml, or .yml file:</span>
                  <input
                    id="import-api-file"
                    type="file"
                    accept=".json,.yaml,.yml"
                    style={{
                      marginTop: 8,
                      padding: "7px",
                      background: "#23232b",
                      color: "#fff",
                      borderRadius: 7,
                      fontWeight: 600,
                    }}
                    disabled={importLoading}
                  />
                </label>
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
                  {importLoading ? "Uploading..." : "Import & Add API"}
                </button>
                {importError && (
                  <div style={{
                    background: "#ef444420",
                    color: "#f87171",
                    borderRadius: 8,
                    marginTop: 10,
                    padding: "8px 12px",
                    fontWeight: 600
                  }}>
                    ❌ {importError}
                  </div>
                )}
              </form>
              <div style={{ fontSize: 13, color: "#bbb", marginTop: 12 }}>
                Accepted: OpenAPI or Swagger .json/.yaml/.yml<br />
                After import, you can edit API details.
              </div>
            </div>
          </div>
        )}

        {/* Endpoints Modal */}
        {selectedApiEndpoints !== null && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeEndpointsModal()}>
            <div className="modal-content" style={{ minWidth: 420, maxHeight: 540, overflow: 'auto' }}>
              <div className="modal-header">
                <h2>📂 Endpoints for "{selectedApiForEndpoints?.name || ''}"</h2>
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
                  🔍 Scan API: <span style={{ color: "#fbbf24" }}>{scanTargetApi.name}</span>
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
                  onClick={async () => {
                    setScanLoading(true);
                    setScanResult(null);
                    setScanError("");
                    try {
                      // Replace this with a real API call to your backend
                      // Example:
                      // const res = await fetch('/api/scan', {
                      //   method: 'POST',
                      //   headers: { 'Content-Type': 'application/json' },
                      //   credentials: 'include',
                      //   body: JSON.stringify({ api_id: scanTargetApi.api_id || scanTargetApi.id, scanType: selectedScanType })
                      // });
                      // const data = await res.json();
                      // if (!res.ok || !data.success) throw new Error(data.message || "Scan failed");
                      // setScanResult(data.data);

                      // Demo placeholder:
                      await new Promise(r => setTimeout(r, 1400));
                      setScanResult(`Scan "${selectedScanType}" completed! (Demo result)`);
                    } catch (e) {
                      setScanError(e.message || "Scan failed.");
                    }
                    setScanLoading(false);
                  }}
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
                      Scanning...
                    </span>
                  ) : "Run Scan"}
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
                    {scanResult}
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
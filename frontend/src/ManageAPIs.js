import React, { useState, useContext, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './ManageAPIs.css';



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
function EndpointTagEditor({ endpoint, onTagsAdded }) {
  const [tagInput, setTagInput] = React.useState('');
  const [adding, setAdding] = React.useState(false);
  const [message, setMessage] = React.useState('');

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
      if (onTagsAdded) onTagsAdded(tags);
    } catch (err) {
      setMessage('❌ ' + err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
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
      {message && <div style={{ fontSize: 13, marginTop: 3 }}>{message}</div>}
    </div>
  );
}


const APIS_LOCAL_STORAGE_KEY = 'atat_saved_apis';

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


// Safe imports with fallbacks
let ThemeContext, useAuth, Logo;

try {
  const AppModule = require('./App');
  ThemeContext = AppModule.ThemeContext || React.createContext({ darkMode: false, toggleDarkMode: () => {} });
} catch {
  ThemeContext = React.createContext({ darkMode: false, toggleDarkMode: () => {} });
}

try {
  const AuthModule = require('./AuthContext');
  useAuth = AuthModule.useAuth || (() => ({ 
    currentUser: null, 
    logout: () => {}, 
    getUserFullName: () => 'User' 
  }));
} catch {
  useAuth = () => ({ 
    currentUser: { firstName: 'Demo' }, 
    logout: () => {}, 
    getUserFullName: () => 'Demo User' 
  });
}

try {
  const LogoModule = require('./components/Logo');
  Logo = LogoModule.default || (() => React.createElement('div', { style: { width: 32, height: 32, background: '#6b46c1', borderRadius: '50%' } }));
} catch {
  Logo = () => React.createElement('div', { style: { width: 32, height: 32, background: '#6b46c1', borderRadius: '50%' } });
}

const ManageAPIs = () => {
  // Safe hooks with error handling
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [selectedApi, setSelectedApi] = useState(null);
const [selectedApiEndpoints, setSelectedApiEndpoints] = useState(null);
const [selectedApiForEndpoints, setSelectedApiForEndpoints] = useState(null);
const [endpointsLoading, setEndpointsLoading] = useState(false);
const [endpointsError, setEndpointsError] = useState('');


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
      setSelectedApiEndpoints(endpoints);
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

      // Simulate API save delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (currentApi.id) {
        // Update existing API
        setApis(prevApis => 
          prevApis.map(api => 
            api.id === currentApi.id ? { 
              ...currentApi, 
              lastScanned: api.lastScanned || 'Never' 
            } : api
          )
        );
        showMessage(`✅ API "${currentApi.name}" updated successfully!`, 'success');
      } else {
        // Add new API
        const newApi = {
          ...currentApi,
          id: Math.max(...apis.map(a => a.id), 0) + 1,
          lastScanned: 'Never',
          scanCount: 0,
          lastScanResult: 'Pending'
        };
        setApis(prevApis => [...prevApis, newApi]);
        showMessage(`✅ API "${currentApi.name}" added successfully!`, 'success');
      }
      
      setIsModalOpen(false);
      setCurrentApi(null);
    } catch (error) {
      console.error('Error saving API:', error);
      setError('Failed to save API. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentApi, apis, showMessage]);

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

      if (!file.name.toLowerCase().endsWith('.json')) {
        showMessage('Please upload a JSON file.', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target.result;
          let apiData;
          
          try {
            apiData = JSON.parse(content);
          } catch (jsonError) {
            showMessage('Invalid JSON file format.', 'error');
            return;
          }

// Recognize OpenAPI/Swagger
const isOpenAPI = apiData.openapi || apiData.swagger;
let name, baseUrl, description;

if (isOpenAPI) {
  name = apiData.info?.title || 'Imported OpenAPI';
  baseUrl = apiData.servers?.[0]?.url || '';
  description = apiData.info?.description || '';
  if (!baseUrl) {
    showMessage('No servers.url found in OpenAPI file.', 'error');
    return;
  }
} else {
  // Fallback: legacy simple format
  name = apiData.name;
  baseUrl = apiData.baseUrl;
  description = apiData.description || '';
  if (!name || !baseUrl) {
    showMessage('File must contain "name" and "baseUrl" fields.', 'error');
    return;
  }
}

const newApi = {
  id: Math.max(...apis.map(a => a.id), 0) + 1,
  name,
  baseUrl,
  description,
  status: apiData.status || 'Active',
  lastScanned: 'Never',
  scanCount: 0,
  lastScanResult: 'Pending'
};

setApis(prevApis => [...prevApis, newApi]);
showMessage(`✅ API "${name}" imported successfully!`, 'success');
setIsModalOpen(false);

if (e.target) e.target.value = '';

        } catch (error) {
          console.error('Error processing file:', error);
          showMessage('Error processing file: ' + error.message, 'error');
        }
      };
      
      reader.onerror = () => {
        showMessage('Error reading file.', 'error');
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Error in file upload handler:', error);
      showMessage('Error uploading file. Please try again.', 'error');
    }
  }, [apis, showMessage]);

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
                      
                      <div className="api-actions">
                        <button 
                          onClick={() => handleScanApi(api)} 
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
                  className={`file-upload-area ${dragActive ? 'dragover' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('api-file')?.click()}
                >
                  <div className="upload-icon">📁</div>
                  <div className="upload-text">Drop JSON file here or click to browse</div>
                  <div className="upload-hint">Upload a JSON file with API configuration</div>
                </div>
                <input
                  id="api-file"
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <small>JSON format: {"{ \"name\": \"API Name\", \"baseUrl\": \"https://...\", \"description\": \"...\" }"}</small>
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
              <EndpointTagEditor endpoint={ep} />
            </li>
          ))}
        </ul>

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
  );
};

export default ManageAPIs;
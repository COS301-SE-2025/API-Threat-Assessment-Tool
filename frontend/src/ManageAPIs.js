import React, { useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from './App';
import { useAuth } from './AuthContext';
import Logo from "./components/Logo";
import './ManageAPIs.css';


// --- API Service Functions ---
const apiService = {
  async fetchUserApis(userId) {
    if (!userId) throw new Error("User ID is required.");
    const res = await fetch(`/api/apis?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch APIs.');
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch APIs.');
    return data.data.apis || [];
  },
  async importApiFile(file, userId) {
    if (!file || !userId) throw new Error("A file and user ID are required.");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", userId);
    const res = await fetch("/api/import", { method: 'POST', body: formData });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.message || "Import failed");
    return result.data;
  },
  async deleteApi(apiId, userId) {
    const res = await fetch('/api/apis/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_id: apiId, user_id: userId }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete API');
    return data;
  },
  async updateApiDetails(apiId, userId, updates) {
    const res = await fetch('/api/apis/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_id: apiId, user_id: userId, updates }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update API details');
    return data;
  },
  async fetchApiEndpoints(apiId, userId) {
    const res = await fetch('/api/endpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_id: apiId, user_id: userId }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch endpoints');
    return data.data.endpoints || [];
  },
  async updateEndpointFlag(apiId, userId, endpointId, flag, action) {
      const endpoint = action === 'add' ? '/api/endpoints/flags/add' : '/api/endpoints/flags/remove';
      const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_id: apiId, user_id: userId, endpoint_id: endpointId, flags: flag })
      });
      if (!res.ok) {
          const errData = await res.json();
          throw new Error(`Failed to ${action} flag ${flag}: ${errData.message}`);
      }
      return await res.json();
  },
  async createScan(apiId, userId, scanProfile) {
       const res = await fetch("/api/scan/create", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, api_id: apiId, scan_profile: scanProfile }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Failed to create scan");
      return result.data;
  },
  async startScan(apiId, userId, scanProfile) {
    const res = await fetch("/api/scan/start", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_id: apiId, scan_profile: scanProfile, user_id: userId}),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Failed to start scan");
      return result.data;
  },
  async getScanStatus(scanId) {
      const res = await fetch(`/api/scan/details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scan_id: scanId })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Polling for scan results failed');
      return data.data;
  },
  async getScanList(apiId, userId) {
    const res = await fetch(`/api/scan/list?user_id=${userId}&api_id=${apiId}`);
    if (!res.ok) throw new Error('Failed to fetch scan list.');
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch scans.');
    return data.data.scans || [];
  },
  async getSchedule(apiId, userId) {
    const res = await fetch(`/api/scans/schedule?api_id=${apiId}&user_id=${userId}`);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch schedule');
    return data.data.schedule;
  },
  async saveSchedule(apiId, userId, frequency, is_enabled) {
    const res = await fetch('/api/scans/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_id: apiId, user_id: userId, frequency, is_enabled }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to save schedule');
    return data.data.schedule;
  },
  async deleteSchedule(apiId, userId) {
    const res = await fetch('/api/scans/schedule', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_id: apiId, user_id: userId }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete schedule');
    return data;
  }
};



const AVAILABLE_FLAGS = ["BOLA", "BKEN_AUTH", "BOPLA", "URC", "BFLA", "UABF", "SSRF", "SEC_MISC", "IIM", "UCAPI", "SKIP"];
const SCAN_TYPES = ["OWASP_API_10", "Sensitive Data Exposure", "Broken Authentication", "SQL Injection"];

const StatCard = ({ icon, number, label, onClick, active }) => (
    <div className={`stat-card ${onClick ? 'interactive' : ''} ${active ? 'active' : ''}`} onClick={onClick}>
        <div className="stat-icon">{icon}</div>
        <span className="stat-number">{number}</span>
        <span className="stat-label">{label}</span>
    </div>
);

const ApiCard = ({ api, onScan, onDelete, onViewEndpoints, onViewPastScans, onEdit, onSchedule }) => (    <div className="api-card">
        <div className="api-card-header">
            <h4 className="api-name">{api.name}</h4>
            <span className={`api-status ${api.vulnerabilitiesFound > 0 ? 'warning' : 'active'}`}>
                {api.scanStatus || 'Ready'}
            </span>
        </div>
        <div className="api-description">ID: {api.id}</div>
        <div className="api-meta">
            <span>Created: {new Date(api.created_at || api.imported_on).toLocaleDateString()}</span>
            <span>Last Scan: {api.lastScanned}</span>
        </div>
        {api.vulnerabilitiesFound > 0 && (
             <div className="vulnerabilities-found">
                ⚠️ {api.vulnerabilitiesFound} vulnerabilities found
             </div>
        )}
        <div className="api-card-actions">
            <button onClick={() => onScan(api)} className="action-btn scan">⚙️ New Scan</button>
            <button onClick={() => onViewEndpoints(api)} className="action-btn endpoints">📂 Endpoints</button>
            <button onClick={() => onViewPastScans(api)} className="action-btn history">📜 History</button>
            <button onClick={() => onSchedule(api)} className="action-btn schedule">🗓️ Schedule</button>
            <button onClick={() => onEdit(api)} className="action-btn edit">✏️ Edit</button>
            <button onClick={() => onDelete(api)} className="action-btn delete">🗑️ Delete</button>
        </div>
    </div>
);

const ManageAPIs = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { darkMode, toggleDarkMode } = useContext(ThemeContext);
    const { currentUser, logout, getUserFullName } = useAuth();
    
    const [apis, setApis] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [isVisible, setIsVisible] = useState({});
    const [modal, setModal] = useState({ type: null, data: null });
    
    // State for Search, Sort, and Filter
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [activeFilter, setActiveFilter] = useState(null);

    const fetchApis = useCallback(async () => {
        if (!currentUser?.id) return;
        setIsLoading(true);
        try {
            const userApis = await apiService.fetchUserApis(currentUser.id);
            setApis(userApis);
        } catch (error) {
            showMessage(`Error fetching APIs: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [currentUser?.id]);

    useEffect(() => { fetchApis(); }, [fetchApis]);
    
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        
        const sections = document.querySelectorAll('.animate-on-scroll');
        sections.forEach(section => observer.observe(section));
        return () => sections.forEach(section => observer.unobserve(section));
    }, [apis]);

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
            navigate('/login', { replace: true });
        }
    };

    const showMessage = (text, type = 'info', duration = 4000) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), duration);
    };

    const handleUpdateApi = async (apiId, updates) => {
        try {
            await apiService.updateApiDetails(apiId, currentUser.id, updates);
            showMessage('API updated successfully', 'success');
            fetchApis();
            setModal({ type: null, data: null });
        } catch (error) {
            showMessage(`Error: ${error.message}`, 'error');
        }
    };

    const filteredAndSortedApis = useMemo(() => {
        return apis
            .filter(api => {
                if (activeFilter === 'issues' && (api.vulnerabilitiesFound || 0) === 0) {
                    return false;
                }
                if (searchTerm && !api.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                    return false;
                }
                return true;
            })
            .sort((a, b) => {
                if (sortBy === 'lastScanned') {
                    const dateA = a.lastScanned === 'Never' ? 0 : new Date(a.lastScanned).getTime();
                    const dateB = b.lastScanned === 'Never' ? 0 : new Date(b.lastScanned).getTime();
                    return dateB - dateA;
                }
                if (sortBy === 'vulnerabilities') {
                    return (b.vulnerabilitiesFound || 0) - (a.vulnerabilitiesFound || 0);
                }
                return a.name.localeCompare(b.name); // Default sort by name
            });
    }, [apis, searchTerm, sortBy, activeFilter]);

    const handleDelete = async (api) => {
        // The window.confirm check is removed to delete directly.
        try {
            await apiService.deleteApi(api.id, currentUser.id);
            showMessage(`API "${api.name}" deleted successfully.`, 'success');
            fetchApis();
        } catch (error) {
            showMessage(`Error: ${error.message}`, 'error');
        }
    };

    const handleImport = async (file) => {
        try {
            await apiService.importApiFile(file, currentUser.id);
            showMessage(`API from "${file.name}" imported successfully.`, 'success');
            setModal({ type: null, data: null });
            fetchApis();
        } catch (error) {
            return Promise.reject(error);
        }
    };

    const handleStartScanFlow = (api) => setModal({ type: 'scanProfile', data: api });
    const handleViewPastScans = (api) => setModal({ type: 'pastScans', data: api });

    const handleProfileSelected = async (api, scanProfile) => {
        try {
            await apiService.createScan(api.id, currentUser.id, scanProfile);
            setModal({ type: 'endpointFlags', data: { api, scanProfile } });
        } catch (error) {
            showMessage(`Could not create scan: ${error.message}`, 'error');
        }
    };

    const handleStartScan = async (api, scanProfile) => {
        try {
            setModal({ type: 'scanProgress', data: { apiName: api.name } });
            const scanData = await apiService.startScan(api.id, currentUser.id, scanProfile);
            pollScanStatus(scanData.scan_id, api);
        } catch(error) {
            showMessage(`Failed to start scan: ${error.message}`, 'error');
            setModal({ type: null, data: null });
        }
    };
    
    const pollScanStatus = (scanId, api) => {
        const interval = setInterval(async () => {
            try {
                const statusData = await apiService.getScanStatus(scanId);
                if (statusData.status === 'completed') {
                    clearInterval(interval);
                    setModal({ type: 'scanResults', data: { results: statusData, apiName: api.name } });
                    fetchApis();
                }
            } catch (error) {
                clearInterval(interval);
                showMessage(`Error polling scan results: ${error.message}`, 'error');
                setModal({ type: null, data: null });
            }
        }, 5000);
    };
    
    const handleViewSpecificReport = async (scanId, apiName) => {
        try {
            const results = await apiService.getScanStatus(scanId);
            setModal({ type: 'scanResults', data: { results, apiName } });
        } catch(error) {
             showMessage(`Error fetching report: ${error.message}`, 'error');
        }
    };

const apiStats = useMemo(() => ({
        total: apis.length,
        active: apis.filter(api => api.status === 'Active').length,
        issuesFound: apis.filter(api => (api.vulnerabilitiesFound || 0) > 0).length,
    }), [apis]);

if (isLoading && apis.length === 0) {
        return <div className="loading-full-page">Loading...</div>;
    }
    
    return (
        <div className="manage-apis-container">
            {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
            
            {modal.type === 'import' && <ImportModal onClose={() => setModal({ type: null, data: null })} onImport={handleImport} />}
            {modal.type === 'endpoints' && <EndpointsModal api={modal.data} onClose={() => setModal({ type: null, data: null })} />}
            {modal.type === 'scanProfile' && <ScanProfileModal api={modal.data} onClose={() => setModal({ type: null, data: null })} onProfileSelected={handleProfileSelected} />}
            {modal.type === 'endpointFlags' && <EndpointFlagsModal data={modal.data} onClose={() => setModal({ type: null, data: null })} onScanStart={handleStartScan} showMessage={showMessage} />}            {modal.type === 'scanProgress' && <ScanProgressModal apiName={modal.data.apiName} />}
            {modal.type === 'scanResults' && <ScanResultsModal data={modal.data} onClose={() => setModal({type:null, data:null})} />}
            {modal.type === 'pastScans' && <PastScansModal api={modal.data} onClose={() => setModal({type:null, data:null})} onViewReport={handleViewSpecificReport} />}
            {modal.type === 'schedule' && <ScheduleScanModal api={modal.data} onClose={() => setModal({ type: null, data: null })} showMessage={showMessage} />}            {modal.type === 'editApi' && <EditApiModal api={modal.data} onClose={() => setModal({ type: null, data: null })} onSave={handleUpdateApi} />}

            <header className="manage-apis-header">
                <div className="logo" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Logo />
                  <span style={{fontWeight: 700, fontSize: 24, letterSpacing: 2, userSelect: "none"}}>AT-AT</span>
                </div>
                <nav className="manage-apis-nav">
                    <Link to="/home" className={location.pathname === '/home' ? 'active' : ''}>Home</Link>
                    <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>Dashboard</Link>
                    <Link to="/manage-apis" className={location.pathname === '/manage-apis' ? 'active' : ''}>API Management</Link>
                    <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>Settings</Link>
                </nav>
                <div className="user-info">
                    <div className="user-profile">
                        <span className="user-avatar">{(currentUser.firstName || 'U')?.charAt(0)?.toUpperCase()}</span>
                        <div className="user-details">
                            <span className="user-greeting">Welcome back,</span>
                            <span className="user-name">{getUserFullName()}</span>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="logout-btn" title="Logout">Logout</button>
                    <button onClick={toggleDarkMode} className="theme-toggle-btn" title="Toggle Theme">{darkMode ? '☀️' : '🌙'}</button>
                </div>
            </header>

            <main className="manage-apis-main">
                <section className="manage-apis-hero">
                    <div className="hero-content">
                        <h1 className="hero-title">API <span className="gradient-text">Management</span></h1>
                        <p className="hero-description">Centrally manage your API endpoints, configure security scans, and monitor your API ecosystem.</p>
                        <div className="hero-actions">
                             <button onClick={() => setModal({ type: 'import' })} className="add-api-btn">⬆️ Import API Spec</button>
                        </div>
                    </div>
                </section>
                
                <section id="api-stats" className={`api-stats-section animate-on-scroll ${isVisible['api-stats'] ? 'visible' : ''}`}>
                    <div className="stats-grid">
                        <StatCard icon="🔗" label="Total APIs" number={apiStats.total} />
                        <StatCard icon="✅" label="Active APIs" number={apiStats.active} />
                        <StatCard 
                            icon="⚠️" 
                            label="APIs with Issues" 
                            number={apiStats.issuesFound} 
                            onClick={() => setActiveFilter(activeFilter === 'issues' ? null : 'issues')}
                            active={activeFilter === 'issues'}
                        />
                    </div>
                </section>
                
                <section id="apis-list" className={`apis-list-section animate-on-scroll ${isVisible['apis-list'] ? 'visible' : ''}`}>
                    <div className="apis-list">
                         <div className="apis-list-header">
                            <h3 className="list-title">📁 My APIs</h3>
                              <div className="controls-container">
                                  <input 
                                      type="text" 
                                      placeholder="Search by name..." 
                                      className="search-input"
                                      value={searchTerm}
                                      onChange={e => setSearchTerm(e.target.value)}
                                  />
                                  <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                      <option value="name">Sort by Name</option>
                                      <option value="lastScanned">Sort by Last Scanned</option>
                                      <option value="vulnerabilities">Sort by Vulnerabilities</option>
                                  </select>
                              </div>
                         </div>
                          <div className="apis-grid">
                            {!isLoading && filteredAndSortedApis.length === 0 ? (
                                <div className="no-apis">
                                    <div className="no-apis-icon">📂</div>
                                    <h3>No APIs Match Your Criteria</h3>
                                    <p>Try adjusting your search or filter.</p>
                                </div>
                            ) : (
                                filteredAndSortedApis.map(api => 
                                        <ApiCard 
                                          key={api.id} 
                                          api={api}
                                          onEdit={() => setModal({ type: 'editApi', data: api })}
                                          onSchedule={() => setModal({ type: 'schedule', data: api })}
                                          onScan={handleStartScanFlow}
                                          onDelete={handleDelete}
                                          onViewEndpoints={() => setModal({type: 'endpoints', data: api})}
                                          onViewPastScans={handleViewPastScans}
                                      />
                                )
                            )}
                         </div>
                    </div>
                </section>
            </main>

            <footer className="manage-apis-footer">
                <p>© 2025 AT-AT (API Threat Assessment Tool) • COS301 Capstone Project. All rights reserved.</p>
                <div className="footer-links">
                    <a href="/#">Privacy Policy</a>
                    <a href="/#">Terms of Service</a>
                    <a href="/#">Help Center</a>
                </div>
            </footer>
        </div>
    );
};

const Modal = ({ children, onClose, title, maxWidth = '800px' }) => (
    <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth}}>
            <div className="modal-header">
                <h2>{title}</h2>
                <button onClick={onClose} className="close-btn">×</button>
            </div>
            {children}
        </div>
    </div>
);

const ImportModal = ({ onClose, onImport }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [dragActive, setDragActive] = useState(false);

    const handleFileChange = (e) => { setError(''); setFile(e.target.files[0]); };
    const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); if (e.type === "dragenter" || e.type === "dragover") setDragActive(true); else if (e.type === "dragleave") setDragActive(false); };
    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation(); setDragActive(false);
        if (e.dataTransfer.files?.[0]) { setError(''); setFile(e.dataTransfer.files[0]); }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) { setError('Please select a file.'); return; }
        setLoading(true); setError('');
        try { await onImport(file); } 
        catch (err) { setError(err.message); setLoading(false); }
    };

    return (
        <Modal onClose={onClose} title="⬆️ Import API Spec">
            <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                    <label>Upload an OpenAPI or Swagger file (.json, .yaml, .yml)</label>
                    <div onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop} className={`file-upload-area ${dragActive ? 'dragover' : ''}`}>
                        <input type="file" id="api-file-input" accept=".json,.yaml,.yml" onChange={handleFileChange} style={{display: 'none'}} />
                        <label htmlFor="api-file-input" style={{cursor: 'pointer'}}>
                            <div className="upload-icon">📤</div>
                            <div className="upload-text">{file ? file.name : "Drag & drop or click to select"}</div>
                            <div className="upload-hint">Your file will be securely processed.</div>
                        </label>
                    </div>
                </div>
                {error && <p className="error-text">{error}</p>}
                <div className="modal-actions">
                    <button type="button" onClick={onClose} className="cancel-btn" disabled={loading}>Cancel</button>
                    <button type="submit" className="save-btn" disabled={loading || !file}>{loading ? 'Importing...' : 'Import'}</button>
                </div>
            </form>
        </Modal>
    );
};

const EndpointsModal = ({ api, onClose }) => {
    const { currentUser } = useAuth();
    const [endpoints, setEndpoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        apiService.fetchApiEndpoints(api.id, currentUser.id)
            .then(setEndpoints)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [api.id, currentUser.id]);

    return (
        <Modal onClose={onClose} title={`📂 Endpoints for ${api.name}`}>
            <div className="modal-form modal-body-scrollable">
                {loading && <p>Loading endpoints...</p>}
                {error && <p className="error-text">{error}</p>}
                {!loading && !error && (
                    <ul className="endpoint-list">
                       {endpoints.length > 0 ? endpoints.map(ep => (
                           <li key={ep.id} className="endpoint-card">
                                <div className="endpoint-method-path">
                                    <span className={`endpoint-method`}>{ep.method}</span>
                                    <span className="endpoint-path">{ep.path}</span>
                                </div>
                                <p className="endpoint-summary">{ep.summary || 'No summary available.'}</p>
                            </li>
                       )) : <p>No endpoints found for this API.</p>}
                    </ul>
                )}
            </div>
        </Modal>
    );
};

const ScanProfileModal = ({ api, onClose, onProfileSelected }) => {
    const [selectedProfile, setSelectedProfile] = useState(SCAN_TYPES[0]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        await onProfileSelected(api, selectedProfile);
    };

    return (
        <Modal onClose={onClose} title={`⚙️ Select Scan Profile for ${api.name}`}>
            <div className="modal-form">
                <div className="form-group">
                    <label htmlFor="scan-profile">Choose a profile to create a scan session:</label>
                    <select id="scan-profile" value={selectedProfile} onChange={e => setSelectedProfile(e.target.value)}>
                        {SCAN_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
                <div className="modal-actions">
                    <button onClick={onClose} className="cancel-btn">Cancel</button>
                    <button onClick={handleSubmit} className="save-btn" disabled={loading}>{loading ? 'Creating...' : 'Next: Configure Flags'}</button>
                </div>
            </div>
        </Modal>
    );
};

// In ManageAPIs.js, replace the EndpointFlagsModal component

const EndpointFlagsModal = ({ data, onClose, onScanStart, showMessage }) => {
    const { api, scanProfile } = data;
    const { currentUser } = useAuth();
    const [endpoints, setEndpoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startScanLoading, setStartScanLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        apiService.fetchApiEndpoints(api.id, currentUser.id)
            .then(setEndpoints)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [api.id, currentUser.id]);
    
    const handleFlagChange = (endpointId, flag, isEnabled) => {
        const originalEndpoints = JSON.parse(JSON.stringify(endpoints));
        const updatedEndpoints = endpoints.map(ep => {
            if (ep.id === endpointId) {
                const newFlags = isEnabled ? [...(ep.flags || []), flag] : (ep.flags || []).filter(f => f !== flag);
                return { ...ep, flags: newFlags };
            }
            return ep;
        });
        setEndpoints(updatedEndpoints);
        
        // This now uses showMessage instead of alert
        apiService.updateEndpointFlag(api.id, currentUser.id, endpointId, flag, isEnabled ? 'add' : 'remove')
            .catch(err => {
                showMessage(`Failed to update flag: ${err.message}`, 'error');
                setEndpoints(originalEndpoints);
            });
    };
    
    const handleScanButtonClick = async () => {
        setStartScanLoading(true);
        await onScanStart(api, scanProfile);
    };

    return (
        <Modal onClose={onClose} title="🚩 Configure Flags for Scan">
            <div className="modal-form modal-body-scrollable">
                {loading ? <p>Loading...</p> : error ? <p className="error-text">{error}</p> :
                    <div className="endpoint-flags-list">
                        {endpoints.map(ep => (
                            <div key={ep.id} className="endpoint-flag-card">
                                <p><strong>{ep.method}</strong> {ep.path}</p>
                                <div className="flags-container">
                                    {AVAILABLE_FLAGS.map(flag => (
                                        <label key={flag} className="flag-label">
                                            <input type="checkbox" checked={(ep.flags || []).includes(flag)} onChange={(e) => handleFlagChange(ep.id, flag, e.target.checked)} />
                                            <div className="flag-toggle-switch"><div className="flag-toggle-slider"></div></div>
                                            <span>{flag}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                }
            </div>
              <div className="modal-actions">
                <button className="action-btn" disabled style={{marginRight: 'auto'}}>Save as Template</button>
                <button onClick={onClose} className="cancel-btn">Cancel</button>
                <button onClick={handleScanButtonClick} className="save-btn" disabled={startScanLoading}>
                    {startScanLoading ? 'Starting...' : 'Start Scan'}
                </button>
            </div>
        </Modal>
    );
};
const ScanProgressModal = ({ apiName }) => (
    <div className="modal-overlay">
        <div className="modal-content">
            <div className="modal-header"><h2>🔍 Scan in Progress</h2></div>
            <div className="modal-form" style={{textAlign: 'center'}}>
                <p>AT-AT is now scanning <strong>{apiName}</strong>.</p>
                <p>This may take a few moments. We'll show the results as soon as they're ready.</p>
                <div className="loader"></div>
            </div>
        </div>
    </div>
);

const ScanResultsModal = ({ data, onClose }) => {
    const { results, apiName } = data;
    const vulnerabilities = results?.results?.results || [];

    const getSeverityClass = (severity) => {
        switch(severity?.toLowerCase()){
            case 'high': return 'severity-high';
            case 'medium': return 'severity-medium';
            case 'low': return 'severity-low';
            default: return 'severity-info';
        }
    };
    
    return (
        <Modal onClose={onClose} title={`📊 Scan Report for ${apiName}`}>
             <div className="modal-form modal-body-scrollable">
                {vulnerabilities.length > 0 ? (
                    vulnerabilities.map((vuln, i) => (
                        <div key={i} className={`vulnerability-card ${getSeverityClass(vuln.severity)}`}>
                            <h3>{vuln.vulnerability_name}</h3>
                            <p><strong>Severity:</strong> {vuln.severity}</p>
                            <p><strong>Endpoint:</strong> {vuln.endpoint_path} ({vuln.endpoint_method})</p>
                            <p><strong>Description:</strong> {vuln.description}</p>
                            <p><strong>Recommendation:</strong> {vuln.recommendation}</p>
                        </div>
                    ))
                ) : (
                    <div className="no-vulnerabilities">
                        <h3>✅ No Vulnerabilities Found</h3>
                        <p>Great job! This scan did not find any vulnerabilities.</p>
                    </div>
                )}
             </div>
             <div className="modal-actions">
                 <button onClick={onClose} className="save-btn">Close</button>
             </div>
        </Modal>
    );
};


const EditApiModal = ({ api, onClose, onSave }) => {
    const [name, setName] = useState(api.name);
    const [baseUrl, setBaseUrl] = useState(api.base_url || '');

    const handleSave = () => {
        onSave(api.id, { title: name, base_url: baseUrl });
    };

    return (
        <Modal onClose={onClose} title={`✏️ Edit ${api.name}`}>
            <div className="modal-form">
                <div className="form-group">
                    <label htmlFor="api-name">API Name</label>
                    <input id="api-name" type="text" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="form-group">
                    <label htmlFor="api-url">Base URL</label>
                    <input id="api-url" type="text" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} />
                </div>
                 <div className="modal-actions">
                    <button onClick={onClose} className="cancel-btn">Cancel</button>
                    <button onClick={handleSave} className="save-btn">Save Details</button>
                </div>
            </div>
        </Modal>
    );
};

// In ManageAPIs.js, replace the ScheduleScanModal component

const ScheduleScanModal = ({ api, onClose, showMessage }) => {
    const { currentUser } = useAuth();
    const [schedule, setSchedule] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSchedule = useCallback(() => {
        setIsLoading(true);
        apiService.getSchedule(api.id, currentUser.id)
            .then(setSchedule)
            .finally(() => setIsLoading(false));
    }, [api.id, currentUser.id]);

    useEffect(() => {
        fetchSchedule();
    }, [fetchSchedule]);

    const handleScheduleSave = (frequency) => {
        apiService.saveSchedule(api.id, currentUser.id, frequency, true)
            .then(fetchSchedule)
            .catch(err => showMessage(err.message, 'error')); // Use showMessage
    };

    const handleScheduleDelete = () => {
        // The window.confirm check is removed to disable directly.
        apiService.deleteSchedule(api.id, currentUser.id)
            .then(() => {
                setSchedule(null)
                showMessage('Schedule disabled successfully.', 'success');
            })
            .catch(err => showMessage(err.message, 'error')); // Use showMessage
    };

    return (
        <Modal onClose={onClose} title={`🗓️ Scheduled Scanning for ${api.name}`}>
            <div className="modal-form">
                {isLoading ? <p>Loading schedule...</p> : (
                    <div className="schedule-container">
                        {schedule && schedule.is_enabled ? (
                            <div>
                                <p>A scan is currently scheduled to run <strong>{schedule.frequency}</strong>.</p>
                                <p>Next run is estimated for: <br/><strong>{new Date(schedule.next_run_at).toLocaleString()}</strong></p>
                                <button onClick={handleScheduleDelete} className="action-btn delete">Disable Schedule</button>
                            </div>
                        ) : (
                            <div>
                                <p>No active schedule. Select a frequency to enable automated scanning:</p>
                                <div className="schedule-actions">
                                    <button onClick={() => handleScheduleSave('daily')} className="action-btn">Daily</button>
                                    <button onClick={() => handleScheduleSave('weekly')} className="action-btn">Weekly</button>
                                    <button onClick={() => handleScheduleSave('monthly')} className="action-btn">Monthly</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};

const PastScansModal = ({ api, onClose, onViewReport }) => {
    const { currentUser } = useAuth();
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        apiService.getScanList(api.id, currentUser.id)
            .then(scanList => {
                const completedScans = scanList
                    .filter(s => s.status === 'completed' && s.completed_at)
                    .sort((a,b) => new Date(b.completed_at) - new Date(a.completed_at));
                setScans(completedScans);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [api.id, currentUser.id]);
    
    return (
        <Modal onClose={onClose} title={`📜 Scan History for ${api.name}`}>
            <div className="modal-form modal-body-scrollable">
                {loading && <p>Loading history...</p>}
                {error && <p className="error-text">{error}</p>}
                {!loading && !error && (
                    <ul className="past-scans-list">
                    {scans.length > 0 && scans.map(scan => (
                        <li key={scan.id} className="past-scan-item">
                            <div>
                                <p className="scan-date"><strong>Date:</strong> {new Date(scan.completed_at).toLocaleString()}</p>
                                <p className="scan-id">ID: {scan.id}</p>
                            </div>
                            <div className="past-scan-actions">
                                <button onClick={() => onViewReport(scan.id, api.name)} className="action-btn view-report">View</button>
                                <button className="action-btn download-report" disabled>Executive Report</button>
                                <button className="action-btn download-report" disabled>Technical Report</button>
                            </div>
                          </li>
                      ))}
                    </ul>
                )}
            </div>
        </Modal>
    )
};

export default ManageAPIs;
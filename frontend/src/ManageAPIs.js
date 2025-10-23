import React, { useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from './App';
import { useAuth } from './AuthContext';
import Logo from "./components/Logo";
import './ManageAPIs.css';
import { useTimezone, formatTimestamp } from './TimezoneContext';

const apiService = {
    async getEnvironment() {
        const res = await fetch('/api/environment');
        if (!res.ok) throw new Error('Failed to fetch environment settings.');
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to fetch environment.');
        return data.data;
    },
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
    async createScan(apiId, userId, scanProfile, apiKeys) {
        const res = await fetch("/api/scan/create", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                api_id: apiId,
                scan_profile: scanProfile,
                api_key_1: apiKeys.apiKey1, 
                api_key_2: apiKeys.apiKey2  
            }),
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
    },
    async shareApi(ownerId, apiId, email, permission) {
        const res = await fetch('/api/apis/share', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ owner_user_id: ownerId, api_id: apiId, email, permission }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Failed to share API');
        return data;
    },
    async getApiShares(userId, apiId) {
        const res = await fetch(`/api/apis/shares?user_id=${userId}&api_id=${apiId}`);
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch shared users');
        return data.data.shares || [];
    },
    async revokeApiAccess(ownerId, apiId, revokeUserId) {
        const res = await fetch('/api/apis/share', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ owner_user_id: ownerId, api_id: apiId, revoke_user_id: revokeUserId }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Failed to revoke access');
        return data;
    },
    async leaveApiShare(userId, apiId) {
        const res = await fetch('/api/apis/leave-share', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, api_id: apiId }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Failed to leave share');
        return data;
    },
    async downloadReport(scanId, reportType, userId) {
        const res = await fetch(`/api/reports/download?scan_id=${scanId}&report_type=${reportType}&user_id=${userId}`);
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Failed to download report.' }));
            throw new Error(errorData.message || 'The server returned an error.');
        }
        const disposition = res.headers.get('content-disposition');
        let filename = `report.pdf`;
        if (disposition && disposition.includes('attachment')) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(disposition);
            if (matches?.[1]) {
                filename = matches[1].replace(/['"]/g, '');
            }
        }
        const blob = await res.blob();
        return { blob, filename };
    },
};

export { apiService };

const AVAILABLE_FLAGS = ["BOLA", "BKEN_AUTH", "BOPLA", "URC", "BFLA", "UABF", "SSRF", "SEC_MISC", "IIM", "UCAPI", "SKIP"];
const SCAN_TYPES = ["Default OWASP API Top 10 Scan"];

const FLAG_EXPLANATIONS = {
    "BOLA": { name: "Broken Object-Level Authorization", description: "Authorization bypass by manipulating an object's ID." },
    "BKEN_AUTH": { name: "Broken Authentication", description: "Improper implementation of authentication allows attackers to compromise user accounts or impersonate others." },
    "BOPLA": { name: "Broken Object Property Level Authorization", description: "Lack of authorization checks when modifying object properties via API requests." },
    "URC": { name: "Unrestricted Resource Consumption", description: "APIs don't restrict the size or number of resources requested, leading to denial of service." },
    "BFLA": { name: "Broken Function Level Authorization", description: "Unauthorized access to administrative or privileged functions due to improper authorization checks." },
    "UABF": { name: "Unauthenticated Access to Business Functions", description: "API functionality that should require a user to be logged in can be accessed anonymously." },
    "SSRF": { name: "Server-Side Request Forgery", description: "The API accepts a URL and fetches content without proper validation, allowing an attacker to abuse the server's functionality." },
    "SEC_MISC": { name: "Security Misconfiguration", description: "General misconfigurations like exposed sensitive data, or improper CORS setup." },
    "IIM": { name: "Improper Inventory Management", description: "Using deprecated API versions without proper security measures." },
    "UCAPI": { name: "Unsafe Consumption of APIs", description: "Security risks when an API relies on data or services from other APIs without proper verification." },
    "SKIP": { name: "Skip Endpoint Scan", description: "Manually flag this endpoint to be skipped during the security scan." }
};

const FlagToggle = ({ flag, isChecked, onChange }) => {
    const explanation = FLAG_EXPLANATIONS[flag] || { name: flag, description: "No description available." };
    
    // Use the native title attribute for a simple, robust tooltip
    const tooltipText = `${explanation.name}: ${explanation.description}`;
    
    return (
        <label key={flag} className="flag-label" title={tooltipText}>
            <input 
                type="checkbox" 
                checked={isChecked} 
                onChange={onChange} 
            />
            <div className="flag-toggle-switch">
                <div className="flag-toggle-slider"></div>
            </div>
            <span>{flag}</span>
            {/* New help icon */}
            <span className="flag-help-icon" title={tooltipText}>?</span>
        </label>
    );
};


const StatCard = ({ icon, number, label, onClick, active }) => (
    <div className={`stat-card ${onClick ? 'interactive' : ''} ${active ? 'active' : ''}`} onClick={onClick}>
        <div className="stat-icon">{icon}</div>
        <span className="stat-number">{number}</span>
        <span className="stat-label">{label}</span>
    </div>
);


// Replace the existing ApiCard component with this one
const ApiCard = ({ api, onScan, onViewEndpoints, onViewPastScans, onManageOwner, onManageShared, isDockerEnv, isScanning, isAnotherScanActive }) => {
    const isOwner = api.permission === 'owner';
    const isLocal = api.base_url && (api.base_url.includes('localhost') || api.base_url.includes('127.0.0.1'));
    const isScanDisabled = isLocal && !isDockerEnv;
    
    const getStatus = () => {
        if (isScanning || api.scanStatus === 'Running') {
            return { text: 'Scanning...', className: 'scanning' };
        }
        if (api.vulnerabilitiesFound > 0) {
            return { text: 'Completed', className: 'warning' };
        }
        return { text: api.scanStatus || 'Ready', className: 'active' };
    };

    const status = getStatus();

    return (
        <div className="api-card">
            <div className="api-card-header">
                <div className="api-name-owner">
                    <h4 className="api-name">{api.name}</h4>
                    {isLocal && <span className="api-local-badge">LOCAL</span>}
                    {!isOwner && <span className="api-owner-badge">Shared by {api.owner_name}</span>}
                </div>
                <span className={`api-status ${status.className}`}>
                    {status.text}
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
            <div className="api-card-actions redesigned">
                {isOwner ? (
                    <>
                        <button 
                            onClick={() => onScan(api)} 
                            className="action-btn scan"
                            // Disable if it's a local API, OR if any other scan is active
                            disabled={isScanDisabled || isAnotherScanActive}
                            title={
                                isScanDisabled 
                                    ? "Scans for local APIs are disabled in this environment" 
                                    : isAnotherScanActive 
                                    ? "Another scan is in progress. Please wait." 
                                    : "Start a new scan"
                            }
                        >⚙️ New Scan</button>
                        <button onClick={() => onViewEndpoints(api)} className="action-btn endpoints">📂 Endpoints</button>
                        <button onClick={() => onViewPastScans(api)} className="action-btn history">📜 History</button>
                        <button onClick={() => onManageOwner(api)} className="action-btn manage-btn">Manage ▾</button>
                    </>
                ) : (
                     <button onClick={() => onManageShared(api)} className="action-btn manage-shared-btn">
                        🛠️ Manage
                    </button>
                )}
            </div>
        </div>
    );
};

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
    const [isDockerEnv, setIsDockerEnv] = useState(true);
    
    // TASK 2: State to track active scans by API ID
    // Format: { apiId1: scanId1, apiId2: scanId2 }
    const [activeScans, setActiveScans] = useState({});

    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [activeFilter, setActiveFilter] = useState(null);

    const showMessage = useCallback((text, type = 'info', duration = 4000) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), duration);
    }, []);

// Replace the existing fetchApis function with this one
const fetchApis = useCallback(async () => {
    if (!currentUser?.id) return;
    setIsLoading(true);
    try {
        const userApis = await apiService.fetchUserApis(currentUser.id);
        setApis(userApis);

        // Populate activeScans from the fetched data on initial load
        const runningScans = {};
        userApis.forEach(api => {
            if (api.scanStatus === 'Running') {
                runningScans[api.id] = true; 
            }
        });
        setActiveScans(runningScans);

    } catch (error) {
        showMessage(`Error fetching APIs: ${error.message}`, 'error');
    } finally {
        setIsLoading(false);
    }
}, [currentUser?.id, showMessage]);

    useEffect(() => { fetchApis(); }, [fetchApis]);

    useEffect(() => {
        const fetchEnvironment = async () => {
            try {
                const { isDocker } = await apiService.getEnvironment();
                setIsDockerEnv(isDocker);
            } catch (error) {
                setIsDockerEnv(false);
                showMessage(`Could not determine server environment: ${error.message}`, 'error');
            }
        };
        fetchEnvironment();
    }, [showMessage]);
    
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
                return a.name.localeCompare(b.name);
            });
    }, [apis, searchTerm, sortBy, activeFilter]);

    const handleDelete = async (api) => {
        if (window.confirm(`Are you sure you want to permanently delete "${api.name}"? This action cannot be undone.`)) {
            try {
                await apiService.deleteApi(api.id, currentUser.id);
                showMessage(`API "${api.name}" deleted successfully.`, 'success');
                fetchApis();
            } catch (error) {
                showMessage(`Error: ${error.message}`, 'error');
            }
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

    const handleDownloadSample = () => {
        // Assuming openapi.json is placed in the public/ folder for direct access
        const downloadUrl = '/openapi.json';
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', 'openapi.json'); // Forces the file name
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showMessage("Sample API downloaded. Now try importing it!", 'info');
    };
    
    const handleStartScanFlow = (api) => setModal({ type: 'scanProfile', data: api });
    const handleViewPastScans = (api) => setModal({ type: 'pastScans', data: api });

    const handleProfileSelected = async (api, scanProfile, apiKeys) => {
        try {
            await apiService.createScan(api.id, currentUser.id, scanProfile, apiKeys);
            setModal({ type: 'endpointFlags', data: { api, scanProfile } });
        } catch (error) {
            showMessage(`Could not create scan: ${error.message}`, 'error');
        }
    };
    
    // TASK 2: Modified polling logic
    const pollScanStatus = useCallback((scanId, api) => {
        const interval = setInterval(async () => {
            try {
                const statusData = await apiService.getScanStatus(scanId);
                if (statusData.status === 'completed' || statusData.status === 'failed') {
                    clearInterval(interval);
                    // Remove the scan from the active list
                    setActiveScans(prev => {
                        const next = { ...prev };
                        delete next[api.id];
                        return next;
                    });
                    
                    showMessage(`Scan for "${api.name}" has finished.`, statusData.status === 'failed' ? 'error' : 'success');
                    // Refresh the main API list to show the final results
                    fetchApis();
                }
            } catch (error) {
                clearInterval(interval);
                 setActiveScans(prev => {
                    const next = { ...prev };
                    delete next[api.id];
                    return next;
                });
                showMessage(`Error polling scan results: ${error.message}`, 'error');
                fetchApis(); // Refresh anyway to show a failed state if possible
            }
        }, 5000); // Poll every 5 seconds
    }, [fetchApis, showMessage]);

    // TASK 2: Modified scan start flow
    const handleStartScan = async (api, scanProfile) => {
        try {
            // Close the configuration modal immediately
            setModal({ type: null, data: null });
            
            const scanData = await apiService.startScan(api.id, currentUser.id, scanProfile);
            
            // Add the scan to the active list to update the UI
            setActiveScans(prev => ({ ...prev, [api.id]: scanData.scan_id }));
            
            showMessage(`Scan started for "${api.name}".`, 'info');
            
            // Start polling for results in the background
            pollScanStatus(scanData.scan_id, api);

        } catch(error) {
            showMessage(`Failed to start scan: ${error.message}`, 'error');
            // Ensure the API is not stuck in a scanning state on the UI if the start fails
            setActiveScans(prev => {
                const next = { ...prev };
                delete next[api.id];
                return next;
            });
        }
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

    const isAnyScanActive = Object.keys(activeScans).length > 0 || apis.some(api => api.scanStatus === 'Running');
    
    return (
        <div className="manage-apis-container">
            {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
            
            {modal.type === 'import' && <ImportModal onClose={() => setModal({ type: null, data: null })} onImport={handleImport} />}
            {modal.type === 'endpoints' && <EndpointsModal api={modal.data} onClose={() => setModal({ type: null, data: null })} />}
            {modal.type === 'scanProfile' && <ScanProfileModal api={modal.data} onClose={() => setModal({ type: null, data: null })} onProfileSelected={handleProfileSelected} />}
            {modal.type === 'endpointFlags' && <EndpointFlagsModal data={modal.data} onClose={() => setModal({ type: null, data: null })} onScanStart={handleStartScan} showMessage={showMessage} />}
            {/* The ScanProgressModal is no longer needed here */}
            {modal.type === 'scanResults' && <ScanResultsModal data={modal.data} onClose={() => setModal({type:null, data:null})} />}
            {modal.type === 'pastScans' && <PastScansModal api={modal.data} onClose={() => setModal({type:null, data:null})} onViewReport={handleViewSpecificReport} showMessage={showMessage}/>}
            {modal.type === 'schedule' && <ScheduleScanModal api={modal.data} onClose={() => setModal({ type: null, data: null })} showMessage={showMessage} />}
            {modal.type === 'editApi' && <EditApiModal api={modal.data} onClose={() => setModal({ type: null, data: null })} onSave={handleUpdateApi} />}
            {modal.type === 'share' && <ShareApiModal api={modal.data} onClose={() => setModal({ type: null, data: null })} showMessage={showMessage} />}
            {modal.type === 'manageOwner' &&
                <OwnerManageModal
                    api={modal.data}
                    onClose={() => setModal({ type: null, data: null })}
                    onAction={(action) => {
                        const apiData = modal.data;
                        setModal({ type: null, data: null }); 
                        setTimeout(() => {
                            if (action === 'edit') setModal({ type: 'editApi', data: apiData });
                            if (action === 'share') setModal({ type: 'share', data: apiData });
                            if (action === 'schedule') setModal({ type: 'schedule', data: apiData });
                            if (action === 'delete') handleDelete(apiData);
                        }, 150);
                    }}
                />
            }
            {modal.type === 'manageShared' && 
                <SharedApiManageModal 
                    api={modal.data} 
                    onClose={() => setModal({ type: null, data: null })} 
                    showMessage={showMessage}
                    fetchApis={fetchApis}
                    onAction={(action) => {
                        if (action === 'scan') handleStartScanFlow(modal.data);
                        if (action === 'endpoints') setModal({type: 'endpoints', data: modal.data});
                        if (action === 'history') handleViewPastScans(modal.data);
                    }}
                />
            }

            <header className="manage-apis-header">
                <div className="logo" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Logo />
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
                             <button onClick={handleDownloadSample} className="action-btn-secondary download-sample-btn">⬇️ Download Sample API</button>
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
                         <div className="api-list-toolbar">
                            <h3 className="list-title">📁 My APIs</h3>
                            <div className="controls-container">
                                <div className="search-wrapper">
                                    {/* This is our new search icon */}
                                    <span className="search-icon">🔍</span>
                                    <input 
                                        type="text" 
                                        placeholder="Search by name..." 
                                        className="search-input"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
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
                                    onScan={handleStartScanFlow}
                                    onViewEndpoints={() => setModal({type: 'endpoints', data: api})}
                                    onViewPastScans={handleViewPastScans}
                                    onManageOwner={() => setModal({ type: 'manageOwner', data: api })}
                                    onManageShared={() => setModal({ type: 'manageShared', data: api })}
                                    isDockerEnv={isDockerEnv}
                                    isScanning={!!activeScans[api.id]}
                                    // Pass the new global flag to every card
                                    isAnotherScanActive={isAnyScanActive}
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
                          <Link to="/privacy">Privacy Policy</Link>
                          <Link to="/terms">Terms of Service</Link>
                          <Link to="/documentation">Documentation</Link>
                          <Link to="/contact">Contact Us</Link>
                        </div>
            </footer>
        </div>
    );
};

// --- MODALS (No changes needed below this line for Task 2) ---

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
    const [apiKey1, setApiKey1] = useState('');
    const [apiKey2, setApiKey2] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        await onProfileSelected(api, selectedProfile, { apiKey1, apiKey2 });
    };

    const isNextDisabled = loading || !apiKey1.trim();

    return (
        <Modal onClose={onClose} title={`⚙️ Configure Scan for ${api.name}`}>
            <div className="modal-form">
                <div className="form-group">
                    <label htmlFor="scan-profile">1. Choose a scan profile:</label>
                    <select id="scan-profile" value={selectedProfile} onChange={e => setSelectedProfile(e.target.value)}>
                        {SCAN_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="api-key-1">2. Provide API Key(s) for testing:</label>
                    <p className="form-hint">
                        Enter at least one valid API key for a user role. For more effective authorization testing, provide a second key for a different user.
                    </p>
                    <input
                        id="api-key-1"
                        type="password"
                        placeholder="Primary API Key / Token"
                        value={apiKey1}
                        onChange={e => setApiKey1(e.target.value)}
                        required
                    />
                    <input
                        id="api-key-2"
                        type="password"
                        placeholder="Secondary API Key / Token (Optional)"
                        value={apiKey2}
                        onChange={e => setApiKey2(e.target.value)}
                    />
                </div>

                <div className="modal-actions">
                    <button onClick={onClose} className="cancel-btn">Cancel</button>
                    <button onClick={handleSubmit} className="save-btn" disabled={isNextDisabled}>
                        {loading ? 'Creating...' : 'Next: Configure Flags'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

// Replace the existing EndpointFlagsModal component with this one
const EndpointFlagsModal = ({ data, onClose, onScanStart, showMessage }) => {
    const { api, scanProfile } = data;
    const { currentUser } = useAuth();
    
    const [allEndpoints, setAllEndpoints] = useState([]);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const endpointsPerPage = 20;

    const [loading, setLoading] = useState(true);
    const [startScanLoading, setStartScanLoading] = useState(false);
    const [bulkUpdateLoading, setBulkUpdateLoading] = useState(false); // New state for bulk update
    const [error, setError] = useState('');

    useEffect(() => {
        apiService.fetchApiEndpoints(api.id, currentUser.id)
            .then(setAllEndpoints)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [api.id, currentUser.id]);

    const handleFlagChange = (endpointId, flag, isEnabled) => {
        const originalEndpoints = JSON.parse(JSON.stringify(allEndpoints));
        const updatedEndpoints = allEndpoints.map(ep => {
            if (ep.id === endpointId) {
                const newFlags = isEnabled ? [...(ep.flags || []), flag] : (ep.flags || []).filter(f => f !== flag);
                return { ...ep, flags: newFlags };
            }
            return ep;
        });
        setAllEndpoints(updatedEndpoints);
        
        apiService.updateEndpointFlag(api.id, currentUser.id, endpointId, flag, isEnabled ? 'add' : 'remove')
            .catch(err => {
                showMessage(`Failed to update flag: ${err.message}`, 'error');
                setAllEndpoints(originalEndpoints);
            });
    };

    // New handler function for the "Skip All" button
    const handleSkipAll = async () => {
        setBulkUpdateLoading(true);
        const updatePromises = allEndpoints.map(ep => {
            if (!(ep.flags || []).includes("SKIP")) {
                return apiService.updateEndpointFlag(api.id, currentUser.id, ep.id, "SKIP", 'add');
            }
            return Promise.resolve();
        });

        try {
            await Promise.all(updatePromises);
            const updatedEndpoints = allEndpoints.map(ep => ({
                ...ep,
                flags: [...new Set([...(ep.flags || []), "SKIP"])]
            }));
            setAllEndpoints(updatedEndpoints);
            showMessage('All endpoints have been marked to skip.', 'success');
        } catch (err) {
            showMessage(`Failed to update all flags: ${err.message}`, 'error');
        } finally {
            setBulkUpdateLoading(false);
        }
    };
    
    const handleScanButtonClick = async () => {
        setStartScanLoading(true);
        await onScanStart(api, scanProfile);
    };

    const filteredEndpoints = useMemo(() => {
        if (!searchTerm) {
            return allEndpoints;
        }
        const lowercasedSearch = searchTerm.toLowerCase();
        return allEndpoints.filter(ep => 
            ep.path.toLowerCase().includes(lowercasedSearch) ||
            ep.method.toLowerCase().includes(lowercasedSearch)
        );
    }, [allEndpoints, searchTerm]);

    const paginatedEndpoints = useMemo(() => {
        const startIndex = (currentPage - 1) * endpointsPerPage;
        return filteredEndpoints.slice(startIndex, startIndex + endpointsPerPage);
    }, [filteredEndpoints, currentPage]);

    const totalPages = Math.ceil(filteredEndpoints.length / endpointsPerPage);

    return (
        <Modal onClose={onClose} title="🚩 Configure Flags for Scan">
            <div className="flags-modal-header">
                <input
                    type="text"
                    placeholder="Search by method or path..."
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                />
                {/* New button and hint text for the demo */}
                <div className="demo-actions">
                    <button 
                        onClick={handleSkipAll} 
                        className="action-btn-secondary"
                        disabled={bulkUpdateLoading}
                    >
                        {bulkUpdateLoading ? 'Skipping...' : 'Skip All Endpoints'}
                    </button>
                    <p className="demo-hint">For demo purposes to ensure a quick scan. Press the button then remove the skip flag for a maximum of 5 endpoints.</p>
                </div>
            </div>
            {/* NEW: Instruction Bar */}
            <div className="flag-instruction-bar">
                <p>Click on a flag abbreviation or the '?' icon to view a detailed explanation.</p>
            </div>

            <div className="modal-form modal-body-scrollable">
                {loading ? <div className="loader"></div> : error ? <p className="error-text">{error}</p> :
                    <div className="endpoint-flags-list">
                        {paginatedEndpoints.length > 0 ? paginatedEndpoints.map(ep => (
                            <div key={ep.id} className="endpoint-flag-card">
                                <p><strong>{ep.method}</strong> {ep.path}</p>
                                <div className="flags-container">
                                    {AVAILABLE_FLAGS.map(flag => (
                                        <FlagToggle 
                                            key={flag}
                                            flag={flag}
                                            isChecked={(ep.flags || []).includes(flag)}
                                            onChange={(e) => handleFlagChange(ep.id, flag, e.target.checked)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )) : (
                            <p>No endpoints match your search.</p>
                        )}
                    </div>
                }
            </div>
            <div className="modal-actions space-between">
                <div className="pagination-controls">
                    {totalPages > 1 && (
                        <>
                            <button onClick={() => setCurrentPage(p => p - 1)} className="pagination-btn" disabled={currentPage === 1}>
                                ← Prev
                            </button>
                            <span>Page {currentPage} of {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => p + 1)} className="pagination-btn" disabled={currentPage === totalPages}>
                                Next →
                            </button>
                        </>
                    )}
                </div>
                <div className="main-actions">
                    <button onClick={onClose} className="cancel-btn">Cancel</button>
                    <button onClick={handleScanButtonClick} className="save-btn" disabled={startScanLoading}>
                        {startScanLoading ? 'Starting...' : 'Start Scan'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

// Replace the existing ScanResultsModal component with this enhanced version
const ScanResultsModal = ({ data, onClose }) => {
    const { results, apiName } = data;
    const scanInfo = results?.results?.scan_info;
    const vulnerabilities = results?.results?.results || [];
    
    // State to manage which vulnerability accordion is open
    const [openVulnerabilityId, setOpenVulnerabilityId] = useState(null);

    // State for search and pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const vulnerabilitiesPerPage = 10; // Items per page

    // Helper function to parse the method and path from the 'evidence' string
    const parseEvidence = (evidence) => {
        if (!evidence || typeof evidence !== 'string') return { method: 'N/A', path: 'N/A' };
        const methodMatch = evidence.match(/Method: (.*)/);
        const pathMatch = evidence.match(/Path: (.*)/);
        return {
            method: methodMatch ? methodMatch[1].trim() : 'N/A',
            path: pathMatch ? pathMatch[1].trim() : 'N/A',
        };
    };

    // Memoized calculation for filtered vulnerabilities based on the search term
    const filteredVulnerabilities = useMemo(() => {
        if (!searchTerm) {
            return vulnerabilities;
        }
        const lowercasedSearch = searchTerm.toLowerCase();
        return vulnerabilities.filter(vuln => {
            const { path } = parseEvidence(vuln.evidence);
            return (
                vuln.vulnerability_name.toLowerCase().includes(lowercasedSearch) ||
                path.toLowerCase().includes(lowercasedSearch)
            );
        });
    }, [vulnerabilities, searchTerm]);

    // Memoized calculation for the vulnerabilities to display on the current page
    const paginatedVulnerabilities = useMemo(() => {
        const startIndex = (currentPage - 1) * vulnerabilitiesPerPage;
        return filteredVulnerabilities.slice(startIndex, startIndex + vulnerabilitiesPerPage);
    }, [filteredVulnerabilities, currentPage, vulnerabilitiesPerPage]);

    const totalPages = Math.ceil(filteredVulnerabilities.length / vulnerabilitiesPerPage);

    const summaryStats = useMemo(() => {
        const stats = { high: 0, medium: 0, low: 0, info: 0 };
        vulnerabilities.forEach(v => {
            const severity = v.severity?.toLowerCase() || 'info';
            if (stats.hasOwnProperty(severity)) {
                stats[severity]++;
            } else {
                stats.info++;
            }
        });
        
        let duration = 'N/A';
        if (scanInfo?.started_at && scanInfo?.completed_at) {
            const start = new Date(scanInfo.started_at);
            const end = new Date(scanInfo.completed_at);
            const seconds = (end - start) / 1000;
            duration = `${seconds.toFixed(2)} seconds`;
        }

        return { counts: stats, total: vulnerabilities.length, duration };
    }, [vulnerabilities, scanInfo]);

    const getSeverityClass = (severity) => `severity-${severity?.toLowerCase() || 'info'}`;
    
    return (
        <Modal onClose={onClose} title={`📊 Scan Report for ${apiName}`}>
            {/* Search Bar */}
            <div className="flags-modal-header">
                <input
                    type="text"
                    placeholder="Search by vulnerability name or path..."
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1); // Reset to page 1 on new search
                    }}
                />
            </div>

            <div className="modal-form modal-body-scrollable report-modal">
                <div className="report-summary">
                    {/* ... summary grid and metadata ... (no changes here) */}
                    <div className="summary-grid">
                        <div className="summary-card total">
                            <span className="summary-value">{summaryStats.total}</span>
                            <span className="summary-label">Total Vulnerabilities</span>
                        </div>
                        <div className="summary-card high">
                            <span className="summary-value">{summaryStats.counts.high}</span>
                            <span className="summary-label">High Severity</span>
                        </div>
                        <div className="summary-card medium">
                            <span className="summary-value">{summaryStats.counts.medium}</span>
                            <span className="summary-label">Medium Severity</span>
                        </div>
                        <div className="summary-card low">
                            <span className="summary-value">{summaryStats.counts.low}</span>
                            <span className="summary-label">Low Severity</span>
                        </div>
                    </div>
                    {scanInfo && (
                        <div className="scan-metadata">
                            <span>Scanned on: {new Date(scanInfo.completed_at).toLocaleString()}</span>
                            <span>{`\u00A0\u00A0Duration: ${summaryStats.duration}`}</span>
                        </div>
                    )}
                </div>

                <div className="vulnerability-accordion">
                    {/* Map over the paginated results instead of the full list */}
                    {paginatedVulnerabilities.length > 0 ? (
                        paginatedVulnerabilities.map(vuln => {
                            const { method, path } = parseEvidence(vuln.evidence);
                            const isOpen = openVulnerabilityId === vuln.id;
                            return (
                                <div key={vuln.id} className={`vulnerability-item ${isOpen ? 'open' : ''}`}>
                                    <div className="vulnerability-header" onClick={() => setOpenVulnerabilityId(isOpen ? null : vuln.id)}>
                                        <span className={`severity-badge ${getSeverityClass(vuln.severity)}`}>{vuln.severity}</span>
                                        <span className="vuln-name">{vuln.vulnerability_name}</span>
                                        <span className="vuln-path">{path}</span>
                                        <span className="accordion-toggle">{isOpen ? '−' : '+'}</span>
                                    </div>
                                    {isOpen && (
                                        <div className="vulnerability-details">
                                            {/* ... vulnerability details ... (no changes here) */}
                                            <div className="detail-block">
                                                <strong>Description:</strong>
                                                <p>{vuln.description}</p>
                                            </div>
                                            <div className="detail-block">
                                                <strong>Recommendation:</strong>
                                                <p>{vuln.recommendation}</p>
                                            </div>
                                            <div className="detail-block half-width">
                                                <strong>Method:</strong>
                                                <p><code>{method}</code></p>
                                            </div>
                                             <div className="detail-block half-width">
                                                <strong>CVSS Score:</strong>
                                                <p>{vuln.cvss_score || 'N/A'}</p>
                                            </div>
                                            <div className="detail-block">
                                                <strong>Full Evidence:</strong>
                                                <pre><code>{vuln.evidence}</code></pre>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    ) : (
                        <div className="no-vulnerabilities">
                            <h3>✅ No Vulnerabilities Match Your Criteria</h3>
                            <p>Try clearing your search term or check another scan.</p>
                        </div>
                    )}
                </div>
             </div>
             
             {/* Pagination Controls */}
             <div className="modal-actions">
                <div className="pagination-controls">
                    {totalPages > 1 && (
                        <>
                            <button onClick={() => setCurrentPage(p => p - 1)} className="pagination-btn" disabled={currentPage === 1}>
                                ← Prev
                            </button>
                            <span>Page {currentPage} of {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => p + 1)} className="pagination-btn" disabled={currentPage === totalPages}>
                                Next →
                            </button>
                        </>
                    )}
                </div>
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

const ScheduleScanModal = ({ api, onClose, showMessage }) => {
    const { selectedTimezone } = useTimezone(); 
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
            .catch(err => showMessage(err.message, 'error'));
    };

    const handleScheduleDelete = () => {
        apiService.deleteSchedule(api.id, currentUser.id)
            .then(() => {
                setSchedule(null)
                showMessage('Schedule disabled successfully.', 'success');
            })
            .catch(err => showMessage(err.message, 'error'));
    };

    return (
        <Modal onClose={onClose} title={`🗓️ Scheduled Scanning for ${api.name}`}>
            <div className="modal-form">
                {isLoading ? <p>Loading schedule...</p> : (
                    <div className="schedule-container">
                        {schedule && schedule.is_enabled ? (
                            <div>
                                <p>A scan is currently scheduled to run <strong>{schedule.frequency}</strong>.</p>
                                <p>Next run is estimated for: <br/><strong>{formatTimestamp(schedule.next_run_at, selectedTimezone)}</strong></p>                                <button onClick={handleScheduleDelete} className="action-btn delete">Disable Schedule</button>
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

const PastScansModal = ({ api, onClose, onViewReport, showMessage }) => {
    const { currentUser } = useAuth();
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [downloading, setDownloading] = useState(null);
    const { selectedTimezone } = useTimezone(); 

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
    
    const handleDownload = async (scanId, reportType) => {
        const downloadKey = `${scanId}-${reportType}`;
        setDownloading(downloadKey);
        try {
            const { blob } = await apiService.downloadReport(scanId, reportType, currentUser.id);
            
            const now = new Date();
            const datePart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const timePart = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
            const formattedDateTime = `${datePart}_${timePart}`;
            
            const formattedApiName = api.name.replace(/\s+/g, '_');
            const formattedReportType = reportType.charAt(0).toUpperCase() + reportType.slice(1);
            
            const newFilename = `${formattedDateTime} - ${formattedReportType} Report - ${formattedApiName}.pdf`;

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = newFilename;
            
            document.body.appendChild(a);
            a.click();
            
            window.URL.revokeObjectURL(url);
            a.remove();
            
            showMessage('Report downloaded successfully!', 'success');
        } catch (error) {
            showMessage(`Error downloading report: ${error.message}`, 'error');
        } finally {
            setDownloading(null);
        }
    };
    
    return (
        <Modal onClose={onClose} title={`📜 Scan History for ${api.name}`}>
            <div className="modal-form modal-body-scrollable">
                {loading && <p>Loading history...</p>}
                {error && <p className="error-text">{error}</p>}
                {!loading && !error && (
                    <ul className="past-scans-list">
                    {scans.length > 0 ? scans.map(scan => (
                        <li key={scan.id} className="past-scan-item">
                            <div>
                            <p className="scan-date"><strong>Date:</strong> {formatTimestamp(scan.completed_at, selectedTimezone)}</p>                                <p className="scan-id">ID: {scan.id}</p>
                            </div>
                            <div className="past-scan-actions">
                                <button onClick={() => onViewReport(scan.id, api.name)} className="action-btn view-report">View</button>
                                <button 
                                    onClick={() => handleDownload(scan.id, 'executive')} 
                                    className="action-btn download-report" 
                                    disabled={downloading === `${scan.id}-executive`}
                                >
                                    {downloading === `${scan.id}-executive` ? 'Downloading...' : 'Executive Report'}
                                </button>
                                <button 
                                    onClick={() => handleDownload(scan.id, 'technical')} 
                                    className="action-btn download-report" 
                                    disabled={downloading === `${scan.id}-technical`}
                                >
                                    {downloading === `${scan.id}-technical` ? 'Downloading...' : 'Technical Report'}
                                </button>
                            </div>
                          </li>
                      )) : <p>No past scans found.</p>}
                    </ul>
                )}
            </div>
        </Modal>
    )
};

const ShareApiModal = ({ api, onClose, showMessage }) => {
    const { currentUser } = useAuth();
    const [shares, setShares] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [permission, setPermission] = useState('read');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchShares = useCallback(async () => {
        if (!api || !currentUser) return;
        setIsLoading(true);
        try {
            const currentShares = await apiService.getApiShares(currentUser.id, api.id);
            setShares(currentShares);
        } catch (error) {
            showMessage(`Error fetching shares: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [api, currentUser, showMessage]);

    useEffect(() => {
        fetchShares();
    }, [fetchShares]);

    const handleShare = async (e) => {
        e.preventDefault();
        if (!email) {
            showMessage('Please enter an email address.', 'error');
            return;
        }
        setIsSubmitting(true);
        try {
            const result = await apiService.shareApi(currentUser.id, api.id, email, permission);
            showMessage(result.message || `API shared with ${email} successfully!`, 'success');
            setEmail('');
            fetchShares();
        } catch (error) {
            showMessage(`Error sharing API: ${error.message}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRevoke = async (revokeUserId, revokeUserEmail) => {
        if (window.confirm(`Are you sure you want to revoke access for ${revokeUserEmail}?`)) {
            try {
                await apiService.revokeApiAccess(currentUser.id, api.id, revokeUserId);
                showMessage('Access revoked successfully.', 'success');
                fetchShares();
            } catch (error) {
                showMessage(`Error revoking access: ${error.message}`, 'error');
            }
        }
    };

    return (
        <Modal onClose={onClose} title={`🤝 Share "${api.name}"`}>
            <div className="modal-form modal-body-scrollable" style={{padding: '30px'}}>
                <div className="current-shares">
                    <h4>Currently Shared With</h4>
                    {isLoading ? <div className="loader"></div> : (
                        shares.length > 0 ? (
                            <ul className="share-list">
                                {shares.map(share => (
                                    <li key={share.user_id} className="share-item">
                                        <div className="share-info">
                                            <span className="share-name">{share.name || 'N/A'}</span>
                                            <span className="share-email">{share.email}</span>
                                        </div>
                                        <div className="share-actions">
                                            <span className="share-permission">{share.permission}</span>
                                            <button onClick={() => handleRevoke(share.user_id, share.email)} className="action-btn delete small-btn">Revoke</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>Not shared with anyone yet.</p>
                        )
                    )}
                </div>
                
                <div className="divider"></div>

                <form onSubmit={handleShare}>
                    <h4>Share with New User</h4>
                    <div className="form-group">
                        <label htmlFor="share-email">User Email Address</label>
                        <input
                            id="share-email"
                            type="email"
                            placeholder="user@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="share-permission">Permission Level</label>
                        <select id="share-permission" value={permission} onChange={e => setPermission(e.target.value)}>
                            <option value="read">View</option>
                            <option value="manage">Manage</option>
                        </select>
                    </div>
                    <div className="modal-actions" style={{padding: '20px 0 0 0'}}>
                        <button type="button" onClick={onClose} className="cancel-btn" disabled={isSubmitting}>Cancel</button>
                        <button type="submit" className="save-btn" disabled={isSubmitting}>
                            {isSubmitting ? 'Sharing...' : 'Share API'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

const SharedApiManageModal = ({ api, onClose, onAction, showMessage, fetchApis }) => {
    const { currentUser } = useAuth();

    const handleLeaveShare = async () => {
        if (window.confirm(`Are you sure you want to remove your access to "${api.name}"? This action cannot be undone.`)) {
            try {
                await apiService.leaveApiShare(currentUser.id, api.id);
                showMessage('Successfully removed from API.', 'success');
                fetchApis();
                onClose();
            } catch (error) {
                showMessage(`Error: ${error.message}`, 'error');
            }
        }
    };

    return (
        <Modal onClose={onClose} title={`Manage Shared API: ${api.name}`}>
            <div className="modal-form" style={{padding: '30px'}}>
                <div className="share-details-container">
                    <p>This API is shared with you by <strong>{api.owner_name}</strong>.</p>
                    <p>Your permission level is: <strong>{api.permission}</strong>.</p>
                </div>
                <div className="divider"></div>
                <h4>Available Actions</h4>
                <div className="shared-api-actions">
                    {api.permission === 'manage' && (
                        <button onClick={() => onAction('scan')} className="action-btn scan large-btn">⚙️ Run New Scan</button>
                    )}
                    <button onClick={() => onAction('endpoints')} className="action-btn endpoints large-btn">📂 View Endpoints</button>
                    <button onClick={() => onAction('history')} className="action-btn history large-btn">📜 View History</button>
                </div>
                <div className="divider"></div>
                <h4>Leave Share</h4>
                <p>If you no longer need access to this API, you can remove it from your list. You will need to be invited again by the owner to regain access.</p>
                <div className="modal-actions" style={{justifyContent: 'center'}}>
                    <button onClick={handleLeaveShare} className="delete-confirm-btn">Leave API Share</button>
                </div>
            </div>
        </Modal>
    );
};

const OwnerManageModal = ({ api, onClose, onAction }) => (
    <Modal onClose={onClose} title={`Manage API: ${api.name}`} maxWidth="500px">
        <div className="modal-form" style={{ padding: '10px 30px 30px 30px' }}>
            <p className="modal-subtitle">Select a configuration option to proceed.</p>
            <div className="manage-actions-grid">
                <button className="manage-action-btn" onClick={() => onAction('edit')}>
                    <span className="manage-action-icon">✏️</span>
                    <span className="manage-action-text">Edit Details</span>
                </button>
                <button className="manage-action-btn" onClick={() => onAction('share')}>
                    <span className="manage-action-icon">🤝</span>
                    <span className="manage-action-text">Share Access</span>
                </button>
                <button className="manage-action-btn" onClick={() => onAction('schedule')}>
                    <span className="manage-action-icon">🗓️</span>
                    <span className="manage-action-text">Schedule Scan</span>
                </button>
            </div>
            <div className="divider"></div>
            <div className="danger-zone">
                <h4>Danger Zone</h4>
                <p>This action is permanent and cannot be undone.</p>
                <button className="delete-confirm-btn full-width" onClick={() => onAction('delete')}>
                    🗑️ Delete this API
                </button>
            </div>
        </div>
    </Modal>
);

export default ManageAPIs;
// ManageAPIs.js
import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from './App';
import { useAuth } from './AuthContext';
import './ManageAPIs.css';

const ManageAPIs = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { currentUser, logout, getUserFullName } = useAuth();
  const location = useLocation();
  const [apis, setApis] = useState([
    {
      id: 1,
      name: 'My E-commerce Site API',
      baseUrl: 'https://api.ecommerce.com/v1',
      description: 'Main API for the e-commerce platform',
      lastScanned: '2025-05-14',
      status: 'Active'
    },
    {
      id: 2,
      name: 'Client Project API',
      baseUrl: 'https://api.clientproject.com/v2',
      description: 'API for the client project',
      lastScanned: '2025-05-12',
      status: 'Active'
    },
    {
      id: 3,
      name: 'Internal User Service',
      baseUrl: 'https://api.internal/users',
      description: 'User management service',
      lastScanned: '2025-05-10',
      status: 'Inactive'
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentApi, setCurrentApi] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [apiToDelete, setApiToDelete] = useState(null);
  const [uploadMessage, setUploadMessage] = useState(''); // For feedback on file upload
  const [isFileUploaded, setIsFileUploaded] = useState(false); // Track if file was uploaded

  const handleLogout = () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      logout();
      navigate('/login', { replace: true });
    }
  };

  // Loading state similar to other components
  if (!currentUser) {
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

  const userFullName = getUserFullName() || (currentUser.firstName ? `${currentUser.firstName} Doe` : 'User');

  const handleAddApi = () => {
    setCurrentApi({
      id: null,
      name: '',
      baseUrl: '',
      description: '',
      status: 'Active'
    });
    setUploadMessage(''); // Clear any previous message
    setIsFileUploaded(false); // Reset file upload state
    setIsModalOpen(true);
  };

  const handleEditApi = (api) => {
    setCurrentApi({ ...api });
    setUploadMessage(''); // Clear any previous message
    setIsFileUploaded(false); // Reset file upload state
    setIsModalOpen(true);
  };

  const handleDeleteApi = (api) => {
    setApiToDelete(api);
    setIsDeleteConfirmOpen(true);
  };

  const handleSaveApi = () => {
    if (!currentApi) return; // Guard against null currentApi
    if (currentApi.id) {
      setApis(apis.map(api => api.id === currentApi.id ? currentApi : api));
    } else {
      const newApi = {
        ...currentApi,
        id: Math.max(...apis.map(a => a.id), 0) + 1,
        lastScanned: 'Never'
      };
      setApis([...apis, newApi]);
    }
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    setApis(apis.filter(api => api.id !== apiToDelete.id));
    setIsDeleteConfirmOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentApi({
      ...currentApi,
      [name]: value
    });
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setUploadMessage('No file selected.');
      setIsFileUploaded(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        let apiData;
        try {
          apiData = JSON.parse(content); // Attempt to parse as JSON
        } catch (jsonError) {
          setUploadMessage('Invalid file format. Please upload a JSON file.');
          setIsFileUploaded(false);
          return;
        }

        // Validate required fields
        if (!apiData.name || !apiData.baseUrl) {
          setUploadMessage('File must contain "name" and "baseUrl" fields.');
          setIsFileUploaded(false);
          return;
        }

        const newApi = {
          id: Math.max(...apis.map(a => a.id), 0) + 1,
          name: apiData.name,
          baseUrl: apiData.baseUrl,
          description: apiData.description || '',
          status: apiData.status || 'Active',
          lastScanned: 'Never'
        };
        setApis([...apis, newApi]);
        setUploadMessage('API successfully imported from file.');
        setIsFileUploaded(true); // Mark file as uploaded
        setCurrentApi(null); // Clear the form
      } catch (error) {
        setUploadMessage('Error processing file: ' + error.message);
        setIsFileUploaded(false);
      }
    };
    reader.onerror = () => {
      setUploadMessage('Error reading file.');
      setIsFileUploaded(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="manage-apis-container">
      <header className="manage-apis-header">
        <div className="logo">AT-AT</div>
        <nav className="manage-apis-nav">
          <Link to="/home" className={location.pathname === '/home' ? 'active' : ''}>Home</Link>
          <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>Dashboard</Link>
          <Link to="/public-templates" className={location.pathname === '/public-templates' ? 'active' : ''}>Public Templates</Link>
          <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>Settings</Link>
        </nav>
        <div className="user-info">
          <div className="user-profile">
            <span className="user-avatar">
              {currentUser.firstName?.charAt(0)?.toUpperCase() || 'U'}
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
        <section className="manage-apis-top">
          <h1>Manage APIs</h1>
          <button onClick={handleAddApi} className="add-api-btn">+ Add API</button>
        </section>

        <section className="apis-list">
          {apis.length > 0 ? (
            <table className="api-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Base URL</th>
                  <th>Description</th>
                  <th>Last Scanned</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {apis.map(api => (
                  <tr key={api.id}>
                    <td>{api.name}</td>
                    <td>{api.baseUrl}</td>
                    <td>{api.description}</td>
                    <td>{api.lastScanned}</td>
                    <td>{api.status}</td>
                    <td>
                      <button onClick={() => handleEditApi(api)} className="action-btn">Edit</button>
                      <button onClick={() => handleDeleteApi(api)} className="action-btn delete">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-apis">
              <p>No APIs found. Add your first API to get started.</p>
            </div>
          )}
        </section>
        {uploadMessage && (
          <div style={{
            textAlign: 'center',
            marginTop: '10px',
            color: uploadMessage.includes('success') || uploadMessage.includes('imported') ? '#28a745' : '#dc3545'
          }}>
            {uploadMessage}
          </div>
        )}
      </main>

      {/* Add/Edit API Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{currentApi?.id ? 'Edit API' : 'Add New API'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="close-btn">×</button>
            </div>
            <form className="modal-form">
              <div className="form-group">
                <label htmlFor="api-name">API Name</label>
                <input
                  id="api-name"
                  type="text"
                  name="name"
                  value={currentApi?.name || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="base-url">Base URL</label>
                <input
                  id="base-url"
                  type="url"
                  name="baseUrl"
                  value={currentApi?.baseUrl || ''}
                  onChange={handleInputChange}
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
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="api-file">Upload API Spec File (JSON)</label>
                <input
                  id="api-file"
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                />
                <small style={{ color: '#666' }}>Upload a JSON file with API details (name, baseUrl, optional description, status).</small>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setIsModalOpen(false)} className="cancel-btn">Cancel</button>
                <button
                  type="button"
                  onClick={handleSaveApi}
                  className="save-btn"
                  disabled={isFileUploaded} // Disable if file was uploaded
                >
                  {isFileUploaded ? 'API Added' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button onClick={() => setIsDeleteConfirmOpen(false)} className="close-btn">×</button>
            </div>
            <p>Are you sure you want to delete "{apiToDelete?.name}" API? This action cannot be undone.</p>
            <div className="modal-actions">
              <button type="button" onClick={() => setIsDeleteConfirmOpen(false)} className="cancel-btn">Cancel</button>
              <button type="button" onClick={confirmDelete} className="save-btn">Delete</button>
            </div>
          </div>
        </div>
      )}

      <footer className="manage-apis-footer">
        <p>© 2025 AT-AT (API Threat Assessment Tool) • COS301 Capstone Project. All rights reserved.</p>
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Help Center</a>
        </div>
      </footer>
    </div>
  );
};

export default ManageAPIs;
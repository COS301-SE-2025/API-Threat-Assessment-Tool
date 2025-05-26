// ManageAPIs.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ManageAPIs.css';

const ManageAPIs = () => {
  const navigate = useNavigate();
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

  const handleLogout = () => {
    navigate('/login');
  };

  const handleAddApi = () => {
    setCurrentApi({
      id: null,
      name: '',
      baseUrl: '',
      description: '',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleEditApi = (api) => {
    setCurrentApi({ ...api });
    setIsModalOpen(true);
  };

  const handleDeleteApi = (api) => {
    setApiToDelete(api);
    setIsDeleteConfirmOpen(true);
  };

  const handleSaveApi = () => {
    if (currentApi.id) {
      // Update existing API
      setApis(apis.map(api => api.id === currentApi.id ? currentApi : api));
    } else {
      // Add new API
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

  return (
    <div className="manage-apis-container">
      <header className="manage-apis-header">
        <div className="logo">AT-AT</div>
        <nav className="dashboard-nav">
          <Link to="/home">Home</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/manage-apis">Manage APIs</Link>
          <Link to="/settings">Settings</Link>
        </nav>
        <div className="user-info">
          <span>Welcome, User!</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
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
      </main>

      {/* Add/Edit API Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{currentApi.id ? 'Edit API' : 'Add New API'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="close-btn">&times;</button>
            </div>
            <form className="modal-form">
              <div className="form-group">
                <label>API Name</label>
                <input
                  type="text"
                  name="name"
                  value={currentApi.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Base URL</label>
                <input
                  type="url"
                  name="baseUrl"
                  value={currentApi.baseUrl}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={currentApi.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={currentApi.status}
                  onChange={handleInputChange}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setIsModalOpen(false)} className="cancel-btn">Cancel</button>
                <button type="button" onClick={handleSaveApi} className="save-btn">Save</button>
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
              <button onClick={() => setIsDeleteConfirmOpen(false)} className="close-btn">&times;</button>
            </div>
            <p>Are you sure you want to delete "{apiToDelete?.name}" API? This action cannot be undone.</p>
            <div className="modal-actions">
              <button type="button" onClick={() => setIsDeleteConfirmOpen(false)} className="cancel-btn">Cancel</button>
              <button type="button" onClick={confirmDelete} className="save-btn">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAPIs;
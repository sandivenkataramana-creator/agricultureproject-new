import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiDownload, FiUpload } from 'react-icons/fi';

const DAO = () => {
  const [daos, setDAOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', department: '', email: '', phone: '', status: 'active' });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = user.role === 'superadmin';
  const isReadOnly = !isSuperAdmin;

  useEffect(() => {
    fetchDAOs();
  }, []);

  const fetchDAOs = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/dao');
      if (response.ok) {
        const data = await response.json();
        setDAOs(Array.isArray(data) ? data : []);
        setError(null);
      } else {
        throw new Error(`Failed to fetch DAOs: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching DAOs:', err);
      setError('Failed to fetch DAO data. Please make sure the server is running.');
      setDAOs([]);
    } finally {
      setLoading(false);
    }
  };

  const getAuthHeaders = () => {
    const token = user?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleOpenModal = (dao = null) => {
    if (isReadOnly) return;
    if (dao) {
      setFormData(dao);
      setEditingId(dao.id);
    } else {
      setFormData({ name: '', department: '', email: '', phone: '', status: 'active' });
      setEditingId(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ name: '', department: '', email: '', phone: '', status: 'active' });
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (isReadOnly) return;
    try {
      if (editingId) {
        // Update DAO
        const response = await fetch(`http://localhost:5000/api/dao/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(formData)
        });
        if (!response.ok) {
          throw new Error(`Failed to update DAO: ${response.status}`);
        }
        alert('DAO updated successfully');
      } else {
        // Create DAO
        const response = await fetch('http://localhost:5000/api/dao', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(formData)
        });
        if (!response.ok) {
          throw new Error(`Failed to create DAO: ${response.status}`);
        }
        alert('DAO created successfully');
      }
      fetchDAOs();
      handleCloseModal();
    } catch (err) {
      console.error('Error saving DAO:', err);
      alert('Failed to save DAO. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (isReadOnly) return;
    if (window.confirm('Are you sure you want to delete this DAO?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/dao/${id}`, {
          method: 'DELETE',
          headers: { ...getAuthHeaders() }
        });
        if (!response.ok) {
          throw new Error(`Failed to delete DAO: ${response.status}`);
        }
        alert('DAO deleted successfully');
        fetchDAOs();
      } catch (err) {
        console.error('Error deleting DAO:', err);
        alert('Failed to delete DAO. Please try again.');
      }
    }
  };

  const filteredDAOs = daos.filter(dao =>
    dao.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dao.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dao.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
        <div style={{ marginBottom: '20px' }}>Loading DAOs...</div>
        <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #ddd', borderTop: '4px solid #0d47a1', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div className="page dao-page">
      <h2>District Agriculture Officers (DAO)</h2>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Action Bar */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {!isReadOnly && (
          <button
            style={{
              background: '#2e7d32',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onClick={() => handleOpenModal()}
          >
            <FiPlus /> Add New DAO
          </button>
        )}
        <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiSearch style={{ color: '#666' }} />
          <input
            type="text"
            placeholder="Search DAOs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>SNO</th>
                <th>Name</th>
                <th>Department</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDAOs.length > 0 ? (
                filteredDAOs.map((dao, index) => (
                  <tr key={dao.id}>
                    <td><strong>{index + 1}</strong></td>
                    <td>{dao.name}</td>
                    <td>{dao.department}</td>
                    <td>{dao.email}</td>
                    <td>{dao.phone}</td>
                    <td>
                      <span className={`status-badge ${dao.status}`}>
                        {dao.status.charAt(0).toUpperCase() + dao.status.slice(1)}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: '8px' }}>
                      {!isReadOnly && (
                        <>
                          <button
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#0d47a1',
                              fontSize: '16px'
                            }}
                            onClick={() => handleOpenModal(dao)}
                            title="Edit"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#d32f2f',
                              fontSize: '16px'
                            }}
                            onClick={() => handleDelete(dao.id)}
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                    No DAOs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ marginBottom: '20px' }}>
              {editingId ? 'Edit DAO' : 'Add New DAO'}
            </h3>
            <form style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter DAO name"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="Enter department"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={handleSave}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: '#2e7d32',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Save
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: '#999',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DAO;

import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';

const Programs = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isReadOnly = user.role !== 'superadmin';

  const getAuthHeaders = () => {
    const token = user?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    budget: '',
    start_date: '',
    end_date: '',
    status: 'active'
  });

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/programs');
      if (response.ok) {
        const data = await response.json();
        setPrograms(Array.isArray(data) ? data : data.data || []);
      } else {
        console.error('Failed to fetch programs:', response.status);
        setPrograms([]);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (program = null) => {
    if (isReadOnly) return;
    if (program) {
      setEditingId(program.id);
      setFormData({
        name: program.name || '',
        description: program.description || '',
        budget: program.budget || '',
        start_date: program.start_date ? program.start_date.split('T')[0] : '',
        end_date: program.end_date ? program.end_date.split('T')[0] : '',
        status: program.status || 'active'
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', description: '', budget: '', start_date: '', end_date: '', status: 'active' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', description: '', budget: '', start_date: '', end_date: '', status: 'active' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (isReadOnly) return;
    if (!formData.name.trim()) {
      alert('Please enter program name');
      return;
    }

    try {
      if (editingId) {
        // Update
        const response = await fetch(`http://localhost:5000/api/programs/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(formData)
        });
        if (response.ok) {
          setPrograms(programs.map(p => p.id === editingId ? { ...formData, id: editingId } : p));
        }
      } else {
        // Create
        const response = await fetch('http://localhost:5000/api/programs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(formData)
        });
        if (response.ok) {
          const data = await response.json();
          setPrograms([...programs, { ...formData, id: data.id }]);
        }
      }
      handleCloseModal();
      fetchPrograms();
    } catch (error) {
      console.error('Error saving program:', error);
      alert('Error saving program');
    }
  };

  const handleDelete = async (id) => {
    if (isReadOnly) return;
    if (window.confirm('Are you sure?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/programs/${id}`, {
          method: 'DELETE',
          headers: { ...getAuthHeaders() }
        });
        if (response.ok) {
          setPrograms(programs.filter(p => p.id !== id));
        }
      } catch (error) {
        console.error('Error deleting program:', error);
        alert('Error deleting program');
      }
    }
  };

  const filteredPrograms = programs.filter(program =>
    program.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="page-container">
      {/* Action Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <FiSearch style={{ color: '#666', fontSize: '18px' }} />
          <input
            type="text"
            placeholder="Search programs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>
        {!isReadOnly && (
          <button
            onClick={() => handleOpenModal()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              backgroundColor: '#2e7d32',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <FiPlus /> Add Program
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-card">
        <table style={{
          width: '100%',
          borderCollapse: 'collapse'
        }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Budget</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPrograms.slice(currentPage * pageSize, (currentPage + 1) * pageSize).length > 0 ? (
              filteredPrograms.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map((program) => (
                <tr key={program.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#333' }}>{program.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>{program.description || '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#333' }}>₹{Number(program.budget || 0).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>{program.start_date ? new Date(program.start_date).toLocaleDateString('en-IN') : '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>{program.end_date ? new Date(program.end_date).toLocaleDateString('en-IN') : '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      backgroundColor: program.status === 'active' ? '#e8f5e9' : '#ffebee',
                      color: program.status === 'active' ? '#2e7d32' : '#c62828',
                      fontWeight: '500'
                    }}>
                      {program.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      {!isReadOnly && (
                        <>
                          <button
                            onClick={() => handleOpenModal(program)}
                            style={{
                              width: '32px',
                              height: '32px',
                              border: 'none',
                              borderRadius: '4px',
                              backgroundColor: '#fff3e0',
                              color: '#e65100',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(program.id)}
                            style={{
                              width: '32px',
                              height: '32px',
                              border: 'none',
                              borderRadius: '4px',
                              backgroundColor: '#ffebee',
                              color: '#c62828',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  No programs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="pagination" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', borderTop: '1px solid #e0e0e0' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>
            {filteredPrograms.length > 0 ? `${currentPage * pageSize + 1}-${Math.min((currentPage + 1) * pageSize, filteredPrograms.length)} of ${filteredPrograms.length.toLocaleString()}` : '0 of 0'}
          </span>
          <button 
            disabled={currentPage === 0} 
            onClick={() => setCurrentPage(currentPage - 1)}
            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #d0d7de', background: 'white', cursor: currentPage === 0 ? 'not-allowed' : 'pointer', opacity: currentPage === 0 ? 0.5 : 1 }}
          >
            &lt;
          </button>
          <button 
            disabled={(currentPage + 1) * pageSize >= filteredPrograms.length} 
            onClick={() => setCurrentPage(currentPage + 1)}
            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #d0d7de', background: 'white', cursor: (currentPage + 1) * pageSize >= filteredPrograms.length ? 'not-allowed' : 'pointer', opacity: (currentPage + 1) * pageSize >= filteredPrograms.length ? 0.5 : 1 }}
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
              {editingId ? 'Edit Program' : 'Add Program'}
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                Program Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter program name"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter description"
                rows="4"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                Budget (₹)
              </label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                placeholder="Enter budget"
                step="1"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                  End Date
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCloseModal}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f0f0f0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2e7d32',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {editingId ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Programs;

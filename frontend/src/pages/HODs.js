import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { getHODs, createHOD, updateHOD, deleteHOD, getCategories, createCategory } from '../services/api';

const HODs = () => {
  const [hods, setHODs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingHod, setEditingHod] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    category_id: '',
    email: '',
    phone: '',
    status: 'active'
  });
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = user.role === 'superadmin';
  const isReadOnly = !isSuperAdmin;

  useEffect(() => {
    fetchHODs();
    fetchCategories();
  }, []);

  const fetchHODs = async () => {
    try {
      setLoading(true);
      const response = await getHODs();
      setHODs(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching HODs:', err);
      setError('Failed to fetch HODs. Please make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      setCategories(response.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleOpenModal = (hod = null) => {
    if (isReadOnly) return;
    if (hod) {
      setEditingHod(hod);
      setFormData({ ...hod, category_id: hod.category_id || '' });
    } else {
      setEditingHod(null);
      setFormData({ name: '', department: '', category_id: '', email: '', phone: '', status: 'active' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHod(null);
    setFormData({ name: '', department: '', category_id: '', email: '', phone: '', status: 'active' });
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    try {
      await createCategory(newCategory);
      await fetchCategories();
      setIsCategoryModalOpen(false);
      setNewCategory({ name: '', description: '' });
      alert('Category created successfully!');
    } catch (err) {
      console.error('Error creating category:', err);
      alert('Failed to create category. Please try again.');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    try {
      if (editingHod) {
        await updateHOD(editingHod.id, formData);
      } else {
        await createHOD(formData);
      }
      fetchHODs(); // Refresh the list
      handleCloseModal();
    } catch (err) {
      console.error('Error saving HOD:', err);
      alert('Failed to save HOD. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (isReadOnly) return;
    if (window.confirm('Are you sure you want to delete this HOD?')) {
      try {
        await deleteHOD(id);
        fetchHODs(); // Refresh the list
      } catch (err) {
        console.error('Error deleting HOD:', err);
        alert('Failed to delete HOD. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        {/* <Header title="HODs Management" /> */}
        <div className="loading-message">Loading HODs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        {/* <Header title="HODs Management" /> */}
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* <Header title="HODs Management" /> */}

      <div className="table-card">
        <div className="table-header">
          <h3>HOD's ({hods.length})</h3>
          {!isReadOnly && (
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              <FiPlus /> Add HOD
            </button>
          )}
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr style={{ display: 'table-row', verticalAlign: 'inherit', unicodeBidi: 'isolate', borderColor: 'inherit' }}>
                <th>SNO</th>
                <th>Name</th>
                <th>Department</th>
                <th>Category</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {hods.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map((hod, index) => (
                <tr key={hod.id}>
                  <td><strong>{currentPage * pageSize + index + 1}</strong></td>
                  <td>{hod.name}</td>
                  <td>{hod.department}</td>
                  <td>{hod.category_name}</td>
                  <td>{hod.email}</td>
                  <td>{hod.phone}</td>
                  <td>
                    <span className={`status-badge ${hod.status}`}>{hod.status}</span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {!isReadOnly && (
                        <>
                          <button className="action-btn edit" onClick={() => handleOpenModal(hod)}>
                            <FiEdit2 />
                          </button>
                          <button className="action-btn delete" onClick={() => handleDelete(hod.id)}>
                            <FiTrash2 />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', borderTop: '1px solid #e0e0e0' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>
            {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, hods.length)} of {hods.length.toLocaleString()}
          </span>
          <button 
            disabled={currentPage === 0} 
            onClick={() => setCurrentPage(currentPage - 1)}
            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #d0d7de', background: 'white', cursor: currentPage === 0 ? 'not-allowed' : 'pointer', opacity: currentPage === 0 ? 0.5 : 1 }}
          >
            &lt;
          </button>
          <button 
            disabled={(currentPage + 1) * pageSize >= hods.length} 
            onClick={() => setCurrentPage(currentPage + 1)}
            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #d0d7de', background: 'white', cursor: (currentPage + 1) * pageSize >= hods.length ? 'not-allowed' : 'pointer', opacity: (currentPage + 1) * pageSize >= hods.length ? 0.5 : 1 }}
          >
            &gt;
          </button>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingHod ? 'Edit HOD' : 'Add New HOD'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
            {!isReadOnly && (
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editingHod ? 'Update' : 'Create'}
              </button>
            )}
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Department Category {isSuperAdmin && <button type="button" className="btn-link" onClick={() => setIsCategoryModalOpen(true)} style={{ fontSize: '12px', marginLeft: '8px' }}>+ Create New</button>}</label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              required
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Department</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Category Creation Modal */}
      {isSuperAdmin && (
        <Modal
          isOpen={isCategoryModalOpen}
          onClose={() => {
            setIsCategoryModalOpen(false);
            setNewCategory({ name: '', description: '' });
          }}
          title="Create New Category"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setIsCategoryModalOpen(false)}>Cancel</button>
              {!isReadOnly && (
                <button className="btn btn-primary" onClick={handleCreateCategory}>Create</button>
              )}
            </>
          }
        >
          <form onSubmit={handleCreateCategory}>
            <div className="form-group">
              <label>Category Name</label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                required
                placeholder="e.g., Agriculture, Health, Education"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                rows="3"
                placeholder="Brief description of the category"
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default HODs;

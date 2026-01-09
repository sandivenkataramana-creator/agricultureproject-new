import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { getStaff, createStaff, updateStaff, deleteStaff, getHODs, getCategories, createCategory } from '../services/api';

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [hods, setHods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [selectedHodId, setSelectedHodId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    employee_id: '',
    designation: '',
    department: '',
    category_id: '',
    hod_id: '',
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
  const isHOD = user.role === 'hod';

  useEffect(() => {
    fetchData();
    // If HOD user, lock filter to their own ID
    if (isHOD && user.hod_id) {
      setSelectedHodId(String(user.hod_id));
    }
  }, []);

  useEffect(() => {
    // Filter staff based on selected HOD
    if (selectedHodId === '') {
      setFilteredStaff(staff);
    } else {
      setFilteredStaff(staff.filter(s => s.hod_id === Number(selectedHodId)));
    }
  }, [selectedHodId, staff]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffRes, hodsRes, categoriesRes] = await Promise.all([
        getStaff(),
        getHODs(),
        getCategories()
      ]);
      setStaff(staffRes.data || []);
      setFilteredStaff(staffRes.data || []);
      setHods(hodsRes.data || []);
      setCategories(categoriesRes.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch staff. Please make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    try {
      await createCategory(newCategory);
      await fetchData();
      setIsCategoryModalOpen(false);
      setNewCategory({ name: '', description: '' });
      alert('Category created successfully!');
    } catch (err) {
      console.error('Error creating category:', err);
      alert('Failed to create category. Please try again.');
    }
  };

  const handleOpenModal = (staffMember = null) => {
    if (isReadOnly) return;
    if (staffMember) {
      setEditingStaff(staffMember);
      setFormData({
        ...staffMember,
        hod_id: staffMember.hod_id || ''
      });
    } else {
      setEditingStaff(null);
      setFormData({ name: '', employee_id: '', designation: '', department: '', category_id: '', hod_id: '', email: '', phone: '', status: 'active' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStaff(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    try {
      const submitData = {
        ...formData,
        hod_id: Number(formData.hod_id)
      };
      
      if (editingStaff) {
        await updateStaff(editingStaff.id, submitData);
      } else {
        await createStaff(submitData);
      }
      fetchData(); // Refresh the list
      handleCloseModal();
    } catch (err) {
      console.error('Error saving staff:', err);
      alert('Failed to save staff. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (isReadOnly) return;
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await deleteStaff(id);
        fetchData(); // Refresh the list
      } catch (err) {
        console.error('Error deleting staff:', err);
        alert('Failed to delete staff. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        {/* <Header title="Staff Management" /> */}
        <div className="loading-message">Loading staff...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        {/* <Header title="Staff Management" /> */}
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* <Header title="Staff Management" /> */}

      <div className="table-card">
        <div className="table-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div>Total records: <strong>{filteredStaff.length}</strong> | Showing {Math.min(currentPage * pageSize + 1, filteredStaff.length)}-{Math.min((currentPage + 1) * pageSize, filteredStaff.length)} of {filteredStaff.length}</div>
            <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label htmlFor="hodFilter" style={{ fontSize: '14px', fontWeight: 'normal' }}>Filter by HOD:</label>
              <select 
                id="hodFilter"
                value={selectedHodId} 
                onChange={(e) => setSelectedHodId(e.target.value)}
                disabled={isHOD}
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: '6px', 
                  border: '1px solid #e0e0e0', 
                  fontSize: '14px',
                  backgroundColor: isHOD ? '#f5f5f5' : 'white',
                  cursor: isHOD ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="">All HODs</option>
                {hods.map(hod => (
                  <option key={hod.id} value={hod.id}>{hod.name} - {hod.department}</option>
                ))}
              </select>
            </div>
          </div>
          {!isReadOnly && (
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              <FiPlus /> Add Staff
            </button>
          )}
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map((member) => (
                <tr key={member.id}>
                  <td><strong>{member.employee_id}</strong></td>
                  <td>{member.name}</td>
                  <td>{member.designation}</td>
                  <td>{member.department || member.hod_department}</td>
                  <td>{member.email}</td>
                  <td>{member.phone}</td>
                  <td>
                    <span className={`status-badge ${member.status}`}>{member.status}</span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {!isReadOnly && (
                        <>
                          <button className="action-btn edit" onClick={() => handleOpenModal(member)}>
                            <FiEdit2 />
                          </button>
                          <button className="action-btn delete" onClick={() => handleDelete(member.id)}>
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
            {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, filteredStaff.length)} of {filteredStaff.length.toLocaleString()}
          </span>
          <button 
            disabled={currentPage === 0} 
            onClick={() => setCurrentPage(currentPage - 1)}
            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #d0d7de', background: 'white', cursor: currentPage === 0 ? 'not-allowed' : 'pointer', opacity: currentPage === 0 ? 0.5 : 1 }}
          >
            &lt;
          </button>
          <button 
            disabled={(currentPage + 1) * pageSize >= filteredStaff.length} 
            onClick={() => setCurrentPage(currentPage + 1)}
            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #d0d7de', background: 'white', cursor: (currentPage + 1) * pageSize >= filteredStaff.length ? 'not-allowed' : 'pointer', opacity: (currentPage + 1) * pageSize >= filteredStaff.length ? 0.5 : 1 }}
          >
            &gt;
          </button>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingStaff ? 'Edit Staff' : 'Add New Staff'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
            {!isReadOnly && (
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editingStaff ? 'Update' : 'Create'}
              </button>
            )}
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Employee ID</label>
            <input type="text" name="employee_id" value={formData.employee_id} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Designation</label>
            <input type="text" name="designation" value={formData.designation} onChange={handleChange} required />
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
            <input type="text" name="department" value={formData.department} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>HOD</label>
            <select name="hod_id" value={formData.hod_id} onChange={handleChange} required>
              <option value="">Select HOD</option>
              {hods.map(hod => (
                <option key={hod.id} value={hod.id}>{hod.name} - {hod.department}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Staff;

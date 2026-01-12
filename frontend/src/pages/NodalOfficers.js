import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { getNodalOfficers, createNodalOfficer, updateNodalOfficer, deleteNodalOfficer, getSchemes } from '../services/api';

const NodalOfficers = () => {
  const [officers, setOfficers] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [mandals, setMandals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    scheme_id: '',
    purpose: '',
    state_id: '1',
    district_id: '',
    mandal_id: '',
    start_date: '',
    end_date: '',
    email: '',
    phone: '',
    status: 'active'
  });
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = user.role === 'superadmin';
  const isReadOnly = !isSuperAdmin;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [officersRes, schemesRes, statesRes] = await Promise.all([
        getNodalOfficers(),
        getSchemes(),
        fetch('http://localhost:5000/api/locations/states').then(r => r.json())
      ]);
      console.log('Fetched officers:', officersRes.data);
      console.log('Fetched schemes:', schemesRes.data);
      setOfficers(officersRes.data || []);
      setSchemes(schemesRes.data || []);
      setStates(statesRes || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch nodal officers. Please make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = async (officer = null) => {
    if (isReadOnly) return;
    if (officer) {
      setEditingOfficer(officer);
      
      // Format dates for date inputs (YYYY-MM-DD)
      const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
      };
      
      const stateId = officer.state_id || 1;
      
      console.log('Opening edit modal for officer:', officer);
      console.log('Officer scheme_id:', officer.scheme_id);
      console.log('Available schemes:', schemes);
      
      setFormData({
        ...officer,
        scheme_id: officer.scheme_id ? officer.scheme_id.toString() : '',
        state_id: stateId.toString(),
        district_id: officer.district_id ? officer.district_id.toString() : '',
        mandal_id: officer.mandal_id ? officer.mandal_id.toString() : '',
        start_date: formatDate(officer.start_date),
        end_date: formatDate(officer.end_date)
      });
      
      // Load districts for the state
      console.log('Loading districts for state:', stateId);
      await fetchDistricts(stateId);
      
      // Load mandals for the district if selected
      if (officer.district_id) {
        console.log('Loading mandals for district:', officer.district_id);
        await fetchMandals(officer.district_id);
      }
    } else {
      setEditingOfficer(null);
      setFormData({ name: '', designation: '', scheme_id: '', purpose: '', state_id: '1', district_id: '', mandal_id: '', start_date: '', end_date: '', email: '', phone: '', status: 'active' });
      // Load districts for Telangana by default
      console.log('Loading districts for new officer (Telangana)');
      await fetchDistricts(1);
      setMandals([]);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOfficer(null);
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Cascade: when state changes, load districts and clear mandal
    if (name === 'state_id') {
      setDistricts([]);
      setMandals([]);
      setFormData(prev => ({ ...prev, state_id: value, district_id: '', mandal_id: '' }));
      if (value) {
        await fetchDistricts(value);
      }
    }
    // Cascade: when district changes, load mandals
    else if (name === 'district_id') {
      setMandals([]);
      setFormData(prev => ({ ...prev, district_id: value, mandal_id: '' }));
      if (value) {
        await fetchMandals(value);
      }
    }
  };

  const fetchDistricts = async (stateId) => {
    try {
      console.log('Fetching districts');
      const response = await fetch(`http://localhost:5000/api/locations/districts`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      console.log('Districts fetched:', data);
      setDistricts(data || []);
    } catch (err) {
      console.error('Error fetching districts:', err);
      setDistricts([]);
    }
  };

  const fetchMandals = async (districtId) => {
    try {
      console.log('Fetching mandals for district:', districtId);
      const response = await fetch(`http://localhost:5000/api/locations/mandals/${districtId}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      console.log('Mandals fetched:', data);
      setMandals(data || []);
    } catch (err) {
      console.error('Error fetching mandals:', err);
      setMandals([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    try {
      const submitData = {
        ...formData,
        scheme_id: Number(formData.scheme_id),
        state_id: formData.state_id ? Number(formData.state_id) : 1,
        district_id: formData.district_id ? Number(formData.district_id) : null,
        mandal_id: formData.mandal_id ? Number(formData.mandal_id) : null
      };
      
      console.log('Submitting data:', submitData);
      
      if (editingOfficer) {
        await updateNodalOfficer(editingOfficer.id, submitData);
        console.log('Officer updated successfully');
      } else {
        await createNodalOfficer(submitData);
        console.log('Officer created successfully');
      }
      await fetchData(); // Refresh the list
      handleCloseModal();
    } catch (err) {
      console.error('Error saving nodal officer:', err);
      alert('Failed to save nodal officer. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (isReadOnly) return;
    if (window.confirm('Are you sure you want to delete this nodal officer?')) {
      try {
        await deleteNodalOfficer(id);
        fetchData(); // Refresh the list
      } catch (err) {
        console.error('Error deleting nodal officer:', err);
        alert('Failed to delete nodal officer. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        {/* <Header title="Nodal Officers Management" /> */}
        <div className="loading-message">Loading nodal officers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        {/* <Header title="Nodal Officers Management" /> */}
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* <Header title="Nodal Officers Management" /> */}

      <div className="table-card">
        <div className="table-header">
          <div>Total records: <strong>{officers.length}</strong> | Showing {Math.min(currentPage * pageSize + 1, officers.length)}-{Math.min((currentPage + 1) * pageSize, officers.length)} of {officers.length}</div>
          {!isReadOnly && (
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              <FiPlus /> Add Nodal Officer
            </button>
          )}
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>SNO</th>
                <th>Name</th>
                <th>Designation</th>
                <th>Scheme</th>
                <th>Purpose</th>
                <th>District</th>
                <th>Mandal</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Total Days</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {officers.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map((officer, index) => {
                const startDate = officer.start_date ? new Date(officer.start_date).toLocaleDateString() : '-';
                const endDate = officer.end_date ? new Date(officer.end_date).toLocaleDateString() : '-';
                const totalDays = officer.total_days ?? (officer.start_date && officer.end_date
                  ? Math.ceil((new Date(officer.end_date) - new Date(officer.start_date)) / (1000 * 60 * 60 * 24)) + 1
                  : '-');
                return (
                <tr key={officer.id}>
                  <td><strong>{currentPage * pageSize + index + 1}</strong></td>
                  <td>{officer.name}</td>
                  <td>{officer.designation}</td>
                  <td>{officer.scheme_name}</td>
                  <td>{officer.purpose || '-'}</td>
                  <td>{officer.district_name || '-'}</td>
                  <td>{officer.mandal_name || '-'}</td>
                  <td>{officer.phone}</td>
                  <td>{officer.email}</td>
                  <td>{startDate}</td>
                  <td>{endDate}</td>
                  <td>{totalDays}</td>
                  <td>
                    <span className={`status-badge ${officer.status}`}>{officer.status}</span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {!isReadOnly && (
                        <>
                          <button className="action-btn edit" onClick={() => handleOpenModal(officer)}>
                            <FiEdit2 />
                          </button>
                          <button className="action-btn delete" onClick={() => handleDelete(officer.id)}>
                            <FiTrash2 />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
        <div className="pagination" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', borderTop: '1px solid #e0e0e0' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>
            {officers.length > 0 ? `${currentPage * pageSize + 1}-${Math.min((currentPage + 1) * pageSize, officers.length)} of ${officers.length.toLocaleString()}` : '0 of 0'}
          </span>
          <button 
            disabled={currentPage === 0} 
            onClick={() => setCurrentPage(currentPage - 1)}
            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #d0d7de', background: 'white', cursor: currentPage === 0 ? 'not-allowed' : 'pointer', opacity: currentPage === 0 ? 0.5 : 1 }}
          >
            &lt;
          </button>
          <button 
            disabled={(currentPage + 1) * pageSize >= officers.length} 
            onClick={() => setCurrentPage(currentPage + 1)}
            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #d0d7de', background: 'white', cursor: (currentPage + 1) * pageSize >= officers.length ? 'not-allowed' : 'pointer', opacity: (currentPage + 1) * pageSize >= officers.length ? 0.5 : 1 }}
          >
            &gt;
          </button>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingOfficer ? 'Edit Nodal Officer' : 'Add New Nodal Officer'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
            {!isReadOnly && (
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editingOfficer ? 'Update' : 'Create'}
              </button>
            )}
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Designation</label>
            <input type="text" name="designation" value={formData.designation} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Scheme</label>
            <select name="scheme_id" value={formData.scheme_id} onChange={handleChange} required>
              <option value="">Select Scheme</option>
              {schemes.length === 0 && <option disabled>No schemes available</option>}
              {schemes.map(scheme => (
                <option key={scheme.id} value={scheme.id}>{scheme.scheme_name || scheme.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Purpose</label>
            <input type="text" name="purpose" value={formData.purpose} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>State</label>
            <select name="state_id" value={formData.state_id} onChange={handleChange} disabled>
              <option value="1">Telangana</option>
            </select>
          </div>
          <div className="form-group">
            <label>District</label>
            <select name="district_id" value={formData.district_id} onChange={handleChange} required>
              <option value="">Select District</option>
              {districts.map(district => (
                <option key={district.id} value={district.id}>{district.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Mandal</label>
            <select name="mandal_id" value={formData.mandal_id} onChange={handleChange} required disabled={!formData.district_id}>
              <option value="">Select Mandal</option>
              {mandals.map(mandal => (
                <option key={mandal.id} value={mandal.id}>{mandal.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Start Date</label>
            <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} />
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
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default NodalOfficers;

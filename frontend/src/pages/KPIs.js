import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { FiPlus, FiEdit2, FiTrash2, FiTrendingUp, FiTarget, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { getKPIs, createKPI, updateKPI, deleteKPI, getHODs } from '../services/api';

const KPIs = () => {
  const [kpis, setKpis] = useState([]);
  const [hods, setHods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState(null);
  const [formData, setFormData] = useState({
    hod_id: '',
    kpi_name: '',
    target_value: '',
    achieved_value: '',
    unit: '',
    period: '',
    status: 'on_track'
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
      const [kpisRes, hodsRes] = await Promise.all([
        getKPIs(),
        getHODs()
      ]);
      setKpis(kpisRes.data || []);
      setHods(hodsRes.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch KPIs. Please make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'on_track':
        return <FiCheckCircle style={{ color: 'var(--accent-color)' }} />;
      case 'at_risk':
        return <FiAlertCircle style={{ color: 'var(--warning-color)' }} />;
      case 'behind':
        return <FiAlertCircle style={{ color: 'var(--danger-color)' }} />;
      case 'completed':
        return <FiCheckCircle style={{ color: 'var(--secondary-color)' }} />;
      default:
        return null;
    }
  };

  const handleOpenModal = (kpi = null) => {
    if (isReadOnly) return;
    if (kpi) {
      setEditingKpi(kpi);
      setFormData({
        ...kpi,
        hod_id: kpi.hod_id || ''
      });
    } else {
      setEditingKpi(null);
      setFormData({ hod_id: '', kpi_name: '', target_value: '', achieved_value: '', unit: '', period: '', status: 'on_track' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingKpi(null);
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
        hod_id: Number(formData.hod_id),
        target_value: Number(formData.target_value),
        achieved_value: Number(formData.achieved_value) || 0
      };
      
      if (editingKpi) {
        await updateKPI(editingKpi.id, submitData);
      } else {
        await createKPI(submitData);
      }
      fetchData(); // Refresh the list
      handleCloseModal();
    } catch (err) {
      console.error('Error saving KPI:', err);
      alert('Failed to save KPI. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (isReadOnly) return;
    if (window.confirm('Are you sure you want to delete this KPI?')) {
      try {
        await deleteKPI(id);
        fetchData(); // Refresh the list
      } catch (err) {
        console.error('Error deleting KPI:', err);
        alert('Failed to delete KPI. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        {/* <Header title="KPIs Management" /> */}
        <div className="loading-message">Loading KPIs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        {/* <Header title="KPIs Management" /> */}
        <div className="error-message">{error}</div>
      </div>
    );
  }

  const onTrack = kpis.filter(k => k.status === 'on_track').length;
  const atRisk = kpis.filter(k => k.status === 'at_risk').length;
  const completed = kpis.filter(k => k.status === 'completed').length;

  return (
    <div className="page-container">
      {/* <Header title="KPIs Management" /> */}

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <FiTarget />
          </div>
          <div className="stat-info">
            <h3>{kpis.length}</h3>
            <p>Total KPIs</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <FiTrendingUp />
          </div>
          <div className="stat-info">
            <h3>{onTrack}</h3>
            <p>On Track</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <FiAlertCircle />
          </div>
          <div className="stat-info">
            <h3>{atRisk}</h3>
            <p>At Risk</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <FiCheckCircle />
          </div>
          <div className="stat-info">
            <h3>{completed}</h3>
            <p>Completed</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="widget-grid">
        {kpis.map((kpi) => {
          const progress = ((kpi.achieved_value / kpi.target_value) * 100).toFixed(1);
          return (
            <div className="widget-card" key={kpi.id}>
              <div className="widget-header" style={{
                background: kpi.status === 'on_track' ? 'linear-gradient(135deg, #48bb78, #38a169)' :
                           kpi.status === 'at_risk' ? 'linear-gradient(135deg, #ed8936, #dd6b20)' :
                           kpi.status === 'completed' ? 'linear-gradient(135deg, #3182ce, #2c6cb0)' :
                           'linear-gradient(135deg, #e53e3e, #c53030)'
              }}>
                <h4>{kpi.kpi_name}</h4>
                <div className="count">{progress}%</div>
              </div>
              <div className="widget-body">
                <div className="widget-item">
                  <span className="widget-item-label">HOD</span>
                  <span className="widget-item-value">{kpi.hod_name}</span>
                </div>
                <div className="widget-item">
                  <span className="widget-item-label">Target</span>
                  <span className="widget-item-value">{kpi.target_value.toLocaleString()} {kpi.unit}</span>
                </div>
                <div className="widget-item">
                  <span className="widget-item-label">Achieved</span>
                  <span className="widget-item-value">{kpi.achieved_value.toLocaleString()} {kpi.unit}</span>
                </div>
                <div className="widget-item">
                  <span className="widget-item-label">Period</span>
                  <span className="widget-item-value">{kpi.period}</span>
                </div>
                <div className="progress-bar" style={{ marginTop: '12px' }}>
                  <div 
                    className={`progress-fill ${kpi.status === 'on_track' ? 'green' : kpi.status === 'at_risk' ? 'orange' : 'blue'}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
                </div>
                <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                  {!isReadOnly && (
                    <>
                      <button className="action-btn edit" onClick={() => handleOpenModal(kpi)}>
                        <FiEdit2 />
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(kpi.id)}>
                        <FiTrash2 />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Button */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        {!isReadOnly && (
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <FiPlus /> Add New KPI
          </button>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingKpi ? 'Edit KPI' : 'Add New KPI'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editingKpi ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
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
            <label>KPI Name</label>
            <input type="text" name="kpi_name" value={formData.kpi_name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Target Value</label>
            <input type="number" name="target_value" value={formData.target_value} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Achieved Value</label>
            <input type="number" name="achieved_value" value={formData.achieved_value} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Unit</label>
            <input type="text" name="unit" value={formData.unit} onChange={handleChange} placeholder="e.g., Count, Days, %" required />
          </div>
          <div className="form-group">
            <label>Period</label>
            <select name="period" value={formData.period} onChange={handleChange} required>
              <option value="">Select Period</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Half-Yearly">Half-Yearly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="on_track">On Track</option>
              <option value="at_risk">At Risk</option>
              <option value="behind">Behind</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default KPIs;

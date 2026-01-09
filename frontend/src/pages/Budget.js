import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { FiPlus, FiEdit2, FiTrash2, FiFilter, FiX } from 'react-icons/fi';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { getBudget, createBudget, updateBudget, deleteBudget, getHODs, getSchemes, getStates, getDistrictsByState, getMandalsByDistrict, getVillagesByMandal, getVillagesByDistrict, getCategories } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [hods, setHods] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [mandals, setMandals] = useState([]);
  const [villages, setVillages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ hod_id: '', category: '', state_id: '', district_id: '', mandal_id: '', village: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [formData, setFormData] = useState({
    hod_id: '',
    scheme_id: '',
    category: '',
    description: '',
    financial_year: '',
    allocated_amount: '',
    utilized_amount: '',
    state_id: '',
    district_id: '',
    mandal_id: '',
    village: ''
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
      const [budgetRes, hodsRes, schemesRes, categoriesRes, statesRes] = await Promise.all([
        getBudget(),
        getHODs(),
        getSchemes(),
        getCategories(),
        getStates()
      ]);
      // Enrich budgets with location names if missing
      const budgetsRaw = budgetRes.data || [];
      const statesList = statesRes.data || [];
      const statesMap = {};
      statesList.forEach(s => { statesMap[s.id] = s.name; });

      let budgetsEnriched = budgetsRaw.map(b => ({
        ...b,
        state_name: b.state_name || statesMap[b.state_id] || null,
        district_name: b.district_name || null,
        mandal_name: b.mandal_name || null
      }));

      // Fetch districts for any state ids where district_name is missing but district_id exists
      const stateIdsToFetch = Array.from(new Set(budgetsEnriched.filter(b => b.district_id && !b.district_name && b.state_id).map(b => b.state_id)));
      if (stateIdsToFetch.length > 0) {
        await Promise.all(stateIdsToFetch.map(async (sid) => {
          try {
            const res = await getDistrictsByState(sid);
            const districtsList = res.data || [];
            budgetsEnriched = budgetsEnriched.map(b => {
              if (b.state_id === sid && b.district_id && !b.district_name) {
                const found = districtsList.find(d => Number(d.id) === Number(b.district_id));
                return { ...b, district_name: found ? found.name : b.district_name };
              }
              return b;
            });
          } catch (err) {
            console.error('Error fetching districts for budget enrichment:', err);
          }
        }));
      }

      // Fetch mandals for any district ids where mandal_name is missing but mandal_id exists
      const districtIdsToFetch = Array.from(new Set(budgetsEnriched.filter(b => b.mandal_id && !b.mandal_name && b.district_id).map(b => b.district_id)));
      if (districtIdsToFetch.length > 0) {
        await Promise.all(districtIdsToFetch.map(async (did) => {
          try {
            const res = await getMandalsByDistrict(did);
            const mandalsList = res.data || [];
            budgetsEnriched = budgetsEnriched.map(b => {
              if (b.district_id === did && b.mandal_id && !b.mandal_name) {
                const found = mandalsList.find(m => Number(m.id) === Number(b.mandal_id));
                return { ...b, mandal_name: found ? found.name : b.mandal_name };
              }
              return b;
            });
          } catch (err) {
            console.error('Error fetching mandals for budget enrichment:', err);
          }
        }));
      }

      setBudgets(budgetsEnriched);
      setHods(hodsRes.data || []);
      setSchemes(schemesRes.data || []);
      setCategories(categoriesRes.data || []);
      setStates(statesRes.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch budget data. Please make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleStateChange = async (stateId) => {
    setFormData({ ...formData, state_id: stateId, district_id: '', mandal_id: '' });
    setDistricts([]);
    setMandals([]);
    if (stateId) {
      try {
        const response = await getDistrictsByState(stateId);
        setDistricts(response.data || []);
      } catch (err) {
        console.error('Error fetching districts:', err);
      }
    }
  };

  const handleDistrictChange = async (districtId) => {
    setFormData({ ...formData, district_id: districtId, mandal_id: '' });
    setMandals([]);
    if (districtId) {
      try {
        const response = await getMandalsByDistrict(districtId);
        setMandals(response.data || []);
      } catch (err) {
        console.error('Error fetching mandals:', err);
      }
    }
  };

  // --- Filter handlers for table filters ---
  const handleFilterStateChange = async (stateId) => {
    setFilters({ ...filters, state_id: stateId, district_id: '', mandal_id: '' });
    setDistricts([]);
    setMandals([]);
    if (stateId) {
      try {
        const response = await getDistrictsByState(stateId);
        setDistricts(response.data || []);
      } catch (err) {
        console.error('Error fetching districts for filters:', err);
      }
    }
  };

  const handleFilterDistrictChange = async (districtId) => {
    setFilters({ ...filters, district_id: districtId, mandal_id: '', village: '' });
    setMandals([]);
    setVillages([]);
    if (districtId) {
      try {
        const response = await getMandalsByDistrict(districtId);
        setMandals(response.data || []);
        // also fetch villages for this district (aggregate)
        try {
          const vres = await getVillagesByDistrict(districtId);
          setVillages(vres.data || []);
        } catch (err) {
          console.error('Error fetching villages for district:', err);
        }
      } catch (err) {
        console.error('Error fetching mandals for filters:', err);
      }
    }
  };

  const handleFilterInputChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFilterMandalChange = async (mandalId) => {
    setFilters({ ...filters, mandal_id: mandalId, village: '' });
    setVillages([]);
    if (mandalId) {
      try {
        const response = await getVillagesByMandal(mandalId);
        setVillages(response.data || []);
      } catch (err) {
        console.error('Error fetching villages for mandal:', err);
      }
    } else {
      // If mandal cleared but district present, fetch district villages
      if (filters.district_id) {
        try {
          const res = await getVillagesByDistrict(filters.district_id);
          setVillages(res.data || []);
        } catch (err) {
          console.error('Error fetching villages for district fallback:', err);
        }
      }
    }
  };
  const clearFilters = () => {
    setFilters({ hod_id: '', category: '', state_id: '', district_id: '', mandal_id: '', village: '' });
    setDistricts([]);
    setMandals([]);
  };

  const hasActiveFilters = filters.hod_id || filters.category || filters.state_id || filters.district_id || filters.mandal_id || filters.village;
  const activeFilterCount = [filters.hod_id, filters.category, filters.state_id, filters.district_id, filters.mandal_id, filters.village].filter(Boolean).length;

  const filteredBudgets = budgets.filter(b => {
    if (filters.hod_id && Number(filters.hod_id) !== Number(b.hod_id)) return false;
    if (filters.category && filters.category !== b.category) return false;
    if (filters.state_id && Number(filters.state_id) !== Number(b.state_id)) return false;
    if (filters.district_id && Number(filters.district_id) !== Number(b.district_id)) return false;
    if (filters.mandal_id && Number(filters.mandal_id) !== Number(b.mandal_id)) return false;
    if (filters.village && filters.village.trim() !== '') {
      if (!b.village || !b.village.toLowerCase().includes(filters.village.trim().toLowerCase())) return false;
    }
    return true;
  });

  // Keep original formatCurrency logic
  const _formatCurrency = (value) => {
    const num2 = parseFloat(value) || 0;
    if (num2 === 0) return '₹0';
    if (num2 >= 10000000) {
      return `₹${(num2 / 10000000).toFixed(2)} Cr`;
    } else if (num2 >= 100000) {
      return `₹${(num2 / 100000).toFixed(2)} L`;
    }
    return `₹${num2.toLocaleString()}`;
  };

  // reuse _formatCurrency where needed
  const formatCurrency = _formatCurrency;

  const totalAllocated = budgets.reduce((sum, b) => sum + (parseFloat(b.allocated_amount) || 0), 0);
  const totalUtilized = budgets.reduce((sum, b) => sum + (parseFloat(b.utilized_amount) || 0), 0);

  const chartData = {
    labels: budgets.map(b => b.hod_name?.split(' ').pop() || 'Unknown'),
    datasets: [
      {
        label: 'Allocated (Cr)',
        data: budgets.map(b => (parseFloat(b.allocated_amount) || 0) / 10000000),
        backgroundColor: '#3182ce',
      },
      {
        label: 'Utilized (Cr)',
        data: budgets.map(b => (parseFloat(b.utilized_amount) || 0) / 10000000),
        backgroundColor: '#48bb78',
      }
    ]
  };

  const handleOpenModal = async (budget = null) => {
    if (isReadOnly) return;
    if (budget) {
      setEditingBudget(budget);
      // Pre-fill form values
      setFormData({
        hod_id: budget.hod_id || '',
        scheme_id: budget.scheme_id || '',
        category: budget.category || '',
        description: budget.description || '',
        financial_year: budget.financial_year || '',
        allocated_amount: budget.allocated_amount || '',
        utilized_amount: budget.utilized_amount || '',
        state_id: budget.state_id || '',
        district_id: budget.district_id || '',
        mandal_id: budget.mandal_id || '',
        village: budget.village || ''
      });

      // Ensure the select lists contain the current values so they display correctly
      try {
        if (budget.state_id) {
          const res = await getDistrictsByState(budget.state_id);
          setDistricts(res.data || []);
        }
        if (budget.district_id) {
          const res2 = await getMandalsByDistrict(budget.district_id);
          setMandals(res2.data || []);
        }
      } catch (err) {
        console.error('Error loading location lists for edit modal:', err);
      }
    } else {
      setEditingBudget(null);
      setFormData({ hod_id: '', scheme_id: '', category: '', description: '', financial_year: '', allocated_amount: '', utilized_amount: '', state_id: '', district_id: '', mandal_id: '', village: '' });
      setDistricts([]);
      setMandals([]);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBudget(null);
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
        scheme_id: Number(formData.scheme_id),
        allocated_amount: Number(formData.allocated_amount),
        utilized_amount: Number(formData.utilized_amount) || 0,
        state_id: formData.state_id || null,
        district_id: formData.district_id || null,
        mandal_id: formData.mandal_id || null,
        village: formData.village || null
      };
      
      if (editingBudget) {
        await updateBudget(editingBudget.id, submitData);
      } else {
        await createBudget(submitData);
      }
      fetchData(); // Refresh the list
      handleCloseModal();
    } catch (err) {
      console.error('Error saving budget:', err);
      alert('Failed to save budget. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (isReadOnly) return;
    if (window.confirm('Are you sure you want to delete this budget entry?')) {
      try {
        await deleteBudget(id);
        fetchData(); // Refresh the list
      } catch (err) {
        console.error('Error deleting budget:', err);
        alert('Failed to delete budget. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        {/* <Header title="Budget Management" /> */}
        <div className="loading-message">Loading budget data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        {/* <Header title="Budget Management" /> */}
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* <Header title="Budget Management" /> */}

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">₹</div>
          <div className="stat-info">
            <h3>{formatCurrency(totalAllocated)}</h3>
            <p>Total Allocated</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">₹</div>
          <div className="stat-info">
            <h3>{formatCurrency(totalUtilized)}</h3>
            <p>Total Utilized</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">₹</div>
          <div className="stat-info">
            <h3>{formatCurrency(totalAllocated - totalUtilized)}</h3>
            <p>Remaining Budget</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">%</div>
          <div className="stat-info">
            <h3>{totalAllocated > 0 ? ((totalUtilized / totalAllocated) * 100).toFixed(1) : 0}%</h3>
            <p>Overall Utilization</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      {/* <div className="chart-card" style={{ marginBottom: '24px' }}>
        <h3>Budget Allocation vs Utilization by HOD</h3>
        <div className="chart-container">
          <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div> */}

      {/* Table */}
      <div className="table-card">
        <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Budget Entries ({filteredBudgets.length}{hasActiveFilters ? ` of ${budgets.length}` : ''})</h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              className={`btn ${showFilters || hasActiveFilters ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowFilters(!showFilters)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FiFilter /> Filter {hasActiveFilters && `(${activeFilterCount})`}
            </button>
            {hasActiveFilters && (
              <button 
                className="btn btn-secondary" 
                onClick={clearFilters}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <FiX /> Clear
              </button>
            )}
            {!isReadOnly && (
              <button type="button" className="btn btn-primary" onClick={() => handleOpenModal()}>
                <FiPlus /> Add Budget
              </button>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div style={{ 
            padding: '16px 20px', 
            backgroundColor: '#f8f9fa', 
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'flex-end'
          }}>
            <div style={{ flex: '1', minWidth: '180px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#666' }}>
                HOD
              </label>
              <select 
                name="hod_id" 
                value={filters.hod_id} 
                onChange={(e) => setFilters({ ...filters, hod_id: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', backgroundColor: 'white' }}
              >
                <option value="">All HODs</option>
                {hods.map(hod => (
                  <option key={hod.id} value={hod.id}>{hod.name} - {hod.department}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: '1', minWidth: '150px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#666' }}>
                Category
              </label>
              <select 
                name="category" 
                value={filters.category} 
                onChange={handleFilterInputChange}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', backgroundColor: 'white' }}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: '1', minWidth: '150px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#666' }}>
                State
              </label>
              <select 
                name="state_id" 
                value={filters.state_id} 
                onChange={(e) => handleFilterStateChange(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', backgroundColor: 'white' }}
              >
                <option value="">All States</option>
                {states.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: '1', minWidth: '150px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#666' }}>
                District
              </label>
              <select 
                name="district_id" 
                value={filters.district_id} 
                onChange={(e) => handleFilterDistrictChange(e.target.value)} 
                disabled={!filters.state_id}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', backgroundColor: filters.state_id ? 'white' : '#f5f5f5' }}
              >
                <option value="">All Districts</option>
                {districts.map(district => (
                  <option key={district.id} value={district.id}>{district.name}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: '1', minWidth: '150px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#666' }}>
                Mandal
              </label>
              <select 
                name="mandal_id" 
                value={filters.mandal_id} 
                onChange={(e) => handleFilterMandalChange(e.target.value)} 
                disabled={!filters.district_id}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', backgroundColor: filters.district_id ? 'white' : '#f5f5f5' }}
              >
                <option value="">All Mandals</option>
                {mandals.map(mandal => (
                  <option key={mandal.id} value={mandal.id}>{mandal.name}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: '1', minWidth: '150px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#666' }}>
                Village
              </label>
              <select 
                name="village" 
                value={filters.village} 
                onChange={handleFilterInputChange} 
                disabled={!filters.district_id && !filters.mandal_id}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', backgroundColor: (filters.district_id || filters.mandal_id) ? 'white' : '#f5f5f5' }}
              >
                <option value="">All Villages</option>
                {villages.map((v, idx) => (
                  <option key={idx} value={v.name}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>HOD</th>
                <th>Scheme</th>
                <th>Category</th>
                <th>State</th>
                <th>District</th>
                <th>Mandal</th>
                <th>Village</th>
                <th>Description</th>
                <th>Financial Year</th>
                <th>Allocated</th>
                <th>Utilized</th>
                <th>Remaining</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBudgets.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map((budget) => {
                const allocated = parseFloat(budget.allocated_amount) || 0;
                const utilized = parseFloat(budget.utilized_amount) || 0;
                const remaining = allocated - utilized;
                return (
                  <tr key={budget.id}>
                    <td>{budget.hod_name || 'N/A'}</td>
                    <td>{budget.scheme_name || 'N/A'}</td>
                    <td>{budget.category}</td>
                    <td>{budget.state_name || 'N/A'}</td>
                    <td>{budget.district_name || 'N/A'}</td>
                    <td>{budget.mandal_name || 'N/A'}</td>
                    <td>{budget.village || 'N/A'}</td>
                    <td>{budget.description}</td>
                    <td>{budget.financial_year}</td>
                    <td>{formatCurrency(allocated)}</td>
                    <td>{formatCurrency(utilized)}</td>
                    <td style={{ color: remaining >= 0 ? 'var(--secondary-color)' : 'var(--danger-color)', fontWeight: '600' }}>
                      {formatCurrency(remaining)}
                    </td>
                    <td>
                      <div className="action-buttons">
                        {!isReadOnly && (
                          <>
                            <button className="action-btn edit" onClick={() => handleOpenModal(budget)}>
                              <FiEdit2 />
                            </button>
                            <button className="action-btn delete" onClick={() => handleDelete(budget.id)}>
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
            {filteredBudgets.length > 0 ? `${currentPage * pageSize + 1}-${Math.min((currentPage + 1) * pageSize, filteredBudgets.length)} of ${filteredBudgets.length.toLocaleString()}` : '0 of 0'}
          </span>
          <button 
            disabled={currentPage === 0} 
            onClick={() => setCurrentPage(currentPage - 1)}
            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #d0d7de', background: 'white', cursor: currentPage === 0 ? 'not-allowed' : 'pointer', opacity: currentPage === 0 ? 0.5 : 1 }}
          >
            &lt;
          </button>
          <button 
            disabled={(currentPage + 1) * pageSize >= filteredBudgets.length} 
            onClick={() => setCurrentPage(currentPage + 1)}
            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #d0d7de', background: 'white', cursor: (currentPage + 1) * pageSize >= filteredBudgets.length ? 'not-allowed' : 'pointer', opacity: (currentPage + 1) * pageSize >= filteredBudgets.length ? 0.5 : 1 }}
          >
            &gt;
          </button>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingBudget ? 'Edit Budget Entry' : 'Add Budget Entry'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
            {!isReadOnly && (
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editingBudget ? 'Update' : 'Create'}
              </button>
            )}
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
            <label>Scheme</label>
            <select name="scheme_id" value={formData.scheme_id} onChange={handleChange} required>
              <option value="">Select Scheme</option>
              {schemes.map(scheme => (
                <option key={scheme.id} value={scheme.id}>{scheme.scheme_name || scheme.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Category</label>
            <select name="category" value={formData.category} onChange={handleChange}>
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Financial Year</label>
            <select name="financial_year" value={formData.financial_year} onChange={handleChange} required>
              <option value="">Select Year</option>
              <option value="2024-25">2024-25</option>
              <option value="2023-24">2023-24</option>
              <option value="2025-26">2025-26</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Enter description" rows={3}></textarea>
          </div>
          <div className="form-group">
            <label>Allocated Amount (₹)</label>
            <input type="number" name="allocated_amount" value={formData.allocated_amount} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Utilized Amount (₹)</label>
            <input type="number" name="utilized_amount" value={formData.utilized_amount} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>State</label>
            <select 
              name="state_id" 
              value={formData.state_id} 
              onChange={(e) => handleStateChange(e.target.value)}
            >
              <option value="">Select State</option>
              {states.map(state => (
                <option key={state.id} value={state.id}>{state.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>District</label>
            <select 
              name="district_id" 
              value={formData.district_id} 
              onChange={(e) => handleDistrictChange(e.target.value)}
              disabled={!formData.state_id}
            >
              <option value="">Select District</option>
              {districts.map(district => (
                <option key={district.id} value={district.id}>{district.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Mandal</label>
            <select 
              name="mandal_id" 
              value={formData.mandal_id} 
              onChange={handleChange}
              disabled={!formData.district_id}
            >
              <option value="">Select Mandal</option>
              {mandals.map(mandal => (
                <option key={mandal.id} value={mandal.id}>{mandal.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Village</label>
            <input 
              type="text" 
              name="village" 
              value={formData.village} 
              onChange={handleChange}
              placeholder="Enter village name"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Budget;

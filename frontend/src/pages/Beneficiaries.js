import React, { useState, useEffect } from 'react';
import { FiFilter } from 'react-icons/fi';
import { FiCalendar, FiUsers, FiDownload, FiRefreshCw, FiMapPin, FiBriefcase, FiMap } from 'react-icons/fi';
import { getDistricts, getMandalsByDistrict, getVillagesByMandal, getVillagesByDistrict, searchBeneficiaries, exportBeneficiaries, importBeneficiaries, getImportJobStatus, getBeneficiariesSummary, getHODs, getHODDetails, getSchemes, getSchemesByHODId, getSchemeById, getLocationCounts } from '../services/api';
import Drawer from '../components/Drawer';
import './Beneficiaries.css';

const Beneficiaries = () => {
  const [districts, setDistricts] = useState([]);
  const [mandals, setMandals] = useState([]);
  const [villages, setVillages] = useState([]);
  const [hods, setHods] = useState([]);
  const [schemes, setSchemes] = useState([]);

  const [filters, setFilters] = useState({ hodId: null, districtId: null, mandalId: null, villageId: null, villageName: '', schemeId: null, page: 0, size: 10 });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [summary, setSummary] = useState(null);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Details modal state (for cards)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailModalTitle, setDetailModalTitle] = useState('');
  const [detailModalView, setDetailModalView] = useState(''); // 'hods-list'|'hod'|'districts-list'|'district'|'scheme'
  const [detailList, setDetailList] = useState([]);
  const [selectedHodDetails, setSelectedHodDetails] = useState(null);
  const [selectedDistrictDetails, setSelectedDistrictDetails] = useState(null);
  const [selectedSchemeDetails, setSelectedSchemeDetails] = useState(null);
  const [mandalVillages, setMandalVillages] = useState({});

  // Totals for stat cards
  const [totalHodsCount, setTotalHodsCount] = useState(0);
  const [totalDistrictsCount, setTotalDistrictsCount] = useState(0);
  const [totalMandalsCount, setTotalMandalsCount] = useState(0);

  // if user navigated with ?hodId=... pre-fill it (no auto-show filters)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hodId = params.get('hodId');
    if (hodId) setFilters(f => ({ ...f, hodId: Number(hodId) }));
  }, []);

  useEffect(() => {
    // Load initial data
    getDistricts().then(res => { setDistricts(res.data || []); setTotalDistrictsCount((res.data||[]).length); }).catch(() => setDistricts([]));
    getHODs().then(res => { setHods(res.data || []); setTotalHodsCount((res.data||[]).length); }).catch(() => setHods([]));
    getSchemes().then(res => setSchemes(res.data || [])).catch(() => setSchemes([]));
    setDetailList([]);

    getLocationCounts().then(res => {
      const d = res.data || {};
      setTotalDistrictsCount(d.totalDistricts || 0);
      setTotalMandalsCount(d.totalMandals || 0);
    }).catch(() => {});

    getBeneficiariesSummary().then(res => {
      setSummary(res.data || {});
    }).catch(() => setSummary(null));

    // Load all beneficiaries initially (no filters)
    onSearch();
  }, []);

  // Auto-search when filters change (skip initial mount)
  const [isInitialMount, setIsInitialMount] = useState(true);
  
  useEffect(() => {
    if (isInitialMount) {
      setIsInitialMount(false);
      return;
    }
    
    // Only auto-search if we have loaded initial data
    if (districts.length > 0) {
      onSearch();
    }
  }, [filters.districtId, filters.mandalId, filters.hodId, filters.schemeId, filters.villageId]);

  useEffect(() => {
    if (filters.districtId) {
      getMandalsByDistrict(filters.districtId).then(res => setMandals(res.data || [])).catch(() => setMandals([]));
      setFilters(f => ({ ...f, mandalId: null, villageId: null, villageName: '' }));
      setVillages([]);
    } else {
      setMandals([]);
      setVillages([]);
    }
  }, [filters.districtId]);

  useEffect(() => {
    // When HOD changes, fetch schemes for that HOD; otherwise load all schemes
    if (filters.hodId) {
      getSchemesByHODId(filters.hodId).then(res => setSchemes(res.data || [])).catch(() => setSchemes([]));
    } else {
      getSchemes().then(res => setSchemes(res.data || [])).catch(() => setSchemes([]));
    }
  }, [filters.hodId]);

  useEffect(() => {
    if (filters.mandalId) {
      getVillagesByMandal(filters.mandalId).then(res => setVillages(res.data || [])).catch(() => setVillages([]));
      setFilters(f => ({ ...f, villageId: null, villageName: '' }));
    }
  }, [filters.mandalId]);

  const onSearch = async () => {
    setLoading(true);
    try {
      const payload = { ...filters };
      // remove client-only empty fields
      if (!payload.villageName) delete payload.villageName;
      const res = await searchBeneficiaries(payload);
      setResults(res.data || res);
      // refresh summary for current filters
      try {
        const s = await getBeneficiariesSummary({ districtId: filters.districtId, mandalId: filters.mandalId });
        setSummary(s.data || {});
      } catch (e) {
        // ignore summary error
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || err.message || 'Search failed');
    }
    setLoading(false);
  };

  const onPageChange = async (newPage) => {
    setFilters(f => ({ ...f, page: newPage }));
    setLoading(true);
    try {
      const payload = { ...filters, page: newPage };
      if (!payload.villageName) delete payload.villageName;
      const res = await searchBeneficiaries(payload);
      setResults(res.data || res);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const onSizeChange = async (newSize) => {
    setFilters(f => ({ ...f, size: newSize, page: 0 }));
    setLoading(true);
    try {
      const res = await searchBeneficiaries({ ...filters, size: newSize, page: 0 });
      setResults(res.data || res);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const onExport = async (format = 'csv') => {
    try {
      const blobRes = await exportBeneficiaries(filters, format);
      const blob = new Blob([blobRes.data], { type: blobRes.headers['content-type'] || 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `beneficiaries_${Date.now()}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Export failed');
    }
  };

  const onImport = async (file) => {
    if (!file) return;
    if (!filters.districtId) { alert('Select district for import'); return; }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('districtId', filters.districtId);

    try {
      const res = await importBeneficiaries(formData);
      const jobId = res.data.jobId;
      setImportStatus({ jobId, status: 'pending' });
      // Poll job status
      const interval = setInterval(async () => {
        const st = await getImportJobStatus(jobId);
        setImportStatus(st.data);
        if (['completed', 'failed'].includes(st.data.status)) clearInterval(interval);
      }, 2000);
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Import failed');
    }
  };

  return (
    <div className="page beneficiaries-page">
      {/* <h2>Beneficiaries</h2> */}

      {summary && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
            <div style={{
              background: 'white',
              padding: '14px',
              borderRadius: '10px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              border: '1px solid rgba(0, 0, 0, 0.04)',
              borderLeft: '4px solid #1565c0'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #1e88e5, #1565c0)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0
              }}>
                <FiUsers size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#212121', marginBottom: '2px', lineHeight: 1.2 }}>{summary.totalBeneficiaries || 0}</h3>
                <p style={{ fontSize: '12px', color: '#616161', fontWeight: 500 }}>Total Beneficiaries</p>
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '14px',
              borderRadius: '10px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              border: '1px solid rgba(0, 0, 0, 0.04)',
              borderLeft: '4px solid #388e3c'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #43a047, #2e7d32)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0
              }}>
                <FiBriefcase size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#212121', marginBottom: '2px', lineHeight: 1.2 }}>{totalHodsCount || 0}</h3>
                <p style={{ fontSize: '12px', color: '#616161', fontWeight: 500 }}>Total HODs</p>
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '14px',
              borderRadius: '10px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              border: '1px solid rgba(0, 0, 0, 0.04)',
              borderLeft: '4px solid #ff6d00'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #fb8c00, #ef6c00)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0
              }}>
                <FiMap size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#212121', marginBottom: '2px', lineHeight: 1.2 }}>{totalDistrictsCount || 0}</h3>
                <p style={{ fontSize: '12px', color: '#616161', fontWeight: 500 }}>Total Districts</p>
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '14px',
              borderRadius: '10px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              border: '1px solid rgba(0, 0, 0, 0.04)',
              borderLeft: '4px solid #7b1fa2'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #8e24aa, #6a1b9a)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0
              }}>
                <FiMapPin size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#212121', marginBottom: '2px', lineHeight: 1.2 }}>{totalMandalsCount || 0}</h3>
                <p style={{ fontSize: '12px', color: '#616161', fontWeight: 500 }}>Total Mandals</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFilters && (
        <div style={{
          background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '4px',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          alignItems: 'flex-end'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '130px', flex: 1 }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'white', textTransform: 'uppercase', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              <FiMapPin style={{ marginRight: '6px', fontSize: '12px' }} /> District
            </label>
            <select value={filters.districtId || ''} onChange={(e) => setFilters(f => ({ ...f, districtId: e.target.value ? Number(e.target.value) : null }))} style={{
              padding: '9px',
              borderRadius: '8px',
              border: 'none',
              background: 'white',
              fontSize: '13px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              cursor: 'pointer'
            }}>
              <option value="">All Districts 🏛️</option>
              {districts.map(d => (<option key={d.id} value={d.id}>{d.name}</option>))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '130px', flex: 1 }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'white', textTransform: 'uppercase', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              <FiUsers style={{ marginRight: '6px', fontSize: '12px' }} /> Mandal
            </label>
            <select value={filters.mandalId || ''} onChange={(e) => setFilters(f => ({ ...f, mandalId: e.target.value ? Number(e.target.value) : null }))} style={{
              padding: '9px',
              borderRadius: '8px',
              border: 'none',
              background: 'white',
              fontSize: '13px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              cursor: 'pointer'
            }}>
              <option value="">All Mandals 📍</option>
              {mandals.map(m => (<option key={m.id} value={m.id}>{m.name}</option>))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '130px', flex: 1 }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'white', textTransform: 'uppercase', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              🏘️ Village
            </label>
            <input list="villages-list" placeholder="Type village name..." value={filters.villageName || ''} onChange={(e) => setFilters(f => ({ ...f, villageName: e.target.value }))} style={{
              padding: '9px',
              borderRadius: '8px',
              border: 'none',
              background: 'white',
              fontSize: '13px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }} />
            <datalist id="villages-list">
              {villages.map(v => (<option key={v.id || v.name} value={v.name} />))}
            </datalist>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '130px', flex: 1 }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'white', textTransform: 'uppercase', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              👤 HOD
            </label>
            <select value={filters.hodId || ''} onChange={(e) => setFilters(f => ({ ...f, hodId: e.target.value ? Number(e.target.value) : null }))} style={{
              padding: '9px',
              borderRadius: '8px',
              border: 'none',
              background: 'white',
              fontSize: '13px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              cursor: 'pointer'
            }}>
              <option value="">All HODs 💼</option>
              {hods.map(h => (<option key={h.id} value={h.id}>{h.name}</option>))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '130px', flex: 1 }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'white', textTransform: 'uppercase', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              📋 Scheme
            </label>
            <select value={filters.schemeId || ''} onChange={(e) => setFilters(f => ({ ...f, schemeId: e.target.value ? Number(e.target.value) : null }))} style={{
              padding: '9px',
              borderRadius: '8px',
              border: 'none',
              background: 'white',
              fontSize: '13px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              cursor: 'pointer'
            }}>
              <option value="">All Schemes 🎯</option>
              {schemes.map(s => (<option key={s.id} value={s.id}>{s.scheme_name || s.name}</option>))}
            </select>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button className="btn" onClick={() => onSearch()} style={{
              background: 'white',
              color: '#667eea',
              fontWeight: 'bold',
              padding: '9px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <FiRefreshCw style={{ fontSize: '14px' }} /> Search
            </button>
            <button className="btn" onClick={() => onExport('excel')} style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              fontWeight: 'bold',
              padding: '9px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <FiDownload style={{ fontSize: '14px' }} /> Export
            </button>
          </div>
        </div>
      )}

      {loading && <p>Loading...</p>}

      {/* summary lists commented per request — showing all districts/mandals separately now
      {summary && !results && (
        <div className="summary-lists">
          ...
        </div>
      )}
      */}

      {/* Detail drawer for cards (HODs / Districts / Mandals / Schemes) */}
      <Drawer isOpen={isDetailModalOpen} onClose={() => { setIsDetailModalOpen(false); setDetailModalView(''); setSelectedHodDetails(null); setSelectedDistrictDetails(null); setSelectedSchemeDetails(null); }} title={detailModalTitle}>
        {detailModalView === 'hods-list' && (
          <div>
            <h4>HODs ({detailList.length})</h4>
            <ul className="detail-list">
              {detailList.map(h => (
                <li key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>{h.name} <small style={{ color: '#666' }}>{h.department ? `— ${h.department}` : ''}</small></div>
                  <div><button className="btn btn-link" onClick={async () => { try { const res = await getHODDetails(h.id); setSelectedHodDetails(res.data); setDetailModalView('hod'); setDetailModalTitle(h.name); } catch (err) { alert('Failed to load HOD details'); } }}>View</button></div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {detailModalView === 'hod' && selectedHodDetails && (
          <div>
            <h4>{selectedHodDetails.name}</h4>
            <p><strong>Department:</strong> {selectedHodDetails.department || '-'}</p>
            <p><strong>Email:</strong> {selectedHodDetails.email || '-'}</p>
            <p><strong>Phone:</strong> {selectedHodDetails.phone || '-'}</p>
            <h5>Active schemes</h5>
            <ul className="detail-list">
              {(selectedHodDetails.schemes || []).map(s => (
                <li key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>{s.scheme_name || s.name}</div>
                  <div><button className="btn btn-link" onClick={async () => {
                    try {
                      const res = await getSchemeById(s.id);
                      const other = await getSchemesByHODId(res.data.hod_id || selectedHodDetails.id);
                      setSelectedSchemeDetails({ ...res.data, hodSchemes: other.data || [] });
                      setDetailModalView('scheme');
                      setDetailModalTitle(res.data.scheme_name || res.data.name);
                    } catch (err) {
                      alert('Failed to load scheme details');
                    }
                  }}>View</button></div>
                </li>
              ))}
              {(!selectedHodDetails.schemes || selectedHodDetails.schemes.length === 0) && <li>No active schemes</li>}
            </ul>
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-secondary" onClick={() => { setDetailModalView('hods-list'); setSelectedHodDetails(null); setDetailModalTitle('HODs'); }}>Back</button>
            </div>
          </div>
        )}

        {detailModalView === 'scheme' && selectedSchemeDetails && (
          <div>
            <h4>{selectedSchemeDetails.scheme_name || selectedSchemeDetails.name}</h4>
            <p><strong>HOD:</strong> {selectedSchemeDetails.hod_name || selectedSchemeDetails.hod_id || '-'}</p>
            <p><strong>Description:</strong> {selectedSchemeDetails.description || '-'}</p>
            <h5>Other schemes by HOD</h5>
            <ul className="detail-list">
              {(selectedSchemeDetails.hodSchemes || []).map(s => (
                <li key={s.id}>{s.scheme_name || s.name}</li>
              ))}
            </ul>
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-secondary" onClick={() => { setSelectedSchemeDetails(null); setDetailModalView('hod'); setDetailModalTitle(selectedHodDetails ? selectedHodDetails.name : 'HODs'); }}>Back</button>
            </div>
          </div>
        )}

        {detailModalView === 'districts-list' && (
          <div>
            <h4>Districts ({detailList.length})</h4>
            <ul className="detail-list">
              {detailList.map(d => (
                <li key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>{d.name}</div>
                  <div><button className="btn btn-link" onClick={async () => {
                    try {
                      const mandalsRes = await getMandalsByDistrict(d.id);
                      const villagesRes = await getVillagesByDistrict(d.id);
                      setSelectedDistrictDetails({ district: d, mandals: mandalsRes.data || [], villages: villagesRes.data || [] });
                      setDetailModalView('district');
                      setDetailModalTitle(d.name);
                    } catch (err) {
                      alert('Failed to load district details');
                    }
                  }}>View</button></div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {detailModalView === 'district' && selectedDistrictDetails && (
          <div>
            <h4>{selectedDistrictDetails.district.name}</h4>
            <h5>Mandals</h5>
            <ul className="detail-list">
              {(selectedDistrictDetails.mandals || []).map(m => (
                <li key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>{m.name}</div>
                    <div><button className="btn btn-link" onClick={async () => {
                      try {
                        // toggle mandal villages
                        if (mandalVillages[m.id]) {
                          setMandalVillages(prev => { const copy = { ...prev }; delete copy[m.id]; return copy; });
                          return;
                        }
                        const v = await getVillagesByMandal(m.id);
                        setMandalVillages(prev => ({ ...prev, [m.id]: v.data || [] }));
                      } catch (err) {
                        alert('Failed to load villages for mandal');
                      }
                    }}>{mandalVillages[m.id] ? 'Hide villages' : 'Villages'}</button></div>
                  </div>
                  {mandalVillages[m.id] && (
                    <ul style={{ marginTop: 6, paddingLeft: 16 }}>
                      {(mandalVillages[m.id] || []).map(v => (<li key={v.name}>{v.name}</li>))}
                      {(!mandalVillages[m.id] || mandalVillages[m.id].length === 0) && <li>No villages</li>}
                    </ul>
                  )}
                </li>
              ))}
            </ul>

            <h5 style={{ marginTop: 8 }}>Villages in district</h5>
            <ul className="detail-list">
              {(selectedDistrictDetails.villages || []).map(v => (
                <li key={v.name}>{v.name}</li>
              ))}
            </ul>

            <div style={{ marginTop: 12 }}>
              <button className="btn btn-secondary" onClick={() => { setDetailModalView('districts-list'); setSelectedDistrictDetails(null); setDetailModalTitle('Districts'); }}>Back</button>
            </div>
          </div>
        )}
      </Drawer>

      <div className="table-card">
        <div className="table-header">
          <div>Total records: <strong>{results?.totalRecords || 0}</strong></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s ease'
            }} onClick={() => setShowFilters(s => !s)} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <FiFilter /> Filter
            </button>
            <div className="controls">
              <button className="btn-export" onClick={() => onExport('csv')} disabled={!results || (results?.totalRecords || 0) === 0}>Export CSV</button>
              <button className="btn-excel" onClick={() => onExport('excel')} disabled={!results || (results?.totalRecords || 0) === 0}>Export Excel</button>
              <label className="import-label">Import
                <input type="file" accept=".xlsx,.xls" onChange={(e) => onImport(e.target.files[0])} disabled={!filters.districtId} />
              </label>
            </div>
          </div>
        </div>

        <div className="table-wrapper">
        <table className="responsive-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>District</th>
              <th>Mandal</th>
              <th>Village</th>
              <th>Scheme</th>
              <th>HOD</th>
              <th>Aadhaar</th>
              <th>Mobile</th>
              <th>Gender</th>
              <th>DOB</th>
              <th>Amount</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {(results?.data || []).length > 0 ? (
              (results.data || []).map(r => (
                <tr key={r.id} onClick={() => { setSelectedBeneficiary(r); setIsDetailModalOpen(false); }} style={{ cursor: 'pointer' }}>
                  <td>{r.id}</td>
                  <td>{r.beneficiary_name}</td>
                  <td>{r.district_name}</td>
                  <td>{r.mandal_name}</td>
                  <td>{r.village_name}</td>
                  <td>{r.scheme_name}</td>
                  <td>{r.hod_name || '-'}</td>
                  <td>{r.aadhaar || '-'}</td>
                  <td>{r.mobile || '-'}</td>
                  <td>{r.gender || '-'}</td>
                  <td>{r.dob ? new Date(r.dob).toLocaleDateString() : '-'}</td>
                  <td>{r.amount != null ? `₹${Number(r.amount).toLocaleString()}` : '-'}</td>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={13} style={{ textAlign: 'center', padding: 20, color: '#666' }}>No data. Use filters and click <strong>Search</strong> to load beneficiaries.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>

        <div className="pagination" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', borderTop: '1px solid #e0e0e0' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>
            {results?.totalRecords > 0 ? `${(results?.page || 0) * (results?.size || filters.size) + 1}-${Math.min(((results?.page || 0) + 1) * (results?.size || filters.size), results?.totalRecords || 0)} of ${(results?.totalRecords || 0).toLocaleString()}` : '0 of 0'}
          </span>
          <button 
            disabled={!results || filters.page === 0} 
            onClick={() => onPageChange((results?.page || 0) - 1)}
            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #d0d7de', background: 'white', cursor: (!results || filters.page === 0) ? 'not-allowed' : 'pointer', opacity: (!results || filters.page === 0) ? 0.5 : 1 }}
          >
            &lt;
          </button>
          <button 
            disabled={!results || ((results?.page || 0) + 1) * (results?.size || filters.size) >= (results?.totalRecords || 0)} 
            onClick={() => onPageChange((results?.page || 0) + 1)}
            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #d0d7de', background: 'white', cursor: (!results || ((results?.page || 0) + 1) * (results?.size || filters.size) >= (results?.totalRecords || 0)) ? 'not-allowed' : 'pointer', opacity: (!results || ((results?.page || 0) + 1) * (results?.size || filters.size) >= (results?.totalRecords || 0)) ? 0.5 : 1 }}
          >
            &gt;
          </button>
        </div>

        {importStatus && (
          <div className="import-status" style={{ padding: '12px 16px' }}>
            <h4>Import status</h4>
            <pre>{JSON.stringify(importStatus, null, 2)}</pre>
          </div>
        )}
      </div>

      {!results && (
        <div className="placeholder">
          <p>Use filters above to narrow results.</p>
        </div>
      )}
    </div>
  );
};

export default Beneficiaries;
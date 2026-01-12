import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Modal from '../components/Modal';
import { FiPlus, FiFilter, FiUpload, FiEdit2, FiTrash2 } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { createScheme, updateScheme, deleteScheme, getHODs, getCategories } from '../services/api';

const Schemes = () => {
  const location = useLocation();
  const [hods, setHods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // { type: 'central-sponsored-scheme'|'state-scheme'|'revenue', id }
  const [filterType, setFilterType] = useState('central-sponsored-scheme');
  const [formData, setFormData] = useState({
    name: '',
    central_scheme_name: '',
    scheme_description: '',
    scheme_objective: '',
    scheme_benefits_desc: '',
    scheme_benefits_person: '',
    hod: '',
    category_id: '',
    total_budget: '',
    status: 'PLANNED',
    scheme_category: '',
    start_date: '',
    end_date: '',
    allocation_goi_share: '',
    allocation_state_share: '',
    allocation_total: '',
    slsc_goi_share: '',
    slsc_state_share: '',
    slsc_total: '',
    sanction_goi_share: '',
    sanction_state_share: '',
    sanction_total: '',
    bro_released_amount: '',
    dt_authorized_amount: '',
    bills_preferred_count: '',
    bills_preferred_amount: '',
    oldest_bill_date: '',
    bills_cleared_count: '',
    bills_cleared_amount: '',
    latest_bill_date: '',
    pending_bills_count: '',
    pending_bills_amount: '',
    remark: ''
  });
  const [financialYear, setFinancialYear] = useState('2025-26');
  const [financialRows, setFinancialRows] = useState([]);
  const [importing, setImporting] = useState(false);
  // const [importStatus, setImportStatus] = useState(null);
  const fileInputRef = useRef(null);
  const [stateSchemeData, setStateSchemeData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);

  // Support deep-linking from dashboard: /schemes?filterType=state-scheme&year=2025-26
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const ft = sp.get('filterType');
    const yr = sp.get('year');

    if (ft && ['central-sponsored-scheme', 'state-scheme', 'revenue'].includes(ft)) {
      setFilterType(ft);
    }
    if (yr) {
      setFinancialYear(yr);
    }
  }, [location.search]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Refetch data when financial year changes
    if (financialYear) {
      const fetchFinancialData = async () => {
        try {
          console.log('useEffect: Financial year changed to', financialYear, 'fetching data...');
          const response = await fetch(`http://localhost:5000/api/schemes/financial-progress?year=${financialYear}&_t=${Date.now()}`);
          const data = await response.json();
          console.log('useEffect: Fetched', data.length, 'records for year', financialYear);
          setFinancialRows(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error('Error fetching financial progress:', err);
          setFinancialRows([]);
        }
      };
      fetchFinancialData();
    }
  }, [financialYear]);

  useEffect(() => {
    // Refetch state scheme data when financial year changes
    if (financialYear && filterType === 'state-scheme') {
      fetchStateSchemeData();
    }
  }, [financialYear, filterType]);

  useEffect(() => {
    // Refetch revenue data when financial year changes
    if (financialYear && filterType === 'revenue') {
      fetchRevenueData();
    }
  }, [financialYear, filterType]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setFinancialRows([]); // Clear before fetching to force fresh render
      
      const [hodsRes, categoriesRes, financialRes] = await Promise.all([
        getHODs(),
        getCategories(),
        fetch(`http://localhost:5000/api/schemes/financial-progress?year=${financialYear}&_t=${Date.now()}`) // Add cache-buster
          .then(res => res.json())
          .catch(err => {
            console.error('Error fetching financial progress:', err);
            return [];
          })
      ]);
      
      setHods(hodsRes.data || []);
      setCategories(categoriesRes.data || []);
      const financialData = financialRes && Array.isArray(financialRes) ? financialRes : [];
      console.log('Financial data fetched, updating state:', { count: financialData.length, firstItem: financialData[0] });
      setFinancialRows(financialData);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load reference data. Please make sure the server is running.');
      setFinancialRows([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStateSchemeData = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/schemes/state-schemes/all?year=${financialYear}&_t=${Date.now()}`);
      const data = await response.json();
      setStateSchemeData(Array.isArray(data) ? data : []);
      console.log('State scheme data fetched:', data);
    } catch (err) {
      console.error('Error fetching state scheme data:', err);
      setStateSchemeData([]);
    }
  };

  const fetchRevenueData = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/schemes/revenue/all?year=${financialYear}&_t=${Date.now()}`);
      const data = await response.json();
      setRevenueData(Array.isArray(data) ? data : []);
      console.log('Revenue data fetched:', data);
    } catch (err) {
      console.error('Error fetching revenue data:', err);
      setRevenueData([]);
    }
  };

  // ===============================
// FETCH CENTRAL SCHEMES (ADD HERE)
// ===============================
const fetchCentralSchemes = async (year = financialYear) => {
  try {
    const res = await fetch(
      `http://localhost:5000/api/schemes/financial-progress?year=${year}&_t=${Date.now()}`
    );
    const data = await res.json();

    console.log('Central schemes refreshed:', data.length);
    setFinancialRows(Array.isArray(data) ? [...data] : []);
  } catch (err) {
    console.error('Failed to refresh central schemes', err);
    setFinancialRows([]);
  }
};





  const formatNumber = (value) => {
    if (value === null || value === undefined) return '-';
    const num = Number(value);
    if (Number.isNaN(num)) return '-';
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString();
  };

  const handleOpenModal = () => {
    setEditingItem(null);
    setFormData({ 
      name: '',
      central_scheme_name: '',
      scheme_description: '', 
      scheme_objective: '',
      scheme_benefits_desc: '',
      scheme_benefits_person: '',
      hod: '', 
      total_budget: '', 
      status: 'PLANNED', 
      scheme_category: '',
      start_date: '',
      end_date: '',
      allocation_goi_share: '',
      allocation_state_share: '',
      allocation_total: '',
      slsc_goi_share: '',
      slsc_state_share: '',
      slsc_total: '',
      sanction_goi_share: '',
      sanction_state_share: '',
      sanction_total: '',
      bro_released_amount: '',
      dt_authorized_amount: '',
      bills_preferred_count: '',
      bills_preferred_amount: '',
      oldest_bill_date: '',
      bills_cleared_count: '',
      bills_cleared_amount: '',
      latest_bill_date: '',
      pending_bills_count: '',
      pending_bills_amount: '',
      remark: ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    // Reset form data
    setFormData({
      name: '',
      central_scheme_name: '',
      scheme_description: '',
      scheme_objective: '',
      scheme_benefits_desc: '',
      scheme_benefits_person: '',
      hod: '',
      category_id: '',
      total_budget: '',
      status: 'PLANNED',
      scheme_category: '',
      start_date: '',
      end_date: '',
      allocation_goi_share: '',
      allocation_state_share: '',
      allocation_total: '',
      slsc_goi_share: '',
      slsc_state_share: '',
      slsc_total: '',
      sanction_goi_share: '',
      sanction_state_share: '',
      sanction_total: '',
      bro_released_amount: '',
      dt_authorized_amount: '',
      bills_preferred_count: '',
      bills_preferred_amount: '',
      oldest_bill_date: '',
      bills_cleared_count: '',
      bills_cleared_amount: '',
      latest_bill_date: '',
      pending_bills_count: '',
      pending_bills_amount: '',
      remark: ''
    });
  };

  const handleEditScheme = (scheme) => {
    setFilterType('central-sponsored-scheme');
    setEditingItem({ type: 'central-sponsored-scheme', id: scheme?.id });
    setFormData({
      name: scheme.scheme_name || '',
      central_scheme_name: scheme.central_scheme_name || '',
      scheme_description: scheme.scheme_description || '',
      scheme_objective: scheme.scheme_objective || '',
      scheme_benefits_desc: scheme.scheme_benefits_desc || '',
      scheme_benefits_person: scheme.scheme_benefits_person || '',
      hod: scheme.hod || '',
      category_id: scheme.category_id || '',
      total_budget: scheme.total_budget || '',
      status: scheme.status || 'PLANNED',
      scheme_category: scheme.scheme_category || '',
      start_date: scheme.start_date || '',
      end_date: scheme.end_date || '',
      allocation_goi_share: scheme.allocation_goi_share || '',
      allocation_state_share: scheme.allocation_state_share || '',
      allocation_total: scheme.allocation_total || '',
      slsc_goi_share: scheme.slsc_goi_share || '',
      slsc_state_share: scheme.slsc_state_share || '',
      slsc_total: scheme.slsc_total || '',
      sanction_goi_share: scheme.sanction_goi_share || '',
      sanction_state_share: scheme.sanction_state_share || '',
      sanction_total: scheme.sanction_total || '',
      bro_released_amount: scheme.bro_released_amount || '',
      dt_authorized_amount: scheme.dt_authorized_amount || '',
      bills_preferred_count: scheme.bills_preferred_count || '',
      bills_preferred_amount: scheme.bills_preferred_amount || '',
      oldest_bill_date: scheme.oldest_bill_date || '',
      bills_cleared_count: scheme.bills_cleared_count || '',
      bills_cleared_amount: scheme.bills_cleared_amount || '',
      latest_bill_date: scheme.latest_bill_date || '',
      pending_bills_count: scheme.pending_bills_count || '',
      pending_bills_amount: scheme.pending_bills_amount || '',
      remark: scheme.remark || ''
    });
    setIsModalOpen(true);
  };

  const handleEditStateScheme = (row) => {
    setFilterType('state-scheme');
    setEditingItem({ type: 'state-scheme', id: row?.id });
    setFormData({
      name: row?.name || '',
      central_scheme_name: '',
      scheme_description: '',
      scheme_objective: '',
      scheme_benefits_desc: '',
      scheme_benefits_person: '',
      hod: row?.hod || '',
      category_id: '',
      total_budget: '',
      status: 'PLANNED',
      scheme_category: '',
      start_date: '',
      end_date: '',
      allocation_goi_share: '',
      allocation_state_share: '',
      allocation_total: row?.budgetEstimates ?? '',
      slsc_goi_share: '',
      slsc_state_share: '',
      slsc_total: '',
      sanction_goi_share: '',
      sanction_state_share: '',
      sanction_total: '',
      bro_released_amount: row?.broReleased ?? '',
      dt_authorized_amount: '',
      bills_preferred_count: row?.billsPreferredNo ?? '',
      bills_preferred_amount: row?.billsPreferredAmount ?? '',
      oldest_bill_date: row?.billsPreferredOldestDate ?? '',
      bills_cleared_count: row?.billsClearedNo ?? '',
      bills_cleared_amount: row?.billsClearedAmount ?? '',
      latest_bill_date: row?.billsClearedLatestDate ?? '',
      pending_bills_count: row?.pendingNo ?? '',
      pending_bills_amount: row?.pendingAmount ?? '',
      remark: ''
    });
    setIsModalOpen(true);
  };

  const handleEditRevenueEntry = (row) => {
    setFilterType('revenue');
    setEditingItem({ type: 'revenue', id: row?.id });
    setFormData({
      name: row?.cooperativeName || '',
      central_scheme_name: '',
      scheme_description: '',
      scheme_objective: '',
      scheme_benefits_desc: '',
      scheme_benefits_person: '',
      hod: '',
      category_id: '',
      total_budget: '',
      status: 'PLANNED',
      scheme_category: '',
      start_date: '',
      end_date: '',
      allocation_goi_share: row?.loans ?? '',
      allocation_state_share: row?.revenue ?? '',
      allocation_total: '',
      slsc_goi_share: '',
      slsc_state_share: '',
      slsc_total: '',
      sanction_goi_share: '',
      sanction_state_share: '',
      sanction_total: '',
      bro_released_amount: '',
      dt_authorized_amount: '',
      bills_preferred_count: '',
      bills_preferred_amount: '',
      oldest_bill_date: '',
      bills_cleared_count: '',
      bills_cleared_amount: '',
      latest_bill_date: '',
      pending_bills_count: '',
      pending_bills_amount: '',
      remark: ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteCentralScheme = async (row) => {
    if (!row?.id) return;
    const ok = window.confirm('Are you sure you want to delete this scheme?');
    if (!ok) return;
    try {
      await deleteScheme(row.id);
      await fetchCentralSchemes();
    } catch (err) {
      console.error('Error deleting scheme:', err);
      alert('Failed to delete scheme. Please try again.');
    }
  };

  const handleDeleteStateScheme = async (row) => {
    if (!row?.id) return;
    const ok = window.confirm('Are you sure you want to delete this state scheme?');
    if (!ok) return;
    try {
      const response = await fetch(`http://localhost:5000/api/schemes/state-schemes/${row.id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete state scheme');
      }
      await fetchStateSchemeData();
    } catch (err) {
      console.error('Error deleting state scheme:', err);
      alert('Failed to delete state scheme. Please try again.');
    }
  };

  const handleDeleteRevenueEntry = async (row) => {
    if (!row?.id) return;
    const ok = window.confirm('Are you sure you want to delete this revenue entry?');
    if (!ok) return;
    try {
      const response = await fetch(`http://localhost:5000/api/schemes/revenue/${row.id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete revenue entry');
      }
      await fetchRevenueData();
    } catch (err) {
      console.error('Error deleting revenue entry:', err);
      alert('Failed to delete revenue entry. Please try again.');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // CENTRAL SPONSORED SCHEME SUBMISSION
      if (filterType === 'central-sponsored-scheme') {
        const centralName = (formData.central_scheme_name || '').trim() || formData.name;
        
        const submitData = {
          ...formData,
          total_budget: Number(formData.total_budget),
          scheme_benefits_person: Number(formData.scheme_benefits_person),
          hod: formData.hod,
          central_scheme_name: centralName,
          financial_year: financialYear,
          status: 'active',
          allocation_goi_share: formData.allocation_goi_share ? Number(formData.allocation_goi_share) : null,
          allocation_state_share: formData.allocation_state_share ? Number(formData.allocation_state_share) : null,
          allocation_total: formData.allocation_total ? Number(formData.allocation_total) : null,
          slsc_goi_share: formData.slsc_goi_share ? Number(formData.slsc_goi_share) : null,
          slsc_state_share: formData.slsc_state_share ? Number(formData.slsc_state_share) : null,
          slsc_total: formData.slsc_total ? Number(formData.slsc_total) : null,
          sanction_goi_share: formData.sanction_goi_share ? Number(formData.sanction_goi_share) : null,
          sanction_state_share: formData.sanction_state_share ? Number(formData.sanction_state_share) : null,
          sanction_total: formData.sanction_total ? Number(formData.sanction_total) : null,
          bro_released_amount: formData.bro_released_amount ? Number(formData.bro_released_amount) : null,
          dt_authorized_amount: formData.dt_authorized_amount ? Number(formData.dt_authorized_amount) : null,
          bills_preferred_count: formData.bills_preferred_count ? Number(formData.bills_preferred_count) : null,
          bills_preferred_amount: formData.bills_preferred_amount ? Number(formData.bills_preferred_amount) : null,
          oldest_bill_date: formData.oldest_bill_date || null,
          bills_cleared_count: formData.bills_cleared_count ? Number(formData.bills_cleared_count) : null,
          bills_cleared_amount: formData.bills_cleared_amount ? Number(formData.bills_cleared_amount) : null,
          latest_bill_date: formData.latest_bill_date || null,
          remark: formData.remark || null
        };

        if (editingItem?.type === 'central-sponsored-scheme' && editingItem?.id) {
          await updateScheme(editingItem.id, submitData);
        } else {
          await createScheme(submitData);
          setFinancialRows(prev => [
            {
              id: Date.now(),
              scheme_name: formData.name,
              central_scheme_name: centralName,
              hod: formData.hod,
              allocation_goi_share: submitData.allocation_goi_share,
              allocation_state_share: submitData.allocation_state_share,
              allocation_total: submitData.allocation_total,
              slsc_goi_share: submitData.slsc_goi_share,
              slsc_state_share: submitData.slsc_state_share,
              slsc_total: submitData.slsc_total,
              sanction_goi_share: submitData.sanction_goi_share,
              sanction_state_share: submitData.sanction_state_share,
              sanction_total: submitData.sanction_total,
              bro_released_amount: submitData.bro_released_amount,
              dt_authorized_amount: submitData.dt_authorized_amount,
              bills_preferred_count: submitData.bills_preferred_count,
              bills_preferred_amount: submitData.bills_preferred_amount,
              oldest_bill_date: submitData.oldest_bill_date,
              bills_cleared_count: submitData.bills_cleared_count,
              bills_cleared_amount: submitData.bills_cleared_amount,
              latest_bill_date: submitData.latest_bill_date,
              remark: submitData.remark
            },
            ...prev
          ]);
        }

        await fetchCentralSchemes();

      }
      
      // STATE SCHEME SUBMISSION
      else if (filterType === 'state-scheme') {
        const submitData = {
          name: formData.name,
          hod: formData.hod,
          budgetEstimates: formData.allocation_total ? Number(formData.allocation_total) : null,
          broReleased: formData.bro_released_amount ? Number(formData.bro_released_amount) : null,
          billsPreferredNo: formData.bills_preferred_count ? Number(formData.bills_preferred_count) : null,
          billsPreferredAmount: formData.bills_preferred_amount ? Number(formData.bills_preferred_amount) : null,
          billsPreferredOldestDate: formData.oldest_bill_date || null,
          billsClearedNo: formData.bills_cleared_count ? Number(formData.bills_cleared_count) : null,
          billsClearedAmount: formData.bills_cleared_amount ? Number(formData.bills_cleared_amount) : null,
          billsClearedLatestDate: formData.latest_bill_date || null,
          pendingNo: formData.pending_bills_count ? Number(formData.pending_bills_count) : null,
          pendingAmount: formData.pending_bills_amount ? Number(formData.pending_bills_amount) : null,
          financial_year: financialYear,
          status: 'active'
        };

        const isEditing = editingItem?.type === 'state-scheme' && editingItem?.id;
        const url = isEditing
          ? `http://localhost:5000/api/schemes/state-schemes/${editingItem.id}`
          : 'http://localhost:5000/api/schemes/state-schemes';

        const response = await fetch(url, {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create state scheme');
        }
        
        const responseData = await response.json();
        console.log(isEditing ? 'State scheme updated:' : 'State scheme created:', responseData);
        
        // Refresh state scheme data from database
        await fetchStateSchemeData();
      }
      
      // REVENUE SUBMISSION
      else if (filterType === 'revenue') {
        const submitData = {
          cooperativeName: formData.name,
          loans: formData.allocation_goi_share ? Number(formData.allocation_goi_share) : null,
          revenue: formData.allocation_state_share ? Number(formData.allocation_state_share) : null,
          financial_year: financialYear,
          status: 'active'
        };

        const isEditing = editingItem?.type === 'revenue' && editingItem?.id;
        const url = isEditing
          ? `http://localhost:5000/api/schemes/revenue/${editingItem.id}`
          : 'http://localhost:5000/api/schemes/revenue';

        const response = await fetch(url, {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create revenue entry');
        }
        
        const responseData = await response.json();
        console.log(isEditing ? 'Revenue entry updated:' : 'Revenue entry created:', responseData);
        
        // Refresh revenue data from database
        await fetchRevenueData();
      }
      
      handleCloseModal();
      alert('Data saved successfully!');
    } catch (err) {
      console.error('Error saving data:', err);
      alert('Failed to save data. Please try again.');
    }
  };

  const normalizeRowKeys = (row) => {
    const normalized = {};
    Object.entries(row || {}).forEach(([key, value]) => {
      if (!key) return;
      const normalizedKey = key
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      if (normalizedKey) {
        normalized[normalizedKey] = value;
      }
    });
    return normalized;
  };

  // const parseNumberOrNull = (value) => {
  //   const num = Number(value);
  //   return Number.isFinite(num) ? num : null;
  // };
  const parseNumberOrNull = (value) => {
    if (value === null || value === undefined || value === '') return null;

    // Convert strings like "1,234.50", "₹ 12.5", "12 Cr"
    if (typeof value === 'string') {
      value = value
        .replace(/,/g, '')
        .replace(/₹/g, '')
        .replace(/cr|crore|rs|\s/gi, '');
    }

    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };



  // const parseExcelDate = (dateValue) => {
  //   if (!dateValue) return null;
  // const parseExcelDate = (dateValue) => {
  //   if (!dateValue && dateValue !== 0) return null;
    
  //   // If it's already a valid date string, return as-is
  //   if (typeof dateValue === 'string') {
  //     // Check if it matches YYYY-MM-DD or other date formats
  //     if (/^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
  //       return dateValue.substring(0, 10);
  //     }
  //     // Try to parse it as a date
  //     const date = new Date(dateValue);
  //     if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
  //       const year = date.getFullYear();
  //       const month = String(date.getMonth() + 1).padStart(2, '0');
  //       const day = String(date.getDate()).padStart(2, '0');
  //       return `${year}-${month}-${day}`;
  //     }
  //     return null;
  //   }
    
  //   // If it's a number (Excel date serial), convert it
  //   if (typeof dateValue === 'number' && dateValue > 0) {
  //     // Excel uses serial date starting from Jan 1, 1900
  //     const baseDate = new Date(1900, 0, 1);
  //     const date = new Date(baseDate.getTime() + (dateValue - 1) * 86400000);
      
  //     if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
  //       const year = date.getFullYear();
  //       const month = String(date.getMonth() + 1).padStart(2, '0');
  //       const day = String(date.getDate()).padStart(2, '0');
  //       return `${year}-${month}-${day}`;
  //     }
  //   }
    
  //   return null;
  // };
  // };

  // const parseExcelDate = (dateValue) => {
  //   if (!dateValue && dateValue !== 0) return null;

  //   if (typeof dateValue === 'string') {
  //     const d = new Date(dateValue);
  //     if (!isNaN(d.getTime())) {
  //       return d.toISOString().slice(0, 10);
  //     }
  //     return null;
  //   }

  //   if (typeof dateValue === 'number') {
  //     const baseDate = new Date(1900, 0, 1);
  //     const d = new Date(baseDate.getTime() + (dateValue - 2) * 86400000);
  //     return !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : null;
  //   }

  //   return null;
  // };

const parseExcelDate = (value) => {
  if (!value && value !== 0) return null;

  // Excel serial number
  if (typeof value === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + value * 86400000);

    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();

    // ✅ Store EXACT Excel date
    return `${year}-${month}-${day}`;
  }

  // String date (already typed)
  if (typeof value === 'string') {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${year}-${month}-${day}`;
    }
  }

  return null;
};


  const findColumnValue = (normalizedRow, patterns, isTotalColumn = false, sectionName = '', columnType = '', fieldName = '') => {
    // Try exact match first
    for (const pattern of patterns) {
      if (normalizedRow[pattern] !== undefined && normalizedRow[pattern] !== '' && normalizedRow[pattern] !== '-') {
        return normalizedRow[pattern];
      }
    }
    
    // If columnType is specified, do a targeted search first
    if (columnType === 'amount') {
      // Look for columns that explicitly contain 'amount' or 'cr'
      const allKeys = Object.keys(normalizedRow);
      for (const key of allKeys) {
        if ((key.includes('amount') || key.includes('_cr') || key.includes('cr_')) &&
            normalizedRow[key] !== undefined && normalizedRow[key] !== '' && normalizedRow[key] !== '-') {
          // Make sure it's not the count column
          if (!key.includes('count') && !key.includes('_no') && !key.includes('bills_count')) {
            console.log(`Found amount column for ${fieldName}: key="${key}", value="${normalizedRow[key]}"`);
            return normalizedRow[key];
          }
        }
      }
    } else if (columnType === 'count') {
      // Look for columns that explicitly contain 'count' or 'no' or 'number'
      const allKeys = Object.keys(normalizedRow);
      for (const key of allKeys) {
        if ((key.includes('count') || key.includes('_no_') || key.includes('_no') || key.includes('number')) &&
            normalizedRow[key] !== undefined && normalizedRow[key] !== '' && normalizedRow[key] !== '-') {
          // Make sure it's not the amount column
          if (!key.includes('amount') && !key.includes('_cr')) {
            console.log(`Found count column for ${fieldName}: key="${key}", value="${normalizedRow[key]}"`);
            return normalizedRow[key];
          }
        }
      }
    }
    
    // Try partial match with better scoring
    const allKeys = Object.keys(normalizedRow);
    let bestMatch = null;
    let bestScore = 0;
    let matchedKey = null;
    
    for (const pattern of patterns) {
      const patternWords = pattern.split('_').filter(w => w.length > 2); // Only significant words
      
      for (const key of allKeys) {
        if (normalizedRow[key] === undefined || normalizedRow[key] === '' || normalizedRow[key] === '-') {
          continue;
        }
        
        const keyWords = key.split('_').filter(w => w.length > 2);
        
        // For TOTAL columns, use section name to match the right column
        if (isTotalColumn && sectionName) {
          // Must contain both the section name and 'total'
          if (!key.includes(sectionName) || !key.includes('total')) {
            continue;
          }
        } else if (isTotalColumn) {
          // If no section name provided, at least require 'total' in key
          if (!key.includes('total')) {
            // Check if any pattern word is in the key
            const hasPatternWord = patternWords.some(pw => key.includes(pw));
            if (!hasPatternWord) {
              continue;
            }
          }
        }
        
        // If columnType is specified, apply type-based filtering
        if (columnType === 'amount') {
          // Skip if it's clearly a count column
          if (key.includes('count') || key.includes('_no_') || key.includes('_no') || key.includes('number')) {
            continue;
          }
        } else if (columnType === 'count') {
          // Skip if it's clearly an amount column
          if (key.includes('amount') || key.includes('_cr') || key.includes('cr_')) {
            continue;
          }
        }
        
        // Count matching words
        const matchingWords = patternWords.filter(pw => 
          keyWords.some(kw => kw.includes(pw) || pw.includes(kw))
        ).length;
        
        // Score based on matching words
        const score = matchingWords / Math.max(patternWords.length, 1);
        
        if (score > bestScore && score > 0.4) {
          bestScore = score;
          bestMatch = normalizedRow[key];
          matchedKey = key;
        }
      }
    }
    
    // If total column and still no match, try to find using section name
    if (isTotalColumn && !bestMatch && sectionName) {
      const totalKey = allKeys.find(k => 
        k.includes(sectionName) && k.includes('total') && 
        normalizedRow[k] && normalizedRow[k] !== '-'
      );
      if (totalKey) {
        bestMatch = normalizedRow[totalKey];
        matchedKey = totalKey;
      }
    }
    
    // Last resort: find any column with 'total'
    if (isTotalColumn && !bestMatch) {
      const totalKey = allKeys.find(k => k.includes('total') && normalizedRow[k] && normalizedRow[k] !== '-');
      if (totalKey) {
        bestMatch = normalizedRow[totalKey];
        matchedKey = totalKey;
      }
    }
    
    return bestMatch;
  };

  const handleExcelImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    try {
      // Handle different import types based on filterType
      if (filterType === 'state-scheme') {
        await handleStateSchemeImport(file);
      } else if (filterType === 'revenue') {
        await handleRevenueImport(file);
      } else {
        // Default to central scheme import
        await handleCentralSchemeImport(file);
      }
    } catch (err) {
      console.error('Import error:', err);
      alert(`Import failed: ${err.message}`);
    } finally {
      setImporting(false);
      fileInputRef.current.value = ''; // Reset file input
    }
  };

  const handleCentralSchemeImport = async (file) => {
    try {
      // CRITICAL: Fetch existing schemes BEFORE import to check for updates
      console.log('Fetching existing schemes for update check...');
      const existingResponse = await fetch(`http://localhost:5000/api/schemes/financial-progress?year=${financialYear}`);
      const existingSchemes = await existingResponse.json();
      console.log('Existing schemes loaded:', { count: existingSchemes.length, schemes: existingSchemes.map(s => ({ id: s.id, name: s.scheme_name, year: s.financial_year })) });
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          console.log('Excel sheet loaded', { sheetName, totalRows: jsonData.length, firstRawRow: jsonData[0] });

          let successCount = 0;
          let errorCount = 0;
          let skippedHeaderRows = 0;

          for (const [index, row] of jsonData.entries()) {
            const normalizedRow = normalizeRowKeys(row);
            
            // Log all normalized keys for first row to debug column mapping
            if (index === 0) {
              console.log('Excel normalized columns:', Object.keys(normalizedRow));
              console.log('First row data:', normalizedRow);
              console.log('Total columns in Excel:', Object.keys(normalizedRow).filter(k => k.includes('total')));
            }
            
            try {
              const schemeName = findColumnValue(normalizedRow, ['scheme_name', 'scheme']) || '';
              const centralSchemeName = (findColumnValue(normalizedRow, ['central_scheme_name', 'central_scheme', 'central_name']) || '').toString().trim() || schemeName;
              
              const schemeData = {
                scheme_name: schemeName,
                central_scheme_name: centralSchemeName,
                hod: findColumnValue(normalizedRow, ['hod', 'hod_name']) || '',
                financial_year: financialYear,
                status: 'active',
                allocation_goi_share: parseNumberOrNull(
                  findColumnValue(normalizedRow, ['allocation_goi', 'allocation_goi_share', 'goi_share_allocation', 'goi_share', 'allocation_of_goi'])
                ),
                allocation_state_share: parseNumberOrNull(
                  findColumnValue(normalizedRow, ['allocation_state_share', 'state_share_allocation', 'state_share', 'allocation_state', 'allocation_of_goi_state'])
                ),
                // allocation_total: parseNumberOrNull(
                //   findColumnValue(normalizedRow, ['allocation_total', 'allocation_of_goi_total', 'total_allocation', 'allocation_cr_total', 'allocation_cr'], true, 'allocation')
                // ),
                allocation_total: parseNumberOrNull(
                  findColumnValue(
                    normalizedRow,
                    [
                      'allocation_total',
                      'total_allocation',
                      'allocation_total_cr',
                      'allocation_amount',
                      'total_of_allocation',
                      'allocation_cr'
                    ],
                    true,
                    'allocation'
                  )
                ),

                slsc_goi_share: parseNumberOrNull(
                  findColumnValue(normalizedRow, ['slsc_goi', 'slsc_goi_share', 'slc_goi_share', 'goi_share', 'slsc_approved_aap_goi', 'approved_aap_goi'])
                ),
                slsc_state_share: parseNumberOrNull(
                  findColumnValue(normalizedRow, ['slsc_state_share', 'slsc_state', 'slc_state_share', 'state_share', 'slsc_approved_aap_state', 'approved_aap_state'])
                ),
                slsc_total: parseNumberOrNull(
                  findColumnValue(normalizedRow, ['slsc_total', 'slsc_approved_aap_total', 'approved_aap_total', 'slc_total', 'aap_total'], true, 'slsc')
                ),
                sanction_goi_share: parseNumberOrNull(
                  findColumnValue(normalizedRow, ['sanction_goi_share', 'mother_sanction_goi', 'goi_share_sanction', 'goi_share', 'mother_sanction_goi_share', 'sanction_goi'])
                ),
                sanction_state_share: parseNumberOrNull(
                  findColumnValue(normalizedRow, ['sanction_state_share', 'mother_sanction_state', 'state_share_sanction', 'state_share', 'mother_sanction_state_share', 'sanction_state'])
                ),
                sanction_total: parseNumberOrNull(
                  findColumnValue(normalizedRow, ['sanction_total', 'mother_sanction_total', 'sanction_cr_total', 'sanction_cr'], true, 'sanction')
                ),
                bro_released_amount: parseNumberOrNull(
                  findColumnValue(normalizedRow, ['bro_released', 'bro_released_amount', 'bro'])
                ),
                dt_authorized_amount: parseNumberOrNull(
                  findColumnValue(normalizedRow, ['dt_authorized', 'dt_authorized_amount', 'dt_authorization', 'dt_authorised_amount', 'dt'])
                ),
                bills_preferred_count: parseNumberOrNull(
                  findColumnValue(normalizedRow, ['bills_preferred_count', 'no_of_bills_preferred', 'bills_preferred', 'no_bills', 'bills_preferred_count'])
                ),
                bills_preferred_amount: parseNumberOrNull(
                  findColumnValue(normalizedRow, ['bills_preferred_amount', 'bills_preferred_amount_cr', 'amount_bills_preferred', 'bills_preferred_amount'])
                ),
                oldest_bill_date: parseExcelDate(findColumnValue(normalizedRow, ['oldest_bill_date', 'oldest_date_bill', 'oldest_bill', 'bill_date', 'oldest_bill_date'])) || null,
                bills_cleared_count: parseNumberOrNull(
                  findColumnValue(normalizedRow, ['bills_cleared_count', 'no_of_bills_cleared', 'bills_cleared', 'bills_cleared_no'])
                ),
                bills_cleared_amount: parseNumberOrNull(
                  findColumnValue(normalizedRow, ['bills_cleared_amount', 'cleared_amount', 'bills_cleared_amount_cr', 'amount_cr'])
                ),
                latest_bill_date: parseExcelDate(findColumnValue(normalizedRow, ['latest_bill_date', 'latest_date_of_clearance', 'latest_date_clearance', 'latest_date', 'latest_bill_date'])) || null,
                remark: findColumnValue(normalizedRow, ['remark', 'remarks', 'notes']) || null
              };

              // ✅ AUTO-CALCULATE TOTALS IF MISSING
if (
  schemeData.allocation_total === null &&
  schemeData.allocation_goi_share !== null &&
  schemeData.allocation_state_share !== null
) {
  schemeData.allocation_total =
    schemeData.allocation_goi_share + schemeData.allocation_state_share;
}

if (
  schemeData.slsc_total === null &&
  schemeData.slsc_goi_share !== null &&
  schemeData.slsc_state_share !== null
) {
  schemeData.slsc_total =
    schemeData.slsc_goi_share + schemeData.slsc_state_share;
}

if (
  schemeData.sanction_total === null &&
  schemeData.sanction_goi_share !== null &&
  schemeData.sanction_state_share !== null
) {
  schemeData.sanction_total =
    schemeData.sanction_goi_share + schemeData.sanction_state_share;
}


              console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
              console.log(schemeData)

              // ✅ DEBUG: detect missing allocation_total
              if (schemeData.allocation_total === null) {
                console.warn('⚠️ Allocation total missing', {
                  scheme: schemeData.scheme_name,
                  rowKeys: Object.keys(normalizedRow),
                  rawValue: findColumnValue(
                    normalizedRow,
                    ['allocation_total', 'total_allocation', 'allocation', 'total'],
                    true,
                    'allocation'
                  )
                });
              }

              // Detect if this is a header row by checking if scheme name or central scheme looks like a header
              const schemeNameLower = (schemeName || '').toString().toLowerCase();
              const centralNameLower = (centralSchemeName || '').toString().toLowerCase();
              
              const isHeaderRow = 
                (schemeNameLower.includes('scheme') || schemeNameLower.includes('central') || schemeNameLower.includes('allocation')) &&
                (centralNameLower.includes('scheme') || centralNameLower.includes('central') || centralNameLower.includes('name'));

              if (isHeaderRow) {
                skippedHeaderRows++;
                console.log('Skipped header row', { index: index + 1, reason: 'detected as header', schemeName, centralSchemeName });
                continue;
              }
              
              console.log("//////////////////////////////////////")
              console.log('Import row processed', {
                index: index + 1,
                scheme: schemeData.scheme_name,
                hod: schemeData.hod,
                centralScheme: schemeData.central_scheme_name,
                allocation_goi: schemeData.allocation_goi_share,
                allocation_state: schemeData.allocation_state_share,
                allocation_total: schemeData.allocation_total,
                slsc_goi: schemeData.slsc_goi_share,
                slsc_state: schemeData.slsc_state_share,
                slsc_total: schemeData.slsc_total,
                sanction_goi: schemeData.sanction_goi_share,
                sanction_state: schemeData.sanction_state_share,
                sanction_total: schemeData.sanction_total,
                bro_released: schemeData.bro_released_amount,
                dt_authorized: schemeData.dt_authorized_amount,
                bills_pref_count: schemeData.bills_preferred_count,
                bills_pref_amount: schemeData.bills_preferred_amount,
                oldest_bill_date: schemeData.oldest_bill_date,
                bills_cleared_count: schemeData.bills_cleared_count,
                bills_cleared_amount: schemeData.bills_cleared_amount,
                latest_bill_date: schemeData.latest_bill_date
              });

              if (schemeData.scheme_name && schemeData.hod) {
                try {
                  console.log('Sending to API:', {
                    scheme: schemeData.scheme_name,
                    allocation_total: schemeData.allocation_total,
                    slsc_total: schemeData.slsc_total,
                    sanction_total: schemeData.sanction_total,
                    oldest_bill_date: schemeData.oldest_bill_date,
                    latest_bill_date: schemeData.latest_bill_date,
                    fullData: schemeData
                  });
                  
                  // Check if scheme already exists using multiple matching strategies
                  let existingScheme = null;
                  
                  // Strategy 1: Exact match on scheme_name + financial_year
                  existingScheme = existingSchemes.find(
                    row => row.scheme_name === schemeData.scheme_name && row.financial_year === schemeData.financial_year
                  );
                  
                  // Strategy 2: If no exact match, try fuzzy matching (remove extra spaces, normalize case)
                  if (!existingScheme) {
                    const normalizedNewName = schemeData.scheme_name?.trim().replace(/\s+/g, ' ').toLowerCase();
                    existingScheme = existingSchemes.find(row => {
                      const normalizedExistingName = row.scheme_name?.trim().replace(/\s+/g, ' ').toLowerCase();
                      return normalizedExistingName === normalizedNewName && row.financial_year === schemeData.financial_year;
                    });
                    if (existingScheme) {
                      console.log('✓ Found via fuzzy match:', { newName: schemeData.scheme_name, existingId: existingScheme.id });
                    }
                  }
                  
                  // Strategy 3: If still no match, try partial matching (first 80% of name)
                  if (!existingScheme && schemeData.scheme_name?.length > 20) {
                    const truncatedName = schemeData.scheme_name.substring(0, Math.floor(schemeData.scheme_name.length * 0.8)).toLowerCase();
                    existingScheme = existingSchemes.find(row => {
                      const existingTruncated = row.scheme_name?.substring(0, Math.floor(row.scheme_name?.length * 0.8)).toLowerCase();
                      return existingTruncated === truncatedName && row.financial_year === schemeData.financial_year;
                    });
                    if (existingScheme) {
                      console.log('✓ Found via partial match:', { newName: schemeData.scheme_name, existingId: existingScheme.id });
                    }
                  }
                  
                  if (existingScheme && existingScheme.id) {
                    // Update existing scheme
                    console.log('📝 Updating existing scheme', { id: existingScheme.id, scheme: schemeData.scheme_name });
                    await updateScheme(existingScheme.id, schemeData);
                    successCount++;
                    console.log('✅ Row updated successfully', { index: index + 1, scheme: schemeData.scheme_name, id: existingScheme.id });
                  } else {
                    // Create new scheme
                    console.log('➕ Creating new scheme', { scheme: schemeData.scheme_name });
                    await createScheme(schemeData);
                    successCount++;
                    console.log('✅ Row imported successfully', { index: index + 1, scheme: schemeData.scheme_name });
                  }
                } catch (apiErr) {
                  errorCount++;
                  console.error('API insert failed for row', {
                    index: index + 1,
                    scheme: schemeData.scheme_name,
                    hod: schemeData.hod,
                    response: apiErr?.response?.data,
                    message: apiErr?.message
                  });
                }
              } else {
                console.warn('Skipping row - missing required fields', {
                  index: index + 1,
                  scheme: schemeData.scheme_name || 'MISSING',
                  hod: schemeData.hod || 'MISSING',
                  has_scheme: !!schemeData.scheme_name,
                  has_hod: !!schemeData.hod
                });
                errorCount++;
              }
            } catch (err) {
              errorCount++;
              console.error('Error importing row', {
                index: index + 1,
                error: err?.message,
                stack: err?.stack,
                normalizedRow,
                rawRow: row
              });
            }
          }

          console.log(`\n✅ IMPORT SUMMARY:\n  Successful: ${successCount}\n  Failed: ${errorCount}\n  Skipped headers: ${skippedHeaderRows}\n  Total processed: ${jsonData.length}\n`);
          alert(`✅ Import completed!\n\nSuccessful: ${successCount}\nFailed: ${errorCount}\nSkipped headers: ${skippedHeaderRows}\n\nNote: Check console (F12) to see which schemes were UPDATED vs CREATED`);
          await fetchCentralSchemes();
          // Clear existing data and refresh from database
          console.log('Clearing cached data and refreshing from database...');
          // setImportStatus(`Importing... (${successCount} successful, fetching updated data)`); // NEW
          // setFinancialRows([]); // Clear old data first
          
          // // Wait for database operations to complete with retry logic
          // setTimeout(async () => {
          //   console.log('===== POST-IMPORT DATA REFRESH STARTED =====');
          //   console.log('Current financialYear:', financialYear);
          //   console.log('Current financialRows count:', financialRows.length);
          //   console.log('Fetching fresh data from database (Attempt 1)...');
          //   try {
          //     const fetchUrl = `http://localhost:5000/api/schemes/financial-progress?year=${financialYear}&_t=${Date.now()}`;
          //     console.log('Fetch URL:', fetchUrl);
          //     const response = await fetch(fetchUrl);
          //     console.log('Response status:', response.status);
          //     const freshData = await response.json();
          //     console.log('Fresh data received from database:', { 
          //       count: freshData.length, 
          //       firstItem: freshData[0], 
          //       allocationTotal: freshData[0]?.allocation_total,
          //       isArray: Array.isArray(freshData),
          //       dataLength: freshData?.length
          //     });
          //     if (Array.isArray(freshData) && freshData.length > 0) {
          //       console.log('✅ Setting financialRows with', freshData.length, 'records');
          //       setFinancialRows(freshData);
          //       setImportStatus(null); // Clear status message
          //       console.log('State update called, expecting table to update');
          //     } else {
          //       // Retry after additional wait
          //       console.warn('❌ No data received on Attempt 1, retrying after 1 second...');
          //       setTimeout(async () => {
          //         const retryUrl = `http://localhost:5000/api/schemes/financial-progress?year=${financialYear}&_t=${Date.now()}`;
          //         const retryResponse = await fetch(retryUrl);
          //         const retryData = await retryResponse.json();
          //         console.log('Fresh data received on retry:', { count: retryData.length, firstItem: retryData[0] });
          //         console.log('✅ Setting financialRows on retry with', retryData.length, 'records');
          //         setFinancialRows(Array.isArray(retryData) ? retryData : []);
          //       }, 1000);
          //     }
          //   } catch (err) {
          //     console.error('❌ Error refreshing data:', err);
          //     await fetchData(); // Fallback to regular fetchData
          //   }
          //   console.log('===== POST-IMPORT DATA REFRESH ENDED =====');
          // }, 2000); // Increased to 2 seconds
        } catch (err) {
          console.error('Error parsing Excel:', err);
          alert('Failed to parse Excel file. Please check the format.');
        }
        setImporting(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error('Error reading file:', err);
      alert('Failed to read file.');
      setImporting(false);
    }
  };
const handleStateSchemeImport = async (file) => {
  const reader = new FileReader();

  reader.onload = async (event) => {
    try {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // ✅ READ AS ARRAY (NOT OBJECT)
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: null
      });

      // ✅ Remove header row
      jsonData.shift();

      let successCount = 0;
      let errorCount = 0;
      let skipped = 0;

      for (const [index, values] of jsonData.entries()) {
        try {
          // Skip empty rows
          // if (!values[0] || typeof values[0] !== 'string') {
          //   skipped++;
          //   continue;
          // }
          // Find first non-empty string cell (scheme name)
const schemeNameCell = values.find(
  v => typeof v === 'string' && v.trim().length > 0
);

if (!schemeNameCell) {
  skipped++;
  continue;
}


          const nameIndex = values.indexOf(schemeNameCell);

const stateSchemeData = {
  name: values[nameIndex]?.toString().trim(),
  hod: values[nameIndex + 1]?.toString().trim(),

  budgetEstimates: parseNumberOrNull(values[nameIndex + 2]),
  broReleased: parseNumberOrNull(values[nameIndex + 3]),

  billsPreferredNo: parseNumberOrNull(values[nameIndex + 4]),
  billsPreferredAmount: parseNumberOrNull(values[nameIndex + 5]),
  billsPreferredOldestDate: parseExcelDate(values[nameIndex + 6]),

  billsClearedNo: parseNumberOrNull(values[nameIndex + 7]),
  billsClearedAmount: parseNumberOrNull(values[nameIndex + 8]),
  billsClearedLatestDate: parseExcelDate(values[nameIndex + 9]),

  pendingNo: parseNumberOrNull(values[nameIndex + 10]),
  pendingAmount: parseNumberOrNull(values[nameIndex + 11]),

  financial_year: financialYear,
  status: 'active'
};

          if (!stateSchemeData.name || !stateSchemeData.hod) {
            skipped++;
            continue;
          }

          const response = await fetch(
            'http://localhost:5000/api/schemes/state-schemes',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(stateSchemeData)
            }
          );

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
            console.error(await response.json());
          }
        } catch (err) {
          errorCount++;
          console.error('Row error', err);
        }
      }

      alert(
        `✅ State Scheme Import Completed\n\n` +
        `Successful: ${successCount}\n` +
        `Failed: ${errorCount}\n` +
        `Skipped: ${skipped}`
      );

      await fetchStateSchemeData();
    } catch (err) {
      console.error('Excel parse failed', err);
      alert('Failed to import Excel file');
    } finally {
      setImporting(false);
    }
  };

  reader.readAsArrayBuffer(file);
};


  // const handleStateSchemeImport = async (file) => {
  //   const reader = new FileReader();
  //   reader.onload = async (event) => {
  //     try {
  //       const data = new Uint8Array(event.target.result);
  //       const workbook = XLSX.read(data, { type: 'array' });
  //       const sheetName = workbook.SheetNames[0];
  //       const worksheet = workbook.Sheets[sheetName];
  //       const jsonData = XLSX.utils.sheet_to_json(worksheet);

  //       console.log('State Scheme Excel loaded', { totalRows: jsonData.length, firstRow: jsonData[0] });

  //       let successCount = 0;
  //       let errorCount = 0;
  //       let skippedHeaderRows = 0;

  //       for (const [index, row] of jsonData.entries()) {
  //         const normalizedRow = normalizeRowKeys(row);
          
  //         // Log columns for first row
  //         if (index === 0) {
  //           console.log('State Scheme normalized columns:', Object.keys(normalizedRow));
  //           console.log('State Scheme first row data:', normalizedRow);
  //           console.log('All normalized row keys:', Object.keys(normalizedRow).map(k => `"${k}"`).join(', '));
  //         }
          
  //         try {
  //           // More flexible column name matching for state schemes
  //           const schemeName = findColumnValue(normalizedRow, ['state_scheme_name', 'name', 'scheme_name', 'state_scheme']) || '';
  //           const hod = findColumnValue(normalizedRow, ['hod', 'hod_name', 'ministry']) || '';

  //           // Skip header rows
  //           const schemeNameLower = (schemeName || '').toString().toLowerCase();
  //           if ((schemeNameLower.includes('scheme') || schemeNameLower.includes('state')) && 
  //               (schemeNameLower.includes('name') || schemeNameLower === 'state scheme name')) {
  //             skippedHeaderRows++;
  //             console.log('Skipped header row:', { index: index + 1, name: schemeName });
  //             continue;
  //           }

  //           // Skip rows where scheme name is just a number or SL. NO
  //           if (!schemeName || schemeName.toString().trim() === '' || /^\d+$/.test(schemeName.toString().trim())) {
  //             skippedHeaderRows++;
  //             console.log('Skipped row with invalid scheme name:', { index: index + 1, name: schemeName, hod });
  //             continue;
  //           }

  //           // Skip rows where HoD is just a number (likely empty or misaligned columns)
  //           if (!hod || hod.toString().trim() === '' || (/^\d+$/.test(hod.toString().trim()) && hod.toString().length < 3)) {
  //             errorCount++;
  //             console.warn('Skipping row - invalid HoD:', { index: index + 1, name: schemeName, hod });
  //             continue;
  //           }

  //           // Simple and direct column value extraction for all fields
  //           const allKeys = Object.keys(normalizedRow);
  //           console.log(`Row ${index + 1} available columns:`, allKeys);
            
  //           const stateSchemeData = {
  //             name: schemeName,
  //             hod: hod,
  //             budgetEstimates: parseNumberOrNull(normalizedRow[allKeys.find(k => k.includes('budget'))]),
  //             broReleased: parseNumberOrNull(normalizedRow[allKeys.find(k => k.includes('bro'))]),
  //             billsPreferredNo: parseNumberOrNull(normalizedRow[allKeys.find(k => k.includes('bills_preferred') && k.includes('count') || k.includes('no_of_bills_preferred'))]),
  //             billsPreferredAmount: parseNumberOrNull(normalizedRow[allKeys.find(k => k.includes('bills_preferred') && k.includes('amount'))]),
  //             billsPreferredOldestDate: parseExcelDate(normalizedRow[allKeys.find(k => k.includes('oldest'))]),
  //             billsClearedNo: parseNumberOrNull(normalizedRow[allKeys.find(k => k.includes('bills_cleared') && (k.includes('count') || k.includes('no') && !k.includes('amount')))]),
  //             billsClearedAmount: parseNumberOrNull(normalizedRow[allKeys.find(k => k.includes('bills_cleared') && k.includes('amount'))]),
  //             billsClearedLatestDate: parseExcelDate(normalizedRow[allKeys.find(k => k.includes('latest'))]),
  //             pendingNo: parseNumberOrNull(normalizedRow[allKeys.find(k => k.includes('pending') && (k.includes('count') || k.includes('no') && !k.includes('amount')))]),
  //             pendingAmount: parseNumberOrNull(normalizedRow[allKeys.find(k => k.includes('pending') && k.includes('amount'))]),
  //             financial_year: financialYear,
  //             status: 'active'
  //           };

  //           console.log('State Scheme row processed', {
  //             index: index + 1,
  //             name: stateSchemeData.name,
  //             hod: stateSchemeData.hod,
  //             budgetEstimates: stateSchemeData.budgetEstimates,
  //             broReleased: stateSchemeData.broReleased,
  //             billsPreferredNo: stateSchemeData.billsPreferredNo,
  //             billsPreferredAmount: stateSchemeData.billsPreferredAmount,
  //             billsClearedNo: stateSchemeData.billsClearedNo,
  //             billsClearedAmount: stateSchemeData.billsClearedAmount,
  //             pendingNo: stateSchemeData.pendingNo,
  //             pendingAmount: stateSchemeData.pendingAmount
  //           });

  //           if (stateSchemeData.name && stateSchemeData.hod) {
  //             const response = await fetch('http://localhost:5000/api/schemes/state-schemes', {
  //               method: 'POST',
  //               headers: { 'Content-Type': 'application/json' },
  //               body: JSON.stringify(stateSchemeData)
  //             });
              
  //             if (response.ok) {
  //               successCount++;
  //               console.log('✅ State scheme row imported:', { index: index + 1, name: stateSchemeData.name, data: stateSchemeData });
  //             } else {
  //               errorCount++;
  //               const errorData = await response.json();
  //               console.error('Failed to import state scheme row', { index: index + 1, name: stateSchemeData.name, error: errorData, sent: stateSchemeData });
  //             }
  //           } else {
  //             errorCount++;
  //             console.warn('Skipping state scheme row - missing required fields', { index: index + 1, name: schemeName, hod });
  //           }
  //         } catch (err) {
  //           errorCount++;
  //           console.error('Error importing state scheme row', { index: index + 1, error: err.message, row: normalizedRow });
  //         }
  //       }

  //       console.log(`State Scheme Import Summary: Successful: ${successCount}, Failed: ${errorCount}, Skipped headers: ${skippedHeaderRows}`);
  //       alert(`✅ State Scheme Import completed!\n\nSuccessful: ${successCount}\nFailed: ${errorCount}\nSkipped headers: ${skippedHeaderRows}`);
        
  //       // Refresh state scheme data
  //       await fetchStateSchemeData();
  //     } catch (err) {
  //       console.error('Error parsing Excel:', err);
  //       alert('Failed to parse Excel file.');
  //     }
  //     setImporting(false);
  //   };
  //   reader.readAsArrayBuffer(file);
  // };

  const handleRevenueImport = async (file) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        console.log('Revenue Excel loaded', { totalRows: jsonData.length });

        let successCount = 0;
        let errorCount = 0;
        let skippedHeaderRows = 0;

        for (const [index, row] of jsonData.entries()) {
          const normalizedRow = normalizeRowKeys(row);
          
          try {
            const cooperativeName = findColumnValue(normalizedRow, ['cooperation', 'cooperative_name', 'name', 'organization_name']) || '';
            
            // Skip header rows
            const nameClower = (cooperativeName || '').toString().toLowerCase();
            if (nameClower.includes('cooperation') || nameClower.includes('cooperative') || nameClower.includes('name')) {
              skippedHeaderRows++;
              continue;
            }

            const revenueData = {
              cooperativeName: cooperativeName,
              loans: parseNumberOrNull(findColumnValue(normalizedRow, ['loans', 'loan_amount'])),
              revenue: parseNumberOrNull(findColumnValue(normalizedRow, ['revenue', 'revenue_amount'])),
              financial_year: financialYear,
              status: 'active'
            };

            if (revenueData.cooperativeName) {
              const response = await fetch('http://localhost:5000/api/schemes/revenue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(revenueData)
              });
              
              if (response.ok) {
                successCount++;
                console.log('✅ Revenue row imported:', { index: index + 1, name: revenueData.cooperativeName });
              } else {
                errorCount++;
                console.error('Failed to import revenue row', { index: index + 1 });
              }
            } else {
              errorCount++;
              console.warn('Skipping revenue row - missing name', { index: index + 1 });
            }
          } catch (err) {
            errorCount++;
            console.error('Error importing revenue row', { index: index + 1, error: err.message });
          }
        }

        await fetchRevenueData();

alert(
  `✅ Import completed!\n\n` +
  `Successful: ${successCount}\n` +
  `Failed: ${errorCount}\n` +
  `Skipped headers: ${skippedHeaderRows}\n\n` +
  `Note: Check console (F12) to see which schemes were UPDATED vs CREATED`
);

// ✅ REFRESH UI FROM DATABASE (PASTE HERE)
await fetchRevenueData();





        // Refresh revenue data
        await fetchRevenueData();
      } catch (err) {
        console.error('Error parsing Excel:', err);
        alert('Failed to parse Excel file.');
      }
      setImporting(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const excelDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d)) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}-${mm}-${yy}`; // EXACT like your Excel
};



  const handleExcelExport = async () => {
  let templatePath = '';
  let startRow = 3; // DATA starts AFTER headers
  let dataRows = [];

  /* ===============================
     1️⃣ Decide template + data
     =============================== */

  if (filterType === 'central-sponsored-scheme') {
    templatePath = '/excel-templates/central-scheme-template.xlsx';

    dataRows = financialRows.map((r, i) => [
      i + 1,
      r.central_scheme_name || '',
      r.scheme_name || '',
      r.hod || '',
      r.allocation_goi_share ?? '',
      r.allocation_state_share ?? '',
      r.allocation_total ?? '',
      r.slsc_goi_share ?? '',
      r.slsc_state_share ?? '',
      r.slsc_total ?? '',
      r.sanction_goi_share ?? '',
      r.sanction_state_share ?? '',
      r.sanction_total ?? '',
      r.bro_released_amount ?? '',
      r.dt_authorized_amount ?? '',
      r.bills_preferred_count ?? '',
      r.bills_preferred_amount ?? '',
      excelDate(r.oldest_bill_date),
      r.bills_cleared_count ?? '',
      r.bills_cleared_amount ?? '',
      excelDate(r.latest_bill_date),
      r.remark || ''
    ]);
  }

  else if (filterType === 'state-scheme') {
    templatePath = '/excel-templates/state-scheme-template.xlsx';

    dataRows = stateSchemeData.map(r => [
      r.name || '',
      r.hod || '',
      r.budgetEstimates ?? '',
      r.broReleased ?? '',
      r.billsPreferredNo ?? '',
      r.billsPreferredAmount ?? '',
      excelDate(r.billsPreferredOldestDate),
      r.billsClearedNo ?? '',
      r.billsClearedAmount ?? '',
      excelDate(r.billsClearedLatestDate),
      r.pendingNo ?? '',
      r.pendingAmount ?? ''
    ]);
  }

  else if (filterType === 'revenue') {
    templatePath = '/excel-templates/revenue-template.xlsx';
    startRow = 2;

    dataRows = revenueData.map((r, i) => [
      i + 1,
      r.cooperativeName || '',
      r.loans ?? '',
      r.revenue ?? ''
    ]);
  }

  if (!templatePath) return;

  /* ===============================
     2️⃣ LOAD TEMPLATE EXCEL
     =============================== */

  const response = await fetch(templatePath);
  const arrayBuffer = await response.arrayBuffer();

  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  /* ===============================
     3️⃣ 🔥 THIS IS WHERE YOU ADD IT
     =============================== */

  XLSX.utils.sheet_add_aoa(
    worksheet,
    dataRows,
    { origin: `A${startRow}` } // 👈 IMPORTANT
  );

  /* ===============================
     4️⃣ DOWNLOAD SAME EXCEL
     =============================== */

  XLSX.writeFile(workbook, `${filterType}_${financialYear}.xlsx`);
};




  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-message">Loading data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }
  return (
    <div className="page-container">
      {/* {importStatus && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '16px',
          backgroundColor: '#e3f2fd',
          border: '1px solid #90caf9',
          borderRadius: '4px',
          color: '#1565c0'
        }}>
          {importStatus}
        </div>
      )} */}
      {/* Financial Progress (CSS) table */}
      <div className="table-card" style={{ marginTop: '24px' }}>
        <div className="table-header">
          <h3>
            {filterType === 'central-sponsored-scheme' && `Financial Progress Report (CSS) ${financialYear}`}
            {filterType === 'state-scheme' && 'State Scheme'}
            {filterType === 'revenue' && 'Revenue'}
          </h3>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
            {filterType === 'central-sponsored-scheme' && `Loaded: ${financialRows.length} records`}
            {filterType === 'state-scheme' && `Loaded: ${stateSchemeData.length} records`}
            {filterType === 'revenue' && `Loaded: ${revenueData.length} records`}
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select 
              value={filterType} 
              onChange={(e) => {
                setFilterType(e.target.value);
                if (e.target.value === 'state-scheme') {
                  fetchStateSchemeData();
                } else if (e.target.value === 'revenue') {
                  fetchRevenueData();
                }
              }}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="central-sponsored-scheme">Central Sponsored Scheme</option>
              <option value="state-scheme">State Scheme</option>
              <option value="revenue">Revenue</option>
            </select>
            {filterType === 'central-sponsored-scheme' && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleExcelImport}
                  accept=".xlsx,.xls,.csv"
                  style={{ display: 'none' }}
                />
                <button
                  className="btn btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <FiUpload /> {importing ? 'Importing...' : 'Import Excel'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleExcelExport}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <FiUpload /> Export Excel
                </button>
                <select value={financialYear} onChange={(e) => setFinancialYear(e.target.value)}>
                  <option value="2025-26">2025-26</option>
                  <option value="2024-25">2024-25</option>
                </select>
              </>
            )}
            {filterType === 'state-scheme' && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleExcelImport}
                  accept=".xlsx,.xls,.csv"
                  style={{ display: 'none' }}
                />
                <button
                  className="btn btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <FiUpload /> {importing ? 'Importing...' : 'Import Excel'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleExcelExport}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <FiUpload /> Export Excel
                </button>
                <select value={financialYear} onChange={(e) => setFinancialYear(e.target.value)}>
                  <option value="2025-26">2025-26</option>
                  <option value="2024-25">2024-25</option>
                </select>
              </>
            )}
            {filterType === 'revenue' && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleExcelImport}
                  accept=".xlsx,.xls,.csv"
                  style={{ display: 'none' }}
                />
                <button
                  className="btn btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <FiUpload /> {importing ? 'Importing...' : 'Import Excel'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleExcelExport}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <FiUpload /> Export Excel
                </button>
                <select value={financialYear} onChange={(e) => setFinancialYear(e.target.value)}>
                  <option value="2025-26">2025-26</option>
                  <option value="2024-25">2024-25</option>
                </select>
              </>
            )}
            <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiPlus /> Add Scheme
            </button>
          </div>
        </div>

        <div className="table-wrapper" style={{ border: '1px solid #d0d7de', borderRadius: '6px', overflow: 'hidden' }}>
          {filterType === 'central-sponsored-scheme' && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th rowSpan="2" style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Sl No</th>
                  <th rowSpan="2" style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Central Scheme Name</th>
                  <th rowSpan="2" style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Scheme</th>
                  <th rowSpan="2" style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>HOD</th>
                  <th colSpan="3" style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Allocation of GOI 2025-26 (Cr)</th>
                  <th colSpan="3" style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>SLSC Approved AAP (Cr)</th>
                  <th colSpan="3" style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Mother Sanction 2025-26 (50% of allocation) (Cr)</th>
                  <th rowSpan="2" style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>BRO Released (Cr)</th>
                  <th rowSpan="2" style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>DT Authorization (Cr)</th>
                  <th colSpan="3" style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Bills Preferred</th>
                  <th colSpan="3" style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Bills Cleared</th>
                  <th rowSpan="2" style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Remark</th>
                  <th rowSpan="2" style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Action</th>
                </tr>
                <tr>
                  <th style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>GOI share</th>
                  <th style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>State share</th>
                  <th style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Total</th>
                  <th style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>GOI share</th>
                  <th style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>State share</th>
                  <th style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Total</th>
                  <th style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>GOI share</th>
                  <th style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>State share</th>
                  <th style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Total</th>
                  <th style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>No. of Bills</th>
                  <th style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Amount (Cr)</th>
                  <th style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Oldest Bill Date</th>
                  <th style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>No. of Bills</th>
                  <th style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Amount (Cr)</th>
                  <th style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Latest Date of Clearance</th>
                </tr>
              </thead>
              <tbody>
                {financialRows.length === 0 ? (
                  <tr><td colSpan="23" style={{ textAlign: 'center', padding: '16px', border: '1px solid #d0d7de' }}>No data</td></tr>
                ) : (
                  financialRows.map((row, idx) => {
                    const allocationGoi = row.allocation_goi_share ?? row.allocation_goi ?? row.allocation_total;
                    const allocationState = row.allocation_state_share ?? null;
                    const slscGoi = row.slsc_goi_share ?? null;
                    const slscState = row.slsc_state_share ?? null;
                    const slscTotal = row.slsc_total;
                    const sanctionGoi = row.sanction_goi_share ?? null;
                    const sanctionState = row.sanction_state_share ?? null;
                    const sanctionTotal = row.sanction_total;

                    const billsPreferredCount = row.bills_preferred_count ?? '-';
                    const billsPreferredAmount = row.bills_preferred_amount;
                    const oldestBillDate = row.oldest_bill_date;
                    const billsClearedCount = row.bills_cleared_count ?? '-';
                    const billsClearedAmount = row.bills_cleared_amount;
                    const latestBillDate = row.latest_bill_date;

                    const centralSchemeName = row.central_scheme_name ?? row.scheme_name ?? '-';

                    return (
                      <tr key={row.id || idx}>
                        <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{idx + 1}</td>
                        <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{centralSchemeName}</td>
                        <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{row.scheme_name}</td>
                        <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{row.hod}</td>
                        <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{allocationGoi !== undefined && allocationGoi !== null ? formatNumber(allocationGoi) : '-'}</td>
                        <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{allocationState !== undefined && allocationState !== null ? formatNumber(allocationState) : '-'}</td>
                        <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{row.allocation_total !== undefined && row.allocation_total !== null ? formatNumber(row.allocation_total) : '-'}</td>
                        <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{slscGoi !== undefined && slscGoi !== null ? formatNumber(slscGoi) : '-'}</td>
                        <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{slscState !== undefined && slscState !== null ? formatNumber(slscState) : '-'}</td>
                        <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{slscTotal !== undefined && slscTotal !== null ? formatNumber(slscTotal) : '-'}</td>
                        <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{sanctionGoi !== undefined && sanctionGoi !== null ? formatNumber(sanctionGoi) : '-'}</td>
                        <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{sanctionState !== undefined && sanctionState !== null ? formatNumber(sanctionState) : '-'}</td>
                        <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{sanctionTotal !== undefined && sanctionTotal !== null ? formatNumber(sanctionTotal) : '-'}</td>
                        <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{formatNumber(row.bro_released_amount)}</td>
                        <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{formatNumber(row.dt_authorized_amount)}</td>
                        <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{billsPreferredCount}</td>
                        <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{formatNumber(billsPreferredAmount)}</td>
                        <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{formatDate(oldestBillDate)}</td>
                        <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{billsClearedCount}</td>
                        <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{formatNumber(billsClearedAmount)}</td>
                        <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{formatDate(latestBillDate)}</td>
                        <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{row.remark || '-'}</td>
                        <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>
                          <div className="action-buttons">
                            <button className="action-btn edit" type="button" title="Edit" onClick={() => handleEditScheme(row)}>
                              <FiEdit2 />
                            </button>
                            <button className="action-btn delete" type="button" title="Delete" onClick={() => handleDeleteCentralScheme(row)}>
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {filterType === 'state-scheme' && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th rowSpan="2" style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Sl. No.</th>
                  <th rowSpan="2" style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>State Scheme Name</th>
                  <th rowSpan="2" style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>HoD</th>
                  <th rowSpan="2" style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Budget Estimates</th>
                  <th rowSpan="2" style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>BRO Released (Cr)</th>
                  <th colSpan="3" style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Bills Preferred</th>
                  <th colSpan="3" style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Bills Cleared</th>
                  <th colSpan="2" style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Pending</th>
                  <th rowSpan="2" style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Action</th>
                </tr>
                <tr>
                  <th style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>No. of Bills</th>
                  <th style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Amount (Cr)</th>
                  <th style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Oldest Bill Date</th>
                  <th style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>No. of Bills</th>
                  <th style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Amount (Cr)</th>
                  <th style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Latest Date of Clearance</th>
                  <th style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>No. of Bills</th>
                  <th style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Amount (Cr)</th>
                </tr>
              </thead>
              <tbody>
                {stateSchemeData.length === 0 ? (
                  <tr><td colSpan="14" style={{ textAlign: 'center', padding: '16px', border: '1px solid #d0d7de' }}>No data</td></tr>
                ) : (
                  stateSchemeData.map((row, idx) => (
                    <tr key={row.id || idx}>
                      <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{row.name || '-'}</td>
                      <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{row.hod || '-'}</td>
                      <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{formatNumber(row.budgetEstimates)}</td>
                      <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{formatNumber(row.broReleased)}</td>
                      <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{row.billsPreferredNo || '-'}</td>
                      <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{formatNumber(row.billsPreferredAmount)}</td>
                      <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{formatDate(row.billsPreferredOldestDate)}</td>
                      <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{row.billsClearedNo || '-'}</td>
                      <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{formatNumber(row.billsClearedAmount)}</td>
                      <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{formatDate(row.billsClearedLatestDate)}</td>
                      <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{row.pendingNo || '-'}</td>
                      <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{formatNumber(row.pendingAmount)}</td>
                      <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>
                        <div className="action-buttons">
                          <button className="action-btn edit" type="button" title="Edit" onClick={() => handleEditStateScheme(row)}>
                            <FiEdit2 />
                          </button>
                          <button className="action-btn delete" type="button" title="Delete" onClick={() => handleDeleteStateScheme(row)}>
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {filterType === 'revenue' && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Sl. No.</th>
                  <th style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Name of the Cooperation & Cooperatives</th>
                  <th style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Loans</th>
                  <th style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Revenue</th>
                  <th style={{ border: '1px solid #d0d7de', padding: '8px', background: '#f6f8fa' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {revenueData.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '16px', border: '1px solid #d0d7de' }}>No data</td></tr>
                ) : (
                  revenueData.map((row, idx) => (
                    <tr key={row.id || idx}>
                      <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{row.sno || idx + 1}</td>
                      <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{row.cooperativeName}</td>
                      <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{row.loans || '-'}</td>
                      <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>{row.revenue || '-'}</td>
                      <td style={{ border: '1px solid #d0d7de', padding: '8px' }}>
                        <div className="action-buttons">
                          <button className="action-btn edit" type="button" title="Edit" onClick={() => handleEditRevenueEntry(row)}>
                            <FiEdit2 />
                          </button>
                          <button className="action-btn delete" type="button" title="Delete" onClick={() => handleDeleteRevenueEntry(row)}>
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={
          filterType === 'central-sponsored-scheme'
            ? (editingItem?.type === 'central-sponsored-scheme' ? 'Edit Central Scheme' : 'Add New Central Scheme')
            : filterType === 'state-scheme'
              ? (editingItem?.type === 'state-scheme' ? 'Edit State Scheme' : 'Add New State Scheme')
              : (editingItem?.type === 'revenue' ? 'Edit Revenue Entry' : 'Add New Revenue Entry')
        }
        footer={
          <>
            <button className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editingItem ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          {/* CENTRAL SPONSORED SCHEME FORM */}
          {filterType === 'central-sponsored-scheme' && (
            <>
              <div className="form-group">
                <label>Central Scheme Name</label>
                <input type="text" name="central_scheme_name" value={formData.central_scheme_name} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Scheme Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>HOD *</label>
                <input type="text" name="hod" value={formData.hod} onChange={handleChange} required />
              </div>

              <h4 style={{ marginTop: '16px' }}>Financial Allocation</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Allocation GOI Share (Cr)</label>
                  <input type="number" step="0.01" name="allocation_goi_share" value={formData.allocation_goi_share} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Allocation State Share (Cr)</label>
                  <input type="number" step="0.01" name="allocation_state_share" value={formData.allocation_state_share} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Total</label>
                  <input type="number" step="0.01" name="allocation_total" value={formData.allocation_total} onChange={handleChange} />
                </div>
              </div>

              <h4 style={{ marginTop: '16px' }}>SLSC Approved AAP (Cr)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>GOI Share</label>
                  <input type="number" step="0.01" name="slsc_goi_share" value={formData.slsc_goi_share} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>State Share</label>
                  <input type="number" step="0.01" name="slsc_state_share" value={formData.slsc_state_share} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Total</label>
                  <input type="number" step="0.01" name="slsc_total" value={formData.slsc_total} onChange={handleChange} />
                </div>
              </div>

              <h4 style={{ marginTop: '16px' }}>Mother Sanction 2025-26 (50% of allocation) (Cr)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>GOI Share</label>
                  <input type="number" step="0.01" name="sanction_goi_share" value={formData.sanction_goi_share} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>State Share</label>
                  <input type="number" step="0.01" name="sanction_state_share" value={formData.sanction_state_share} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Total</label>
                  <input type="number" step="0.01" name="sanction_total" value={formData.sanction_total} onChange={handleChange} />
                </div>
              </div>

              <h4 style={{ marginTop: '16px' }}>Releases & Authorization</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>BRO Released (Cr)</label>
                  <input type="number" step="0.01" name="bro_released_amount" value={formData.bro_released_amount} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>DT Authorization (Cr)</label>
                  <input type="number" step="0.01" name="dt_authorized_amount" value={formData.dt_authorized_amount} onChange={handleChange} />
                </div>
              </div>

              <h4 style={{ marginTop: '16px' }}>Bills Preferred</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>No. of Bills</label>
                  <input type="number" name="bills_preferred_count" value={formData.bills_preferred_count} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Amount (Cr)</label>
                  <input type="number" step="0.01" name="bills_preferred_amount" value={formData.bills_preferred_amount} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Oldest Bill Date</label>
                  <input type="date" name="oldest_bill_date" value={formData.oldest_bill_date} onChange={handleChange} />
                </div>
              </div>

              <h4 style={{ marginTop: '16px' }}>Bills Cleared</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>No. of Bills</label>
                  <input type="number" name="bills_cleared_count" value={formData.bills_cleared_count} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Amount (Cr)</label>
                  <input type="number" step="0.01" name="bills_cleared_amount" value={formData.bills_cleared_amount} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Latest Date of Clearance</label>
                  <input type="date" name="latest_bill_date" value={formData.latest_bill_date} onChange={handleChange} />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>Remark</label>
                <textarea name="remark" value={formData.remark} onChange={handleChange} rows="2" />
              </div>
            </>
          )}

          {/* STATE SCHEME FORM */}
          {filterType === 'state-scheme' && (
            <>
              <div className="form-group">
                <label>State Scheme Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>HoD *</label>
                <input type="text" name="hod" value={formData.hod} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Budget Estimates (Cr)</label>
                <input type="number" step="0.01" name="allocation_total" value={formData.allocation_total} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>BRO Released (Cr)</label>
                <input type="number" step="0.01" name="bro_released_amount" value={formData.bro_released_amount} onChange={handleChange} />
              </div>

              <h4 style={{ marginTop: '16px' }}>Bills Preferred</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>No. of Bills</label>
                  <input type="number" name="bills_preferred_count" value={formData.bills_preferred_count} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Amount (Cr)</label>
                  <input type="number" step="0.01" name="bills_preferred_amount" value={formData.bills_preferred_amount} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Oldest Bill Date</label>
                  <input type="date" name="oldest_bill_date" value={formData.oldest_bill_date} onChange={handleChange} />
                </div>
              </div>

              <h4 style={{ marginTop: '16px' }}>Bills Cleared</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>No. of Bills</label>
                  <input type="number" name="bills_cleared_count" value={formData.bills_cleared_count} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Amount (Cr)</label>
                  <input type="number" step="0.01" name="bills_cleared_amount" value={formData.bills_cleared_amount} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Latest Date of Clearance</label>
                  <input type="date" name="latest_bill_date" value={formData.latest_bill_date} onChange={handleChange} />
                </div>
              </div>

              <h4 style={{ marginTop: '16px' }}>Pending</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>No. of Bills</label>
                  <input type="number" name="pending_bills_count" value={formData.pending_bills_count} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Amount (Cr)</label>
                  <input type="number" step="0.01" name="pending_bills_amount" value={formData.pending_bills_amount} onChange={handleChange} />
                </div>
              </div>
            </>
          )}

          {/* REVENUE FORM */}
          {filterType === 'revenue' && (
            <>
              <div className="form-group">
                <label>Cooperation & Cooperative Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Loans (Cr)</label>
                <input type="number" step="0.01" name="allocation_goi_share" value={formData.allocation_goi_share} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Revenue (Cr)</label>
                <input type="number" step="0.01" name="allocation_state_share" value={formData.allocation_state_share} onChange={handleChange} />
              </div>
            </>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default Schemes;
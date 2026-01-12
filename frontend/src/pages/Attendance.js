import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Modal from '../components/Modal';
import { FiPlus, FiEdit2, FiTrash2, FiCalendar, FiCheckCircle, FiXCircle, FiClock, FiFilter, FiDownload, FiRefreshCw, FiUsers } from 'react-icons/fi';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { 
  getAttendanceStatistics, 
  getAttendanceFiltered, 
  createAttendance, 
  updateAttendance, 
  deleteAttendance, 
  getStaff,
  getHODs,
  getDepartmentWiseAttendance
} from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartDataLabels
);


const Attendance = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Data states
  const [attendance, setAttendance] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [hodList, setHodList] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  
  // Status popup state
  const [statusPopup, setStatusPopup] = useState({ open: false, status: '', title: '', data: [], department: '' });
  
  // Filter states
  const [filters, setFilters] = useState({
    period: searchParams.get('period') || 'today',
    status: searchParams.get('status') || 'all',
    hod_id: searchParams.get('hod_id') || '',
    department: searchParams.get('department') || '',
    employee_type: searchParams.get('employee_type') || 'all',
    start_date: searchParams.get('start_date') || '',
    end_date: searchParams.get('end_date') || ''
  });
  
  // Chart view state
  const [chartView, setChartView] = useState('daily'); // daily, monthly
  
  const [formData, setFormData] = useState({
    staff_id: '',
    hod_id: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    check_in: '',
    check_out: '',
    remarks: ''
  });
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = user.role === 'superadmin';
  const isReadOnly = !isSuperAdmin;

  const fetchInitialData = async () => {
    try {
      const [staffRes, hodRes] = await Promise.all([
        getStaff(),
        getHODs()
      ]);
      setStaffList(staffRes.data || []);
      setHodList(hodRes.data || []);
    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  };

  const fetchAttendanceData = useCallback(async () => {
    try {
      setLoading(true);
      const params = { ...filters };
      
      // Remove empty params
      Object.keys(params).forEach(key => {
        if (!params[key] || params[key] === 'all') delete params[key];
      });

      const [attendanceRes, statsRes, deptRes] = await Promise.all([
        getAttendanceFiltered(params),
        getAttendanceStatistics(params),
        getDepartmentWiseAttendance(params)
      ]);

      setAttendance(attendanceRes.data || []);
      setStatistics(statsRes.data || null);
      setDepartmentData(deptRes.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError('Failed to fetch attendance data. Please make sure the server is running.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch attendance when filters change
  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  // Calculate statistics from current data
  const stats = useMemo(() => {
    if (statistics?.summary) {
      return {
        present: statistics.summary.present || 0,
        absent: statistics.summary.absent || 0,
        late: statistics.summary.late || 0,
        halfDay: statistics.summary.half_day || 0,
        leave: statistics.summary.on_leave || 0,
        total: statistics.summary.total_records || 0,
        uniqueStaff: statistics.summary.unique_staff || 0,
        workingDays: statistics.summary.working_days || 0
      };
    }
    return { present: 0, absent: 0, late: 0, halfDay: 0, leave: 0, total: 0, uniqueStaff: 0, workingDays: 0 };
  }, [statistics]);

  // Bar chart data based on view and status filter
  const barChartData = useMemo(() => {
    if (!statistics) return null;
    
    const data = chartView === 'monthly'
  ? statistics?.monthlyTrend || []
  : statistics?.dailyTrend || [];
    if (!data || data.length === 0) return null;

    // Status to field mapping
    const statusMap = {
      'present': { label: 'Present', color: '#4CAF50', field: 'present' },
      'absent': { label: 'Absent', color: '#F44336', field: 'absent' },
      'late': { label: 'Late', color: '#FF9800', field: 'late' },
      'half_day': { label: 'Half Day', color: '#9C27B0', field: 'half_day' },
      'leave': { label: 'Leave', color: '#2196F3', field: 'on_leave' }
    };

    // If a specific status is filtered, only show that status in the chart
    if (filters.status && filters.status !== 'all' && statusMap[filters.status]) {
      const config = statusMap[filters.status];
      return {
        labels: data.map(item => chartView === 'monthly' ? item.month_label : item.day_label),
        datasets: [{
          label: config.label,
         data: data.map(item => Number(item[config.field] || 0)),
          backgroundColor: config.color,
          borderRadius: 4,
        }]
      };
    }

    // Show all statuses when no filter
    return {
      labels: data.map(item => chartView === 'monthly' ? item.month_label : item.day_label),
      datasets: [
        {
          label: 'Present',
          data: data.map(item => Number(item.present || 0)),
          backgroundColor: '#4CAF50',
          borderRadius: 4,
        },
        {
          label: 'Absent',
          data: data.map(item => Number(item.absent || 0)),
          backgroundColor: '#F44336',
          borderRadius: 4,
        },
        {
          label: 'Late',
          data: data.map(item => item.late),
          backgroundColor: '#FF9800',
          borderRadius: 4,
        },
        {
          label: 'Half Day',
          data: data.map(item => item.half_day),
          backgroundColor: '#9C27B0',
          borderRadius: 4,
        },
        {
          label: 'Leave',
          data: data.map(item => item.on_leave),
          backgroundColor: '#2196F3',
          borderRadius: 4,
        }
      ]
    };
  }, [statistics, chartView, filters.status]);

  // Pie chart data
  const pieChartData = useMemo(() => {
    const total = stats.present + stats.absent + stats.late + stats.halfDay + stats.leave;
    if (total === 0) return null;

    return {
      labels: ['Present', 'Absent', 'Late', 'Half Day', 'Leave'],
      datasets: [{
        data: [stats.present, stats.absent, stats.late, stats.halfDay, stats.leave],
        backgroundColor: ['#4CAF50', '#F44336', '#FF9800', '#9C27B0', '#2196F3'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  }, [stats]);

  // Get unique departments from HOD list
  const uniqueDepartments = useMemo(() => {
    const departments = new Set();
    hodList.forEach(hod => {
      if (hod.department) {
        departments.add(hod.department);
      }
    });
    return Array.from(departments).sort();
  }, [hodList]);

  // Chart options
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        stacked: false,
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' }
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 15,
          usePointStyle: true,
          generateLabels: function(chart) {
            const data = chart.data;
            const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
            return data.labels.map((label, i) => {
              const value = data.datasets[0].data[i];
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return {
                text: `${label}: ${value} (${percentage}%)`,
                fillStyle: data.datasets[0].backgroundColor[i],
                hidden: false,
                index: i
              };
            });
          }
        }
      },
      datalabels: {
        color: '#fff',
        font: { weight: '600', size: 11 },
        formatter: (value, context) => {
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
          return percentage > 5 ? `${percentage}%` : '';
        }
      }
    }
  };

  // Handlers
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    
    // If custom period, don't set period
    if (key === 'start_date' || key === 'end_date') {
      newFilters.period = 'custom';
    }
    
    setFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v && v !== 'all') params.set(k, v);
    });
    setSearchParams(params);
  };

  // eslint-disable-next-line no-unused-vars
  const handleStatusFilter = (status) => {
    handleFilterChange('status', status === filters.status ? 'all' : status);
  };

  // Handle status card click to open popup
  const isLate = (r) => r.check_in && r.check_in > '10:30:00';

  const handleStatusPopupOpen = (status, title) => {
    const statusMap = {
  present: r =>
    (r.display_status || r.status) === 'present' && !isLate(r),

  absent: r =>
    (r.display_status || r.status) === 'absent',

  late: r =>
    isLate(r),

  half_day: r =>
    (r.display_status || r.status) === 'half_day',

  leave: r =>
    ['leave', 'on_leave'].includes(r.display_status || r.status)
};

    
    const filteredData = attendance.filter(statusMap[status] || (() => false));
    setStatusPopup({ open: true, status, title, data: filteredData, department: '' });
  };

  // Handle department status card click to open popup with department employees
  const handleDepartmentStatusPopup = (department, departmentName, status, title, employees) => {
    setStatusPopup({ 
      open: true, 
      status, 
      title: `${departmentName} - ${title}`, 
      data: employees,
      department: departmentName
    });
  };

  const handleStatusPopupClose = () => {
    setStatusPopup({ open: false, status: '', title: '', data: [], department: '' });
  };

  const handleExportPopupData = () => {
    try {
      const headers = ['Employee ID', 'Name', 'Department', 'HOD', 'Date', 'Check In', 'Check Out', 'Status', 'Remarks'];
      const csvContent = [
        headers.join(','),
        ...statusPopup.data.map(record => [
          record.employee_id || '',
          record.staff_name || '',
          record.department || '',
          record.hod_name || '',
          record.date || '',
          record.check_in || '',
          record.check_out || '',
          ((record.display_status || record.status) || '').replace('_', ' '),
          record.remarks || ''
        ].map(val => `"${val}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Attendance_${(statusPopup.title || 'Report').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export data');
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      Object.keys(params).forEach(key => {
        if (!params[key] || params[key] === 'all') delete params[key];
      });

      const [attendanceRes, statsRes, deptRes] = await Promise.all([
        getAttendanceFiltered(params),
        getAttendanceStatistics(params),
        getDepartmentWiseAttendance(params)
      ]);

      setAttendance(attendanceRes.data || []);
      setStatistics(statsRes.data || null);
      setDepartmentData(deptRes.data || []);
      setError(null);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    try {
      // Create CSV content
      const headers = ['Employee ID', 'Name', 'Department', 'HOD', 'Date', 'Check In', 'Check Out', 'Working Hours', 'Status', 'Remarks'];
      const csvContent = [
        headers.join(','),
        ...attendance.map(record => [
          record.employee_id || '',
          record.staff_name || '',
          record.department || '',
          record.hod_name || '',
          record.date || '',
          record.check_in || '',
          record.check_out || '',
          record.working_hours || '',
          ((record.display_status || record.status) || '').replace('_', ' '),
          record.remarks || ''
        ].map(val => `"${val}"`).join(','))
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export data');
    }
  };

  const handleOpenModal = (record = null) => {
    if (isReadOnly) return;
    if (record) {
      setEditingRecord(record);
      setFormData({
        staff_id: record.staff_id || '',
        hod_id: record.hod_id || '',
        date: record.date || new Date().toISOString().split('T')[0],
        status: record.status || 'present',
        check_in: record.check_in || '',
        check_out: record.check_out || '',
        remarks: record.remarks || ''
      });
    } else {
      setEditingRecord(null);
      setFormData({
        staff_id: '',
        hod_id: '',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        check_in: '',
        check_out: '',
        remarks: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-set hod_id when staff is selected
      if (name === 'staff_id' && value) {
        const selectedStaff = staffList.find(s => s.id === parseInt(value));
        if (selectedStaff) {
          newData.hod_id = selectedStaff.hod_id || '';
        }
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    try {
      const submitData = {
        ...formData,
        staff_id: Number(formData.staff_id),
        hod_id: Number(formData.hod_id) || null
      };

      if (editingRecord) {
        await updateAttendance(editingRecord.id, submitData);
      } else {
        await createAttendance(submitData);
      }
      fetchAttendanceData();
      handleCloseModal();
    } catch (err) {
      console.error('Error saving attendance:', err);
      alert('Failed to save attendance. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (isReadOnly) return;
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      try {
        await deleteAttendance(id);
        fetchAttendanceData();
      } catch (err) {
        console.error('Error deleting attendance:', err);
        alert('Failed to delete attendance. Please try again.');
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      present: 'active',
      absent: 'inactive',
      half_day: 'pending',
      leave: 'completed',
      on_leave: 'completed',
      late: 'warning'
    };
    return colors[status] || '';
  };

  const formatTime = (time) => {
    if (!time) return '-';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getPeriodLabel = () => {
    const labels = {
      today: 'Today',
      week: 'This Week',
      month: 'This Month',
      quarter: 'This Quarter',
      year: 'This Year',
      custom: 'Custom Range'
    };
    return labels[filters.period] || 'All Time';
  };

  if (loading && !attendance.length) {
    return (
      <div className="page-container">
        <div className="loading" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Modern Attractive Filters */}
      <div className="filter-bar" style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '16px', 
        marginBottom: '24px', 
        padding: '20px 24px', 
        background: 'green', 
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.2)',
        alignItems: 'flex-end'
      }}>
        <div className="filter-item">
          <label style={{ 
            fontSize: '11px', 
            fontWeight: '700', 
            color: '#fff', 
            marginBottom: '6px', 
            display: 'flex',
            alignItems: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}>
            <FiCalendar style={{ marginRight: '5px' }} size={12} />
            Period
          </label>
          <select 
            value={filters.period} 
            onChange={(e) => handleFilterChange('period', e.target.value)}
            style={{ 
              padding: '9px 12px', 
              borderRadius: '8px', 
              border: 'none', 
              minWidth: '150px', 
              fontSize: '13px',
              fontWeight: '600',
              background: '#fff',
              color: '#333',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              outline: 'none'
            }}
          >
            <option value="today">📅 Today</option>
            <option value="week">📊 This Week</option>
            <option value="month">📆 This Month</option>
            <option value="quarter">📈 This Quarter</option>
            <option value="year">🗓️ This Year</option>
            <option value="custom">⚙️ Custom Range</option>
          </select>
        </div>

        {filters.period === 'custom' && (
          <>
            <div className="filter-item">
              <label style={{ 
                fontSize: '11px', 
                fontWeight: '700', 
                color: '#fff', 
                marginBottom: '6px', 
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                textShadow: '0 1px 2px rgba(0,0,0,0.2)'
              }}>Start Date</label>
              <input 
                type="date" 
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                style={{ 
                  padding: '9px 12px', 
                  borderRadius: '8px', 
                  border: 'none', 
                  fontSize: '13px',
                  fontWeight: '600',
                  background: '#fff',
                  color: '#333',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  outline: 'none'
                }}
              />
            </div>
            <div className="filter-item">
              <label style={{ 
                fontSize: '11px', 
                fontWeight: '700', 
                color: '#fff', 
                marginBottom: '6px', 
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                textShadow: '0 1px 2px rgba(0,0,0,0.2)'
              }}>End Date</label>
              <input 
                type="date" 
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                style={{ 
                  padding: '9px 12px', 
                  borderRadius: '8px', 
                  border: 'none', 
                  fontSize: '13px',
                  fontWeight: '600',
                  background: '#fff',
                  color: '#333',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  outline: 'none'
                }}
              />
            </div>
          </>
        )}

        <div className="filter-item">
          <label style={{ 
            fontSize: '11px', 
            fontWeight: '700', 
            color: '#fff', 
            marginBottom: '6px', 
            display: 'flex',
            alignItems: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}>
            <FiUsers style={{ marginRight: '5px' }} size={12} />
            Department
          </label>
          <select 
            value={filters.department} 
            onChange={(e) => handleFilterChange('department', e.target.value)}
            style={{ 
              padding: '9px 12px', 
              borderRadius: '8px', 
              border: 'none', 
              minWidth: '150px', 
              fontSize: '13px',
              fontWeight: '600',
              background: '#fff',
              color: '#333',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              outline: 'none'
            }}
          >
            <option value="">🏢 All Departments</option>
            {uniqueDepartments.map(dept => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label style={{ 
            fontSize: '11px', 
            fontWeight: '700', 
            color: '#fff', 
            marginBottom: '6px', 
            display: 'flex',
            alignItems: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}>
            <FiFilter style={{ marginRight: '5px' }} size={12} />
            Employee Type
          </label>
          <select 
            value={filters.employee_type} 
            onChange={(e) => handleFilterChange('employee_type', e.target.value)}
            style={{ 
              padding: '9px 12px', 
              borderRadius: '8px', 
              border: 'none', 
              minWidth: '150px', 
              fontSize: '13px',
              fontWeight: '600',
              background: '#fff',
              color: '#333',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              outline: 'none'
            }}
          >
            <option value="all">👥 All Types</option>
            <option value="regular">💼 Regular</option>
            <option value="outsource">🔄 OD</option>
          </select>
        </div>

        <div className="filter-item" style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <button 
            className="btn btn-secondary" 
            onClick={handleRefresh}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '9px 16px', 
              fontSize: '13px',
              fontWeight: '700',
              background: '#fff',
              color: '#667eea',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            <FiRefreshCw size={14} /> Refresh
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleExport}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '9px 16px', 
              fontSize: '13px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 3px 12px rgba(245, 87, 108, 0.35)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            <FiDownload size={14} /> Export
          </button>
        </div>
      </div>

      {/* Summary Cards - Compact Design */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(5, 1fr)', 
        gap: '12px', 
        marginBottom: '15px' 
      }}>
        <div 
          onClick={() => handleStatusPopupOpen('present', 'Present')} 
          style={{ 
            cursor: 'pointer', 
            padding: '12px',
            background: '#fff',
            borderRadius: '8px',
            border: '1px solid #eee',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '8px', 
            background: 'rgba(76, 175, 80, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#4CAF50'
          }}>
            <FiCheckCircle size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#333' }}>{stats.present}</h3>
            <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>Present</p>
            <span style={{ fontSize: '10px', color: '#999' }}>
              {stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        <div 
          onClick={() => handleStatusPopupOpen('absent', 'Absent')} 
          style={{ 
            cursor: 'pointer', 
            padding: '12px',
            background: '#fff',
            borderRadius: '8px',
            border: '1px solid #eee',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '8px', 
            background: 'rgba(244, 67, 54, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#F44336'
          }}>
            <FiXCircle size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#333' }}>{stats.absent}</h3>
            <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>Absent</p>
            <span style={{ fontSize: '10px', color: '#999' }}>
              {stats.total > 0 ? ((stats.absent / stats.total) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        <div 
          onClick={() => handleStatusPopupOpen('late', 'Late')} 
          style={{ 
            cursor: 'pointer', 
            padding: '12px',
            background: '#fff',
            borderRadius: '8px',
            border: '1px solid #eee',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '8px', 
            background: 'rgba(255, 152, 0, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#FF9800'
          }}>
            <FiClock size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#333' }}>{stats.late}</h3>
            <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>Late (&gt;10:45)</p>
            <span style={{ fontSize: '10px', color: '#999' }}>
              {stats.total > 0 ? ((stats.late / stats.total) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        <div 
          onClick={() => handleStatusPopupOpen('leave', 'On Leave')} 
          style={{ 
            cursor: 'pointer', 
            padding: '12px',
            background: '#fff',
            borderRadius: '8px',
            border: '1px solid #eee',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '8px', 
            background: 'rgba(33, 150, 243, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#2196F3'
          }}>
            <FiCalendar size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#333' }}>{stats.leave}</h3>
            <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>On Leave</p>
            <span style={{ fontSize: '10px', color: '#999' }}>
              {stats.total > 0 ? ((stats.leave / stats.total) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        <div style={{ 
          padding: '12px',
          background: '#fff',
          borderRadius: '8px',
          border: '1px solid #eee',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '8px', 
            background: 'rgba(0, 0, 0, 0.05)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#333'
          }}>
            <FiUsers size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#333' }}>{stats.total}</h3>
            <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>Total Records</p>
            <span style={{ fontSize: '10px', color: '#999' }}>
              {stats.uniqueStaff} Staff • {stats.workingDays} Days
            </span>
          </div>
        </div>
      </div>

      {/* Department-Wise Attendance Cards */}
      {departmentData && departmentData.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          {departmentData.map((dept, deptIndex) => (
            <div key={deptIndex} style={{ marginBottom: '16px' }}>
              <div style={{ 
                // background: 'linear-gradient(135deg, #00bcd4 0%, #22c1c3 100%)',
                padding: '12px 20px',
                color: '#1e1b1b',
                fontWeight: '700',
                fontSize: '14px',
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {dept.department}
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(5, 1fr)', 
                gap: '10px'
              }}>
                {/* Total Emp */}
                <div 
                  onClick={() => handleDepartmentStatusPopup(dept.department, dept.department, 'total', 'Total Emp', dept.employees.total)}
                  style={{ 
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #3f87ff 0%, #22c1c3 100%)',
                    padding: '12px',
                    color: '#fff',
                    position: 'relative',
                    minHeight: '90px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
                >
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '4px', opacity: 0.92 }}>Total Emp</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', lineHeight: '1' }}>{dept.total_emp || 0}</div>
                    <div style={{ fontSize: '10px', marginTop: '3px', opacity: 0.85 }}>100.0%</div>
                  </div>
                  <div style={{ 
                    position: 'absolute', 
                    right: '10px', 
                    bottom: '10px',
                    width: '32px',
                    height: '32px',
                    background: 'rgba(255, 255, 255, 0.22)',
                    border: '1px solid rgba(255, 255, 255, 0.42)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FiUsers size={16} />
                  </div>
                </div>

                {/* Present */}
                <div 
                  onClick={() => handleDepartmentStatusPopup(dept.department, dept.department, 'present', 'Present', dept.employees?.present || [])}
                  style={{ 
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    padding: '12px',
                    color: '#fff',
                    position: 'relative',
                    minHeight: '90px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
                >
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '4px', opacity: 0.92 }}>Present</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', lineHeight: '1' }}>{dept.present || 0}</div>
                    <div style={{ fontSize: '10px', marginTop: '3px', opacity: 0.85 }}>
                      {dept.total_emp > 0 ? ((dept.present / dept.total_emp) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                  <div style={{ 
                    position: 'absolute', 
                    right: '10px', 
                    bottom: '10px',
                    width: '32px',
                    height: '32px',
                    background: 'rgba(255, 255, 255, 0.22)',
                    border: '1px solid rgba(255, 255, 255, 0.42)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FiCheckCircle size={16} />
                  </div>
                </div>

                {/* Absent */}
                <div 
                  onClick={() => handleDepartmentStatusPopup(dept.department, dept.department, 'absent', 'Absent', dept.employees.absent)}
                  style={{ 
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
                    padding: '12px',
                    color: '#fff',
                    position: 'relative',
                    minHeight: '90px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
                >
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '4px', opacity: 0.92 }}>Absent</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', lineHeight: '1' }}>{dept.absent || 0}</div>
                    <div style={{ fontSize: '10px', marginTop: '3px', opacity: 0.85 }}>
                      {dept.total_emp > 0 ? ((dept.absent / dept.total_emp) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                  <div style={{ 
                    position: 'absolute', 
                    right: '10px', 
                    bottom: '10px',
                    width: '32px',
                    height: '32px',
                    background: 'rgba(255, 255, 255, 0.22)',
                    border: '1px solid rgba(255, 255, 255, 0.42)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FiXCircle size={16} />
                  </div>
                </div>

                {/* Late */}
                <div 
                  onClick={() => handleDepartmentStatusPopup(dept.department, dept.department, 'late', 'Late (after 10:30)', dept.employees.late)}
                  style={{ 
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
                    padding: '12px',
                    color: '#fff',
                    position: 'relative',
                    minHeight: '90px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
                >
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '4px', opacity: 0.92 }}>Late (after 10:30)</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', lineHeight: '1' }}>{dept.late || 0}</div>
                    <div style={{ fontSize: '10px', marginTop: '3px', opacity: 0.85 }}>
                      {dept.total_emp > 0 ? ((dept.late / dept.total_emp) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                  <div style={{ 
                    position: 'absolute', 
                    right: '10px', 
                    bottom: '10px',
                    width: '32px',
                    height: '32px',
                    background: 'rgba(255, 255, 255, 0.22)',
                    border: '1px solid rgba(255, 255, 255, 0.42)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FiClock size={16} />
                  </div>
                </div>

                {/* Emp Leave */}
                <div 
                  onClick={() => handleDepartmentStatusPopup(dept.department, dept.department, 'leave', 'Emp Leave', dept.employees.leave)}
                  style={{ 
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #00b09b 0%, #96c93d 100%)',
                    padding: '12px',
                    color: '#fff',
                    position: 'relative',
                    minHeight: '90px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
                >
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '4px', opacity: 0.92 }}>Emp Leave</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', lineHeight: '1' }}>{dept.emp_leave || 0}</div>
                    <div style={{ fontSize: '10px', marginTop: '3px', opacity: 0.85 }}>
                      {dept.total_emp > 0 ? ((dept.emp_leave / dept.total_emp) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                  <div style={{ 
                    position: 'absolute', 
                    right: '10px', 
                    bottom: '10px',
                    width: '32px',
                    height: '32px',
                    background: 'rgba(255, 255, 255, 0.22)',
                    border: '1px solid rgba(255, 255, 255, 0.42)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FiCalendar size={16} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Bar Chart */}
        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiCalendar /> Attendance Trend - {getPeriodLabel()}
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className={`btn btn-sm ${chartView === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setChartView('daily')}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Daily
              </button>
              <button 
                className={`btn btn-sm ${chartView === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setChartView('monthly')}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Monthly
              </button>
            </div>
          </div>
          <div style={{ height: '300px' }}>
            {barChartData ? (
              <Bar data={barChartData} options={barChartOptions} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
                No data available for the selected period
              </div>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="chart-card">
          <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiFilter /> Status Distribution
          </h3>
          <div style={{ height: '300px' }}>
            {pieChartData ? (
              <Pie data={pieChartData} options={pieChartOptions} plugins={[ChartDataLabels]} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
                No data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Department-wise Summary */}
      {statistics?.departmentWise && statistics.departmentWise.length > 0 && (
        <div className="chart-card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>Department-wise Summary</h3>
          <div className="table-wrapper" style={{ maxHeight: '250px', overflow: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Department</th>
                  <th>HOD</th>
                  <th style={{ textAlign: 'center', color: '#4CAF50' }}>Present</th>
                  <th style={{ textAlign: 'center', color: '#F44336' }}>Absent</th>
                  <th style={{ textAlign: 'center', color: '#FF9800' }}>Late</th>
                  <th style={{ textAlign: 'center', color: '#9C27B0' }}>Half Day</th>
                  <th style={{ textAlign: 'center', color: '#2196F3' }}>Leave</th>
                  <th style={{ textAlign: 'center' }}>Total</th>
                  <th style={{ textAlign: 'center' }}>Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {statistics.departmentWise.map((dept, index) => {
                  const attendancePercent = dept.total > 0 
                    ? (((dept.present + dept.late) / dept.total) * 100).toFixed(1) 
                    : 0;
                  return (
                    <tr key={index}>
                      <td><strong>{dept.department || 'N/A'}</strong></td>
                      <td>{dept.hod_name || 'N/A'}</td>
                      <td style={{ textAlign: 'center' }}>{dept.present}</td>
                      <td style={{ textAlign: 'center' }}>{dept.absent}</td>
                      <td style={{ textAlign: 'center' }}>{dept.late}</td>
                      <td style={{ textAlign: 'center' }}>{dept.half_day}</td>
                      <td style={{ textAlign: 'center' }}>{dept.on_leave}</td>
                      <td style={{ textAlign: 'center' }}><strong>{dept.total}</strong></td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '12px', 
                          fontSize: '12px',
                          backgroundColor: attendancePercent >= 90 ? '#e8f5e9' : attendancePercent >= 75 ? '#fff3e0' : '#ffebee',
                          color: attendancePercent >= 90 ? '#2e7d32' : attendancePercent >= 75 ? '#ef6c00' : '#c62828'
                        }}>
                          {attendancePercent}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance Records Table */}
      <div className="table-card">
        <div className="table-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div>Total records: <strong>{attendance.length}</strong> | Showing {Math.min(currentPage * pageSize + 1, attendance.length)}-{Math.min((currentPage + 1) * pageSize, attendance.length)} of {attendance.length}</div>
            {filters.status && filters.status !== 'all' && (
              <span style={{ 
                padding: '4px 12px', 
                borderRadius: '20px', 
                fontSize: '12px',
                backgroundColor: filters.status === 'present' ? '#4CAF50' : 
                                filters.status === 'absent' ? '#F44336' : 
                                filters.status === 'late' ? '#FF9800' :
                                filters.status === 'half_day' ? '#9C27B0' : '#2196F3',
                color: '#fff'
              }}>
                {filters.status.replace('_', ' ').toUpperCase()}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {filters.status !== 'all' && (
              <button className="btn btn-secondary" onClick={() => handleFilterChange('status', 'all')}>
                <FiFilter /> Clear Filter
              </button>
            )}
            {!isReadOnly && (
              <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                <FiPlus /> Mark Attendance
              </button>
            )}
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Working Hours</th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    No attendance records found for the selected filters
                  </td>
                </tr>
              ) : (
                attendance.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map((record) => (
                  <tr key={record.id}>
                    <td><strong>{record.employee_id || '-'}</strong></td>
                    <td>{record.staff_name || '-'}</td>
                    <td>{record.designation || '-'}</td>
                    <td>{record.department || '-'}</td>
                    <td>{record.date ? new Date(record.date).toLocaleDateString('en-IN') : '-'}</td>
                    <td>
                      <span style={{ 
                        color: record.check_in && record.display_status === 'late' ? '#FF9800' : 'inherit'
                      }}>
                        {formatTime(record.check_in)}
                      </span>
                    </td>
                    <td>{formatTime(record.check_out)}</td>
                    <td>{record.working_hours || '-'}</td>
                    <td>
                      <span className={`status-badge ${getStatusColor(record.display_status)}`}>
                        {((record.display_status || record.status) || 'N/A').replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {record.remarks || '-'}
                    </td>
                    <td>
                      <div className="action-buttons">
                        {!isReadOnly && (
                          <>
                            <button className="action-btn edit" onClick={() => handleOpenModal(record)} title="Edit">
                              <FiEdit2 />
                            </button>
                            <button className="action-btn delete" onClick={() => handleDelete(record.id)} title="Delete">
                              <FiTrash2 />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="pagination" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', borderTop: '1px solid #e0e0e0' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>
            {attendance.length > 0 ? `${currentPage * pageSize + 1}-${Math.min((currentPage + 1) * pageSize, attendance.length)} of ${attendance.length.toLocaleString()}` : '0 of 0'}
          </span>
          <button 
            disabled={currentPage === 0} 
            onClick={() => setCurrentPage(currentPage - 1)}
            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #d0d7de', background: 'white', cursor: currentPage === 0 ? 'not-allowed' : 'pointer', opacity: currentPage === 0 ? 0.5 : 1 }}
          >
            &lt;
          </button>
          <button 
            disabled={(currentPage + 1) * pageSize >= attendance.length} 
            onClick={() => setCurrentPage(currentPage + 1)}
            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #d0d7de', background: 'white', cursor: (currentPage + 1) * pageSize >= attendance.length ? 'not-allowed' : 'pointer', opacity: (currentPage + 1) * pageSize >= attendance.length ? 0.5 : 1 }}
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingRecord ? 'Edit Attendance' : 'Mark Attendance'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
            {!isReadOnly && (
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editingRecord ? 'Update' : 'Save'}
              </button>
            )}
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Staff Member *</label>
              <select name="staff_id" value={formData.staff_id} onChange={handleChange} required>
                <option value="">Select Staff</option>
                {staffList.map(staff => (
                  <option key={staff.id} value={staff.id}>
                    {staff.employee_id} - {staff.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Date *</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} required />
            </div>
          </div>
          
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="half_day">Half Day</option>
                <option value="leave">Leave</option>
                <option value="late">Late</option>
              </select>
            </div>
            <div className="form-group">
              <label>Department/HOD</label>
              <select name="hod_id" value={formData.hod_id} onChange={handleChange}>
                <option value="">Select Department</option>
                {hodList.map(hod => (
                  <option key={hod.id} value={hod.id}>{hod.department}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Check In</label>
              <input type="time" name="check_in" value={formData.check_in} onChange={handleChange} />
              <small style={{ color: '#999', fontSize: '11px' }}>After 10:45 AM = Late</small>
            </div>
            <div className="form-group">
              <label>Check Out</label>
              <input type="time" name="check_out" value={formData.check_out} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Remarks</label>
            <textarea 
              name="remarks" 
              value={formData.remarks} 
              onChange={handleChange}
              rows="2"
              placeholder="Any additional notes..."
              style={{ resize: 'vertical' }}
            />
          </div>
        </form>
      </Modal>

      {/* Status Popup Modal */}
      {statusPopup.open && (
        <div 
          style={{
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
          }}
          onClick={handleStatusPopupClose}
        >
          <div 
            style={{
              background: '#fff',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '900px',
              maxHeight: '80vh',
              overflow: 'hidden',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: statusPopup.status === 'present' ? '#4CAF50' : 
                         statusPopup.status === 'absent' ? '#F44336' :
                         statusPopup.status === 'late' ? '#FF9800' :
                         statusPopup.status === 'half_day' ? '#9C27B0' : '#2196F3',
              color: '#fff'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>
                {statusPopup.title} Staff ({statusPopup.data.length})
              </h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={handleExportPopupData}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '5px',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '13px'
                  }}
                >
                  <FiDownload size={14} /> Export
                </button>
                <button
                  onClick={handleStatusPopupClose}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>
            </div>
            <div style={{ padding: '20px', maxHeight: '60vh', overflow: 'auto' }}>
              {statusPopup.data.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  No records found
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #eee', fontSize: '12px', fontWeight: '600' }}>Employee ID</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #eee', fontSize: '12px', fontWeight: '600' }}>Name</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #eee', fontSize: '12px', fontWeight: '600' }}>Department</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #eee', fontSize: '12px', fontWeight: '600' }}>Date</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #eee', fontSize: '12px', fontWeight: '600' }}>Check In</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #eee', fontSize: '12px', fontWeight: '600' }}>Check Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusPopup.data.map((record, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px', fontSize: '13px' }}>{record.employee_id || '-'}</td>
                        <td style={{ padding: '10px', fontSize: '13px', fontWeight: '500' }}>{record.staff_name || '-'}</td>
                        <td style={{ padding: '10px', fontSize: '13px' }}>{record.department || '-'}</td>
                        <td style={{ padding: '10px', fontSize: '13px' }}>{record.date || '-'}</td>
                        <td style={{ padding: '10px', fontSize: '13px' }}>{record.check_in || '-'}</td>
                        <td style={{ padding: '10px', fontSize: '13px' }}>{record.check_out || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;

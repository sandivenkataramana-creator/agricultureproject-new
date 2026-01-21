import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ListModal from '../components/ListModal';
import { Pie, Bar, Line, Doughnut } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { FiUsers, FiFileText, FiTrendingUp, FiActivity, FiPieChart, FiBarChart2, FiFilter, FiClock, FiMapPin, FiUserCheck, FiRefreshCw, FiCheckCircle, FiUserX, FiAlertCircle } from 'react-icons/fi';
import { BiRupee, BiWallet } from 'react-icons/bi';
import { HiOutlineUserGroup } from 'react-icons/hi';
import {
  getDashboardStats,
  getDashboardQuickStats,
  getDashboardSchemesSummary,
  getDashboardBudgetSummary,
  getDashboardBudgetBreakdown,
  getSchemesByCategory,
  getHODsByDepartment,
  getBudgetByHOD,
  getSchemesByHOD,
  getAttendanceByHOD,
  getRevenueByHOD,
  getRevenueByDepartment,
  getHODs,
  getSchemesByHODId,
  getBudgetByHODId,
  getAttendanceByHODId,
  getAttendance,
  getRevenueByHODId
} from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalHods: 0,
    activeHods: 0,
    totalSchemes: 0,
    activeSchemes: 0,
    totalStaff: 0,
    activeStaff: 0,
    totalBudget: 0,
    todayAttendance: {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      onLeave: 0
    },
    utilizedBudget: 0,
    totalPrograms: 0,
    activePrograms: 0,
    inactivePrograms: 0
  });
  const [quickStats, setQuickStats] = useState({
    budgetUtilization: 0,
    totalBudget: 0,
    utilizedBudget: 0,
    remainingBudget: 0,
    districtsCovered: 0,
    beneficiaries: 0,
    attendanceRate: 0,
    nodalOfficers: 0
  });
  const [schemesSummary, setSchemesSummary] = useState({
    year: '',
    total: { total: 0, central: 0, state: 0 },
    active: { total: 0, central: 0, state: 0 },
    inactive: { total: 0, central: 0, state: 0 }
  });
  const [budgetSummary, setBudgetSummary] = useState({
    year: '',
    total: { total: 0, central: 0, state: 0 },
    utilized: { total: 0, central: 0, state: 0 },
    remaining: { total: 0, central: 0, state: 0 }
  });
  const [budgetBreakdown, setBudgetBreakdown] = useState({
    year: '',
    estimated: { total: 0, central: 0, state: 0 },
    sanction: { total: 0, central: 0, state: 0 },
    pending: { total: 0, central: 0, state: 0 }
  });
  const [schemesByCategory, setSchemesByCategory] = useState([]);
  const [hodsByDepartment, setHODsByDepartment] = useState([]);
  const [budgetByHOD, setBudgetByHOD] = useState([]);
  const [schemesByHOD, setSchemesByHOD] = useState([]);
  const [attendanceByHOD, setAttendanceByHOD] = useState([]);
  const [revenueByHOD, setRevenueByHOD] = useState([]);
  const [revenueByDepartment, setRevenueByDepartment] = useState([]);
  const [allHODs, setAllHODs] = useState([]);
  const [selectedHOD, setSelectedHOD] = useState('');
  const [selectedHODTable, setSelectedHODTable] = useState({ schemes: '', budget: '', attendance: '', revenue: '' });
  const [revenueDetails, setRevenueDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ year: 'All', month: 'All', date: '', hod_id: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ title: '', items: [], columns: [] });
  // Chart filter states
  const [chartFilters, setChartFilters] = useState({
    revenue: { hod_id: '' },
    schemes: { hod_id: '' },
    budget: { hod_id: '' },
    attendance: { hod_id: '' }
  });
  const [openFilterDropdown, setOpenFilterDropdown] = useState(null);
  // Detailed data for tables when HOD is selected
  const [schemesDetails, setSchemesDetails] = useState([]);
  const [budgetDetails, setBudgetDetails] = useState([]);
  const [attendanceDetails, setAttendanceDetails] = useState([]);

  useEffect(() => {
    // initial load
    fetchHODsList();
    fetchDashboardData();
  }, []);

  useEffect(() => {
    // Refetch data when HOD filter changes
    if (selectedHOD) {
      fetchDashboardData({ ...filters, hod_id: selectedHOD });
      fetchDetailedTableData(selectedHOD);
    } else {
      fetchDashboardData();
      setSchemesDetails([]);
      setBudgetDetails([]);
      setAttendanceDetails([]);
    }
  }, [selectedHOD]);

  // Fetch schemesDetails when chart filter changes
  useEffect(() => {
    if (chartFilters.schemes.hod_id) {
      getSchemesByHODId(chartFilters.schemes.hod_id)
        .then(res => setSchemesDetails(res.data || []))
        .catch(err => console.error('Error fetching schemes details:', err));
    } else if (!selectedHOD && !selectedHODTable.schemes) {
      setSchemesDetails([]);
    }
  }, [chartFilters.schemes.hod_id]);

  const fetchDetailedTableData = async (hodId) => {
    try {
      const [schemesRes, budgetRes, attendanceRes] = await Promise.all([
        getSchemesByHODId(hodId),
        getBudgetByHODId(hodId),
        getAttendanceByHODId(hodId)
      ]);
      setSchemesDetails(schemesRes.data || []);
      setBudgetDetails(budgetRes.data || []);
      setAttendanceDetails(attendanceRes.data || []);
    } catch (err) {
      console.error('Error fetching detailed table data:', err);
    }
  };

  const fetchHODsList = async () => {
    try {
      const response = await getHODs();
      setAllHODs(response.data || []);
    } catch (err) {
      console.error('Error fetching HODs list:', err);
    }
  };

  const fetchDashboardData = async (overrideFilters = null) => {
    const f = overrideFilters || filters;
    const params = {};
    if (f.year && f.year !== 'All') params.year = f.year;
    if (f.month && f.month !== 'All') params.month = f.month;
    if (f.date) params.date = f.date;
    if (f.hod_id) params.hod_id = f.hod_id;

    // Default to current financial year for schemes summary if not explicitly provided
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const fyStart = m >= 4 ? y : y - 1;
    const currentFY = `${fyStart}-${String(fyStart + 1).slice(2)}`;
    const schemesSummaryParams = {
      ...params,
      year: params.year || currentFY
    };

    try {
      setLoading(true);
      
      // Fetch all dashboard data in parallel (pass filters as query params)
      const [
        statsRes,
        quickStatsRes,
        schemesSummaryRes,
        budgetSummaryRes,
        categoryRes,
        hodsDeptRes,
        budgetRes,
        schemesHODRes,
        attendanceRes,
        revenueRes,
        revenueDeptRes,
        budgetBreakdownRes
      ] = await Promise.all([
        getDashboardStats(params),
        getDashboardQuickStats(params),
        getDashboardSchemesSummary(schemesSummaryParams),
        getDashboardBudgetSummary(schemesSummaryParams),
        getSchemesByCategory(params),
        getHODsByDepartment(params),
        getBudgetByHOD(params),
        getSchemesByHOD(params),
        getAttendanceByHOD(params),
        getRevenueByHOD(params),
        getRevenueByDepartment(params),
        getDashboardBudgetBreakdown(schemesSummaryParams)
      ]);

      // Set stats
      setStats({
        totalHods: statsRes.data.totalHods || 0,
        activeHods: statsRes.data.activeHods || 0,
        totalSchemes: statsRes.data.totalSchemes || 0,
        activeSchemes: statsRes.data.activeSchemes || 0,
        totalStaff: statsRes.data.totalStaff || 0,
        activeStaff: statsRes.data.activeStaff || 0,
        totalBudget: parseFloat(statsRes.data.totalBudget) || 0,
        utilizedBudget: parseFloat(statsRes.data.utilizedBudget) || 0,
        todayAttendance: statsRes.data.todayAttendance || {
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          halfDay: 0,
          onLeave: 0
        },
        totalPrograms: statsRes.data.totalPrograms || 0,
        activePrograms: statsRes.data.activePrograms || 0,
        inactivePrograms: statsRes.data.inactivePrograms || 0
      });

      // Set quick stats
      setQuickStats({
        budgetUtilization: quickStatsRes.data.budgetUtilization || 0,
        totalBudget: parseFloat(quickStatsRes.data.totalBudget) || 0,
        utilizedBudget: parseFloat(quickStatsRes.data.utilizedBudget) || 0,
        remainingBudget: parseFloat(quickStatsRes.data.remainingBudget) || 0,
        districtsCovered: quickStatsRes.data.districtsCovered || 0,
        beneficiaries: quickStatsRes.data.beneficiaries || 0,
        attendanceRate: quickStatsRes.data.attendanceRate || 0,
        nodalOfficers: quickStatsRes.data.nodalOfficers || 0
      });

      // Schemes summary (Central + State)
      setSchemesSummary({
        year: schemesSummaryRes.data?.year || schemesSummaryParams.year,
        total: {
          total: schemesSummaryRes.data?.total?.total || 0,
          central: schemesSummaryRes.data?.total?.central || 0,
          state: schemesSummaryRes.data?.total?.state || 0
        },
        active: {
          total: schemesSummaryRes.data?.active?.total || 0,
          central: schemesSummaryRes.data?.active?.central || 0,
          state: schemesSummaryRes.data?.active?.state || 0
        },
        inactive: {
          total: schemesSummaryRes.data?.inactive?.total || 0,
          central: schemesSummaryRes.data?.inactive?.central || 0,
          state: schemesSummaryRes.data?.inactive?.state || 0
        }
      });

      setBudgetSummary({
        year: budgetSummaryRes.data?.year || schemesSummaryParams.year,
        total: {
          total: budgetSummaryRes.data?.total?.total || 0,
          central: budgetSummaryRes.data?.total?.central || 0,
          state: budgetSummaryRes.data?.total?.state || 0
        },
        utilized: {
          total: budgetSummaryRes.data?.utilized?.total || 0,
          central: budgetSummaryRes.data?.utilized?.central || 0,
          state: budgetSummaryRes.data?.utilized?.state || 0
        },
        remaining: {
          total: budgetSummaryRes.data?.remaining?.total || 0,
          central: budgetSummaryRes.data?.remaining?.central || 0,
          state: budgetSummaryRes.data?.remaining?.state || 0
        }
      });

      setBudgetBreakdown({
        year: budgetBreakdownRes.data?.year || schemesSummaryParams.year,
        estimated: {
          total: budgetBreakdownRes.data?.estimated?.total || 0,
          central: budgetBreakdownRes.data?.estimated?.central || 0,
          state: budgetBreakdownRes.data?.estimated?.state || 0
        },
        sanction: {
          total: budgetBreakdownRes.data?.sanction?.total || 0,
          central: budgetBreakdownRes.data?.sanction?.central || 0,
          state: budgetBreakdownRes.data?.sanction?.state || 0
        },
        pending: {
          total: budgetBreakdownRes.data?.pending?.total || 0,
          central: budgetBreakdownRes.data?.pending?.central || 0,
          state: budgetBreakdownRes.data?.pending?.state || 0
        }
      });

      // Set schemes by category
      setSchemesByCategory(categoryRes.data || []);

      // Set HODs by department
      setHODsByDepartment(hodsDeptRes.data || []);

      // Set budget by HOD
      setBudgetByHOD(budgetRes.data || []);

      // Set schemes by HOD
      setSchemesByHOD(schemesHODRes.data || []);

      // Set attendance by HOD
      setAttendanceByHOD(attendanceRes.data || []);

      // Set revenue by HOD
      setRevenueByHOD(revenueRes.data || []);

      // Set revenue by department
      setRevenueByDepartment(revenueDeptRes.data || []);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to fetch dashboard data. Please make sure the server is running.');
      setLoading(false);
    }
  };

  const formatCSBreakdown = (central, state) => {
    return `(C:${central} S:${state})`;
  };

  const formatCSBudgetBreakdown = (central, state) => {
    return `(C:${formatCurrency(central)} S:${formatCurrency(state)})`;
  };

  const formatPercent = (count, total) => {
    const t = Number(total) || 0;
    const c = Number(count) || 0;
    if (t <= 0) return '0%';
    return `${((c / t) * 100).toFixed(1)}%`;
  };

  const formatCurrency = (value) => {
    if (typeof value === 'string') value = parseFloat(value);
    if (isNaN(value)) return '₹0';
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`;
    }
    return `₹${value.toLocaleString()}`;
  };

  const formatBeneficiaries = (count) => {
    if (count >= 100000) {
      return `${(count / 100000).toFixed(0)}L+`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K+`;
    }
    return count.toString();
  };

  const formatCompactNumber = (value) => {
    if (value === null || value === undefined) return '0';
    const v = Number(value);
    if (isNaN(v)) return String(value);
    if (Math.abs(v) >= 1000000) return `${(v / 1000000).toFixed(2)}M`;
    if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(2)}K`;
    return v.toString();
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  // Handle chart filter change
  const handleChartFilterChange = (chartType, hodId) => {
    setChartFilters(prev => ({
      ...prev,
      [chartType]: { hod_id: hodId }
    }));
    setOpenFilterDropdown(null);
  };

  // Toggle filter dropdown
  const toggleFilterDropdown = (chartType) => {
    setOpenFilterDropdown(openFilterDropdown === chartType ? null : chartType);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.chart-filter-container')) {
        setOpenFilterDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Get filtered data for each chart
  const getFilteredRevenueData = () => {
    if (chartFilters.revenue.hod_id) {
      return revenueByHOD.filter(item => item.hod_name === allHODs.find(h => h.id === parseInt(chartFilters.revenue.hod_id))?.name);
    }
    return revenueByHOD;
  };

  const getFilteredSchemesData = () => {
    if (chartFilters.schemes.hod_id) {
      return schemesByHOD.filter(item => item.hod_name === allHODs.find(h => h.id === parseInt(chartFilters.schemes.hod_id))?.name);
    }
    return schemesByHOD;
  };

  const getFilteredBudgetData = () => {
    if (chartFilters.budget.hod_id) {
      return budgetByHOD.filter(item => item.hod_name === allHODs.find(h => h.id === parseInt(chartFilters.budget.hod_id))?.name);
    }
    return budgetByHOD;
  };

  const getFilteredAttendanceData = () => {
    if (chartFilters.attendance.hod_id) {
      return attendanceByHOD.filter(item => item.hod_name === allHODs.find(h => h.id === parseInt(chartFilters.attendance.hod_id))?.name);
    }
    return attendanceByHOD;
  };

  // Render filter dropdown
  const renderFilterDropdown = (chartType) => {
    if (openFilterDropdown !== chartType) return null;
    return (
      <div style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
        minWidth: '200px',
        padding: '8px 0'
      }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #eee', fontWeight: '600', color: '#333' }}>
          Filter by HOD
        </div>
        <div 
          style={{ 
            padding: '8px 12px', 
            cursor: 'pointer',
            backgroundColor: !chartFilters[chartType].hod_id ? '#e8f5e9' : 'transparent',
            color: !chartFilters[chartType].hod_id ? '#2e7d32' : '#333'
          }}
          onClick={() => handleChartFilterChange(chartType, '')}
        >
          All HODs
        </div>
        {allHODs.map(hod => (
          <div 
            key={hod.id}
            style={{ 
              padding: '8px 12px', 
              cursor: 'pointer',
              backgroundColor: chartFilters[chartType].hod_id === String(hod.id) ? '#e8f5e9' : 'transparent',
              color: chartFilters[chartType].hod_id === String(hod.id) ? '#2e7d32' : '#333'
            }}
            onClick={() => handleChartFilterChange(chartType, String(hod.id))}
            onMouseEnter={(e) => e.target.style.backgroundColor = chartFilters[chartType].hod_id === String(hod.id) ? '#e8f5e9' : '#f5f5f5'}
            onMouseLeave={(e) => e.target.style.backgroundColor = chartFilters[chartType].hod_id === String(hod.id) ? '#e8f5e9' : 'transparent'}
          >
            {hod.name}
          </div>
        ))}
      </div>
    );
  };

  const handleExport = () => {
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Dashboard Statistics Sheet
    const statsData = [
      ['Dashboard Statistics', ''],
      ['', ''],
      ['Metric', 'Value'],
      ['Total HODs', stats.totalHods],
      ['Total Schemes', stats.totalSchemes],
      ['Total Staff', stats.totalStaff],
      ['Total Budget', formatCurrency(stats.totalBudget)],
      ['Utilized Budget', formatCurrency(stats.utilizedBudget)],
      ['Budget Utilization %', `${quickStats.budgetUtilization}%`],
      ['Districts Covered', quickStats.districtsCovered],
      ['Beneficiaries', formatCompactNumber(quickStats.beneficiaries)],
      ['Attendance Rate %', `${quickStats.attendanceRate}%`],
      ['Nodal Officers', quickStats.nodalOfficers]
    ];
    const wsStats = XLSX.utils.aoa_to_sheet(statsData);
    
    // Add styling (header row)
    wsStats['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsStats, 'Statistics');
    
    // Schemes by HOD Sheet
    const schemesData = [
      ['Schemes by HOD', ''],
      ['', ''],
      ['HOD Name', 'Total Schemes', 'Total Budget', 'Status']
    ];
    const filteredSchemes = selectedHOD 
      ? schemesDetails.map(s => [s.hod_name || allHODs.find(h => h.id === parseInt(selectedHOD))?.name, s.name, formatCurrency(s.total_budget), s.status])
      : schemesByHOD.map(s => [s.hod_name, s.scheme_count, formatCurrency(s.total_budget), 'Active']);
    
    if (selectedHOD && schemesDetails.length > 0) {
      schemesData.push(['', '', '', '']);
      schemesData.push(['Detailed Schemes:', '', '', '']);
      schemesData.push(['Scheme Name', 'HOD', 'Budget', 'Status']);
      schemesDetails.forEach(s => {
        schemesData.push([s.name, s.hod_name || allHODs.find(h => h.id === parseInt(selectedHOD))?.name, formatCurrency(s.total_budget), s.status]);
      });
    } else {
      schemesData.push(...filteredSchemes);
    }
    
    const wsSchemes = XLSX.utils.aoa_to_sheet(schemesData);
    wsSchemes['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsSchemes, 'Schemes');
    
    // Budget by HOD Sheet
    const budgetData = [
      ['Budget by HOD', ''],
      ['', ''],
      ['HOD', 'Department', 'Allocated', 'Utilized', 'Utilization %']
    ];
    const filteredBudget = selectedHOD && budgetDetails.length > 0
      ? budgetDetails.map(b => [
          allHODs.find(h => h.id === parseInt(selectedHOD))?.name || b.hod_name,
          b.department || '',
          formatCurrency(b.allocated_amount),
          formatCurrency(b.utilized_amount),
          `${((b.utilized_amount / b.allocated_amount) * 100).toFixed(1)}%`
        ])
      : budgetByHOD.map(b => [
          b.hod_name,
          b.department,
          formatCurrency(b.allocated),
          formatCurrency(b.utilized),
          `${((b.utilized / b.allocated) * 100).toFixed(1)}%`
        ]);
    budgetData.push(...filteredBudget);
    
    const wsBudget = XLSX.utils.aoa_to_sheet(budgetData);
    wsBudget['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsBudget, 'Budget');
    
    // Attendance Summary Sheet
    const attendanceData = [
      ['Attendance Summary by HOD', ''],
      ['', ''],
      ['Department/HOD', 'Present', 'Absent', 'Half Day', 'On Leave', 'Attendance %']
    ];
    const filteredAttendance = selectedHOD && attendanceDetails.length > 0
      ? (() => {
          const summary = attendanceDetails.reduce((acc, a) => {
            acc.present = acc.present + (a.status === 'present' ? 1 : 0);
            acc.absent = acc.absent + (a.status === 'absent' ? 1 : 0);
            acc.half_day = acc.half_day + (a.status === 'half_day' ? 1 : 0);
            acc.on_leave = acc.on_leave + (a.status === 'on_leave' ? 1 : 0);
            return acc;
          }, { present: 0, absent: 0, half_day: 0, on_leave: 0 });
          const total = summary.present + summary.absent + summary.half_day + summary.on_leave;
          const percentage = total > 0 ? ((summary.present / total) * 100).toFixed(1) : 0;
          return [
            'Summary',
            summary.present,
            summary.absent,
            summary.half_day,
            summary.on_leave,
            `${percentage}%`
          ];
        })()
      : attendanceByHOD.map(a => {
          const total = a.present + a.absent + a.half_day + (a.on_leave || 0);
          const percentage = total > 0 ? ((a.present / total) * 100).toFixed(1) : 0;
          return [a.hod_name, a.present, a.absent, a.half_day, a.on_leave || 0, `${percentage}%`];
        });
    attendanceData.push(...filteredAttendance);
    
    const wsAttendance = XLSX.utils.aoa_to_sheet(attendanceData);
    wsAttendance['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsAttendance, 'Attendance');
    
    // Write file
    const fileName = `dashboard_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Pie chart for HODs by Department (like reference image)
  const hodsByDepartmentChartData = {
    labels: hodsByDepartment.map(item => {
      const count = item.count || 0;
      const countLabel = count >= 1000 ? `${(count / 1000).toFixed(0)}K` : count.toString();
      return `${item.category} (${countLabel})`;
    }),
    datasets: [{
      data: hodsByDepartment.map(item => item.count || 0),
      backgroundColor: [
        '#FFD700', // Yellow/Gold
        '#9C27B0', // Purple
        '#FF9800', // Orange
        '#00BCD4', // Teal/Cyan
        '#2196F3', // Light Blue
        '#E91E63', // Pink
        '#4CAF50', // Green
        '#F44336'  // Red
      ],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const schemesCategoryChartData = {
    labels: schemesByCategory.map(item => item.category),
    datasets: [{
      data: schemesByCategory.map(item => item.budget),
      backgroundColor: [
        '#1565c0',
        '#2e7d32',
        '#ef6c00',
        '#7b1fa2',
        '#c62828',
        '#00838f'
      ],
      borderWidth: 0
    }]
  };

  const budgetHODChartData = {
    labels: budgetByHOD.map(item => item.department),
    datasets: [
      {
        label: 'Allocated',
        data: budgetByHOD.map(item => item.allocated / 10000000),
        backgroundColor: '#1565c0',
        borderRadius: 4,
      },
      {
        label: 'Utilized',
        data: budgetByHOD.map(item => item.utilized / 10000000),
        backgroundColor: '#2e7d32',
        borderRadius: 4,
      }
    ]
  };

  // Pie chart for Schemes by HOD
  const schemesHODPieChartData = {
    labels: schemesByHOD.map(item => item.hod_name),
    datasets: [{
      data: schemesByHOD.map(item => item.scheme_count || 0),
      backgroundColor: [
        '#1565c0', // Blue
        '#2e7d32', // Green
        '#ef6c00', // Orange
        '#7b1fa2', // Purple
        '#c62828', // Red
        '#00838f', // Teal
        '#FFD700', // Gold
        '#E91E63', // Pink
        '#795548', // Brown
        '#607D8B'  // Blue Grey
      ],
      borderWidth: 2,
      borderColor: '#ffffff',
      hoverOffset: 8
    }]
  };

  // Pie chart for Budget by HOD (allocated amounts with Cr/Lakhs formatting)
  const filteredBudgetData = getFilteredBudgetData();
  const budgetHODPieChartData = {
    labels: filteredBudgetData.map(item => {
      const budget = item.allocated || 0;
      const budgetLabel = budget >= 10000000 ? `${(budget / 10000000).toFixed(1)}Cr` : 
                          budget >= 100000 ? `${(budget / 100000).toFixed(1)}L` :
                          budget >= 1000 ? `${(budget / 1000).toFixed(0)}K` : budget.toString();
      return `${item.hod_name} (${budgetLabel})`;
    }),
    datasets: [{
      data: filteredBudgetData.map(item => item.allocated || 0),
      backgroundColor: [
        '#1565c0', // Blue
        '#2e7d32', // Green
        '#ef6c00', // Orange
        '#7b1fa2', // Purple
        '#c62828', // Red
        '#00838f', // Teal
        '#FFD700', // Gold
        '#E91E63', // Pink
        '#795548', // Brown
        '#607D8B'  // Blue Grey
      ],
      borderWidth: 2,
      borderColor: '#ffffff',
      hoverOffset: 8
    }]
  };

  // Pie chart for Attendance by HOD (Present, Absent, Half Day, Late, Leave)
  const filteredAttendanceData = getFilteredAttendanceData();
  const attendanceTotalsForChart = filteredAttendanceData.reduce((acc, item) => {
    acc.present += item.present || 0;
    acc.absent += item.absent || 0;
    acc.half_day += item.half_day || 0;
    acc.late += item.late || 0;
    acc.on_leave += item.on_leave || 0;
    return acc;
  }, { present: 0, absent: 0, half_day: 0, late: 0, on_leave: 0 });

  // Calculate total staff for center text
  const totalStaffForAttendance = attendanceTotalsForChart.present + attendanceTotalsForChart.absent + 
    attendanceTotalsForChart.half_day + attendanceTotalsForChart.late + attendanceTotalsForChart.on_leave;

  const attendanceHODPieChartData = {
    labels: ['Present', 'Absent', 'Half Day', 'Late', 'Leave'],
    datasets: [{
      data: [
        attendanceTotalsForChart.present,
        attendanceTotalsForChart.absent,
        attendanceTotalsForChart.half_day,
        attendanceTotalsForChart.late,
        attendanceTotalsForChart.on_leave
      ],
      backgroundColor: [
        '#4CAF50', // Green for Present
        '#F44336', // Red for Absent
        '#FF9800', // Orange for Half Day
        '#9C27B0', // Purple for Late
        '#2196F3'  // Blue for Leave
      ],
      borderWidth: 3,
      borderColor: '#ffffff',
      hoverOffset: 10,
      // Spacing between slices
      spacing: 4,
      // Make it a donut chart
      cutout: '60%'
    }]
  };

  // Custom plugin for center text in donut chart - uses actual staff count from stats
  const centerTextPlugin = {
    id: 'centerText',
    beforeDraw: function(chart) {
      if (chart.config.type !== 'pie' && chart.config.type !== 'doughnut') return;
      
      const { ctx, width, height } = chart;
      const dataset = chart.data.datasets[0];
      
      // Only apply to donut charts (with cutout)
      if (!dataset.cutout) return;
      
      // Use actual total staff count from stats, not sum of attendance
      const totalStaffCount = stats.totalStaff || 0;
      
      ctx.save();
      
      // Calculate center position
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Draw "Total Staff" text
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillStyle = '#666';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Total Staff', centerX, centerY - 12);
      
      // Draw total number
      ctx.font = 'bold 28px "Segoe UI", sans-serif';
      ctx.fillStyle = '#333';
      ctx.fillText(totalStaffCount.toString(), centerX, centerY + 15);
      
      ctx.restore();
    }
  };

  // HOD Revenue Donut Chart Data - Dynamic colors for any number of departments
  const filteredRevenueData = getFilteredRevenueData();
  
  // Generate dynamic colors for any number of departments
  const generateDynamicColors = (count) => {
    const baseColors = [
      '#4CAF50', // Green
      '#2196F3', // Blue
      '#FF9800', // Orange
      '#9C27B0', // Purple
      '#F44336', // Red
      '#00BCD4', // Cyan
      '#FFEB3B', // Yellow
      '#E91E63', // Pink
      '#3F51B5', // Indigo
      '#009688', // Teal
      '#FF5722', // Deep Orange
      '#607D8B', // Blue Grey
      '#795548', // Brown
      '#8BC34A', // Light Green
      '#03A9F4', // Light Blue
    ];
    
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
  };

  // Calculate total revenue for center text
  const totalRevenue = filteredRevenueData.reduce((sum, item) => sum + (Number(item.total_revenue) || 0), 0);
  
  // Format revenue for display
  const formatRevenueShort = (value) => {
    if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const hodRevenueChartData = {
    labels: filteredRevenueData.map(item => item.department || item.hod_name || 'Unknown'),
    datasets: [{
      data: filteredRevenueData.map(item => Number(item.total_revenue) || 0),
      backgroundColor: generateDynamicColors(filteredRevenueData.length),
      borderWidth: 2,
      borderColor: '#ffffff',
      hoverOffset: 8,
      spacing: 2
    }]
  };

  // Donut chart for Overview Cards - HODs
  const hodsOverviewChartData = {
    labels: ['Active', 'Inactive'],
    datasets: [{
      data: [stats.activeHods || 0, (stats.totalHods || 0) - (stats.activeHods || 0)],
      backgroundColor: ['#4CAF50', '#9E9E9E'],
      borderWidth: 2,
      borderColor: '#ffffff',
      cutout: '65%'
    }]
  };

  // Donut chart for Overview Cards - Programs
  const programsOverviewChartData = {
    labels: ['Active', 'Inactive'],
    datasets: [{
      data: [stats.activePrograms || 0, stats.inactivePrograms || 0],
      backgroundColor: ['#9b23ea', '#E0E0E0'],
      borderWidth: 2,
      borderColor: '#ffffff',
      cutout: '65%'
    }]
  };

  // Donut chart for Schemes Overview - Total vs Others
  const schemesOverviewChartData = {
    labels: ['Total', 'Active', 'Inactive'],
    datasets: [{
      data: [schemesSummary.total.total || 0, schemesSummary.active.total || 0, schemesSummary.inactive.total || 0],
      backgroundColor: ['#43e97b', '#f7971e', '#5f72bd'],
      borderWidth: 2,
      borderColor: '#ffffff',
      cutout: '65%'
    }]
  };

  // Donut chart for Budget Overview
  const budgetOverviewChartData = {
    labels: ['Total Budget', 'Utilized', 'Remaining'],
    datasets: [{
      data: [
        budgetSummary.total.total || 0,
        budgetSummary.utilized.total || 0,
        budgetSummary.remaining.total || 0
      ],
      backgroundColor: ['#9b23ea', '#00b09b', '#3f87ff'],
      borderWidth: 2,
      borderColor: '#ffffff',
      cutout: '65%'
    }]
  };

  // Donut chart for Attendance Overview
  const attendanceOverviewChartData = {
    labels: ['Present', 'Absent', 'Late', 'Leave'],
    datasets: [{
      data: [
        stats.todayAttendance?.present || 0,
        stats.todayAttendance?.absent || 0,
        stats.todayAttendance?.late || 0,
        stats.todayAttendance?.onLeave || 0
      ],
      backgroundColor: ['#4CAF50', '#f44336', '#f7971e', '#00b09b'],
      borderWidth: 2,
      borderColor: '#ffffff',
      cutout: '65%'
    }]
  };

  // Overview chart options with center text
  const overviewChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 12,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 11,
            weight: '600'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 10,
        bodyFont: {
          size: 12
        },
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
      datalabels: {
        color: '#fff',
        font: {
          size: 12,
          weight: 'bold'
        },
        anchor: 'center',
        align: 'center',
        formatter: function(value, context) {
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
          return percentage > 5 ? `${percentage}%` : '';
        },
        display: function(context) {
          return context.dataset.data[context.dataIndex] > 0;
        }
      }
    }
  };

  // Custom plugin for center text in overview donut charts
  const overviewCenterTextPlugin = {
    id: 'overviewCenterText',
    afterDraw: function(chart) {
      const { ctx, chartArea, width, height } = chart;
      if (!chartArea) return;
      
      const dataset = chart.data.datasets[0];
      if (!dataset) return;
      
      const total = dataset.data.reduce((a, b) => Number(a) + Number(b), 0);
      
      ctx.save();
      const centerX = (chartArea.left + chartArea.right) / 2;
      const centerY = (chartArea.top + chartArea.bottom) / 2;
      
      // Draw total in center
      ctx.font = 'bold 22px "Segoe UI", sans-serif';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(total, centerX, centerY);
      
      ctx.restore();
    }
  };

  // Schemes donut chart data
  const filteredSchemesDataForChart = getFilteredSchemesData();
  const schemesHODChartData = {
    labels: filteredSchemesDataForChart.map(item => item.hod_name || 'Unknown'),
    datasets: [{
      data: filteredSchemesDataForChart.map(item => item.scheme_count || 0),
      backgroundColor: generateDynamicColors(filteredSchemesDataForChart.length),
      borderWidth: 2,
      borderColor: '#ffffff',
      hoverOffset: 8,
      spacing: 2,
      cutout: '60%'
    }]
  };

  // Schemes chart options with center text
  const schemesChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
            weight: '600',
            family: "'Roboto', sans-serif"
          },
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return {
                  text: `${label} - ${percentage}%`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: data.datasets[0].borderColor || '#ffffff',
                  lineWidth: data.datasets[0].borderWidth || 0,
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} schemes (${percentage}%)`;
          }
        }
      },
      datalabels: {
        color: '#fff',
        font: {
          size: 13,
          weight: 'bold',
          family: "'Segoe UI', sans-serif"
        },
        anchor: 'center',
        align: 'center',
        offset: 0,
        formatter: function(value, context) {
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
          return percentage > 3 ? `${percentage}%` : '';
        },
        display: function(context) {
          return context.dataset.data[context.dataIndex] > 0;
        }
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const element = elements[0];
        const chart = event.chart;
        const index = element.index;
        const hodName = filteredSchemesDataForChart[index]?.hod_name;
        if (hodName) {
          handleChartClick('schemesByHOD', hodName);
        }
      }
    }
  };

  // Custom plugin for center text in revenue donut chart
  const revenueCenterTextPlugin = {
    id: 'revenueCenterText',
    afterDraw: function(chart) {
      const { ctx, chartArea, width, height } = chart;
      if (!chartArea) return;
      
      const dataset = chart.data.datasets[0];
      if (!dataset) return;
      
      const total = dataset.data.reduce((a, b) => Number(a) + Number(b), 0);
      
      ctx.save();
      
      // Calculate center - use chartArea for accurate center
      const centerX = (chartArea.left + chartArea.right) / 2;
      const centerY = (chartArea.top + chartArea.bottom) / 2;
      
      // Draw "Total Revenue" text
      ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.fillStyle = '#666';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Total Revenue', centerX, centerY - 12);
      
      // Format total revenue
      const safeTotal = Number(total);

let displayValue = '₹0';
if (!isNaN(safeTotal)) {
  if (safeTotal >= 10000000) displayValue = `₹${(safeTotal / 10000000).toFixed(2)} Cr`;
  else if (safeTotal >= 100000) displayValue = `₹${(safeTotal / 100000).toFixed(2)} L`;
  else displayValue = `₹${safeTotal.toLocaleString()}`;
}

      
      // Draw total amount
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillStyle = '#333';
      ctx.fillText(displayValue, centerX, centerY + 15);
      
      ctx.restore();
    }
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return 'rgba(76, 175, 80, 0.8)'; // Green
      case 'PLANNED': return 'rgba(255, 193, 7, 0.8)';   // Yellow
      case 'ACTIVE': return 'rgba(33, 150, 243, 0.8)';   // Blue
      default: return 'rgba(158, 158, 158, 0.8)';        // Grey
    }
  };

  // Schemes HOD wise - Combined Bar and Line Chart Data
  const filteredSchemesData = getFilteredSchemesData();
  
  // When HOD is selected via chart filter, show scheme-wise data with status colors
  const isSchemeWiseView = chartFilters.schemes.hod_id && schemesDetails.length > 0;
  
  const schemesHODBarLineData = isSchemeWiseView ? {
    labels: schemesDetails.map(item => item.name?.split(' ').slice(0, 3).join(' ') || 'Unknown'),
    datasets: [
      {
        type: 'bar',
        label: 'Scheme Budget',
        data: schemesDetails.map(item => (item.total_budget || 0) / 100000), // In Lakhs
        backgroundColor: schemesDetails.map(item => getStatusColor(item.status)),
        borderRadius: 6,
        borderSkipped: false,
        yAxisID: 'y',
        order: 2
      },
      {
        type: 'line',
        label: 'Utilized Budget (L)',
        data: schemesDetails.map(item => (item.budget_utilized || 0) / 100000),
        borderColor: '#FF5722',
        backgroundColor: 'rgba(255, 87, 34, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#FF5722',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.4,
        fill: true,
        yAxisID: 'y1',
        order: 1
      }
    ]
  } : {
    labels: filteredSchemesData.map(item => item.hod_name?.split(' ').slice(0, 2).join(' ') || 'Unknown'),
    datasets: [
      {
        type: 'bar',
        label: 'Scheme Count',
        data: filteredSchemesData.map(item => item.scheme_count || 0),
        backgroundColor: [
          'rgba(21, 101, 192, 0.8)',
          'rgba(46, 125, 50, 0.8)',
          'rgba(239, 108, 0, 0.8)',
          'rgba(123, 31, 162, 0.8)',
          'rgba(198, 40, 40, 0.8)',
          'rgba(0, 131, 143, 0.8)',
          'rgba(255, 215, 0, 0.8)',
          'rgba(233, 30, 99, 0.8)'
        ],
        borderRadius: 6,
        borderSkipped: false,
        yAxisID: 'y',
        order: 2
      },
      {
        type: 'line',
        label: 'Budget Trend (Cr)',
        data: filteredSchemesData.map(item => (item.total_budget || 0) / 10000000),
        borderColor: '#FF5722',
        backgroundColor: 'rgba(255, 87, 34, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#FF5722',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.4,
        fill: true,
        yAxisID: 'y1',
        order: 1
      }
    ]
  };

  const revenueChartData = {
    labels: revenueByDepartment.map(item => item.department),
    datasets: [{
      data: revenueByDepartment.map(item => item.total_revenue),
      backgroundColor: [
        '#FFD700', // Yellow/Gold
        '#9C27B0', // Purple
        '#FF9800', // Orange
        '#00BCD4', // Teal/Cyan
        '#2196F3', // Light Blue
        '#E91E63', // Pink
        '#4CAF50', // Green
        '#F44336', // Red
        '#795548', // Brown
        '#607D8B'  // Blue Grey
      ],
      borderWidth: 2,
      borderColor: '#ffffff',
      hoverOffset: 8
    }]
  };

  // Calculate attendance totals for pie chart
  const attendanceTotals = attendanceByHOD.reduce((acc, item) => {
    acc.present += item.present || 0;
    acc.absent += item.absent || 0;
    acc.half_day += item.half_day || 0;
    acc.on_leave += item.on_leave || 0;
    return acc;
  }, { present: 0, absent: 0, half_day: 0, on_leave: 0 });

  const attendanceChartData = {
    labels: ['Present', 'Absent', 'Half Day', 'On Leave'],
    datasets: [{
      data: [
        attendanceTotals.present,
        attendanceTotals.absent,
        attendanceTotals.half_day,
        attendanceTotals.on_leave
      ],
      // backgroundColor: [
      //   '#4CAF50', // Green for present
      //   '#F44336', // Red for absent
      //   '#FF9800', // Orange for half day
      //   '#2196F3'  // Blue for on leave
      // ],
      distance:30,
      connectedWidth:1,
      connectorColor: '#555',

      // borderWidth: 3,
      // borderColor: '#ffffff',
      // hoverOffset: 8
    }]
  };

  const handleChartClick = async (chartType, clickedItem) => {
    try {
      let items = [];
      let columns = [];
      let title = '';

      if (chartType === 'hodsByDepartment') {
        // Get HODs by department
        const allHODs = await getHODs();
        const matchingHODs = allHODs.data.filter(h => h.department === clickedItem);
        items = matchingHODs.map(hod => ({
          name: hod.name,
          department: hod.department,
          email: hod.email,
          phone: hod.phone,
          status: hod.status
        }));
        title = `HODs - ${clickedItem}`;
        columns = [
          { key: 'name', label: 'HOD Name' },
          { key: 'department', label: 'Department' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' },
          { key: 'status', label: 'Status' }
        ];
      } else if (chartType === 'schemesByCategory') {
        // Get schemes by category - show HODs with schemes in this category
        const allSchemes = await getSchemesByHOD();
        items = allSchemes.data || [];
        title = `HODs with Schemes - ${clickedItem}`;
        columns = [
          { key: 'hod_name', label: 'HOD Name' },
          { key: 'department', label: 'Department' },
          { key: 'scheme_count', label: 'Schemes' },
          { key: 'total_budget', label: 'Total Budget' }
        ];
      } else if (chartType === 'budgetByHOD') {
        // Get HOD details - show all HODs in this department
        const hodData = budgetByHOD.find(h => h.department === clickedItem);
        if (hodData) {
          const allHODs = await getHODs();
          const matchingHODs = allHODs.data.filter(h => h.department === clickedItem);
          items = matchingHODs.map(hod => ({
            name: hod.name,
            department: hod.department,
            email: hod.email,
            phone: hod.phone,
            status: hod.status
          }));
          title = `HODs - ${clickedItem}`;
          columns = [
            { key: 'name', label: 'HOD Name' },
            { key: 'department', label: 'Department' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            { key: 'status', label: 'Status' }
          ];
        }
      } else if (chartType === 'revenueByDepartment') {
        // Get revenue by department - show HODs in this department
        const deptData = revenueByDepartment.find(d => d.department === clickedItem);
        if (deptData) {
          const allHODs = await getHODs();
          const matchingHODs = allHODs.data.filter(h => h.department === clickedItem);
          items = matchingHODs.map(hod => ({
            name: hod.name,
            department: hod.department,
            email: hod.email,
            phone: hod.phone
          }));
          title = `HODs in ${clickedItem} Department`;
          columns = [
            { key: 'name', label: 'HOD Name' },
            { key: 'department', label: 'Department' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' }
          ];
        }
      } else if (chartType === 'revenueByHOD') {
        // Get HOD revenue details
        const hodData = revenueByHOD.find(h => h.hod_name === clickedItem);
        if (hodData) {
          const allHODs = await getHODs();
          const hod = allHODs.data.find(h => h.name === clickedItem);
          if (hod) {
            items = [{ ...hodData, department: hod.department }];
            title = `Revenue Details - ${clickedItem}`;
            columns = [
              { key: 'hod_name', label: 'HOD Name' },
              { key: 'department', label: 'Department' },
              { key: 'total_revenue', label: 'Revenue' }
            ];
          }
        }
      } else if (chartType === 'attendanceByHOD') {
        // Get attendance details for HOD
        const hodData = attendanceByHOD.find(h => h.hod_name === clickedItem);
        if (hodData) {
          items = [hodData];
          title = `Attendance Details - ${clickedItem}`;
          columns = [
            { key: 'hod_name', label: 'HOD Name' },
            { key: 'department', label: 'Department' },
            { key: 'present', label: 'Present' },
            { key: 'absent', label: 'Absent' },
            { key: 'half_day', label: 'Half Day' },
            { key: 'on_leave', label: 'On Leave' }
          ];
        }
      } else if (chartType === 'attendanceByStatus') {
        // Get attendance list by status (Present, Absent, Half Day, Late, Leave)
        const statusMap = {
          'Present': 'present',
          'Absent': 'absent',
          'Half Day': 'half_day',
          'Late': 'late',
          'Leave': 'on_leave'
        };
        const statusKey = statusMap[clickedItem] || clickedItem.toLowerCase();
        
        try {
          const attendanceResponse = await getAttendance();
          const allAttendance = attendanceResponse.data || [];
          
          // Filter by status
          const filteredAttendance = allAttendance.filter(item => {
            if (clickedItem === 'Present') return item.status === 'present';
            if (clickedItem === 'Absent') return item.status === 'absent';
            if (clickedItem === 'Half Day') return item.status === 'half_day';
            if (clickedItem === 'Late') return item.status === 'late';
            if (clickedItem === 'Leave') return item.status === 'on_leave' || item.status === 'leave';
            return false;
          });
          
          items = filteredAttendance.map(item => ({
            staff_name: item.staff_name || item.name || 'Unknown',
            department: item.department || '-',
            date: item.date ? new Date(item.date).toLocaleDateString() : '-',
            check_in: item.check_in || '-',
            check_out: item.check_out || '-',
            status: item.status || clickedItem
          }));
          
          title = `${clickedItem} Staff List (${items.length})`;
          columns = [
            { key: 'staff_name', label: 'Staff Name' },
            { key: 'department', label: 'Department' },
            { key: 'date', label: 'Date' },
            { key: 'check_in', label: 'Check In' },
            { key: 'check_out', label: 'Check Out' }
          ];
        } catch (err) {
          console.error('Error fetching attendance by status:', err);
          items = [];
        }
      }

      if (items.length > 0) {
        setModalData({ title, items, columns });
        setModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching chart details:', error);
      alert('Error loading details. Please try again.');
    }
  };

  const formatModalItem = (item, key) => {
    if (key === 'total_budget' || key === 'total_revenue' || key === 'allocated' || key === 'utilized') {
      return formatCurrency(item[key]);
    }
    return item[key] || '-';
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 13,
            weight: '600',
            family: "'Roboto', sans-serif"
          },
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return {
                  text: `${label} - ${percentage}%`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: data.datasets[0].borderColor || '#ffffff',
                  lineWidth: data.datasets[0].borderWidth || 0,
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
          }
        }
      },
      datalabels: {
        color: '#fff',
        font: {
          size: 11,
          weight: '600'
        },
        anchor: 'center',
        align: 'center',
        formatter: function(value, context) {
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
          return percentage > 5 ? `${percentage}%` : '';
        },
        display: function(context) {
          return context.dataset.data[context.dataIndex] > 0;
        }
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const element = elements[0];
        const chart = event.chart;
        const index = element.index;
        const department = hodsByDepartment[index]?.category;
        if (department) {
          handleChartClick('hodsByDepartment', department);
        }
      }
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              if (context.dataset.label === 'Allocated' || context.dataset.label === 'Utilized') {
                label += formatCurrency(context.parsed.y * 10000000);
              } else {
                label += formatCurrency(context.parsed);
              }
            }
            return label;
          }
        }
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const element = elements[0];
        const chart = event.chart;
        const label = chart.data.labels[element.index];
        handleChartClick('schemesByCategory', label);
      }
    }
  };

  const barOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        ...chartOptions.plugins.legend,
        position: 'top'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (context.dataset.label === 'Allocated' || context.dataset.label === 'Utilized') {
                label += formatCurrency(context.parsed.y * 10000000);
              } else {
                label += context.parsed.y;
              }
            }
            return label;
          }
        }
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const element = elements[0];
        const chart = event.chart;
        const label = chart.data.labels[element.index];
        handleChartClick('budgetByHOD', label);
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.05)'
        },
        title: {
          display: true,
          text: 'Amount (Cr)',
          font: { size: 11 }
        },
        ticks: {
          callback: function(value) {
            return formatCurrency(value * 10000000);
          }
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  // Schemes Bar + Line Chart Options
  const schemesBarLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 15,
          usePointStyle: true,
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.dataset.type === 'line') {
              label += formatCurrency(context.parsed.y * 10000000);
            } else {
              label += context.parsed.y + ' schemes';
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Scheme Count',
          font: { size: 11, weight: '600' }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.06)'
        },
        ticks: {
          stepSize: 1
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Budget (Cr)',
          font: { size: 11, weight: '600' }
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function(value) {
            return '₹' + value + 'Cr';
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: { size: 10 },
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  };

  // HOD Revenue Donut Chart Options with center text and amount labels
  const hodRevenuePieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '55%',
    layout: {
      padding: {
        top: 5,
        bottom: 5,
        left: 5,
        right: 5
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'right',
        align: 'start',
        maxHeight: 350,
        labels: {
          padding: 5,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          font: {
            size: 9,
            weight: '500'
          },
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              const total = data.datasets[0].data.reduce((a, b) => Number(a) + Number(b), 0);
              return data.labels.map((label, i) => {
                const value = Number(data.datasets[0].data[i]) || 0;
                const percentage = total > 0 ? (value / total) * 100 : 0;
                const pctText = percentage > 0 && percentage < 1 ? '<1' : percentage.toFixed(0);
                return {
                  text: `${label} (${pctText}% • ₹${formatRevenueShort(value)})`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: '#ffffff',
                  lineWidth: 0,
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        callbacks: {
          label: function(context) {
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => Number(a) + Number(b), 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `Revenue: ₹${formatRevenueShort(value)} (${percentage}%)`;
          }
        }
      },
      datalabels: {
        color: function(context) {
          const bg = context?.dataset?.backgroundColor?.[context.dataIndex];
          if (typeof bg !== 'string' || !bg.startsWith('#') || (bg.length !== 7 && bg.length !== 4)) return '#fff';

          const hex = bg.length === 4
            ? `#${bg[1]}${bg[1]}${bg[2]}${bg[2]}${bg[3]}${bg[3]}`
            : bg;

          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          return luminance > 0.7 ? '#333' : '#fff';
        },
        font: {
          size: 12,
          weight: 'bold',
          family: "'Segoe UI', sans-serif"
        },
        anchor: 'center',
        align: 'center',
        offset: 0,
        formatter: function(value, context) {
          const total = context.dataset.data.reduce((a, b) => Number(a) + Number(b), 0);
          const percentage = total > 0 ? (Number(value) / total) * 100 : 0;
          if (percentage <= 0) return '';
          if (percentage < 1) return '<1%';
          return `${percentage.toFixed(0)}%`;
        },
        display: function(context) {
          return (Number(context.dataset.data[context.dataIndex]) || 0) > 0;
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const element = elements[0];
        const index = element.index;
        const hodName = filteredRevenueData[index]?.hod_name;
        if (hodName) {
          handleChartClick('revenueByHOD', hodName);
        }
      }
    }
  };

  // Attendance Donut Chart Options with center text and percentage labels
  const attendancePieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 30,
        bottom: 30,
        left: 30,
        right: 30
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
            weight: '600'
          },
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: '#ffffff',
                  lineWidth: 0,
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        callbacks: {
          label: function(context) {
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `Count: ${value} (${percentage}%)`;
          }
        }
      },
      datalabels: {
        color: '#fff',
        font: {
          size: 13,
          weight: 'bold',
          family: "'Segoe UI', sans-serif"
        },
        anchor: 'center',
        align: 'center',
        offset: 0,
        formatter: function(value, context) {
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
          // Only show percentage if it's significant enough (> 3%)
          return percentage > 3 ? `${percentage}%` : '';
        },
        display: function(context) {
          return context.dataset.data[context.dataIndex] > 0;
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 3,
        borderColor: '#ffffff'
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const element = elements[0];
        const index = element.index;
        const statusLabels = ['Present', 'Absent', 'Half Day', 'Late', 'Leave'];
        const clickedStatus = statusLabels[index];
        if (clickedStatus) {
          handleChartClick('attendanceByStatus', clickedStatus);
        }
      }
    }
  };

  // Custom plugin to draw connector lines for attendance pie chart
  const connectorLinesPlugin = {
    id: 'connectorLines',
    afterDraw: function(chart) {
      const ctx = chart.ctx;
      const meta = chart.getDatasetMeta(0);
      
      if (!meta || !meta.data) return;
      
      meta.data.forEach((arc, index) => {
        if (chart.data.datasets[0].data[index] <= 0) return;
        
        const centerX = arc.x;
        const centerY = arc.y;
        const outerRadius = arc.outerRadius;
        const startAngle = arc.startAngle;
        const endAngle = arc.endAngle;
        const middleAngle = (startAngle + endAngle) / 2;
        
        // Calculate points for the connector line - start from edge of pie
        const innerPointX = centerX + Math.cos(middleAngle) * outerRadius;
        const innerPointY = centerY + Math.sin(middleAngle) * outerRadius;
        
        // Extend line further out (outerRadius + 30)
        const outerPointX = centerX + Math.cos(middleAngle) * (outerRadius + 30);
        const outerPointY = centerY + Math.sin(middleAngle) * (outerRadius + 30);
        
        // Get color from dataset
        const color = chart.data.datasets[0].backgroundColor[index];
        
        // Draw the connector line
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(innerPointX, innerPointY);
        ctx.lineTo(outerPointX, outerPointY);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw small arrow/dot at the end
        ctx.beginPath();
        ctx.arc(outerPointX, outerPointY, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
      });
    }
  };

  const revenueChartOptions = {
    ...pieChartOptions,
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const element = elements[0];
        const chart = event.chart;
        const index = element.index;
        const department = revenueByDepartment[index]?.department;
        if (department) {
          handleChartClick('revenueByDepartment', department);
        }
      }
    }
  };

  // Budget Status Chart - Utilized vs Remaining
  const budgetStatusChartData = {
    labels: ['Utilized', 'Remaining'],
    datasets: [{
      data: [
        budgetSummary?.utilized?.total || 0,
        budgetSummary?.remaining?.total || 0
      ],
      backgroundColor: ['#26A69A', '#42A5F5'],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  // Custom plugin for Budget Status center text
  const budgetStatusCenterTextPlugin = {
    id: 'budgetStatusCenterText',
    afterDraw: function(chart) {
      const { ctx, chartArea, width, height } = chart;
      if (!chartArea) return;
      
      const dataset = chart.data.datasets[0];
      if (!dataset) return;
      
      const total = dataset.data.reduce((a, b) => Number(a) + Number(b), 0);
      
      ctx.save();
      
      // Calculate center - use chartArea for accurate center
      const centerX = (chartArea.left + chartArea.right) / 2;
      const centerY = (chartArea.top + chartArea.bottom) / 2;
      
      // Format total budget
      let displayValue = '₹0';
      const safeTotal = Number(total);
      if (!isNaN(safeTotal)) {
        if (safeTotal >= 10000000) displayValue = `₹${(safeTotal / 10000000).toFixed(2)} Cr`;
        else if (safeTotal >= 100000) displayValue = `₹${(safeTotal / 100000).toFixed(2)} L`;
        else displayValue = `₹${safeTotal.toLocaleString()}`;
      }
      
      // Draw "Total Budget" text
      ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.fillStyle = '#666';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Total Budget', centerX, centerY - 10);
      
      // Draw total amount
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillStyle = '#333';
      ctx.fillText(displayValue, centerX, centerY + 12);
      
      ctx.restore();
    }
  };

  // Attendance Today Bar Chart Data
  const attendanceTodayChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [{
      label: 'Present',
      data: [stats?.todayAttendance?.present || 0, stats?.todayAttendance?.present || 0, stats?.todayAttendance?.present || 0, stats?.todayAttendance?.present || 0, stats?.todayAttendance?.present || 0],
      backgroundColor: '#9C27B0',
      borderRadius: 4,
      borderSkipped: false
    }, {
      label: 'Absent',
      data: [stats?.todayAttendance?.absent || 0, stats?.todayAttendance?.absent || 0, stats?.todayAttendance?.absent || 0, stats?.todayAttendance?.absent || 0, stats?.todayAttendance?.absent || 0],
      backgroundColor: '#EF5350',
      borderRadius: 4,
      borderSkipped: false
    }, {
      label: 'Late',
      data: [stats?.todayAttendance?.late || 0, stats?.todayAttendance?.late || 0, stats?.todayAttendance?.late || 0, stats?.todayAttendance?.late || 0, stats?.todayAttendance?.late || 0],
      backgroundColor: '#FFA500',
      borderRadius: 4,
      borderSkipped: false
    }, {
      label: 'Leave',
      data: [stats?.todayAttendance?.onLeave || 0, stats?.todayAttendance?.onLeave || 0, stats?.todayAttendance?.onLeave || 0, stats?.todayAttendance?.onLeave || 0, stats?.todayAttendance?.onLeave || 0],
      backgroundColor: '#26A69A',
      borderRadius: 4,
      borderSkipped: false
    }]
  };

  // Schemes Status Bar Chart Data
  const schemesStatusChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [{
      label: 'Infrastructure',
      data: [3, 3, 3, 3, 3],
      backgroundColor: '#26A69A',
      borderRadius: 4,
      borderSkipped: false
    }, {
      label: 'Education',
      data: [2, 2, 2, 2, 2],
      backgroundColor: '#EF5350',
      borderRadius: 4,
      borderSkipped: false
    }, {
      label: 'Healthcare',
      data: [1, 1, 1, 1, 1],
      backgroundColor: '#FF6B6B',
      borderRadius: 4,
      borderSkipped: false
    }, {
      label: 'Others',
      data: [2, 2, 2, 2, 2],
      backgroundColor: '#FFB74D',
      borderRadius: 4,
      borderSkipped: false
    }]
  };

  // Bar Chart Options
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'x',
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 15,
          usePointStyle: true,
          font: {
            size: 12,
            weight: '600'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 10,
        font: {
          size: 12
        },
        cornerRadius: 4
      },
      datalabels: {
        display: false
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.05)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  };

  // Budget Breakdown Chart Data - Updated categories
  const budgetBreakdownChartData = {
    labels: ['Estimated', 'Central and State', 'Sanction', 'Pending', 'Utilization'],
    datasets: [{
      data: [
        budgetSummary?.estimated?.total || 0,
        budgetSummary?.centralAndState?.total || 0,
        budgetSummary?.sanction?.total || 0,
        budgetSummary?.pending?.total || 0,
        budgetSummary?.utilized?.total || 0
      ],
      backgroundColor: ['#FFB74D', '#26A69A', '#2196F3', '#FF6B6B', '#66BB6A'],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ padding: '16px', backgroundColor: '#f0f3f7', minHeight: '100vh' }}>

      {/* Section 1: Quick Stats - Single Row with 5 Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        
        {/* Total HODs Card */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '10px',
          padding: '10px',
          color: '#fff',
          boxShadow: '0 2px 6px rgba(102, 126, 234, 0.12)',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onClick={() => navigate('/hods')}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 6px rgba(102, 126, 234, 0.12)';
        }}>
          <p style={{ margin: '0 0 2px 0', fontSize: '8px', fontWeight: '500', opacity: '0.9', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Total HODs</p>
          <h2 style={{ margin: '0', fontSize: '18px', fontWeight: '700' }}>{stats?.totalHods || 0}</h2>
          <p style={{ margin: '2px 0 0 0', fontSize: '8px', opacity: '0.85' }}>{stats?.activeHods || 0} Active</p>
        </div>

        {/* Flagship Programmes Card */}
        <div style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          borderRadius: '10px',
          padding: '10px',
          color: '#fff',
          boxShadow: '0 2px 6px rgba(245, 87, 108, 0.12)',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onClick={() => navigate('/flagship-programmes')}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 87, 108, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 6px rgba(245, 87, 108, 0.12)';
        }}>
          <p style={{ margin: '0 0 2px 0', fontSize: '8px', fontWeight: '500', opacity: '0.9', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Flagship Programmes</p>
          <h2 style={{ margin: '0', fontSize: '18px', fontWeight: '700' }}>{stats?.totalPrograms || 0}</h2>
          <p style={{ margin: '2px 0 0 0', fontSize: '8px', opacity: '0.85' }}>{stats?.activePrograms || 0} Active</p>
        </div>

        {/* Total Budget Card */}
        <div style={{
          background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
          borderRadius: '10px',
          padding: '10px',
          color: '#fff',
          boxShadow: '0 2px 6px rgba(156, 39, 176, 0.12)',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onClick={() => navigate('/budget')}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(156, 39, 176, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 6px rgba(156, 39, 176, 0.12)';
        }}>
          <p style={{ margin: '0 0 2px 0', fontSize: '8px', fontWeight: '500', opacity: '0.95', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Total Budget</p>
          <h3 style={{ margin: '0', fontSize: '15px', fontWeight: '700' }}>₹{((budgetSummary?.total?.total || 0) / 10000000).toFixed(1)} Cr</h3>
        </div>

        {/* Budget Utilized Card */}
        <div style={{
          background: 'linear-gradient(135deg, #26A69A 0%, #4DB6AC 100%)',
          borderRadius: '10px',
          padding: '10px',
          color: '#fff',
          boxShadow: '0 2px 6px rgba(38, 166, 154, 0.12)',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onClick={() => navigate('/budget')}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(38, 166, 154, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 6px rgba(38, 166, 154, 0.12)';
        }}>
          <p style={{ margin: '0 0 2px 0', fontSize: '8px', fontWeight: '500', opacity: '0.95', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Utilized</p>
          <h3 style={{ margin: '0', fontSize: '15px', fontWeight: '700' }}>₹{((budgetSummary?.utilized?.total || 0) / 10000000).toFixed(1)} Cr</h3>
        </div>

        {/* Budget Remaining Card */}
        <div style={{
          background: 'linear-gradient(135deg, #42A5F5 0%, #1E88E5 100%)',
          borderRadius: '10px',
          padding: '10px',
          color: '#fff',
          boxShadow: '0 2px 6px rgba(66, 165, 245, 0.12)',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onClick={() => navigate('/budget')}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(66, 165, 245, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 6px rgba(66, 165, 245, 0.12)';
        }}>
          <p style={{ margin: '0 0 2px 0', fontSize: '8px', fontWeight: '500', opacity: '0.95', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Remaining</p>
          <h3 style={{ margin: '0', fontSize: '15px', fontWeight: '700' }}>₹{((budgetSummary?.remaining?.total || 0) / 10000000).toFixed(1)} Cr</h3>
        </div>
      </div>

      {/* Section 3: Budget Overview */}
      <div style={{ marginBottom: '12px' }}>


        {/* Budget Chart Section */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Budget Breakdown Chart */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '600', color: '#333' }}>Budget Breakdown</h4>
              <div style={{ height: '250px' }}>
                <Pie data={budgetBreakdownChartData} options={pieChartOptions} />
              </div>
            </div>

            {/* Budget Utilized vs Remaining */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '600', color: '#333' }}>Budget Status</h4>
              <div style={{ height: '250px' }}>
                <Doughnut data={budgetStatusChartData} options={{
                  ...pieChartOptions,
                  plugins: {
                    ...pieChartOptions.plugins,
                    centerText: true
                  }
                }} plugins={[budgetStatusCenterTextPlugin]} />
              </div>
            </div>
          </div>
        </div>

        {/* Schemes Chart Section */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginTop: '16px' }}>

          {/* Schemes Overview Chart */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            {/* Schemes Bar Chart - Total, Active, Inactive */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '600', color: '#333' }}>Schemes Overview</h4>
              <div style={{ height: '180px' }}>
                <Bar data={{
                  labels: ['Total', 'Active', 'Inactive'],
                  datasets: [{
                    label: 'Schemes Count',
                    data: [
                      stats?.totalSchemes || 0,
                      stats?.activeSchemes || 0,
                      (stats?.totalSchemes || 0) - (stats?.activeSchemes || 0)
                    ],
                    backgroundColor: ['#667eea', '#26A69A', '#FF9800'],
                    borderRadius: 6,
                    borderSkipped: false,
                    hoverBackgroundColor: ['#5568d3', '#1e9b8a', '#e68900']
                  }]
                }} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: 'y',
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      padding: 12,
                      titleFont: { size: 14, weight: 'bold' },
                      bodyFont: { size: 13 },
                      callbacks: {
                        label: function(context) {
                          const value = context.parsed.x || 0;
                          return `Count: ${value}`;
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(0,0,0,0.05)'
                      },
                      ticks: {
                        stepSize: 1
                      }
                    },
                    y: {
                      grid: {
                        display: false
                      }
                    }
                  },
                  onClick: (event, elements) => {
                    if (elements.length > 0) {
                      const element = elements[0];
                      const label = ['Total', 'Active', 'Inactive'][element.index];
                      
                      let items = [];
                      let columns = [];
                      let title = '';
                      
                      // Fetch schemes data from API
                      if (label === 'Total') {
                        // Show all schemes
                        items = schemesByHOD.map(item => ({
                          hod_name: item.hod_name || 'Unknown',
                          scheme_count: item.scheme_count || 0,
                          total_budget: item.total_budget || 0,
                          status: 'All'
                        }));
                        title = 'Total Schemes';
                        columns = [
                          { key: 'hod_name', label: 'HOD Name' },
                          { key: 'scheme_count', label: 'Scheme Count' },
                          { key: 'total_budget', label: 'Total Budget' }
                        ];
                      } else if (label === 'Active') {
                        // Show only active schemes
                        items = schemesByHOD.map(item => ({
                          hod_name: item.hod_name || 'Unknown',
                          scheme_count: item.scheme_count || 0,
                          total_budget: item.total_budget || 0,
                          status: 'Active'
                        }));
                        title = 'Active Schemes';
                        columns = [
                          { key: 'hod_name', label: 'HOD Name' },
                          { key: 'scheme_count', label: 'Scheme Count' },
                          { key: 'total_budget', label: 'Total Budget' }
                        ];
                      } else if (label === 'Inactive') {
                        // Calculate inactive schemes
                        const inactiveCount = (stats?.totalSchemes || 0) - (stats?.activeSchemes || 0);
                        
                        // Show message about inactive schemes
                        items = [{
                          hod_name: 'Total Inactive Schemes',
                          scheme_count: inactiveCount,
                          total_budget: 'View in Schemes page for details',
                          status: 'Inactive'
                        }];
                        title = 'Inactive Schemes';
                        columns = [
                          { key: 'hod_name', label: 'Description' },
                          { key: 'scheme_count', label: 'Count' },
                          { key: 'total_budget', label: 'Details' }
                        ];
                      }
                      
                      if (items.length > 0) {
                        setModalData({ title, items, columns });
                        setModalOpen(true);
                      }
                    }
                  }
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Charts - 2x2 Grid Layout */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          marginBottom: '12px',
          paddingLeft: '0px'
        }}>
          <FiBarChart2 size={24} style={{ color: '#2196F3', fontWeight: 'bold' }} />
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1a1a2e' }}>Analytics & Charts</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Chart 1: HOD Revenue - Donut Chart */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
            overflow: 'hidden'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiPieChart size={16} style={{ color: '#9b23ea' }} /> 
                HOD Revenue 
                {chartFilters.revenue.hod_id && <span style={{ fontSize: '11px', color: '#666', fontWeight: 'normal' }}>({allHODs.find(h => h.id === parseInt(chartFilters.revenue.hod_id))?.name})</span>}
              </h3>
              <div style={{ position: 'relative' }}>
                <FiFilter 
                  style={{ cursor: 'pointer', color: chartFilters.revenue.hod_id ? '#2e7d32' : '#666', fontSize: '16px' }} 
                  title="Filter" 
                  onClick={(e) => { e.stopPropagation(); toggleFilterDropdown('revenue'); }}
                />
                {renderFilterDropdown('revenue')}
              </div>
            </div>
            <div style={{ padding: '14px', height: '260px' }}>
              <Doughnut data={hodRevenueChartData} options={hodRevenuePieOptions} plugins={[ChartDataLabels, revenueCenterTextPlugin]} />
            </div>
          </div>

          {/* Chart 2: Schemes (HOD wise) - Donut Chart */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
            overflow: 'hidden'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiPieChart size={16} style={{ color: '#2196F3' }} />
                Schemes (HOD wise) 
                {chartFilters.schemes.hod_id && <span style={{ fontSize: '11px', color: '#666', fontWeight: 'normal' }}>({allHODs.find(h => h.id === parseInt(chartFilters.schemes.hod_id))?.name})</span>}
              </h3>
              <div style={{ position: 'relative' }}>
                <FiFilter 
                  style={{ cursor: 'pointer', color: chartFilters.schemes.hod_id ? '#2e7d32' : '#666', fontSize: '16px' }} 
                  title="Filter" 
                  onClick={(e) => { e.stopPropagation(); toggleFilterDropdown('schemes'); }}
                />
                {renderFilterDropdown('schemes')}
              </div>
            </div>
            <div style={{ padding: '14px', height: '260px' }}>
              <Doughnut data={schemesHODChartData} options={schemesChartOptions} plugins={[ChartDataLabels]} />
            </div>
          </div>

          {/* Chart 3: Budget (HOD wise) */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
            overflow: 'hidden'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiPieChart size={16} style={{ color: '#00b09b' }} /> 
                Budget (HOD wise) 
                {chartFilters.budget.hod_id && <span style={{ fontSize: '11px', color: '#666', fontWeight: 'normal' }}>({allHODs.find(h => h.id === parseInt(chartFilters.budget.hod_id))?.name})</span>}
              </h3>
              <div style={{ position: 'relative' }}>
                <FiFilter 
                  style={{ cursor: 'pointer', color: chartFilters.budget.hod_id ? '#2e7d32' : '#666', fontSize: '16px' }} 
                  title="Filter" 
                  onClick={(e) => { e.stopPropagation(); toggleFilterDropdown('budget'); }}
                />
                {renderFilterDropdown('budget')}
              </div>
            </div>
            <div style={{ padding: '14px', height: '310px' }}>
              <Doughnut data={budgetHODPieChartData} options={pieChartOptions} plugins={[ChartDataLabels, centerTextPlugin]} />
            </div>
          </div>

          {/* Chart 4: Attendance (HOD wise) - Donut Chart */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
            overflow: 'hidden'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiPieChart size={16} style={{ color: '#f39c12' }} /> 
                Attendance (HOD wise) 
                {chartFilters.attendance.hod_id && <span style={{ fontSize: '11px', color: '#666', fontWeight: 'normal' }}>({allHODs.find(h => h.id === parseInt(chartFilters.attendance.hod_id))?.name})</span>}
              </h3>
              <div style={{ position: 'relative' }}>
                <FiFilter 
                  style={{ cursor: 'pointer', color: chartFilters.attendance.hod_id ? '#2e7d32' : '#666', fontSize: '16px' }} 
                  title="Filter" 
                  onClick={(e) => { e.stopPropagation(); toggleFilterDropdown('attendance'); }}
                />
                {renderFilterDropdown('attendance')}
              </div>
            </div>
            <div style={{ padding: '14px', height: '310px' }}>
              <Pie data={attendanceHODPieChartData} options={attendancePieOptions} plugins={[ChartDataLabels, centerTextPlugin]} />
            </div>
          </div>
        </div>
      </div>

      {/* Modal for detailed views */}
      <ListModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalData.title}
        items={modalData.items}
        columns={modalData.columns}
        formatItem={formatModalItem}
      />
    </div>
  );
};

export default Dashboard;

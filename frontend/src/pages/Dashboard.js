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
import { FiUsers, FiFileText, FiTrendingUp, FiActivity, FiPieChart, FiBarChart2, FiFilter, FiClock, FiMapPin, FiUserCheck } from 'react-icons/fi';
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
          return [[
            allHODs.find(h => h.id === parseInt(selectedHOD))?.name || 'Selected HOD',
            summary.present,
            summary.absent,
            summary.half_day,
            summary.on_leave,
            `${percentage}%`
          ]];
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

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* <Header 
        title="Dashboard" 
        subtitle="Welcome to HOD Management System" 
        onRefresh={handleRefresh}
        onExport={handleExport}
      /> */}

      {/* Filter Bar - Commented out
      <div className="filter-bar">
        <div className="filter-item">
          <label>HOD</label>
          <select 
            value={selectedHOD} 
            onChange={(e) => {
              setSelectedHOD(e.target.value);
              setFilters({ ...filters, hod_id: e.target.value });
            }}
          >
            <option value="">All HODs</option>
            {allHODs.map(hod => (
              <option key={hod.id} value={hod.id}>{hod.name} - {hod.department}</option>
            ))}
          </select>
        </div>
        <div className="filter-item">
          <label>Year</label>
          <select value={filters.year} onChange={(e) => { const nf = {...filters, year: e.target.value}; setFilters(nf); fetchDashboardData(nf); }}>
            <option>All</option>
            <option>2023</option>
            <option>2024</option>
            <option>2025</option>
          </select>
        </div>
        <div className="filter-item">
          <label>Month</label>
          <select value={filters.month} onChange={(e) => { const nf = {...filters, month: e.target.value}; setFilters(nf); }}>
            <option>All</option>
            <option value="1">Jan</option>
            <option value="2">Feb</option>
            <option value="3">Mar</option>
            <option value="4">Apr</option>
            <option value="5">May</option>
            <option value="6">Jun</option>
            <option value="7">Jul</option>
            <option value="8">Aug</option>
            <option value="9">Sep</option>
            <option value="10">Oct</option>
            <option value="11">Nov</option>
            <option value="12">Dec</option>
          </select>
        </div>
        <div className="filter-item">
          <label>Date</label>
          <input type="date" value={filters.date} onChange={(e) => { const nf = {...filters, date: e.target.value}; setFilters(nf); }} />
        </div>
        <div className="filter-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => { 
            setSelectedHOD('');
            setSelectedHODTable({ schemes: '', budget: '', attendance: '' });
            setFilters({ year: 'All', month: 'All', date: '', hod_id: '' }); 
            fetchDashboardData({ year: 'All', month: 'All', date: '', hod_id: '' });
            setSchemesDetails([]);
            setBudgetDetails([]);
            setAttendanceDetails([]);
          }}>Clear</button>
          <button className="btn btn-primary btn-sm" onClick={() => fetchDashboardData()}>Apply</button>
        </div>
      </div>
      */}

      {/* Hero Stats (top big cards like reference) */}
      {/* <div className="hero-stats">
        <div className="hero-card">
          <div className="hero-number purple">{formatCompactNumber(stats.totalHods)}</div>
          <div className="hero-label">HODs</div>
        </div>
        <div className="hero-card">
          <div className="hero-number green">{formatCompactNumber(quickStats.districtsCovered)}</div>
          <div className="hero-label">District</div>
        </div>
        <div className="hero-card">
          <div className="hero-number red">{formatCompactNumber(quickStats.beneficiaries)}</div>
          <div className="hero-label">Total Farmers</div>
        </div>
        <div className="hero-card">
          <div className="hero-number purple">{formatCurrency(stats.totalBudget)}</div>
          <div className="hero-label">Total Budget</div>
        </div>
        <div className="hero-card">
          <div className="hero-number blue">{formatCompactNumber(stats.totalSchemes)}</div>
          <div className="hero-label">Nursery</div>
        </div>
        <div className="hero-card">
          <div className="hero-number teal">{formatCompactNumber(quickStats.nodalOfficers)}</div>
          <div className="hero-label">Nodal Officers</div>
        </div>
      </div> */}

      {/* Stats Cards */}
      <div className="dashboard-top-row">
        <div className="dashboard-top-left">
          <div className="dashboard-mini-tiles">
            <div className="dashboard-mini-tile" style={{ '--from': '#3f87ff', '--to': '#22c1c3' }} onClick={() => navigate('/hods')}>
              <div className="dashboard-tile-content">
                <div className="dashboard-tile-label">Total HODs</div>
                <div className="dashboard-tile-value">{stats.totalHods || 0}</div>
                <div className="dashboard-tile-sub">{stats.activeHods || 0} Active • {(stats.totalHods || 0) - (stats.activeHods || 0)} Inactive</div>
              </div>
              <div className="dashboard-tile-icon" aria-hidden="true"><FiUsers /></div>
            </div>

            <div className="dashboard-mini-tile" style={{ '--from': '#5f72bd', '--to': '#9b23ea' }} onClick={() => navigate('/flagship-programmes')}>
              <div className="dashboard-tile-content">
                <div className="dashboard-tile-label">Flagship Programmes</div>
                <div className="dashboard-tile-value">{stats.totalPrograms || 0}</div>
                <div className="dashboard-tile-sub">{stats.activePrograms || 0} Active • {stats.inactivePrograms || 0} Inactive</div>
              </div>
              <div className="dashboard-tile-icon" aria-hidden="true"><FiActivity /></div>
            </div>
          </div>
        </div>

        {/* Schemes Summary (Central/State) - right of HOD */}
        <div className="dashboard-top-right">
          <div className="schemes-summary-section">
            <div className="schemes-summary-title">Schemes</div>
            <div className="schemes-summary-cards">
              <div className="schemes-summary-card" style={{ '--from': '#43e97b', '--to': '#38f9d7' }} onClick={() => navigate(`/schemes?filterType=central-sponsored-scheme&year=${encodeURIComponent(schemesSummary.year)}`)}>
                <div className="dashboard-tile-content">
                  <div className="dashboard-tile-label">Total Schemes</div>
                  <div className="dashboard-tile-value">{schemesSummary.total.total}</div>
                  <div className="dashboard-tile-sub">{formatCSBreakdown(schemesSummary.total.central, schemesSummary.total.state)}</div>
                </div>
                <div className="dashboard-tile-icon" aria-hidden="true"><FiFileText /></div>
              </div>

              <div className="schemes-summary-card" style={{ '--from': '#f7971e', '--to': '#ffd200' }} onClick={() => navigate(`/schemes?filterType=central-sponsored-scheme&year=${encodeURIComponent(schemesSummary.year)}`)}>
                <div className="dashboard-tile-content">
                  <div className="dashboard-tile-label">Active Schemes</div>
                  <div className="dashboard-tile-value">{schemesSummary.active.total}</div>
                  <div className="dashboard-tile-sub">{formatCSBreakdown(schemesSummary.active.central, schemesSummary.active.state)}</div>
                </div>
                <div className="dashboard-tile-icon" aria-hidden="true"><FiActivity /></div>
              </div>

              <div className="schemes-summary-card" style={{ '--from': '#5f72bd', '--to': '#9b23ea' }} onClick={() => navigate(`/schemes?filterType=central-sponsored-scheme&year=${encodeURIComponent(schemesSummary.year)}`)}>
                <div className="dashboard-tile-content">
                  <div className="dashboard-tile-label">Inactive Scheme</div>
                  <div className="dashboard-tile-value">{schemesSummary.inactive.total}</div>
                  <div className="dashboard-tile-sub">{formatCSBreakdown(schemesSummary.inactive.central, schemesSummary.inactive.state)}</div>
                </div>
                <div className="dashboard-tile-icon" aria-hidden="true"><FiClock /></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Summary (Today) */}
      <div className="attendance-summary-section">
        <div className="attendance-summary-title">Attendance (Today)</div>
        <div className="attendance-summary-cards">
          <div className="attendance-summary-card" style={{ '--from': '#3f87ff', '--to': '#22c1c3' }} onClick={() => navigate('/staff')}>
            <div className="dashboard-tile-content">
              <div className="dashboard-tile-label">Total Emp</div>
              <div className="dashboard-tile-value">{stats.totalStaff || 0}</div>
              <div className="dashboard-tile-sub">{formatPercent(stats.totalStaff || 0, stats.totalStaff || 0)}</div>
            </div>
            <div className="dashboard-tile-icon" aria-hidden="true"><FiUsers /></div>
          </div>

          <div className="attendance-summary-card" style={{ '--from': '#43e97b', '--to': '#38f9d7' }} onClick={() => navigate('/attendance?period=today') }>
            <div className="dashboard-tile-content">
              <div className="dashboard-tile-label">Present</div>
              <div className="dashboard-tile-value">{stats.todayAttendance?.present || 0}</div>
              <div className="dashboard-tile-sub">{formatPercent(stats.todayAttendance?.present || 0, stats.totalStaff || 0)}</div>
            </div>
            <div className="dashboard-tile-icon" aria-hidden="true"><FiUserCheck /></div>
          </div>

          <div className="attendance-summary-card" style={{ '--from': '#ff416c', '--to': '#ff4b2b' }} onClick={() => navigate('/attendance?period=today') }>
            <div className="dashboard-tile-content">
              <div className="dashboard-tile-label">Absent</div>
              <div className="dashboard-tile-value">{stats.todayAttendance?.absent || 0}</div>
              <div className="dashboard-tile-sub">{formatPercent(stats.todayAttendance?.absent || 0, stats.totalStaff || 0)}</div>
            </div>
            <div className="dashboard-tile-icon" aria-hidden="true"><FiActivity /></div>
          </div>

          <div className="attendance-summary-card" style={{ '--from': '#f7971e', '--to': '#ffd200' }} onClick={() => navigate('/attendance?period=today') }>
            <div className="dashboard-tile-content">
              <div className="dashboard-tile-label">Late (after 10:30)</div>
              <div className="dashboard-tile-value">{stats.todayAttendance?.late || 0}</div>
              <div className="dashboard-tile-sub">{formatPercent(stats.todayAttendance?.late || 0, stats.totalStaff || 0)}</div>
            </div>
            <div className="dashboard-tile-icon" aria-hidden="true"><FiClock /></div>
          </div>

          <div className="attendance-summary-card" style={{ '--from': '#00b09b', '--to': '#96c93d' }} onClick={() => navigate('/attendance?period=today') }>
            <div className="dashboard-tile-content">
              <div className="dashboard-tile-label">Emp Leave</div>
              <div className="dashboard-tile-value">{stats.todayAttendance?.onLeave || 0}</div>
              <div className="dashboard-tile-sub">{formatPercent(stats.todayAttendance?.onLeave || 0, stats.totalStaff || 0)}</div>
            </div>
            <div className="dashboard-tile-icon" aria-hidden="true"><FiMapPin /></div>
          </div>
        </div>
      </div>

      {/* Budget Summary (Central/State) */}
      <div className="budget-summary-section">
        <div className="budget-summary-title">Budget</div>
        <div className="budget-summary-cards">
          <div className="budget-summary-card" style={{ '--from': '#9b23ea', '--to': '#5f72bd' }} onClick={() => navigate('/budget')}>
            <div className="dashboard-tile-content">
              <div className="dashboard-tile-label">Total Budget</div>
              <div className="dashboard-tile-value">{formatCurrency(budgetSummary.total.total)}</div>
              <div className="dashboard-tile-sub">{formatCSBudgetBreakdown(budgetSummary.total.central, budgetSummary.total.state)}</div>
            </div>
            <div className="dashboard-tile-icon" aria-hidden="true"><BiRupee /></div>
          </div>

          <div className="budget-summary-card" style={{ '--from': '#00b09b', '--to': '#96c93d' }} onClick={() => navigate('/budget')}>
            <div className="dashboard-tile-content">
              <div className="dashboard-tile-label">Budget Utilized</div>
              <div className="dashboard-tile-value">{formatCurrency(budgetSummary.utilized.total)}</div>
              <div className="dashboard-tile-sub">{formatCSBudgetBreakdown(budgetSummary.utilized.central, budgetSummary.utilized.state)}</div>
            </div>
            <div className="dashboard-tile-icon" aria-hidden="true"><FiTrendingUp /></div>
          </div>

          <div className="budget-summary-card" style={{ '--from': '#3f87ff', '--to': '#6a5af9' }} onClick={() => navigate('/budget')}>
            <div className="dashboard-tile-content">
              <div className="dashboard-tile-label">Remaining Budget</div>
              <div className="dashboard-tile-value">{formatCurrency(budgetSummary.remaining.total)}</div>
              <div className="dashboard-tile-sub">{formatCSBudgetBreakdown(budgetSummary.remaining.central, budgetSummary.remaining.state)}</div>
            </div>
            <div className="dashboard-tile-icon" aria-hidden="true"><BiWallet /></div>
          </div>
        </div>
      </div>

      {/* Budget Breakdown (Estimated / Sanction / Pending) */}
      <div className="budget-summary-section">
        <div className="budget-summary-title">Budget Breakdown</div>
        <div className="budget-summary-cards">
          <div className="budget-summary-card" style={{ '--from': '#f39c12', '--to': '#e67e22' }} onClick={() => navigate('/budget')}>
            <div className="dashboard-tile-content">
              <div className="dashboard-tile-label">Estimated Budget</div>
              <div className="dashboard-tile-value">{formatCurrency(budgetBreakdown.estimated.total)}</div>
              <div className="dashboard-tile-sub">{formatCSBudgetBreakdown(budgetBreakdown.estimated.central, budgetBreakdown.estimated.state)}</div>
            </div>
            <div className="dashboard-tile-icon" aria-hidden="true"><BiRupee /></div>
          </div>

          <div className="budget-summary-card" style={{ '--from': '#27ae60', '--to': '#229954' }} onClick={() => navigate('/budget')}>
            <div className="dashboard-tile-content">
              <div className="dashboard-tile-label">Budget Sanction</div>
              <div className="dashboard-tile-value">{formatCurrency(budgetBreakdown.sanction.total)}</div>
              <div className="dashboard-tile-sub">{formatCSBudgetBreakdown(budgetBreakdown.sanction.central, budgetBreakdown.sanction.state)}</div>
            </div>
            <div className="dashboard-tile-icon" aria-hidden="true"><FiTrendingUp /></div>
          </div>

          <div className="budget-summary-card" style={{ '--from': '#e74c3c', '--to': '#c0392b' }} onClick={() => navigate('/budget')}>
            <div className="dashboard-tile-content">
              <div className="dashboard-tile-label">Pending Budget</div>
              <div className="dashboard-tile-value">{formatCurrency(budgetBreakdown.pending.total)}</div>
              <div className="dashboard-tile-sub">{formatCSBudgetBreakdown(budgetBreakdown.pending.central, budgetBreakdown.pending.state)}</div>
            </div>
            <div className="dashboard-tile-icon" aria-hidden="true"><BiWallet /></div>
          </div>
        </div>
      </div>
{/* <div className="stat-card teal" style={{ cursor: 'pointer' }} onClick={() => navigate('/attendance?period=today')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: '#e0f2f1', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiClock style={{ color: '#00897B', fontSize: '24px' }} />
            </div>
            <div>
              <h4 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>{stats.todayAttendance?.total || 0}</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#666' }}>Today's Attendance</p>
              
               <div className="trend" style={{ fontSize: '11px', display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
              <span onClick={(e) => { e.stopPropagation(); navigate('/attendance?status=present'); }} style={{ color: '#4CAF50', cursor: 'pointer' }}>{stats.todayAttendance?.present || 0} Present</span>
              <span onClick={(e) => { e.stopPropagation(); navigate('/attendance?status=late'); }} style={{ color: '#FF9800', cursor: 'pointer' }}>{stats.todayAttendance?.late || 0} Late</span>
              <span onClick={(e) => { e.stopPropagation(); navigate('/attendance?status=absent'); }} style={{ color: '#F44336', cursor: 'pointer' }}>{stats.todayAttendance?.absent || 0} Absent</span>
              <span onClick={(e) => { e.stopPropagation(); navigate('/attendance?status=half_day'); }} style={{ color: '#9C27B0', cursor: 'pointer' }}>{stats.todayAttendance?.halfDay || 0} Half</span>
            </div>
            </div>
          </div>
        </div> */}
      {/* Quick Stats - Hidden as cards moved to main grid */}
      {/* <div className="quick-stats" style={{ display: 'none' }}>

        <div className="quick-stat">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: '#e8f5e9', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiTrendingUp style={{ color: '#4CAF50', fontSize: '20px' }} />
            </div>
            <div>
              <h4>{formatCurrency(quickStats.utilizedBudget)}</h4>
              <p>Budget Utilized ({quickStats.budgetUtilization}%)</p>
            </div>
          </div>
        </div>
        <div className="quick-stat">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: '#e3f2fd', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BiWallet style={{ color: '#2196F3', fontSize: '20px' }} />
            </div>
            <div>
              <h4>{formatCurrency(quickStats.remainingBudget)}</h4>
              <p>Remaining Budget</p>
            </div>
          </div>
        </div>
        <div className="quick-stat">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: '#fff3e0', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiMapPin style={{ color: '#FF9800', fontSize: '20px' }} />
            </div>
            <div>
              <h4>{quickStats.districtsCovered}</h4>
              <p>Districts Covered</p>
            </div>
          </div>
        </div>
        <div className="quick-stat" onClick={() => window.location.href = '/beneficiaries'} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: '#fce4ec', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HiOutlineUserGroup style={{ color: '#E91E63', fontSize: '20px' }} />
            </div>
            <div>
              <h4>{formatBeneficiaries(quickStats.beneficiaries)}</h4>
              <p>Beneficiaries</p>
              <p>View & manage</p>
            </div>
          </div>
        </div> */}
        {/* <div className="quick-stat">
          <h4>{quickStats.attendanceRate}%</h4>
          <p>Attendance Rate</p>
        </div> */}
        
      {/* </div> */}
      {/* Charts - 2x2 Grid Layout */}
      <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Chart 1: HOD Revenue - Donut Chart with center text */}
        <div className="chart-card">
          <div className="chart-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3><FiPieChart /> HOD Revenue {chartFilters.revenue.hod_id && <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>({allHODs.find(h => h.id === parseInt(chartFilters.revenue.hod_id))?.name})</span>}</h3>
            <div className="chart-filter-container" style={{ position: 'relative' }}>
              <FiFilter 
                style={{ cursor: 'pointer', color: chartFilters.revenue.hod_id ? '#2e7d32' : '#666', fontSize: '18px' }} 
                title="Filter" 
                onClick={(e) => { e.stopPropagation(); toggleFilterDropdown('revenue'); }}
              />
              {renderFilterDropdown('revenue')}
            </div>
          </div>
          <div className="chart-card-body">
            <div className="chart-container" style={{ cursor: 'pointer', height: '300px', overflow: 'hidden', position: 'relative' }}>
              <Doughnut data={hodRevenueChartData} options={hodRevenuePieOptions} plugins={[ChartDataLabels, revenueCenterTextPlugin]} />
            </div>
          </div>
        </div>

        {/* Chart 2: Schemes (HOD wise) - Bar + Line Combined Chart */}
        <div className="chart-card">
          <div className="chart-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <h3><FiBarChart2 /> {isSchemeWiseView ? 'Schemes (Scheme wise)' : 'Schemes (HOD wise)'} {chartFilters.schemes.hod_id && <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>({allHODs.find(h => h.id === parseInt(chartFilters.schemes.hod_id))?.name})</span>}</h3>
              {isSchemeWiseView && (
                <div style={{ display: 'flex', gap: '10px', fontSize: '11px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'rgba(76, 175, 80, 0.8)' }}></span> Completed
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'rgba(255, 193, 7, 0.8)' }}></span> Planned
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'rgba(33, 150, 243, 0.8)' }}></span> Active
                  </span>
                </div>
              )}
            </div>
            <div className="chart-filter-container" style={{ position: 'relative' }}>
              <FiFilter 
                style={{ cursor: 'pointer', color: chartFilters.schemes.hod_id ? '#2e7d32' : '#666', fontSize: '18px' }} 
                title="Filter" 
                onClick={(e) => { e.stopPropagation(); toggleFilterDropdown('schemes'); }}
              />
              {renderFilterDropdown('schemes')}
            </div>
          </div>
          <div className="chart-card-body">
            <div className="chart-container" style={{ cursor: 'pointer', height: '300px' }}>
              <Bar data={schemesHODBarLineData} options={schemesBarLineOptions} />
            </div>
          </div>
        </div>

        {/* Chart 3: Budget (HOD wise) */}
        <div className="chart-card">
          <div className="chart-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3><FiPieChart /> Budget (HOD wise) {chartFilters.budget.hod_id && <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>({allHODs.find(h => h.id === parseInt(chartFilters.budget.hod_id))?.name})</span>}</h3>
            <div className="chart-filter-container" style={{ position: 'relative' }}>
              <FiFilter 
                style={{ cursor: 'pointer', color: chartFilters.budget.hod_id ? '#2e7d32' : '#666', fontSize: '18px' }} 
                title="Filter" 
                onClick={(e) => { e.stopPropagation(); toggleFilterDropdown('budget'); }}
              />
              {renderFilterDropdown('budget')}
            </div>
          </div>
          <div className="chart-card-body">
            <div className="chart-container" style={{ cursor: 'pointer', height: '390px' }}>
              <Pie data={budgetHODPieChartData} options={pieChartOptions} />
            </div>
          </div>
        </div>

        {/* Chart 4: Attendance (HOD wise) - Donut Chart with center text */}
        <div className="chart-card">
          <div className="chart-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3><FiPieChart /> Attendance (HOD wise) {chartFilters.attendance.hod_id && <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>({allHODs.find(h => h.id === parseInt(chartFilters.attendance.hod_id))?.name})</span>}</h3>
            <div className="chart-filter-container" style={{ position: 'relative' }}>
              <FiFilter 
                style={{ cursor: 'pointer', color: chartFilters.attendance.hod_id ? '#2e7d32' : '#666', fontSize: '18px' }} 
                title="Filter" 
                onClick={(e) => { e.stopPropagation(); toggleFilterDropdown('attendance'); }}
              />
              {renderFilterDropdown('attendance')}
            </div>
          </div>
          <div className="chart-card-body">
            <div className="chart-container" style={{ cursor: 'pointer', height: '390px' }}>
              <Pie data={attendanceHODPieChartData} options={attendancePieOptions} plugins={[ChartDataLabels, centerTextPlugin]} />
            </div>
          </div>
        </div>
      </div>

      {/* Tables */}
      {/* HOD Revenue Table */}
      {/*  */}

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

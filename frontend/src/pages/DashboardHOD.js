import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { FiUsers, FiFileText, FiDollarSign, FiTrendingUp, FiActivity, FiPieChart, FiBarChart2 } from 'react-icons/fi';
import {
  getSchemesByHODId,
  getBudgetByHODId,
  getAttendanceByHODId,
  getStaffByHODId
} from '../services/api';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const DashboardHOD = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const hodId = user.hod_id;
  
  const [schemes, setSchemes] = useState([]);
  const [budget, setBudget] = useState({ allocated: 0, utilized: 0 });
  const [attendance, setAttendance] = useState({ present: 0, absent: 0, half_day: 0 });
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hodId) {
      fetchHODData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hodId]);

  const fetchHODData = async () => {
    try {
      setLoading(true);
      const [schemesRes, budgetRes, attendanceRes, staffRes] = await Promise.all([
        getSchemesByHODId(hodId),
        getBudgetByHODId(hodId),
        getAttendanceByHODId(hodId),
        getStaffByHODId(hodId)
      ]);

      setSchemes(schemesRes.data || []);
      
      // Calculate budget summary from array
      const budgetArray = budgetRes.data || [];
      const allocated = budgetArray.reduce((sum, b) => sum + (parseFloat(b.allocated_amount) || 0), 0);
      const utilized = budgetArray.reduce((sum, b) => sum + (parseFloat(b.utilized_amount) || 0), 0);
      setBudget({ allocated, utilized });
      
      // Calculate attendance summary from array
      const attendanceArray = attendanceRes.data || [];
      const present = attendanceArray.filter(a => a.status === 'present').length;
      const absent = attendanceArray.filter(a => a.status === 'absent').length;
      const half_day = attendanceArray.filter(a => a.status === 'half_day').length;
      setAttendance({ present, absent, half_day });
      
      setStaff(staffRes.data || []);
    } catch (error) {
      console.error('Error fetching HOD data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`;
    }
    return `₹${value.toLocaleString()}`;
  };

  const budgetUtilization = budget.allocated > 0 
    ? ((budget.utilized / budget.allocated) * 100).toFixed(1) 
    : 0;

  const attendanceData = {
    labels: ['Present', 'Absent', 'Half Day'],
    datasets: [{
      data: [attendance.present, attendance.absent, attendance.half_day],
      backgroundColor: ['#2e7d32', '#c62828', '#ef6c00'],
      borderWidth: 0
    }]
  };

  const budgetData = {
    labels: ['Allocated', 'Utilized'],
    datasets: [{
      data: [budget.allocated / 10000000, budget.utilized / 10000000],
      backgroundColor: ['#1565c0', '#2e7d32'],
      borderWidth: 0
    }]
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
          font: { size: 11 }
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
        title="HOD Dashboard" 
        subtitle={`Welcome, ${user.name || 'HOD'}`}
      /> */}

      

      {/* Action: view beneficiaries */}
      <div className="hod-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button className="btn-primary" onClick={() => window.location.href = `/beneficiaries?hodId=${hodId}`}>View my Beneficiaries</button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon blue">
            <FiFileText />
          </div>
          <div className="stat-info">
            <h3>{schemes.length}</h3>
            <p>Total Schemes</p>
            <div className="trend up">
              <FiTrendingUp /> Active
            </div>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green">
            <FiUsers />
          </div>
          <div className="stat-info">
            <h3>{staff.length}</h3>
            <p>Staff Members</p>
            <div className="trend up">
              <FiTrendingUp /> Under your department
            </div>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon purple">
            <FiDollarSign />
          </div>
          <div className="stat-info">
            <h3>{formatCurrency(budget.allocated)}</h3>
            <p>Budget Allocated</p>
            <div className="trend up">
              <FiTrendingUp /> FY 2024-25
            </div>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon orange">
            <FiActivity />
          </div>
          <div className="stat-info">
            <h3>{formatCurrency(budget.utilized)}</h3>
            <p>Budget Utilized</p>
            <div className="trend up">
              <FiTrendingUp /> {budgetUtilization}% utilized
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-card-header">
            <h3><FiPieChart /> Budget Utilization</h3>
          </div>
          <div className="chart-card-body">
            <div className="chart-container">
              <Doughnut data={budgetData} options={chartOptions} />
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <h3><FiBarChart2 /> Attendance Overview</h3>
          </div>
          <div className="chart-card-body">
            <div className="chart-container">
              <Pie data={attendanceData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Schemes Table */}
      <div className="table-card">
        <div className="table-header">
          <h3>My Schemes</h3>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Scheme Name</th>
                <th>Category</th>
                <th>Budget</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {schemes.map((scheme, index) => (
                <tr key={index}>
                  <td>{scheme.scheme_name || scheme.name}</td>
                  <td>{scheme.scheme_category}</td>
                  <td>{formatCurrency(scheme.total_budget)}</td>
                  <td><span className={`status-badge ${scheme.status.toLowerCase()}`}>{scheme.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Table */}
      <div className="table-card">
        <div className="table-header">
          <h3>My Staff</h3>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Employee ID</th>
                <th>Designation</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member, index) => (
                <tr key={index}>
                  <td>{member.name}</td>
                  <td>{member.employee_id}</td>
                  <td>{member.designation}</td>
                  <td><span className={`status-badge ${member.status === 'active' ? 'active' : 'inactive'}`}>{member.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardHOD;


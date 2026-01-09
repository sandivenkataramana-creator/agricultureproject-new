import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { FiCalendar, FiClock, FiCheckCircle, FiXCircle, FiTrendingUp } from 'react-icons/fi';
import { getAttendanceByHODId } from '../services/api';

const DashboardStaff = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const staffId = user.staff_id;
  const hodId = user.hod_id;
  
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    half_day: 0,
    on_leave: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hodId) {
      fetchAttendanceData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hodId]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const response = await getAttendanceByHODId(hodId);
      const attendanceData = response.data || [];
      
      // Filter for current staff member
      const myAttendance = attendanceData
        .filter(a => a.staff_id === staffId)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 30); // Last 30 days
      
      setAttendance(myAttendance);
      
      // Calculate stats from all records (not just last 30)
      const allMyAttendance = attendanceData.filter(a => a.staff_id === staffId);
      const present = allMyAttendance.filter(a => a.status === 'present').length;
      const absent = allMyAttendance.filter(a => a.status === 'absent').length;
      const half_day = allMyAttendance.filter(a => a.status === 'half_day').length;
      const on_leave = allMyAttendance.filter(a => a.status === 'leave').length;
      
      setStats({ present, absent, half_day, on_leave });
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <FiCheckCircle style={{ color: '#2e7d32' }} />;
      case 'absent':
        return <FiXCircle style={{ color: '#c62828' }} />;
      case 'half_day':
        return <FiClock style={{ color: '#ef6c00' }} />;
      case 'leave':
        return <FiCalendar style={{ color: '#1565c0' }} />;
      default:
        return <FiClock />;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      present: 'active',
      absent: 'inactive',
      half_day: 'pending',
      leave: 'pending'
    };
    return badges[status] || 'pending';
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const totalDays = stats.present + stats.absent + stats.half_day + stats.on_leave;
  const attendanceRate = totalDays > 0 ? ((stats.present / totalDays) * 100).toFixed(1) : 0;

  return (
    <div className="page-container">
      {/* <Header 
        title="Staff Dashboard" 
        subtitle={`Welcome, ${user.name || 'Staff Member'}`}
      /> */}

      {/* Hero Stats */}
      {/* <div className="hero-stats">
        <div className="hero-card">
          <div className="hero-number green">{stats.present}</div>
          <div className="hero-label">Days Present</div>
        </div>
        <div className="hero-card">
          <div className="hero-number red">{stats.absent}</div>
          <div className="hero-label">Days Absent</div>
        </div>
        <div className="hero-card">
          <div className="hero-number blue">{attendanceRate}%</div>
          <div className="hero-label">Attendance Rate</div>
        </div>
        <div className="hero-card">
          <div className="hero-number teal">{stats.on_leave}</div>
          <div className="hero-label">Days on Leave</div>
        </div>
      </div> */}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card green">
          <div className="stat-icon green">
            <FiCheckCircle />
          </div>
          <div className="stat-info">
            <h3>{stats.present}</h3>
            <p>Present Days</p>
            <div className="trend up">
              <FiCheckCircle /> Good attendance
            </div>
          </div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon red">
            <FiXCircle />
          </div>
          <div className="stat-info">
            <h3>{stats.absent}</h3>
            <p>Absent Days</p>
            <div className="trend">
              Keep it low
            </div>
          </div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon blue">
            <FiClock />
          </div>
          <div className="stat-info">
            <h3>{stats.half_day}</h3>
            <p>Half Days</p>
            <div className="trend">
              Partial attendance
            </div>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon purple">
            <FiCalendar />
          </div>
          <div className="stat-info">
            <h3>{attendanceRate}%</h3>
            <p>Attendance Rate</p>
            <div className="trend up">
              <FiTrendingUp /> Overall performance
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="table-card">
        <div className="table-header">
          <h3>My Attendance Record</h3>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length > 0 ? (
                attendance.map((record, index) => (
                  <tr key={index}>
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadge(record.status)}`}>
                        {getStatusIcon(record.status)}
                        <span style={{ marginLeft: '8px' }}>{record.status}</span>
                      </span>
                    </td>
                    <td>{record.check_in || '-'}</td>
                    <td>{record.check_out || '-'}</td>
                    <td>{record.remarks || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                    No attendance records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardStaff;


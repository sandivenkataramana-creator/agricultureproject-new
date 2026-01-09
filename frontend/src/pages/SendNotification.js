import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { FiBell, FiSend, FiUsers, FiAlertCircle, FiInfo, FiCheckCircle } from 'react-icons/fi';
import { sendNotification, getHODs, getUsers } from '../services/api';

const SendNotification = () => {
  const [formData, setFormData] = useState({
    type: 'info',
    title: '',
    message: '',
    recipientType: 'all', // all, role, user
    role: '',
    userId: ''
  });
  const [users, setUsers] = useState([]);
  const [hods, setHODs] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchHODs();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      setUsers(response.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchHODs = async () => {
    try {
      const response = await getHODs();
      setHODs(response.data || []);
    } catch (err) {
      console.error('Error fetching HODs:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title || !formData.message) {
      setError('Title and message are required');
      return;
    }

    setIsLoading(true);

    try {
      const response = await sendNotification(formData);
      if (response.data.success) {
        setSuccess('Notification sent successfully!');
        setFormData({
          type: 'info',
          title: '',
          message: '',
          recipientType: 'all',
          role: '',
          userId: ''
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send notification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'success': return <FiCheckCircle style={{ color: '#28a745' }} />;
      case 'warning': return <FiAlertCircle style={{ color: '#ffc107' }} />;
      case 'error': return <FiAlertCircle style={{ color: '#dc3545' }} />;
      default: return <FiInfo style={{ color: '#17a2b8' }} />;
    }
  };

  return (
    <div className="page-container">
      {/* <Header 
        title="Send Notification" 
        subtitle="Send notifications to users" 
      /> */}

      <div className="table-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="table-header">
          <h3><FiBell /> Create Notification</h3>
        </div>

        {error && (
          <div style={{ 
            background: '#fee', 
            color: '#c33', 
            padding: '12px', 
            borderRadius: '6px', 
            margin: '20px',
            border: '1px solid #fcc'
          }}>
            <span>⚠️ {error}</span>
          </div>
        )}

        {success && (
          <div style={{ 
            background: '#efe', 
            color: '#3c3', 
            padding: '12px', 
            borderRadius: '6px', 
            margin: '20px',
            border: '1px solid #cfc'
          }}>
            <span>✓ {success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Notification Type *</label>
            <div style={{ display: 'flex', gap: '15px', marginTop: '8px' }}>
              {['info', 'success', 'warning', 'error'].map(type => (
                <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="type"
                    value={type}
                    checked={formData.type === type}
                    onChange={handleChange}
                  />
                  {getTypeIcon(type)}
                  <span style={{ textTransform: 'capitalize' }}>{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter notification title"
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Message *</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows="4"
              placeholder="Enter notification message"
              style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Send To *</label>
            <select
              name="recipientType"
              value={formData.recipientType}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }}
            >
              <option value="all">All Users</option>
              <option value="role">By Role</option>
              <option value="user">Specific User</option>
            </select>
          </div>

          {formData.recipientType === 'role' && (
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label>Role *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }}
              >
                <option value="">Select Role</option>
                <option value="admin">Admin</option>
                <option value="hod">HOD</option>
                <option value="staff">Staff</option>
              </select>
            </div>
          )}

          {formData.recipientType === 'user' && (
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label>User *</label>
              <select
                name="userId"
                value={formData.userId}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }}
              >
                <option value="">Select User</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role}) - {user.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading}
            >
              <FiSend style={{ marginRight: '8px' }} />
              {isLoading ? 'Sending...' : 'Send Notification'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => {
                setFormData({
                  type: 'info',
                  title: '',
                  message: '',
                  recipientType: 'all',
                  role: '',
                  userId: ''
                });
                setError('');
                setSuccess('');
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendNotification;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { changePassword } from '../services/api';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(savedUser));
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setIsLoading(true);

    try {
      const response = await changePassword({
        userId: user.id,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      if (response.data.success) {
        setSuccess('Password changed successfully! You will be logged out. Please login again.');
        setTimeout(() => {
          localStorage.removeItem('user');
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="page-container">
      {/* <Header title="Change Password" subtitle="Update your account password" /> */}

      <div className="table-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="table-header">
          <h3>Change Password</h3>
        </div>

        {error && (
          <div className="login-error" style={{ margin: '20px' }}>
            <span>⚠️ {error}</span>
          </div>
        )}

        {success && (
          <div style={{ 
            background: '#d4edda', 
            color: '#155724', 
            padding: '12px', 
            borderRadius: '6px', 
            margin: '20px',
            border: '1px solid #c3e6cb'
          }}>
            <span>✓ {success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div className="form-group">
            <label>Current Password *</label>
            <div style={{ position: 'relative' }}>
              <FiLock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                required
                style={{ paddingLeft: '40px', width: '100%' }}
              />
              <button 
                type="button" 
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                style={{ 
                  position: 'absolute', 
                  right: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>New Password *</label>
            <div style={{ position: 'relative' }}>
              <FiLock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
              <input
                type={showNewPassword ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                style={{ paddingLeft: '40px', width: '100%' }}
              />
              <button 
                type="button" 
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{ 
                  position: 'absolute', 
                  right: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                {showNewPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm New Password *</label>
            <div style={{ position: 'relative' }}>
              <FiLock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                style={{ paddingLeft: '40px', width: '100%' }}
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ 
                  position: 'absolute', 
                  right: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Changing...' : 'Change Password'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;


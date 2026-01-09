import React, { useState } from 'react';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';
import { register } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'staff',
    hod_id: '',
    staff_id: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const response = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        hod_id: formData.hod_id || null,
        staff_id: formData.staff_id || null
      });

      if (response.data.success) {
        setSuccess('Registration successful! Please check your email for login credentials.');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-branding">
          <div className="login-logo">
            <div className="logo-icon">TS</div>
            <div className="logo-text">
              <h1>Telangana State</h1>
              <p>HOD Management System</p>
            </div>
          </div>
          <div className="login-features">
            <h2>Create Your Account</h2>
            <ul>
              <li>📧 Email verification</li>
              <li>🔐 Secure password management</li>
              <li>👤 Role-based access control</li>
              <li>📊 Access to dashboard</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="login-right">
        <div className="login-form-container">
          <div className="login-header">
            <button 
              className="back-button" 
              onClick={() => navigate('/login')}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#1b5e20', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px',
                fontSize: '14px'
              }}
            >
              <FiArrowLeft /> Back to Login
            </button>
            <h2>Create Account</h2>
            <p>Register for HOD Management System</p>
          </div>

          {error && (
            <div className="login-error">
              <span>⚠️ {error}</span>
            </div>
          )}

          {success && (
            <div style={{ 
              background: '#d4edda', 
              color: '#155724', 
              padding: '12px', 
              borderRadius: '6px', 
              marginBottom: '20px',
              border: '1px solid #c3e6cb'
            }}>
              <span>✓ {success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-input-group">
              <label>Full Name *</label>
              <div className="login-input-wrapper">
                <FiUser className="input-icon" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div className="login-input-group">
              <label>Email Address *</label>
              <div className="login-input-wrapper">
                <FiMail className="input-icon" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="login-input-group">
              <label>Username *</label>
              <div className="login-input-wrapper">
                <FiUser className="input-icon" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  required
                />
              </div>
            </div>

            <div className="login-input-group">
              <label>Role *</label>
              <div className="login-input-wrapper">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }}
                >
                  <option value="staff">Staff</option>
                  <option value="hod">HOD</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="login-input-group">
              <label>Password *</label>
              <div className="login-input-wrapper">
                <FiLock className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password (min 6 characters)"
                  required
                  minLength={6}
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div className="login-input-group">
              <label>Confirm Password *</label>
              <div className="login-input-wrapper">
                <FiLock className="input-icon" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                  minLength={6}
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="login-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="login-spinner"></span>
              ) : (
                'Register'
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p>Already have an account? <a href="#login" onClick={(e) => { e.preventDefault(); navigate('/login'); }} style={{ color: '#1b5e20', fontWeight: '600' }}>Sign In</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;


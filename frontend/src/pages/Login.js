import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { login } from '../services/api';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await login(formData);
      if (response.data.success) {
        const userData = {
          ...response.data.user,
          token: response.data.token
        };
        localStorage.setItem('user', JSON.stringify(userData));
        onLogin(userData);        // Redirect to home after login
        navigate('/');      } else {
        setError('Invalid username/email or password');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid username/email or password');
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
            <h2>Government Dashboard Portal</h2>
            <ul>
              <li>📊 Real-time Dashboard Analytics</li>
              <li>👥 HOD & Staff Management</li>
              <li>📋 Scheme Monitoring & Tracking</li>
              <li>💰 Budget Allocation & Utilization</li>
              <li>📈 KPI Performance Metrics</li>
              <li>📅 Attendance Management</li>
            </ul>
          </div>
          <div className="login-footer-text">
            <p>© 2024 Government of Telangana. All Rights Reserved.</p>
          </div>
        </div>
      </div>
      
      <div className="login-right">
        <div className="login-form-container">
          <div className="login-header">
            <h2>Welcome Back!</h2>
            <p>Please login to your account</p>
          </div>

          {error && (
            <div className="login-error">
              <span>⚠️ {error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-input-group">
              <label>Username or Email</label>
              <div className="login-input-wrapper">
                <FiUser className="input-icon" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter username or email"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="login-input-group">
              <label>Password</label>
              <div className="login-input-wrapper">
                <FiLock className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
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

            <div className="login-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#forgot" className="forgot-link" onClick={(e) => { e.preventDefault(); window.location.href = '/forgot-password'; }}>Forgot Password?</a>
            </div>

            <button 
              type="submit" 
              className="login-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="login-spinner"></span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="demo-credentials">
            <p>Demo Credentials:</p>
            <div className="credentials-list">
              <div className="credential-item">
                <span className="credential-role">Admin:</span>
                <code>admin / password123</code>
              </div>
              <div className="credential-item">
                <span className="credential-role">HOD:</span>
                <code>hod1 / password123</code>
              </div>
              <div className="credential-item">
                <span className="credential-role">Staff:</span>
                <code>staff1 / password123</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

import React, { useState } from 'react';
import { FiMail, FiArrowLeft, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { forgotPassword, resetPassword } from '../services/api';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await forgotPassword(email);
      if (response.data.success) {
        setSuccess('OTP has been sent to your email. Please check your inbox.');
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setStep(3);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const response = await resetPassword({ email, otp, newPassword });
      if (response.data.success) {
        setSuccess('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
      setStep(2); // Go back to OTP step
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
            <h2>Password Recovery</h2>
            <ul>
              <li>🔐 Secure OTP verification</li>
              <li>📧 Email-based reset</li>
              <li>⚡ Quick password recovery</li>
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
            <h2>Reset Password</h2>
            <p>
              {step === 1 && 'Enter your email to receive OTP'}
              {step === 2 && 'Enter the OTP sent to your email'}
              {step === 3 && 'Enter your new password'}
            </p>
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

          {step === 1 && (
            <form onSubmit={handleSendOTP} className="login-form">
              <div className="login-input-group">
                <label>Email Address</label>
                <div className="login-input-wrapper">
                  <FiMail className="input-icon" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    required
                  />
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
                  'Send OTP'
                )}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="login-form">
              <div className="login-input-group">
                <label>Enter OTP</label>
                <div className="login-input-wrapper">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(value);
                    }}
                    placeholder="Enter 6-digit OTP"
                    required
                    maxLength={6}
                    style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
                  />
                </div>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '8px', textAlign: 'center' }}>
                  OTP sent to: {email}
                </p>
              </div>

              <button 
                type="submit" 
                className="login-btn"
                disabled={isLoading || otp.length !== 6}
              >
                Verify OTP
              </button>

              <button 
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp('');
                  setError('');
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginTop: '10px',
                  background: 'transparent',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  color: '#666',
                  cursor: 'pointer'
                }}
              >
                Resend OTP
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="login-form">
              <div className="login-input-group">
                <label>New Password</label>
                <div className="login-input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
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
                <label>Confirm New Password</label>
                <div className="login-input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
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
                  'Reset Password'
                )}
              </button>

              <button 
                type="button"
                onClick={() => {
                  setStep(2);
                  setNewPassword('');
                  setConfirmPassword('');
                  setError('');
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginTop: '10px',
                  background: 'transparent',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  color: '#666',
                  cursor: 'pointer'
                }}
              >
                Back to OTP
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;


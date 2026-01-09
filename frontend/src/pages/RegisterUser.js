import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiUserPlus } from 'react-icons/fi';
import { registerUser, getHODs, getCategories } from '../services/api';

const RegisterUser = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'staff',
    hod_id: '',
    staff_id: '',
    category_id: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hods, setHODs] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchHODs();
    fetchCategories();
  }, []);

  const fetchHODs = async () => {
    try {
      const response = await getHODs();
      setHODs(response.data || []);
    } catch (err) {
      console.error('Error fetching HODs:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      setCategories(response.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
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

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!formData.email || !formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (formData.role === 'hod' && !formData.category_id) {
      setError('Please select a department category for HOD');
      return;
    }

    if (formData.role === 'staff' && !formData.hod_id) {
      setError('Please select a HOD for Staff');
      return;
    }

    setIsLoading(true);

    try {
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        hod_id: formData.hod_id || null,
        staff_id: formData.staff_id || null,
        category_id: formData.category_id || null
      };

      const response = await registerUser(userData);
      if (response.data.success) {
        setSuccess(`User "${formData.name}" registered successfully!`);
        // Reset form
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          name: '',
          role: 'staff',
          hod_id: '',
          staff_id: '',
          category_id: ''
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* <Header 
        title="Register User" 
        subtitle="Create new user accounts (Admin, HOD, or Staff)" 
      /> */}

      <div className="table-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="table-header">
          <h3><FiUserPlus /> Create New User Account</h3>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group">
              <label>Full Name *</label>
              <div style={{ position: 'relative' }}>
                <FiUser style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: '40px', width: '100%' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <div style={{ position: 'relative' }}>
                <FiMail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: '40px', width: '100%' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group">
              <label>Username *</label>
              <div style={{ position: 'relative' }}>
                <FiUser style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: '40px', width: '100%' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Role *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }}
              >
                <option value="admin">Admin</option>
                <option value="hod">HOD</option>
                <option value="staff">Staff</option>
              </select>
            </div>
          </div>

          {formData.role === 'hod' && (
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label>Department Category *</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}

          {formData.role === 'staff' && (
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label>HOD *</label>
              <select
                name="hod_id"
                value={formData.hod_id}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }}
              >
                <option value="">Select HOD</option>
                {hods.map(hod => (
                  <option key={hod.id} value={hod.id}>{hod.name} - {hod.department || hod.category_name}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group">
              <label>Password *</label>
              <div style={{ position: 'relative' }}>
                <FiLock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  style={{ paddingLeft: '40px', width: '100%' }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
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
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm Password *</label>
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
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create User'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => {
                setFormData({
                  username: '',
                  email: '',
                  password: '',
                  confirmPassword: '',
                  name: '',
                  role: 'staff',
                  hod_id: '',
                  staff_id: '',
                  category_id: ''
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

export default RegisterUser;


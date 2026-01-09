import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { FiSave, FiUser, FiLock, FiBell, FiGlobe, FiDatabase, FiMail, FiShield } from 'react-icons/fi';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState({
    // Profile Settings
    name: '',
    email: '',
    phone: '',
    department: '',
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    weeklyReport: true,
    budgetAlerts: true,
    schemeUpdates: true,
    
    // System Settings
    language: 'en',
    timezone: 'IST',
    dateFormat: 'DD/MM/YYYY',
    currency: 'INR',
    
    // Security Settings
    twoFactorAuth: false,
    sessionTimeout: '30',
    loginAlerts: true
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setSettings(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        department: user.role || ''
      }));
    }
    
    // Load saved settings
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
    }
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Save settings to localStorage
    localStorage.setItem('appSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <FiUser /> },
    { id: 'notifications', label: 'Notifications', icon: <FiBell /> },
    { id: 'system', label: 'System', icon: <FiGlobe /> },
    { id: 'security', label: 'Security', icon: <FiShield /> },
    { id: 'database', label: 'Database', icon: <FiDatabase /> }
  ];

  return (
    <div className="page-container">
      {/* <Header title="Settings" subtitle="Manage your application settings" /> */}
      
      {saved && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          Settings saved successfully!
        </div>
      )}

      <div className="settings-container">
        <div className="settings-sidebar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="settings-content">
          {activeTab === 'profile' && (
            <div className="settings-section">
              <h3><FiUser /> Profile Settings</h3>
              <div className="settings-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={settings.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    value={settings.department}
                    onChange={(e) => handleChange('department', e.target.value)}
                    placeholder="Enter your department"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h3><FiBell /> Notification Settings</h3>
              <div className="settings-form">
                <div className="form-group toggle-group">
                  <div>
                    <label>Email Notifications</label>
                    <p className="form-hint">Receive updates via email</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="form-group toggle-group">
                  <div>
                    <label>SMS Notifications</label>
                    <p className="form-hint">Receive SMS alerts</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={settings.smsNotifications}
                      onChange={(e) => handleChange('smsNotifications', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="form-group toggle-group">
                  <div>
                    <label>Push Notifications</label>
                    <p className="form-hint">Receive browser notifications</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={settings.pushNotifications}
                      onChange={(e) => handleChange('pushNotifications', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="form-group toggle-group">
                  <div>
                    <label>Weekly Reports</label>
                    <p className="form-hint">Get weekly summary reports</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={settings.weeklyReport}
                      onChange={(e) => handleChange('weeklyReport', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="form-group toggle-group">
                  <div>
                    <label>Budget Alerts</label>
                    <p className="form-hint">Alert when budget threshold reached</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={settings.budgetAlerts}
                      onChange={(e) => handleChange('budgetAlerts', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="settings-section">
              <h3><FiGlobe /> System Settings</h3>
              <div className="settings-form">
                <div className="form-group">
                  <label>Language</label>
                  <select
                    value={settings.language}
                    onChange={(e) => handleChange('language', e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="te">Telugu</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Timezone</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => handleChange('timezone', e.target.value)}
                  >
                    <option value="IST">Indian Standard Time (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="EST">Eastern Standard Time (EST)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date Format</label>
                  <select
                    value={settings.dateFormat}
                    onChange={(e) => handleChange('dateFormat', e.target.value)}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Currency</label>
                  <select
                    value={settings.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                  >
                    <option value="INR">Indian Rupee (₹)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-section">
              <h3><FiShield /> Security Settings</h3>
              <div className="settings-form">
                <div className="form-group toggle-group">
                  <div>
                    <label>Two-Factor Authentication</label>
                    <p className="form-hint">Add extra security to your account</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={settings.twoFactorAuth}
                      onChange={(e) => handleChange('twoFactorAuth', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="form-group">
                  <label>Session Timeout (minutes)</label>
                  <select
                    value={settings.sessionTimeout}
                    onChange={(e) => handleChange('sessionTimeout', e.target.value)}
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>
                <div className="form-group toggle-group">
                  <div>
                    <label>Login Alerts</label>
                    <p className="form-hint">Get notified of new login attempts</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={settings.loginAlerts}
                      onChange={(e) => handleChange('loginAlerts', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="form-group">
                  <label>Change Password</label>
                  <button 
                    className="btn btn-outline" 
                    style={{ marginTop: 8 }}
                    onClick={() => window.location.href = '/change-password'}
                  >
                    <FiLock /> Update Password
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="settings-section">
              <h3><FiDatabase /> Database Settings</h3>
              <div className="settings-form">
                <div className="form-group">
                  <label>Database Status</label>
                  <div className="status-badge success">Connected</div>
                </div>
                <div className="form-group">
                  <label>Database Host</label>
                  <input type="text" value="localhost" disabled />
                </div>
                <div className="form-group">
                  <label>Database Name</label>
                  <input type="text" value="hod_management" disabled />
                </div>
                <div className="form-group">
                  <label>Last Backup</label>
                  <input type="text" value={new Date().toLocaleDateString()} disabled />
                </div>
                <div className="form-group" style={{ display: 'flex', gap: 12 }}>
                  <button className="btn btn-outline">
                    <FiDatabase /> Backup Now
                  </button>
                  <button className="btn btn-outline">
                    Clear Cache
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="settings-actions">
            <button className="btn btn-primary" onClick={handleSave}>
              <FiSave /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

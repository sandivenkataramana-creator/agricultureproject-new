import React, { useState, useEffect, useRef } from 'react';
import { FiBell, FiMail, FiSearch, FiSettings, FiHelpCircle, FiLogOut, FiUser, FiChevronDown, FiX, FiCheck, FiAlertCircle, FiInfo, FiMessageSquare, FiLock, FiMenu } from 'react-icons/fi';
import { getNotifications, getMessages, searchAll } from '../services/api';

const TopHeader = ({ user, onLogout, onToggleSidebar }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Refs for click outside detection
  const helpRef = useRef(null);
  const notificationsRef = useRef(null);
  const messagesRef = useRef(null);
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    fetchMessages();
  }, []);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (helpRef.current && !helpRef.current.contains(event.target)) {
        setShowHelp(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (messagesRef.current && !messagesRef.current.contains(event.target)) {
        setShowMessages(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications(user?.id);
      setNotifications(res.data || []);
    } catch (err) {
      // Use default notifications if API fails
      setNotifications([
        { id: 1, type: 'info', title: 'System Update', message: 'New features available', time: '5 min ago', read: false },
        { id: 2, type: 'success', title: 'Budget Approved', message: 'Q4 budget has been approved', time: '1 hour ago', read: false },
        { id: 3, type: 'warning', title: 'Deadline Reminder', message: 'Report submission due tomorrow', time: '2 hours ago', read: true }
      ]);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await getMessages(user?.id);
      setMessages(res.data || []);
    } catch (err) {
      // Use default messages if API fails
      setMessages([
        { id: 1, from: 'Admin', subject: 'Welcome to HOD Management', preview: 'Thank you for using our system...', time: '10 min ago', read: false },
        { id: 2, from: 'Finance Dept', subject: 'Budget Review', preview: 'Please review the attached budget...', time: '3 hours ago', read: false },
        { id: 3, from: 'IT Support', subject: 'System Maintenance', preview: 'Scheduled maintenance on Sunday...', time: '1 day ago', read: true }
      ]);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await searchAll(query);
      setSearchResults(res.data || []);
    } catch (err) {
      // Mock search results
      setSearchResults([
        { type: 'hod', name: 'Agriculture Department', path: '/hods' },
        { type: 'scheme', name: 'PM Kisan Scheme', path: '/schemes' },
        { type: 'staff', name: 'John Doe', path: '/staff' }
      ].filter(item => item.name.toLowerCase().includes(query.toLowerCase())));
    }
    setLoading(false);
  };

  const closeAllDropdowns = () => {
    setShowUserMenu(false);
    setShowNotifications(false);
    setShowMessages(false);
    setShowHelp(false);
    setShowSearch(false);
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;
  const unreadMessages = messages.filter(m => !m.read).length;

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
  };

  return (
    <header className="top-header">
      <div className="top-header-left">
        {/* Mobile sidebar toggle */}
        <button className="mobile-sidebar-toggle" aria-label="Toggle sidebar" onClick={() => { if (typeof onToggleSidebar === 'function') onToggleSidebar(); }}>
          <FiMenu size={20} />
        </button>
        <div className="top-header-logo">
          <img src={process.env.REACT_APP_HEADER_LOGO || '/tglogo.png'} alt="Logo" style={{ height: 40, borderRadius: 8, marginRight: 12 }} />
          <div>
            <h1>Telangana Agriculture and Co-opration Department</h1>
            <span>Telangana State</span>
          </div>
        </div>
      </div>
      
      <div className="top-header-right">
        {/* Search */}
        {/* <div ref={searchRef} className="search-container" style={{ position: 'relative' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            background: 'rgba(255,255,255,0.1)', 
            padding: '8px 16px',
            borderRadius: 8,
            marginRight: 12
          }}>
            <FiSearch style={{ marginRight: 8 }} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => { closeAllDropdowns(); setShowSearch(true); }}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'white',
                outline: 'none',
                width: 180,
                fontSize: 14
              }}
            />
            {searchQuery && (
              <FiX 
                style={{ cursor: 'pointer', marginLeft: 8 }} 
                onClick={() => { setSearchQuery(''); setSearchResults([]); }}
              />
            )}
          </div>
          {showSearch && searchQuery.length >= 2 && (
            <div className="dropdown-panel search-dropdown">
              <div className="dropdown-header">Search Results</div>
              {loading ? (
                <div className="dropdown-item">Searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((result, index) => (
                  <a key={index} href={result.path} className="dropdown-item">
                    <span className="result-type">{result.type}</span>
                    <span>{result.name}</span>
                  </a>
                ))
              ) : (
                <div className="dropdown-item">No results found</div>
              )}
            </div>
          )}
        </div> */}
        
        {/* Help */}
        <div ref={helpRef} style={{ position: 'relative' }}>
          <button 
            className="header-icon-btn" 
            title="Help"
            onClick={() => { closeAllDropdowns(); setShowHelp(!showHelp); }}
          >
            <FiHelpCircle size={20} />
          </button>
          {showHelp && (
            <div className="dropdown-panel help-dropdown">
              <div className="dropdown-header">Help & Support</div>
              <a href="#" className="dropdown-item">
                <FiInfo size={16} />
                <span>User Guide</span>
              </a>
              <a href="#" className="dropdown-item">
                <FiMessageSquare size={16} />
                <span>FAQs</span>
              </a>
              <a href="#" className="dropdown-item">
                <FiMail size={16} />
                <span>Contact Support</span>
              </a>
              <div className="dropdown-divider"></div>
              <div className="dropdown-item" style={{ fontSize: 12, color: '#666' }}>
                Version: 1.0.0<br/>
                Last Updated: Dec 2024
              </div>
            </div>
          )}
        </div>
        
        {/* Notifications */}
        <div ref={notificationsRef} style={{ position: 'relative' }}>
          <button 
            className="header-icon-btn" 
            title="Notifications"
            onClick={() => { closeAllDropdowns(); setShowNotifications(!showNotifications); }}
          >
            <FiBell size={20} />
            {unreadNotifications > 0 && (
              <span style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 8,
                height: 8,
                background: '#ff5252',
                borderRadius: '50%'
              }}></span>
            )}
          </button>
          {showNotifications && (
            <div className="dropdown-panel notifications-dropdown">
              <div className="dropdown-header">
                Notifications
                {unreadNotifications > 0 && <span className="badge">{unreadNotifications} new</span>}
              </div>
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div key={notif.id} className={`dropdown-item notification-item ${notif.read ? 'read' : ''}`}>
                    <div className={`notif-icon ${notif.type}`}>
                      {notif.type === 'success' ? <FiCheck /> : notif.type === 'warning' ? <FiAlertCircle /> : <FiInfo />}
                    </div>
                    <div className="notif-content">
                      <div className="notif-title">{notif.title}</div>
                      <div className="notif-message">{notif.message}</div>
                      <div className="notif-time">{notif.time}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="dropdown-item">No notifications</div>
              )}
              <div className="dropdown-footer">
                <a href="#">View All Notifications</a>
              </div>
            </div>
          )}
        </div>
        
        {/* Messages */}
        <div ref={messagesRef} style={{ position: 'relative' }}>
          <button 
            className="header-icon-btn" 
            title="Messages"
            onClick={() => { closeAllDropdowns(); setShowMessages(!showMessages); }}
          >
            <FiMail size={20} />
            {unreadMessages > 0 && (
              <span style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 8,
                height: 8,
                background: '#ff5252',
                borderRadius: '50%'
              }}></span>
            )}
          </button>
          {showMessages && (
            <div className="dropdown-panel messages-dropdown">
              <div className="dropdown-header">
                Messages
                {unreadMessages > 0 && <span className="badge">{unreadMessages} new</span>}
              </div>
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <div key={msg.id} className={`dropdown-item message-item ${msg.read ? 'read' : ''}`}>
                    <div className="msg-avatar">{msg.from.charAt(0)}</div>
                    <div className="msg-content">
                      <div className="msg-from">{msg.from}</div>
                      <div className="msg-subject">{msg.subject}</div>
                      <div className="msg-preview">{msg.preview}</div>
                      <div className="msg-time">{msg.time}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="dropdown-item">No messages</div>
              )}
              <div className="dropdown-footer">
                <a href="#">View All Messages</a>
              </div>
            </div>
          )}
        </div>
        
        <div ref={userMenuRef} className="user-menu-container">
          <div 
            className="user-profile" 
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar">{getInitials(user?.name)}</div>
            <div className="user-info-text">
              <div className="name">{user?.name || 'User'}</div>
              <div className="role">{user?.role || 'Guest'}</div>
            </div>
            <FiChevronDown size={16} style={{ marginLeft: 4, opacity: 0.8 }} />
          </div>
          
          {showUserMenu && (
            <div className="user-dropdown">
              <div className="user-dropdown-header">
                <div className="user-avatar-lg">{getInitials(user?.name)}</div>
                <div>
                  <div className="dropdown-name">{user?.name}</div>
                  <div className="dropdown-role">{user?.role}</div>
                </div>
              </div>
              <div className="user-dropdown-divider"></div>
              <button className="user-dropdown-item" onClick={() => window.location.href = '/change-password'}>
                <FiLock size={16} />
                <span>Change Password</span>
              </button>
              <button className="user-dropdown-item">
                <FiUser size={16} />
                <span>My Profile</span>
              </button>
              <button className="user-dropdown-item">
                <FiSettings size={16} />
                <span>Settings</span>
              </button>
              <div className="user-dropdown-divider"></div>
              <button className="user-dropdown-item logout" onClick={onLogout}>
                <FiLogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopHeader;

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FiHome, 
  FiUsers, 
  FiFileText, 
  FiDollarSign, 
  FiTarget, 
  FiUserCheck,
  FiCalendar,
  FiSettings,
  FiClipboard,
  FiChevronLeft,
  FiChevronRight,
  FiUserPlus,
  FiBell,
  FiMail
} from 'react-icons/fi';

const Sidebar = ({ isCollapsed, onToggle }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role || 'staff';
  const isAdmin = role === 'admin';
  const isSuperAdmin = role === 'superadmin';
  const isAdminLike = isAdmin || isSuperAdmin;
  const [query, setQuery] = useState('');

  // Menu items based on role
  const getMainMenuItems = () => {
    const baseItems = [
      { path: '/', icon: <FiHome />, label: 'Dashboard' }
    ];

    if (isAdminLike) {
      return [
        ...baseItems,
        { path: '/beneficiaries', icon: <FiUsers />, label: 'Beneficiaries' },
        { path: '/hods', icon: <FiUsers />, label: 'HODs' },
        { path: '/dao', icon: <FiUsers />, label: 'DAO' },
        { path: '/schemes', icon: <FiFileText />, label: 'Schemes' },
        { path: '/programs', icon: <FiFileText />, label: 'Programs' },
        { path: '/staff', icon: <FiUserCheck />, label: 'Staff' },
        { path: '/budget', icon: <FiDollarSign />, label: 'Budget' },
        { path: '/attendance', icon: <FiCalendar />, label: 'Attendance' },
      ];
    } else if (role === 'hod') {
      return [
        ...baseItems,
        { path: '/beneficiaries', icon: <FiUsers />, label: 'Beneficiaries' },
        { path: '/schemes', icon: <FiFileText />, label: 'My Schemes' },
        { path: '/staff', icon: <FiUserCheck />, label: 'My Staff' },
        { path: '/attendance', icon: <FiCalendar />, label: 'Attendance' },
      ];
    } else {
      return [
        ...baseItems,
        { path: '/attendance', icon: <FiCalendar />, label: 'My Attendance' },
      ];
    }
  };

  const getMonitoringItems = () => {
    if (isAdminLike) {
      const items = [
        { path: '/kpis', icon: <FiTarget />, label: 'KPIs' },
        { path: '/nodal-officers', icon: <FiClipboard />, label: 'Nodal Officers' },
      ];

      if (isSuperAdmin) {
        items.push(
          { path: '/send-notification', icon: <FiBell />, label: 'Send Notification' },
          { path: '/send-message', icon: <FiMail />, label: 'Send Message' },
        );
      }

      return items;
    }
    return [];
  };

  const mainMenuItems = getMainMenuItems();
  const monitoringItems = getMonitoringItems();

  const normalize = (s) => (s || '').toLowerCase();
  const q = normalize(query);
  const filterItems = (items) => !q ? items : items.filter(i => normalize(i.label).includes(q));
  const filteredMain = filterItems(mainMenuItems);
  const filteredMonitoring = filterItems(monitoringItems);

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!isCollapsed && (
          <>
            <h1>Navigation Menu</h1>
            <p>Quick Access</p>
          </>
        )}
        <button 
          className="sidebar-toggle" 
          onClick={onToggle}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>
      <nav className="nav-menu">
        {!isCollapsed && (
          <div className="sidebar-search">
            <input
              type="text"
              placeholder="Search menu..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        )}
        {!isCollapsed && <div className="nav-section">Main Menu</div>}
        {filteredMain.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={isCollapsed ? item.label : ''}
          >
            {item.icon}
            {!isCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
        
        {filteredMonitoring.length > 0 && (
          <>
            {!isCollapsed && <div className="nav-section">Monitoring</div>}
            {filteredMonitoring.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                title={isCollapsed ? item.label : ''}
              >
                {item.icon}
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </>
        )}
        
        {!isCollapsed && <div className="nav-section">Settings</div>}
        {isSuperAdmin && (
          <NavLink to="/register-user" className="nav-item" title={isCollapsed ? 'Register User' : ''}>
            <FiUserPlus />
            {!isCollapsed && <span>Register User</span>}
          </NavLink>
        )}
        <NavLink to="/settings" className="nav-item" title={isCollapsed ? 'Settings' : ''}>
          <FiSettings />
          {!isCollapsed && <span>Settings</span>}
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;

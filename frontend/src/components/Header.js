import React from 'react';
import { FiChevronRight, FiHome, FiRefreshCw, FiDownload } from 'react-icons/fi';

const Header = ({ title, subtitle, onRefresh, onExport }) => {
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      // Default behavior - reload the page data
      window.location.reload();
    }
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      // Default export behavior - export current page data as CSV
      alert('Export functionality - Data will be exported as CSV');
    }
  };

  return (
    <header className="header">
      <div>
        <h2>{title}</h2>
        {subtitle && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{subtitle}</p>}
        <div className="header-breadcrumb">
          <a href="/"><FiHome size={12} /></a>
          <FiChevronRight size={12} />
          <span>{title}</span>
        </div>
      </div>
      {/* <div className="header-right">
        <button className="btn btn-outline btn-sm" title="Refresh Data" onClick={handleRefresh}>
          <FiRefreshCw size={14} />
          Refresh
        </button>
        <button className="btn btn-primary btn-sm" title="Export" onClick={handleExport}>
          <FiDownload size={14} />
          Export
        </button>
      </div> */}
    </header>
  );
};

export default Header;

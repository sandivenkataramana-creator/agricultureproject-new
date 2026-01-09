import React from 'react';
import { FiX } from 'react-icons/fi';

const Drawer = ({ isOpen, onClose, title, children, width = 420 }) => {
  if (!isOpen) return null;
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" style={{ width }} onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h3>{title}</h3>
          <button className="drawer-close" onClick={onClose}><FiX /></button>
        </div>
        <div className="drawer-body">{children}</div>
      </div>
    </div>
  );
};

export default Drawer;
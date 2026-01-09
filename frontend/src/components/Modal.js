import React from 'react';
import { FiX } from 'react-icons/fi';

const Modal = ({ isOpen, onClose, title, children, footer, size = 'default' }) => {
  if (!isOpen) return null;

  const sizeClass = size === 'large' ? 'modal-lg' : '';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${sizeClass}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>
            <FiX size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;

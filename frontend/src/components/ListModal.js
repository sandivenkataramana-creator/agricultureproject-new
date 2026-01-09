import React from 'react';
import { FiX } from 'react-icons/fi';
import './ListModal.css';

const ListModal = ({ isOpen, onClose, title, items, columns, formatItem }) => {
  if (!isOpen) return null;

  return (
    <div className="list-modal-overlay" onClick={onClose}>
      <div className="list-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="list-modal-header">
          <h2>{title}</h2>
          <button className="list-modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>
        <div className="list-modal-body">
          {items && items.length > 0 ? (
            <table className="list-modal-table">
              <thead>
                <tr>
                  {columns.map((col, index) => (
                    <th key={index}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    {columns.map((col, colIndex) => (
                      <td key={colIndex}>
                        {formatItem ? formatItem(item, col.key) : item[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="list-modal-empty">
              <p>No data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListModal;



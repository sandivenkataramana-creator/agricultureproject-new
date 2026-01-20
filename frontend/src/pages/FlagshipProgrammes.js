import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { FiDownload, FiUpload, FiRefreshCw, FiTrash2, FiFileText, FiEye, FiX } from 'react-icons/fi';
import {
  getFlagshipProgrammes,
  getFlagshipProgrammesByDepartment,
  uploadFlagshipData,
  getImportHistory,
  deleteFlagshipProgramme,
  exportFlagshipProgrammesCSV
} from '../services/api';
import * as XLSX from 'xlsx';

const FlagshipProgrammes = () => {
  const [programmes, setProgrammes] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('programmes'); // 'programmes' or 'reports'
  const [importHistory, setImportHistory] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [fileData, setFileData] = useState(null);
  const [importType, setImportType] = useState('programme');
  const [departmentInput, setDepartmentInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [viewDetailsModal, setViewDetailsModal] = useState(false);
  const [selectedItemData, setSelectedItemData] = useState(null);
  const [uploadSummary, setUploadSummary] = useState(null);
  const pageSize = 10;

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = user.role === 'superadmin';

  // Fetch programmes on mount and when filters change
  useEffect(() => {
    fetchProgrammes();
  }, [selectedDepartment]);

  const fetchProgrammes = async () => {
    try {
      setLoading(true);
      const params = selectedDepartment ? { department: selectedDepartment } : {};
      const response = await getFlagshipProgrammes(params);
      
      // Separate programmes and reports based on type field
      const progs = response.data.filter(item => item.type === 'programme' || (!item.type && !item.report_date)) || [];
      const reps = response.data.filter(item => item.type === 'report' || item.report_date) || [];
      
      setProgrammes(progs);
      setReports(reps);
      
      if (isSuperAdmin) {
        fetchImportHistory();
      }
    } catch (error) {
      console.error('Error fetching programmes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchImportHistory = async () => {
    try {
      const response = await getImportHistory();
      setImportHistory(response.data || []);
    } catch (error) {
      console.error('Error fetching import history:', error);
    }
  };

  const handleFileUpload = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      setUploading(true);
      
      // Parse Excel file
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert sheet to array of arrays to handle multi-row headers
          const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          
          if (rawData.length < 3) {
            alert('No data found in the Excel file');
            setUploading(false);
            return;
          }
          
          // For multi-row headers, we need to combine section headers with column names
          // Row 0: Section headers (Bills Preferred, Bills Cleared, Pending)
          // Row 1: Actual column names (No. of Bills, Amount (Cr), etc.)
          // Row 2+: Data rows
          
          const sectionHeaders = rawData[0]; // First row with merged section titles
          const columnHeaders = rawData[1];  // Second row with actual column names
          
          // Create combined headers
          const headers = columnHeaders.map((colName, idx) => {
            const col = colName?.toString().trim();
            const section = sectionHeaders[idx]?.toString().trim();
            
            // If we have both section and column name, combine them
            if (section && col && section !== col) {
              return `${section} - ${col}`;
            }
            // If only column name exists
            if (col) {
              return col;
            }
            // If only section exists
            if (section) {
              return section;
            }
            // Fallback
            return `Column_${idx + 1}`;
          });
          
          // Look backwards for section headers for empty column names
          for (let i = 0; i < headers.length; i++) {
            if (headers[i].startsWith('Column_') && columnHeaders[i]?.toString().trim()) {
              // This column has a name but no section, use the column name
              headers[i] = columnHeaders[i].toString().trim();
            } else if (headers[i].startsWith('Column_')) {
              // Find the nearest non-empty section header to the left
              for (let j = i - 1; j >= 0; j--) {
                const prevSection = sectionHeaders[j]?.toString().trim();
                if (prevSection) {
                  const colName = columnHeaders[i]?.toString().trim();
                  headers[i] = colName ? `${prevSection} - ${colName}` : `${prevSection}_${i + 1}`;
                  break;
                }
              }
            }
          }
          
          // Convert data rows to objects using the headers (skip first 2 rows)
          const data = [];
          for (let i = 2; i < rawData.length; i++) {
            const row = rawData[i];
            // Skip completely empty rows
            if (row.every(cell => !cell || cell.toString().trim() === '')) {
              continue;
            }
            
            const rowObj = {};
            headers.forEach((header, idx) => {
              const cellValue = row[idx];
              rowObj[header] = cellValue !== undefined && cellValue !== null ? cellValue : '';
            });
            data.push(rowObj);
          }

          if (data.length === 0) {
            alert('No data rows found in the Excel file');
            setUploading(false);
            return;
          }

          // Get programme/report name from filename or use first sheet name
          const fileNameWithoutExt = file.name.replace(/\.(xlsx|xls|csv)$/i, '');
          const programmeName = fileNameWithoutExt || sheetName;

          // Send entire dataset as a single record
          const response = await uploadFlagshipData({
            file_data: [data], // Wrap the entire array in another array so backend treats it as single record
            file_name: file.name,
            import_type: importType,
            department_name: departmentInput || 'General',
            programme_name: programmeName,
            record_count: data.length
          });

          if (response.data.success) {
            alert(`Successfully imported ${data.length} records from ${file.name}`);
            setFileData(null);
            setDepartmentInput('');
            setUploadSummary({
              total: data.length,
              successful: data.length,
              failed: 0
            });
            fetchProgrammes();
          }
        } catch (error) {
          console.error('Error processing file:', error);
          alert('Error processing file: ' + error.message);
        } finally {
          setUploading(false);
        }
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteFlagshipProgramme(id);
        fetchProgrammes();
      } catch (error) {
        alert('Error deleting item: ' + error.message);
      }
    }
  };

  const handleExport = async () => {
    try {
      const response = await exportFlagshipProgrammesCSV(selectedDepartment);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `flagship_${importType}s_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Error exporting data');
    }
  };

  const handleViewDetails = (item) => {
    let parsedData = item.data;
    if (typeof item.data === 'string') {
      try {
        parsedData = JSON.parse(item.data);
      } catch (e) {
        parsedData = item.data;
      }
    }
    setSelectedItemData({
      ...item,
      parsedData: parsedData
    });
    setViewDetailsModal(true);
  };

  const renderDataTable = (data) => {
    if (!data) return <p>No data available</p>;
    
    // If data is an array of objects
    if (Array.isArray(data) && data.length > 0) {
      const keys = Object.keys(data[0]);
      return (
        <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#f5f5f5', zIndex: 1 }}>
              <tr>
                {keys.map((key, idx) => (
                  <th key={idx} style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIdx) => (
                <tr key={rowIdx} style={{ borderBottom: '1px solid #eee' }}>
                  {keys.map((key, colIdx) => (
                    <td key={colIdx} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                      {row[key] !== null && row[key] !== undefined ? String(row[key]) : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    // If data is a single object
    if (typeof data === 'object' && !Array.isArray(data)) {
      return (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead style={{ background: '#f5f5f5' }}>
              <tr>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Field</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data).map(([key, value], idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px', fontWeight: '500' }}>{key}</td>
                  <td style={{ padding: '10px' }}>{value !== null && value !== undefined ? String(value) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    return <p>{String(data)}</p>;
  };

  const displayData = activeTab === 'programmes' ? programmes : reports;
  const paginatedData = displayData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const totalPages = Math.ceil(displayData.length / pageSize);

  return (
    <div className="page-container">
      <Header />
      <h4 style={{ marginBottom: '20px' }}>Department-wise Flagship Programmes & Reports</h4>
      <div style={{ padding: '20px' }}>
        

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #eee' }}>
          <button
            onClick={() => { setActiveTab('programmes'); setCurrentPage(0); }}
            style={{
              padding: '12px 20px',
              background: activeTab === 'programmes' ? '#667eea' : '#f5f5f5',
              color: activeTab === 'programmes' ? '#fff' : '#333',
              border: 'none',
              borderBottom: activeTab === 'programmes' ? '3px solid #667eea' : 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            <FiFileText style={{ marginRight: '5px' }} /> Flagship Programmes ({programmes.length})
          </button>
          <button
            onClick={() => { setActiveTab('reports'); setCurrentPage(0); }}
            style={{
              padding: '12px 20px',
              background: activeTab === 'reports' ? '#667eea' : '#f5f5f5',
              color: activeTab === 'reports' ? '#fff' : '#333',
              border: 'none',
              borderBottom: activeTab === 'reports' ? '3px solid #667eea' : 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            <FiFileText style={{ marginRight: '5px' }} /> Reports ({reports.length})
          </button>
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <select
            value={selectedDepartment}
            onChange={(e) => { setSelectedDepartment(e.target.value); setCurrentPage(0); }}
            style={{
              padding: '8px 12px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              fontSize: '14px'
            }}
          >
            <option value="">All Departments</option>
            <option value="Agriculture">Agriculture</option>
            <option value="Horticulture">Horticulture</option>
            <option value="Animal Husbandry">Animal Husbandry</option>
            <option value="Fisheries">Fisheries</option>
          </select>

          {isSuperAdmin && (
            <>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleExport}
                  style={{
                    padding: '8px 16px',
                    background: '#4CAF50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <FiDownload /> Export CSV
                </button>
                <label style={{
                  padding: '8px 16px',
                  background: '#667eea',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <FiUpload /> Upload Excel
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    disabled={uploading}
                  />
                </label>
              </div>
            </>
          )}
        </div>

        {/* Upload Form */}
        {isSuperAdmin && (
          <div style={{
            background: '#f9f9f9',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #eee'
          }}>
            <h3>Upload New Data</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <select
                value={importType}
                onChange={(e) => setImportType(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '5px',
                  border: '1px solid #ddd'
                }}
              >
                <option value="programme">Flagship Programme</option>
                <option value="report">Report</option>
              </select>
              <input
                type="text"
                placeholder="Department Name (optional)"
                value={departmentInput}
                onChange={(e) => setDepartmentInput(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '5px',
                  border: '1px solid #ddd'
                }}
              />
              <label style={{
                padding: '8px 16px',
                background: uploading ? '#ccc' : '#667eea',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: uploading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {uploading ? 'Uploading...' : 'Select Excel File'}
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
              </label>
            </div>
            
            {/* Upload Summary */}
            {uploadSummary && (
              <div style={{
                marginTop: '15px',
                padding: '12px',
                background: '#e8f5e9',
                borderRadius: '6px',
                border: '1px solid #4caf50'
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#2e7d32' }}>Upload Summary</h4>
                <div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
                  <span><strong>Total Records:</strong> {uploadSummary.total}</span>
                  <span style={{ color: '#4caf50' }}><strong>Successful:</strong> {uploadSummary.successful}</span>
                  <span style={{ color: '#f44336' }}><strong>Failed:</strong> {uploadSummary.failed}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Data Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="spinner"></div>
          </div>
        ) : paginatedData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            No {activeTab} found
          </div>
        ) : (
          <div className="table-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Department</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>
                    {activeTab === 'programmes' ? 'Programme Name' : 'Report Name'}
                  </th>
                  {activeTab === 'reports' && (
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Date</th>
                  )}
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Records Count</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item, idx) => {
                  let recordCount = 0;
                  try {
                    const data = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
                    recordCount = Array.isArray(data) ? data.length : 1;
                  } catch (e) {
                    recordCount = 0;
                  }
                  
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px' }}>{item.department_name || '-'}</td>
                      <td style={{ padding: '12px', fontWeight: '500' }}>
                        {item.programme_name || item.report_name || '-'}
                      </td>
                      {activeTab === 'reports' && (
                        <td style={{ padding: '12px' }}>
                          {item.report_date ? new Date(item.report_date).toLocaleDateString('en-IN') : '-'}
                        </td>
                      )}
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 12px',
                          background: '#e3f2fd',
                          color: '#1976d2',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: '600'
                        }}>
                          {recordCount} {recordCount === 1 ? 'record' : 'records'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleViewDetails(item)}
                            style={{
                              padding: '6px 12px',
                              background: '#2196F3',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '12px'
                            }}
                          >
                            <FiEye size={14} /> View Details
                          </button>
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              style={{
                                padding: '6px 12px',
                                background: '#F44336',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '12px'
                              }}
                            >
                              <FiTrash2 size={14} /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '10px',
            marginTop: '20px',
            padding: '20px'
          }}>
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              style={{
                padding: '8px 16px',
                background: currentPage === 0 ? '#ccc' : '#667eea',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: currentPage === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>
            <span style={{ padding: '8px 16px', background: '#f5f5f5', borderRadius: '4px' }}>
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              style={{
                padding: '8px 16px',
                background: currentPage === totalPages - 1 ? '#ccc' : '#667eea',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          </div>
        )}

        {/* Import History */}
        {isSuperAdmin && importHistory.length > 0 && (
          <div style={{ marginTop: '40px' }}>
            <h2>Import History</h2>
            <div className="table-wrapper">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>File Name</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Total</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Success</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Failed</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {importHistory.slice(0, 10).map((record, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px' }}>{record.file_name || '-'}</td>
                      <td style={{ padding: '12px' }}>{record.import_type || '-'}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{record.total_records || 0}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#4CAF50', fontWeight: '600' }}>
                        {record.successful_records || 0}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#F44336', fontWeight: '600' }}>
                        {record.failed_records || 0}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          background: record.status === 'completed' ? '#c8e6c9' : '#fff3cd',
                          color: record.status === 'completed' ? '#2e7d32' : '#856404',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {record.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '12px' }}>
                        {new Date(record.created_at).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {viewDetailsModal && selectedItemData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '1200px',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f5f5f5'
            }}>
              <div>
                <h2 style={{ margin: '0 0 5px 0', fontSize: '20px' }}>
                  {selectedItemData.programme_name || selectedItemData.report_name}
                </h2>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                  Department: {selectedItemData.department_name || 'N/A'}
                </p>
              </div>
              <button
                onClick={() => setViewDetailsModal(false)}
                style={{
                  background: '#f44336',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '20px'
                }}
              >
                <FiX />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{
              padding: '24px',
              overflowY: 'auto',
              flex: 1
            }}>
              {renderDataTable(selectedItemData.parsedData)}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'flex-end',
              background: '#f5f5f5'
            }}>
              <button
                onClick={() => setViewDetailsModal(false)}
                style={{
                  padding: '10px 24px',
                  background: '#667eea',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlagshipProgrammes;

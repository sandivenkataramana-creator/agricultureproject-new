import axios from 'axios';
import { API_BASE_URL } from '../config/config';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available (except for public endpoints)
api.interceptors.request.use((config) => {
  // List of public endpoints that don't require authentication (use exact match to avoid false positives)
  const publicEndpoints = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password'
  ];
  
  // Check if the request URL matches any public endpoint (exact endpoint match, not substring)
  const isPublicEndpoint = publicEndpoints.some(endpoint => 
    config.url && (config.url === endpoint || config.url.endsWith(endpoint))
  );
  
  // Only add token if not a public endpoint
  if (!isPublicEndpoint) {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        if (userData && userData.token) {
          config.headers.Authorization = `Bearer ${userData.token}`;
        } else {
          console.warn('User data found but no token present:', userData ? Object.keys(userData) : 'null');
        }
      } else {
        console.warn('No user found in localStorage for protected request:', config.url);
      }
    } catch (e) {
      console.error('Error reading user from localStorage:', e);
    }
  }
  return config;
});

// Global response handler: handle 401 Unauthorized centrally (but only for protected endpoints)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // List of public endpoints
      const publicEndpoints = ['/nodal-officers'];
      const isPublicEndpoint = publicEndpoints.some(endpoint => 
        error.config.url && error.config.url.includes(endpoint)
      );
      
      // Only redirect to login if it's not a public endpoint
      if (!isPublicEndpoint) {
        localStorage.removeItem('user');
        alert('Session expired or unauthorized. Please sign in again.');
        window.location = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (userData) => api.post('/auth/register', userData);
export const registerUser = (userData) => api.post('/auth/register-user', userData);
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const resetPassword = (data) => api.post('/auth/reset-password', data);
export const changePassword = (data) => api.post('/auth/change-password', data);
export const verifyToken = () => api.get('/auth/verify');
export const getCurrentUser = (userId) => api.get(`/auth/me?userId=${userId}`);

// Dashboard
export const getDashboardStats = (params = {}) => api.get('/dashboard/stats', { params });
export const getDashboardQuickStats = (params = {}) => api.get('/dashboard/quick-stats', { params });
export const getDashboardSchemesSummary = (params = {}) => api.get('/dashboard/schemes-summary', { params });
export const getDashboardBudgetSummary = (params = {}) => api.get('/dashboard/budget-summary', { params });
export const getDashboardBudgetBreakdown = (params = {}) => api.get('/dashboard/budget-breakdown', { params });
export const getSchemesByCategory = (params = {}) => api.get('/dashboard/schemes-by-category', { params });
export const getHODsByDepartment = (params = {}) => api.get('/dashboard/hods-by-department', { params });
export const getBudgetByHOD = (params = {}) => api.get('/dashboard/budget-by-hod', { params });
export const getSchemesByHOD = (params = {}) => api.get('/dashboard/schemes-by-hod', { params });
export const getAttendanceByHOD = (params = {}) => api.get('/dashboard/attendance-by-hod', { params });
export const getRevenueByHOD = (params = {}) => api.get('/dashboard/revenue-by-hod', { params });
export const getRevenueByDepartment = (params = {}) => api.get('/dashboard/revenue-by-department', { params });
export const getKPISummary = (params = {}) => api.get('/dashboard/kpi-summary', { params });

// Scheme financial progress (CSS report)
export const getSchemeFinancialProgress = (params = {}) => api.get('/schemes/financial-progress', { params });

// Categories
export const getCategories = () => api.get('/categories');
export const getCategoryById = (id) => api.get(`/categories/${id}`);
export const createCategory = (data) => api.post('/categories', data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// Locations
export const getStates = () => api.get('/locations/states');
export const getDistricts = () => api.get('/locations/districts');
export const getDistrictsByState = (stateId) => api.get(`/locations/districts/${stateId}`);
export const getMandalsByDistrict = (districtId) => api.get(`/locations/mandals/${districtId}`);
export const getAllMandals = () => api.get('/locations/mandals');
export const getVillagesByMandal = (mandalId) => api.get(`/locations/villages/mandal/${mandalId}`);
export const getVillagesByDistrict = (districtId) => api.get(`/locations/villages/district/${districtId}`);
export const getVillagesByState = (stateId) => api.get(`/locations/villages/state/${stateId}`);
export const getLocationCounts = () => api.get('/locations/counts');

// Search
export const searchAll = (query) => api.get(`/search?q=${encodeURIComponent(query)}`);

// Notifications
export const getNotifications = (userId) => api.get('/notifications', { params: userId ? { userId } : {} });
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`);
export const sendNotification = (data) => api.post('/notifications/send', data);

// Messages
export const getMessages = (userId) => api.get('/messages', { params: userId ? { userId } : {} });
export const markMessageRead = (id) => api.put(`/messages/${id}/read`);
export const sendMessage = (data) => api.post('/messages/send', data);

// Users
export const getUsers = () => api.get('/users');

// HODs
export const getHODs = () => api.get('/hods');
export const getHODById = (id) => api.get(`/hods/${id}`);
export const getHODDetails = (id) => api.get(`/hods/${id}/details`);
export const createHOD = (data) => api.post('/hods', data);
export const updateHOD = (id, data) => api.put(`/hods/${id}`, data);
export const deleteHOD = (id) => api.delete(`/hods/${id}`);

// Schemes
export const getSchemes = () => api.get('/schemes');
export const getSchemeById = (id) => api.get(`/schemes/${id}`);
export const getSchemesByHODId = (hodId) => api.get(`/schemes/hod/${hodId}`);
export const createScheme = (data) => api.post('/schemes', data);
export const updateScheme = (id, data) => api.put(`/schemes/${id}`, data);
export const deleteScheme = (id) => api.delete(`/schemes/${id}`);

// Beneficiaries
export const searchBeneficiaries = (filters) => api.post('/beneficiaries/search', filters);
export const exportBeneficiaries = (filters, format = 'csv') => api.post(`/beneficiaries/export?format=${format}`, filters, { responseType: 'blob' });
export const importBeneficiaries = (formData) => api.post('/beneficiaries/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getImportJobStatus = (jobId) => api.get(`/beneficiaries/import/${jobId}/status`);
export const getBeneficiariesSummary = (params) => api.get('/beneficiaries/summary', { params });

// DAO
export const getDAOs = () => api.get('/dao');

// Scheme Budget Allocations
export const getSchemeBudgetAllocations = () => api.get('/schemes/budget-allocations/all');
export const getSchemeBudgetAllocationsByScheme = (schemeId) => api.get(`/schemes/${schemeId}/budget-allocations`);
export const createSchemeBudgetAllocation = (schemeId, data) => api.post(`/schemes/${schemeId}/budget-allocations`, data);
export const updateSchemeBudgetAllocation = (id, data) => api.put(`/schemes/budget-allocations/${id}`, data);
export const deleteSchemeBudgetAllocation = (id) => api.delete(`/schemes/budget-allocations/${id}`);

// Staff
export const getStaff = () => api.get('/staff');
export const getStaffById = (id) => api.get(`/staff/${id}`);
export const getStaffByHODId = (hodId) => api.get(`/staff/hod/${hodId}`);
export const createStaff = (data) => api.post('/staff', data);
export const updateStaff = (id, data) => api.put(`/staff/${id}`, data);
export const deleteStaff = (id) => api.delete(`/staff/${id}`);

// Budget
export const getBudget = () => api.get('/budget');
export const getBudgetById = (id) => api.get(`/budget/${id}`);
export const getBudgetByHODId = (hodId) => api.get(`/budget/hod/${hodId}`);
export const getBudgetSummary = () => api.get('/budget/summary/overview');
export const createBudget = (data) => api.post('/budget', data);
export const updateBudget = (id, data) => api.put(`/budget/${id}`, data);
export const deleteBudget = (id) => api.delete(`/budget/${id}`);

// KPIs
export const getKPIs = () => api.get('/kpis');
export const getKPIById = (id) => api.get(`/kpis/${id}`);
export const getKPIsByHODId = (hodId) => api.get(`/kpis/hod/${hodId}`);
export const createKPI = (data) => api.post('/kpis', data);
export const updateKPI = (id, data) => api.put(`/kpis/${id}`, data);
export const deleteKPI = (id) => api.delete(`/kpis/${id}`);

// Nodal Officers
export const getNodalOfficers = () => api.get('/nodal-officers');
export const getNodalOfficerById = (id) => api.get(`/nodal-officers/${id}`);
export const createNodalOfficer = (data) => api.post('/nodal-officers', data);
export const updateNodalOfficer = (id, data) => api.put(`/nodal-officers/${id}`, data);
export const deleteNodalOfficer = (id) => api.delete(`/nodal-officers/${id}`);

// Attendance
export const getAttendance = () => api.get('/attendance');
export const getAttendanceByRange = (startDate, endDate) => 
  api.get(`/attendance/range?start_date=${startDate}&end_date=${endDate}`);
export const getAttendanceByHODId = (hodId) => api.get(`/attendance/hod/${hodId}`);
export const getAttendanceSummaryByHOD = () => api.get('/attendance/summary/by-hod');
export const getAttendanceStatistics = (params = {}) => api.get('/attendance/statistics', { params });
export const getAttendanceFiltered = (params = {}) => api.get('/attendance/filtered', { params });
export const getDepartmentWiseAttendance = (params = {}) => api.get('/attendance/department-wise', { params });
export const createAttendance = (data) => api.post('/attendance', data);
export const updateAttendance = (id, data) => api.put(`/attendance/${id}`, data);
export const deleteAttendance = (id) => api.delete(`/attendance/${id}`);

// Revenue
export const getRevenue = () => api.get('/revenue');
export const getRevenueByHODId = (hodId) => api.get(`/revenue/hod/${hodId}`);
export const getRevenueSummaryByHOD = () => api.get('/revenue/summary/by-hod');
export const createRevenue = (data) => api.post('/revenue', data);
export const updateRevenue = (id, data) => api.put(`/revenue/${id}`, data);
export const deleteRevenue = (id) => api.delete(`/revenue/${id}`);

// Flagship Programmes
export const getFlagshipProgrammes = (params = {}) => api.get('/flagship-programmes', { params });
export const getFlagshipProgrammeById = (id) => api.get(`/flagship-programmes/${id}`);
export const getFlagshipProgrammesByDepartment = (departmentId) => 
  api.get(`/flagship-programmes/department/${departmentId}`);
export const uploadFlagshipData = (data) => api.post('/flagship-programmes/upload', data);
export const getImportHistory = () => api.get('/flagship-programmes/import-history');
export const getImportBatchDetails = (batchId) => api.get(`/flagship-programmes/batch/${batchId}`);
export const deleteFlagshipProgramme = (id) => api.delete(`/flagship-programmes/${id}`);
export const exportFlagshipProgrammesCSV = (department = '') => 
  api.get(`/flagship-programmes/export/csv${department ? `?department=${department}` : ''}`);

export default api;


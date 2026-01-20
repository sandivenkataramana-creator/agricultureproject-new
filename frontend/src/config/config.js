/**
 * Frontend Configuration - Centralized URL Management
 * 
 * This file exports the API base URL that automatically switches based on environment.
 * Use this instead of hardcoding localhost URLs.
 * 
 * Usage in components:
 * import { API_BASE_URL } from '../config/config';
 * fetch(`${API_BASE_URL}/endpoint`)
 */

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Remove '/api' suffix for cases where you need just the base URL
export const API_SERVER_URL = API_BASE_URL.replace('/api', '');

export default {
  API_BASE_URL,
  API_SERVER_URL
};

// src/services/apiService.js
/**
 * API Service for communicating with the backend
 */

// Get API URL from environment with multiple fallbacks
const getApiBaseUrl = () => {
  // Try Vite variable first (for Vite builds)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Try React App variable (for Create React App)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Check if backend is enabled and use production server IP
  if (process.env.REACT_APP_BACKEND_ENABLED !== 'false' && process.env.REACT_APP_PRODUCTION_SERVER_IP) {
    return `http://${process.env.REACT_APP_PRODUCTION_SERVER_IP}:3002`;
  }
  
  // Default fallback
  return 'http://localhost:3002';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔧 API Service initialized with base URL:', API_BASE_URL);

/**
 * Import data to the database via API
 * @param {Object} data - Data to import (requirements, testCases, versions, mappings)
 * @returns {Promise<Object>} Import result with summary
 */
export const importDataToDatabase = async (data) => {
  try {
    console.log('📤 Sending import request to API:', API_BASE_URL);
    console.log('📊 Data summary:', {
      requirements: data.requirements?.length || 0,
      testCases: data.testCases?.length || 0,
      versions: data.versions?.length || 0,
      mappings: data.mappings ? Object.keys(data.mappings).length : 0
    });

    const response = await fetch(`${API_BASE_URL}/api/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Import successful:', result);
    return result;
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  }
};

/**
 * Test API connection
 * @returns {Promise<Object>} Health check result
 */
export const testConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API connection test failed:', error);
    throw error;
  }
};

export default {
  importDataToDatabase,
  testConnection,
  API_BASE_URL
};
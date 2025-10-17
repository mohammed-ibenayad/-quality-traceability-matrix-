import axios from 'axios';

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3002',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // You can modify the request config here (add headers, authentication, etc.)
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // You can modify the response data here
    return response;
  },
  (error) => {
    // Handle response errors here
    if (error.response) {
      // Server responded with an error status code
      console.error('API Error:', error.response.status, error.response.data);
      
      // Handle authentication errors
      if (error.response.status === 401) {
        // Redirect to login or refresh token
        // For example:
        // window.location.href = '/login';
      }
    } else if (error.request) {
      // Request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something else caused the error
      console.error('Error setting up request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
import axios from 'axios';

// Create axios instance with a relative URL base path
const apiClient = axios.create({
  // Use relative URL without explicit host or port
  // This will use the same host/port as the current page (working through Nginx proxy)
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
  // Add a reasonable timeout
  timeout: 15000, // 15 seconds
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    // You can add authorization headers here if needed
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with an error status code
      console.error('API Error:', error.response.status, error.response.data);
      
      // Handle 401 Unauthorized - redirect to login
      if (error.response.status === 401) {
        // Redirect to login page or refresh token
        console.warn('Session expired or unauthorized. Redirecting to login...');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        
        // Only redirect if not already on the login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
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
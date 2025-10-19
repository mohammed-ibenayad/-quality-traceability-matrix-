import apiClient from '../utils/apiClient';

// Keys for localStorage
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

const authService = {
  /**
   * Authenticate user with email and password
   */
  login: async (email, password) => {
    try {
      console.log('🔐 Attempting login for:', email);
      
      // Call the backend API
      const response = await apiClient.post('/api/auth/login', {
        email,
        password
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Login failed');
      }

      const { token, user } = response.data;

      // Store token and user in localStorage
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      // Set authorization header for future requests
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      console.log('✅ Login successful');
      
      return user;
    } catch (error) {
      console.error('❌ Login error:', error);
      
      // Handle API error responses
      if (error.response && error.response.data) {
        throw new Error(error.response.data.error || 'Login failed');
      }
      
      throw error;
    }
  },

  /**
   * Remove token and user info
   */
  logout: () => {
    console.log('🚪 Logging out');
    
    // Clear localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    
    // Remove authorization header
    delete apiClient.defaults.headers.common['Authorization'];
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    return token !== null;
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem(USER_KEY);
    
    if (!userStr) {
      return null;
    }
    
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Failed to parse user data:', error);
      return null;
    }
  },

  /**
   * Get authentication token
   */
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Initialize auth service (call on app start)
   */
  initialize: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (token) {
      // Set authorization header if token exists
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('🔑 Auth token restored from localStorage');
    }
  },

  /**
   * Verify if the current token is still valid
   */
  verifyToken: async () => {
    try {
      const response = await apiClient.get('/api/auth/me');
      
      if (response.data.success) {
        // Update user data in localStorage
        localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token verification failed:', error);
      // Token is invalid, clear auth data
      authService.logout();
      return false;
    }
  }
};

export default authService;
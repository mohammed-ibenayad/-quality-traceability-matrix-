import apiClient from '../utils/apiClient';

// Keys for localStorage
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Default user for development
const DEFAULT_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Admin User',
  email: 'admin@qualitytracker.local',
  role: 'admin'
};

const authService = {
  /**
   * Authenticate user and store token
   */
  login: async (email, password) => {
    try {
      // In a real app, you would call your authentication API
      // const response = await apiClient.post('/api/auth/login', { email, password });
      
      // For development, simulate a successful login with the default user
      if (process.env.NODE_ENV === 'development' || email === 'admin@qualitytracker.local') {
        // Simulate API response delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock token and user
        const mockToken = 'mock_token_for_development';
        
        // Store token and user in localStorage
        localStorage.setItem(TOKEN_KEY, mockToken);
        localStorage.setItem(USER_KEY, JSON.stringify(DEFAULT_USER));
        
        // Set authorization header for future requests
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
        
        return DEFAULT_USER;
      }
      
      throw new Error('Invalid credentials');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  /**
   * Remove token and user info
   */
  logout: () => {
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
    // In development, always consider authenticated if there's a token
    if (process.env.NODE_ENV === 'development') {
      return localStorage.getItem(TOKEN_KEY) !== null;
    }
    
    // In production, you might want to validate the token or check expiration
    return localStorage.getItem(TOKEN_KEY) !== null;
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
    // Set authorization header if token exists
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }
};

export default authService;
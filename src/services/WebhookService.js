// src/services/WebhookService.js - Super Simple Version
class WebhookService {
  constructor() {
    this.initURLs();
    this.socket = null;
    this.connected = false;
    this.requestListeners = new Map();
    this.testCaseResults = new Map();
    this.activeRequests = new Map();
    
    console.log('🔧 WebhookService URLs:', {
      backend: this.baseURL,
      api: this.apiBaseURL,
      webhook: this.webhookURL
    });
  }

  // ✅ SUPER SIMPLE URL DETECTION
  initURLs() {
    const hostname = window?.location?.hostname || 'localhost';
    const prodIP = process.env.REACT_APP_PRODUCTION_SERVER_IP || '213.6.2.229';
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Development
      this.baseURL = 'http://localhost:3001';
      this.apiBaseURL = 'http://localhost:3001';
      this.webhookURL = 'http://localhost:3001/api/webhook/test-results';
    } else {
      // Production
      this.baseURL = `http://${prodIP}:3001`;
      this.apiBaseURL = `http://${prodIP}`;
      this.webhookURL = `http://${prodIP}/api/webhook/test-results`;
    }

    // Set environment variables for other components
    process.env.REACT_APP_API_URL = this.apiBaseURL;
    process.env.REACT_APP_BACKEND_URL = this.baseURL;
    process.env.REACT_APP_WEBHOOK_URL = this.webhookURL;
    process.env.VITE_API_URL = this.apiBaseURL;
    process.env.REACT_APP_BACKEND_ENABLED = 'true';
  }

  async checkBackendHealth() {
    try {
      const response = await fetch(`${this.apiBaseURL}/api/webhook/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000)
      });
      
      if (response.ok) {
        console.log('✅ Backend health check passed');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Backend unreachable:', error.message);
      return false;
    }
  }

  async connect() {
    try {
      const { io } = await import('socket.io-client');
      
      this.socket = io(this.baseURL, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
      });

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log('⏰ Socket.IO timeout - using HTTP mode');
          resolve();
        }, 10000);

        this.socket.on('connect', () => {
          clearTimeout(timeout);
          this.connected = true;
          console.log('✅ Socket.IO connected');
          resolve();
        });

        this.socket.on('test-case-result', (data) => {
          this.handleTestCaseResult(data);
        });

        this.socket.on('connect_error', () => {
          clearTimeout(timeout);
          console.log('❌ Socket.IO failed - using HTTP mode');
          resolve();
        });
      });
    } catch (error) {
      console.log('🔄 Socket.IO unavailable - using HTTP mode');
    }
  }

  handleTestCaseResult(data) {
    const { requestId, testCaseId, testCase } = data;
    
    if (!this.testCaseResults.has(requestId)) {
      this.testCaseResults.set(requestId, new Map());
    }
    
    this.testCaseResults.get(requestId).set(testCaseId, {
      ...testCase,
      receivedAt: new Date().toISOString()
    });
    
    const callback = this.requestListeners.get(requestId);
    if (callback) {
      callback({
        type: 'test-case-update',
        requestId,
        testCaseId,
        testCase,
        allResults: this.getAllTestCaseResults(requestId)
      });
    }
  }

  getAllTestCaseResults(requestId) {
    const results = this.testCaseResults.get(requestId);
    if (!results) return [];
    
    return Array.from(results.entries()).map(([testCaseId, result]) => ({
      id: testCaseId,
      ...result
    }));
  }

  subscribeToRequest(requestId, callback) {
    this.requestListeners.set(requestId, callback);
    
    if (!this.activeRequests.has(requestId)) {
      this.activeRequests.set(requestId, {
        testCaseIds: new Set(),
        startTime: new Date().toISOString(),
        status: 'active'
      });
    }
    
    if (this.socket?.connected) {
      this.socket.emit('subscribe-request', requestId);
    }
  }

  unsubscribeFromRequest(requestId) {
    this.requestListeners.delete(requestId);
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe-request', requestId);
    }
  }

  async fetchRequestResults(requestId) {
    try {
      const response = await fetch(`${this.apiBaseURL}/api/test-results/request/${requestId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error(`❌ Error fetching results for ${requestId}:`, error);
      return null;
    }
  }

  async clearResults(requestId) {
    try {
      const response = await fetch(`${this.apiBaseURL}/api/test-results/request/${requestId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        this.testCaseResults.delete(requestId);
        this.activeRequests.delete(requestId);
        return await response.json();
      }
    } catch (error) {
      console.error(`❌ Error clearing results for ${requestId}:`, error);
    }
  }

  getConfiguration() {
    return {
      baseURL: this.baseURL,
      apiBaseURL: this.apiBaseURL,
      webhookURL: this.webhookURL,
      environment: window?.location?.hostname === 'localhost' ? 'development' : 'production',
      socketConnected: this.connected
    };
  }

  isConnected() {
    return this.connected;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }
}

// Helper function for GitHub workflows
const getCallbackUrl = () => {
  const hostname = window?.location?.hostname || 'localhost';
  const prodIP = process.env.REACT_APP_PRODUCTION_SERVER_IP || '213.6.2.229';
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001/api/webhook/test-results';
  } else {
    return `http://${prodIP}/api/webhook/test-results`;
  }
};

// Create singleton instance
const webhookService = new WebhookService();

// Auto-initialize
if (typeof window !== 'undefined') {
  window.webhookService = webhookService;
  
  webhookService.checkBackendHealth()
    .then(isHealthy => {
      if (isHealthy) {
        return webhookService.connect();
      }
    })
    .then(() => {
      console.log(webhookService.isConnected() ? 
        '🎉 WebhookService ready with real-time updates!' : 
        '📡 WebhookService ready (HTTP mode)');
    })
    .catch(error => {
      console.error('❌ WebhookService initialization failed:', error);
    });
}

export default webhookService;
export { getCallbackUrl };
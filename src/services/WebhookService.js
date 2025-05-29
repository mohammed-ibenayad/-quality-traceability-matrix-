// src/services/WebhookService.js - Frontend integration with backend
import { io } from 'socket.io-client';

class WebhookService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.baseURL = 'http://localhost:3001';
    //this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    this.connected = false;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 3;
  }

  /**
   * Initialize WebSocket connection to backend
   */
  connect() {
    if (this.socket && this.connected) {
      console.log('🔌 Already connected to webhook backend');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      console.log(`🔌 Connecting to webhook backend at ${this.baseURL}...`);
      
      this.socket = io(this.baseURL, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to webhook backend');
        this.connected = true;
        this.connectionAttempts = 0;
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from webhook backend:', reason);
        this.connected = false;
      });

      // Listen for webhook broadcasts
      this.socket.on('webhook-received', (data) => {
        console.log('🔔 Webhook broadcast received:', data);
        this.handleWebhookData(data);
      });

      // Listen for targeted test results
      this.socket.on('test-results', (data) => {
        console.log('📋 Test results received:', data);
        this.handleWebhookData({ data, requirementId: data.requirementId });
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        this.connectionAttempts++;
        
        if (this.connectionAttempts >= this.maxConnectionAttempts) {
          reject(new Error(`Failed to connect after ${this.maxConnectionAttempts} attempts`));
        }
      });

      // Timeout for connection
      setTimeout(() => {
        if (!this.connected) {
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Check if backend is available
   */
  async checkBackendHealth() {
    try {
      const response = await fetch(`${this.baseURL}/api/webhook/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend health check passed:', data);
        return true;
      } else {
        console.warn('⚠️ Backend health check failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Backend health check error:', error);
      return false;
    }
  }

  /**
   * Subscribe to webhooks for a specific requirement
   */
  subscribeToRequirement(requirementId, callback) {
    console.log(`📝 Subscribing to requirement: ${requirementId}`);
    
    // Store callback for this requirement
    this.listeners.set(requirementId, callback);
    
    // Join requirement-specific room on backend
    if (this.socket && this.connected) {
      this.socket.emit('subscribe-requirement', requirementId);
    }
  }

  /**
   * Unsubscribe from requirement webhooks
   */
  unsubscribeFromRequirement(requirementId) {
    console.log(`📝 Unsubscribing from requirement: ${requirementId}`);
    
    // Remove callback
    this.listeners.delete(requirementId);
    
    // Leave requirement room on backend
    if (this.socket && this.connected) {
      this.socket.emit('unsubscribe-requirement', requirementId);
    }
  }

  /**
   * Handle incoming webhook data
   */
  handleWebhookData(webhookEvent) {
    const { requirementId, data } = webhookEvent;
    
    // Call registered callback for this requirement
    const callback = this.listeners.get(requirementId);
    if (callback) {
      console.log(`🎯 Executing callback for requirement: ${requirementId}`);
      callback(data);
    } else {
      console.log(`⚠️ No listener for requirement: ${requirementId}`);
    }
  }

  /**
   * Fetch latest results from backend API (fallback method)
   */
  async getLatestResults(requirementId) {
    try {
      console.log(`📡 Fetching latest results for: ${requirementId}`);
      
      const response = await fetch(`${this.baseURL}/api/test-results/${requirementId}`);
      
      if (response.status === 404) {
        console.log(`📭 No results found for: ${requirementId}`);
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`📋 Retrieved results for: ${requirementId}`, data);
      
      return data;
    } catch (error) {
      console.error(`❌ Error fetching results for ${requirementId}:`, error);
      throw error;
    }
  }

  /**
   * Poll for results with exponential backoff
   */
  async pollForResults(requirementId, maxAttempts = 10, initialDelay = 2000) {
    console.log(`🔄 Starting to poll for results: ${requirementId}`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const results = await this.getLatestResults(requirementId);
        
        if (results) {
          console.log(`✅ Found results on attempt ${attempt}`);
          return results;
        }
        
        // Exponential backoff: 2s, 4s, 8s, 16s, ...
        const delay = Math.min(initialDelay * Math.pow(2, attempt - 1), 30000); // Cap at 30s
        console.log(`⏳ Attempt ${attempt}/${maxAttempts} - waiting ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
      } catch (error) {
        console.error(`❌ Polling attempt ${attempt} failed:`, error);
        
        if (attempt === maxAttempts) {
          throw new Error(`Failed to get results after ${maxAttempts} attempts`);
        }
      }
    }
    
    throw new Error(`No results found after ${maxAttempts} polling attempts`);
  }

  /**
   * Test the webhook system
   */
  async testWebhook(requirementId = 'REQ-TEST') {
    try {
      console.log(`🧪 Testing webhook for: ${requirementId}`);
      
      const response = await fetch(`${this.baseURL}/api/test-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requirementId,
          results: [
            {
              id: 'TC_001',
              name: 'Test Webhook Delivery',
              status: 'Passed',
              duration: 1000,
              logs: 'Webhook test completed successfully'
            },
            {
              id: 'TC_002',
              name: 'Test Webhook Delivery 2',
              status: 'Failed',
              duration: 800,
              logs: 'Test failed for demonstration purposes'
            }
          ]
        })
      });
      
      if (response.ok) {
        console.log('✅ Test webhook sent successfully');
        return true;
      } else {
        throw new Error(`Test webhook failed: ${response.statusText}`);
      }
      
    } catch (error) {
      console.error('❌ Test webhook error:', error);
      throw error;
    }
  }

  /**
   * Get all stored results (for debugging)
   */
  async getAllResults() {
    try {
      const response = await fetch(`${this.baseURL}/api/test-results`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 All stored results:', data);
        return data;
      } else {
        throw new Error(`Failed to get results: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Error getting all results:', error);
      throw error;
    }
  }

  /**
   * Clear results for a requirement
   */
  async clearResults(requirementId) {
    try {
      const response = await fetch(`${this.baseURL}/api/test-results/${requirementId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        console.log(`🗑️ Cleared results for: ${requirementId}`);
        return true;
      } else {
        throw new Error(`Failed to clear results: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Error clearing results:', error);
      throw error;
    }
  }

  /**
   * Disconnect from backend
   */
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting from webhook backend');
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.listeners.clear();
    }
  }

  /**
   * Get connection status
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Get base URL
   */
  getBaseURL() {
    return this.baseURL;
  }
}

// Singleton instance
const webhookService = new WebhookService();

// Auto-check backend health when module loads
if (typeof window !== 'undefined') {
  webhookService.checkBackendHealth().then(isHealthy => {
    if (isHealthy) {
      // Try to connect if backend is healthy
      webhookService.connect().catch(error => {
        console.warn('Could not connect to backend:', error.message);
      });
    }
  });
  
  // Expose for debugging
  window.webhookService = webhookService;
  
  // Add helpful debug commands
  window.testWebhook = (requirementId) => webhookService.testWebhook(requirementId);
  window.getAllResults = () => webhookService.getAllResults();
  window.clearResults = (requirementId) => webhookService.clearResults(requirementId);
}

export default webhookService;
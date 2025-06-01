// src/services/WebhookService.js - Optimal same-server configuration
import { io } from 'socket.io-client';

class WebhookService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    
    // Smart URL detection for same-server deployment
    this.baseURL = this.getServerURL();
    
    this.connected = false;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 3;
    
    console.log(`🌐 WebhookService configured for: ${this.baseURL}`);
  }

  /**
   * Smart server URL detection for same-server deployment
   */
  getServerURL() {
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
    
    if (isLocalhost) {
      // Development: Use separate port
      return 'http://localhost:3001';
    }
    
    // Production: Same server, same domain
    // Use current protocol and hostname (no separate port needed)
    return `${window.location.protocol}//${window.location.hostname}`;
  }

  /**
   * Initialize WebSocket connection with fallback support
   */
  connect() {
    if (this.socket && this.connected) {
      console.log('🔌 Already connected to webhook backend');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      console.log(`🔌 Connecting to webhook backend at ${this.baseURL}...`);
      
      const socketOptions = {
        // Try WebSocket first, fallback to polling
        transports: ['websocket', 'polling'],
        timeout: 15000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        
        // Production optimizations
        upgrade: true,
        rememberUpgrade: false,
        
        // Standard Socket.IO path
        path: '/socket.io/'
      };

      this.socket = io(this.baseURL, socketOptions);

      this.socket.on('connect', () => {
        console.log('✅ Connected to webhook backend');
        console.log(`🔗 Socket ID: ${this.socket.id}`);
        console.log(`🚀 Transport: ${this.socket.io.engine.transport.name}`);
        
        this.connected = true;
        this.connectionAttempts = 0;
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from webhook backend:', reason);
        this.connected = false;
      });

      this.socket.on('webhook-received', (data) => {
        console.log('🔔 Webhook broadcast received:', data);
        this.handleWebhookData(data);
      });

      this.socket.on('test-results', (data) => {
        console.log('📋 Test results received:', data);
        this.handleWebhookData({ data, requirementId: data.requirementId });
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        this.connectionAttempts++;
        
        // Provide helpful debugging info
        if (error.message.includes('websocket error')) {
          console.warn('💡 WebSocket upgrade failed, using polling transport');
        }
        
        if (this.connectionAttempts >= this.maxConnectionAttempts) {
          console.error('🚨 Max connection attempts reached');
          reject(new Error(`Failed to connect after ${this.maxConnectionAttempts} attempts`));
        }
      });

      // Connection timeout
      setTimeout(() => {
        if (!this.connected) {
          console.error('⏰ Connection timeout');
          reject(new Error('Connection timeout'));
        }
      }, 20000);
    });
  }

  /**
   * Check backend health with detailed diagnostics
   */
  async checkBackendHealth() {
    try {
      const healthUrl = `${this.baseURL}/api/webhook/health`;
      console.log(`🏥 Health check: ${healthUrl}`);
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend healthy:', {
          status: data.status,
          connectedClients: data.connectedClients || 0,
          environment: data.environment
        });
        return true;
      } else {
        console.warn(`⚠️ Backend health check failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      if (error.name === 'TimeoutError') {
        console.error('❌ Backend health timeout (8s)');
      } else {
        console.error('❌ Backend unreachable:', error.message);
      }
      return false;
    }
  }

  // ... rest of the methods remain the same ...
  subscribeToRequirement(requirementId, callback) {
    console.log(`📝 Subscribing to requirement: ${requirementId}`);
    this.listeners.set(requirementId, callback);
    
    if (this.socket && this.connected) {
      this.socket.emit('subscribe-requirement', requirementId);
    }
  }

  unsubscribeFromRequirement(requirementId) {
    console.log(`📝 Unsubscribing from requirement: ${requirementId}`);
    this.listeners.delete(requirementId);
    
    if (this.socket && this.connected) {
      this.socket.emit('unsubscribe-requirement', requirementId);
    }
  }

  handleWebhookData(webhookEvent) {
    const { requirementId, data } = webhookEvent;
    const callback = this.listeners.get(requirementId);
    if (callback) {
      console.log(`🎯 Executing callback for requirement: ${requirementId}`);
      callback(data);
    }
  }

  async testWebhook(requirementId = 'REQ-TEST') {
    try {
      console.log(`🧪 Testing webhook for: ${requirementId}`);
      
      const response = await fetch(`${this.baseURL}/api/test-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirementId,
          results: [
            {
              id: 'TC_001',
              name: 'Test Same-Server Webhook',
              status: 'Passed',
              duration: 1000,
              logs: 'Same-server webhook test completed'
            }
          ]
        }),
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        console.log('✅ Test webhook successful');
        return true;
      } else {
        throw new Error(`Test failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Test webhook error:', error);
      throw error;
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting from webhook backend');
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.listeners.clear();
    }
  }

  isConnected() {
    return this.connected;
  }

  getBaseURL() {
    return this.baseURL;
  }
}

// Singleton instance
const webhookService = new WebhookService();

// Auto-initialization with better error handling
if (typeof window !== 'undefined') {
  webhookService.checkBackendHealth()
    .then(isHealthy => {
      if (isHealthy) {
        return webhookService.connect();
      } else {
        console.log('⚠️ Backend not available - using fallback mode');
        return Promise.resolve();
      }
    })
    .then(() => {
      if (webhookService.isConnected()) {
        console.log('🎉 Real-time webhook system ready!');
      } else {
        console.log('📡 App running in polling mode (no real-time updates)');
      }
    })
    .catch(error => {
      console.warn('🔄 Webhook system unavailable:', error.message);
      console.log('💡 App will work normally but without real-time updates');
    });
  
  // Debug helpers
  window.webhookService = webhookService;
  window.testWebhook = (reqId) => webhookService.testWebhook(reqId);
  
  // Connection diagnostics
  window.webhookDiagnostics = async () => {
    console.log('🔍 Running webhook diagnostics...');
    console.log('Base URL:', webhookService.getBaseURL());
    console.log('Connected:', webhookService.isConnected());
    
    try {
      const isHealthy = await webhookService.checkBackendHealth();
      console.log('Backend healthy:', isHealthy);
      
      if (!webhookService.isConnected() && isHealthy) {
        console.log('🔄 Attempting reconnection...');
        await webhookService.connect();
      }
    } catch (error) {
      console.error('Diagnostics failed:', error);
    }
  };
}

export default webhookService;
// src/services/WebhookService.js - Updated for per test case handling
class WebhookService {
  constructor() {
    this.baseURL = this.detectBaseURL();
    this.socket = null;
    this.connected = false;
    
    // MODIFIED: Track test case results per request
    this.requestListeners = new Map(); // requestId -> callback
    this.testCaseResults = new Map(); // requestId -> Map(testCaseId -> result)
    this.activeRequests = new Map(); // requestId -> { testCaseIds: Set, startTime, status }
  }

  detectBaseURL() {
  // Check if we're in production environment
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isDev) {
    return 'http://localhost:3001';
  } else {
    // In production, use the same host as frontend with port 3001
    // Since nginx forwards internally, we need to use the external URL
    return `http://${window.location.hostname}`;
  }
}
  async connect() {
    try {
      const { io } = await import('socket.io-client');
      
      this.socket = io(this.baseURL, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        this.socket.on('connect', () => {
          clearTimeout(timeout);
          this.connected = true;
          console.log('✅ Connected to webhook backend');
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          this.connected = false;
          console.log('🔌 Disconnected from webhook backend:', reason);
        });

        this.socket.on('connection-info', (info) => {
          console.log('📡 Connection info received:', info);
        });

        // MODIFIED: Handle individual test case results
        this.socket.on('test-case-result', (data) => {
          console.log('🧪 Individual test case result received:', data);
          this.handleTestCaseResult(data);
        });

        // Keep backward compatibility for bulk results
        this.socket.on('test-results', (data) => {
          console.log('📦 Bulk test results received (legacy):', data);
          this.handleLegacyBulkResults(data);
        });

        this.socket.on('connect_error', (error) => {
          clearTimeout(timeout);
          console.error('❌ Connection error:', error.message);
          reject(error);
        });
      });
    } catch (error) {
      console.error('❌ Failed to connect to webhook backend:', error);
      throw error;
    }
  }

  // NEW: Handle individual test case results
  handleTestCaseResult(data) {
    const { requestId, testCaseId, testCase, timestamp } = data;
    
    if (!requestId || !testCaseId || !testCase) {
      console.warn('⚠️ Invalid test case result data:', data);
      return;
    }
    
    // Store test case result
    if (!this.testCaseResults.has(requestId)) {
      this.testCaseResults.set(requestId, new Map());
    }
    
    const requestResults = this.testCaseResults.get(requestId);
    requestResults.set(testCaseId, {
      ...testCase,
      receivedAt: timestamp,
      processedAt: new Date().toISOString()
    });
    
    // Update active request tracking
    if (this.activeRequests.has(requestId)) {
      const request = this.activeRequests.get(requestId);
      request.testCaseIds.add(testCaseId);
      request.lastUpdate = new Date().toISOString();
    }
    
    console.log(`📝 Stored test case result: ${requestId}-${testCaseId} -> ${testCase.status}`);
    
    // Notify listeners
    this.notifyRequestListeners(requestId, {
      type: 'test-case-update',
      requestId,
      testCaseId,
      testCase,
      allResults: this.getAllTestCaseResults(requestId)
    });
  }

  // NEW: Handle legacy bulk results for backward compatibility
  handleLegacyBulkResults(data) {
    const { requestId, results } = data;
    
    if (!requestId || !Array.isArray(results)) {
      console.warn('⚠️ Invalid bulk results data:', data);
      return;
    }
    
    console.log(`📦 Processing ${results.length} bulk results for request: ${requestId}`);
    
    // Convert bulk results to individual test case results
    results.forEach(testCase => {
      if (testCase.id) {
        this.handleTestCaseResult({
          requestId,
          testCaseId: testCase.id,
          testCase,
          timestamp: data.timestamp || new Date().toISOString()
        });
      }
    });
  }

  // NEW: Get all test case results for a request
  getAllTestCaseResults(requestId) {
    const requestResults = this.testCaseResults.get(requestId);
    if (!requestResults) return [];
    
    return Array.from(requestResults.entries()).map(([testCaseId, result]) => ({
      id: testCaseId,
      ...result
    }));
  }

  // NEW: Get specific test case result
  getTestCaseResult(requestId, testCaseId) {
    const requestResults = this.testCaseResults.get(requestId);
    return requestResults ? requestResults.get(testCaseId) : null;
  }

  // MODIFIED: Notify request listeners with enhanced data
  notifyRequestListeners(requestId, eventData) {
    const callback = this.requestListeners.get(requestId);
    if (callback) {
      console.log(`🎯 Notifying request listener for: ${requestId}`);
      callback(eventData);
    } else {
      console.log(`📭 No listener found for request: ${requestId}`);
    }
  }

  async checkBackendHealth() {
    try {
      const response = await fetch(`${this.baseURL}/api/webhook/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000)
      });
      
      if (response.ok) {
        const health = await response.json();
        console.log('✅ Backend health check passed:', health);
        return true;
      } else {
        console.log('⚠️ Backend health check failed:', response.status);
        return false;
      }
    } catch (error) {
      if (error.name === 'TimeoutError') {
        console.log('⏰ Backend health check timeout (8s)');
      } else {
        console.error('❌ Backend unreachable:', error.message);
      }
      return false;
    }
  }

  // MODIFIED: Subscribe to specific request for test case updates
  subscribeToRequest(requestId, callback) {
    console.log(`📝 Subscribing to request for test case updates: ${requestId}`);
    this.requestListeners.set(requestId, callback);
    
    // Initialize request tracking
    if (!this.activeRequests.has(requestId)) {
      this.activeRequests.set(requestId, {
        testCaseIds: new Set(),
        startTime: new Date().toISOString(),
        status: 'active',
        lastUpdate: new Date().toISOString()
      });
    }
    
    if (this.socket && this.connected) {
      this.socket.emit('subscribe-request', requestId);
    }
    
    // Send any existing results immediately
    const existingResults = this.getAllTestCaseResults(requestId);
    if (existingResults.length > 0) {
      console.log(`📤 Sending ${existingResults.length} existing test case results`);
      callback({
        type: 'existing-results',
        requestId,
        allResults: existingResults
      });
    }
  }

  // NEW: Register test execution with expected test cases
  registerTestExecution(requestId, expectedTestCases = []) {
    console.log(`📝 Registering test execution: ${requestId} with ${expectedTestCases.length} test cases`);
    
    const request = {
      testCaseIds: new Set(expectedTestCases),
      expectedCount: expectedTestCases.length,
      startTime: new Date().toISOString(),
      status: 'registered',
      lastUpdate: new Date().toISOString()
    };
    
    this.activeRequests.set(requestId, request);
    
    // Subscribe to this specific request
    if (this.socket && this.connected) {
      this.socket.emit('subscribe-request', requestId);
    }
  }

  unsubscribeFromRequest(requestId) {
    console.log(`📝 Unsubscribing from request: ${requestId}`);
    this.requestListeners.delete(requestId);
    
    if (this.socket && this.connected) {
      this.socket.emit('unsubscribe-request', requestId);
    }
  }

  // NEW: Fetch specific test case result via API
  async fetchTestCaseResult(requestId, testCaseId) {
    try {
      const response = await fetch(`${this.baseURL}/api/test-results/request/${requestId}/testcase/${testCaseId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Retrieved test case result: ${requestId}-${testCaseId}`);
        return data;
      } else if (response.status === 404) {
        console.log(`📭 Test case result not found: ${requestId}-${testCaseId}`);
        return null;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ Error fetching test case result ${requestId}-${testCaseId}:`, error);
      throw error;
    }
  }

  // MODIFIED: Fetch all test case results for a request via API
  async fetchRequestResults(requestId) {
    try {
      const response = await fetch(`${this.baseURL}/api/test-results/request/${requestId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Retrieved ${data.testCaseCount} test case results for request: ${requestId}`);
        return data;
      } else if (response.status === 404) {
        console.log(`📭 No results found for request: ${requestId}`);
        return null;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ Error fetching request results ${requestId}:`, error);
      throw error;
    }
  }

  // NEW: Poll for complete test execution results
  async pollForTestExecution(requestId, expectedTestCases = [], maxAttempts = 10, intervalMs = 3000) {
    console.log(`🔄 Polling for test execution completion: ${requestId} (${expectedTestCases.length} test cases expected)`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const data = await this.fetchRequestResults(requestId);
        
        if (data && data.results) {
          const completedTests = data.results.filter(r => 
            r.testCase.status === 'Passed' || r.testCase.status === 'Failed'
          );
          
          console.log(`📊 Progress: ${completedTests.length}/${expectedTestCases.length} tests completed`);
          
          // Check if all expected tests are complete
          if (completedTests.length >= expectedTestCases.length) {
            console.log(`✅ All tests completed for request: ${requestId}`);
            return data;
          }
        }
        
        if (attempt < maxAttempts) {
          console.log(`⏳ Attempt ${attempt}/${maxAttempts} - waiting ${intervalMs}ms`);
          await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
      } catch (error) {
        console.error(`❌ Poll attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
      }
    }
    
    console.log(`❌ Polling failed after ${maxAttempts} attempts for request: ${requestId}`);
    return null;
  }

  async testWebhook(requestId = 'REQ-TEST', testCaseId = 'TC_001') {
    try {
      console.log(`🧪 Testing webhook for test case: ${testCaseId} in request: ${requestId}`);
      
      const response = await fetch(`${this.baseURL}/api/test-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testCaseId,
          testCaseName: `Test ${testCaseId}`,
          status: Math.random() > 0.5 ? 'Passed' : 'Failed',
          logs: `Manual test execution for ${testCaseId} completed`
        }),
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Test webhook successful:', result);
        return true;
      } else {
        throw new Error(`Test failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Test webhook error:', error);
      throw error;
    }
  }

  // MODIFIED: Clear all test case results for a request
  async clearResults(requestId) {
    try {
      const response = await fetch(`${this.baseURL}/api/test-results/request/${requestId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`🗑️ Cleared ${result.clearedCount} test case results for request: ${requestId}`);
        
        // Clear local storage
        this.testCaseResults.delete(requestId);
        this.activeRequests.delete(requestId);
        
        return result;
      } else {
        throw new Error(`Clear failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ Error clearing results for request ${requestId}:`, error);
      throw error;
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting from webhook backend');
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.requestListeners.clear();
      this.testCaseResults.clear();
      this.activeRequests.clear();
    }
  }

  isConnected() {
    return this.connected;
  }

  getBaseURL() {
    return this.baseURL;
  }

  // NEW: Get execution status for a request
  getExecutionStatus(requestId) {
    const request = this.activeRequests.get(requestId);
    if (!request) return null;
    
    const results = this.getAllTestCaseResults(requestId);
    const completed = results.filter(r => r.status === 'Passed' || r.status === 'Failed').length;
    const running = results.filter(r => r.status === 'Running').length;
    
    return {
      requestId,
      expectedCount: request.expectedCount || request.testCaseIds.size,
      totalReceived: results.length,
      completed,
      running,
      notStarted: Math.max(0, (request.expectedCount || request.testCaseIds.size) - results.length),
      startTime: request.startTime,
      lastUpdate: request.lastUpdate,
      status: request.status
    };
  }
}

// Singleton instance
const webhookService = new WebhookService();

// Auto-initialization
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
        console.log('🎉 Real-time test case tracking system ready!');
      } else {
        console.log('📡 Using fallback mode - limited real-time features');
      }
    })
    .catch(error => {
      console.error('❌ Failed to initialize webhook service:', error);
    });
}

export default webhookService;
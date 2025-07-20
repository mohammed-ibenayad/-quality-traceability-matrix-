// src/services/WebhookService.js
// ENHANCED: Complete WebhookService with JUnit XML parsing capabilities

import io from 'socket.io-client';

class WebhookService {
  constructor() {
    this.baseURL = this.detectBaseURL();
    this.socket = null;
    this.connected = false;
    
    // MODIFIED: Track test case results per request
    this.requestListeners = new Map(); // requestId -> callback
    this.requirementListeners = new Map(); // requirementId -> callback
    this.testCaseResults = new Map(); // requestId -> Map(testCaseId -> result)
    this.activeRequests = new Map(); // requestId -> { testCaseIds: Set, startTime, status }
    
    // NEW: JUnit XML parsing support
    this.xmlParser = null;
    this.initializeXMLParser();
  }

  /**
   * NEW: Initialize XML parser for JUnit XML processing
   * Using same approach as GitHubService for consistency
   */
  initializeXMLParser() {
    try {
      // Check if fast-xml-parser is available
      if (typeof window !== 'undefined' && window.XMLParser) {
        this.xmlParser = window.XMLParser;
        console.log('✅ XML parser initialized for webhook service');
      } else {
        console.warn('⚠️ XML parser not available - JUnit XML parsing disabled');
      }
    } catch (error) {
      console.warn('⚠️ Failed to initialize XML parser:', error.message);
    }
  }

  /**
   * NEW: Parse JUnit XML content from webhook payload
   * @param {string} xmlContent - Raw JUnit XML content
   * @param {string} testCaseId - Expected test case ID
   * @returns {Object|null} Parsed test case data or null
   */
  parseJUnitXML(xmlContent, testCaseId = '') {
    if (!this.xmlParser || !xmlContent?.trim()) {
      console.warn('⚠️ Cannot parse JUnit XML - parser not available or empty content');
      return null;
    }

    try {
      console.log(`🔍 Parsing JUnit XML for test case: ${testCaseId}`);
      
      const parser = new this.xmlParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        textNodeName: "#text",
        parseAttributeValue: true,
        parseTrueNumberOnly: false,
        trimValues: true
      });

      const result = parser.parse(xmlContent);
      console.log('📋 XML parsed successfully:', result);

      // Extract test suites
      const testsuites = result.testsuites || result.testsuite;
      if (!testsuites) {
        console.warn('⚠️ No test suites found in XML');
        return null;
      }

      // Handle both single testsuite and multiple testsuites
      const suites = Array.isArray(testsuites) ? testsuites : [testsuites];
      
      for (const suite of suites) {
        const testcases = suite.testcase;
        if (!testcases) continue;

        const cases = Array.isArray(testcases) ? testcases : [testcases];
        
        for (const testcase of cases) {
          // Try to match the test case by ID or name
          const caseName = testcase['@_name'] || testcase.name;
          const caseClass = testcase['@_classname'] || testcase.classname;
          
          // Check if this matches our expected test case
          if (testCaseId && !this.matchesTestCase(testCaseId, caseName, caseClass)) {
            continue;
          }

          return this.transformJUnitTestCase(testcase, suite);
        }
      }

      console.warn(`⚠️ Test case ${testCaseId} not found in JUnit XML`);
      return null;

    } catch (error) {
      console.error('❌ JUnit XML parsing failed:', error);
      return null;
    }
  }

  /**
   * NEW: Check if XML test case matches expected test case ID
   * @param {string} testCaseId - Expected test case ID
   * @param {string} caseName - Test case name from XML
   * @param {string} caseClass - Test case class from XML
   * @returns {boolean} True if matches
   */
  matchesTestCase(testCaseId, caseName, caseClass) {
    if (!testCaseId) return true; // If no specific ID, accept any case
    
    // Direct ID match
    if (caseName === testCaseId || caseClass === testCaseId) return true;
    
    // Check if test case ID is contained in name or class
    const lowerCaseId = testCaseId.toLowerCase();
    const lowerCaseName = (caseName || '').toLowerCase();
    const lowerCaseClass = (caseClass || '').toLowerCase();
    
    return lowerCaseName.includes(lowerCaseId) || lowerCaseClass.includes(lowerCaseId);
  }

  /**
   * NEW: Transform JUnit XML test case to application format
   * @param {Object} testcase - Parsed XML test case
   * @param {Object} suite - Parent test suite
   * @returns {Object} Application-formatted test case
   */
  transformJUnitTestCase(testcase, suite) {
    const name = testcase['@_name'] || testcase.name || 'Unknown Test';
    const className = testcase['@_classname'] || testcase.classname || '';
    const time = parseFloat(testcase['@_time'] || testcase.time || 0) * 1000; // Convert to ms

    // Determine status based on presence of failure/error/skipped
    let status = 'Passed';
    let failure = null;

    if (testcase.failure) {
      status = 'Failed';
      failure = this.parseJUnitFailure(testcase.failure, testcase, 'failure');
    } else if (testcase.error) {
      status = 'Failed';
      failure = this.parseJUnitFailure(testcase.error, testcase, 'error');
    } else if (testcase.skipped) {
      status = 'Skipped';
    }

    const result = {
      id: name, // Use name as ID if not provided separately
      name: name,
      status: status,
      duration: time,
      logs: this.extractJUnitLogs(testcase),
      rawOutput: testcase.failure?.['#text'] || testcase.error?.['#text'] || '',
      className: className,
      suite: suite['@_name'] || suite.name || '',
      processedAt: new Date().toISOString()
    };

    if (failure) {
      result.failure = failure;
    }

    console.log(`✅ Transformed JUnit test case: ${name} -> ${status}`);
    return result;
  }

  /**
   * NEW: Parse JUnit failure/error details
   * @param {Object} failureNode - XML failure/error node
   * @param {Object} testcase - Parent test case
   * @param {string} type - 'failure' or 'error'
   * @returns {Object} Structured failure data
   */
  parseJUnitFailure(failureNode, testcase, type) {
    const message = failureNode['@_message'] || failureNode.message || '';
    const failureType = failureNode['@_type'] || failureNode.type || 'TestFailure';
    const stackTrace = failureNode['#text'] || failureNode.text || '';

    // Extract assertion details if available
    const assertion = this.extractJUnitAssertion(message, stackTrace);

    return {
      type: failureType,
      file: testcase['@_file'] || testcase.file || '',
      line: parseInt(testcase['@_line'] || testcase.line || 0),
      column: null,
      method: testcase['@_name'] || testcase.name || '',
      class: testcase['@_classname'] || testcase.classname || '',
      message: message,
      rawError: stackTrace,
      parsingSource: 'junit-xml',
      parsingConfidence: 'high',
      category: this.categorizeJUnitFailure(failureType, message),
      framework: this.detectFrameworkFromXML(testcase, failureNode),
      assertion: assertion,
      extracted: {
        locations: this.extractLocationsFromStackTrace(stackTrace),
        exceptions: [failureType],
        methods: [testcase['@_name'] || testcase.name || ''],
        classes: [testcase['@_classname'] || testcase.classname || ''],
        assertions: assertion.available ? {
          expected: [assertion.expected],
          actual: [assertion.actual],
          comparisons: [assertion.operator],
          expressions: [assertion.expression]
        } : { expected: [], actual: [], comparisons: [], expressions: [] }
      }
    };
  }

  /**
   * NEW: Extract assertion details from JUnit failure message
   * @param {string} message - Failure message
   * @param {string} stackTrace - Stack trace
   * @returns {Object} Assertion details
   */
  extractJUnitAssertion(message, stackTrace) {
    const fullText = `${message} ${stackTrace}`;
    
    // Common assertion patterns
    const patterns = [
      // "Expected X but was Y"
      /expected:?\s*<?(.+?)>?\s*(?:but\s+(?:was|got))?\s*<?(.+?)>?/i,
      // "X != Y" style
      /(.+?)\s*(!=|==|<=|>=|<|>)\s*(.+)/,
      // AssertionError patterns
      /AssertionError:\s*(.+)/i,
      // JUnit specific patterns
      /expected:\s*<(.+?)>\s*but\s*was:\s*<(.+?)>/i
    ];

    for (const pattern of patterns) {
      const match = fullText.match(pattern);
      if (match) {
        return {
          available: true,
          expected: match[1]?.trim() || '',
          actual: match[2]?.trim() || '',
          operator: match.length > 3 ? match[2] : '!=',
          expression: match[0]?.trim() || '',
          message: message
        };
      }
    }

    return {
      available: false,
      expected: '',
      actual: '',
      operator: '',
      expression: '',
      message: message
    };
  }

  /**
   * NEW: Categorize JUnit failure types
   * @param {string} failureType - XML failure type
   * @param {string} message - Failure message
   * @returns {string} Failure category
   */
  categorizeJUnitFailure(failureType, message) {
    const lowerType = failureType.toLowerCase();
    const lowerMessage = message.toLowerCase();

    if (lowerType.includes('assertion') || lowerMessage.includes('assert')) {
      return 'assertion';
    }
    if (lowerType.includes('timeout') || lowerMessage.includes('timeout')) {
      return 'timeout';
    }
    if (lowerType.includes('element') || lowerMessage.includes('element')) {
      return 'element';
    }
    if (lowerType.includes('network') || lowerMessage.includes('network')) {
      return 'network';
    }
    return 'general';
  }

  /**
   * NEW: Detect testing framework from XML content
   * @param {Object} testcase - XML test case
   * @param {Object} failureNode - XML failure node
   * @returns {string} Detected framework
   */
  detectFrameworkFromXML(testcase, failureNode) {
    const className = testcase['@_classname'] || testcase.classname || '';
    const failureType = failureNode?.['@_type'] || failureNode?.type || '';
    
    if (className.includes('junit') || failureType.includes('JUnit')) return 'JUnit';
    if (className.includes('pytest') || failureType.includes('pytest')) return 'pytest';
    if (className.includes('testng') || failureType.includes('TestNG')) return 'TestNG';
    if (className.includes('nunit') || failureType.includes('NUnit')) return 'NUnit';
    
    return 'Unknown';
  }

  /**
   * NEW: Extract logs from JUnit test case
   * @param {Object} testcase - XML test case
   * @returns {string} Extracted logs
   */
  extractJUnitLogs(testcase) {
    const logs = [];
    
    if (testcase['system-out']) {
      logs.push('=== STDOUT ===');
      logs.push(testcase['system-out']);
    }
    
    if (testcase['system-err']) {
      logs.push('=== STDERR ===');
      logs.push(testcase['system-err']);
    }
    
    return logs.join('\n');
  }

  /**
   * NEW: Extract file locations from stack trace
   * @param {string} stackTrace - Stack trace content
   * @returns {Array} Array of location objects
   */
  extractLocationsFromStackTrace(stackTrace) {
    const locations = [];
    const lines = stackTrace.split('\n');
    
    for (const line of lines) {
      // Match various stack trace formats
      const patterns = [
        /at\s+(.+?)\s*\((.+?):(\d+)(?::(\d+))?\)/,  // Java style
        /File\s+"(.+?)",\s*line\s*(\d+)/,            // Python style
        /^\s*(.+?):(\d+):?(\d+)?/                    // Simple file:line format
      ];
      
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          locations.push({
            file: match[2] || match[1] || '',
            line: parseInt(match[3] || match[2] || 0),
            column: parseInt(match[4] || 0),
            method: match[1] || ''
          });
          break;
        }
      }
    }
    
    return locations;
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
      const timeout = setTimeout(() => {
        throw new Error('Connection timeout');
      }, 10000);

      return new Promise((resolve, reject) => {
        this.socket = io('/webhook', {
          transports: ['websocket', 'polling'],
          timeout: 5000,
          autoConnect: true
        });

        this.socket.on('connect', () => {
          clearTimeout(timeout);
          this.connected = true;
          console.log('🔌 Connected to webhook backend');
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          this.connected = false;
          console.log('🔌 Disconnected from webhook backend:', reason);
        });

        this.socket.on('connection-info', (info) => {
          console.log('📡 Connection info received:', info);
        });

        // ENHANCED: Handle individual test case results with XML support
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

  /**
   * ENHANCED: Handle individual test case results with optional XML parsing
   * @param {Object} data - Webhook data
   */
  handleTestCaseResult(data) {
    const { requestId, testCaseId, testCase, xmlContent, timestamp } = data;
    
    if (!requestId || !testCaseId || !testCase) {
      console.warn('⚠️ Invalid test case result data:', data);
      return;
    }
    
    let processedTestCase = testCase;
    
    // NEW: Process JUnit XML if provided in webhook payload
    if (xmlContent && this.xmlParser) {
      console.log(`🔍 Processing JUnit XML for test case: ${testCaseId}`);
      
      const xmlTestCase = this.parseJUnitXML(xmlContent, testCaseId);
      if (xmlTestCase) {
        console.log(`✅ JUnit XML parsed successfully for ${testCaseId}`);
        
        // Merge XML data with provided test case data
        processedTestCase = {
          ...testCase,
          ...xmlTestCase,
          // Preserve original ID if provided
          id: testCase?.id || xmlTestCase.id,
          // Mark as XML-enhanced
          xmlEnhanced: true,
          originalXmlContent: xmlContent
        };
      } else {
        console.warn(`⚠️ Failed to parse JUnit XML for ${testCaseId}, using provided data`);
      }
    }
    
    // Store test case result
    if (!this.testCaseResults.has(requestId)) {
      this.testCaseResults.set(requestId, new Map());
    }
    
    const requestResults = this.testCaseResults.get(requestId);
    requestResults.set(testCaseId, {
      ...processedTestCase,
      receivedAt: timestamp,
      processedAt: new Date().toISOString()
    });
    
    // Update active request tracking
    if (this.activeRequests.has(requestId)) {
      const request = this.activeRequests.get(requestId);
      request.testCaseIds.add(testCaseId);
      request.lastUpdate = new Date().toISOString();
    }
    
    console.log(`📝 Stored enhanced test case result: ${requestId}-${testCaseId} -> ${processedTestCase.status}`);
    
    // Notify listeners
    this.notifyRequestListeners(requestId, {
      type: 'test-case-update',
      requestId,
      testCaseId,
      testCase: processedTestCase,
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

  // NEW: Register expected test execution
  registerTestExecution(requestId, expectedTestCases = []) {
    this.activeRequests.set(requestId, {
      testCaseIds: new Set(),
      expectedTestCases: new Set(expectedTestCases),
      startTime: new Date().toISOString(),
      status: 'active'
    });
    
    console.log(`📋 Registered test execution: ${requestId} (expecting ${expectedTestCases.length} test cases)`);
  }

  // NEW: Subscribe to specific request updates
  subscribeToRequest(requestId, callback) {
    if (!this.requestListeners.has(requestId)) {
      this.requestListeners.set(requestId, new Set());
    }
    
    this.requestListeners.get(requestId).add(callback);
    console.log(`📡 Subscribed to request updates: ${requestId}`);
  }

  // NEW: Unsubscribe from request updates
  unsubscribeFromRequest(requestId, callback = null) {
    if (callback) {
      const listeners = this.requestListeners.get(requestId);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.requestListeners.delete(requestId);
        }
      }
    } else {
      // Remove all listeners for this request
      this.requestListeners.delete(requestId);
    }
    
    console.log(`📡 Unsubscribed from request updates: ${requestId}`);
  }

  // NEW: Subscribe to requirement updates (legacy support)
  subscribeToRequirement(requirementId, callback) {
    if (!this.requirementListeners.has(requirementId)) {
      this.requirementListeners.set(requirementId, new Set());
    }
    
    this.requirementListeners.get(requirementId).add(callback);
    console.log(`📡 Subscribed to requirement updates: ${requirementId}`);
  }

  // NEW: Unsubscribe from requirement updates
  unsubscribeFromRequirement(requirementId, callback = null) {
    if (callback) {
      const listeners = this.requirementListeners.get(requirementId);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.requirementListeners.delete(requirementId);
        }
      }
    } else {
      // Remove all listeners for this requirement
      this.requirementListeners.delete(requirementId);
    }
    
    console.log(`📡 Unsubscribed from requirement updates: ${requirementId}`);
  }

  // NEW: Notify request listeners
  notifyRequestListeners(requestId, data) {
    const listeners = this.requestListeners.get(requestId);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in request listener:', error);
        }
      });
    }
  }

  // NEW: Check backend health
  async checkBackendHealth() {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        timeout: 5000
      });
      
      return response.ok;
    } catch (error) {
      console.log('Backend health check failed:', error.message);
      return false;
    }
  }

  // NEW: Fetch results by request ID (polling fallback)
  async fetchResultsByRequestId(requestId) {
    try {
      const response = await fetch(`${this.baseURL}/api/test-results/request/${requestId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Transform to expected format
        return {
          requestId: data.requestId,
          timestamp: data.retrievedAt,
          results: data.results.map(result => ({
            id: result.testCaseId,
            ...result.testCase
          }))
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching results by request ID:', error);
      return null;
    }
  }

  // NEW: Fetch latest results for requirement (legacy fallback)
  async fetchLatestResultsForRequirement(requirementId) {
    try {
      const response = await fetch(`${this.baseURL}/api/test-results/requirement/${requirementId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching results for requirement:', error);
      return null;
    }
  }

  // Disconnect from backend
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      console.log('🔌 Disconnected from webhook backend');
    }
  }

  // Check connection status
  isConnected() {
    return this.connected && this.socket?.connected;
  }

  // Get connection status
  getStatus() {
    return {
      connected: this.isConnected(),
      baseURL: this.baseURL,
      activeRequests: this.activeRequests.size,
      requestListeners: this.requestListeners.size,
      requirementListeners: this.requirementListeners.size
    };
  }
}

// Export as singleton
const webhookService = new WebhookService();
export default webhookService;
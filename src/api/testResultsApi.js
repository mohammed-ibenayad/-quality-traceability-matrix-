// src/api/testResultsApi.js - Complete Updated Version for Per Test Case Handling
/**
 * API endpoints for handling individual test case results from external test runners
 */
import dataStore from '../services/DataStore';
import { refreshQualityGates } from '../utils/calculateQualityGates';

// MODIFIED: Store individual test case results by requestId
if (typeof window !== 'undefined' && !window.testCaseWebhookResults) {
  window.testCaseWebhookResults = new Map(); // requestId -> Map(testCaseId -> result)
}

/**
 * Store individual test case webhook result
 * 
 * @param {Object} data - Webhook payload for single test case
 * @param {String} data.requestId - The request ID
 * @param {String} data.results[0].id - The test case ID
 * @returns {String} - Storage key for reference
 */
export const storeTestCaseWebhookResult = (data) => {
  try {
    if (!data.requestId || !data.results || data.results.length !== 1) {
      console.warn('Invalid test case webhook data for storage:', data);
      return null;
    }

    const { requestId } = data;
    const testCase = data.results[0];
    const testCaseId = testCase.id;

    // Initialize request storage if needed
    if (!window.testCaseWebhookResults.has(requestId)) {
      window.testCaseWebhookResults.set(requestId, new Map());
    }

    const requestResults = window.testCaseWebhookResults.get(requestId);
    requestResults.set(testCaseId, {
      ...testCase,
      receivedAt: new Date().toISOString(),
      requestId
    });

    const compositeKey = `${requestId}-${testCaseId}`;
    console.log(`%c💾 Stored test case webhook result: ${compositeKey}`, 
      "background: #009688; color: white; font-weight: bold; padding: 3px 6px; border-radius: 3px;");
    
    return compositeKey;
  } catch (error) {
    console.error('Error storing test case webhook result:', error);
    return null;
  }
};

/**
 * Retrieve all test case results for a request
 * 
 * @param {String} requestId - The request ID
 * @returns {Array} - Array of test case results
 */
export const getTestCaseResultsForRequest = (requestId) => {
  try {
    const requestResults = window.testCaseWebhookResults.get(requestId);
    if (!requestResults) {
      return [];
    }

    const results = Array.from(requestResults.values());
    console.log(`%c📂 Retrieved ${results.length} test case results for request: ${requestId}`, 
      "background: #009688; color: white; font-weight: bold; padding: 3px 6px; border-radius: 3px;");
    
    return results;
  } catch (error) {
    console.error('Error retrieving test case results:', error);
    return [];
  }
};

/**
 * FIXED: Update individual test case in DataStore with proper notification
 * This ensures the Test Cases page sees the updates immediately
 * 
 * @param {Object} testCase - Test case result from webhook
 * @returns {Object} Updated test case object
 */
const updateTestCaseInDataStore = (testCase) => {
  try {
    console.log(`📀 FIXED: Updating test case ${testCase.id} in DataStore with status: ${testCase.status}`);
    
    // Get current test cases from DataStore
    const currentTestCases = dataStore.getTestCases();
    console.log(`📊 Current DataStore has ${currentTestCases.length} test cases`);
    
    // Find the test case to update
    const testCaseIndex = currentTestCases.findIndex(tc => tc.id === testCase.id);
    
    let updatedTestCase;
    let dataChanged = false;
    
    if (testCaseIndex === -1) {
      console.log(`➕ Test case ${testCase.id} not found - creating new test case`);
      
      // Create new test case
      updatedTestCase = {
        id: testCase.id,
        name: testCase.name || `Test case ${testCase.id}`,
        description: `Test case created from webhook result`,
        status: testCase.status,
        automationStatus: 'Automated',
        priority: 'Medium',
        lastExecuted: testCase.status !== 'Not Started' && testCase.status !== 'Not Run' ? 
                      new Date().toISOString() : '',
        executionTime: testCase.duration || 0,
        logs: testCase.logs || '',
        requirementIds: [], // Will be populated by mapping
        version: '', // Default version
        tags: [],
        assignee: ''
      };
      
      // Add new test case to the array
      currentTestCases.push(updatedTestCase);
      dataChanged = true;
      
      console.log(`✅ Created new test case: ${testCase.id} with status "${testCase.status}"`);
    } else {
      // Update existing test case
      const existingTestCase = currentTestCases[testCaseIndex];
      const oldStatus = existingTestCase.status;
      
      updatedTestCase = {
        ...existingTestCase,
        status: testCase.status,
        lastExecuted: testCase.status !== 'Not Started' && testCase.status !== 'Not Run' ? 
                      new Date().toISOString() : existingTestCase.lastExecuted,
        executionTime: testCase.duration || existingTestCase.executionTime || 0,
        logs: testCase.logs || existingTestCase.logs || '',
        // Preserve existing fields like name, description, priority, etc.
        name: existingTestCase.name, // Keep original name
        description: existingTestCase.description,
        priority: existingTestCase.priority,
        automationStatus: existingTestCase.automationStatus,
        requirementIds: existingTestCase.requirementIds,
        version: existingTestCase.version,
        tags: existingTestCase.tags,
        assignee: existingTestCase.assignee
      };
      
      // Only update if status actually changed
      if (oldStatus !== testCase.status) {
        currentTestCases[testCaseIndex] = updatedTestCase;
        dataChanged = true;
        console.log(`📝 Updated existing test case ${testCase.id}: "${oldStatus}" → "${testCase.status}"`);
      } else {
        console.log(`⏭️ Test case ${testCase.id} status unchanged: "${oldStatus}"`);
      }
    }
    
    // Only update DataStore if data actually changed
    if (dataChanged) {
      console.log(`💾 Saving updated test cases to DataStore (${currentTestCases.length} total)`);
      
      // CRITICAL: Use setTestCases which triggers notifications
      dataStore.setTestCases(currentTestCases);
      
      console.log(`📢 DataStore updated and listeners notified for test case ${testCase.id}`);
      
      // ADDITIONAL: Force a quality gates refresh if available
      try {
        refreshQualityGates(dataStore);
        console.log(`🔄 Quality gates refreshed after test case update`);
      } catch (error) {
        console.warn('Could not refresh quality gates:', error);
      }
      
      // DEBUGGING: Verify the update was successful
      const verifyTestCases = dataStore.getTestCases();
      const verifyTestCase = verifyTestCases.find(tc => tc.id === testCase.id);
      if (verifyTestCase) {
        console.log(`✅ VERIFICATION: Test case ${testCase.id} status in DataStore: "${verifyTestCase.status}"`);
      } else {
        console.error(`❌ VERIFICATION FAILED: Test case ${testCase.id} not found in DataStore after update`);
      }
    }
    
    return updatedTestCase;
    
  } catch (error) {
    console.error(`❌ Error updating test case ${testCase.id} in DataStore:`, error);
    return null;
  }
};

/**
 * ENHANCED: Notify webhook listeners with better debugging
 * 
 * @param {Object} data - Individual test case webhook data
 */
const notifyWebhookListeners = (data) => {
  try {
    console.log('%c🔄 Notifying webhook listeners', 
      "background: #2196F3; color: white; font-size: 12px; padding: 3px 6px; border-radius: 3px;");
    
    // Check if TestRunner/TestExecutionModal listeners exist
    if (typeof window.onTestWebhookReceived === 'function') {
      console.log('📤 Calling window.onTestWebhookReceived with individual test case data');
      
      // For backward compatibility, call the listener with individual data
      window.onTestWebhookReceived(data);
      
      console.log('✅ Webhook listener notified successfully');
    } else {
      console.log('⚠️ No webhook listener detected (window.onTestWebhookReceived is not a function)');
    }
    
    // ADDITIONAL: Check for any other global listeners
    if (typeof window.receiveTestResults === 'function') {
      console.log('📤 Calling window.receiveTestResults as fallback');
      window.receiveTestResults(data);
    }
    
  } catch (error) {
    console.error('❌ Error notifying webhook listeners:', error);
  }
};

/**
 * ENHANCED: Process individual test case result with better error handling and notifications
 * 
 * @param {Object} data - The webhook data for a single test case
 * @returns {Object} Response object
 */
export const processTestCaseResult = async (data) => {
  try {
    console.log('%c🧪 PROCESSING INDIVIDUAL TEST CASE RESULT', 
      "background: #673AB7; color: white; font-size: 14px; font-weight: bold; padding: 5px 10px; border-radius: 5px;");
    
    // Validate individual test case payload
    const { requestId, timestamp, results } = data;
    
    if (!requestId) {
      console.error('❌ Missing requestId in test case webhook');
      return {
        status: 400,
        body: { 
          error: 'requestId is required for per-test-case processing',
          received: data
        }
      };
    }

    if (!results || !Array.isArray(results) || results.length !== 1) {
      console.error('❌ Invalid results array - expected exactly one test case');
      return {
        status: 400,
        body: { 
          error: 'Exactly one test case expected per webhook call',
          received: { 
            hasResults: !!results,
            isArray: Array.isArray(results),
            length: results?.length || 0
          }
        }
      };
    }

    const testCase = results[0];
    if (!testCase.id) {
      console.error('❌ Test case missing ID');
      return {
        status: 400,
        body: { 
          error: 'Test case ID is required',
          received: testCase
        }
      };
    }

    console.log(`📝 Processing test case: ${testCase.id} with status: ${testCase.status}`);
    console.log(`🔗 Request ID: ${requestId}`);
    console.log(`⏰ Timestamp: ${timestamp}`);

    // Store the individual test case result (for per-test-case tracking)
    const storageKey = storeTestCaseWebhookResult(data);
    
    // CRITICAL: Update test case in DataStore with proper notifications
    const updatedTestCase = updateTestCaseInDataStore(testCase);
    
    if (!updatedTestCase) {
      console.error(`❌ Failed to update test case ${testCase.id} in DataStore`);
      return {
        status: 500,
        body: { 
          error: `Failed to update test case ${testCase.id} in DataStore`
        }
      };
    }
    
    // Notify webhook listeners (for compatibility with existing components)
    notifyWebhookListeners(data);
    
    console.log(`✅ Test case ${testCase.id} processed successfully and DataStore updated`);
    
    return {
      status: 200,
      body: { 
        success: true, 
        message: `Processed test case ${testCase.id} with status ${testCase.status}`,
        requestId,
        testCaseId: testCase.id,
        storageKey,
        updatedTestCase,
        dataStoreUpdated: true
      }
    };
    
  } catch (error) {
    console.error('❌ Error processing test case result:', error);
    return {
      status: 500,
      body: { error: 'Internal server error processing test case result' }
    };
  }
};

/**
 * BACKWARD COMPATIBILITY: Process bulk test results (legacy support)
 * This maintains compatibility with existing bulk webhook handling
 * 
 * @param {Object} data - Legacy bulk webhook data
 * @returns {Object} Response object
 */
export const processTestResults = async (data) => {
  try {
    console.log('%c📦 PROCESSING BULK TEST RESULTS (Legacy Support)', 
      "background: #FF9800; color: white; font-size: 14px; font-weight: bold; padding: 5px 10px; border-radius: 5px;");
    
    const { requestId, timestamp, results } = data;
    
    if (!results || !Array.isArray(results)) {
      return {
        status: 400,
        body: { error: 'Invalid results array' }
      };
    }
    
    console.log(`📊 Converting ${results.length} bulk results to individual test case results`);
    
    // Process each test case individually
    const processedResults = [];
    for (const testCase of results) {
      if (testCase.id) {
        const individualData = {
          requestId,
          timestamp,
          results: [testCase]
        };
        
        const result = await processTestCaseResult(individualData);
        processedResults.push({
          testCaseId: testCase.id,
          status: result.status,
          success: result.body.success
        });
      }
    }
    
    console.log(`✅ Processed ${processedResults.length} test cases from bulk webhook`);
    
    return {
      status: 200,
      body: { 
        success: true, 
        message: `Converted bulk webhook to ${processedResults.length} individual test case results`,
        processedResults
      }
    };
    
  } catch (error) {
    console.error('❌ Error processing bulk test results:', error);
    return {
      status: 500,
      body: { error: 'Internal server error processing bulk test results' }
    };
  }
};

/**
 * NEW: Get execution summary for a request
 * 
 * @param {String} requestId - The request ID
 * @returns {Object} Execution summary
 */
export const getExecutionSummary = (requestId) => {
  try {
    const testCaseResults = getTestCaseResultsForRequest(requestId);
    
    if (testCaseResults.length === 0) {
      return {
        requestId,
        totalTests: 0,
        summary: {},
        testCases: []
      };
    }
    
    // Count statuses
    const statusCounts = {};
    testCaseResults.forEach(result => {
      const status = result.status || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    return {
      requestId,
      totalTests: testCaseResults.length,
      summary: statusCounts,
      testCases: testCaseResults.map(r => ({
        id: r.id,
        name: r.name,
        status: r.status,
        duration: r.duration || 0,
        receivedAt: r.receivedAt
      }))
    };
    
  } catch (error) {
    console.error('❌ Error getting execution summary:', error);
    return {
      requestId,
      totalTests: 0,
      summary: {},
      testCases: [],
      error: error.message
    };
  }
};

/**
 * NEW: Test function for individual test case webhook
 * 
 * @param {String} requestId - Test request ID
 * @param {String} testCaseId - Test case ID
 * @param {String} status - Test status
 * @returns {Promise} Processing result
 */
export const testIndividualTestCaseWebhook = async (requestId = 'test-req', testCaseId = 'TC_001', status = 'Passed') => {
  const testData = {
    requestId: requestId,
    timestamp: new Date().toISOString(),
    results: [
      {
        id: testCaseId,
        name: `Test ${testCaseId}`,
        status: status,
        duration: Math.floor(Math.random() * 5000) + 1000,
        logs: `Test execution for ${testCaseId} completed with status: ${status}`
      }
    ]
  };
  
  console.log('%c🧪 TESTING INDIVIDUAL TEST CASE WEBHOOK', 
    "background: #673AB7; color: white; font-size: 16px; font-weight: bold; padding: 10px; border-radius: 5px; margin: 10px 0;");
  console.log('Test data:', testData);
  
  return processTestCaseResult(testData);
};

/**
 * NEW: Test function for multiple individual test case webhooks
 * 
 * @param {String} requestId - Test request ID
 * @param {Array} testCaseIds - Array of test case IDs
 * @returns {Promise} Processing results
 */
export const testMultipleIndividualWebhooks = async (requestId = 'test-req', testCaseIds = ['TC_001', 'TC_002', 'TC_003']) => {
  console.log('%c🎭 TESTING MULTIPLE INDIVIDUAL TEST CASE WEBHOOKS', 
    "background: #673AB7; color: white; font-size: 16px; font-weight: bold; padding: 10px; border-radius: 5px; margin: 10px 0;");
  
  const results = [];
  
  for (let i = 0; i < testCaseIds.length; i++) {
    const testCaseId = testCaseIds[i];
    const status = Math.random() > 0.3 ? 'Passed' : 'Failed';
    
    console.log(`📤 Sending webhook ${i + 1}/${testCaseIds.length} for ${testCaseId}`);
    
    const result = await testIndividualTestCaseWebhook(requestId, testCaseId, status);
    results.push(result);
    
    // Small delay between webhooks to simulate real execution
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`✅ Sent ${results.length} individual test case webhooks`);
  
  // Show execution summary
  const summary = getExecutionSummary(requestId);
  console.log('📊 Execution Summary:', summary);
  
  return results;
};

/**
 * MODIFIED: Setup test results endpoints for per-test-case handling
 */
export const setupTestResultsEndpoint = () => {
  // Create mock API endpoints
  window.mockApi = window.mockApi || {};
  
  // Individual test case processing (new primary method)
  window.mockApi.processTestCase = async (data) => {
    return processTestCaseResult(data);
  };
  
  // Bulk processing (legacy support)
  window.mockApi.testResults = async (data) => {
    return processTestResults(data);
  };
  
  // Direct callable functions for testing
  window.processTestCaseResult = (data) => {
    console.log("Manual individual test case processing:", data);
    return processTestCaseResult(data);
  };
  
  window.processTestResults = (data) => {
    console.log("Manual bulk test results processing:", data);
    return processTestResults(data);
  };
  
  // Test functions
  window.testIndividualTestCaseWebhook = testIndividualTestCaseWebhook;
  window.testMultipleIndividualWebhooks = testMultipleIndividualWebhooks;
  window.getExecutionSummary = getExecutionSummary;
  window.getTestCaseResultsForRequest = getTestCaseResultsForRequest;
  
  // Backward compatibility functions
  window.updateTestResults = (data) => {
    console.log("Legacy test update called:", data);
    return processTestResults(data);
  };
  
  // DEBUGGING FUNCTION: Manual test case update for testing
  window.debugUpdateTestCase = (testCaseId, status) => {
    console.log(`🧪 DEBUG: Manually updating test case ${testCaseId} to status ${status}`);
    
    const testCase = {
      id: testCaseId,
      name: `Test ${testCaseId}`,
      status: status,
      duration: 1000,
      logs: `Debug update: ${testCaseId} -> ${status}`
    };
    
    const result = updateTestCaseInDataStore(testCase);
    console.log('DEBUG Update result:', result);
    
    // Verify the update
    setTimeout(() => {
      const testCases = dataStore.getTestCases();
      const updated = testCases.find(tc => tc.id === testCaseId);
      console.log(`DEBUG Verification: ${testCaseId} status is now "${updated?.status}"`);
    }, 100);
    
    return result;
  };
  
  console.log('✨ Per-Test-Case API endpoints set up:');
  console.log('- window.mockApi.processTestCase() - Process individual test case webhook');
  console.log('- window.mockApi.testResults() - Process bulk webhook (legacy)');
  console.log('- window.processTestCaseResult() - Manual individual test case processing');
  console.log('- window.processTestResults() - Manual bulk processing (legacy)');
  console.log('- window.testIndividualTestCaseWebhook() - Test individual webhook');
  console.log('- window.testMultipleIndividualWebhooks() - Test multiple individual webhooks');
  console.log('- window.getExecutionSummary() - Get execution summary for request');
  console.log('- window.getTestCaseResultsForRequest() - Get all test case results for request');
  console.log('- window.debugUpdateTestCase() - Debug function for manual updates');
  
  console.log('\n🧪 Test individual test case webhook:');
  console.log('window.testIndividualTestCaseWebhook("req-123", "TC_001", "Passed")');
  
  console.log('\n🎭 Test multiple individual webhooks:');
  console.log('window.testMultipleIndividualWebhooks("req-123", ["TC_001", "TC_002", "TC_003"])');
  
  console.log('\n📊 Get execution summary:');
  console.log('window.getExecutionSummary("req-123")');
  
  console.log('\n🐛 Debug manual update:');
  console.log('window.debugUpdateTestCase("TC_001", "Passed")');
  
  return {
    url: 'window.mockApi.processTestCase',
    legacyUrl: 'window.mockApi.testResults',
    baseUrl: `${window.location.protocol}//${window.location.host}/api/webhook/test-results`,
    testIndividual: (data) => window.mockApi.processTestCase(data),
    testBulk: (data) => window.mockApi.testResults(data)
  };
};

/**
 * MODIFIED: Webhook receiver function for compatibility
 * This function can be called directly by external scripts
 */
window.receiveTestResults = window.receiveTestResults || ((data) => {
  console.log("Test results received via window.receiveTestResults:", data);
  try {
    // Determine if this is individual or bulk data
    if (data.results && Array.isArray(data.results)) {
      if (data.results.length === 1) {
        // Single test case - use individual processing
        return processTestCaseResult(data);
      } else {
        // Multiple test cases - use bulk processing (legacy)
        return processTestResults(data);
      }
    } else {
      throw new Error('Invalid webhook data format');
    }
  } catch (error) {
    console.error("Error processing test results:", error);
    return { success: false, error: error.message };
  }
});

// Initialize the API endpoint when this module is imported
const testResultsApi = setupTestResultsEndpoint();
export default testResultsApi;
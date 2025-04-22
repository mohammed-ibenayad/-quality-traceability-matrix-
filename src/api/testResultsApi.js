// src/api/testResultsApi.js
/**
 * API endpoints for handling test results from external test runners
 */
import dataStore from '../services/DataStore';

// Create a global store for webhook results
// This ensures real webhook data is never overridden by simulated data
if (typeof window !== 'undefined' && !window.webhookResults) {
  window.webhookResults = {};
}

/**
 * Store webhook results for later retrieval
 * This helps maintain webhook data priority over simulated data
 * 
 * @param {Object} data - Webhook payload
 * @param {String} runId - Optional run ID to associate with the results
 */
export const storeWebhookResults = (data, runId = null) => {
  try {
    // Create a unique key for this webhook
    const key = runId || `${data.requirementId}-${Date.now()}`;
    
    // Store the results
    window.webhookResults[key] = data.results;
    
    // Add a timestamp for debugging
    window.webhookResults[`${key}-timestamp`] = new Date().toISOString();
    
    console.log(`%c💾 Stored webhook results with key: ${key}`, 
      "background: #009688; color: white; font-weight: bold; padding: 3px 6px; border-radius: 3px;");
    
    // Return the key for reference
    return key;
  } catch (error) {
    console.error('Error storing webhook results:', error);
    return null;
  }
};

/**
 * Retrieve stored webhook results
 * 
 * @param {String} key - The key to retrieve results for
 * @returns {Array|null} - The stored results or null if not found
 */
export const getStoredWebhookResults = (key) => {
  try {
    if (!window.webhookResults || !window.webhookResults[key]) {
      return null;
    }
    
    console.log(`%c📂 Retrieved stored webhook results for key: ${key}`, 
      "background: #009688; color: white; font-weight: bold; padding: 3px 6px; border-radius: 3px;");
    
    return window.webhookResults[key];
  } catch (error) {
    console.error('Error retrieving webhook results:', error);
    return null;
  }
};

/**
 * Process test results submitted from external test runners with improved detection
 * 
 * @param {Object} data - The request data containing test results
 * @param {String} data.requirementId - The requirement ID associated with the tests
 * @param {String} data.timestamp - ISO timestamp when the tests were run
 * @param {Array} data.results - Array of test results
 * @returns {Object} Response object
 */
export const processTestResults = async (data) => {
  try {
    // Check if this appears to be real webhook data with "Not Run" statuses
    const hasNotRun = data.results && data.results.some(r => r.status === 'Not Run');
    
    if (hasNotRun) {
      console.log("%c🚨 REAL WEBHOOK DATA DETECTED", "background: #FF5722; color: white; font-size: 16px; font-weight: bold; padding: 8px 12px; border-radius: 5px; margin: 5px 0;");
    } else {
      console.log("%c📩 WEBHOOK PAYLOAD RECEIVED", "background: #4CAF50; color: white; font-size: 14px; font-weight: bold; padding: 5px 10px; border-radius: 5px;");
    }
    
    console.log("%cTimestamp: " + new Date().toISOString(), "color: #666; font-style: italic;");
    console.log("%cRequirement: " + data.requirementId, "color: #0066CC; font-weight: bold;");
    console.log("%cResults Count: " + (data.results?.length || 0), "color: #0066CC; font-weight: bold;");
    
    // Create a special box for the "Not Run" case
    if (hasNotRun) {
      console.log("%c📋 TEST STATUS SUMMARY:", "font-weight: bold; color: #FF5722;");
      const statusCounts = data.results.reduce((counts, r) => {
        counts[r.status] = (counts[r.status] || 0) + 1;
        return counts;
      }, {});
      
      // Log status counts as a table
      console.table(Object.entries(statusCounts).map(([status, count]) => ({
        'Status': status,
        'Count': count
      })));
      
      console.log("%c⚠️ \"Not Run\" status detected! This is likely real webhook data, not simulated results.", 
        "color: #FF5722; font-weight: bold; font-size: 14px;");
    }
    
    console.log("%cComplete Payload:", "color: #333; font-weight: bold;");
    console.log(data);
    
    const { requirementId, timestamp, results } = data;
    
    if (!requirementId || !timestamp || !Array.isArray(results)) {
      console.error("Invalid test results data:", data);
      return {
        status: 400,
        body: { 
          error: 'Invalid data format. requirementId, timestamp, and results array are required.',
          received: { 
            hasRequirementId: !!requirementId, 
            hasTimestamp: !!timestamp, 
            resultsIsArray: Array.isArray(results) 
          }
        }
      };
    }
    
    // Store webhook results for later retrieval
    // This ensures real webhook data is prioritized over simulated data
    const storageKey = storeWebhookResults(data, data.runId || null);
    console.log(`Webhook results stored with key: ${storageKey}`);
    
    console.log(`Received ${results.length} test results for ${requirementId} at ${timestamp}`);
    
    // Log all results in a nicely formatted table
    console.log("%c📊 RECEIVED TEST RESULTS:", "background: #673AB7; color: white; font-size: 12px; padding: 3px 6px; border-radius: 3px;");
    console.table(results.map(r => ({
      'ID': r.id,
      'Name': r.name || r.id,
      'Status': r.status,
      'Duration': r.duration || 0
    })));
    
    // Update test case status in the dataStore
    const updatedTestCases = updateTestStatusesDirectly(requirementId, results);
    
    // Force a DataStore notification to ensure UI is updated
    if (typeof dataStore._notifyListeners === 'function') {
      dataStore._notifyListeners();
    }
    
    // Important: Notify any UI components waiting for the webhook callback
    if (typeof window.onTestWebhookReceived === 'function') {
      console.log("%c🔄 Forwarding webhook data to TestRunner component", "background: #2196F3; color: white; font-size: 12px; padding: 3px 6px; border-radius: 3px;");
      window.onTestWebhookReceived(data);
    } else {
      console.log("%c⚠️ No webhook listener detected (window.onTestWebhookReceived is not a function)", "background: #FF9800; color: white; font-size: 12px; padding: 3px 6px; border-radius: 3px;");
    }
    
    return {
      status: 200,
      body: { 
        success: true, 
        message: `Processed ${results.length} test results for ${requirementId}`,
        updatedTestCases,
        isRealWebhook: hasNotRun
      }
    };
  } catch (error) {
    console.error('Error processing test results:', error);
    return {
      status: 500,
      body: { error: 'Internal server error processing test results' }
    };
  }
};

/**
 * Update test case statuses directly in the DataStore
 * @param {String} requirementId - The requirement ID associated with the tests
 * @param {Array} results - Array of test results
 * @returns {Array} Array of updated test cases
 */
const updateTestStatusesDirectly = (requirementId, results) => {
  try {
    console.log(`Directly updating ${results.length} test statuses for requirement ${requirementId}...`);
    
    // Get current test cases from DataStore
    const currentTestCases = dataStore.getTestCases();
    console.log(`Found ${currentTestCases.length} test cases in DataStore`);
    
    // Flag to track if we found any "Not Run" status
    let hasNotRunStatus = false;
    
    // Track updated test cases
    const updatedTestCases = [];
    
    // Process each test result
    results.forEach(result => {
      // Make sure we have a valid test ID
      if (!result.id) {
        console.warn("Test result missing ID:", result);
        return;
      }
      
      // Check for "Not Run" status
      if (result.status === 'Not Run') {
        hasNotRunStatus = true;
      }
      
      console.log(`Processing result for test case ${result.id} with status: ${result.status}`);
      
      // Find the test case to update - ENSURE EXACT MATCHING
      const testCaseIndex = currentTestCases.findIndex(tc => tc.id === result.id);
      
      if (testCaseIndex === -1) {
        console.log(`Test case ${result.id} not found in DataStore - creating new test case`);
        
        // Create a new test case if it doesn't exist
        const newTestCase = {
          id: result.id,
          name: result.name || `Test case ${result.id}`,
          description: `Automatically created from test results for ${requirementId}`,
          status: result.status, // Use exactly what was reported
          automationStatus: 'Automated',
          lastExecuted: result.status !== 'Not Run' ? new Date().toISOString() : '',
          executionTime: result.duration || 0,
          requirementIds: [requirementId]
        };
        
        console.log(`Created new test case: ${result.id} with status "${result.status}"`);
        currentTestCases.push(newTestCase);
        updatedTestCases.push(newTestCase);
        
        // Update mapping
        updateRequirementMapping(requirementId, result.id);
      } else {
        // Update existing test case
        const oldStatus = currentTestCases[testCaseIndex].status;
        
        // IMPORTANT: Make sure we preserve the exact status string from the webhook
        currentTestCases[testCaseIndex] = {
          ...currentTestCases[testCaseIndex],
          status: result.status, // Use exactly what was reported, including "Not Run"
          // Only update lastExecuted if status is not "Not Run"
          lastExecuted: result.status !== 'Not Run' ? new Date().toISOString() : currentTestCases[testCaseIndex].lastExecuted,
          executionTime: result.duration || 0
        };
        
        console.log(`Updated test case ${result.id} status: "${oldStatus}" → "${result.status}"`);
        updatedTestCases.push(currentTestCases[testCaseIndex]);
        
        // Ensure this test is mapped to the requirement
        updateRequirementMapping(requirementId, result.id);
      }
    });
    
    // If we found any "Not Run" statuses, log a special notice
    if (hasNotRunStatus) {
      console.log(`%c🔔 DETECTED REAL WEBHOOK DATA WITH "NOT RUN" STATUS`, 
        "background: #FF9800; color: white; font-size: 14px; font-weight: bold; padding: 5px 10px; border-radius: 5px;");
      console.log(`%cThis likely means you received actual webhook data rather than simulated results.`, 
        "color: #FF9800; font-weight: bold;");
    }
    
    // Debug the final state of test cases
    const relevantTestIds = results.map(r => r.id);
    console.log("After processing, final status of updated test cases:");
    currentTestCases
      .filter(tc => relevantTestIds.includes(tc.id))
      .forEach(tc => console.log(`- ${tc.id}: ${tc.status}`));
    
    // Update the DataStore with modified test cases
    if (updatedTestCases.length > 0) {
      console.log(`Setting ${currentTestCases.length} test cases in DataStore with ${updatedTestCases.length} updates`);
      dataStore.setTestCases(currentTestCases);
      
      // Trigger a second notification after a short delay
      // This helps ensure UI components catch the update
      setTimeout(() => {
        if (typeof dataStore._notifyListeners === 'function') {
          console.log("Sending secondary notification to ensure UI updates");
          dataStore._notifyListeners();
        }
      }, 100);
    }
    
    return updatedTestCases;
  } catch (error) {
    console.error('Error updating test statuses:', error);
    return [];
  }
};

/**
 * Make sure a test case is properly mapped to a requirement
 * @param {String} requirementId - The requirement ID
 * @param {String} testCaseId - The test case ID
 */
const updateRequirementMapping = (requirementId, testCaseId) => {
  try {
    // Get current mapping
    const mapping = dataStore.getMapping();
    
    // Create mapping entry if it doesn't exist
    if (!mapping[requirementId]) {
      mapping[requirementId] = [];
    }
    
    // Add test case to mapping if not already present
    if (!mapping[requirementId].includes(testCaseId)) {
      console.log(`Adding mapping from ${requirementId} to ${testCaseId}`);
      mapping[requirementId].push(testCaseId);
      dataStore.updateMappings(mapping);
    }
  } catch (error) {
    console.error('Error updating requirement mapping:', error);
  }
};

/**
 * Special test function to simulate a webhook with "Not Run" status
 * This helps test the detection and handling of real webhook data
 * 
 * @param {String} requirementId - The requirement ID to use
 * @param {Array} testIds - Optional array of test IDs to use (defaults to TC_007 and TC_008)
 * @returns {Promise} - The result of processing the webhook
 */
export const testNotRunWebhook = (requirementId = 'REQ-006', testIds = ['TC_007', 'TC_008']) => {
  // Create a webhook payload with "Not Run" status
  const webhookPayload = {
    requirementId: requirementId,
    timestamp: new Date().toISOString(),
    runId: `test-not-run-${Date.now()}`,  // Unique run ID for retrieval
    results: testIds.map(id => ({
      id: id,
      name: `Test ${id}`,
      status: 'Not Run',
      duration: 0
    }))
  };

  console.log("%c🧪 TESTING NOT RUN WEBHOOK", "background: #673AB7; color: white; font-size: 16px; font-weight: bold; padding: 10px; border-radius: 5px; margin: 10px 0;");
  console.log("%cThis simulates a real webhook with 'Not Run' status", "color: #673AB7; font-weight: bold;");
  console.log("Webhook payload:", webhookPayload);
  
  // Process the webhook
  return processTestResults(webhookPayload);
};

/**
 * Test function to simulate exactly the webhook data you received
 */
const testNotRunScenario = () => {
  const testData = {
    "requirementId": "REQ-006",
    "timestamp": "2025-04-18T07:51:54Z",
    "results": [
      {
        "id": "TC_007",
        "name": "Test TC_007",
        "status": "Not Run",
        "duration": 0
      },
      {
        "id": "TC_008",
        "name": "Test TC_008",
        "status": "Not Run",
        "duration": 0
      }
    ]
  };
  
  console.log("Testing 'Not Run' status handling with data:", testData);
  return processTestResults(testData);
};

/**
 * Endpoint to fetch test results directly when GitHub Actions workflow completes
 * This provides a way to get results without waiting for a webhook callback
 * 
 * @param {Object} params - Request parameters
 * @param {String} params.runId - The GitHub workflow run ID
 * @param {String} params.requirementId - The requirement ID
 * @returns {Object} Response with test results
 */
export const fetchTestResults = async (params) => {
  try {
    console.log("%c🔍 FETCHING TEST RESULTS", "background: #673AB7; color: white; font-size: 14px; font-weight: bold; padding: 5px 10px; border-radius: 5px;");
    console.log("Request params:", params);
    
    const { runId, requirementId } = params;
    
    if (!runId || !requirementId) {
      console.error("Missing required parameters:", params);
      return {
        status: 400,
        body: { error: 'Missing required parameters: runId and requirementId are required' }
      };
    }
    
    // Check for stored webhook results first
    const storedResults = getStoredWebhookResults(runId);
    if (storedResults) {
      console.log("%c✅ Found stored webhook results - using those instead of generating new ones", 
        "background: #8BC34A; color: black; font-weight: bold; padding: 3px 6px; border-radius: 3px;");
      
      return {
        status: 200,
        body: {
          requirementId,
          timestamp: new Date().toISOString(),
          runId: runId,
          results: storedResults,
          source: 'stored_webhook'
        }
      };
    }
    
    // In a real implementation, this would fetch results from a database or storage
    // based on the runId and requirementId
    // For now, we'll generate simulated results
    
    // Get test cases for this requirement from DataStore
    const allTestCases = dataStore.getTestCases();
    const mapping = dataStore.getMapping();
    const testCaseIds = mapping[requirementId] || [];
    
    console.log(`Found ${testCaseIds.length} test cases for requirement ${requirementId}`);
    
    // Generate consistent results based on runId and requirementId
    const seed = runId + requirementId;
    const seedValue = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) / 1000;
    
    // Generate results for each test case
    const results = testCaseIds.map(tcId => {
      const testCase = allTestCases.find(tc => tc.id === tcId);
      if (!testCase) return null;
      
      // Use a deterministic "random" value based on test ID and seed
      const testIdValue = tcId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) / 1000;
      const randomValue = Math.abs(Math.sin(seedValue + testIdValue));
      const isPassed = randomValue > 0.3; // Make most tests pass for demonstration
      
      return {
        id: tcId,
        name: testCase.name || `Test case ${tcId}`,
        status: isPassed ? 'Passed' : 'Failed',
        duration: Math.floor(randomValue * 1000) + 100,
        logs: `Executing test ${tcId}\nTest completed with ${isPassed ? 'success' : 'failure'}.`
      };
    }).filter(Boolean);
    
    console.log("%c📊 GENERATED TEST RESULTS", "background: #4CAF50; color: white; font-size: 12px; padding: 3px 6px; border-radius: 3px;");
    console.table(results.map(r => ({
      'ID': r.id,
      'Status': r.status,
      'Duration': r.duration
    })));
    
    // Create a response that mimics the webhook payload format
    const response = {
      requirementId,
      timestamp: new Date().toISOString(),
      runId: runId,
      results: results,
      source: 'generated'
    };
    
    return {
      status: 200,
      body: response
    };
  } catch (error) {
    console.error('Error fetching test results:', error);
    return {
      status: 500,
      body: { error: 'Internal server error fetching test results' }
    };
  }
};

/**
 * Example API route setup for test results
 */
export const setupTestResultsEndpoint = () => {
  // Create a mock endpoint for test results
  window.mockApi = window.mockApi || {};
  window.mockApi.testResults = async (data) => {
    return processTestResults(data);
  };
  
  // Set up the fetch results endpoint
  window.mockApi.fetchTestResults = async (params) => {
    return fetchTestResults(params);
  };
  
  // Create a direct callable function for testing
  window.updateTestResults = (data) => {
    console.log("Manual test update called with:", data);
    return processTestResults(data);
  };
  
  // Add test function for the specific Not Run scenario
  window.testNotRunScenario = testNotRunScenario;
  
  // Add the new test function
  window.testNotRunWebhook = testNotRunWebhook;
  
  // Add the storage functions
  window.storeWebhookResults = storeWebhookResults;
  window.getStoredWebhookResults = getStoredWebhookResults;
  
  // Create a direct callable function for fetching results
  window.fetchTestResults = (runId, requirementId) => {
    console.log("Manual fetch test results called with:", { runId, requirementId });
    return fetchTestResults({ runId, requirementId });
  };
  
  console.log('Test results API endpoints set up:');
  console.log('- window.mockApi.testResults() - Process webhook payload');
  console.log('- window.mockApi.fetchTestResults() - Fetch results directly');
  console.log('- window.updateTestResults() - Manual test update');
  console.log('- window.testNotRunScenario() - Test exact "Not Run" scenario');
  console.log('- window.testNotRunWebhook() - Test webhook with "Not Run" status');
  console.log('- window.storeWebhookResults() - Store webhook results');
  console.log('- window.getStoredWebhookResults() - Retrieve stored webhook results');
  console.log('- window.fetchTestResults() - Fetch test results directly');
  
  console.log('\nTest exact "Not Run" scenario with: window.testNotRunScenario()');
  console.log('Test webhook with "Not Run" status: window.testNotRunWebhook("REQ-001", ["TC_001", "TC_002"])');
  console.log('Fetch test results with: window.fetchTestResults("12345", "REQ-001")');
  console.log('Replace "12345" with run ID and "REQ-001" with requirement ID');
  
  return {
    url: 'window.mockApi.testResults',
    baseUrl: `${window.location.protocol}//${window.location.host}/api/test-results`,
    test: (data) => window.mockApi.testResults(data)
  };
};

// Initialize the API endpoint when this module is imported
const testResultsApi = setupTestResultsEndpoint();
export default testResultsApi;
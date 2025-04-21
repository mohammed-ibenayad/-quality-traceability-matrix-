// src/api/testResultsApi.js
/**
 * API endpoints for handling test results from external test runners
 */
import dataStore from '../services/DataStore';

/**
 * Process test results submitted from external test runners
 * 
 * @param {Object} data - The request data containing test results
 * @param {String} data.requirementId - The requirement ID associated with the tests
 * @param {String} data.timestamp - ISO timestamp when the tests were run
 * @param {Array} data.results - Array of test results
 * @returns {Object} Response object
 */
export const processTestResults = async (data) => {
  try {
    console.log("Processing test results:", JSON.stringify(data, null, 2));
    
    const { requirementId, timestamp, results } = data;
    
    if (!requirementId || !timestamp || !Array.isArray(results)) {
      console.error("Invalid test results data:", data);
      return {
        status: 400,
        body: { error: 'Invalid data format. requirementId, timestamp, and results array are required.' }
      };
    }
    
    console.log(`Received ${results.length} test results for ${requirementId} at ${timestamp}`);
    
    // Update test case status in the dataStore
    const updatedTestCases = updateTestStatusesDirectly(requirementId, results);
    
    // Force a DataStore notification to ensure UI is updated
    if (typeof dataStore._notifyListeners === 'function') {
      dataStore._notifyListeners();
    }
    
    // Important: Notify any UI components waiting for the webhook callback
    if (typeof window.onTestWebhookReceived === 'function') {
      console.log("Calling onTestWebhookReceived with data:", data);
      window.onTestWebhookReceived(data);
    } else {
      console.log("No webhook listener detected (window.onTestWebhookReceived is not a function)");
    }
    
    return {
      status: 200,
      body: { 
        success: true, 
        message: `Processed ${results.length} test results for ${requirementId}`,
        updatedTestCases
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
    
    // Track updated test cases
    const updatedTestCases = [];
    
    // Process each test result
    results.forEach(result => {
      // Make sure we have a valid test ID
      if (!result.id) {
        console.warn("Test result missing ID:", result);
        return;
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
          lastExecuted: new Date().toISOString(),
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
          lastExecuted: new Date().toISOString(),
          executionTime: result.duration || 0
        };
        
        console.log(`Updated test case ${result.id} status: "${oldStatus}" → "${result.status}"`);
        updatedTestCases.push(currentTestCases[testCaseIndex]);
        
        // Ensure this test is mapped to the requirement
        updateRequirementMapping(requirementId, result.id);
      }
    });
    
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
 * Example API route setup for test results
 */
export const setupTestResultsEndpoint = () => {
  // Create a mock endpoint for test results
  window.mockApi = window.mockApi || {};
  window.mockApi.testResults = async (data) => {
    return processTestResults(data);
  };
  
  // Create a direct callable function for testing
  window.updateTestResults = (data) => {
    console.log("Manual test update called with:", data);
    return processTestResults(data);
  };
  
  // Add test function for the specific Not Run scenario
  window.testNotRunScenario = testNotRunScenario;
  
  console.log('Test results API endpoints set up:');
  console.log('- window.mockApi.testResults()');
  console.log('- window.updateTestResults()');
  console.log('- window.testNotRunScenario()');
  
  console.log('\nTest exact "Not Run" scenario with: window.testNotRunScenario()');
  
  return {
    url: 'window.mockApi.testResults',
    baseUrl: `${window.location.protocol}//${window.location.host}/api/test-results`,
    test: (data) => window.mockApi.testResults(data)
  };
};

// Initialize the API endpoint when this module is imported
const testResultsApi = setupTestResultsEndpoint();
export default testResultsApi;
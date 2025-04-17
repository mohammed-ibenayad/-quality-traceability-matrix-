// src/api/testResultsApi.js
/**
 * API endpoints for handling test results from external test runners
 */
import dataStore from '../services/DataStore';

/**
 * Process test results submitted from the GitHub Actions workflow
 * 
 * In a real application, this would be an Express or other server-side route handler
 * For this example, we're simulating a backend API in the browser
 * 
 * @param {Object} req - The request object
 * @param {Object} req.body - The request body containing test results
 * @param {String} req.body.requirementId - The requirement ID associated with the tests
 * @param {String} req.body.timestamp - ISO timestamp when the tests were run
 * @param {Array} req.body.results - Array of test results
 * @returns {Object} Response object
 */
export const processTestResults = async (req) => {
  try {
    const { requirementId, timestamp, results } = req.body;
    
    if (!requirementId || !timestamp || !Array.isArray(results)) {
      return {
        status: 400,
        body: { error: 'Invalid request body. requirementId, timestamp, and results[] are required.' }
      };
    }
    
    console.log(`Received test results for ${requirementId} at ${timestamp}`);
    console.log(`${results.length} tests executed:`, results);
    
    // Update test case status in the dataStore
    const updatedTestCases = updateTestCaseStatus(requirementId, results);
    
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
 * Normalize test case ID to match application format
 * @param {String} id - The test case ID to normalize
 * @returns {String} Normalized test case ID
 */
const normalizeTestCaseId = (id) => {
  if (!id) return id;
  
  // Convert TC_XXX to TC-XXX
  if (id.startsWith('TC_')) {
    return id.replace('TC_', 'TC_');
  }
  
  return id;
};

/**
 * Update test case status in the dataStore based on test results
 * 
 * @param {String} requirementId - The requirement ID associated with the tests
 * @param {Array} results - Array of test results
 * @returns {Array} Array of updated test cases
 */
const updateTestCaseStatus = (requirementId, results) => {
  try {
    // Get existing test cases
    const testCases = dataStore.getTestCases();
    
    // Get mapping to find test cases associated with this requirement
    const mapping = dataStore.getMapping();
    const associatedTestIds = mapping[requirementId] || [];
    
    // Array to track updated test cases
    const updatedTestCases = [];
    
    // Update test case status based on results
    results.forEach(result => {
      // Normalize test case ID to handle format differences
      const normalizedId = normalizeTestCaseId(result.id);
      
      console.log(`Looking for test case with ID: ${normalizedId} (original: ${result.id})`);
      
      // Find the corresponding test case in the dataStore
      const testCaseIndex = testCases.findIndex(tc => tc.id === normalizedId);
      
      if (testCaseIndex !== -1) {
        console.log(`Found test case at index ${testCaseIndex}:`, testCases[testCaseIndex]);
      } else {
        console.log(`Test case not found with ID ${normalizedId}`);
      }
      
      // Check if this test is associated with the requirement
      const isAssociated = associatedTestIds.includes(normalizedId);
      
      if (!isAssociated) {
        console.log(`Test case ${normalizedId} is not associated with requirement ${requirementId}`);
        console.log(`Associated test IDs:`, associatedTestIds);
      }
      
      // If found and the test is associated with this requirement, update its status
      if (testCaseIndex !== -1 && isAssociated) {
        testCases[testCaseIndex] = {
          ...testCases[testCaseIndex],
          status: result.status,
          lastExecuted: new Date().toISOString(),
          executionTime: result.duration || 0  // Store execution time in milliseconds
        };
        
        console.log(`Updated test case:`, testCases[testCaseIndex]);
        updatedTestCases.push(testCases[testCaseIndex]);
      } else if (testCaseIndex !== -1) {
        // Test case exists but is not associated with this requirement
        console.log(`Test case ${normalizedId} exists but is not associated with requirement ${requirementId}`);
        
        // Optionally update the mapping to associate this test with the requirement
        if (!mapping[requirementId]) {
          mapping[requirementId] = [];
        }
        
        if (!mapping[requirementId].includes(normalizedId)) {
          mapping[requirementId].push(normalizedId);
          console.log(`Added association between ${requirementId} and ${normalizedId}`);
          
          // Now update the test case
          testCases[testCaseIndex] = {
            ...testCases[testCaseIndex],
            status: result.status,
            lastExecuted: new Date().toISOString(),
            executionTime: result.duration || 0
          };
          
          updatedTestCases.push(testCases[testCaseIndex]);
        }
      } else {
        // Test case doesn't exist, could create it automatically
        console.log(`Test case ${normalizedId} not found in the system. Consider creating it.`);
        
        // Create a new test case
        const newTestCase = {
          id: normalizedId,
          name: result.name || `Test Case ${normalizedId}`,
          status: result.status,
          automationStatus: 'Automated',
          lastExecuted: new Date().toISOString(),
          executionTime: result.duration || 0,
          description: `Automatically created from test results for ${requirementId}`
        };
        
        // Add to test cases
        testCases.push(newTestCase);
        console.log(`Created new test case:`, newTestCase);
        
        // Add to mapping
        if (!mapping[requirementId]) {
          mapping[requirementId] = [];
        }
        
        if (!mapping[requirementId].includes(normalizedId)) {
          mapping[requirementId].push(normalizedId);
          console.log(`Added association between ${requirementId} and ${normalizedId}`);
        }
        
        updatedTestCases.push(newTestCase);
      }
    });
    
    // Update the dataStore with the updated test cases
    if (updatedTestCases.length > 0) {
      dataStore.setTestCases([...testCases]);
      
      // Also update mappings if necessary
      dataStore.updateMappings(mapping);
      
      console.log(`Updated ${updatedTestCases.length} test cases in DataStore`);
    } else {
      console.log('No test cases were updated');
    }
    
    return updatedTestCases;
  } catch (error) {
    console.error('Error updating test case status:', error);
    return [];
  }
};

/**
 * Example API route setup for test results
 * 
 * This function simulates an API endpoint for receiving test results
 * In a real application, you would use an actual backend server
 */
export const setupTestResultsEndpoint = () => {
  // Create a mock endpoint for test results
  // This is just for demonstration purposes
  window.mockApi = window.mockApi || {};
  window.mockApi.testResults = async (data) => {
    return processTestResults({ body: data });
  };
  
  console.log('Test results API endpoint is set up at window.mockApi.testResults');
  
  return {
    url: 'window.mockApi.testResults',
    baseUrl: `${window.location.protocol}//${window.location.host}/api/test-results`,
    test: (data) => window.mockApi.testResults(data)
  };
};

// Initialize the API endpoint when this module is imported
const testResultsApi = setupTestResultsEndpoint();
export default testResultsApi;
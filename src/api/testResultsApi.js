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
 * * @param {Object} data - Webhook payload for single test case
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
 * * @param {String} requestId - The request ID
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
 * * @param {Object} testCase - Test case result from webhook
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
 * * @param {Object} data - Individual test case webhook data
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
 * Helper function to extract file location from stack trace or classname.
 * This function attempts to find file and line number information within a stack trace
 * or derives a filename from the test case's classname.
 * @param {String} stackTrace - The full stack trace content.
 * @param {String} classname - The classname of the test case.
 * @returns {String} The extracted file location (e.g., "path/to/file.py:123") or 'N/A'.
 */
const extractFileLocation = (stackTrace, classname) => {
  if (!stackTrace && !classname) return 'N/A';

  // Try to extract from stack trace first (most accurate)
  if (stackTrace) {
    // Pattern for typical Python test paths (e.g., tests/module/test_file.py:123)
    const locationMatch = stackTrace.match(/tests\/([^:]+):(\d+)/);
    if (locationMatch) {
      return `${locationMatch[1]}:${locationMatch[2]}`;
    }

    // Generic Python file pattern (e.g., some_file.py:123)
    const pyLocationMatch = stackTrace.match(/([^\/\n]+\.py):(\d+)/);
    if (pyLocationMatch) {
      return `${pyLocationMatch[1]}:${pyLocationMatch[2]}`;
    }
  }

  // Fallback: extract from classname
  // This is less precise but can provide a filename (e.g., "test_user" from "tests.test_user.TestOpenCart")
  if (classname && classname.includes('.')) {
    const parts = classname.split('.');
    if (parts.length >= 2) {
      const fileName = parts[1];
      return `${fileName}.py`; // Assuming .py extension for Python tests
    }
  }

  return 'N/A';
};

/**
 * 🔧 FIXED: Use the EXACT same parsing logic as GitHubService polling
 * This function now mirrors GitHubService.parseJUnitXML() + transformTestResults()
 * * @param {String} xmlContent - Raw JUnit XML content
 * @param {String} testCaseId - Test case ID to look for
 * @returns {Object|null} Parsed test result with logs, failure, etc.
 */
const parseJunitXmlForTestCase = (xmlContent, testCaseId) => {
  try {
    console.log(`🔍 Parsing JUnit XML for test case using polling logic: ${testCaseId}`);

    // Step 1: Parse XML exactly like GitHubService.parseJUnitXML()
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

    const parseError = xmlDoc.querySelector("parsererror");
    if (parseError) {
      throw new Error(`XML parsing failed: ${parseError.textContent}`);
    }

    const testsuites = xmlDoc.querySelectorAll('testsuite');
    const tests = [];

    testsuites.forEach(testsuite => {
      const testcases = testsuite.querySelectorAll('testcase');

      testcases.forEach(testcase => {
        const name = testcase.getAttribute('name');
        const classname = testcase.getAttribute('classname');
        const time = parseFloat(testcase.getAttribute('time') || '0');

        // Check for failure or error (same as GitHubService)
        const failure = testcase.querySelector('failure');
        const error = testcase.querySelector('error');
        const skipped = testcase.querySelector('skipped');

        let status = 'Passed';
        let failureInfo = null;

        if (failure) {
          status = 'Failed';
          failureInfo = {
            type: failure.getAttribute('type') || 'TestFailure',
            message: failure.getAttribute('message') || '',
            stackTrace: failure.textContent || '',
            parsingSource: 'junit-xml',
            parsingConfidence: 'high',
            // ✅ CRITICAL: Add these missing fields for file location and details
            file: extractFileLocation(failure.textContent || '', classname),
            classname: classname,
            method: name,
            assertionType: failure.getAttribute('type')
          };
        } else if (error) {
          status = 'Failed';
          failureInfo = {
            type: error.getAttribute('type') || 'ExecutionError',
            message: error.getAttribute('message') || '',
            stackTrace: error.textContent || '',
            parsingSource: 'junit-xml',
            parsingConfidence: 'high',
            // ✅ CRITICAL: Add these missing fields for file location and details
            file: extractFileLocation(error.textContent || '', classname),
            classname: classname,
            method: name,
            assertionType: error.getAttribute('type')
          };
        } else if (skipped) {
          status = 'Skipped';
        }

        // ✅ CRITICAL: Extract system-out and system-err (like GitHubService)
        const systemOut = testcase.querySelector('system-out')?.textContent || '';
        const systemErr = testcase.querySelector('system-err')?.textContent || '';

        tests.push({
          name: name,
          classname: classname,
          time: time,
          status: status,
          failure: failureInfo,
          system_out: systemOut,
          system_err: systemErr,
          // ✅ Add file info at test level too
          file: extractFileLocation(failureInfo?.stackTrace || '', classname)
        });
      });
    });

    // Step 2: Find the matching test (same logic as GitHubService.transformTestResults)
    console.log(`🔍 Found ${tests.length} tests in XML, looking for ${testCaseId}`);

    let testResult = null;

    // Try exact match first
    testResult = tests.find(t => t.name === testCaseId);
    if (testResult) {
      console.log(`✅ Found exact name match: ${testResult.name}`);
    }

    // Try fuzzy matching
    if (!testResult) {
      testResult = tests.find(t => {
        const testName = t.name || '';
        const className = t.classname || '';

        return testName.includes(testCaseId) ||
               className.includes(testCaseId) ||
               testCaseId.includes(testName) ||
               (testName.startsWith('test_') && testCaseId.includes(testName));
      });

      if (testResult) {
        console.log(`✅ Found fuzzy match: ${testResult.name} (class: ${testResult.classname})`);
      }
    }

    if (!testResult) {
      console.log(`⚠️ Test ${testCaseId} not found in XML. Available tests:`);
      tests.forEach((t, i) => {
        console.log(`  ${i + 1}. name="${t.name}", classname="${t.classname}"`);
      });
      return null;
    }

    // Step 3: Transform to standard format (EXACT same as GitHubService.transformTestResults)
    const duration = parseFloat(testResult.time || 0) * 1000; // Convert to milliseconds

    // ✅ CRITICAL: Generate logs exactly like GitHubService
    let logs = '';
    if (testResult.system_out) {
      logs += `STDOUT:\n${testResult.system_out}\n`;
    }
    if (testResult.system_err) {
      logs += `STDERR:\n${testResult.system_err}\n`;
    }
    if (testResult.failure) {
      // ✅ FIX: Use stackTrace for better error details in logs
      const failureText = testResult.failure.stackTrace || testResult.failure.message || testResult.failure;
      logs += `FAILURE:\n${failureText}\n`;
    }
    if (!logs) {
      logs = testResult.status === 'Passed' ?
        `Test ${testCaseId} executed successfully` :
        `Test ${testCaseId} completed with status: ${testResult.status}`;
    }

    console.log(`✅ Transformed test data for ${testCaseId}:`, {
      status: testResult.status,
      duration: duration,
      hasFailure: !!testResult.failure,
      hasLogs: !!logs.trim(),
      hasFile: !!testResult.file
    });

    // ✅ Return the SAME structure as GitHubService.transformTestResults
    return {
      status: testResult.status,
      duration: duration,
      logs: logs.trim(),             // ← NOW INCLUDES FULL LOGS
      rawOutput: logs.trim(),        // ← ADD: For rawOutput field
      failure: testResult.failure,   // ← NOW HAS ALL ENHANCED FIELDS
      classname: testResult.classname,
      framework: 'pytest',           // ← FIX: Set correct framework
      time: testResult.time,
      system_out: testResult.system_out,  // ← NOW EXTRACTED
      system_err: testResult.system_err,  // ← NOW EXTRACTED
      method: testResult.name,       // ← FIX: Use XML method name
      file: testResult.file          // ← ADD: File location
    };

  } catch (error) {
    console.error(`❌ Error parsing JUnit XML like polling for ${testCaseId}:`, error);
    throw error;
  }
};

/**
 * ENHANCED: Process individual test case result with JUnit XML parsing
 * * @param {Object} data - The webhook data for a single test case
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
            resultsLength: results?.length || 0
          }
        }
      };
    }

    const testCase = results[0];
    const testCaseId = testCase.id;
    console.log(`📝 Processing test case: ${testCaseId} (${testCase.status})`);

    // ✅ ENHANCED: Process JUnit XML content if available using SAME logic as polling
    let enhancedTestCase = { ...testCase };

    if (testCase.junitXml && testCase.junitXml.available && testCase.junitXml.content) {
      console.log(`🔍 JUnit XML available for ${testCaseId}, parsing with polling logic...`);

      try {
        // ✅ Use the updated parseJunitXmlForTestCase that now includes logs and file info
        const parsedTestData = parseJunitXmlForTestCase(testCase.junitXml.content, testCaseId);

        if (parsedTestData) {
          console.log(`✅ JUnit XML parsed successfully for ${testCaseId}`, {
            status: parsedTestData.status,
            hasFailure: !!parsedTestData.failure,
            hasLogs: !!parsedTestData.logs,
            logsLength: parsedTestData.logs?.length || 0,
            hasFile: !!parsedTestData.file
          });

          // ✅ CRITICAL: Use ALL the parsed data from XML (just like polling)
          enhancedTestCase = {
            ...testCase,
            status: parsedTestData.status,
            duration: parsedTestData.duration,
            logs: parsedTestData.logs,    // ← NOW HAS FULL LOGS
            failure: parsedTestData.failure,
            classname: parsedTestData.classname,
            framework: parsedTestData.framework,
            time: parsedTestData.time,
            system_out: parsedTestData.system_out,  // ← NOW EXTRACTED
            system_err: parsedTestData.system_err,  // ← NOW EXTRACTED
            method: parsedTestData.method,
            file: parsedTestData.file,              // ← NOW EXTRACTED
            parsingSource: 'junit-xml',
            parsingConfidence: 'high'
          };
        } else {
          console.log(`ℹ️ No test data found in JUnit XML for ${testCaseId}`);
        }
      } catch (parseError) {
        console.error(`❌ JUnit XML parsing failed for ${testCaseId}:`, parseError);
        enhancedTestCase.parsingSource = 'junit-xml-error';
        enhancedTestCase.parsingConfidence = 'none';
      }
    }

    // Store enhanced test case result
    const storageKey = storeTestCaseWebhookResult({
      ...data,
      results: [enhancedTestCase]
    });

    if (storageKey) {
      console.log(`📋 Enhanced test case stored: ${storageKey}`);
    }

    // Update test case in DataStore with enhanced data
    const updatedTestCase = updateTestCaseInDataStore(enhancedTestCase);

    if (updatedTestCase) {
      console.log(`🎯 DataStore updated successfully for ${testCaseId}`);
    }

    // Notify listeners with enhanced data
    notifyWebhookListeners({
      ...data,
      results: [enhancedTestCase]
    });

    return {
      status: 200,
      body: {
        success: true,
        message: `Individual test case webhook processed successfully with enhanced data`,
        testCaseId,
        status: enhancedTestCase.status,
        storageKey,
        enhanced: !!enhancedTestCase.logs,  // ← Now should be true
        logsExtracted: !!(enhancedTestCase.system_out || enhancedTestCase.system_err),
        parsingSource: enhancedTestCase.parsingSource || 'none'
      }
    };

  } catch (error) {
    console.error('❌ Error processing individual test case result:', error);
    return {
      status: 500,
      body: { error: 'Internal server error processing individual test case result' }
    };
  }
};

/**
 * 🆕 NEW: Parse assertion details from failure message and stack trace
 * * @param {String} message - Failure message
 * @param {String} stackTrace - Stack trace content
 * @returns {Object|null} Assertion object or null
 */
const parseAssertionFromMessage = (message, stackTrace) => {
  try {
    // Pattern 1: Simple assert like "assert 1 == 2"
    const assertMatch = message.match(/assert\s+(.+?)\s*(==|!=|<|>|<=|>=)\s*(.+?)(?:\s|$)/);

    if (assertMatch) {
      return {
        available: true,
        expression: message,
        actual: assertMatch[1].trim(), // Use trim() instead of non-existent strip()
        expected: assertMatch[3].trim(), // Use trim() instead of non-existent strip()
        operator: assertMatch[2]
      };
    }

    // Pattern 2: Look in stack trace for assertion details
    if (stackTrace) {
      const stackAssertMatch = stackTrace.match(/assert\s+(.+?)\s*(==|!=|<|>|<=|>=)\s*(.+?)(?:\n|$)/);
      if (stackAssertMatch) {
        return {
          available: true,
          expression: message,
          actual: stackAssertMatch[1].trim(), // Use trim() instead of non-existent strip()
          expected: stackAssertMatch[3].trim(), // Use trim() instead of non-existent strip()
          operator: stackAssertMatch[2]
        };
      }
    }

    // Basic assertion without clear expected/actual
    return {
      available: true,
      expression: message,
      actual: '',
      expected: '',
      operator: ''
    };

  } catch (error) {
    console.error('Error parsing assertion:', error);
    return null;
  }
};

/**
 * 🆕 NEW: Extract execution error information from stack trace
 * * @param {String} stackTrace - Full stack trace content
 * @param {String} message - Error message
 * @returns {Object|null} Execution error info or null
 */
const extractExecutionErrorInfo = (stackTrace, message) => {
  try {
    const errorInfo = {
      errorType: 'ExecutionError',
      rootCause: '',
      location: '',
      suggestion: ''
    };

    // Selenium WebDriver errors
    if (stackTrace.includes('SessionNotCreatedException')) {
      errorInfo.errorType = 'SessionNotCreatedException';
      errorInfo.rootCause = 'Chrome driver session creation failed';

      if (stackTrace.includes('user data directory')) {
        errorInfo.suggestion = 'Chrome user data directory conflict - ensure unique data directories';
      } else {
        errorInfo.suggestion = 'Check Chrome driver installation and browser compatibility';
      }
    }
    // WebDriver setup errors
    else if (stackTrace.includes('WebDriverException')) {
      errorInfo.errorType = 'WebDriverException';
      errorInfo.rootCause = 'WebDriver setup or communication issue';
      errorInfo.suggestion = 'Verify WebDriver configuration and browser availability';
    }
    // Python import/module errors
    else if (stackTrace.includes('ModuleNotFoundError') || stackTrace.includes('ImportError')) {
      errorInfo.errorType = 'ModuleNotFoundError';
      errorInfo.rootCause = 'Missing Python module or import failure';
      errorInfo.suggestion = 'Install missing dependencies or check Python environment';
    }
    // Connection/network errors
    else if (stackTrace.includes('ConnectionError') || stackTrace.includes('TimeoutException')) {
      errorInfo.errorType = 'ConnectionError';
      errorInfo.rootCause = 'Network or connection timeout';
      errorInfo.suggestion = 'Check network connectivity and service availability';
    }
    // General execution errors
    else {
      errorInfo.rootCause = 'Test execution environment issue';
      errorInfo.suggestion = 'Check test setup and environment configuration';
    }

    // Extract file location from stack trace if available
    const locationMatch = stackTrace.match(/tests\/([^:]+):(\d+)/);
    if (locationMatch) {
      errorInfo.location = `${locationMatch[1]}:${locationMatch[2]}`;
    }

    return errorInfo;

  } catch (error) {
    console.error('Error extracting execution error info:', error);
    return null;
  }
};

/**
 * 🆕 NEW: Categorize failure types (enhanced for execution errors)
 * * @param {String} failureType - Failure type from XML
 * @param {String} message - Failure message
 * @returns {String} Category name
 */
const categorizeFailure = (failureType, message) => {
  const lowerType = failureType.toLowerCase();
  const lowerMessage = message.toLowerCase();

  // Selenium/WebDriver errors
  if (lowerType.includes('sessionnotcreated') || lowerType.includes('webdriver')) {
    return 'webdriver';
  }
  // Timeout errors
  if (lowerType.includes('timeout') || lowerMessage.includes('timeout')) {
    return 'timeout';
  }
  // Element interaction errors
  if (lowerType.includes('element') || lowerMessage.includes('element')) {
    return 'element';
  }
  // Network/connection errors
  if (lowerType.includes('network') || lowerType.includes('connection') ||
      lowerMessage.includes('network') || lowerMessage.includes('connection')) {
    return 'network';
  }
  // Environment/setup errors
  if (lowerType.includes('import') || lowerType.includes('module') ||
      lowerMessage.includes('import') || lowerMessage.includes('module')) {
    return 'environment';
  }

  return 'general';
};

/**
 * BACKWARD COMPATIBILITY: Process bulk test results (legacy support)
 * This maintains compatibility with existing bulk webhook handling
 * * @param {Object} data - Legacy bulk webhook data
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
 * * @param {String} requestId - The request ID
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
 * * @param {String} requestId - Test request ID
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
 * * @param {String} requestId - Test request ID
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

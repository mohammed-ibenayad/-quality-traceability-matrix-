// src/components/TestExecution/TestExecutionModal.jsx - JUnit XML-Only Enhanced
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  GitBranch,
  Save,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronRight,
  Loader2,
  Check,
  AlertTriangle,
  AlertCircle,
  X,
  Bug,
  Eye
} from 'lucide-react';
import GitHubService from '../../services/GitHubService';
import dataStore from '../../services/DataStore';
import { refreshQualityGates } from '../../utils/calculateQualityGates';
import webhookService from '../../services/WebhookService';
import FailureAnalysisModal from './FailureAnalysisModal';

const getCallbackUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001/api/webhook/test-results';
  }
  return `${window.location.protocol}//${window.location.hostname}/api/webhook/test-results`;
};

const TestExecutionModal = ({
  requirement = null, // null for bulk execution from Test Cases page
  testCases = [],
  isOpen = false,
  onClose,
  onTestComplete
}) => {
  // GitHub Configuration state
  const [config, setConfig] = useState(() => {
    const savedConfig = localStorage.getItem('testRunnerConfig');
    const defaultConfig = {
      repoUrl: '',
      branch: 'main',
      workflowId: 'quality-tracker-tests-ind.yml',
      ghToken: '',
      callbackUrl: getCallbackUrl()
    };
    return savedConfig ? { ...defaultConfig, ...JSON.parse(savedConfig) } : defaultConfig;
  });

  // Backend support detection
  const [hasBackendSupport, setHasBackendSupport] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');

  // Per test case execution state
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [testCaseResults, setTestCaseResults] = useState(new Map());
  const [executionStatus, setExecutionStatus] = useState(null);
  const [expectedTestCases, setExpectedTestCases] = useState([]);

  // GitHub execution state
  const [isRunning, setIsRunning] = useState(false);
  const [waitingForWebhook, setWaitingForWebhook] = useState(false);
  const [error, setError] = useState(null);
  const [workflowRun, setWorkflowRun] = useState(null);

  // Polling and timeout management
  const [pollInterval, setPollInterval] = useState(null);
  const [webhookTimeout, setWebhookTimeout] = useState(null);
  const waitingForWebhookRef = useRef(false);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(null);

  // Enhanced failure analysis state
  const [selectedFailure, setSelectedFailure] = useState(null);
  const [showFailurePanel, setShowFailurePanel] = useState(false);

  // Track previous props to detect changes
  const prevProps = useRef({ isOpen: false, testCases: [] });
  
  // CRITICAL FIX: Track subscription state to prevent duplicates
  const subscriptionRef = useRef(null);

  // ENHANCED: Failure helper functions - JUnit XML-Only
  // Enhanced failure type detection with JUnit XML awareness
  const getFailureTypeIcon = (result) => {
    if (!result.failure) return null;
    
    // ✅ Use enhanced category from JUnit XML or parsing
    const category = result.failure.category || result.failure.type;
    
    // Priority categorization
    if (category === 'assertion' || result.failure.assertion?.available || 
        result.failure.type?.includes('Assertion') || result.failure.type === 'AssertionError') {
      return '🔍'; // Assertion
    }
    if (category === 'timeout' || result.failure.type?.includes('Timeout')) {
      return '⏱️'; // Timeout
    }
    if (category === 'element' || result.failure.type?.includes('Element')) {
      return '🎯'; // Element
    }
    if (category === 'network' || result.failure.type?.includes('Network') || 
        result.failure.type?.includes('API') || result.failure.type?.includes('Connection')) {
      return '🌐'; // Network
    }
    return '❌'; // General failure
  };

  // Enhanced failure insight generation with JUnit XML data
  const getQuickInsight = (result) => {
    if (!result.failure) return null;
    
    // ✅ Priority 1: Use parsed assertion details from JUnit XML
    if (result.failure.assertion?.available) {
      const { actual, expected, operator } = result.failure.assertion;
      if (actual && expected) {
        return `Expected ${expected}, got ${actual}`;
      } else if (result.failure.assertion.expression) {
        return `Assertion failed: ${result.failure.assertion.expression}`;
      }
    }
    
    // ✅ Priority 2: Use JUnit XML message directly
    if (result.failure.message && result.failure.parsingSource === 'junit-xml') {
      return result.failure.message;
    }
    
    // ✅ Priority 3: Use categorized insights
    const category = result.failure.category || result.failure.type;
    
    if (category === 'assertion' || result.failure.type === 'AssertionError') {
      return 'Assertion failed - value mismatch detected';
    }
    if (category === 'timeout' || result.failure.type?.includes('Timeout')) {
      return 'Operation timed out';
    }
    if (category === 'element') {
      if (result.failure.type === 'ElementNotInteractableException') {
        return 'Element blocked by overlay or not clickable';
      }
      if (result.failure.type === 'NoSuchElementException') {
        return 'Element not found on page';
      }
      return 'Element interaction failed';
    }
    if (category === 'network' || result.failure.type?.includes('Network')) {
      return 'Network or API connection failed';
    }
    
    // ✅ Priority 4: Use original message or fallback
    if (result.failure.message) {
      return result.failure.message;
    }
    
    return 'Test execution failed';
  };

  // Open failure analysis panel
  const openFailureAnalysis = (result) => {
    setSelectedFailure(result);
    setShowFailurePanel(true);
  };

  // Close failure analysis panel
  const closeFailureAnalysis = () => {
    setSelectedFailure(null);
    setShowFailurePanel(false);
  };

  // FIXED: Add automatic completion detection useEffect
  useEffect(() => {
    // Only check completion if we're actually running tests and have expected test cases
    if ((isRunning || waitingForWebhook) && expectedTestCases.length > 0) {
      const results = Array.from(testCaseResults.values());
      const completedStatuses = ['Passed', 'Failed', 'Cancelled', 'Skipped', 'Not Run', 'Not Found'];
      const completedTests = results.filter(r => completedStatuses.includes(r.status));
      
      console.log(`📊 Auto-check execution progress: ${completedTests.length}/${expectedTestCases.length} tests completed`);
      
      if (completedTests.length >= expectedTestCases.length && expectedTestCases.length > 0) {
        console.log('🏁 All test cases completed - auto-detected!');
        
        setIsRunning(false);
        setWaitingForWebhook(false);
        waitingForWebhookRef.current = false;
        setExecutionStatus('completed');
        setProcessingStatus('completed');
        
        // Clear any polling
        if (pollInterval) {
          clearInterval(pollInterval);
          setPollInterval(null);
        }
        if (webhookTimeout) {
          clearTimeout(webhookTimeout);
          setWebhookTimeout(null);
        }

        // Notify parent
        if (onTestComplete) {
          onTestComplete(completedTests);
        }

        // REMOVED: Auto-closing - let user review results and close manually
      }
    }
  }, [testCaseResults, isRunning, waitingForWebhook, expectedTestCases.length, onTestComplete, pollInterval, webhookTimeout]);

  // Add this to TestExecutionModal.jsx - Replace your handleTestCaseUpdate function

const handleTestCaseUpdate = useCallback((eventData) => {
  console.log('🧪 Enhanced test case update received:', eventData);
  
  const { type, requestId, testCaseId, testCase, allResults } = eventData;
  
  // CRITICAL: Check current request ID from ref, not closure
  const currentReqId = subscriptionRef.current;
  if (requestId !== currentReqId) {
    console.log(`❌ Event for ${requestId}, but current is ${currentReqId} - ignoring`);
    return;
  }

  if (type === 'test-case-update' && testCaseId && testCase) {
    console.log('🔍 Processing test case update:', {
      testCaseId,
      status: testCase.status,
      hasFailure: !!testCase.failure,
      hasJunitXml: !!(testCase.junitXml && testCase.junitXml.available),
      hasRawOutput: !!testCase.rawOutput
    });

    // 🆕 CRITICAL FIX: Parse JUnit XML if available (same as polling mechanism)
    let enhancedTestCase = { ...testCase };
    
    if (testCase.junitXml && testCase.junitXml.available && testCase.junitXml.content) {
      console.log(`🔍 JUnit XML available for ${testCaseId}, parsing using frontend parser...`);
      
      try {
        // Use the same parsing logic as GitHubService.parseJUnitXML
        const parsedFailure = parseJunitXmlForTestCaseFrontend(testCase.junitXml.content, testCaseId);
        
        if (parsedFailure) {
          console.log(`✅ JUnit XML parsed successfully for ${testCaseId}`, {
            type: parsedFailure.type,
            hasMessage: !!parsedFailure.message,
            hasStackTrace: !!parsedFailure.stackTrace,
            category: parsedFailure.category
          });
          
          enhancedTestCase.failure = parsedFailure;
        } else {
          console.log(`ℹ️ No failure found in JUnit XML for ${testCaseId}`);
        }
      } catch (parseError) {
        console.error(`❌ JUnit XML parsing failed for ${testCaseId}:`, parseError);
      }
    }

    // Create enhanced failure object for failed tests
    let enhancedFailure = null;
    
    if (enhancedTestCase.status === 'Failed') {
      // Priority 1: Use JUnit XML parsed data
      if (enhancedTestCase.failure) {
        console.log(`✅ Using JUnit XML parsed data for ${testCaseId}`);
        enhancedFailure = enhancedTestCase.failure;
      }
      // Priority 2: Create minimal failure object
      else {
        console.log(`📝 Creating minimal failure object for ${testCaseId}`);
        enhancedFailure = {
          type: 'TestFailure',
          message: 'Test execution failed',
          source: 'minimal-fallback',
          parsingConfidence: 'low'
        };
      }
    }
    
    // Update specific test case with enhanced failure data
    setTestCaseResults(prev => {
      const updated = new Map(prev);
      const existingResult = prev.get(testCaseId);
      
      const enhancedResult = {
        id: testCaseId,
        name: existingResult?.name || enhancedTestCase.name || `Test ${testCaseId}`,
        status: enhancedTestCase.status,
        duration: enhancedTestCase.duration || 0,
        logs: enhancedTestCase.logs || '',
        rawOutput: enhancedTestCase.rawOutput || '',
        receivedAt: new Date().toISOString(),
        
        // ✅ Enhanced failure data from XML parsing
        failure: enhancedFailure,
        execution: enhancedTestCase.execution,
        framework: enhancedTestCase.framework,
        
        // ✅ Add file/line info if available from JUnit XML
        file: enhancedTestCase.file || enhancedFailure?.file,
        line: enhancedTestCase.line || enhancedFailure?.line,
        classname: enhancedTestCase.classname,
        method: enhancedTestCase.method
      };
      
      updated.set(testCaseId, enhancedResult);
      console.log(`📝 Enhanced test case ${testCaseId}: ${enhancedTestCase.status} (source: ${enhancedFailure?.parsingSource || 'none'})`);
      return updated;
    });

    // Update DataStore with enhanced failure data
    const currentTestCases = dataStore.getTestCases();
    const testCaseObj = currentTestCases.find(tc => tc.id === testCaseId);
    if (testCaseObj) {
      dataStore.updateTestCase(testCaseId, {
        ...testCaseObj,
        status: enhancedTestCase.status,
        lastRun: new Date().toISOString(),
        lastExecuted: enhancedTestCase.status !== 'Not Started' ? new Date().toISOString() : null,
        failure: enhancedFailure // Add failure data to DataStore
      });
    }
  }
}, [subscriptionRef]);

// 🆕 CRITICAL: Add JUnit XML parsing function for frontend (same logic as GitHubService)
const parseJunitXmlForTestCaseFrontend = (xmlContent, testCaseId) => {
  try {
    console.log(`🔍 Frontend parsing JUnit XML for test case: ${testCaseId}`);
    
    // Create DOM parser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
    
    // Check for parsing errors
    const parseError = xmlDoc.querySelector("parsererror");
    if (parseError) {
      throw new Error(`XML parsing failed: ${parseError.textContent}`);
    }
    
    // Find all test cases in the XML
    const testCases = xmlDoc.querySelectorAll('testcase');
    let targetTestCase = null;
    
    // Look for the specific test case
    for (let testCase of testCases) {
      const name = testCase.getAttribute('name');
      const classname = testCase.getAttribute('classname');
      
      // Match by test ID in name or classname
      if (name && (name.includes(testCaseId) || name.endsWith(testCaseId))) {
        targetTestCase = testCase;
        console.log(`✅ Found test case in XML: ${name}`);
        break;
      }
    }
    
    if (!targetTestCase) {
      console.log(`⚠️ Test case ${testCaseId} not found in JUnit XML`);
      return null;
    }
    
    // Check for failure or error elements
    const failureElement = targetTestCase.querySelector('failure');
    const errorElement = targetTestCase.querySelector('error');
    
    if (!failureElement && !errorElement) {
      console.log(`ℹ️ No failure/error element found for ${testCaseId}`);
      return null;
    }
    
    const element = failureElement || errorElement;
    const isError = !!errorElement;
    const failureType = element.getAttribute('type') || (isError ? 'ExecutionError' : 'TestFailure');
    const failureMessage = element.getAttribute('message') || '';
    const stackTrace = element.textContent || '';
    
    console.log(`🚨 ${isError ? 'Execution error' : 'Test failure'} detected: ${failureType}`);
    
    // Build enhanced failure object (same as GitHubService)
    const failure = {
      type: failureType,
      message: failureMessage,
      stackTrace: stackTrace,
      parsingSource: 'junit-xml',
      parsingConfidence: 'high',
      category: categorizeFailureType(failureType, failureMessage)
    };
    
    // Extract file and line info if available
    const classname = targetTestCase.getAttribute('classname') || '';
    const file = targetTestCase.getAttribute('file') || '';
    const line = targetTestCase.getAttribute('line') || '0';
    
    if (file) {
      failure.file = file.split('/').pop(); // Get filename only
    }
    if (line && line !== '0') {
      failure.line = parseInt(line);
    }
    failure.classname = classname;
    failure.method = targetTestCase.getAttribute('name') || '';
    
    // Parse assertion details for assertion errors
    if (failureType === 'AssertionError' || failureMessage.toLowerCase().includes('assert')) {
      const assertion = parseAssertionFromJUnit(failureMessage, stackTrace);
      if (assertion) {
        failure.assertion = assertion;
        failure.category = 'assertion';
      }
    }
    
    console.log(`✅ Enhanced failure object created for ${testCaseId}`, {
      type: failure.type,
      category: failure.category,
      hasFile: !!failure.file,
      hasLine: !!failure.line,
      hasAssertion: !!failure.assertion
    });
    
    return failure;
    
  } catch (error) {
    console.error(`❌ Error parsing JUnit XML for ${testCaseId}:`, error);
    throw error;
  }
};

// Helper function to categorize failure types
const categorizeFailureType = (failureType, failureMessage) => {
  const type = (failureType || '').toLowerCase();
  const message = (failureMessage || '').toLowerCase();
  
  if (type.includes('assertion') || message.includes('assert')) {
    return 'assertion';
  }
  if (type.includes('timeout') || message.includes('timeout')) {
    return 'timeout';
  }
  if (type.includes('element') || message.includes('element')) {
    return 'element';
  }
  if (type.includes('network') || type.includes('connection') || message.includes('network')) {
    return 'network';
  }
  
  return 'general';
};

// Helper function to parse assertion details
const parseAssertionFromJUnit = (message, stackTrace) => {
  try {
    // Look for common assertion patterns
    const assertMatch = message.match(/assert\s+(.+?)\s*(==|!=|<|>|<=|>=)\s*(.+?)(?:\s|$)/i);
    if (assertMatch) {
      return {
        available: true,
        actual: assertMatch[1].trim(),
        operator: assertMatch[2],
        expected: assertMatch[3].trim(),
        expression: message
      };
    }
    
    // Look for "Expected X but was Y" patterns
    const expectedMatch = message.match(/expected\s+(.+?)\s+but\s+(?:was|got)\s+(.+?)(?:\s|$)/i);
    if (expectedMatch) {
      return {
        available: true,
        expected: expectedMatch[1].trim(),
        actual: expectedMatch[2].trim(),
        operator: 'equals',
        expression: message
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing assertion:', error);
    return null;
  }
};

  // Initialize when modal first opens or test cases change significantly
  useEffect(() => {
    const propsChanged = isOpen !== prevProps.current.isOpen || 
                        JSON.stringify(testCases.map(tc => tc.id)) !== JSON.stringify(prevProps.current.testCases.map(tc => tc.id));
    
    if (isOpen && testCases.length > 0 && propsChanged) {
      console.log('🎭 Initializing test execution modal');
      
      // Reset subscription ref on initialization
      subscriptionRef.current = null;
      
      // Only reset state if we're not in the middle of an execution
      if (!isRunning && !waitingForWebhook) {
        console.log('📋 Resetting modal state - no active execution');
        
        // Initialize test case results map with enhanced structure
        const initialResults = new Map();
        testCases.forEach(testCase => {
          initialResults.set(testCase.id, {
            id: testCase.id,
            name: testCase.name,
            status: 'Not Started',
            duration: 0,
            logs: '',
            rawOutput: '',
            startTime: null,
            endTime: null,
            receivedAt: null,
            // Initialize enhanced failure data structure
            failure: null,
            execution: null
          });
        });
        
        setTestCaseResults(initialResults);
        setExpectedTestCases(testCases.map(tc => tc.id));

        // Reset execution states only if not running
        setError(null);
        setProcessingStatus(null);
        setExecutionStatus(null);
        
        // Only reset currentRequestId if not waiting for webhook
        if (!waitingForWebhook) {
          setCurrentRequestId(null);
        }

        // Clear intervals and timeouts
        if (pollInterval) {
          clearInterval(pollInterval);
          setPollInterval(null);
        }
        if (webhookTimeout) {
          clearTimeout(webhookTimeout);
          setWebhookTimeout(null);
        }
      } else {
        console.log('⚠️ Active execution detected - preserving state');
      }

      console.log('✅ Test execution modal initialized for:', requirement ? requirement.id : 'bulk execution');
      console.log(`📊 Expected test cases: ${testCases.length}`, testCases.map(tc => tc.id));
    }
    
    // Update previous props
    prevProps.current = { isOpen, testCases };
  }, [isOpen, testCases, requirement, isRunning, waitingForWebhook]);

  // Sync ref with state
  useEffect(() => {
    waitingForWebhookRef.current = waitingForWebhook;
  }, [waitingForWebhook]);

  // Check backend availability
  const checkBackend = async () => {
    try {
      setBackendStatus('checking');
      const isHealthy = await webhookService.checkBackendHealth();
      setHasBackendSupport(isHealthy);
      setBackendStatus(isHealthy ? 'available' : 'unavailable');

      if (isHealthy) {
        console.log('✅ Backend webhook service available');
      } else {
        console.log('📡 Backend unavailable, using fallback mode');
      }
    } catch (error) {
      console.error('Backend check failed:', error);
      setHasBackendSupport(false);
      setBackendStatus('unavailable');
    }
  };

  // Check backend when modal opens
  useEffect(() => {
    if (isOpen) {
      checkBackend();
    }
  }, [isOpen]);

  // Fetch existing results when modal opens with a currentRequestId
  useEffect(() => {
    if (isOpen && currentRequestId && hasBackendSupport) {
      console.log(`🔍 Checking for existing results for request: ${currentRequestId}`);
      
      try {
        const results = webhookService.getAllTestCaseResults(currentRequestId);
        
        if (results.length > 0) {
          console.log('📦 Found existing results with enhanced data:', results);
          
          // Update state with existing results including enhanced failure data
          setTestCaseResults(prev => {
            const updated = new Map(prev);
            results.forEach(result => {
              if (result.id) {
                const existingResult = prev.get(result.id);
                updated.set(result.id, {
                  id: result.id,
                  name: existingResult?.name || result.name || `Test ${result.id}`,
                  status: result.status,
                  duration: result.duration || 0,
                  logs: result.logs || '',
                  rawOutput: result.rawOutput || '',
                  receivedAt: result.receivedAt,
                  // Include enhanced failure data
                  failure: result.failure,
                  execution: result.execution
                });
              }
            });
            return updated;
          });
        } else {
          console.log('📋 No existing results found');
        }
      } catch (error) {
        console.warn('Error fetching existing results:', error);
      }
    }
  }, [isOpen, currentRequestId, hasBackendSupport]);

  // FIXED: Separate useEffect for backend webhook subscription with duplicate prevention
  useEffect(() => {
    // Early exit conditions
    if (!isOpen || !currentRequestId || !hasBackendSupport || !webhookService) {
      return;
    }

    // CRITICAL FIX: Prevent duplicate subscriptions
    if (subscriptionRef.current === currentRequestId) {
      console.log(`⚠️ Already subscribed to ${currentRequestId}, skipping duplicate subscription`);
      return;
    }

    console.log(`🎯 Setting up webhook listener for request: ${currentRequestId}`);
    
    // Mark this subscription as active
    subscriptionRef.current = currentRequestId;
    
    // Register execution with expected test cases
    webhookService.registerTestExecution(currentRequestId, expectedTestCases);
    
    // Subscribe to test case updates
    webhookService.subscribeToRequest(currentRequestId, handleTestCaseUpdate);

    // Cleanup function
    return () => {
      console.log(`🧹 Cleaning up webhook listener for request: ${currentRequestId}`);
      webhookService.unsubscribeFromRequest(currentRequestId);
      
      // Clear the subscription ref if it matches this request
      if (subscriptionRef.current === currentRequestId) {
        subscriptionRef.current = null;
      }
    };
  }, [isOpen, currentRequestId, hasBackendSupport]); // MINIMAL DEPENDENCIES

  // FIXED: Separate useEffect for fallback mode with enhanced failure data processing
  useEffect(() => {
    if (!isOpen || hasBackendSupport) {
      return;
    }

    console.log(`🎯 Setting up fallback webhook listener`);
    
    window.onTestWebhookReceived = (webhookData) => {
      console.log('🔔 Fallback webhook received:', webhookData);
      
      // Convert bulk webhook to individual test case updates with enhanced failure data
      if (webhookData?.results && Array.isArray(webhookData.results)) {
        webhookData.results.forEach(testCase => {
          if (testCase.id) {
            handleTestCaseUpdate({
              type: 'test-case-update',
              requestId: webhookData.requestId,
              testCaseId: testCase.id,
              testCase: testCase
            });
          }
        });
      }
    };

    // Cleanup function
    return () => {
      window.onTestWebhookReceived = null;
    };
  }, [isOpen, hasBackendSupport, handleTestCaseUpdate]);

  // ADDED: Cleanup subscription on modal close
  useEffect(() => {
    if (!isOpen && subscriptionRef.current) {
      console.log('🧹 Modal closed, cleaning up any remaining subscription');
      if (webhookService) {
        webhookService.unsubscribeFromRequest(subscriptionRef.current);
      }
      subscriptionRef.current = null;
    }
  }, [isOpen]);

  // Save configuration
  const saveConfiguration = () => {
    localStorage.setItem('testRunnerConfig', JSON.stringify(config));
    setShowSettings(false);
    console.log("⚙️ Configuration saved:", config);
  };

  // FIXED: Updated GitHub workflow completion check with enhanced failure data processing
  const checkGitHubWorkflowCompletion = async (owner, repo, runId, workflowPayload) => {
    console.log('🔄 Starting GitHub API polling for workflow', runId);
    
    const maxPolls = 90; // 3 minutes at 2-second intervals
    let pollCount = 0;
    
    const interval = setInterval(async () => {
      pollCount++;
      console.log(`🔄 GitHub API Poll #${pollCount}/${maxPolls} for workflow ${runId}`);

      try {
        const status = await GitHubService.getWorkflowStatus(owner, repo, runId, config.ghToken);
        
        if (status.status === 'completed') {
          console.log('✅ Workflow completed');
          
          clearInterval(interval);
          setPollInterval(null);

          try {
            const actionResults = await GitHubService.getWorkflowResults(
              owner, repo, runId, config.ghToken, workflowPayload
            );
            
            console.log(`📥 Retrieved ${actionResults.length} test results from artifacts`);
            
            // Process results with enhanced failure data from XML parsing
            const processedResults = new Map(testCaseResults);
            
            actionResults.forEach(result => {
              if (result.id) {
                const existingResult = processedResults.get(result.id);
                
                const updatedResult = {
                  id: result.id,
                  name: existingResult?.name || result.name || `Test ${result.id}`,
                  status: result.status,
                  duration: result.duration || 0,
                  logs: result.logs || '',
                  rawOutput: result.rawOutput || '',
                  receivedAt: new Date().toISOString(),
                  // ✅ Include failure data from XML parsing
                  failure: result.failure,
                  execution: result.execution,
                  file: result.file,
                  classname: result.classname
                };
                
                processedResults.set(result.id, updatedResult);
                console.log(`🔄 Processing GitHub result: ${result.id} → ${result.status}`);
              }
            });
            
            // Single state update with all results
            console.log('💾 Updating testCaseResults state with GitHub artifacts...');
            setTestCaseResults(processedResults);
            
            // ADDED: Update DataStore with GitHub artifact results including enhanced failure data
            console.log('📀 Updating DataStore with GitHub artifact results...');
            actionResults.forEach(result => {
              if (result.id) {
                const processedResult = processedResults.get(result.id);
                const currentTestCases = dataStore.getTestCases();
                const testCaseObj = currentTestCases.find(tc => tc.id === result.id);
                if (testCaseObj) {
                  dataStore.updateTestCase(result.id, {
                    ...testCaseObj,
                    status: result.status,
                    lastRun: new Date().toISOString(),
                    lastExecuted: result.status !== 'Not Started' ? new Date().toISOString() : testCaseObj.lastExecuted,
                    executionTime: result.duration || 0,
                    // Store enhanced failure data
                    failure: processedResult?.failure,
                    execution: result.execution,
                    logs: result.logs,
                    rawOutput: result.rawOutput
                  });
                  console.log(`📀 DataStore updated for ${result.id}: ${result.status}`);
                }
              }
            });
            
          } catch (resultsError) {
            console.error('❌ Error getting workflow results:', resultsError);
            setError(`Tests completed but results could not be retrieved: ${resultsError.message}`);
            setIsRunning(false);
            setWaitingForWebhook(false);
            waitingForWebhookRef.current = false;
            setProcessingStatus('error');
          }
          
        } else if (pollCount >= maxPolls) {
          clearInterval(interval);
          setPollInterval(null);
          setError(`Workflow timeout after ${(maxPolls * 2) / 60} minutes`);
          setIsRunning(false);
          setWaitingForWebhook(false);
          waitingForWebhookRef.current = false;
          setProcessingStatus('error');
        }

      } catch (pollError) {
        console.error(`❌ Poll #${pollCount} failed:`, pollError);
        
        if (pollCount >= maxPolls) {
          clearInterval(interval);
          setPollInterval(null);
          setError(`Polling failed after ${pollCount} attempts`);
          setIsRunning(false);
          setWaitingForWebhook(false);
          waitingForWebhookRef.current = false;
          setProcessingStatus('error');
        }
      }
    }, 2000);

    setPollInterval(interval);
  }; 

  // Generate simulated error output for testing
  const generateSimulatedError = (failureType) => {
    const errorTemplates = {
      'ElementNotInteractableException': `
        FAILED: Test Execution
        ElementNotInteractableException: element click intercepted: Element <button id="submit-btn" class="btn-primary">...</button> is not clickable at point (123, 456). Other element would receive the click: <div class="overlay">...</div>
        at clickElement (selenium-utils.js:45:12)
        at TestRunner.executeStep (test-runner.js:234:8)
      `,
      'TimeoutException': `
        FAILED: Test Execution
        TimeoutException: Timed out after 30 seconds waiting for element to be clickable
        Expected: element to be clickable within 30 seconds
        Actual: element remained disabled
        at waitForClickable (selenium-utils.js:78:12)
        at TestRunner.waitAndClick (test-runner.js:156:8)
      `,
      'AssertionError': `
        FAILED: Test Execution
        AssertionError: Expected element text to contain 'Success'
        Expected: text containing 'Success'
        Actual: 'Error: Invalid input provided'
        at assertElementText (test-assertions.js:23:8)
        at TestRunner.verifyResult (test-runner.js:289:12)
      `,
      'NoSuchElementException': `
        FAILED: Test Execution
        NoSuchElementException: Unable to locate element: {"method":"css selector","selector":"#user-profile"}
        at findElement (selenium-utils.js:12:8)
        at TestRunner.clickElement (test-runner.js:145:8)
      `,
      'JavascriptException': `
        FAILED: Test Execution
        JavascriptException: javascript error: Cannot read property 'click' of null
        at executeScript (selenium-utils.js:91:12)
        at TestRunner.executeCustomScript (test-runner.js:367:8)
      `
    };
    
    return errorTemplates[failureType] || errorTemplates['AssertionError'];
  };

  // Execute tests with enhanced failure data simulation
  const executeTests = async () => {
    console.log("🐙 Starting GitHub execution");
    
    try {
      setIsRunning(true);
      setWaitingForWebhook(true);
      waitingForWebhookRef.current = true;
      setError(null);
      setProcessingStatus('starting');

      // FIXED: Set expected test cases immediately when starting execution
      const testCaseIds = testCases.map(tc => tc.id);
      setExpectedTestCases(testCaseIds);
      console.log(`📊 Set expected test cases: ${testCaseIds.length}`, testCaseIds);

      const [owner, repo] = config.repoUrl.replace('https://github.com/', '').split('/');

      // Generate unique request ID
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      setCurrentRequestId(requestId);

      const payload = {
        requirementId: requirement?.id || `bulk_req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        requirementName: requirement?.name || 'Bulk Test Execution',
        testCases: testCases.map(tc => tc.id),
        callbackUrl: config.callbackUrl,
        requestId: requestId
      };

      console.log('📋 Payload for workflow:', payload);

      // Check for simulated results
      const useSimulatedResults = !config.repoUrl || 
                                config.repoUrl.includes('example') ||
                                (!hasBackendSupport && config.callbackUrl.includes('webhook.site'));

      if (useSimulatedResults) {
        console.log('🎭 Using simulated results with enhanced failure data');
        setWaitingForWebhook(true);
        waitingForWebhookRef.current = true;

        // Simulate individual test case updates with enhanced failure data
        const timeout = setTimeout(() => {
          console.log('⏰ Starting simulated execution');
          
          testCases.forEach((tc, index) => {
            setTimeout(() => {
              // Simulate "Running" status
              setTestCaseResults(prev => {
                const updated = new Map(prev);
                updated.set(tc.id, {
                  id: tc.id,
                  name: tc.name,
                  status: 'Running',
                  duration: 0,
                  logs: `Test ${tc.id} is running...`,
                  rawOutput: '',
                  receivedAt: new Date().toISOString(),
                  failure: null,
                  execution: null
                });
                return updated;
              });

              // After 2 seconds, send final result with enhanced failure data
              setTimeout(() => {
                const isFailure = Math.random() > 0.7; // 30% failure rate
                const finalStatus = isFailure ? 'Failed' : 'Passed';
                
                const failureTypes = [
                  'ElementNotInteractableException',
                  'TimeoutException', 
                  'AssertionError',
                  'NoSuchElementException',
                  'JavascriptException'
                ];
                const failureType = failureTypes[Math.floor(Math.random() * failureTypes.length)];
                
                let enhancedResult = {
                  id: tc.id,
                  name: tc.name,
                  status: finalStatus,
                  duration: Math.floor(Math.random() * 5000) + 1000,
                  logs: isFailure ? 
                    `FAILED: ${tc.name}\nTest execution encountered an error` :
                    `PASSED: ${tc.name}\nTest executed successfully`,
                  rawOutput: isFailure ? generateSimulatedError(failureType) : `PASSED: ${tc.name}\nTest executed successfully`,
                  receivedAt: new Date().toISOString(),
                  failure: null,
                  execution: null
                };

                // Add enhanced failure data for failed tests (simulated JUnit XML parsing)
                if (isFailure) {
                  enhancedResult.failure = {
                    type: failureType,
                    message: `Simulated ${failureType} failure`,
                    category: failureType.includes('Element') ? 'element' :
                             failureType.includes('Timeout') ? 'timeout' :
                             failureType.includes('Assertion') ? 'assertion' :
                             failureType.includes('Javascript') ? 'script' : 'general',
                    parsingSource: 'junit-xml',
                    parsingConfidence: 'high',
                    file: `test-${tc.id}.spec.js`,
                    line: Math.floor(Math.random() * 100) + 10,
                    classname: `TestClass_${tc.id}`,
                    method: `test_${tc.id.replace(/-/g, '_')}`,
                    // Add assertion details for assertion errors
                    ...(failureType === 'AssertionError' && {
                      assertion: {
                        available: true,
                        expected: 'Success',
                        actual: 'Error: Invalid input provided',
                        operator: 'contains'
                      }
                    })
                  };
                  
                  enhancedResult.execution = {
                    totalTime: enhancedResult.duration / 1000,
                    framework: 'selenium-junit',
                    version: '4.15.0'
                  };
                }

                setTestCaseResults(prev => {
                  const updated = new Map(prev);
                  updated.set(tc.id, enhancedResult);
                  return updated;
                });

                console.log(`🎭 Simulated result for ${tc.id}: ${finalStatus}`);
              }, 2000);
              
            }, index * 1000); // Stagger the start of each test
          });
        }, 2000);

        setWebhookTimeout(timeout);
        return;
      }

      // Trigger real GitHub Actions workflow
      const run = await GitHubService.triggerWorkflow(
        owner, repo, config.workflowId, config.branch, config.ghToken, payload
      );
      
      setWorkflowRun(run);
      setWaitingForWebhook(true);
      
      console.log(`✅ Workflow triggered: ${run.id}`);
      console.log(`⏳ Waiting for webhook at: ${config.callbackUrl}`);
      console.log(`📝 Request ID: ${requestId}`);
      
      // Set webhook timeout
      const webhookTimeoutDuration = hasBackendSupport ? 120000 : 30000; // 2 min vs 30 sec
      
      const timeout = setTimeout(async () => {
        console.log("Webhook timeout reached for request:", requestId);
        
        if (hasBackendSupport && webhookService) {
          try {
            console.log("🔄 Polling backend for specific request results");
            const polledResults = await webhookService.fetchResultsByRequestId(requestId);
            
            if (polledResults) {
              console.log("✅ Found results via polling");
              return;
            }
          } catch (pollError) {
            console.error("Backend polling failed:", pollError);
          }
        }
        
        // Fallback to GitHub API polling
        console.log("Falling back to GitHub API polling");
        checkGitHubWorkflowCompletion(owner, repo, run.id, payload);
      }, webhookTimeoutDuration);

      setWebhookTimeout(timeout);

    } catch (error) {
      console.error("❌ GitHub execution failed:", error);
      setError(`Failed to execute tests: ${error.message}`);
      setIsRunning(false);
      setWaitingForWebhook(false);
      waitingForWebhookRef.current = false;
      setProcessingStatus('error');
    }
  };

  // Cancel execution
  const cancelExecution = () => {
    console.log("⛔ Cancelling test execution");
    
    setIsRunning(false);
    setWaitingForWebhook(false);
    waitingForWebhookRef.current = false;
    setExecutionStatus('cancelled');
    setProcessingStatus('cancelled');
    
    // Clear any active polling or timeouts
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
    if (webhookTimeout) {
      clearTimeout(webhookTimeout);
      setWebhookTimeout(null);
    }

    // Mark all running tests as cancelled
    setTestCaseResults(prev => {
      const updated = new Map(prev);
      prev.forEach((result, id) => {
        if (result.status === 'Running' || result.status === 'Not Started') {
          updated.set(id, {
            ...result,
            status: 'Cancelled',
            logs: result.logs + '\n[CANCELLED] Test execution was cancelled by user',
            receivedAt: new Date().toISOString()
          });
        }
      });
      return updated;
    });
  };

  // Get test execution summary
  const testResultsArray = Array.from(testCaseResults.values());
  const runningTests = testResultsArray.filter(r => r.status === 'Running').length;
  const totalDuration = testResultsArray.reduce((sum, r) => sum + (r.duration || 0), 0);

  // Get priority color for test case
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Helper function to get status icon
  const getStatusIcon = (status) => {
    const iconProps = { size: 16, className: "inline" };

    switch (status) {
      case 'Passed':
        return <CheckCircle {...iconProps} className="text-green-500" />;
      case 'Failed':
        return <XCircle {...iconProps} className="text-red-500" />;
      case 'Not Found':
        return <AlertCircle {...iconProps} className="text-orange-500" />;
      case 'Running':
        return <Loader2 {...iconProps} className="text-blue-500 animate-spin" />;
      case 'Not Started':
        return <Clock {...iconProps} className="text-gray-400" />;
      case 'Cancelled':
        return <XCircle {...iconProps} className="text-orange-500" />;
      default:
        return <Clock {...iconProps} className="text-gray-400" />;
    }
  };

  // Helper function for input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  // Modal backdrop click handler
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isRunning && !waitingForWebhook) {
      onClose();
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  const completedStatuses = ['Passed', 'Failed', 'Cancelled', 'Skipped', 'Not Run'];
  const completedTests = testResultsArray.filter(r => completedStatuses.includes(r.status)).length;
  const isExecuting = isRunning || waitingForWebhook;
  const isWaiting = waitingForWebhook && !runningTests;

  return (
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      onClick={handleBackdropClick}
    >
      <div 
        className="relative top-20 mx-auto border w-11/12 max-w-4xl shadow-lg rounded-md bg-white flex flex-col" 
        style={{ height: 'calc(100vh - 160px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="mt-3">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {requirement ? `Execute Tests: ${requirement.name}` : 'Bulk Test Execution'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {testCases.length} test case{testCases.length !== 1 ? 's' : ''} selected
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {/* Backend Status Indicator */}
                <div className="flex items-center space-x-1 text-xs">
                  {backendStatus === 'checking' && <Loader2 className="text-gray-400 animate-spin" size={14} />}
                  {backendStatus === 'available' && <Wifi className="text-green-500" size={14} />}
                  {backendStatus === 'unavailable' && <WifiOff className="text-orange-500" size={14} />}
                  <span className="text-gray-600">
                    {backendStatus === 'checking' ? 'Checking...' : 
                     backendStatus === 'available' ? 'Backend Available' : 'Using Fallback'}
                  </span>
                </div>

                {/* Settings Button */}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 flex items-center text-sm"
                  disabled={isExecuting}
                >
                  <Settings className="mr-1" size={14} />
                  {showSettings ? 'Hide' : 'Settings'}
                </button>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  disabled={isExecuting}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded">
                <h4 className="font-medium text-gray-900 mb-3">GitHub Configuration</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Repository URL
                    </label>
                    <input
                      type="text"
                      name="repoUrl"
                      value={config.repoUrl}
                      onChange={handleInputChange}
                      placeholder="https://github.com/owner/repo"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Branch
                      </label>
                      <input
                        type="text"
                        name="branch"
                        value={config.branch}
                        onChange={handleInputChange}
                        placeholder="main"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Workflow ID
                      </label>
                      <input
                        type="text"
                        name="workflowId"
                        value={config.workflowId}
                        onChange={handleInputChange}
                        placeholder="quality-tracker-tests-ind.yml"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GitHub Token
                    </label>
                    <input
                      type="password"
                      name="ghToken"
                      value={config.ghToken}
                      onChange={handleInputChange}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Callback URL
                    </label>
                    <input
                      type="text"
                      name="callbackUrl"
                      value={config.callbackUrl}
                      onChange={handleInputChange}
                      placeholder="http://localhost:3001/api/webhook/test-results"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    onClick={saveConfiguration}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Save className="mr-2" size={14} />
                    Save Configuration
                  </button>
                </div>
              </div>
            )}

            {/* GitHub Workflow Status */}
            {workflowRun && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <GitBranch className="text-blue-600 mr-2" size={16} />
                    <div>
                      <p className="text-blue-800 font-medium">GitHub Workflow Triggered</p>
                      <p className="text-blue-600 text-sm">Run ID: {workflowRun.id}</p>
                    </div>
                  </div>
                  <a
                    href={workflowRun.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center"
                  >
                    <GitBranch className="mr-1" size={14} />
                    View on GitHub
                  </a>
                </div>
                {runningTests > 0 && (
                  <div className="mt-2 text-green-600 text-sm">
                    🏃 {runningTests} test{runningTests !== 1 ? 's' : ''} currently running
                  </div>
                )}
              </div>
            )}

            {/* Execution Controls */}
            <div className="mb-4 flex items-center justify-center space-x-3">
              {!isExecuting && (
                <button
                  onClick={executeTests}
                  disabled={!config.repoUrl || !config.ghToken}
                  className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <Play className="mr-2" size={16} />
                  Execute Tests
                </button>
              )}

              {isExecuting && (
                <button
                  onClick={cancelExecution}
                  className="inline-flex items-center px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <Pause className="mr-2" size={16} />
                  Cancel Execution
                </button>
              )}
            </div>

            {/* Progress bar */}
            {(isWaiting || isRunning || runningTests > 0) && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>
                    {isWaiting && runningTests === 0 ?
                      (hasBackendSupport ?
                        'Waiting for test results (up to 2 minutes)...' :
                        'Waiting for test results (up to 30 seconds)...') :
                      (runningTests > 0 ? 
                        `${runningTests} test${runningTests !== 1 ? 's' : ''} running...` :
                        `Progress: ${completedTests}/${expectedTestCases.length} completed`)
                    }
                  </span>
                  <span>
                    {isWaiting && runningTests === 0 ? 'GitHub Actions' :
                     runningTests > 0 ? 'Running Tests' :
                     `${Math.round((completedTests / expectedTestCases.length) * 100)}%`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isWaiting && runningTests === 0 ? 'bg-blue-600 animate-pulse' :
                      runningTests > 0 ? 'bg-yellow-500 animate-pulse' : 'bg-green-600'
                    }`}
                    style={{
                      width: isWaiting && runningTests === 0 ? '100%' : 
                             `${Math.max(10, (completedTests / expectedTestCases.length) * 100)}%`
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <div className="flex items-center">
                  <AlertTriangle className="text-red-600 mr-2" size={16} />
                  <span className="text-red-800 text-sm font-medium">Error</span>
                </div>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            )}

            {/* Processing Status */}
            {processingStatus && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-center">
                  {processingStatus === 'completed' ? (
                    <Check className="text-green-600 mr-2" size={16} />
                  ) : processingStatus === 'cancelled' ? (
                    <X className="text-orange-500 mr-2" size={16} />
                  ) : (
                    <Loader2 className="text-blue-600 mr-2 animate-spin" size={16} />
                  )}
                  <span className="text-blue-800 text-sm font-medium">
                    {processingStatus === 'starting' ? 'Starting test execution...' :
                     processingStatus === 'waiting' ? 'Waiting for test results...' :
                     processingStatus === 'polling' ? 'Polling GitHub API for workflow completion...' :
                     processingStatus === 'running' ? 'Test cases in progress...' :
                     processingStatus === 'completed' ? 'All test cases completed' :
                     processingStatus === 'cancelled' ? 'Execution cancelled' :
                     'Processing...'}
                  </span>
                </div>
              </div>
            )}

            {/* Simplified Execution Summary */}
            {testResultsArray.length > 0 && (
              <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
                <div className="text-sm text-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Execution Summary:</span>
                    <span className="text-xs text-gray-500">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="flex items-center">
                      <Clock className="text-gray-400 mr-1" size={12} />
                      <span>Not Started: {testResultsArray.filter(r => r.status === 'Not Started').length}</span>
                    </div>
                    <div className="flex items-center">
                      <Loader2 className="text-blue-500 mr-1" size={12} />
                      <span>Running: {runningTests}</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="text-green-500 mr-1" size={12} />
                      <span>Passed: {testResultsArray.filter(r => r.status === 'Passed').length}</span>
                    </div>
                    <div className="flex items-center">
                      <XCircle className="text-red-500 mr-1" size={12} />
                      <span>Failed: {testResultsArray.filter(r => r.status === 'Failed').length}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Test Results Table */}
            <div className="border border-gray-200 rounded overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Test ID
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {testResultsArray.map((result) => {
                    const isRunning = result.status === 'Running';
                    const isFailed = result.status === 'Failed';
                    const originalTestCase = testCases.find(tc => tc.id === result.id);
                    
                    return (
                      <tr 
                        key={result.id} 
                        className={`
                          ${isRunning ? 'bg-yellow-50' : ''}
                          ${isFailed ? 'bg-red-50' : ''}
                          transition-colors duration-200
                        `}
                      >
                        <td className="px-4 py-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-medium text-gray-900">{result.id}</span>
                            {isFailed && result.failure && (
                              <span className="text-lg" title={result.failure.type}>
                                {getFailureTypeIcon(result)}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-xs mt-1">
                            {result.name}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <div className="flex items-center">
                            {getStatusIcon(result.status)}
                            <span className="ml-2">{result.status}</span>
                          </div>
                          {/* Error message with truncation */}
                          {isFailed && result.failure && (
                            <div className="text-xs text-red-600 mt-1 truncate max-w-xs">
                              {getQuickInsight(result)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(originalTestCase?.priority)}`}>
                            {originalTestCase?.priority || 'Medium'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {result.duration > 0 ? (
                            result.duration > 1000 ? 
                              `${Math.round(result.duration / 1000)}s` : 
                              `${result.duration}ms`
                          ) : result.status === 'Running' ? '⏱️' : '-'}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {isFailed && (
                            <button
                              onClick={() => openFailureAnalysis(result)}
                              className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                            >
                              <Bug size={12} />
                              <span>Analyze</span>
                            </button>
                          )}
                          {result.status === 'Passed' && (
                            <button
                              onClick={() => openFailureAnalysis(result)}
                              className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                              <Eye size={12} />
                              <span>View</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Fixed Footer Buttons */}
        <div className="border-t bg-white p-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {isExecuting ? 'Test execution in progress...' :
               isWaiting ? 'Waiting for test results...' :
               completedTests === expectedTestCases.length ? 'All test cases completed' : 
               'Ready to execute'}
              {testResultsArray.length > 0 && totalDuration > 0 && (
                <span className="ml-4">
                  Total Duration: {totalDuration > 1000 ? `${Math.round(totalDuration / 1000)}s` : `${totalDuration}ms`}
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={isExecuting}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExecuting ? 'Running...' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Failure Analysis Modal */}
      <FailureAnalysisModal
        testResult={selectedFailure}
        isOpen={showFailurePanel}
        onClose={closeFailureAnalysis}
      />
    </div>
  );
};

export default TestExecutionModal;
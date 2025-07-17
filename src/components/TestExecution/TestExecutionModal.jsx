// src/components/TestExecution/TestExecutionModal.jsx - Enhanced with Failure Analysis
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
// ADD this import after your existing imports:
import errorParserService from '../../services/ErrorParserService';

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

  // PHASE 1: Add parsing statistics tracking
  const [parsingStats, setParsingStats] = useState({
    attempted: 0,
    successful: 0,
    successRate: 0
  });

  
// ENHANCED: Failure helper functions - Replace around lines 107-145
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

const getParsingConfidenceIndicator = (result) => {
  if (!result.failure) return null;
  
  const confidence = result.failure.parsingConfidence || 'none';
  const source = result.failure.source || 'unknown';
  
  const indicators = {
    'high': { color: 'text-green-600', text: 'High', icon: '✅' },
    'medium': { color: 'text-yellow-600', text: 'Medium', icon: '⚠️' },
    'low': { color: 'text-red-600', text: 'Low', icon: '❌' },
    'none': { color: 'text-gray-400', text: 'None', icon: '❓' }
  };
  
  const indicator = indicators[confidence] || indicators['none'];
  
  return {
    ...indicator,
    source: source,
    tooltip: `Parsing: ${confidence} confidence (${source})`
  };
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

  // ENHANCED: handleTestCaseUpdate method - Replace the existing one around line 193
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
      hasJUnitFailure: !!testCase.failure,
      junitParsingSource: testCase.failure?.parsingSource,
      junitParsingConfidence: testCase.failure?.parsingConfidence,
      hasRawOutput: !!testCase.rawOutput
    });

    // ✅ ENHANCED: Prioritize JUnit XML data over raw parsing
    let enhancedFailure = null;
    
    if (testCase.status === 'Failed') {
      // Priority 1: Use JUnit XML parsed data (from enhanced workflow)
      if (testCase.failure && testCase.failure.parsingSource === 'junit-xml') {
        console.log(`✅ Using JUnit XML parsed data for ${testCaseId}: ${testCase.failure.parsingConfidence} confidence`);
        enhancedFailure = {
          ...testCase.failure,
          source: 'junit-xml-workflow',
          enhanced: true
        };
      }
      // Priority 2: Use any other pre-parsed failure data
      else if (testCase.failure && testCase.failure.parsingConfidence === 'high') {
        console.log(`✅ Using pre-parsed failure data for ${testCaseId}: ${testCase.failure.parsingConfidence} confidence`);
        enhancedFailure = {
          ...testCase.failure,
          source: 'pre-parsed',
          enhanced: true
        };
      }
      // Priority 3: Fallback to raw output parsing (only if no JUnit XML data)
      else if (testCase.rawOutput) {
        try {
          console.log(`🔍 Fallback to raw parsing for ${testCaseId} (no JUnit XML data available)`);
          const parsed = errorParserService.parseError(testCase.rawOutput, testCaseId);
          
          if (parsed && parsed.parsingConfidence !== 'low') {
            enhancedFailure = {
              ...testCase.failure, // Keep any existing data
              ...parsed,           // Add raw parser results
              source: 'raw-output-fallback',
              enhanced: true
            };
            console.log(`✅ Raw parsing successful for ${testCaseId}: ${parsed.parsingConfidence} confidence`);
          } else {
            console.log(`⚠️ Low confidence raw parsing for ${testCaseId}`);
            enhancedFailure = testCase.failure; // Keep original if any
          }
        } catch (parseError) {
          console.warn(`❌ Raw parsing failed for ${testCaseId}:`, parseError.message);
          enhancedFailure = testCase.failure; // Keep original if any
        }
      }
      // Priority 4: Use original failure data if available
      else if (testCase.failure) {
        console.log(`📋 Using original failure data for ${testCaseId}`);
        enhancedFailure = testCase.failure;
      }
      // Priority 5: Create minimal failure object
      else {
        console.log(`📝 Creating minimal failure object for ${testCaseId}`);
        enhancedFailure = {
          type: 'TestFailure',
          message: 'Test execution failed',
          file: '',
          line: 0,
          rawError: (testCase.rawOutput || testCase.logs || '').substring(0, 500),
          source: 'minimal-fallback',
          parsingConfidence: 'none',
          category: 'general'
        };
      }
    }
    
    // Update specific test case with enhanced failure data
    setTestCaseResults(prev => {
      const updated = new Map(prev);
      const existingResult = prev.get(testCaseId);
      
      const enhancedResult = {
        id: testCaseId,
        name: existingResult?.name || testCase.name || `Test ${testCaseId}`,
        status: testCase.status,
        duration: testCase.duration || 0,
        logs: testCase.logs || '',
        rawOutput: testCase.rawOutput || '',
        receivedAt: new Date().toISOString(),
        
        // ✅ Enhanced failure data with priority system
        failure: enhancedFailure,
        execution: testCase.execution,
        framework: testCase.framework,
        
        // ✅ Add metadata about parsing
        parsingSource: enhancedFailure?.source || 'none',
        parsingConfidence: enhancedFailure?.parsingConfidence || 'none',
        
        // ✅ Add file/line info if available from JUnit XML
        file: testCase.file || enhancedFailure?.file,
        line: testCase.line || enhancedFailure?.line,
        classname: testCase.classname,
        method: testCase.method
      };
      
      updated.set(testCaseId, enhancedResult);
      console.log(`📝 Enhanced test case ${testCaseId}: ${testCase.status} (source: ${enhancedFailure?.source || 'none'})`);
      return updated;
    });

    // ✅ ENHANCED: Update parsing statistics with JUnit XML priority
    if (testCase.status === 'Failed') {
      setParsingStats(prev => {
        const attempted = prev.attempted + 1;
        const isSuccessful = enhancedFailure?.parsingConfidence === 'high' || 
                           enhancedFailure?.source === 'junit-xml-workflow';
        const successful = prev.successful + (isSuccessful ? 1 : 0);
        
        return {
          attempted,
          successful,
          successRate: attempted > 0 ? (successful / attempted) * 100 : 0
        };
      });
    }

    // Update DataStore with enhanced failure data
    const currentTestCases = dataStore.getTestCases();
    const testCaseObj = currentTestCases.find(tc => tc.id === testCaseId);
    if (testCaseObj) {
      dataStore.updateTestCase(testCaseId, {
        ...testCaseObj,
        status: testCase.status,
        lastRun: new Date().toISOString(),
        lastExecuted: testCase.status !== 'Not Started' ? new Date().toISOString() : testCaseObj.lastExecuted,
        executionTime: testCase.duration || 0,
        
        // ✅ Store enhanced failure data in DataStore
        failure: enhancedFailure,
        execution: testCase.execution,
        framework: testCase.framework,
        logs: testCase.logs,
        rawOutput: testCase.rawOutput,
        
        // ✅ Store parsing metadata
        parsingSource: enhancedFailure?.source,
        parsingConfidence: enhancedFailure?.parsingConfidence
      });
      console.log(`📀 DataStore updated for ${testCaseId} with enhanced data (source: ${enhancedFailure?.source})`);
    }

  } else if (type === 'existing-results' && allResults) {
    console.log(`📦 Processing ${allResults.length} existing test case results with enhanced priority system`);
    
    setTestCaseResults(prev => {
      const updated = new Map(prev);
      allResults.forEach(result => {
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
            
            // ✅ Include enhanced failure data with metadata
            failure: result.failure,
            execution: result.execution,
            framework: result.framework,
            parsingSource: result.failure?.source || 'none',
            parsingConfidence: result.failure?.parsingConfidence || 'none'
          });
        }
      });
      return updated;
    });
  }

  // Refresh quality gates
  try {
    refreshQualityGates(dataStore);
  } catch (error) {
    console.warn('Error refreshing quality gates:', error);
  }
}, []); // EMPTY DEPENDENCIES to prevent recreation

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
            rawOutput: '', // PHASE 1: Initialize raw output
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
        // Reset parsing stats on new execution
        setParsingStats({ attempted: 0, successful: 0, successRate: 0 });
        
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
                  rawOutput: result.rawOutput || '', // PHASE 1: Store raw output
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
          
          // Process results with enhanced failure data
          const processedResults = new Map(testCaseResults);
          
          actionResults.forEach(result => {
            if (result.id) {
              const existingResult = processedResults.get(result.id);
              
              // PHASE 1: Add generic parsing for failed tests from artifacts
              let enhancedFailure = result.failure; // Keep existing failure if present
              
              if (result.status === 'Failed' && result.rawOutput) {
                try {
                  console.log(`🔍 Attempting generic parsing for ${result.id} from artifacts`);
                  const parsed = errorParserService.parseError(result.rawOutput, result.id);
                  
                  if (parsed && parsed.parsingConfidence !== 'low') {
                    enhancedFailure = {
                      ...result.failure, // Keep existing workflow data
                      ...parsed,         // Add generic parser results
                      source: 'generic-parser',
                      enhanced: true
                    };
                    console.log(`✅ Generic parsing successful for ${result.id}: ${parsed.parsingConfidence} confidence`);
                  } else {
                    console.log(`⚠️ Low confidence parsing for ${result.id}, keeping existing failure`);
                  }
                } catch (parseError) {
                  console.warn(`❌ Generic parsing failed for ${result.id}:`, parseError.message);
                }
              }
              
              // If no existing failure and parsing failed, create simple one
              if (!enhancedFailure && result.status === 'Failed') {
                enhancedFailure = {
                  type: 'TestFailure',
                  phase: 'call',
                  file: '',
                  line: 0,
                  method: '',
                  class: '',
                  rawError: (result.rawOutput || result.logs || '').substring(0, 500),
                  source: 'fallback',
                  parsingConfidence: 'none'
                };
              }
              
              const updatedResult = {
                id: result.id,
                name: existingResult?.name || result.name || `Test ${result.id}`,
                status: result.status,
                duration: result.duration || 0,
                logs: result.logs || '',
                rawOutput: result.rawOutput || '', // PHASE 1: Store raw output
                receivedAt: new Date().toISOString(),
                // Include enhanced failure data from GitHub artifacts
                failure: enhancedFailure,
                execution: result.execution
              };
              
              processedResults.set(result.id, updatedResult);
              console.log(`🔄 Processing GitHub result: ${result.id} → ${result.status}`);
            }
          });
          
          // PHASE 1: Update parsing statistics for artifact results
          actionResults.forEach(result => {
            if (result.status === 'Failed') {
              setParsingStats(prev => {
                const attempted = prev.attempted + 1;
                const enhancedFailure = processedResults.get(result.id)?.failure;
                const successful = prev.successful + (enhancedFailure?.parsingConfidence !== 'low' && enhancedFailure?.parsingConfidence !== 'none' ? 1 : 0);
                return {
                  attempted,
                  successful,
                  successRate: attempted > 0 ? (successful / attempted) * 100 : 0
                };
              });
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
                  rawOutput: result.rawOutput // PHASE 1: Store raw output
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
                  rawOutput: '', // PHASE 1: Store raw output
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
                
                let enhancedResult = {
                  id: tc.id,
                  name: tc.name,
                  status: finalStatus,
                  duration: Math.floor(Math.random() * 5000) + 1000,
                  logs: isFailure ? 
                    `FAILED: ${tc.name}\nTest execution encountered an error` :
                    `PASSED: ${tc.name}\nTest executed successfully`,
                  rawOutput: isFailure ? generateSimulatedError(failureType) : `PASSED: ${tc.name}\nTest executed successfully`, // PHASE 1: Store raw output
                  receivedAt: new Date().toISOString(),
                  failure: null,
                  execution: null
                };

                // Add enhanced failure data for failed tests
                if (isFailure) {
                  const failureTypes = [
                    'ElementNotInteractableException',
                    'TimeoutException', 
                    'AssertionError',
                    'NoSuchElementException'
                  ];
                  
                  const failureType = failureTypes[Math.floor(Math.random() * failureTypes.length)];
                  
                  enhancedResult.failure = {
                    type: failureType,
                    phase: 'call',
                    file: `tests/test_${tc.id.toLowerCase()}.py`,
                    line: Math.floor(Math.random() * 100) + 20,
                    method: `test_${tc.id.toLowerCase()}_functionality`,
                    class: `Test${tc.id}`,
                    rawError: generateSimulatedError(failureType),
                    assertion: {
                      available: false,
                      expression: '',
                      expected: '',
                      actual: '',
                      operator: ''
                    }
                  };
                  
                  enhancedResult.execution = {
                    exitCode: 1,
                    framework: 'pytest',
                    pytestDuration: enhancedResult.duration
                  };
                }
                
                setTestCaseResults(prev => {
                  const updated = new Map(prev);
                  updated.set(tc.id, enhancedResult);
                  return updated;
                });

              }, 2000);

            }, index * 1000); // Stagger test starts
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
      console.log(`✅ Workflow triggered: ${run.id}`);
      console.log(`⏳ Waiting for webhooks at: ${config.callbackUrl}`);

      // Set webhook timeout with enhanced GitHub API polling fallback
      const webhookTimeoutDuration = hasBackendSupport ? 180000 : 60000; // 3 min vs 1 min

      const timeout = setTimeout(async () => {
        console.log('🚨 Webhook timeout reached');
        
        if (!waitingForWebhookRef.current) {
          console.log('⚠️ No longer waiting for webhooks');
          return;
        }

        // Try backend polling first
        if (hasBackendSupport && webhookService) {
          try {
            console.log('🔄 Polling backend for results');
            const polledResults = await webhookService.fetchRequestResults(requestId);
            
            if (polledResults && polledResults.results) {
              console.log(`✅ Found ${polledResults.results.length} test case results via backend polling`);
              
              // Process each test case result with enhanced failure data
              polledResults.results.forEach(result => {
                if (result.testCase) {
                  setTestCaseResults(prev => {
                    const updated = new Map(prev);
                    updated.set(result.testCaseId, {
                      id: result.testCaseId,
                      name: prev.get(result.testCaseId)?.name || result.testCase.name || `Test ${result.testCaseId}`,
                      status: result.testCase.status,
                      duration: result.testCase.duration || 0,
                      logs: result.testCase.logs || '',
                      rawOutput: result.testCase.rawOutput || '', // PHASE 1: Store raw output
                      receivedAt: result.receivedAt,
                      // Include enhanced failure data
                      failure: result.testCase.failure,
                      execution: result.testCase.execution
                    });
                    return updated;
                  });

                  // ADDED: Update DataStore with backend polling results including enhanced data
                  const currentTestCases = dataStore.getTestCases();
                  const testCaseObj = currentTestCases.find(tc => tc.id === result.testCaseId);
                  if (testCaseObj) {
                    dataStore.updateTestCase(result.testCaseId, {
                      ...testCaseObj,
                      status: result.testCase.status,
                      lastRun: new Date().toISOString(),
                      lastExecuted: result.testCase.status !== 'Not Started' ? new Date().toISOString() : testCaseObj.lastExecuted,
                      executionTime: result.testCase.duration || 0,
                      failure: result.testCase.failure,
                      execution: result.testCase.execution,
                      logs: result.testCase.logs,
                      rawOutput: result.testCase.rawOutput // PHASE 1: Store raw output
                    });
                    console.log(`📀 DataStore updated via backend polling for ${result.testCaseId}: ${result.testCase.status}`);
                  }
                }
              });
              
              return;
            }
          } catch (pollError) {
            console.error('❌ Backend polling failed:', pollError);
          }
        }

        // GitHub API polling fallback
        await checkGitHubWorkflowCompletion(owner, repo, run.id, payload);

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

  // Helper function to generate simulated errors
  const generateSimulatedError = (failureType) => {
    switch (failureType) {
      case 'ElementNotInteractableException':
        return 'Element <button id="submit-btn"> is not clickable at point (150, 200). Other element would receive the click: <div class="overlay">';
      case 'TimeoutException':
        return 'Timed out waiting for element to be clickable after 10 seconds. Element locator: #submit-button';
      case 'AssertionError':
        return 'Expected "Welcome, John!" but got "Welcome, Guest!" - user login may have failed';
      case 'NoSuchElementException':
        return 'Unable to locate element with locator: #user-profile-menu. Element may not exist or locator needs updating';
      default:
        return 'Test execution failed with unknown error. Check test implementation and environment.';
    }
  };

  // Cancel execution
  const handleCancel = () => {
    console.log('🛑 Cancelling execution');
    setIsRunning(false);
    setWaitingForWebhook(false);
    waitingForWebhookRef.current = false;
    setProcessingStatus('cancelled');

    if (webhookTimeout) {
      clearTimeout(webhookTimeout);
      setWebhookTimeout(null);
    }

    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
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

  if (!isOpen) return null;

  // Convert Map to Array for rendering
  const testResultsArray = Array.from(testCaseResults.values());
  const completedStatuses = ['Passed', 'Failed', 'Cancelled', 'Skipped', 'Not Run'];
  const completedTests = testResultsArray.filter(r => completedStatuses.includes(r.status)).length;
  const runningTests = testResultsArray.filter(r => r.status === 'Running').length;

  const isExecuting = isRunning || waitingForWebhook;
  const isWaiting = waitingForWebhook && !runningTests;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto border w-11/12 max-w-4xl shadow-lg rounded-md bg-white flex flex-col" style={{ height: 'calc(100vh - 160px)' }}>
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="mt-3">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Run Tests - Enhanced Analysis
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {testCases.length} test case{testCases.length !== 1 ? 's' : ''} selected
                  {requirement && ` for requirement ${requirement.id}`}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 flex items-center text-sm"
                >
                  <Settings className="mr-1" size={14} />
                  {showSettings ? 'Hide' : 'Settings'}
                </button>
              </div>
            </div>

            {/* Backend Status */}
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {backendStatus === 'checking' ? (
                    <Loader2 className="text-gray-500 animate-spin mr-2" size={16} />
                  ) : hasBackendSupport ? (
                    <Wifi className="text-green-600 mr-2" size={16} />
                  ) : (
                    <WifiOff className="text-orange-500 mr-2" size={16} />
                  )}
                  <span className="text-sm font-medium">
                    Backend Status: {backendStatus === 'checking' ? 'Checking...' : hasBackendSupport ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {hasBackendSupport ? 'Enhanced failure analysis enabled' : 'Fallback mode'}
                </div>
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded">
                <h4 className="font-medium text-gray-900 mb-3">Configuration</h4>

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
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Webhook URL
                    </label>
                    <input
                      type="text"
                      name="callbackUrl"
                      value={config.callbackUrl}
                      onChange={handleInputChange}
                      placeholder="http://localhost:3001/api/webhook/test-results"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    onClick={saveConfiguration}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center text-sm"
                  >
                    <Save className="mr-2" size={14} />
                    Save Settings
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
            {!isRunning && !isWaiting && (
              <div className="mb-4 flex justify-center">
                <button
                  onClick={executeTests}
                  disabled={!config.repoUrl || !config.ghToken}
                  className="inline-flex items-center px-6 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="mr-2" size={16} />
                  Run Tests
                </button>
              </div>
            )}

            {/* Progress bar */}
            {(isWaiting || isRunning || runningTests > 0) && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>
                    {isWaiting && runningTests === 0 ?
                      (hasBackendSupport ?
                        'Waiting for test results (up to 3 minutes)...' :
                        'Waiting for test results (up to 1 minute)...') :
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

            {/* Enhanced Execution Summary with JUnit XML statistics */}
{testResultsArray.length > 0 && (
  <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
    <div className="text-sm text-gray-700">
      <div className="flex justify-between items-center">
        <span className="font-medium">Enhanced Execution Summary:</span>
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
      
      {/* ✅ ENHANCED: Parsing statistics with JUnit XML breakdown */}
      {parsingStats.attempted > 0 && (
        <div className="mt-2 text-xs text-gray-600 border-t pt-2">
          <div className="flex items-center justify-between">
            <span>Failure Analysis Success Rate:</span>
            <span className={`font-medium ${
              parsingStats.successRate >= 90 ? 'text-green-600' :
              parsingStats.successRate >= 70 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {parsingStats.successRate.toFixed(1)}%
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {parsingStats.successful}/{parsingStats.attempted} failed tests analyzed successfully
          </div>
          
          {/* ✅ NEW: Show parsing source breakdown */}
          {(() => {
            const failedResults = testResultsArray.filter(r => r.status === 'Failed' && r.failure);
            const junitXmlCount = failedResults.filter(r => r.parsingSource?.includes('junit-xml')).length;
            const rawParsingCount = failedResults.filter(r => r.parsingSource?.includes('raw-output')).length;
            const preParsedCount = failedResults.filter(r => r.parsingSource === 'pre-parsed').length;
            
            if (failedResults.length > 0) {
              return (
                <div className="text-xs text-gray-500 mt-1 space-y-1">
                  {junitXmlCount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        JUnit XML Parsing:
                      </span>
                      <span className="font-medium text-green-600">{junitXmlCount}</span>
                    </div>
                  )}
                  {preParsedCount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                        Pre-parsed Data:
                      </span>
                      <span className="font-medium text-blue-600">{preParsedCount}</span>
                    </div>
                  )}
                  {rawParsingCount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                        Raw Output Parsing:
                      </span>
                      <span className="font-medium text-yellow-600">{rawParsingCount}</span>
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}
      
      {/* ✅ NEW: Show enhanced data availability */}
      {testResultsArray.filter(r => r.status === 'Failed').length > 0 && (
        <div className="mt-2 text-xs text-gray-500 border-t pt-2">
          <div className="flex items-center justify-between">
            <span>Enhanced Analysis Available:</span>
            <span className="font-medium text-blue-600">
              {testResultsArray.filter(r => r.status === 'Failed' && r.failure?.parsingConfidence === 'high').length}/
              {testResultsArray.filter(r => r.status === 'Failed').length} failures
            </span>
          </div>
        </div>
      )}
    </div>
  </div>
)}
            

            {/* Enhanced Test Results Table */}
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
                      Last Run
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
                    const originalTestCase = testCases.find(tc => tc.id === result.id);
                    
                    return (
                      <tr 
                        key={result.id} 
                        className={`
                          ${isRunning ? 'bg-yellow-50' : ''}
                          ${result.status === 'Failed' ? 'bg-red-50' : ''}
                          transition-colors duration-200
                        `}
                      >
                        <td className="px-4 py-2 text-sm font-mono text-gray-900 font-medium">
                          <div className="flex items-center space-x-2">
                            <span>{result.id}</span>
                            {result.status === 'Failed' && result.failure && (
                              <span className="text-lg" title={result.failure.type}>
                                {getFailureTypeIcon(result)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <div className="flex items-center">
                            {getStatusIcon(result.status)}
                            <span className="ml-2">{result.status}</span>
                          </div>
                          {result.status === 'Failed' && result.failure && (
                            <div className="text-xs text-red-600 mt-1">
                              {getQuickInsight(result)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {result.receivedAt ? 
                            new Date(result.receivedAt).toLocaleDateString() :
                            (originalTestCase?.lastExecuted ? 
                              new Date(originalTestCase.lastExecuted).toLocaleDateString() : 
                              'Never')}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            (originalTestCase?.priority || 'Medium') === 'High' ? 'bg-red-50 text-red-600' :
                            (originalTestCase?.priority || 'Medium') === 'Medium' ? 'bg-yellow-50 text-yellow-600' :
                            'bg-gray-50 text-gray-600'
                          }`}>
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
                          {result.status === 'Failed' && (
                            <button
                              onClick={() => openFailureAnalysis(result)}
                              className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                            >
                              <Bug size={12} />
                              <span>Analyze</span>
                            </button>
                          )}
                          {result.status === 'Passed' && (
                            <button
                              onClick={() => openFailureAnalysis(result)}
                              className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
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
            </div>
            <div className="flex space-x-3">
              {isExecuting && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:ring-2 focus:ring-red-500"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={onClose}
                disabled={isExecuting}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Failure Analysis Panel */}
      <FailureAnalysisModal
        testResult={selectedFailure}
        isOpen={showFailurePanel}
        onClose={closeFailureAnalysis}
      />
    </div>
  );
};

export default TestExecutionModal;

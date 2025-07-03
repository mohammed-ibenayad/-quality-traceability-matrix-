// src/components/TestExecution/TestExecutionModal.jsx - Updated for per test case handling
import React, { useState, useEffect, useRef } from 'react';
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
  X
} from 'lucide-react';
import GitHubService from '../../services/GitHubService';
import dataStore from '../../services/DataStore';
import { refreshQualityGates } from '../../utils/calculateQualityGates';
import webhookService from '../../services/WebhookService';

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
      workflowId: 'quality-tracker-tests-ind.yml', // UPDATED: Use per-test-case workflow
      ghToken: '',
      callbackUrl: getCallbackUrl()
    };
    return savedConfig ? { ...defaultConfig, ...JSON.parse(savedConfig) } : defaultConfig;
  });

  // Backend support detection
  const [hasBackendSupport, setHasBackendSupport] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');

  // MODIFIED: Per test case execution state
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [testCaseResults, setTestCaseResults] = useState(new Map()); // testCaseId -> result
  const [executionStatus, setExecutionStatus] = useState(null); // Overall execution status
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

  // Track previous props to detect changes
  const prevProps = useRef({ isOpen: false, testCases: [] });

  // FIXED: Only initialize when modal first opens or test cases change significantly
  useEffect(() => {
    const propsChanged = isOpen !== prevProps.current.isOpen || 
                        JSON.stringify(testCases.map(tc => tc.id)) !== JSON.stringify(prevProps.current.testCases.map(tc => tc.id));
    
    if (isOpen && testCases.length > 0 && propsChanged) {
      console.log('🎭 Initializing test execution modal for per-test-case results');
      
      // Only reset state if we're not in the middle of an execution
      if (!isRunning && !waitingForWebhook) {
        console.log('📋 Resetting modal state - no active execution');
        
        // Initialize test case results map
        const initialResults = new Map();
        testCases.forEach(testCase => {
          initialResults.set(testCase.id, {
            id: testCase.id,
            name: testCase.name,
            status: 'Not Started',
            duration: 0,
            logs: '',
            startTime: null,
            endTime: null,
            receivedAt: null
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
        console.log('✅ Backend webhook service available for per-test-case results');
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

  // FIXED: Fetch existing results when modal opens with a currentRequestId
  useEffect(() => {
    if (isOpen && currentRequestId && hasBackendSupport) {
      console.log(`🔍 Checking for existing results for request: ${currentRequestId}`);
      
      webhookService.getAllTestCaseResults(currentRequestId)
        .then(results => {
          if (results.length > 0) {
            console.log('📦 Found existing results:', results);
            
            // Update state with existing results
            setTestCaseResults(prev => {
              const updated = new Map(prev);
              results.forEach(result => {
                if (result.id) {
                  updated.set(result.id, {
                    id: result.id,
                    name: result.name || `Test ${result.id}`,
                    status: result.status,
                    duration: result.duration || 0,
                    logs: result.logs || '',
                    receivedAt: result.receivedAt
                  });
                }
              });
              return updated;
            });
            
            // Check if execution is already complete
            checkExecutionCompletion();
          } else {
            console.log('📋 No existing results found');
          }
        })
        .catch(error => {
          console.warn('Error fetching existing results:', error);
        });
    }
  }, [isOpen, currentRequestId, hasBackendSupport]);

  // MODIFIED: Set up per-test-case webhook listeners
  useEffect(() => {
    if (!isOpen || !currentRequestId) return;

    console.log(`🎯 Setting up webhook listeners for request: ${currentRequestId}`);

    // MODIFIED: Handle individual test case results
    const handleTestCaseUpdate = (eventData) => {
      console.log('🧪 Individual test case update received:', eventData);
      console.log('🔍 Current request ID:', currentRequestId);
      console.log('🔍 Event request ID:', eventData.requestId);
      
      const { type, requestId, testCaseId, testCase, allResults } = eventData;
      
      // Verify this is for our current execution
      if (requestId !== currentRequestId) {
        console.log('❌ Test case update not for current execution - ignoring');
        return;
      }

      if (type === 'test-case-update' && testCaseId && testCase) {
        // Update specific test case
        setTestCaseResults(prev => {
          const updated = new Map(prev);
          updated.set(testCaseId, {
            id: testCaseId,
            name: testCase.name || `Test ${testCaseId}`,
            status: testCase.status,
            duration: testCase.duration || 0,
            logs: testCase.logs || '',
            receivedAt: new Date().toISOString()
          });
          
          console.log(`📝 Updated test case ${testCaseId}: ${testCase.status}`);
          return updated;
        });

        // Update DataStore
        const testCaseObj = testCases.find(tc => tc.id === testCaseId);
        if (testCaseObj) {
          dataStore.updateTestCase(testCaseId, {
            ...testCaseObj,
            status: testCase.status,
            lastRun: new Date().toISOString(),
            lastExecuted: testCase.status !== 'Not Started' ? new Date().toISOString() : testCaseObj.lastExecuted,
            executionTime: testCase.duration || 0
          });
          console.log(`📀 DataStore updated for ${testCaseId}`);
        }

        // Check if execution is complete
        const completedStatuses = ['Passed', 'Failed', 'Cancelled', 'Skipped', 'Not Run'];
        if (completedStatuses.includes(testCase.status)) {
          checkExecutionCompletion();
        }

      } else if (type === 'existing-results' && allResults) {
        // Handle existing results on subscription
        console.log(`📦 Processing ${allResults.length} existing test case results`);
        
        setTestCaseResults(prev => {
          const updated = new Map(prev);
          allResults.forEach(result => {
            if (result.id) {
              updated.set(result.id, {
                id: result.id,
                name: result.name || `Test ${result.id}`,
                status: result.status,
                duration: result.duration || 0,
                logs: result.logs || '',
                receivedAt: result.receivedAt
              });
            }
          });
          return updated;
        });
        
        checkExecutionCompletion();
      }

      // Refresh quality gates
      try {
        refreshQualityGates(dataStore);
      } catch (error) {
        console.warn('Error refreshing quality gates:', error);
      }
    };

    // Set up webhook listener based on backend support
    if (hasBackendSupport && webhookService) {
      console.log(`🎯 Setting up per-test-case webhook listener for request: ${currentRequestId}`);
      
      // Register execution with expected test cases
      webhookService.registerTestExecution(currentRequestId, expectedTestCases);
      
      // Subscribe to test case updates
      webhookService.subscribeToRequest(currentRequestId, handleTestCaseUpdate);
    } else {
      // Fallback to window-based listener (convert bulk to individual)
      console.log(`🎯 Setting up fallback webhook listener`);
      window.onTestWebhookReceived = (webhookData) => {
        console.log('🔔 Fallback webhook received:', webhookData);
        
        // Convert bulk webhook to individual test case updates
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
    }

    // Cleanup function
    return () => {
      if (hasBackendSupport && webhookService) {
        console.log(`🧹 Cleaning up webhook listener for request: ${currentRequestId}`);
        webhookService.unsubscribeFromRequest(currentRequestId);
      } else {
        window.onTestWebhookReceived = null;
      }
    };
  }, [isOpen, currentRequestId, hasBackendSupport, expectedTestCases, testCases]);

  // MODIFIED: Check if execution is complete
  const checkExecutionCompletion = () => {
    const results = Array.from(testCaseResults.values());
    const completedStatuses = ['Passed', 'Failed', 'Cancelled', 'Skipped', 'Not Run'];
    const completedTests = results.filter(r => completedStatuses.includes(r.status));
    
    console.log(`📊 Execution progress: ${completedTests.length}/${expectedTestCases.length} tests completed`);
    
    if (completedTests.length >= expectedTestCases.length) {
      console.log('🏁 All test cases completed!');
      setWaitingForWebhook(false);
      waitingForWebhookRef.current = false;
      setIsRunning(false);
      setProcessingStatus('completed');
      
      // Clear timeouts
      if (webhookTimeout) {
        clearTimeout(webhookTimeout);
        setWebhookTimeout(null);
      }
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
      
      // Notify completion with all results
      if (onTestComplete) {
        const allResults = results.map(r => ({
          id: r.id,
          name: r.name,
          status: r.status,
          duration: r.duration,
          logs: r.logs
        }));
        onTestComplete(allResults);
      }
    }
  };

  // Save configuration
  const saveConfiguration = () => {
    localStorage.setItem('testRunnerConfig', JSON.stringify(config));
    setShowSettings(false);
    console.log("⚙️ Configuration saved:", config);
  };

  // MODIFIED: Execute tests with per-test-case workflow
  const executeTests = async () => {
    console.log("🐙 Starting per-test-case GitHub execution");
    
    try {
      setIsRunning(true);
      setWaitingForWebhook(true);
      waitingForWebhookRef.current = true;
      setError(null);
      setProcessingStatus('starting');

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

      console.log('📋 Payload for per-test-case workflow:', payload);

      // Check for simulated results
      const useSimulatedResults = !config.repoUrl || 
                                config.repoUrl.includes('example') ||
                                (!hasBackendSupport && config.callbackUrl.includes('webhook.site'));

      if (useSimulatedResults) {
        console.log('🎭 Using simulated per-test-case results');
        setWaitingForWebhook(true);
        waitingForWebhookRef.current = true;

        // Simulate individual test case updates
        const timeout = setTimeout(() => {
          console.log('⏰ Starting simulated per-test-case execution');
          
          testCases.forEach((tc, index) => {
            setTimeout(() => {
              // Simulate "Running" status
              const runningEventData = {
                type: 'test-case-update',
                requestId: requestId,
                testCaseId: tc.id,
                testCase: {
                  id: tc.id,
                  name: tc.name,
                  status: 'Running',
                  duration: 0,
                  logs: `Test ${tc.id} is running...`
                }
              };

              // Handle the update
              setTestCaseResults(prev => {
                const updated = new Map(prev);
                updated.set(tc.id, {
                  id: tc.id,
                  name: tc.name,
                  status: 'Running',
                  duration: 0,
                  logs: `Test ${tc.id} is running...`,
                  receivedAt: new Date().toISOString()
                });
                return updated;
              });

              // After 2 seconds, send final result
              setTimeout(() => {
                const finalStatus = Math.random() > 0.2 ? 'Passed' : 'Failed';
                const finalEventData = {
                  type: 'test-case-update',
                  requestId: requestId,
                  testCaseId: tc.id,
                  testCase: {
                    id: tc.id,
                    name: tc.name,
                    status: finalStatus,
                    duration: Math.floor(Math.random() * 5000) + 1000,
                    logs: `Test ${tc.id} completed with status: ${finalStatus}`
                  }
                };

                setTestCaseResults(prev => {
                  const updated = new Map(prev);
                  updated.set(tc.id, {
                    id: tc.id,
                    name: tc.name,
                    status: finalStatus,
                    duration: Math.floor(Math.random() * 5000) + 1000,
                    logs: `Test ${tc.id} completed with status: ${finalStatus}`,
                    receivedAt: new Date().toISOString()
                  });
                  return updated;
                });

                // Check completion after each test
                setTimeout(() => checkExecutionCompletion(), 100);

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
      console.log(`✅ Per-test-case workflow triggered: ${run.id}`);
      console.log(`⏳ Waiting for individual test case webhooks at: ${config.callbackUrl}`);

      // Set webhook timeout with enhanced GitHub API polling fallback
      const webhookTimeoutDuration = hasBackendSupport ? 180000 : 60000; // 3 min vs 1 min (longer for per-test-case)

      const timeout = setTimeout(async () => {
        console.log('🚨 Per-test-case webhook timeout reached');
        
        if (!waitingForWebhookRef.current) {
          console.log('⚠️ No longer waiting for webhooks');
          return;
        }

        // Try backend polling first
        if (hasBackendSupport && webhookService) {
          try {
            console.log('🔄 Polling backend for per-test-case results');
            const polledResults = await webhookService.fetchRequestResults(requestId);
            
            if (polledResults && polledResults.results) {
              console.log(`✅ Found ${polledResults.results.length} test case results via backend polling`);
              
              // Process each test case result
              polledResults.results.forEach(result => {
                if (result.testCase) {
                  setTestCaseResults(prev => {
                    const updated = new Map(prev);
                    updated.set(result.testCaseId, {
                      id: result.testCaseId,
                      name: result.testCase.name,
                      status: result.testCase.status,
                      duration: result.testCase.duration || 0,
                      logs: result.testCase.logs || '',
                      receivedAt: result.receivedAt
                    });
                    return updated;
                  });
                }
              });
              
              checkExecutionCompletion();
              return;
            }
          } catch (pollError) {
            console.error('❌ Backend polling failed:', pollError);
          }
        }

        // GitHub API polling fallback
        console.log('🔄 Starting GitHub API polling for per-test-case workflow');
        setProcessingStatus('polling');

        let pollCount = 0;
        const maxPolls = 90;

        const interval = setInterval(async () => {
          pollCount++;
          console.log(`🔄 GitHub API Poll #${pollCount}/${maxPolls} for per-test-case workflow ${run.id}`);

          try {
            const status = await GitHubService.getWorkflowStatus(owner, repo, run.id, config.ghToken);
            
            if (status.status === 'completed') {
              console.log('✅ Per-test-case workflow completed');
              
              clearInterval(interval);
              setPollInterval(null);

              try {
                const actionResults = await GitHubService.getWorkflowResults(
                  owner, repo, run.id, config.ghToken, payload
                );
                
                console.log(`📥 Retrieved ${actionResults.length} test results from artifacts`);
                
                // Process results as individual test cases
                actionResults.forEach(result => {
                  if (result.id) {
                    setTestCaseResults(prev => {
                      const updated = new Map(prev);
                      updated.set(result.id, {
                        id: result.id,
                        name: result.name || `Test ${result.id}`,
                        status: result.status,
                        duration: result.duration || 0,
                        logs: result.logs || '',
                        receivedAt: new Date().toISOString()
                      });
                      return updated;
                    });
                  }
                });
                
                checkExecutionCompletion();
                
              } catch (resultsError) {
                console.error('❌ Error getting per-test-case workflow results:', resultsError);
                setError(`Tests completed but results could not be retrieved: ${resultsError.message}`);
                setIsRunning(false);
                setWaitingForWebhook(false);
                waitingForWebhookRef.current = false;
                setProcessingStatus('error');
              }
              
            } else if (pollCount >= maxPolls) {
              clearInterval(interval);
              setPollInterval(null);
              setError(`Per-test-case workflow timeout after ${(maxPolls * 2) / 60} minutes`);
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

      }, webhookTimeoutDuration);

      setWebhookTimeout(timeout);

    } catch (error) {
      console.error("❌ Per-test-case GitHub execution failed:", error);
      setError(`Failed to execute tests: ${error.message}`);
      setIsRunning(false);
      setWaitingForWebhook(false);
      waitingForWebhookRef.current = false;
      setProcessingStatus('error');
    }
  };

  // Cancel execution
  const handleCancel = () => {
    console.log('🛑 Cancelling per-test-case execution');
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
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Per-Test-Case Execution: {requirement?.title || 'Bulk Test Execution'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {testCases.length} test case{testCases.length !== 1 ? 's' : ''} selected
                {requirement && ` for requirement ${requirement.id}`}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                ✨ Individual webhook delivery per test case
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
                {hasBackendSupport ? 'Per-test-case webhook support' : 'Fallback mode (bulk conversion)'}
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

          {/* Current Request ID Display */}
          {currentRequestId && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <GitBranch className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-sm text-blue-800">
                  Request ID: <code className="font-mono">{currentRequestId}</code>
                </span>
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
                    <p className="text-blue-800 font-medium">Per-Test-Case GitHub Workflow Triggered</p>
                    <p className="text-blue-600 text-sm">Run ID: {workflowRun.id}</p>
                    {currentRequestId && (
                      <p className="text-blue-500 text-xs">Request ID: {currentRequestId}</p>
                    )}
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
              {isWaiting && (
                <div className="mt-2 text-blue-600 text-sm">
                  ⏳ {hasBackendSupport ?
                      'Waiting for individual test case webhooks (up to 3 min timeout)...' :
                      'Waiting for individual test case webhooks (up to 1 min timeout)...'}
                </div>
              )}
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
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:ring-2 focus:ring-green-500 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="mr-2" size={16} />
                Start Per-Test-Case Execution
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
                      'Waiting for test case webhooks (up to 3 minutes)...' :
                      'Waiting for test case webhooks (up to 1 minute)...') :
                    (runningTests > 0 ? 
                      `${runningTests} test${runningTests !== 1 ? 's' : ''} running...` :
                      `Progress: ${completedTests}/${expectedTestCases.length} completed`)
                  }
                </span>
                <span>
                  {isWaiting && runningTests === 0 ? 'GitHub Actions' :
                   runningTests > 0 ? 'Individual Tests' :
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
                  {processingStatus === 'starting' ? 'Starting per-test-case execution...' :
                   processingStatus === 'waiting' ? 'Waiting for individual test results...' :
                   processingStatus === 'polling' ? 'Polling GitHub API for workflow completion...' :
                   processingStatus === 'running' ? 'Individual test cases in progress...' :
                   processingStatus === 'completed' ? 'All test cases completed' :
                   processingStatus === 'cancelled' ? 'Execution cancelled' :
                   'Processing...'}
                </span>
              </div>
            </div>
          )}

          {/* Execution Summary */}
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
                    Test Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Update
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {testResultsArray.map((result) => {
                  const isRunning = result.status === 'Running';
                  
                  return (
                    <tr 
                      key={result.id} 
                      className={`
                        ${isRunning ? 'bg-yellow-50' : ''}
                        transition-colors duration-200
                      `}
                    >
                      <td className="px-4 py-2 text-sm font-mono text-gray-600">{result.id}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {result.name}
                        {isRunning && (
                          <span className="ml-2 text-xs text-blue-600 animate-pulse">
                            ⚡ Running...
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <div className="flex items-center">
                          {getStatusIcon(result.status)}
                          <span className="ml-2">{result.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {result.duration > 0 ? `${Math.round(result.duration / 1000)}s` : 
                         result.status === 'Running' ? '⏱️' : '-'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {result.receivedAt ? 
                          new Date(result.receivedAt).toLocaleTimeString() : 
                          '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <div className="text-sm text-gray-600">
              {isExecuting ? 'Per-test-case execution in progress...' :
               isWaiting ? 'Waiting for individual test case results...' :
               completedTests === expectedTestCases.length ? 'All test cases completed' : 
               'Ready to execute'}
            </div>
            <div className="flex space-x-2">
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
    </div>
  );
};

export default TestExecutionModal;
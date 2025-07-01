// src/components/TestExecution/TestExecutionModal.jsx - Revised Version with Targeted Fixes
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
      workflowId: 'quality-tracker-tests.yml',
      ghToken: '',
      callbackUrl: getCallbackUrl()
    };
    return savedConfig ? { ...defaultConfig, ...JSON.parse(savedConfig) } : defaultConfig;
  });

  // Backend support detection
  const [hasBackendSupport, setHasBackendSupport] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');

  // GitHub execution state
  const [isRunning, setIsRunning] = useState(false);
  const [waitingForWebhook, setWaitingForWebhook] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [workflowRun, setWorkflowRun] = useState(null);
  const [currentRequestId, setCurrentRequestId] = useState(null);

  // Added state for polling management
  const [pollInterval, setPollInterval] = useState(null);
  const [webhookTimeout, setWebhookTimeout] = useState(null);

  // Add this with other useState declarations
  const waitingForWebhookRef = useRef(false);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // FIXED: Test results state - respects current test case status
  const [testResults, setTestResults] = useState([]);

  // FIXED: Initialize test results when modal opens - respect current status
  useEffect(() => {
    if (isOpen && testCases.length > 0) {
      const initialResults = testCases.map(testCase => ({
        id: testCase.id,
        name: testCase.name,
        status: testCase.status || 'Not Started', // ✅ Respect current status instead of hardcoding
        duration: testCase.executionTime || 0,
        startTime: null,
        endTime: null
      }));
      setTestResults(initialResults);

      // Reset execution states
      setIsRunning(false);
      setWaitingForWebhook(false);
      waitingForWebhookRef.current = false;
      setResults(null);
      setError(null);
      setProcessingStatus(null);
      setIsProcessing(false);
      setCurrentRequestId(null);

      // Clear intervals and timeouts
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
        console.log("%c🧹 Cleared existing poll interval on modal open", "color: gray;");
      }
      if (webhookTimeout) {
        clearTimeout(webhookTimeout);
        setWebhookTimeout(null);
        console.log("%c🧹 Cleared existing webhook timeout on modal open", "color: gray;");
      }

      console.log('Test execution modal opened for:', requirement ? requirement.id : 'bulk execution');
    }
  }, [isOpen, testCases]);

  // Check backend support
  useEffect(() => {
    const checkBackendSupport = async () => {
      try {
        const response = await fetch('/api/webhook/health', { 
          method: 'GET',
          timeout: 3000 
        });
        
        if (response.ok) {
          setHasBackendSupport(true);
          setBackendStatus('connected');
          console.log("✅ Backend webhook service is available");
        } else {
          throw new Error('Backend not responding');
        }
      } catch (error) {
        setHasBackendSupport(false);
        setBackendStatus('disconnected');
        console.log("❌ Backend webhook service unavailable - using fallback mode");
      }
    };

    if (isOpen) {
      checkBackendSupport();
    }
  }, [isOpen]);

  // Webhook listener setup
  useEffect(() => {
    if (!isOpen || !waitingForWebhook) return;

    const handleWebhookResults = (webhookData) => {
      console.log("🔄 Processing webhook results:", webhookData);
      
      // Validate webhook data
      if (!webhookData?.results || !Array.isArray(webhookData.results)) {
        console.warn("⚠️ Invalid webhook data received");
        return;
      }

      // Process webhook results
      processWebhookResults(webhookData);
    };

    // Set up webhook listener based on backend support
    if (hasBackendSupport && webhookService) {
      console.log(`🎯 Setting up webhook listener for request: ${currentRequestId}`);
      webhookService.subscribeToRequest(currentRequestId, handleWebhookResults);
      if (requirement?.id) {
        webhookService.subscribeToRequirement(requirement.id, handleWebhookResults);
      }
    } else {
      console.log(`🎯 Setting up fallback webhook listener`);
      window.onTestWebhookReceived = handleWebhookResults;
    }

    return () => {
      if (!isOpen) {
        if (hasBackendSupport && webhookService) {
          console.log(`🧹 Cleaning up webhook listeners for request: ${currentRequestId}`);
          webhookService.unsubscribeFromRequest(currentRequestId);
          if (requirement?.id) {
            webhookService.unsubscribeFromRequirement(requirement.id);
          }
        } else {
          console.log(`🧹 Cleaning up fallback webhook listener`);
          window.onTestWebhookReceived = null;
        }

        if (webhookTimeout) {
          clearTimeout(webhookTimeout);
          setWebhookTimeout(null);
        }
        if (pollInterval) {
          clearInterval(pollInterval);
          setPollInterval(null);
        }
      }
    };
  }, [isOpen, currentRequestId, hasBackendSupport, waitingForWebhook]);

  // Save configuration
  const saveConfiguration = () => {
    localStorage.setItem('testRunnerConfig', JSON.stringify(config));
    setShowSettings(false);
    console.log("⚙️ Configuration saved:", config);
  };

  // SIMPLIFIED: Process webhook results with one-by-one updates only
  const processWebhookResults = (webhookData) => {
    console.log("%c🔧 PROCESSING WEBHOOK RESULTS:", "background: #673AB7; color: white; font-weight: bold; padding: 5px 10px;", webhookData);
    
    if (!webhookData?.results || !Array.isArray(webhookData.results)) {
      console.warn("⚠️ Invalid webhook data received");
      return;
    }

    // SIMPLIFIED: Just update results as they come, no complex completion logic
    setResults(webhookData.results);

    // FIXED: Update test results one by one in UI
    setTestResults(prevResults => {
      return prevResults.map(existingResult => {
        const newResult = webhookData.results.find(r => r.id === existingResult.id);
        
        if (newResult) {
          console.log(`📝 Updating ${existingResult.id}: ${existingResult.status} → ${newResult.status}`);
          
          return {
            ...existingResult,
            status: newResult.status,
            duration: typeof newResult.duration === 'number' ? newResult.duration : existingResult.duration,
            logs: newResult.logs || existingResult.logs || ''
          };
        }
        return existingResult;
      });
    });

    // FIXED: Update DataStore one test case at a time
    webhookData.results.forEach(result => {
      const testCase = testCases.find(tc => tc.id === result.id);
      if (testCase) {
        console.log(`📀 Updating DataStore for ${testCase.id}: status=${result.status}`);
        dataStore.updateTestCase(testCase.id, {
          ...testCase,
          status: result.status,
          lastExecuted: new Date().toISOString(),
          executionTime: result.duration || testCase.executionTime || 0
        });
      }
    });

    // Refresh quality gates after updates
    try {
      refreshQualityGates(dataStore);
    } catch (refreshError) {
      console.warn("Error refreshing quality gates:", refreshError);
    }

    console.log("✅ Webhook results processed with individual updates");
  };

  // Execute GitHub workflow (removed simulation logic)
  const executeTestsGitHub = async () => {
    console.log("%c🐙 GITHUB EXECUTION STARTED", "background: #24292E; color: white; font-weight: bold; padding: 8px 15px; border-radius: 5px;");
    
    try {
      setIsRunning(true);
      setWaitingForWebhook(true);
      waitingForWebhookRef.current = true;
      setError(null);
      setProcessingStatus('starting');

      const [owner, repo] = config.repoUrl.replace('https://github.com/', '').split('/');

      // Generate unique request ID for this execution
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      setCurrentRequestId(requestId);

      const payload = {
        requirementId: requirement?.id || `bulk_req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        requirementName: requirement?.name || 'Bulk Test Execution',
        testCases: testCases.map(tc => tc.id),
        callbackUrl: config.callbackUrl,
        requestId: requestId
      };

      console.log(`📋 Generated payload for GitHub workflow:`, payload);

      // Register this request with the webhook service
      if (hasBackendSupport && webhookService) {
        webhookService.registerTestExecution(requirement?.id || payload.requirementId, requestId);
      }

      // Trigger GitHub Actions workflow
      const run = await GitHubService.triggerWorkflow(
        owner, repo, config.workflowId, config.branch, config.ghToken, payload
      );
      
      setWorkflowRun(run);
      setWaitingForWebhook(true);
      waitingForWebhookRef.current = true;
      
      console.log(`✅ Workflow triggered: ${run.id}`);
      console.log(`⏳ Waiting for webhook at: ${config.callbackUrl}`);
      console.log(`📝 Request ID: ${requestId}`);
      
      // Set timeout based on backend availability
      const webhookTimeoutDuration = hasBackendSupport ? 300000 : 180000; // 5min vs 3min
      
      const timeout = setTimeout(() => {
        console.log("%c⏰ WEBHOOK TIMEOUT REACHED", "background: #FF5722; color: white; font-weight: bold; padding: 8px 15px; border-radius: 5px;");
        if (waitingForWebhookRef.current) {
          setError('Webhook timeout - results may still be processing. Check GitHub Actions for status.');
          setWaitingForWebhook(false);
          waitingForWebhookRef.current = false;
          setIsRunning(false);
        }
      }, webhookTimeoutDuration);
      
      setWebhookTimeout(timeout);
      
    } catch (error) {
      console.error('Error executing GitHub workflow:', error);
      setError(error.message);
      setIsRunning(false);
      setWaitingForWebhook(false);
      waitingForWebhookRef.current = false;
    }
  };

  // Handle start execution
  const handleStartExecution = () => {
    if (!config.repoUrl) {
      setError('Please configure GitHub repository URL in settings');
      return;
    }

    if (!config.ghToken) {
      setError('GitHub token is required to trigger workflows');
      return;
    }

    executeTestsGitHub();
  };

  // Handle cancel execution
  const handleCancel = () => {
    console.log("🛑 CANCELLING EXECUTION");
    
    setIsRunning(false);
    setWaitingForWebhook(false);
    waitingForWebhookRef.current = false;
    setProcessingStatus('cancelled');

    if (webhookTimeout) {
      console.log("Clearing webhookTimeout due to cancellation.");
      clearTimeout(webhookTimeout);
      setWebhookTimeout(null);
    }

    if (pollInterval) {
      console.log("Clearing pollInterval due to cancellation.");
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

  // Check execution states
  const isExecuting = isRunning || waitingForWebhook;
  const isWaiting = waitingForWebhook && !isRunning;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Test Execution: {requirement?.title || 'Bulk Test Execution'}
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
                  <Wifi className="text-green-500 mr-2" size={16} />
                ) : (
                  <WifiOff className="text-red-500 mr-2" size={16} />
                )}
                <span className="text-sm font-medium">
                  Backend Status: {backendStatus === 'checking' ? 'Checking...' : 
                                  hasBackendSupport ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {hasBackendSupport ? 'Real-time webhook support available' : 'Using fallback mode'}
              </span>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mb-4 p-4 border border-gray-200 rounded bg-gray-50">
              <h4 className="text-md font-medium mb-3">GitHub Configuration</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Repository URL</label>
                  <input
                    type="text"
                    name="repoUrl"
                    value={config.repoUrl}
                    onChange={handleInputChange}
                    placeholder="https://github.com/owner/repo"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Workflow ID</label>
                  <input
                    type="text"
                    name="workflowId"
                    value={config.workflowId}
                    onChange={handleInputChange}
                    placeholder="quality-tracker-tests.yml"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GitHub Token</label>
                  <input
                    type="password"
                    name="ghToken"
                    value={config.ghToken}
                    onChange={handleInputChange}
                    placeholder="ghp_..."
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={saveConfiguration}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center text-sm"
                >
                  <Save className="mr-1" size={14} />
                  Save Configuration
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mb-4 flex space-x-2">
            {!isExecuting ? (
              <button
                onClick={handleStartExecution}
                disabled={testCases.length === 0}
                className={`px-4 py-2 rounded flex items-center ${
                  testCases.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <Play className="mr-2" size={16} />
                Execute Tests via GitHub Actions
              </button>
            ) : (
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
              >
                <Pause className="mr-2" size={16} />
                Cancel Execution
              </button>
            )}
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <div className="flex items-center">
                <AlertTriangle className="mr-2 text-red-600" size={16} />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Processing Status */}
          {isProcessing && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-center">
                <Loader2 className="animate-spin mr-2 text-blue-600" size={16} />
                <span className="text-blue-700">
                  {processingStatus === 'starting' ? 'Starting execution...' :
                   processingStatus === 'waiting' ? 'Waiting for results...' :
                   processingStatus === 'running' ? 'Tests in progress...' :
                   processingStatus === 'completed' ? 'Execution completed' :
                   processingStatus === 'cancelled' ? 'Execution cancelled' :
                   'Processing...'}
                </span>
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {testResults.map((result, index) => {
                  const isRunning = result.status === 'Running';
                  
                  return (
                    <tr 
                      key={result.id} 
                      className={`${isRunning ? 'bg-yellow-50' : ''} transition-colors duration-200`}
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
                        {result.duration > 0 ? `${result.duration}s` : 
                         result.status === 'Running' ? '⏱️' : '-'}
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
              {isExecuting ? 'Execution in progress...' :
               isWaiting ? 'Waiting for GitHub Actions...' :
               results ? 'Execution completed' : 'Ready to execute'}
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
                disabled={isProcessing}
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
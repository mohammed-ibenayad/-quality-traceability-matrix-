// src/components/TestExecution/TestExecutionModal.jsx - Unified Component
import React, { useState, useEffect } from 'react';
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

  // Execution state
  const [executing, setExecuting] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(-1);
  const [testResults, setTestResults] = useState([]);
  const [executionStarted, setExecutionStarted] = useState(false);
  const [completedTests, setCompletedTests] = useState(0);
  
  // GitHub execution state
  const [isRunning, setIsRunning] = useState(false);
  const [waitingForWebhook, setWaitingForWebhook] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [workflowRun, setWorkflowRun] = useState(null);
  const [currentRequestId, setCurrentRequestId] = useState(null);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [useGitHub, setUseGitHub] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize test results when modal opens
  useEffect(() => {
    if (isOpen && testCases.length > 0) {
      const initialResults = testCases.map(testCase => ({
        id: testCase.id,
        name: testCase.name,
        status: 'Not Started',
        duration: 0,
        startTime: null,
        endTime: null
      }));
      setTestResults(initialResults);

      // Reset all states
      setExecuting(false);
      setCancelled(false);
      setCurrentTestIndex(-1);
      setExecutionStarted(false);
      setCompletedTests(0);
      setIsRunning(false);
      setWaitingForWebhook(false);
      setResults(null);
      setError(null);
      setProcessingStatus(null);
      setIsProcessing(false);

      console.log('Test execution modal opened for:', requirement ? `requirement ${requirement.id}` : 'bulk execution');
      console.log('Test cases to run:', testCases);
    }
  }, [isOpen, testCases, requirement]);

  // Check backend support
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('/api/health');
        setHasBackendSupport(response.ok);
        setBackendStatus(response.ok ? 'connected' : 'disconnected');
      } catch (error) {
        setHasBackendSupport(false);
        setBackendStatus('disconnected');
      }
    };
    
    if (isOpen) {
      checkBackend();
    }
  }, [isOpen]);

  // Save configuration
  const saveConfiguration = () => {
    localStorage.setItem('testRunnerConfig', JSON.stringify(config));
    setShowSettings(false);
  };

  // Execute tests with simulation (original TestCases modal logic)
  const executeTestsSimulation = async () => {
    if (cancelled) return;
    
    setExecuting(true);
    setExecutionStarted(true);
    setCompletedTests(0);

    for (let i = 0; i < testCases.length; i++) {
      if (cancelled) {
        setTestResults(prev => prev.map((result, index) => 
          index >= i ? { ...result, status: 'Cancelled' } : result
        ));
        break;
      }

      setCurrentTestIndex(i);
      
      setTestResults(prev => prev.map((result, index) => 
        index === i ? { ...result, status: 'Running', startTime: new Date() } : result
      ));

      const duration = Math.random() * 3000 + 1000; // 1-4 seconds
      await new Promise(resolve => setTimeout(resolve, duration));

      if (cancelled) break;

      const passed = Math.random() > 0.2;
      const status = passed ? 'Passed' : 'Failed';

      setTestResults(prev => prev.map((result, index) => 
        index === i ? { 
          ...result, 
          status, 
          duration: Math.round(duration / 1000),
          endTime: new Date()
        } : result
      ));

      setCompletedTests(i + 1);
    }

    setExecuting(false);
    setCurrentTestIndex(-1);

    if (!cancelled) {
      // Update DataStore with results
      updateTestStatusesInDataStore(testResults);
      
      setTimeout(() => {
        if (onTestComplete) {
          onTestComplete(testResults);
        }
      }, 1000);
    }
  };

  // Execute tests with GitHub Actions
  const executeTestsGitHub = async () => {
    if (!config.repoUrl || !config.ghToken) {
      setError('GitHub repository URL and token are required');
      return;
    }

    try {
      setIsRunning(true);
      setError(null);
      setResults(null);

      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCurrentRequestId(requestId);

      // Parse GitHub URL
      const match = config.repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        throw new Error('Invalid GitHub repository URL');
      }
      
      const [, owner, repo] = match;

      // Prepare payload
      const testCaseIds = testCases.map(tc => tc.id);
      const payload = {
        requirementId: requirement?.id || `bulk_${requestId}`,
        testCases: testCaseIds,
        callbackUrl: config.callbackUrl,
        requestId: requestId
      };

      console.log('GitHub execution payload:', payload);

      // Check if we should use simulated results
      const useSimulatedResults = config.repoUrl.includes('example') || 
                                  !hasBackendSupport;

      if (useSimulatedResults) {
        console.log('Using simulated GitHub results');
        setWaitingForWebhook(true);
        
        setTimeout(() => {
          const simulatedResults = testCases.map(tc => ({
            id: tc.id,
            name: tc.name,
            status: Math.random() > 0.2 ? 'Passed' : 'Failed',
            duration: Math.floor(Math.random() * 1000) + 100
          }));
          
          handleWebhookResults({
            requirementId: payload.requirementId,
            requestId: requestId,
            timestamp: new Date().toISOString(),
            results: simulatedResults
          });
        }, 5000);
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

      // Set timeout for webhook
      setTimeout(() => {
        if (waitingForWebhook) {
          setError('Timeout waiting for test results');
          setIsRunning(false);
          setWaitingForWebhook(false);
        }
      }, 300000); // 5 minutes

    } catch (error) {
      console.error('Error executing GitHub tests:', error);
      setError(error.message);
      setIsRunning(false);
    }
  };

  // Handle webhook results from GitHub
  const handleWebhookResults = (webhookData) => {
    console.log('Processing webhook results:', webhookData);
    setWaitingForWebhook(false);
    setIsRunning(false);
    
    if (webhookData && webhookData.results && Array.isArray(webhookData.results)) {
      const githubResults = webhookData.results;
      
      // Update DataStore
      updateTestStatusesInDataStore(githubResults);
      
      // Update UI
      setResults(githubResults);
      
      if (onTestComplete) {
        onTestComplete(githubResults);
      }
      
      setCurrentRequestId(null);
    }
  };

  // Update test statuses in DataStore (unified logic)
  const updateTestStatusesInDataStore = (results) => {
    try {
      setProcessingStatus("Updating test statuses...");
      setIsProcessing(true);

      const currentTestCases = dataStore.getTestCases();
      console.log("Current test cases before update:", currentTestCases.map(tc => ({ id: tc.id, status: tc.status })));
      
      const updatedTestCases = currentTestCases.map(tc => {
        const matchingResult = results.find(r => r.id === tc.id);
        
        if (matchingResult) {
          console.log(`Updating test case ${tc.id} status to ${matchingResult.status}`);
          return {
            ...tc,
            status: matchingResult.status,
            lastExecuted: new Date().toISOString(),
            executionTime: matchingResult.duration || 0
          };
        }
        return tc;
      });
      
      // Update DataStore
      dataStore.setTestCases(updatedTestCases);
      console.log("Test cases after update:", updatedTestCases.map(tc => ({ id: tc.id, status: tc.status })));
      
      // Refresh quality gates
      try {
        refreshQualityGates(dataStore);
      } catch (error) {
        console.warn('Error refreshing quality gates:', error);
      }
      
      // Force DataStore notification
      if (typeof dataStore._notifyListeners === 'function') {
        dataStore._notifyListeners();
        
        setTimeout(() => {
          dataStore._notifyListeners();
        }, 100);
      }
      
      setProcessingStatus("Test statuses updated successfully!");
      setIsProcessing(false);
      
    } catch (error) {
      console.error("Error updating test statuses:", error);
      setProcessingStatus(`Error: ${error.message}`);
      setIsProcessing(false);
    }
  };

  // Main execution handler
  const executeTests = () => {
    if (useGitHub) {
      executeTestsGitHub();
    } else {
      executeTestsSimulation();
    }
  };

  const handleCancel = () => {
    setCancelled(true);
    setExecuting(false);
    setIsRunning(false);
    setWaitingForWebhook(false);
    if (onClose) onClose();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Passed':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'Failed':
        return <XCircle className="text-red-500" size={16} />;
      case 'Running':
        return <Clock className="text-blue-500 animate-pulse" size={16} />;
      case 'Cancelled':
        return <Pause className="text-gray-500" size={16} />;
      default:
        return <Clock className="text-gray-400" size={16} />;
    }
  };

  if (!isOpen) return null;

  const isExecuting = executing || isRunning;
  const isWaiting = waitingForWebhook;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-5xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Test Execution - {testCases.length} Test Case(s)
              </h3>
              {requirement && (
                <p className="text-sm text-gray-600">
                  For requirement: {requirement.id} - {requirement.name}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-400 hover:text-gray-600"
                title="Settings"
              >
                <Settings size={20} />
              </button>
              <button
                onClick={onClose}
                disabled={isProcessing}
                className={`text-gray-400 hover:text-gray-500 focus:outline-none ${isProcessing ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {processingStatus && (
            <div className={`mb-4 p-3 rounded flex items-center ${
              processingStatus.includes('Error') 
                ? 'bg-red-50 border border-red-200' 
                : processingStatus.includes('success') 
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-blue-50 border border-blue-200'
            }`}>
              {isProcessing && (
                <Loader2 className="animate-spin mr-2 flex-shrink-0" size={18} />
              )}
              {!isProcessing && processingStatus.includes('success') && (
                <Check className="mr-2 text-green-600 flex-shrink-0" size={18} />
              )}
              {!isProcessing && processingStatus.includes('Error') && (
                <AlertTriangle className="mr-2 text-red-600 flex-shrink-0" size={18} />
              )}
              <p className={`${
                processingStatus.includes('Error') 
                  ? 'text-red-700' 
                  : processingStatus.includes('success') 
                    ? 'text-green-700'
                    : 'text-blue-700'
              }`}>
                {processingStatus}
              </p>
            </div>
          )}

          {/* Settings Panel */}
          {showSettings && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <h4 className="text-md font-medium text-gray-900 mb-3">Execution Settings</h4>
              
              {/* Backend Status */}
              <div className="mb-4 flex items-center">
                {hasBackendSupport ? <Wifi className="text-green-500 mr-2" size={16} /> : <WifiOff className="text-red-500 mr-2" size={16} />}
                <span className="text-sm">
                  Backend: {backendStatus === 'checking' ? 'Checking...' : hasBackendSupport ? 'Available' : 'Not Available'}
                </span>
              </div>

              {/* Execution Mode */}
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={useGitHub}
                    onChange={(e) => setUseGitHub(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Use GitHub Actions (real execution)</span>
                </label>
                <p className="text-xs text-gray-500 ml-6">
                  {useGitHub ? 'Execute tests via GitHub Actions workflow' : 'Use simulated test execution'}
                </p>
              </div>

              {/* GitHub Configuration */}
              {useGitHub && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Repository URL</label>
                    <input
                      type="text"
                      value={config.repoUrl}
                      onChange={(e) => setConfig({...config, repoUrl: e.target.value})}
                      placeholder="https://github.com/owner/repo"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Branch</label>
                      <input
                        type="text"
                        value={config.branch}
                        onChange={(e) => setConfig({...config, branch: e.target.value})}
                        placeholder="main"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Workflow ID</label>
                      <input
                        type="text"
                        value={config.workflowId}
                        onChange={(e) => setConfig({...config, workflowId: e.target.value})}
                        placeholder="tests.yml"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">GitHub Token</label>
                    <input
                      type="password"
                      value={config.ghToken}
                      onChange={(e) => setConfig({...config, ghToken: e.target.value})}
                      placeholder="ghp_..."
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Webhook URL</label>
                    <input
                      type="text"
                      value={config.callbackUrl}
                      onChange={(e) => setConfig({...config, callbackUrl: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              )}

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
          {useGitHub && workflowRun && (
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
              {isWaiting && (
                <div className="mt-2 text-blue-600 text-sm">
                  ⏳ Waiting for workflow to complete and send results...
                </div>
              )}
            </div>
          )}

          {/* Execution Controls */}
          {!executionStarted && !isRunning && !isWaiting && (
            <div className="mb-4 flex justify-center">
              <button
                onClick={executeTests}
                disabled={useGitHub && (!config.repoUrl || !config.ghToken)}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:ring-2 focus:ring-green-500 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="mr-2" size={16} />
                Start Execution
              </button>
            </div>
          )}

          {/* Progress bar */}
          {(executionStarted || isWaiting) && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>
                  {isWaiting ? 'Waiting for results...' : `Progress: ${completedTests}/${testCases.length}`}
                </span>
                <span>
                  {isWaiting ? 'GitHub Actions' : `${Math.round((completedTests / testCases.length) * 100)}%`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isWaiting ? 'bg-blue-600 animate-pulse w-full' : 'bg-blue-600'
                  }`}
                  style={{ width: isWaiting ? '100%' : `${(completedTests / testCases.length) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <div className="flex items-center">
                <AlertTriangle className="text-red-500 mr-2" size={16} />
                <div className="flex-1">
                  <span className="text-red-700">{error}</span>
                  {workflowRun && (
                    <div className="mt-1">
                      <a
                        href={workflowRun.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-600 hover:text-red-800 text-sm underline"
                      >
                        Check workflow status on GitHub
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Test Results Table */}
          <div className="max-h-96 overflow-y-auto border rounded">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Test Case</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {testResults.map((result, index) => (
                  <tr key={result.id} className={currentTestIndex === index ? 'bg-blue-50' : ''}>
                    <td className="px-4 py-2 text-sm font-mono text-gray-600">{result.id}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{result.name}</td>
                    <td className="px-4 py-2 text-sm">
                      <div className="flex items-center">
                        {getStatusIcon(result.status)}
                        <span className="ml-2">{result.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {result.duration > 0 ? `${result.duration}s` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <div className="text-sm text-gray-600">
              {isExecuting ? 'Execution in progress...' : 
               isWaiting ? 'Waiting for GitHub Actions...' :
               executionStarted || results ? 'Execution completed' : 'Ready to execute'}
            </div>
            <div className="flex space-x-2">
              {(isExecuting || isWaiting) && (
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
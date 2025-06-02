// src/components/TestExecution/TestRunner.jsx - Fixed version with request isolation
import React, { useState, useEffect } from 'react';
import { GitBranch, Play, Check, AlertTriangle, X, Loader2, ChevronDown, ChevronRight, Save, Wifi, WifiOff } from 'lucide-react';
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

const TestRunner = ({ requirement, testCases, onTestComplete }) => {
  // Backend support detection
  const [hasBackendSupport, setHasBackendSupport] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');

  // FIXED: Track current request ID for proper isolation
  const [currentRequestId, setCurrentRequestId] = useState(null);

  // Configuration state
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
  
  // UI State
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [workflowRun, setWorkflowRun] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [pollInterval, setPollInterval] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [waitingForWebhook, setWaitingForWebhook] = useState(false);
  const [webhookTimeout, setWebhookTimeout] = useState(null);

  // Check backend availability on component mount
  useEffect(() => {
    checkBackendAvailability();
  }, []);

  // FIXED: Set up request-specific webhook listener
  useEffect(() => {
    if (hasBackendSupport && webhookService && currentRequestId) {
      console.log(`🎯 Setting up webhook listener for request: ${currentRequestId}`);
      
      // Subscribe to this specific request ID for precise targeting
      webhookService.subscribeToRequest(currentRequestId, handleWebhookResults);
      
      // Also subscribe to the general requirement (backup)
      webhookService.subscribeToRequirement(requirement.id, handleWebhookResults);
      
      // Cleanup on unmount or when request changes
      return () => {
        console.log(`🧹 Cleaning up webhook listeners for request: ${currentRequestId}`);
        webhookService.unsubscribeFromRequest(currentRequestId);
        webhookService.unsubscribeFromRequirement(requirement.id);
      };
    } else if (!hasBackendSupport) {
      // Fallback to window-based listener
      console.log(`🎯 Setting up fallback webhook listener for: ${requirement.id}`);
      
      window.onTestWebhookReceived = (webhookData) => {
        console.log("🔔 WEBHOOK RECEIVED (fallback mode):", webhookData);
        
        // FIXED: Check both requirementId and requestId for matching
        const matchesRequirement = webhookData?.requirementId === requirement?.id;
        const matchesRequest = currentRequestId && webhookData?.requestId === currentRequestId;
        
        if (matchesRequirement || matchesRequest) {
          console.log("✅ Processing webhook for current execution");
          
          if (webhookTimeout) {
            clearTimeout(webhookTimeout);
            setWebhookTimeout(null);
          }
          
          handleWebhookResults(webhookData);
        } else {
          console.log("❌ Webhook doesn't match current execution - ignoring");
          console.log("Expected:", { requirementId: requirement?.id, requestId: currentRequestId });
          console.log("Received:", { requirementId: webhookData?.requirementId, requestId: webhookData?.requestId });
        }
      };
      
      return () => {
        window.onTestWebhookReceived = null;
        if (webhookTimeout) clearTimeout(webhookTimeout);
      };
    }
  }, [requirement.id, hasBackendSupport, currentRequestId, webhookTimeout]);

  const checkBackendAvailability = async () => {
    try {
      setBackendStatus('checking');
      
      const isHealthy = await webhookService.checkBackendHealth();
      
      if (isHealthy) {
        await webhookService.connect();
        setHasBackendSupport(true);
        setBackendStatus('connected');
        console.log('✅ Backend webhook service available and connected');
      } else {
        throw new Error('Backend health check failed');
      }
    } catch (error) {
      console.log('📡 Backend not available, using fallback mode:', error.message);
      setHasBackendSupport(false);
      setBackendStatus('disconnected');
    }
  };

  const handleWebhookResults = (webhookData) => {
    console.log("Processing webhook results:", webhookData);
    setWaitingForWebhook(false);
    
    if (webhookData && webhookData.results && Array.isArray(webhookData.results)) {
      const testResults = webhookData.results;
      
      // Check for "Not Run" status - indicates real webhook data
      const hasNotRun = testResults.some(r => r.status === 'Not Run');
      if (hasNotRun) {
        console.log("📢 DETECTED REAL WEBHOOK DATA WITH 'NOT RUN' STATUS");
      }
      
      // Update test statuses in DataStore
      updateTestStatusesInDataStore(testResults);
      
      // Update UI
      setResults(testResults);
      setIsRunning(false);
      
      // Notify parent component
      if (onTestComplete) {
        onTestComplete(testResults);
      }
      
      // FIXED: Clean up the current request tracking
      setCurrentRequestId(null);
    }
  };

  const updateTestStatusesInDataStore = (testResults) => {
    try {
      const currentTestCases = dataStore.getTestCases();
      
      console.log("Current test case IDs:", currentTestCases.map(tc => tc.id));
      console.log("Test result IDs:", testResults.map(r => r.id));
      
      let hasNotRunStatus = false;
      
      const updatedTestCases = currentTestCases.map(tc => {
        const matchingResult = testResults.find(r => r.id === tc.id);
        
        if (matchingResult) {
          if (matchingResult.status === 'Not Run') {
            hasNotRunStatus = true;
            console.log(`⚠️ Found "Not Run" status for ${tc.id} - likely real webhook data`);
          }
          
          console.log(`Found matching result for ${tc.id}, updating status to ${matchingResult.status}`);
          return {
            ...tc,
            status: matchingResult.status,
            lastExecuted: matchingResult.status !== 'Not Run' ? new Date().toISOString() : tc.lastExecuted,
            executionTime: matchingResult.duration || 0
          };
        }
        
        return tc;
      });
      
      if (hasNotRunStatus) {
        console.log("🔔 DETECTED REAL WEBHOOK DATA WITH 'NOT RUN' STATUS");
      }
      
      dataStore.setTestCases(updatedTestCases);
      
      try {
        refreshQualityGates(dataStore);
      } catch (refreshError) {
        console.warn("Error refreshing quality gates:", refreshError);
      }
      
      if (typeof dataStore._notifyListeners === 'function') {
        dataStore._notifyListeners();
      }
      
      const updatedCount = updatedTestCases.filter((tc, idx) => 
        tc.status !== currentTestCases[idx].status ||
        tc.lastExecuted !== currentTestCases[idx].lastExecuted
      ).length;
      
      console.log(`Updated ${updatedCount} test cases in DataStore`);
      return true;
    } catch (error) {
      console.error('Error updating test statuses in DataStore:', error);
      return false;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
    setIsSaved(false);
  };

  const saveConfiguration = () => {
    try {
      localStorage.setItem('testRunnerConfig', JSON.stringify(config));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      console.error('Error saving configuration:', err);
    }
  };

  const handleRunTests = async () => {
    if (!config.repoUrl) {
      setError('Please provide a GitHub repository URL');
      return;
    }

    if (!config.ghToken) {
      setError('GitHub token is required to trigger workflows');
      return;
    }

    // FIXED: Generate unique request ID for this execution
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    setCurrentRequestId(requestId);

    setIsRunning(true);
    setError(null);
    setResults(null);
    setWorkflowRun(null);
    setWaitingForWebhook(false);

    try {
      const { owner, repo } = GitHubService.parseGitHubUrl(config.repoUrl);
      
      const payload = {
        requestId: requestId, // FIXED: Include unique request ID
        requirementId: requirement.id,
        requirementName: requirement.name,
        testCases: testCases.map(tc => tc.id),
        callbackUrl: config.callbackUrl
      };
      
      console.log("Sending payload to GitHub Actions:", payload);
      console.log("Backend support:", hasBackendSupport ? 'Available' : 'Using fallback');
      console.log("Request ID:", requestId);
      
      // FIXED: Register this request with the webhook service
      if (hasBackendSupport && webhookService) {
        webhookService.registerTestExecution(requirement.id, requestId);
      }
      
      // Check if we should use simulated results (development mode)
      const useSimulatedResults = !config.repoUrl || 
                                config.repoUrl.includes('example') ||
                                (!hasBackendSupport && config.callbackUrl.includes('webhook.site'));
      
      if (useSimulatedResults) {
        console.log("Using simulated results for development");
        setWaitingForWebhook(true);
        
        const timeout = setTimeout(() => {
          console.log("Simulated test execution completed");
          
          if (waitingForWebhook) {
            // FIXED: Include requestId in simulated results
            const simulatedResults = testCases.map(tc => ({
              id: tc.id,
              name: tc.name,
              status: Math.random() > 0.2 ? 'Passed' : 'Failed',
              duration: Math.floor(Math.random() * 1000) + 100,
              logs: `Executing test ${tc.id}: ${tc.name}\n${Math.random() > 0.2 ? 'PASSED' : 'FAILED: Assertion error'}`
            }));
            
            const simulatedWebhookData = {
              requirementId: requirement.id,
              requestId: requestId,
              timestamp: new Date().toISOString(),
              results: simulatedResults
            };
            
            handleWebhookResults(simulatedWebhookData);
          }
        }, 8000);
        
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
      
      // Set timeout based on backend availability
      const webhookTimeoutDuration = hasBackendSupport ? 120000 : 30000; // 2 min vs 30 sec
      
      const timeout = setTimeout(async () => {
        console.log("Webhook timeout reached for request:", requestId);
        
        if (hasBackendSupport && webhookService) {
          // FIXED: Try polling for the specific request ID
          try {
            console.log("🔄 Polling backend for specific request results");
            const polledResults = await webhookService.fetchResultsByRequestId(requestId);
            
            if (polledResults) {
              console.log("✅ Found results via polling");
              handleWebhookResults(polledResults);
              return;
            }
            
            // Fallback to general requirement polling
            console.log("🔄 Trying general requirement polling");
            const generalResults = await webhookService.fetchLatestResultsForRequirement(requirement.id);
            
            if (generalResults) {
              console.log("⚠️ Using latest results for requirement (may not be from current execution)");
              handleWebhookResults(generalResults);
              return;
            }
          } catch (pollError) {
            console.error("Backend polling failed:", pollError);
          }
        }
        
        // Fallback to GitHub API polling
        console.log("Falling back to GitHub API polling");
        const interval = setInterval(async () => {
          try {
            const status = await GitHubService.getWorkflowStatus(owner, repo, run.id, config.ghToken);
            
            if (status.status === 'completed') {
              clearInterval(interval);
              setPollInterval(null);
              setIsRunning(false);
              setWaitingForWebhook(false);
              
              console.log("✅ GitHub workflow completed - fetching results");
              
              try {
                const actionResults = await GitHubService.getWorkflowResults(
                  owner, repo, run.id, config.ghToken, run.client_payload
                );
                
                // FIXED: Wrap results with proper structure including requestId
                const structuredResults = {
                  requirementId: requirement.id,
                  requestId: requestId,
                  timestamp: new Date().toISOString(),
                  results: actionResults
                };
                
                handleWebhookResults(structuredResults);
              } catch (resultsError) {
                console.error('Error getting workflow results:', resultsError);
                setError('Tests completed but results could not be retrieved. Check GitHub Actions logs.');
              }
            }
          } catch (err) {
            clearInterval(interval);
            setPollInterval(null);
            setIsRunning(false);
            setWaitingForWebhook(false);
            setError(`Error monitoring workflow: ${err.message}`);
          }
        }, 10000);
        
        setPollInterval(interval);
      }, webhookTimeoutDuration);
      
      setWebhookTimeout(timeout);
      
    } catch (err) {
      setIsRunning(false);
      setWaitingForWebhook(false);
      setCurrentRequestId(null);
      setError(`Error triggering workflow: ${err.message}`);
    }
  };

  const passedCount = results?.filter(r => r.status === 'Passed').length || 0;
  const totalCount = results?.length || 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Run Tests via GitHub Actions</h2>
        
        {/* Backend Status and Request ID Indicator */}
        <div className="flex items-center space-x-4 text-sm">
          {currentRequestId && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Request:</span>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">{currentRequestId.slice(-8)}</code>
            </div>
          )}
          
          {backendStatus === 'checking' && (
            <>
              <Loader2 className="animate-spin w-4 h-4 text-gray-500" />
              <span className="text-gray-500">Checking backend...</span>
            </>
          )}
          {backendStatus === 'connected' && (
            <>
              <Wifi className="w-4 h-4 text-green-600" />
              <span className="text-green-600">Backend connected</span>
            </>
          )}
          {backendStatus === 'disconnected' && (
            <>
              <WifiOff className="w-4 h-4 text-orange-600" />
              <span className="text-orange-600">Fallback mode</span>
            </>
          )}
        </div>
      </div>
      
      {/* Configuration section */}
      <div className="mb-4 border rounded-md">
        <button 
          className="w-full px-4 py-2 flex items-center justify-between bg-gray-50 border-b"
          onClick={() => setIsConfigExpanded(!isConfigExpanded)}
        >
          <div className="flex items-center">
            {isConfigExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            <span className="font-medium ml-1">GitHub Configuration</span>
          </div>
          <div className="flex items-center">
            {!isConfigExpanded && (
              <span className="text-sm text-gray-600 mr-2">
                {config.repoUrl ? `${config.repoUrl} (${config.branch})` : 'Not configured'}
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                saveConfiguration();
              }}
              className={`px-2 py-1 text-xs rounded flex items-center ${
                isSaved ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
              disabled={isRunning}
            >
              <Save size={14} className="mr-1" />
              {isSaved ? 'Saved' : 'Save'}
            </button>
          </div>
        </button>
        
        {isConfigExpanded && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub Repository URL
                </label>
                <input
                  type="text"
                  name="repoUrl"
                  value={config.repoUrl}
                  onChange={handleInputChange}
                  placeholder="https://github.com/username/repository"
                  className="w-full p-2 border border-gray-300 rounded"
                  disabled={isRunning}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch
                </label>
                <div className="flex items-center">
                  <GitBranch className="text-gray-500 mr-2" size={18} />
                  <input
                    type="text"
                    name="branch"
                    value={config.branch}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    disabled={isRunning}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workflow File
                </label>
                <input
                  type="text"
                  name="workflowId"
                  value={config.workflowId}
                  onChange={handleInputChange}
                  placeholder="quality-tracker-tests.yml"
                  className="w-full p-2 border border-gray-300 rounded"
                  disabled={isRunning}
                />
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
                  placeholder="ghp_..."
                  className="w-full p-2 border border-gray-300 rounded"
                  disabled={isRunning}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Callback URL
                </label>
                <input
                  type="text"
                  name="callbackUrl"
                  value={config.callbackUrl}
                  onChange={handleInputChange}
                  placeholder="https://your-app.com/api/webhook/test-results"
                  className="w-full p-2 border border-gray-300 rounded"
                  disabled={isRunning}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {hasBackendSupport 
                    ? 'Using backend webhook service with request isolation for real-time updates' 
                    : 'Backend unavailable - using fallback mode (results may be cached)'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Test Cases Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Test Cases to Run:</h3>
        <div className="bg-gray-50 rounded p-3 max-h-40 overflow-y-auto">
          {testCases.length === 0 ? (
            <p className="text-gray-500 italic">No test cases available for this requirement</p>
          ) : (
            <ul className="space-y-1">
              {testCases.map(tc => (
                <li key={tc.id} className="text-sm flex items-center">
                  <span className="w-16 font-medium">{tc.id}</span>
                  <span className="flex-1">{tc.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Run Tests Button */}
      <button
        onClick={handleRunTests}
        disabled={isRunning || testCases.length === 0 || waitingForWebhook}
        className={`w-full py-2 px-4 rounded flex items-center justify-center ${
          isRunning || testCases.length === 0 || waitingForWebhook
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isRunning || waitingForWebhook ? (
          <>
            <Loader2 className="animate-spin mr-2" size={18} />
            {waitingForWebhook ? 'Waiting for results...' : 'Running Workflow...'}
          </>
        ) : (
          <>
            <Play className="mr-2" size={18} />
            Run Tests Now
          </>
        )}
      </button>

      {/* Status Messages */}
      {error && (
        <div className="my-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          <div className="flex items-center">
            <AlertTriangle className="mr-2" size={18} />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {waitingForWebhook && (
        <div className="my-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="flex items-center">
            <Loader2 className="animate-spin mr-2 text-yellow-600" size={18} />
            <span className="text-yellow-700">
              {hasBackendSupport 
                ? `Waiting for results via backend (Request: ${currentRequestId?.slice(-8)})...` 
                : 'Waiting for test results via fallback method...'
              }
            </span>
          </div>
        </div>
      )}
      
      {workflowRun && isRunning && (
        <div className="my-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Loader2 className="animate-spin mr-2 text-blue-600" size={18} />
              <span className="text-blue-700">Workflow is running...</span>
            </div>
            <a 
              href={workflowRun.html_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs bg-blue-700 text-white px-2 py-1 rounded hover:bg-blue-800"
            >
              View on GitHub
            </a>
          </div>
        </div>
      )}

      {/* Test Results */}
      {results && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">Test Results</h3>
            <div className="flex items-center">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                passedCount === totalCount
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {passedCount}/{totalCount} Passed
              </span>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            {results.map((result, index) => (
              <div 
                key={result.id} 
                className={`p-3 ${
                  index !== results.length - 1 ? 'border-b' : ''
                } ${
                  result.status === 'Passed' ? 'bg-green-50' : 
                  result.status === 'Failed' ? 'bg-red-50' : 
                  result.status === 'Not Run' ? 'bg-yellow-50' :
                  result.status === 'Info' ? 'bg-blue-50' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {result.status === 'Passed' ? (
                      <Check className="mr-2 text-green-600" size={18} />
                    ) : result.status === 'Failed' ? (
                      <X className="mr-2 text-red-600" size={18} />
                    ) : result.status === 'Not Run' ? (
                      <AlertTriangle className="mr-2 text-yellow-600" size={18} />
                    ) : result.status === 'Info' ? (
                      <Loader2 className="mr-2 text-blue-600" size={18} />
                    ) : (
                      <AlertTriangle className="mr-2 text-yellow-600" size={18} />
                    )}
                    <span className="font-medium">{result.id}: {result.name}</span>
                  </div>
                  {result.duration > 0 && (
                    <span className="text-xs text-gray-500">{result.duration}ms</span>
                  )}
                </div>
                {result.logs && (
                  <pre className="text-xs bg-gray-800 text-gray-200 p-2 rounded overflow-x-auto">
                    {result.logs}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Backend Button and Clear Cache (if available) */}
      {hasBackendSupport && webhookService && (
        <div className="mt-4 pt-4 border-t flex space-x-2">
          <button
            onClick={() => webhookService.testWebhook(requirement.id)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
            disabled={isRunning}
          >
            Test Backend Webhook
          </button>
          
          {/* FIXED: Clear cached results button */}
          <button
            onClick={async () => {
              try {
                // Clear latest results for this requirement
                const latestResults = await webhookService.fetchLatestResultsForRequirement(requirement.id);
                if (latestResults && latestResults.requestId) {
                  await webhookService.clearResults(latestResults.requestId);
                  console.log('✅ Cleared cached results');
                } else {
                  console.log('📭 No cached results to clear');
                }
              } catch (error) {
                console.error('❌ Error clearing cache:', error);
              }
            }}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
            disabled={isRunning}
          >
            Clear Cache
          </button>
        </div>
      )}
    </div>
  );
};

export default TestRunner;
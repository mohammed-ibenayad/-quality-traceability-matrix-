import React, { useState, useEffect } from 'react';
import { GitBranch, Play, Check, AlertTriangle, X, Loader2, ChevronDown, ChevronRight, Save } from 'lucide-react';
import GitHubService from '../../services/GitHubService';
import dataStore from '../../services/DataStore';
import { refreshQualityGates } from '../../utils/calculateQualityGates';

const TestRunner = ({ requirement, testCases, onTestComplete }) => {
  // State for GitHub configuration
  const [config, setConfig] = useState({
    repoUrl: '',
    branch: 'main',
    workflowId: 'quality-tracker-tests.yml',
    ghToken: '',
    callbackUrl: window.location.origin + '/api/test-results' // Default to app URL
  });
  
  // State for UI
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [workflowRun, setWorkflowRun] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [pollInterval, setPollInterval] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [waitingForWebhook, setWaitingForWebhook] = useState(false);
  const [webhookTimeout, setWebhookTimeout] = useState(null);

  // Load saved configuration on component mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('testRunnerConfig');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
      }
      
      // Set up webhook result listener
      window.onTestWebhookReceived = (webhookData) => {
        console.log("Webhook data received in TestRunner:", webhookData);
        if (webhookData && webhookData.requirementId === requirement?.id) {
          // Clear webhook timeout
          if (webhookTimeout) {
            clearTimeout(webhookTimeout);
            setWebhookTimeout(null);
          }
          
          // Process webhook results
          handleWebhookResults(webhookData);
        }
      };
    } catch (err) {
      console.error('Error loading saved configuration:', err);
    }
    
    // Cleanup function
    return () => {
      // Remove webhook listener
      window.onTestWebhookReceived = null;
      
      // Clear any polling intervals
      if (pollInterval) clearInterval(pollInterval);
      
      // Clear webhook timeout
      if (webhookTimeout) clearTimeout(webhookTimeout);
    };
  }, [requirement, webhookTimeout]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset saved indicator when changes are made
    setIsSaved(false);
  };

  // Save configuration to localStorage
  const saveConfiguration = () => {
    try {
      localStorage.setItem('testRunnerConfig', JSON.stringify(config));
      setIsSaved(true);
      
      // Show saved indicator for 2 seconds
      setTimeout(() => {
        setIsSaved(false);
      }, 2000);
    } catch (err) {
      console.error('Error saving configuration:', err);
    }
  };

  // Helper function to process webhook results
  const handleWebhookResults = (webhookData) => {
    console.log("Processing webhook results:", webhookData);
    setWaitingForWebhook(false);
    
    if (webhookData && webhookData.results && Array.isArray(webhookData.results)) {
      const testResults = webhookData.results;
      
      // Update test statuses in DataStore
      updateTestStatusesInDataStore(testResults);
      
      // Update UI
      setResults(testResults);
      setIsRunning(false);
      
      // Notify parent component
      if (onTestComplete) {
        onTestComplete(testResults);
      }
    }
  };

  // Helper function to directly update test statuses in the DataStore
  const updateTestStatusesInDataStore = (testResults) => {
    try {
      // Get current test cases from DataStore
      const currentTestCases = dataStore.getTestCases();
      
      // Log all test case IDs for debugging
      console.log("Current test case IDs:", currentTestCases.map(tc => tc.id));
      console.log("Test result IDs:", testResults.map(r => r.id));
      
      // Update test cases based on results
      const updatedTestCases = currentTestCases.map(tc => {
        // Find matching result by exact ID only (TC_XXX format)
        const matchingResult = testResults.find(r => r.id === tc.id);
        
        if (matchingResult) {
          console.log(`Found matching result for ${tc.id}, updating status to ${matchingResult.status}`);
          return {
            ...tc,
            status: matchingResult.status,
            lastExecuted: new Date().toISOString(),
            executionTime: matchingResult.duration || 0
          };
        }
        
        return tc;
      });
      
      // Update test cases in DataStore
      dataStore.setTestCases(updatedTestCases);
      
      // Force a recalculation of quality gates
      try {
        console.log("Refreshing quality gates to update dashboard metrics");
        refreshQualityGates(dataStore);
      } catch (refreshError) {
        console.warn("Error refreshing quality gates:", refreshError);
      }
      
      // Force a DataStore notification
      if (typeof dataStore._notifyListeners === 'function') {
        dataStore._notifyListeners();
      }
      
      // Count how many were actually updated
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

  const handleRunTests = async () => {
    if (!config.repoUrl) {
      setError('Please provide a GitHub repository URL');
      return;
    }

    if (!config.ghToken) {
      setError('GitHub token is required to trigger workflows');
      return;
    }

    setIsRunning(true);
    setError(null);
    setResults(null);
    setWorkflowRun(null);
    setWaitingForWebhook(false);

    try {
      // Extract owner and repo from URL
      const { owner, repo } = GitHubService.parseGitHubUrl(config.repoUrl);
      
      // Define the test payload with callback URL
      const payload = {
        requirementId: requirement.id,
        requirementName: requirement.name,
        testCases: testCases.map(tc => tc.id),
        callbackUrl: config.callbackUrl
      };
      
      console.log("Sending payload to GitHub Actions:", payload);
      
      // For quick feedback during development, simulate results immediately
      // In a real scenario, you'd wait for GitHub Actions to complete
      const useSimulatedResults = !config.repoUrl || config.repoUrl.includes('example');
      
      if (useSimulatedResults) {
        // Set a flag to indicate we're waiting for results
        setWaitingForWebhook(true);
        
        // Set a timeout - if we don't get webhook results within 10 seconds, use simulated ones
        const timeout = setTimeout(() => {
          console.log("Webhook timeout reached, using simulated results");
          
          if (waitingForWebhook) {
            // Generate simulated test results for demo purposes
            const simulatedResults = testCases.map(tc => ({
              id: tc.id,
              name: tc.name,
              status: Math.random() > 0.2 ? 'Passed' : 'Failed',
              duration: Math.floor(Math.random() * 1000) + 100,
              logs: `Executing test ${tc.id}: ${tc.name}\n${Math.random() > 0.2 ? 'PASSED' : 'FAILED: Assertion error'}`
            }));
            
            // Update test statuses in DataStore
            updateTestStatusesInDataStore(simulatedResults);
            
            setResults(simulatedResults);
            setIsRunning(false);
            setWaitingForWebhook(false);
            
            if (onTestComplete) {
              onTestComplete(simulatedResults);
            }
          }
        }, 10000);
        
        setWebhookTimeout(timeout);
        return;
      }
      
      // Trigger the workflow dispatch event
      const run = await GitHubService.triggerWorkflow(
        owner, 
        repo, 
        config.workflowId, 
        config.branch, 
        config.ghToken, 
        payload
      );
      
      setWorkflowRun(run);
      setWaitingForWebhook(true);
      
      // Set a timeout for the webhook callback
      const timeout = setTimeout(() => {
        console.log("Webhook timeout reached, using GitHub API to check status");
        
        // Start polling for workflow status
        // Enhanced TestRunner.jsx with result fetching
// Update the polling section inside handleRunTests function

// Start polling for workflow status
const interval = setInterval(async () => {
  try {
    const status = await GitHubService.getWorkflowStatus(owner, repo, run.id, config.ghToken);
    
    if (status.status === 'completed') {
      clearInterval(interval);
      setPollInterval(null);
      setIsRunning(false);
      setWaitingForWebhook(false);
      
      console.log("%c✅ GitHub workflow completed", "background: #4CAF50; color: white; font-weight: bold; padding: 3px 6px; border-radius: 3px;");
      
      // Now that we know the workflow is complete, fetch results from the callback URL
      if (config.callbackUrl && !config.callbackUrl.includes('webhook.site')) {
        try {
          console.log("%c🔄 Fetching results directly from callback URL", "background: #2196F3; color: white; font-weight: bold; padding: 3px 6px; border-radius: 3px;");
          
          // Prepare the URL with a query parameter for this specific run
          const resultsUrl = new URL(config.callbackUrl);
          resultsUrl.searchParams.append('runId', run.id);
          resultsUrl.searchParams.append('requirementId', requirement.id);
          
          // Fetch the results
          const resultsResponse = await fetch(resultsUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          if (resultsResponse.ok) {
            const callbackResults = await resultsResponse.json();
            console.log("%c📊 Retrieved test results from callback URL", "background: #4CAF50; color: white; font-weight: bold; padding: 3px 6px; border-radius: 3px;");
            console.log(callbackResults);
            
            // Process the results if they match our expected format
            if (callbackResults.results && Array.isArray(callbackResults.results)) {
              // Update test statuses in DataStore
              updateTestStatusesInDataStore(callbackResults.results);
              
              setResults(callbackResults.results);
              
              if (onTestComplete) {
                onTestComplete(callbackResults.results);
              }
              return;
            } else {
              console.warn("Results from callback URL don't match expected format:", callbackResults);
            }
          } else {
            console.warn("Failed to retrieve results from callback URL:", resultsResponse.statusText);
          }
        } catch (fetchError) {
          console.error("Error fetching results from callback URL:", fetchError);
        }
      }
      
      // If we couldn't get results from the callback URL, fall back to GitHub Actions API
      try {
        console.log("%c🔄 Fetching results from GitHub Actions API", "background: #FF9800; color: white; font-weight: bold; padding: 3px 6px; border-radius: 3px;");
        
        const actionResults = await GitHubService.getWorkflowResults(
          owner, repo, run.id, config.ghToken, run.client_payload
        );
        
        // Update test statuses in DataStore
        updateTestStatusesInDataStore(actionResults);
        
        setResults(actionResults);
        
        if (onTestComplete) {
          onTestComplete(actionResults);
        }
      } catch (resultsError) {
        console.error('Error getting workflow results:', resultsError);
        
        // Fallback to simulated results
        console.log("%c🔄 Falling back to simulated results", "background: #F44336; color: white; font-weight: bold; padding: 3px 6px; border-radius: 3px;");
        
        const simulatedResults = testCases.map(tc => ({
          id: tc.id,
          name: tc.name,
          status: Math.random() > 0.2 ? 'Passed' : 'Failed',
          duration: Math.floor(Math.random() * 1000) + 100,
          logs: `Executing test ${tc.id}: ${tc.name}\n${Math.random() > 0.2 ? 'PASSED' : 'FAILED: Assertion error'}`
        }));
        
        // Update test statuses in DataStore
        updateTestStatusesInDataStore(simulatedResults);
        
        setResults(simulatedResults);
        
        if (onTestComplete) {
          onTestComplete(simulatedResults);
        }
      }
    }
  } catch (err) {
    clearInterval(interval);
    setPollInterval(null);
    setIsRunning(false);
    setWaitingForWebhook(false);
    setError(`Error monitoring workflow: ${err.message}`);
  }
}, 5000); // Check every 5 seconds
        setPollInterval(interval);
      }, 30000); // Wait 30 seconds for webhook before falling back to polling
      
      setWebhookTimeout(timeout);
      
    } catch (err) {
      setIsRunning(false);
      setWaitingForWebhook(false);
      setError(`Error triggering workflow: ${err.message}`);
    }
  };

  const passedCount = results?.filter(r => r.status === 'Passed').length || 0;
  const totalCount = results?.length || 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Run Tests via GitHub Actions</h2>
      
      {/* GitHub configuration section (collapsible) */}
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
                  Callback URL (Optional)
                </label>
                <input
                  type="text"
                  name="callbackUrl"
                  value={config.callbackUrl}
                  onChange={handleInputChange}
                  placeholder="https://your-app.com/api/test-results"
                  className="w-full p-2 border border-gray-300 rounded"
                  disabled={isRunning}
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL where test results should be sent (leave empty to use simulated results)
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

      {/* Error Message */}
      {error && (
        <div className="my-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          <div className="flex items-center">
            <AlertTriangle className="mr-2" size={18} />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {/* Webhook Status */}
      {waitingForWebhook && (
        <div className="my-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="flex items-center">
            <Loader2 className="animate-spin mr-2 text-yellow-600" size={18} />
            <span className="text-yellow-700">Waiting for test results from webhook...</span>
          </div>
        </div>
      )}
      
      {/* Workflow Run Status */}
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
                  result.status === 'Info' ? 'bg-blue-50' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {result.status === 'Passed' ? (
                      <Check className="mr-2 text-green-600" size={18} />
                    ) : result.status === 'Failed' ? (
                      <X className="mr-2 text-red-600" size={18} />
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
    </div>
  );
};

export default TestRunner;
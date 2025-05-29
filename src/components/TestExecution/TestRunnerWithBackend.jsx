import React, { useState, useEffect } from 'react';
import webhookService from '../../services/WebhookService';
import GitHubService from '../../services/GitHubService';

const TestRunnerWithBackend = ({ requirement, testCases, onTestComplete }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [waitingForWebhook, setWaitingForWebhook] = useState(false);

  // GitHub configuration
  const [config, setConfig] = useState({
    repoUrl: localStorage.getItem('repoUrl') || '',
    branch: 'main',
    workflowId: 'quality-tracker-tests.yml',
    ghToken: localStorage.getItem('ghToken') || '',
    // Point to your backend server
    callbackUrl: process.env.REACT_APP_API_URL 
      ? `${process.env.REACT_APP_API_URL}/api/webhook/test-results`
      : 'http://localhost:3001/api/webhook/test-results'
  });

  // Set up webhook listener when component mounts
  useEffect(() => {
    console.log(`🎯 Setting up webhook listener for: ${requirement.id}`);
    
    // Subscribe to webhooks for this requirement
    webhookService.subscribeToRequirement(requirement.id, handleWebhookResults);
    
    // Cleanup on unmount
    return () => {
      console.log(`🧹 Cleaning up webhook listener for: ${requirement.id}`);
      webhookService.unsubscribeFromRequirement(requirement.id);
    };
  }, [requirement.id]);

  const handleWebhookResults = (webhookData) => {
    console.log('🔔 Webhook results received:', webhookData);
    
    setWaitingForWebhook(false);
    setIsRunning(false);
    
    if (webhookData && webhookData.results) {
      setResults(webhookData.results);
      
      // Notify parent component
      if (onTestComplete) {
        onTestComplete(webhookData.results);
      }
    }
  };

  const handleRunTests = async () => {
    setIsRunning(true);
    setError(null);
    setResults(null);
    setWaitingForWebhook(true);

    try {
      console.log(`🚀 Triggering tests for: ${requirement.id}`);
      console.log(`📡 Results will be sent to: ${config.callbackUrl}`);
      
      // Extract GitHub repo info
      const { owner, repo } = GitHubService.parseGitHubUrl(config.repoUrl);
      
      // Create payload for GitHub Actions
      const payload = {
        requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
        requirementId: requirement.id,
        requirementName: requirement.name,
        testCases: testCases.map(tc => tc.id),
        callbackUrl: config.callbackUrl // Backend webhook URL
      };
      
      // Trigger GitHub Actions workflow
      const workflowRun = await GitHubService.triggerWorkflow(
        owner, repo, config.workflowId, config.branch, config.ghToken, payload
      );
      
      console.log(`✅ Workflow triggered: ${workflowRun.id}`);
      console.log(`⏳ Waiting for webhook from GitHub Actions...`);
      
      // Set timeout as fallback - try polling if no webhook received
      setTimeout(async () => {
        if (waitingForWebhook) {
          console.log('⏰ Webhook timeout - trying to poll for results');
          
          try {
            const polledResults = await webhookService.pollForResults(requirement.id, 5, 3000);
            
            if (polledResults) {
              handleWebhookResults(polledResults);
            }
          } catch (pollError) {
            console.error('❌ Polling failed:', pollError);
            setError('Tests may have completed but results were not received. Check GitHub Actions logs.');
            setIsRunning(false);
            setWaitingForWebhook(false);
          }
        }
      }, 60000); // Wait 60 seconds for webhook, then try polling
      
    } catch (err) {
      console.error('❌ Error triggering tests:', err);
      setError(`Failed to trigger tests: ${err.message}`);
      setIsRunning(false);
      setWaitingForWebhook(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">
        Run Tests for: {requirement.id} - {requirement.name}
      </h3>

      {/* Configuration */}
      <div className="mb-4 space-y-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">GitHub Repository</label>
          <input
            type="text"
            value={config.repoUrl}
            onChange={(e) => setConfig(prev => ({ ...prev, repoUrl: e.target.value }))}
            placeholder="https://github.com/username/repository"
            className="w-full p-2 border border-gray-300 rounded"
            disabled={isRunning}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Webhook URL (Backend)</label>
          <input
            type="text"
            value={config.callbackUrl}
            onChange={(e) => setConfig(prev => ({ ...prev, callbackUrl: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded bg-gray-50"
            disabled={isRunning}
          />
          <p className="text-xs text-gray-500 mt-1">
            This is your backend server URL where GitHub Actions will send results
          </p>
        </div>
      </div>

      {/* Test Cases List */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Test Cases to Run:</h4>
        <div className="bg-gray-50 rounded p-3 max-h-32 overflow-y-auto">
          {testCases.map(tc => (
            <div key={tc.id} className="text-sm flex items-center py-1">
              <span className="w-16 font-medium">{tc.id}</span>
              <span className="flex-1">{tc.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Run Button */}
      <button
        onClick={handleRunTests}
        disabled={isRunning || testCases.length === 0}
        className={`w-full py-2 px-4 rounded flex items-center justify-center ${
          isRunning || testCases.length === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isRunning ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {waitingForWebhook ? 'Waiting for results...' : 'Running tests...'}
          </>
        ) : (
          'Run Tests'
        )}
      </button>

      {/* Status Messages */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {waitingForWebhook && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-700">
          ⏳ Waiting for test results from GitHub Actions via webhook...
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="mt-4">
          <h4 className="text-lg font-medium mb-2">Test Results</h4>
          <div className="space-y-2">
            {results.map((result, index) => (
              <div
                key={result.id || index}
                className={`p-3 rounded border ${
                  result.status === 'Passed' ? 'bg-green-50 border-green-200' :
                  result.status === 'Failed' ? 'bg-red-50 border-red-200' :
                  'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{result.id}: {result.name}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    result.status === 'Passed' ? 'bg-green-100 text-green-800' :
                    result.status === 'Failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {result.status}
                  </span>
                </div>
                {result.duration && (
                  <div className="text-sm text-gray-500 mt-1">
                    Duration: {result.duration}ms
                  </div>
                )}
                {result.logs && (
                  <pre className="text-xs bg-gray-800 text-gray-200 p-2 mt-2 rounded overflow-x-auto">
                    {result.logs}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Button */}
      <div className="mt-4 pt-4 border-t">
        <button
          onClick={() => webhookService.testWebhook(requirement.id)}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
        >
          Test Webhook (Simulate Results)
        </button>
      </div>
    </div>
  );
};

export default TestRunnerWithBackend; 
import React, { useState, useEffect } from 'react';
import { GitBranch, Play, Check, AlertTriangle, X, Loader2 } from 'lucide-react';
import GitHubService from '../../services/GitHubService';

const TestRunner = ({ requirement, testCases, onTestComplete }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [workflowId, setWorkflowId] = useState('quality-tracker-tests.yml');
  const [ghToken, setGhToken] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [workflowRun, setWorkflowRun] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [pollInterval, setPollInterval] = useState(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [pollInterval]);

  const handleRunTests = async () => {
    if (!repoUrl) {
      setError('Please provide a GitHub repository URL');
      return;
    }

    if (!ghToken) {
      setError('GitHub token is required to trigger workflows');
      return;
    }

    setIsRunning(true);
    setError(null);
    setResults(null);
    setWorkflowRun(null);

    try {
      // Extract owner and repo from URL
      const { owner, repo } = GitHubService.parseGitHubUrl(repoUrl);
      
      // Define the test payload - this will be sent to the GitHub Actions workflow
      const payload = {
        requirementId: requirement.id,
        testCases: testCases.map(tc => tc.id),
        requirementName: requirement.name
      };
      
      // Trigger the workflow dispatch event
      const run = await GitHubService.triggerWorkflow(
        owner, 
        repo, 
        workflowId, 
        branch, 
        ghToken, 
        payload
      );
      
      setWorkflowRun(run);
      
      // Start polling for workflow status
      const interval = setInterval(async () => {
        try {
          const status = await GitHubService.getWorkflowStatus(owner, repo, run.id, ghToken);
          
          if (status.status === 'completed') {
            clearInterval(interval);
            setPollInterval(null);
            setIsRunning(false);
            
            // Fetch test results
            const testResults = await GitHubService.getWorkflowResults(owner, repo, run.id, ghToken);
            setResults(testResults);
            
            if (onTestComplete) {
              onTestComplete(testResults);
            }
          }
        } catch (err) {
          clearInterval(interval);
          setPollInterval(null);
          setIsRunning(false);
          setError(`Error monitoring workflow: ${err.message}`);
        }
      }, 5000); // Check every 5 seconds
      
      setPollInterval(interval);
      
    } catch (err) {
      setIsRunning(false);
      setError(`Error triggering workflow: ${err.message}`);
    }
  };

  const passedCount = results?.filter(r => r.status === 'Passed').length || 0;
  const totalCount = results?.length || 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Run Tests via GitHub Actions</h2>
      
      <div className="mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            GitHub Repository URL
          </label>
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/username/repository"
            className="w-full p-2 border border-gray-300 rounded"
          />
          <p className="text-xs text-gray-500 mt-1">
            The repository containing your test files
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Branch
          </label>
          <div className="flex items-center">
            <GitBranch className="text-gray-500 mr-2" size={18} />
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Workflow File
          </label>
          <input
            type="text"
            value={workflowId}
            onChange={(e) => setWorkflowId(e.target.value)}
            placeholder="quality-tracker-tests.yml"
            className="w-full p-2 border border-gray-300 rounded"
          />
          <p className="text-xs text-gray-500 mt-1">
            The workflow file in .github/workflows directory of your repository
          </p>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            GitHub Token
          </label>
          <input
            type="password"
            value={ghToken}
            onChange={(e) => setGhToken(e.target.value)}
            placeholder="ghp_..."
            className="w-full p-2 border border-gray-300 rounded"
          />
          <p className="text-xs text-gray-500 mt-1">
            Personal access token with workflow permissions
          </p>
        </div>

        <div className="mb-4">
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
              <Loader2 className="animate-spin mr-2" size={18} />
              Running Workflow...
            </>
          ) : (
            <>
              <Play className="mr-2" size={18} />
              Trigger GitHub Actions
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          <div className="flex items-center">
            <AlertTriangle className="mr-2" size={18} />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {workflowRun && isRunning && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
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

      {results && (
        <div className="mb-4">
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
                  result.status === 'Passed' ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {result.status === 'Passed' ? (
                      <Check className="mr-2 text-green-600" size={18} />
                    ) : (
                      <X className="mr-2 text-red-600" size={18} />
                    )}
                    <span className="font-medium">{result.id}: {result.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{result.duration}ms</span>
                </div>
                <pre className="text-xs bg-gray-800 text-gray-200 p-2 rounded overflow-x-auto">
                  {result.logs}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestRunner;
import React, { useState } from 'react';
import { GitBranch, Play, Check, AlertTriangle, X, Loader2 } from 'lucide-react';

/**
 * Test Runner component that connects to a GitHub repository to execute tests
 * for a specific requirement.
 */
const TestRunner = ({ requirement, testCases, onTestComplete }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleRunTests = async () => {
    if (!repoUrl) {
      setError('Please provide a GitHub repository URL');
      return;
    }

    setIsRunning(true);
    setError(null);
    setResults(null);

    try {
      // In a real implementation, this would be an API call to your backend
      // which would trigger the tests in the specified repository
      await simulateTestRun(requirement, testCases);
      
      // Simulate test results
      const mockResults = generateMockResults(testCases);
      setResults(mockResults);
      
      if (onTestComplete) {
        onTestComplete(mockResults);
      }
    } catch (err) {
      setError(err.message || 'Failed to run tests');
    } finally {
      setIsRunning(false);
    }
  };

  // This function simulates test execution - in a real implementation
  // this would trigger tests in your Python repository
  const simulateTestRun = async (requirement, testCases) => {
    // Simulate network delay
    return new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });
  };

  // Generate mock results for demonstration
  const generateMockResults = (testCases) => {
    return testCases.map(tc => ({
      id: tc.id,
      name: tc.name,
      status: Math.random() > 0.2 ? 'Passed' : 'Failed',
      duration: Math.floor(Math.random() * 1000) + 100,
      logs: `Executing test ${tc.id}: ${tc.name}\nTest completed with ${Math.random() > 0.2 ? 'success' : 'failure'}.`
    }));
  };

  const passedCount = results?.filter(r => r.status === 'Passed').length || 0;
  const totalCount = results?.length || 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Run Tests for {requirement?.id}: {requirement?.name}</h2>
      
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
              Running Tests...
            </>
          ) : (
            <>
              <Play className="mr-2" size={18} />
              Run Tests
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
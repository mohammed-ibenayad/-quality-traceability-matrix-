import React, { useEffect } from 'react';
import TestRunner from './TestRunner';
import testResultsApi from '../../api/testResultsApi';

/**
 * Modal component for displaying the test runner interface
 */
const TestExecutionModal = ({ requirement, testCases, isOpen, onClose, onTestComplete }) => {
  // Get the URL that GitHub Actions should use to send results back
  const callbackUrl = testResultsApi.baseUrl;

  // Effect to log the callback URL for debugging
  useEffect(() => {
    if (isOpen) {
      console.log(`Test execution modal opened for requirement ${requirement?.id}`);
      console.log(`Using callback URL: ${callbackUrl}`);
    }
  }, [isOpen, requirement, callbackUrl]);

  if (!isOpen) return null;

  const handleTestComplete = (results) => {
    // Process test results
    if (results && Array.isArray(results)) {
      console.log(`Test execution completed with ${results.length} results`);
      
      // If callback URL was not used (local simulation), update DataStore directly
      if (results[0]?.id !== 'INFO') {
        // Simulate sending results to the API endpoint
        testResultsApi.test({
          requirementId: requirement.id,
          timestamp: new Date().toISOString(),
          results: results
        }).then(response => {
          console.log('Test results processed by API:', response);
          
          if (onTestComplete) {
            onTestComplete(results);
          }
        }).catch(error => {
          console.error('Error processing test results:', error);
        });
      } else {
        // Results were sent directly to the API via GitHub Actions
        if (onTestComplete) {
          onTestComplete(results);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-screen overflow-y-auto">
        <div className="absolute top-0 right-0 pt-4 pr-4">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <TestRunner 
            requirement={requirement}
            testCases={testCases}
            callbackUrl={callbackUrl}
            onTestComplete={handleTestComplete}
          />
        </div>
      </div>
    </div>
  );
};

export default TestExecutionModal;
import React, { useEffect, useState } from 'react';
import { Loader2, Check, AlertTriangle } from 'lucide-react';
import TestRunner from './TestRunner';
import dataStore from '../../services/DataStore';

/**
 * Modal component for displaying the test runner interface
 */
const TestExecutionModal = ({ requirement, testCases, isOpen, onClose, onTestComplete }) => {
  const [processingStatus, setProcessingStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [testResults, setTestResults] = useState(null);
  
  // Effect to log information when modal is opened and reset state
  useEffect(() => {
    if (isOpen) {
      console.log(`Test execution modal opened for requirement ${requirement?.id}`);
      console.log(`Test cases to run:`, testCases);
      
      // Reset state when modal opens
      setProcessingStatus(null);
      setIsProcessing(false);
      setTestResults(null);
    }
  }, [isOpen, requirement, testCases]);

  if (!isOpen) return null;

  const handleTestComplete = (results) => {
    console.log("Test execution completed with results:", results);
    setTestResults(results);
    setIsProcessing(true);
    setProcessingStatus("Updating test statuses in the application...");
    
    // Directly update the test statuses in the DataStore
    try {
      // Get current test cases
      const currentTestCases = dataStore.getTestCases();
      console.log("Current test cases before update:", currentTestCases.map(tc => ({ id: tc.id, status: tc.status })));
      
      // Update test cases based on results
      const updatedTestCases = currentTestCases.map(tc => {
        // Find matching result (exact match on TC_XXX format)
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
      
      // Update in DataStore
      dataStore.setTestCases(updatedTestCases);
      console.log("Test cases after update:", updatedTestCases.map(tc => ({ id: tc.id, status: tc.status })));
      
      setProcessingStatus("Test statuses updated successfully!");
      setIsProcessing(false);
      
      // Notify parent component that tests are complete
      if (onTestComplete) {
        setTimeout(() => {
          onTestComplete(results);
        }, 2000); // Give the user a moment to see the success message
      }
    } catch (error) {
      console.error("Error updating test statuses:", error);
      setProcessingStatus(`Error: ${error.message}`);
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-screen overflow-y-auto">
        <div className="absolute top-0 right-0 pt-4 pr-4">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className={`text-gray-400 hover:text-gray-500 focus:outline-none ${isProcessing ? 'cursor-not-allowed opacity-50' : ''}`}
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Run Tests for: {requirement?.id} - {requirement?.name}
          </h2>
          
          {/* Status Messages */}
          {processingStatus && (
            <div className={`mb-6 p-3 rounded flex items-center ${
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
          
          {/* Test Runner Component */}
          <TestRunner 
            requirement={requirement}
            testCases={testCases}
            onTestComplete={handleTestComplete}
          />
        </div>
      </div>
    </div>
  );
};

export default TestExecutionModal;
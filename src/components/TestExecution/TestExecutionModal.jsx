import React from 'react';
import TestRunner from './TestRunner';

/**
 * Modal component for displaying the test runner interface
 */
const TestExecutionModal = ({ requirement, testCases, isOpen, onClose, onTestComplete }) => {
  if (!isOpen) return null;

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
            onTestComplete={(results) => {
              if (onTestComplete) {
                onTestComplete(results);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TestExecutionModal;
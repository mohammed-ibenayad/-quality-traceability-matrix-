// src/components/TestExecution/FailureAnalysisModal.jsx
// Modal version of the failure analysis panel for TestExecutionModal

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, FileText, Code, AlertCircle, CheckCircle, XCircle, Clock, X } from 'lucide-react';

const FailureAnalysisModal = ({ testResult, isOpen, onClose }) => {
  const [expandedSections, setExpandedSections] = useState(new Set(['raw-output']));

  // Early return if modal not open or no test result
  if (!isOpen || !testResult) {
    return null;
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Enhanced failure type detection with JUnit XML awareness
  const getFailureTypeIcon = (result) => {
    if (!result.failure) return null;
    
    // Use enhanced category from JUnit XML or parsing
    const category = result.failure.category || result.failure.type;
    
    // Priority categorization
    if (category === 'assertion' || result.failure.assertion?.available || 
        result.failure.type?.includes('Assertion') || result.failure.type === 'AssertionError') {
      return '🔍'; // Assertion
    }
    if (category === 'timeout' || result.failure.type?.includes('Timeout')) {
      return '⏱️'; // Timeout
    }
    if (category === 'element' || result.failure.type?.includes('Element')) {
      return '🎯'; // Element
    }
    if (category === 'network' || result.failure.type?.includes('Network') || 
        result.failure.type?.includes('API') || result.failure.type?.includes('Connection')) {
      return '🌐'; // Network
    }
    return '❌'; // General failure
  };

  // Enhanced failure insight generation with JUnit XML data
  const getQuickInsight = (result) => {
    if (!result.failure) return null;
    
    // Priority 1: Use parsed assertion details from JUnit XML
    if (result.failure.assertion?.available) {
      const { actual, expected, operator } = result.failure.assertion;
      if (actual && expected) {
        return `Expected ${expected}, got ${actual}`;
      } else if (result.failure.assertion.expression) {
        return `Assertion failed: ${result.failure.assertion.expression}`;
      }
    }
    
    // Priority 2: Use JUnit XML message directly
    if (result.failure.message && result.failure.parsingSource === 'junit-xml') {
      return result.failure.message;
    }
    
    // Priority 3: Use categorized insights
    const category = result.failure.category || result.failure.type;
    
    if (category === 'assertion' || result.failure.type === 'AssertionError') {
      return 'Assertion failed - value mismatch detected';
    }
    if (category === 'timeout' || result.failure.type?.includes('Timeout')) {
      return 'Operation timed out';
    }
    if (category === 'element') {
      if (result.failure.type === 'ElementNotInteractableException') {
        return 'Element blocked by overlay or not clickable';
      }
      if (result.failure.type === 'NoSuchElementException') {
        return 'Element not found on page';
      }
      return 'Element interaction failed';
    }
    if (category === 'network' || result.failure.type?.includes('Network')) {
      return 'Network or API connection failed';
    }
    
    // Priority 4: Use original message or fallback
    if (result.failure.message) {
      return result.failure.message;
    }
    
    return 'Test execution failed';
  };

  // Enhanced framework info display
 // Enhanced framework info display
const getFrameworkInfo = (result) => {
  const framework = result.execution?.framework;
  const parsingSource = result.execution?.parsingSource;
  
  if (framework && parsingSource) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <span className="font-medium">Framework:</span>
        <span>{framework.name}</span>
        {framework.version && (
          <span className="text-xs opacity-75">v{framework.version}</span>
        )}
        <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">
          {parsingSource}
        </span>
      </div>
    );
  }
  
  // Fallback: Show just parsing source if no framework detected
  if (parsingSource) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <span className="font-medium">Framework:</span>
        <span>Unknown</span>
        <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">
          {parsingSource}
        </span>
      </div>
    );
  }
  
  // Legacy fallback
  if (result.framework) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <span className="font-medium">Framework:</span>
        <span>{result.framework.name}</span>
        {result.framework.version && <span className="text-xs opacity-75">v{result.framework.version}</span>}
        {result.execution?.junitSource && <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">XML</span>}
      </div>
    );
  }
  
  return null;
};
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto border w-11/12 max-w-4xl shadow-lg rounded-md bg-white" style={{ maxHeight: 'calc(100vh - 160px)' }}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getFailureTypeIcon(testResult)}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Failure Analysis - {testResult.id}
                {testResult.failure?.parsingSource && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                    Source: {testResult.failure.parsingSource}
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-600">
                {testResult.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(100vh - 240px)' }}>
          {/* Error Message - Top section */}
          {testResult.failure?.message && (
            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="font-semibold text-red-900 flex items-center space-x-2">
                    <AlertCircle className="text-red-600" size={16} />
                    <span>Error Message</span>
                  </h5>
                  <button 
                    onClick={() => copyToClipboard(testResult.failure.message)}
                    className="text-red-600 hover:text-red-800"
                    title="Copy error message"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <p className="text-sm text-red-800 bg-white border rounded p-3">
                  {testResult.failure.message}
                </p>
              </div>
            </div>
          )}

          {/* Stack Trace - Standalone section */}
          {testResult.failure?.stackTrace && (
            <div className="mb-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <Code className="text-gray-600" size={16} />
                    <span>Stack Trace</span>
                  </h5>
                  <button 
                    onClick={() => copyToClipboard(testResult.failure.stackTrace)}
                    className="text-gray-600 hover:text-gray-800"
                    title="Copy stack trace"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <pre className="text-xs text-gray-800 whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto font-mono bg-white border rounded p-3">
                  {testResult.failure.stackTrace}
                </pre>
              </div>
            </div>
          )}

          {/* Additional Info - Renamed and moved to bottom */}
          <div className="mb-6">
            <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">{getFailureTypeIcon(testResult)}</span>
                    <h4 className="text-lg font-semibold text-blue-900">
                      Additional Info
                    </h4>
                  </div>

                  {/* Enhanced metadata display */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {/* File location with JUnit XML data */}
                    {(testResult.failure?.file || testResult.file) && (
                      <div className="flex items-center space-x-2 text-gray-700">
                        <FileText size={14} />
                        <span className="font-medium">Location:</span>
                        <span className="font-mono text-blue-700">
                          {testResult.failure?.file || testResult.file}
                          {(testResult.failure?.line || testResult.line) && `:${testResult.failure?.line || testResult.line}`}
                        </span>
                      </div>
                    )}

                    {/* Test method with JUnit XML data */}
                    {(testResult.failure?.method || testResult.method) && (
                      <div className="flex items-center space-x-2 text-gray-700">
                        <Code size={14} />
                        <span className="font-medium">Method:</span>
                        <span className="font-mono">{testResult.failure?.method || testResult.method}</span>
                      </div>
                    )}

                    {/* Test class with JUnit XML data */}
                    {(testResult.classname || testResult.failure?.classname) && (
                      <div className="flex items-center space-x-2 text-gray-700">
                        <span className="font-medium">Class:</span>
                        <span className="font-mono">{testResult.classname || testResult.failure?.classname}</span>
                      </div>
                    )}

                    {/* Execution time with JUnit XML data */}
                    {testResult.execution?.totalTime && (
                      <div className="flex items-center space-x-2 text-gray-700">
                        <Clock size={14} />
                        <span className="font-medium">Duration:</span>
                        <span>{(testResult.execution.totalTime * 1000).toFixed(0)}ms</span>
                      </div>
                    )}
                  </div>

                  {/* Framework information */}
                  <div className="mt-3">
                    {getFrameworkInfo(testResult)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-3">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 focus:ring-2 focus:ring-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FailureAnalysisModal;
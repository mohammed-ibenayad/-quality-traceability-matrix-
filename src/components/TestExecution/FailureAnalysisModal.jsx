// src/components/TestExecution/FailureAnalysisModal.jsx
// Modal version of the failure analysis panel for TestExecutionModal

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, FileText, Code, AlertCircle, CheckCircle, XCircle, Clock, X } from 'lucide-react';

const FailureAnalysisModal = ({ testResult, isOpen, onClose }) => {
  const [expandedSections, setExpandedSections] = useState(new Set(['failure-overview']));

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

  // ✅ Enhanced failure type detection with JUnit XML awareness
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

  // ✅ Enhanced failure insight generation with JUnit XML data
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

  // ✅ Enhanced parsing confidence indicator
  const getParsingConfidenceIndicator = (result) => {
    if (!result.failure) return null;
    
    const confidence = result.failure.parsingConfidence || 'none';
    const source = result.failure.parsingSource || 'unknown';
    
    const indicators = {
      'high': { icon: <CheckCircle size={14} />, color: 'text-green-600', bg: 'bg-green-100' },
      'medium': { icon: <AlertCircle size={14} />, color: 'text-yellow-600', bg: 'bg-yellow-100' },
      'low': { icon: <XCircle size={14} />, color: 'text-red-600', bg: 'bg-red-100' },
      'none': { icon: <XCircle size={14} />, color: 'text-gray-600', bg: 'bg-gray-100' }
    };

    const indicator = indicators[confidence] || indicators['none'];
    
    return (
      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs ${indicator.bg} ${indicator.color}`}>
        {indicator.icon}
        <span>{confidence} confidence</span>
        {source === 'junit-xml' && <span className="text-xs opacity-75">(XML)</span>}
      </div>
    );
  };

  // ✅ Enhanced framework info display
  const getFrameworkInfo = (result) => {
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
    
    // Fallback detection from execution metadata
    if (result.execution?.framework) {
      return (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span className="font-medium">Framework:</span>
          <span>{result.execution.framework}</span>
          {result.execution.junitSource && <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">XML</span>}
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
              </h3>
              <p className="text-sm text-gray-600">
                {testResult.name}
              </p>
            </div>
            {getParsingConfidenceIndicator(testResult)}
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
          {/* Failure Overview */}
          <div className="mb-6">
            <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">{getFailureTypeIcon(testResult)}</span>
                    <h4 className="text-lg font-semibold text-red-900">
                      {testResult.failure?.type || 'Test Failure'}
                    </h4>
                  </div>
                  
                  <p className="text-red-800 mb-3">
                    {getQuickInsight(testResult)}
                  </p>

                  {/* Enhanced metadata display */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {/* File location with JUnit XML data */}
                    {(testResult.failure?.file || testResult.file) && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <FileText size={14} />
                        <span className="font-medium">Location:</span>
                        <span className="font-mono text-blue-600">
                          {testResult.failure?.file || testResult.file}
                          {(testResult.failure?.line || testResult.line) && `:${testResult.failure?.line || testResult.line}`}
                        </span>
                      </div>
                    )}

                    {/* Test method with JUnit XML data */}
                    {(testResult.failure?.method || testResult.method) && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Code size={14} />
                        <span className="font-medium">Method:</span>
                        <span className="font-mono">{testResult.failure?.method || testResult.method}</span>
                      </div>
                    )}

                    {/* Test class with JUnit XML data */}
                    {(testResult.classname || testResult.failure?.classname) && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <span className="font-medium">Class:</span>
                        <span className="font-mono">{testResult.classname || testResult.failure?.classname}</span>
                      </div>
                    )}

                    {/* Execution time with JUnit XML data */}
                    {testResult.execution?.totalTime && (
                      <div className="flex items-center space-x-2 text-gray-600">
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

          <div className="space-y-4">
            {/* 1. FAILURE DETAILS - Always Expanded */}
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleSection('failure-overview')}
                className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center space-x-2">
                  <AlertCircle className="text-red-600" size={16} />
                  <span className="font-medium text-gray-900">Detailed Failure Analysis</span>
                  {testResult.failure?.parsingSource === 'junit-xml' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">JUnit XML</span>
                  )}
                </div>
                {expandedSections.has('failure-overview') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              
              {expandedSections.has('failure-overview') && (
                <div className="border-t border-gray-200 p-4">
                  {/* Enhanced assertion comparison for JUnit XML data */}
                  {testResult.failure?.assertion?.available && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <h5 className="font-semibold text-yellow-900 mb-3 flex items-center space-x-2">
                        <span>🔍</span>
                        <span>Expected vs Actual Values</span>
                        {testResult.failure.assertion.expression && (
                          <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded font-mono">
                            {testResult.failure.assertion.expression}
                          </span>
                        )}
                      </h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-green-700">Expected:</span>
                            <button 
                              onClick={() => copyToClipboard(testResult.failure.assertion.expected)}
                              className="text-green-600 hover:text-green-800"
                              title="Copy expected value"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                          <p className="text-sm text-green-900 font-mono bg-green-100 p-2 rounded">
                            {testResult.failure.assertion.expected || 'N/A'}
                          </p>
                        </div>
                        
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-red-700">Actual:</span>
                            <button 
                              onClick={() => copyToClipboard(testResult.failure.assertion.actual)}
                              className="text-red-600 hover:text-red-800"
                              title="Copy actual value"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                          <p className="text-sm text-red-900 font-mono bg-red-100 p-2 rounded">
                            {testResult.failure.assertion.actual || 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      {testResult.failure.assertion.operator && (
                        <div className="mt-3 text-center">
                          <span className="text-sm text-yellow-700">
                            Comparison: <span className="font-mono font-semibold">{testResult.failure.assertion.operator}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Enhanced stack trace with JUnit XML data */}
                  {testResult.failure?.stackTrace && (
                    <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Stack Trace:</span>
                        <button 
                          onClick={() => copyToClipboard(testResult.failure.stackTrace)}
                          className="text-gray-600 hover:text-gray-800"
                          title="Copy stack trace"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                      <pre className="text-xs text-gray-800 whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto font-mono bg-white border rounded p-2">
                        {testResult.failure.stackTrace}
                      </pre>
                    </div>
                  )}

                  {/* Message from JUnit XML or parsed output */}
                  {testResult.failure?.message && (
                    <div className="bg-gray-50 border border-gray-200 rounded p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Error Message:</span>
                        <button 
                          onClick={() => copyToClipboard(testResult.failure.message)}
                          className="text-gray-600 hover:text-gray-800"
                          title="Copy error message"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                      <p className="text-sm text-gray-800 bg-white border rounded p-2">
                        {testResult.failure.message}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. RAW OUTPUT - Collapsible */}
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleSection('raw-output')}
                className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center space-x-2">
                  <Code className="text-gray-600" size={16} />
                  <span className="font-medium text-gray-900">Complete Test Output</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {Math.round((testResult.rawOutput?.length || 0) / 1024 * 10) / 10}KB
                  </span>
                </div>
                {expandedSections.has('raw-output') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              
              {expandedSections.has('raw-output') && (
                <div className="border-t border-gray-200 p-4">
                  <div className="bg-gray-900 rounded p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300 font-medium text-sm">Full Framework Output</span>
                      <button 
                        onClick={() => copyToClipboard(testResult.rawOutput || '')}
                        className="text-gray-400 hover:text-white"
                        title="Copy all output"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                    <pre className="text-gray-100 text-sm whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto">
                      {testResult.rawOutput || 'No raw output available'}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* 3. PARSING DETAILS - Collapsible */}
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleSection('parsing-info')}
                className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center space-x-2">
                  <FileText className="text-gray-600" size={16} />
                  <span className="font-medium text-gray-900">Parsing Details</span>
                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                    testResult.failure?.parsingConfidence === 'high' ? 'bg-green-100 text-green-700' :
                    testResult.failure?.parsingConfidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {testResult.failure?.parsingConfidence || 'unknown'} confidence
                  </span>
                </div>
                {expandedSections.has('parsing-info') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              
              {expandedSections.has('parsing-info') && (
                <div className="border-t border-gray-200 p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Confidence:</span>
                      <p className="text-gray-600">{testResult.failure?.parsingConfidence || 'unknown'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Parsing Source:</span>
                      <p className="text-gray-600">
                        {testResult.failure?.parsingSource === 'junit-xml' ? 'JUnit XML (High Precision)' :
                         testResult.failure?.parsingSource === 'raw-output-fallback' ? 'Raw Output Fallback' :
                         testResult.failure?.parsingSource || 'Unknown'}
                      </p>
                    </div>
                    {testResult.execution && (
                      <>
                        <div>
                          <span className="font-medium text-gray-700">Test Suite:</span>
                          <p className="text-gray-600 font-mono text-xs">{testResult.execution.testSuite || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">JUnit Source:</span>
                          <p className="text-gray-600">{testResult.execution.junitSource ? 'Yes' : 'No'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
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
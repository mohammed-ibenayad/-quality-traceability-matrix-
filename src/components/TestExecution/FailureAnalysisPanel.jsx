// src/components/TestExecution/FailureAnalysisPanel.jsx
import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  AlertTriangle, 
  Bug, 
  Code, 
  FileText, 
  Copy,
  Zap,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';

const FailureAnalysisPanel = ({ testResult, isOpen, onClose }) => {
  // PHASE 1: Include parsing section in default expanded sections
  const [expandedSections, setExpandedSections] = useState(new Set(['summary', 'parsing']));

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

  // PHASE 1: Get parsing information from enhanced failure object
  const getParsingInfo = (testResult) => {
    if (!testResult.failure) return null;
    
    const { failure } = testResult;
    
    return {
      confidence: failure.parsingConfidence || 'unknown',
      source: failure.source || 'workflow',
      enhanced: failure.enhanced || false,
      hasRawOutput: !!testResult.rawOutput,
      method: failure.source === 'generic-parser' ? 'Generic deterministic' : 'Workflow specific',
      frameworkAgnostic: failure.source === 'generic-parser',
      extractedElements: failure.extracted ? {
        locations: failure.extracted.locations?.length || 0,
        exceptions: failure.extracted.exceptions?.length || 0,
        methods: failure.extracted.methods?.length || 0,
        classes: failure.extracted.classes?.length || 0
      } : null
    };
  };

  // PHASE 1: Get confidence badge styling
  const getConfidenceBadgeClass = (confidence) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-red-100 text-red-700';
      case 'none':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getFailureTypeIcon = (failureType) => {
    if (!failureType) return '❌';
    if (failureType.includes('Timeout')) return '⏱️';
    if (failureType.includes('Element')) return '🎯';
    if (failureType.includes('Assertion')) return '🔍';
    if (failureType.includes('Network') || failureType.includes('API')) return '🌐';
    return '❌';
  };

  const getSmartInsight = (failure, logs) => {
    if (!failure) return null;
    
    const { type, rawError } = failure;
    
    if (type === 'ElementNotInteractableException') {
      return {
        cause: 'Element interaction blocked - likely overlay or loading state',
        impact: 'User workflow interrupted - critical path blocked',
        quickFix: 'Add explicit wait for element or check for overlapping elements',
        confidence: 95,
        priority: 'High',
        category: 'UI Interaction'
      };
    }
    
    if (type === 'TimeoutException') {
      return {
        cause: 'Operation exceeded time limit - slow response or network issue',
        impact: 'Test execution delayed/failed - may indicate performance regression', 
        quickFix: 'Check API health, increase timeout, or verify network conditions',
        confidence: 88,
        priority: 'High',
        category: 'Performance/Network'
      };
    }
    
    if (type === 'AssertionError') {
      return {
        cause: 'Expected vs actual value mismatch - data or logic issue',
        impact: 'Validation failed - business logic or test data problem',
        quickFix: 'Verify test data, check business logic, update assertions',
        confidence: 92,
        priority: 'Medium',
        category: 'Data Validation'
      };
    }

    if (type === 'NoSuchElementException') {
      return {
        cause: 'Element not found - locator issue or page structure changed',
        impact: 'Test cannot proceed - element locator outdated',
        quickFix: 'Update element locator or check page structure changes',
        confidence: 90,
        priority: 'Medium', 
        category: 'Element Location'
      };
    }
    
    return {
      cause: 'Test execution error - see details for specific cause',
      impact: 'Test failed to complete successfully',
      quickFix: 'Review error details and execution logs for more context',
      confidence: 75,
      priority: 'Medium',
      category: 'General'
    };
  };

  const copyToClipboard = (text) => {
    document.execCommand('copy');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Passed':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'Failed':
        return <XCircle className="text-red-500" size={20} />;
      case 'Not Found':
        return <AlertTriangle className="text-yellow-500" size={20} />;
      default:
        return <Info className="text-gray-400" size={20} />;
    }
  };

  if (!isOpen || !testResult) return null;

  const insight = testResult.failure ? getSmartInsight(testResult.failure, testResult.logs) : null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto border w-11/12 max-w-5xl shadow-lg rounded-md bg-white">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{testResult.name || testResult.id}</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(testResult.status)}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    testResult.status === 'Passed' ? 'bg-green-100 text-green-800' :
                    testResult.status === 'Failed' ? 'bg-red-100 text-red-800' :
                    testResult.status === 'Not Found' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {testResult.status}
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  {testResult.duration}ms execution time
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle size={24} />
            </button>
          </div>

          {/* Content based on test status */}
          {testResult.status === 'Failed' && testResult.failure && (
            <div className="space-y-6">
              {/* Smart Insight Panel */}
              {insight && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{getFailureTypeIcon(testResult.failure.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-red-900">Failure Analysis</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            insight.priority === 'High' ? 'bg-red-100 text-red-700' :
                            insight.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {insight.priority} Priority
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            {insight.category}
                          </span>
                          {/* PHASE 1: Add parsing confidence badge */}
                          {getParsingInfo(testResult) && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              getConfidenceBadgeClass(getParsingInfo(testResult).confidence)
                            }`}>
                              {getParsingInfo(testResult).confidence} parsing
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-red-700">Root Cause: </span>
                          <span className="text-red-600">{insight.cause}</span>
                        </div>
                        <div>
                          <span className="font-medium text-red-700">Quick Fix: </span>
                          <span className="text-red-600">{insight.quickFix}</span>
                        </div>
                        <div>
                          <span className="font-medium text-red-700">Impact: </span>
                          <span className="text-red-600">{insight.impact}</span>
                        </div>
                        <div>
                          <span className="font-medium text-red-700">Confidence: </span>
                          <span className="text-red-600">{insight.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Details Section */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('error')}
                  className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-2">
                    <Bug className="text-red-500" size={16} />
                    <span className="font-medium">Error Details</span>
                    <span className="text-sm text-gray-500">({testResult.failure.type})</span>
                  </div>
                  {expandedSections.has('error') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                
                {expandedSections.has('error') && (
                  <div className="px-4 pb-4 border-t border-gray-200">
                    <div className="bg-gray-900 rounded p-4 mt-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-red-400 font-medium text-sm">{testResult.failure.type}</span>
                        <button 
                          onClick={() => copyToClipboard(testResult.failure.rawError)}
                          className="text-gray-400 hover:text-white"
                          title="Copy error details"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                      <pre className="text-red-300 text-sm mb-3 whitespace-pre-wrap">
                        {testResult.failure.rawError}
                      </pre>
                    </div>

                    {/* File Location */}
                    {testResult.failure.file && (
                      <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Code className="text-blue-600" size={16} />
                          <span className="font-medium text-blue-800">Source Location</span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="font-medium text-blue-700">File: </span>
                            <span className="text-blue-600 font-mono">{testResult.failure.file}</span>
                          </div>
                          {testResult.failure.line && (
                            <div>
                              <span className="font-medium text-blue-700">Line: </span>
                              <span className="text-blue-600">{testResult.failure.line}</span>
                            </div>
                          )}
                          {testResult.failure.method && (
                            <div>
                              <span className="font-medium text-blue-700">Method: </span>
                              <span className="text-blue-600 font-mono">{testResult.failure.method}</span>
                            </div>
                          )}
                          {testResult.failure.class && (
                            <div>
                              <span className="font-medium text-blue-700">Class: </span>
                              <span className="text-blue-600 font-mono">{testResult.failure.class}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Execution Context */}
              {testResult.execution && (
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection('execution')}
                    className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-2">
                      <Zap className="text-purple-500" size={16} />
                      <span className="font-medium">Execution Context</span>
                    </div>
                    {expandedSections.has('execution') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  
                  {expandedSections.has('execution') && (
                    <div className="px-4 pb-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Framework:</span>
                          <p className="text-gray-600">{testResult.execution.framework}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Exit Code:</span>
                          <p className="text-gray-600">{testResult.execution.exitCode}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Test Phase:</span>
                          <p className="text-gray-600">{testResult.failure.phase}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Duration:</span>
                          <p className="text-gray-600">{testResult.execution.pytestDuration}ms</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PHASE 1: Add Parsing Information Section */}
              {testResult.failure && (
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection('parsing')}
                    className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-2">
                      <Zap className="text-purple-500" size={16} />
                      <span className="font-medium">Parsing Information</span>
                      {getParsingInfo(testResult) && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          getConfidenceBadgeClass(getParsingInfo(testResult).confidence)
                        }`}>
                          {getParsingInfo(testResult).confidence} confidence
                        </span>
                      )}
                    </div>
                    {expandedSections.has('parsing') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  
                  {expandedSections.has('parsing') && (
                    <div className="px-4 pb-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Parsing Method:</span>
                          <p className="text-gray-600">{getParsingInfo(testResult)?.method || 'Unknown'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Source:</span>
                          <p className="text-gray-600">{getParsingInfo(testResult)?.source || 'workflow'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Framework Agnostic:</span>
                          <p className="text-gray-600">{getParsingInfo(testResult)?.frameworkAgnostic ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Enhanced:</span>
                          <p className="text-gray-600">{getParsingInfo(testResult)?.enhanced ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Confidence Level:</span>
                          <p className="text-gray-600">{getParsingInfo(testResult)?.confidence || 'unknown'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Raw Output:</span>
                          <p className="text-gray-600">{getParsingInfo(testResult)?.hasRawOutput ? 'Available' : 'Not available'}</p>
                        </div>
                      </div>
                      
                      {/* Show extracted elements if available */}
                      {getParsingInfo(testResult)?.extractedElements && (
                        <div className="mt-4 bg-gray-50 rounded p-3">
                          <h4 className="font-medium text-gray-700 mb-2">Extracted Elements:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <div>
                              <span className="font-medium">Locations:</span>
                              <span className="ml-1 text-gray-600">{getParsingInfo(testResult).extractedElements.locations}</span>
                            </div>
                            <div>
                              <span className="font-medium">Exceptions:</span>
                              <span className="ml-1 text-gray-600">{getParsingInfo(testResult).extractedElements.exceptions}</span>
                            </div>
                            <div>
                              <span className="font-medium">Methods:</span>
                              <span className="ml-1 text-gray-600">{getParsingInfo(testResult).extractedElements.methods}</span>
                            </div>
                            <div>
                              <span className="font-medium">Classes:</span>
                              <span className="ml-1 text-gray-600">{getParsingInfo(testResult).extractedElements.classes}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Show parsing confidence explanation */}
                      {getParsingInfo(testResult)?.confidence && (
                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3">
                          <h4 className="font-medium text-blue-800 mb-2">Confidence Explanation:</h4>
                          <p className="text-sm text-blue-700">
                            {getParsingInfo(testResult).confidence === 'high' && 
                              'High confidence: Multiple reliable patterns found with strong indicators.'}
                            {getParsingInfo(testResult).confidence === 'medium' && 
                              'Medium confidence: Some patterns found but may need verification.'}
                            {getParsingInfo(testResult).confidence === 'low' && 
                              'Low confidence: Limited patterns found, results may be unreliable.'}
                            {getParsingInfo(testResult).confidence === 'none' && 
                              'No parsing attempted: Using fallback failure object.'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* PHASE 1: Add Raw Output Section (if available) */}
              {testResult.rawOutput && (
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection('rawOutput')}
                    className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-2">
                      <Code className="text-indigo-500" size={16} />
                      <span className="font-medium">Raw Test Output</span>
                      <span className="text-xs text-gray-500">
                        ({Math.round(testResult.rawOutput.length / 1024 * 10) / 10}KB)
                      </span>
                    </div>
                    {expandedSections.has('rawOutput') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  
                  {expandedSections.has('rawOutput') && (
                    <div className="px-4 pb-4 border-t border-gray-200">
                      <div className="bg-gray-900 rounded p-4 mt-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-300 font-medium text-sm">Complete Test Framework Output</span>
                          <button 
                            onClick={() => copyToClipboard(testResult.rawOutput)}
                            className="text-gray-400 hover:text-white"
                            title="Copy raw output"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                        <pre className="text-gray-100 text-sm whitespace-pre-wrap overflow-x-auto max-h-80">
                          {testResult.rawOutput}
                        </pre>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        This raw output was captured from the test framework and used for enhanced parsing analysis.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* For Passed Tests */}
          {testResult.status === 'Passed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="text-green-500" size={20} />
                <div>
                  <h3 className="font-semibold text-green-900">Test Passed Successfully</h3>
                  <p className="text-green-700 text-sm">Executed in {testResult.duration}ms</p>
                </div>
              </div>
            </div>
          )}

          {/* For Not Found Tests */}
          {testResult.status === 'Not Found' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="text-yellow-500" size={20} />
                <div>
                  <h3 className="font-semibold text-yellow-900">Test Implementation Not Found</h3>
                  <p className="text-yellow-700 text-sm">No test methods matching '{testResult.id}' found in test suite</p>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Logs Section */}
          {testResult.logs && (
            <div className="border border-gray-200 rounded-lg mt-6">
              <button
                onClick={() => toggleSection('logs')}
                className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center space-x-2">
                  <FileText className="text-gray-500" size={16} />
                  <span className="font-medium">Execution Logs</span>
                </div>
                {expandedSections.has('logs') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              
              {expandedSections.has('logs') && (
                <div className="px-4 pb-4 border-t border-gray-200">
                  <div className="bg-gray-900 rounded p-4 mt-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300 font-medium text-sm">Test Execution Output</span>
                      <button 
                        onClick={() => copyToClipboard(testResult.logs)}
                        className="text-gray-400 hover:text-white"
                        title="Copy logs"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                    <pre className="text-gray-100 text-sm whitespace-pre-wrap overflow-x-auto max-h-80">
                      {testResult.logs}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FailureAnalysisPanel;

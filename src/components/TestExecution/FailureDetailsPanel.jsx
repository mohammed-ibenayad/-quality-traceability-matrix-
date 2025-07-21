import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  Code, 
  ChevronDown, 
  ChevronUp,
  FileText,
  Settings,
  Zap
} from 'lucide-react';

const FailureDetailsPanel = ({ testCase }) => {
  const [showFullTrace, setShowFullTrace] = useState(false);
  const [showFullLogs, setShowFullLogs] = useState(false);
  
  const failure = testCase.failure;
  const execution = testCase.execution;
  
  // Handle cases where there's no failure object but test failed
  const effectiveFailure = failure || {
    type: 'Unknown Error',
    message: testCase.status === 'Not Found' 
      ? 'Test result not found in artifacts' 
      : 'Test execution failed',
    source: 'fallback'
  };

  return (
    <div className="space-y-4 text-sm">
      {/* Error Summary */}
      <div className="flex items-start space-x-3">
        <AlertTriangle className={`${testCase.status === 'Failed' ? 'text-red-500' : 'text-orange-500'} mt-0.5 flex-shrink-0`} size={18} />
        <div className="flex-1 min-w-0">
          <div className={`font-medium ${testCase.status === 'Failed' ? 'text-red-800' : 'text-orange-800'}`}>
            {effectiveFailure.type || 'Test Failure'}
          </div>
          <div className={`mt-1 ${testCase.status === 'Failed' ? 'text-red-700' : 'text-orange-700'} break-words`}>
            {effectiveFailure.message || 'Test execution failed'}
          </div>
          
          {/* Parsing Source Info */}
          {effectiveFailure.parsingSource && (
            <div className="mt-2 flex items-center space-x-2">
              <span className="text-xs text-gray-500">Source:</span>
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                {effectiveFailure.parsingSource}
              </span>
              {effectiveFailure.parsingConfidence && (
                <span className={`text-xs px-2 py-1 rounded ${
                  effectiveFailure.parsingConfidence === 'high' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {effectiveFailure.parsingConfidence} confidence
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Assertion Details (if available) */}
      {effectiveFailure.assertion?.available && (
        <div className="bg-white p-3 rounded border border-red-200">
          <div className="flex items-center space-x-2 mb-3">
            <Zap className="text-red-600" size={14} />
            <span className="text-xs font-medium text-gray-700">ASSERTION DETAILS</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="font-medium text-green-700">Expected:</span>
              <div className="font-mono bg-green-50 p-2 rounded mt-1 border border-green-200 break-all">
                {effectiveFailure.assertion.expected || 'N/A'}
              </div>
            </div>
            <div>
              <span className="font-medium text-red-700">Actual:</span>
              <div className="font-mono bg-red-50 p-2 rounded mt-1 border border-red-200 break-all">
                {effectiveFailure.assertion.actual || 'N/A'}
              </div>
            </div>
          </div>
          {effectiveFailure.assertion.operator && (
            <div className="mt-2 text-xs text-gray-600">
              <span className="font-medium">Operator:</span> {effectiveFailure.assertion.operator}
            </div>
          )}
        </div>
      )}
      
      {/* Technical Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Error Location OR File Location */}
        <div className="space-y-1">
          <div className="flex items-center space-x-1 font-medium text-gray-600">
            <FileText size={12} />
            <span>{effectiveFailure.location ? 'Error Location' : 'File Location'}</span>
          </div>
          <div className="font-mono text-gray-800 break-all">
            {effectiveFailure.location 
              ? effectiveFailure.location.display 
              : (effectiveFailure.file || testCase.file || 'N/A')
            }
          </div>
          {effectiveFailure.location && (
            <div className="text-gray-500">Line {effectiveFailure.location.line}</div>
          )}
        </div>
        
        {/* Method */}
        <div className="space-y-1">
          <div className="flex items-center space-x-1 font-medium text-gray-600">
            <Code size={12} />
            <span>Method</span>
          </div>
          <div className="font-mono text-gray-800 break-all">
            {effectiveFailure.method || testCase.method || testCase.name}
          </div>
          {(effectiveFailure.classname || testCase.classname) && (
            <div className="text-gray-500 break-all">
              Class: {effectiveFailure.classname || testCase.classname}
            </div>
          )}
          {/* Show Error Type here if available */}
          {effectiveFailure.assertionType && (
            <div className="mt-1">
              <div className="text-gray-500 text-xs">Error Type:</div>
              <div className="font-mono text-red-700 text-xs">
                {effectiveFailure.assertionType}
              </div>
            </div>
          )}
        </div>
        
        {/* Framework */}
        <div className="space-y-1">
          <div className="flex items-center space-x-1 font-medium text-gray-600">
            <Settings size={12} />
            <span>Framework</span>
          </div>
          <div>
            {execution?.framework?.name || 'Unknown'}
            {execution?.framework?.version && (
              <span className="text-gray-500 ml-1">v{execution.framework.version}</span>
            )}
          </div>
          {execution?.parsingSource && (
            <div className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded inline-block">
              {execution.parsingSource}
            </div>
          )}
        </div>
        
        {/* Execution Time */}
        <div className="space-y-1">
          <div className="flex items-center space-x-1 font-medium text-gray-600">
            <Clock size={12} />
            <span>Execution Time</span>
          </div>
          <div className="text-gray-800">
            {testCase.duration ? `${testCase.duration}ms` : 'N/A'}
          </div>
          {testCase.lastExecuted && (
            <div className="text-gray-500 text-xs">
              {new Date(testCase.lastExecuted).toLocaleString()}
            </div>
          )}
        </div>
      </div>
      
      {/* Stack Trace Section */}
      {effectiveFailure.stackTrace && (
        <div className="space-y-2">
          <button
            onClick={() => setShowFullTrace(!showFullTrace)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <Code size={14} />
            <span className="text-xs font-medium">
              {showFullTrace ? 'Hide' : 'Show'} Stack Trace
            </span>
            {showFullTrace ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          
          {showFullTrace && (
            <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto max-h-64 overflow-y-auto">
              <pre className="whitespace-pre-wrap">{effectiveFailure.stackTrace}</pre>
            </div>
          )}
        </div>
      )}
      
      {/* Test Logs Section - Only show if available and different from failure message */}
      {testCase.logs && testCase.logs !== effectiveFailure.message && testCase.logs.trim() && (
        <div className="space-y-2">
          <button
            onClick={() => setShowFullLogs(!showFullLogs)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <FileText size={14} />
            <span className="text-xs font-medium">
              {showFullLogs ? 'Hide' : 'Show'} Execution Logs
            </span>
            {showFullLogs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          
          {showFullLogs && (
            <div className="bg-gray-100 p-3 rounded font-mono text-xs max-h-64 overflow-y-auto">
              <pre className="whitespace-pre-wrap">{testCase.logs}</pre>
            </div>
          )}
        </div>
      )}
      
      {/* Show message when no execution logs are available */}
      {(!testCase.logs || testCase.logs === effectiveFailure.message || !testCase.logs.trim()) && (
        <div className="text-xs text-gray-500 italic">
          📋 No execution logs available for this test
        </div>
      )}
      
      {/* Raw Output (if different from logs) */}
      {testCase.rawOutput && testCase.rawOutput !== testCase.logs && testCase.rawOutput.trim() && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-600 flex items-center space-x-1">
            <FileText size={12} />
            <span>RAW OUTPUT</span>
          </div>
          <div className="bg-gray-800 text-gray-300 p-3 rounded font-mono text-xs max-h-32 overflow-y-auto">
            <pre className="whitespace-pre-wrap">{testCase.rawOutput}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default FailureDetailsPanel;
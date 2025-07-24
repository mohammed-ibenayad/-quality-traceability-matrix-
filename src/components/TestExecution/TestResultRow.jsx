import React from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  ChevronDown, 
  ChevronRight,
  AlertTriangle,
  Bug,
  Eye,
  Copy
} from 'lucide-react';

const TestResultRow = ({ 
  result, 
  onToggleExpand, 
  isExpanded, 
  onRetryTest, 
  onViewLogs,
  openFailureAnalysis 
}) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'Running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Enhanced function to get the best available error type
  const getBestErrorType = (result) => {
    if (!result.failure) return null;
    
    // Priority 1: Specific error type from stack trace parsing (most specific)
    if (result.failure.assertionType) {
      return result.failure.assertionType; // "AssertionError", "SessionNotCreatedException", etc.
    }
    
    // Priority 2: Original type from XML (if not generic fallback)
    if (result.failure.type && 
        result.failure.type !== 'TestFailure' && 
        result.failure.type !== 'ExecutionError') {
      return result.failure.type;
    }
    
    // Priority 3: Category-based inference (convert category to proper type)
    if (result.failure.category) {
      const categoryToType = {
        'assertion': 'AssertionError',
        'timeout': 'TimeoutException', 
        'element': 'ElementException',
        'webdriver': 'WebDriverException',
        'network': 'NetworkException',
        'environment': 'EnvironmentError'
      };
      
      if (categoryToType[result.failure.category]) {
        return categoryToType[result.failure.category];
      }
    }
    
    // Priority 4: Generic fallbacks only as last resort
    if (result.failure.type === 'ExecutionError') {
      return 'Setup Error';
    }
    
    if (result.failure.type === 'TestFailure') {
      return 'Test Failure';
    }
    
    return 'Unknown Error';
  };

  const getErrorMessage = (result) => {
    if (!result.failure) return null;
    
    // Priority 1: Use parsed assertion (deterministic)
    if (result.failure.assertion?.available) {
      const { expected, actual, operator } = result.failure.assertion;
      if (expected && actual) {
        return `assert ${actual} ${operator || '=='} ${expected}`;
      }
    }
    
    // Priority 2: Use raw failure message (deterministic) 
    if (result.failure.message) {
      return result.failure.message;
    }
    
    // Priority 3: Use failure type (deterministic)
    return result.failure.type || 'Test failed';
  };

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* Main Row */}
      <div className="px-4 py-3 hover:bg-gray-50">
        <div className="grid grid-cols-12 gap-2 items-center">
          {/* Expand/Collapse */}
          <div className="col-span-1">
            {result.failure && (
              <button
                onClick={() => onToggleExpand(result.id)}
                className="p-1 hover:bg-gray-100 rounded"
                title="View error details"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>
            )}
          </div>

          {/* Test Case Info */}
          <div className="col-span-5">
            <div className="flex items-center space-x-2">
              {getStatusIcon(result.status)}
              <div className="min-w-0 flex-1">
                <div 
                  className="font-medium text-gray-900 truncate" 
                  title={result.id}
                >
                  {result.id}
                </div>
                <div 
                  className="text-xs text-gray-500 truncate" 
                  title={result.name}
                >
                  {result.name}
                </div>
              </div>
            </div>
          </div>

          {/* Status - Always show error type for failed tests */}
          <div className="col-span-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              result.status === 'Failed' ? 'bg-red-100 text-red-800' :
              result.status === 'Passed' ? 'bg-green-100 text-green-800' :
              result.status === 'Running' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {result.status}
            </span>
            
            {/* Always show error type for failed tests */}
            {result.failure && (
              <div 
                className="text-xs text-red-600 mt-1 truncate" 
                title={getBestErrorType(result)}
              >
                {getBestErrorType(result)}
              </div>
            )}
          </div>

          {/* Duration */}
          <div className="col-span-2">
            <span className="text-sm font-mono text-gray-600">
              {formatDuration(result.duration)}
            </span>
          </div>

          {/* Actions */}
          <div className="col-span-2">
            <div className="flex items-center space-x-1">
              {result.failure && (
                <button
                  onClick={() => openFailureAnalysis(result)}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Analyze failure"
                >
                  <Bug className="w-4 h-4 text-red-500" />
                </button>
              )}
              <button
                onClick={() => onViewLogs(result.id)}
                className="p-1 hover:bg-gray-100 rounded"
                title="View logs"
              >
                <Eye className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(result.id)}
                className="p-1 hover:bg-gray-100 rounded"
                title="Copy test ID"
              >
                <Copy className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Simplified Error Details */}
      {isExpanded && result.failure && (
        <div className="px-4 py-3 bg-gray-50 border-t">
          <div className="space-y-3">
            {/* Error Type Header */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-gray-700">
                  {getBestErrorType(result)}
                </span>
                {result.failure.parsingSource && (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    from {result.failure.parsingSource}
                  </span>
                )}
              </div>
              
              {/* Show the actual error message */}
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <pre className="text-xs text-red-700 whitespace-pre-wrap break-words">
                  {getErrorMessage(result)}
                </pre>
              </div>
            </div>

            {/* Assertion Details (if parsed) */}
            {result.failure.assertion?.available && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="text-sm font-medium text-green-900 mb-2">Assertion Details</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-medium">Expected:</span>
                    <div className="font-mono bg-white p-1 rounded border">
                      {result.failure.assertion.expected}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Actual:</span>
                    <div className="font-mono bg-white p-1 rounded border">
                      {result.failure.assertion.actual}
                    </div>
                  </div>
                </div>
                {result.failure.assertion.operator && (
                  <div className="mt-2 text-xs text-green-700">
                    <span className="font-medium">Operator:</span> {result.failure.assertion.operator}
                  </div>
                )}
              </div>
            )}

            {/* Stack Trace */}
            {result.failure.stackTrace && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Stack Trace</div>
                <div className="bg-gray-900 text-green-400 rounded-md p-3 max-h-32 overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap break-words">
                    {result.failure.stackTrace}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestResultRow;
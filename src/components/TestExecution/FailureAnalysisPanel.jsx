import React, { useState } from 'react';
import { 
  Copy, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  FileText,
  Code,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react';

const FailureAnalysisPanel = ({ testResult, isOpen, onClose }) => {
  const [expandedSections, setExpandedSections] = useState(new Set(['quick-debug']));
  
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Passed':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'Failed':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <AlertCircle className="text-yellow-500" size={20} />;
    }
  };

  const getFailureTypeIcon = (type) => {
    if (type?.includes('Timeout')) return '⏱️';
    if (type?.includes('Element')) return '🎯';
    if (type?.includes('Assertion')) return '🔍';
    if (type?.includes('Network') || type?.includes('API')) return '🌐';
    return '❌';
  };

  // Mock data for demonstration
  const mockTestResult = {
    id: "TC_001",
    name: "Verify Login Functionality",
    status: "Failed",
    duration: 2456,
    failure: {
      type: "AssertionError",
      file: "tests/test_login.py",
      line: 45,
      column: 12,
      method: "test_login_success",
      class: "LoginTestCase",
      rawError: "Expected: 'Welcome Dashboard' but got: 'Error: Invalid credentials'",
      assertion: {
        available: true,
        expected: "Welcome Dashboard",
        actual: "Error: Invalid credentials",
        operator: "=="
      },
      parsingConfidence: "high"
    },
    rawOutput: `============================= FAILURES =============================
___________________ LoginTestCase.test_login_success ___________________

self = <test_login.LoginTestCase testMethod=test_login_success>

    def test_login_success(self):
        self.driver.get("https://app.example.com/login")
        self.driver.find_element(By.ID, "username").send_keys("testuser")
        self.driver.find_element(By.ID, "password").send_keys("password123")
        self.driver.find_element(By.ID, "login-btn").click()
        
        welcome_text = self.driver.find_element(By.CLASS_NAME, "welcome-message").text
    >   assert welcome_text == "Welcome Dashboard"
    E   AssertionError: Expected: 'Welcome Dashboard' but got: 'Error: Invalid credentials'
    
    tests/test_login.py:45: AssertionError
    ========================= short test summary info =========================
    FAILED tests/test_login.py::LoginTestCase::test_login_success - AssertionError: Expected: 'Welcome Dashboard' but got: 'Error: Invalid credentials'
    =========================== 1 failed, 0 passed ===========================`
  };

  const result = testResult || mockTestResult;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-8 mx-auto border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
        {/* HEADER - Clean and Minimal */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {getStatusIcon(result.status)}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{result.name}</h2>
                <p className="text-sm text-gray-600">{result.id} • {result.duration}ms</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* MAIN CONTENT - Tester-Focused Layout */}
        <div className="p-6 space-y-6">
          
          {/* 1. QUICK DEBUG INFO - Always Visible, Most Important */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-2xl">{getFailureTypeIcon(result.failure?.type)}</span>
              <h3 className="font-semibold text-red-900 text-lg">What Failed</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-red-700">Error Type:</span>
                  <span className="text-sm text-red-900 font-mono bg-red-100 px-2 py-1 rounded">
                    {result.failure?.type || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-red-700">Location:</span>
                  <span className="text-sm text-red-900 font-mono bg-red-100 px-2 py-1 rounded">
                    {result.failure?.file}:{result.failure?.line}
                  </span>
                  <button 
                    onClick={() => copyToClipboard(`${result.failure?.file}:${result.failure?.line}`)}
                    className="text-red-600 hover:text-red-800"
                    title="Copy location"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-red-700">Method:</span>
                  <span className="text-sm text-red-900 font-mono bg-red-100 px-2 py-1 rounded">
                    {result.failure?.method || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-red-700">Class:</span>
                  <span className="text-sm text-red-900 font-mono bg-red-100 px-2 py-1 rounded">
                    {result.failure?.class || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            {/* Error Message - Large and Clear */}
            <div className="bg-red-100 border border-red-300 rounded p-3">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-red-700">Error Message:</span>
                <button 
                  onClick={() => copyToClipboard(result.failure?.rawError || '')}
                  className="text-red-600 hover:text-red-800"
                  title="Copy error message"
                >
                  <Copy size={14} />
                </button>
              </div>
              <p className="text-sm text-red-900 font-mono leading-relaxed">
                {result.failure?.rawError || 'No error message available'}
              </p>
            </div>
          </div>

          {/* 2. ASSERTION COMPARISON - For Assertion Failures */}
          {result.failure?.assertion?.available && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-3 flex items-center space-x-2">
                <span>🔍</span>
                <span>Expected vs Actual Values</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-green-700">Expected:</span>
                    <button 
                      onClick={() => copyToClipboard(result.failure.assertion.expected)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <p className="text-sm text-green-900 font-mono bg-green-100 p-2 rounded">
                    {result.failure.assertion.expected}
                  </p>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-red-700">Actual:</span>
                    <button 
                      onClick={() => copyToClipboard(result.failure.assertion.actual)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <p className="text-sm text-red-900 font-mono bg-red-100 p-2 rounded">
                    {result.failure.assertion.actual}
                  </p>
                </div>
              </div>
              
              <div className="mt-3 text-center">
                <span className="text-sm text-yellow-700">
                  Comparison: <span className="font-mono font-semibold">{result.failure.assertion.operator}</span>
                </span>
              </div>
            </div>
          )}

          {/* 3. RAW OUTPUT - Collapsible, Secondary */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('raw-output')}
              className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center space-x-2">
                <Code className="text-gray-600" size={16} />
                <span className="font-medium text-gray-900">Complete Test Output</span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {Math.round(result.rawOutput?.length / 1024 * 10) / 10 || 0}KB
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
                      onClick={() => copyToClipboard(result.rawOutput || '')}
                      className="text-gray-400 hover:text-white"
                      title="Copy all output"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <pre className="text-gray-100 text-sm whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto">
                    {result.rawOutput || result.testCase?.rawOutput || 'No raw output available'}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* 4. PARSING CONFIDENCE - Collapsed by Default */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('parsing-info')}
              className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center space-x-2">
                <FileText className="text-gray-600" size={16} />
                <span className="font-medium text-gray-900">Parsing Details</span>
                <span className={`text-xs px-2 py-1 rounded font-medium ${
                  result.failure?.parsingConfidence === 'high' ? 'bg-green-100 text-green-700' :
                  result.failure?.parsingConfidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {result.failure?.parsingConfidence || 'unknown'} confidence
                </span>
              </div>
              {expandedSections.has('parsing-info') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            
            {expandedSections.has('parsing-info') && (
              <div className="border-t border-gray-200 p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Confidence:</span>
                    <p className="text-gray-600">{result.failure?.parsingConfidence || 'unknown'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Parsing Method:</span>
                    <p className="text-gray-600">
                      {result.failure?.source === 'generic-parser' ? 'Generic deterministic' : 'Workflow specific'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default FailureAnalysisPanel;
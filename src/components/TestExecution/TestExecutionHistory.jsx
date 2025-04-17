import React from 'react';
import { Clock, Check, X, AlertTriangle, Calendar } from 'lucide-react';

/**
 * Component to display test execution history and details
 */
const TestExecutionHistory = ({ testCase }) => {
  if (!testCase) return null;

  // Format the execution date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never executed';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  // Get status icon and color based on test status
  const getStatusInfo = (status) => {
    switch (status) {
      case 'Passed':
        return { icon: <Check size={16} />, color: 'text-green-600 bg-green-100' };
      case 'Failed':
        return { icon: <X size={16} />, color: 'text-red-600 bg-red-100' };
      case 'Not Run':
        return { icon: <AlertTriangle size={16} />, color: 'text-yellow-600 bg-yellow-100' };
      default:
        return { icon: <AlertTriangle size={16} />, color: 'text-gray-600 bg-gray-100' };
    }
  };

  const { icon, color } = getStatusInfo(testCase.status);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-3">Test Execution Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Status</p>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-md ${color}`}>
            {icon}
            <span className="font-medium">{testCase.status}</span>
          </div>
        </div>
        
        <div>
          <p className="text-sm text-gray-600 mb-1">Last Executed</p>
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md">
            <Calendar size={16} className="text-gray-600" />
            <span>{formatDate(testCase.lastExecuted)}</span>
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-1">Execution Time</p>
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md">
          <Clock size={16} className="text-gray-600" />
          <span>{testCase.executionTime ? `${testCase.executionTime}ms` : 'Not available'}</span>
        </div>
      </div>
      
      <div>
        <p className="text-sm text-gray-600 mb-1">Automation Status</p>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-md ${
          testCase.automationStatus === 'Automated' 
            ? 'bg-blue-100 text-blue-600' 
            : testCase.automationStatus === 'Planned'
              ? 'bg-purple-100 text-purple-600'
              : 'bg-gray-100 text-gray-600'
        }`}>
          <span className="font-medium">{testCase.automationStatus}</span>
        </div>
      </div>
      
      {testCase.automationPath && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-1">Automation Script Path</p>
          <div className="px-3 py-2 bg-gray-100 rounded-md text-sm font-mono overflow-x-auto">
            {testCase.automationPath}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestExecutionHistory;
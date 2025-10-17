import React from 'react';
import { useWorkspaceContext } from '../../contexts/WorkspaceContext';

const TestCasesList = () => {
  const { currentWorkspace } = useWorkspaceContext();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Test Cases</h1>
        <p className="text-gray-500">
          Manage test cases for {currentWorkspace?.name || 'your workspace'}
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 text-center text-gray-500">
          No test cases found. Click "Add Test Case" to get started.
        </div>
      </div>
    </div>
  );
};

export default TestCasesList;
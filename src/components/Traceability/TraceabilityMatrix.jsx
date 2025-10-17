import React from 'react';
import { useWorkspaceContext } from '../../contexts/WorkspaceContext';

const TraceabilityMatrix = () => {
  const { currentWorkspace } = useWorkspaceContext();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Traceability Matrix</h1>
        <p className="text-gray-500">
          View relationships between requirements and test cases in {currentWorkspace?.name || 'your workspace'}
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 text-center text-gray-500">
          No data available. Add requirements and test cases to see the traceability matrix.
        </div>
      </div>
    </div>
  );
};

export default TraceabilityMatrix;
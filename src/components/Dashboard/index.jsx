import React from 'react';
import { useWorkspaceContext } from '../../contexts/WorkspaceContext';

const Dashboard = () => {
  const { currentWorkspace } = useWorkspaceContext();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">
          Welcome to the {currentWorkspace?.name || 'Quality Tracker'} workspace
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Summary Cards */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Requirements</h2>
          <div className="flex justify-between items-end">
            <div>
              <span className="text-3xl font-bold text-gray-900">0</span>
              <p className="text-sm text-gray-500 mt-1">Total Requirements</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-green-600">+0 this week</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Test Cases</h2>
          <div className="flex justify-between items-end">
            <div>
              <span className="text-3xl font-bold text-gray-900">0</span>
              <p className="text-sm text-gray-500 mt-1">Total Test Cases</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-green-600">+0 this week</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Coverage</h2>
          <div className="flex justify-between items-end">
            <div>
              <span className="text-3xl font-bold text-gray-900">0%</span>
              <p className="text-sm text-gray-500 mt-1">Test Coverage</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-yellow-600">No change</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-medium text-gray-900 mb-4">Recent Activity</h2>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 text-center text-gray-500">
            No recent activity found.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
// src/components/TestCases/BulkActionsPanel.jsx
import React, { useState } from 'react';
import { Play, Trash2, X, Settings, ChevronDown } from 'lucide-react';

/**
 * Enhanced Bulk Actions Panel Component
 * Provides bulk operations for selected test cases including version assignment
 */
const BulkActionsPanel = ({
  selectedCount,
  availableVersions = [],
  onVersionAssign,
  onExecuteTests,
  onBulkDelete,
  onClearSelection,
  onExport = null,
  className = ""
}) => {
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);

  if (selectedCount === 0) {
    return null;
  }

  const handleVersionAction = (action, versionId) => {
    if (onVersionAssign) {
      onVersionAssign(versionId, action);
    }
    setShowVersionDropdown(false);
  };

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Selection Info */}
        <div className="flex items-center space-x-3">
          <span className="text-blue-700 font-medium">
            {selectedCount} test case{selectedCount !== 1 ? 's' : ''} selected
          </span>
          
          {/* Quick selection indicator */}
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-blue-600">Ready for bulk actions</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Version Assignment Dropdown */}
          {availableVersions.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowVersionDropdown(!showVersionDropdown)}
                className="inline-flex items-center px-3 py-1 text-sm border border-blue-300 rounded-md bg-white text-blue-700 hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <Settings className="mr-1" size={14} />
                Version Actions
                <ChevronDown 
                  className={`ml-1 transform transition-transform ${showVersionDropdown ? 'rotate-180' : ''}`} 
                  size={14} 
                />
              </button>

              {/* Version Actions Dropdown */}
              {showVersionDropdown && (
                <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="py-1">
                    {/* Add to Version Section */}
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                      Add to Version
                    </div>
                    {availableVersions.map(version => (
                      <button
                        key={`add-${version.id}`}
                        onClick={() => handleVersionAction('add', version.id)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-800 flex items-center"
                      >
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                        Add to {version.name}
                      </button>
                    ))}

                    {/* Separator */}
                    <div className="border-t border-gray-100 my-1"></div>

                    {/* Remove from Version Section */}
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                      Remove from Version
                    </div>
                    {availableVersions.map(version => (
                      <button
                        key={`remove-${version.id}`}
                        onClick={() => handleVersionAction('remove', version.id)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-800 flex items-center"
                      >
                        <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                        Remove from {version.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Execute Tests Button */}
          <button
            onClick={onExecuteTests}
            disabled={selectedCount === 0}
            className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Execute selected test cases"
          >
            <Play className="mr-1" size={14} />
            Run Tests
          </button>

          {/* Export Button (Optional) */}
          {onExport && (
            <button
              onClick={onExport}
              className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm transition-colors"
              title="Export selected test cases"
            >
              <Settings className="mr-1" size={14} />
              Export
            </button>
          )}

          {/* Delete Button */}
          <button
            onClick={onBulkDelete}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center text-sm transition-colors"
            title="Delete selected test cases"
          >
            <Trash2 size={14} className="mr-1" />
            Delete Selected
          </button>

          {/* Clear Selection Button */}
          <button
            onClick={onClearSelection}
            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm transition-colors flex items-center"
            title="Clear current selection"
          >
            <X size={14} className="mr-1" />
            Clear
          </button>
        </div>
      </div>

      {/* Enhanced Selection Summary */}
      <div className="mt-3 pt-3 border-t border-blue-200">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4 text-blue-600">
            <span>Quick Actions Available:</span>
            <div className="flex items-center space-x-2">
              <span className="flex items-center">
                <Play size={12} className="mr-1" />
                Execute
              </span>
              {availableVersions.length > 0 && (
                <span className="flex items-center">
                  <Settings size={12} className="mr-1" />
                  Version Assignment
                </span>
              )}
              <span className="flex items-center">
                <Trash2 size={12} className="mr-1" />
                Delete
              </span>
            </div>
          </div>
          
          <div className="text-blue-500">
            Select more test cases for additional bulk operations
          </div>
        </div>
      </div>

      {/* Click outside handler to close dropdown */}
      {showVersionDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowVersionDropdown(false)}
        />
      )}
    </div>
  );
};

export default BulkActionsPanel;
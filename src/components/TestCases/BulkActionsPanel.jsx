// Enhanced BulkActionsPanel.jsx with better UX for many versions
import React, { useState, useMemo } from 'react';
import { Play, Trash2, X, Settings, ChevronDown, Search, Plus, Minus } from 'lucide-react';

/**
 * Enhanced Bulk Actions Panel with improved version selection UX
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
  const [versionSearchQuery, setVersionSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('add'); // 'add' or 'remove'

  if (selectedCount === 0) {
    return null;
  }

  // Filter versions based on search query
  const filteredVersions = useMemo(() => {
    if (!versionSearchQuery) return availableVersions;
    return availableVersions.filter(version => 
      version.name.toLowerCase().includes(versionSearchQuery.toLowerCase()) ||
      version.id.toLowerCase().includes(versionSearchQuery.toLowerCase())
    );
  }, [availableVersions, versionSearchQuery]);

  // Group versions by status or other criteria for better organization
  const groupedVersions = useMemo(() => {
    const groups = {
      active: [],
      planned: [],
      released: [],
      other: []
    };

    filteredVersions.forEach(version => {
      if (version.status === 'Active' || version.status === 'In Progress') {
        groups.active.push(version);
      } else if (version.status === 'Planned') {
        groups.planned.push(version);
      } else if (version.status === 'Released') {
        groups.released.push(version);
      } else {
        groups.other.push(version);
      }
    });

    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  }, [filteredVersions]);

  const handleVersionAction = (action, versionId) => {
    console.log('DEBUG: handleVersionAction called', { action, versionId });
    
    if (onVersionAssign) {
      onVersionAssign(versionId, action);
    }
    setShowVersionDropdown(false);
    setVersionSearchQuery(''); // Clear search when closing
  };

  const handleDropdownToggle = () => {
    const newState = !showVersionDropdown;
    setShowVersionDropdown(newState);
    if (!newState) {
      setVersionSearchQuery(''); // Clear search when closing
    }
  };

  const getGroupIcon = (groupKey) => {
    switch (groupKey) {
      case 'active': return '🚀';
      case 'planned': return '📋';
      case 'released': return '✅';
      default: return '📦';
    }
  };

  const getGroupTitle = (groupKey) => {
    switch (groupKey) {
      case 'active': return 'Active Versions';
      case 'planned': return 'Planned Versions';
      case 'released': return 'Released Versions';
      default: return 'Other Versions';
    }
  };

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Selection Info */}
        <div className="flex items-center space-x-3">
          <span className="text-blue-700 font-medium">
            {selectedCount} test case{selectedCount !== 1 ? 's' : ''} selected
          </span>
          
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-blue-600">Ready for bulk actions</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Enhanced Version Assignment Dropdown */}
          {availableVersions.length > 0 && (
            <div className="relative">
              <button
                onClick={handleDropdownToggle}
                className="inline-flex items-center px-3 py-1 text-sm border border-blue-300 rounded-md bg-white text-blue-700 hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <Settings className="mr-1" size={14} />
                Version Actions
                <span className="ml-1 text-xs bg-blue-100 px-1.5 py-0.5 rounded">
                  {availableVersions.length}
                </span>
                <ChevronDown 
                  className={`ml-1 transform transition-transform ${showVersionDropdown ? 'rotate-180' : ''}`} 
                  size={14} 
                />
              </button>

              {/* Enhanced Version Actions Dropdown */}
              {showVersionDropdown && (
                <div className="absolute right-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 flex flex-col">
                  {/* Header with Search */}
                  <div className="p-3 border-b border-gray-100">
                    <div className="relative mb-3">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                      <input
                        type="text"
                        placeholder="Search versions..."
                        value={versionSearchQuery}
                        onChange={(e) => setVersionSearchQuery(e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* Action Tabs */}
                    <div className="flex space-x-1 bg-gray-100 rounded p-1">
                      <button
                        onClick={() => setActiveTab('add')}
                        className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                          activeTab === 'add' 
                            ? 'bg-white text-green-700 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        <Plus size={12} className="inline mr-1" />
                        Add to Version
                      </button>
                      <button
                        onClick={() => setActiveTab('remove')}
                        className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                          activeTab === 'remove' 
                            ? 'bg-white text-red-700 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        <Minus size={12} className="inline mr-1" />
                        Remove from Version
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto">
                    {filteredVersions.length > 0 ? (
                      <div className="p-2">
                        {/* Show grouped versions if we have groups, otherwise show flat list */}
                        {Object.keys(groupedVersions).length > 1 ? (
                          // Grouped view
                          Object.entries(groupedVersions).map(([groupKey, versions]) => (
                            <div key={groupKey} className="mb-4">
                              <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center">
                                <span className="mr-1">{getGroupIcon(groupKey)}</span>
                                {getGroupTitle(groupKey)} ({versions.length})
                              </div>
                              <div className="space-y-1 mt-1">
                                {versions.map(version => (
                                  <button
                                    key={version.id}
                                    onClick={() => handleVersionAction(activeTab, version.id)}
                                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 flex items-center justify-between group ${
                                      activeTab === 'add' 
                                        ? 'hover:bg-green-50 hover:text-green-800' 
                                        : 'hover:bg-red-50 hover:text-red-800'
                                    }`}
                                  >
                                    <div className="flex items-center min-w-0 flex-1">
                                      <span className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${
                                        activeTab === 'add' ? 'bg-green-500' : 'bg-red-500'
                                      }`}></span>
                                      <div className="min-w-0 flex-1">
                                        <div className="font-medium truncate">{version.name}</div>
                                        {version.id !== version.name && (
                                          <div className="text-xs text-gray-500 truncate">{version.id}</div>
                                        )}
                                      </div>
                                    </div>
                                    {version.status && (
                                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded ml-2 flex-shrink-0">
                                        {version.status}
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          // Flat view for single group or ungrouped
                          <div className="space-y-1">
                            {filteredVersions.map(version => (
                              <button
                                key={version.id}
                                onClick={() => handleVersionAction(activeTab, version.id)}
                                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 flex items-center justify-between group ${
                                  activeTab === 'add' 
                                    ? 'hover:bg-green-50 hover:text-green-800' 
                                    : 'hover:bg-red-50 hover:text-red-800'
                                }`}
                              >
                                <div className="flex items-center min-w-0 flex-1">
                                  <span className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${
                                    activeTab === 'add' ? 'bg-green-500' : 'bg-red-500'
                                  }`}></span>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium truncate">{version.name}</div>
                                    {version.id !== version.name && (
                                      <div className="text-xs text-gray-500 truncate">{version.id}</div>
                                    )}
                                  </div>
                                </div>
                                {version.status && (
                                  <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded ml-2 flex-shrink-0">
                                    {version.status}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      // No results
                      <div className="p-6 text-center text-gray-500">
                        <Search size={32} className="mx-auto mb-2 text-gray-400" />
                        <div className="text-sm">
                          {versionSearchQuery 
                            ? `No versions found matching "${versionSearchQuery}"` 
                            : 'No versions available'
                          }
                        </div>
                        {versionSearchQuery && (
                          <button
                            onClick={() => setVersionSearchQuery('')}
                            className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer with stats */}
                  {filteredVersions.length > 0 && (
                    <div className="p-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-600">
                      <div className="flex items-center justify-between">
                        <span>
                          {filteredVersions.length} of {availableVersions.length} versions shown
                        </span>
                        <span className={`font-medium ${
                          activeTab === 'add' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {activeTab === 'add' ? 'Adding to' : 'Removing from'} selected versions
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Other action buttons remain the same */}
          <button
            onClick={onExecuteTests}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm transition-colors flex items-center"
            title="Execute selected test cases"
          >
            <Play size={14} className="mr-1" />
            Execute ({selectedCount})
          </button>

          {onExport && (
            <button
              onClick={onExport}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm transition-colors"
              title="Export selected test cases"
            >
              Export
            </button>
          )}

          <button
            onClick={onBulkDelete}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm transition-colors flex items-center"
            title="Delete selected test cases"
          >
            <Trash2 size={14} className="mr-1" />
            Delete
          </button>

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
                  Version Assignment ({availableVersions.length} versions)
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
          onClick={handleDropdownToggle}
        />
      )}
    </div>
  );
};

export default BulkActionsPanel;
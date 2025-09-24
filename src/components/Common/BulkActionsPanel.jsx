// Complete BulkActionsPanel.jsx - Enhanced with Tag Management and Generic Support
// Replace your entire BulkActionsPanel.jsx file with this content

import React, { useState, useMemo } from 'react';
import { 
  Play, 
  Trash2, 
  X, 
  Settings, 
  ChevronDown, 
  Search, 
  Plus, 
  Minus,
  Tag,
  FileDown,
  Check,
  AlertCircle,
  Hash
} from 'lucide-react';

/**
 * Enhanced Bulk Actions Panel with comprehensive tag editing and version management
 * Now supports both test cases and requirements
 */
const BulkActionsPanel = ({
  selectedCount,
  availableVersions = [],
  availableTags = [], // Available tags from items
  
  // NEW: Generic props to customize the component
  itemType = "test case", // "test case" or "requirement"
  showExecuteButton = true, // Only show for test cases
  showExportButton = false, // Can be enabled for both
  
  // Existing callbacks
  onVersionAssign,
  onTagsUpdate, // Callback for tag updates
  onExecuteTests,
  onBulkDelete,
  onClearSelection,
  onExport = null,
  className = ""
}) => {
  // Version management state
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [versionSearchQuery, setVersionSearchQuery] = useState('');
  const [versionActiveTab, setVersionActiveTab] = useState('add');

  // Tag management state
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [tagActiveTab, setTagActiveTab] = useState('add');
  const [customTagInput, setCustomTagInput] = useState('');
  const [selectedTagsForAction, setSelectedTagsForAction] = useState(new Set());

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

  // Filter tags based on search query
  const filteredTags = useMemo(() => {
    if (!tagSearchQuery) return availableTags;
    return availableTags.filter(tag => 
      tag.toLowerCase().includes(tagSearchQuery.toLowerCase())
    );
  }, [availableTags, tagSearchQuery]);

  // Group versions by status for better organization
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

  // Version action handlers
  const handleVersionAction = (action, versionId) => {
    if (onVersionAssign) {
      onVersionAssign(versionId, action);
    }
    setShowVersionDropdown(false);
    setVersionSearchQuery('');
  };

  // Tag action handlers
  const handleTagAction = (action, tags) => {
    if (onTagsUpdate) {
      onTagsUpdate(Array.isArray(tags) ? tags : [tags], action);
    }
    setShowTagsDropdown(false);
    setTagSearchQuery('');
    setCustomTagInput('');
    setSelectedTagsForAction(new Set());
  };

  const handleCustomTagAdd = () => {
    const trimmedTag = customTagInput.trim();
    if (trimmedTag && !availableTags.includes(trimmedTag)) {
      handleTagAction(tagActiveTab, [trimmedTag]);
    }
  };

  const handleBulkTagsAction = () => {
    if (selectedTagsForAction.size > 0) {
      handleTagAction(tagActiveTab, Array.from(selectedTagsForAction));
    }
  };

  const toggleTagSelection = (tag) => {
    setSelectedTagsForAction(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
      }
      return newSet;
    });
  };

  // Utility functions for version grouping
  const getGroupTitle = (groupKey) => {
    const titles = {
      active: 'Active',
      planned: 'Planned',
      released: 'Released',
      other: 'Other'
    };
    return titles[groupKey] || groupKey;
  };

  const getGroupIcon = (groupKey) => {
    const icons = {
      active: '🚀',
      planned: '📅',
      released: '✅',
      other: '📦'
    };
    return icons[groupKey] || '📦';
  };

  // Dropdown toggle handlers
  const handleVersionDropdownToggle = () => {
    setShowVersionDropdown(!showVersionDropdown);
    if (showTagsDropdown) setShowTagsDropdown(false);
  };

  const handleTagsDropdownToggle = () => {
    setShowTagsDropdown(!showTagsDropdown);
    if (showVersionDropdown) setShowVersionDropdown(false);
  };

  return (
    <div className={`relative bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Selection Info - UPDATED to be generic */}
        <div className="flex items-center space-x-2">
          <div className="text-blue-800 font-medium">
            {selectedCount} {itemType}{selectedCount !== 1 ? 's' : ''} selected
          </div>
        </div>

        {/* Action Buttons - LIGHTER OUTLINE STYLE */}
        <div className="flex items-center space-x-2">
          {/* Execute Tests Button - Only show for test cases */}
          {showExecuteButton && onExecuteTests && (
            <button
              onClick={onExecuteTests}
              className="px-3 py-1 border border-green-500 text-green-700 bg-green-50 rounded hover:bg-green-100 hover:border-green-600 text-sm transition-colors flex items-center"
              title={`Execute selected ${itemType}s`}
            >
              <Play size={14} className="mr-1" />
              Execute ({selectedCount})
            </button>
          )}

          {/* Version Assignment Dropdown */}
          {availableVersions.length > 0 && (
            <div className="relative">
              <button
                onClick={handleVersionDropdownToggle}
                className="px-3 py-1 border border-blue-500 text-blue-700 bg-blue-50 rounded hover:bg-blue-100 hover:border-blue-600 text-sm transition-colors flex items-center"
                title="Manage version assignments"
              >
                <Settings size={14} className="mr-1" />
                Versions ({availableVersions.length})
                <ChevronDown 
                  className={`ml-1 transform transition-transform ${showVersionDropdown ? 'rotate-180' : ''}`} 
                  size={14} 
                />
              </button>

              {/* Version Actions Dropdown */}
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
                        onClick={() => setVersionActiveTab('add')}
                        className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                          versionActiveTab === 'add' 
                            ? 'bg-white text-green-700 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        <Plus size={12} className="inline mr-1" />
                        Add to Version
                      </button>
                      <button
                        onClick={() => setVersionActiveTab('remove')}
                        className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                          versionActiveTab === 'remove' 
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
                                    onClick={() => handleVersionAction(versionActiveTab, version.id)}
                                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 flex items-center justify-between group ${
                                      versionActiveTab === 'add' 
                                        ? 'hover:bg-green-50 hover:text-green-800' 
                                        : 'hover:bg-red-50 hover:text-red-800'
                                    }`}
                                  >
                                    <div className="flex items-center min-w-0 flex-1">
                                      <span className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${
                                        versionActiveTab === 'add' ? 'bg-green-400' : 'bg-red-400'
                                      }`}></span>
                                      <div className="min-w-0 flex-1">
                                        <div className="font-medium truncate">{version.name}</div>
                                        {version.status && (
                                          <div className="text-xs text-gray-500">{version.status}</div>
                                        )}
                                      </div>
                                    </div>
                                    {versionActiveTab === 'add' ? (
                                      <Plus size={14} className="text-green-600 opacity-0 group-hover:opacity-100" />
                                    ) : (
                                      <Minus size={14} className="text-red-600 opacity-0 group-hover:opacity-100" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          // Flat view
                          <div className="space-y-1">
                            {filteredVersions.map(version => (
                              <button
                                key={version.id}
                                onClick={() => handleVersionAction(versionActiveTab, version.id)}
                                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 flex items-center justify-between group ${
                                  versionActiveTab === 'add' 
                                    ? 'hover:bg-green-50 hover:text-green-800' 
                                    : 'hover:bg-red-50 hover:text-red-800'
                                }`}
                              >
                                <div className="flex items-center min-w-0 flex-1">
                                  <span className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${
                                    versionActiveTab === 'add' ? 'bg-green-400' : 'bg-red-400'
                                  }`}></span>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium truncate">{version.name}</div>
                                    {version.status && (
                                      <div className="text-xs text-gray-500">{version.status}</div>
                                    )}
                                  </div>
                                </div>
                                {versionActiveTab === 'add' ? (
                                  <Plus size={14} className="text-green-600 opacity-0 group-hover:opacity-100" />
                                ) : (
                                  <Minus size={14} className="text-red-600 opacity-0 group-hover:opacity-100" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        {versionSearchQuery ? 'No versions found matching search' : 'No versions available'}
                      </div>
                    )}
                  </div>

                  {/* Action Summary - UPDATED to be generic */}
                  <div className="border-t border-gray-100 p-3 bg-gray-50 text-xs text-gray-600">
                    <div className="flex items-center justify-center">
                      <span className={`font-medium ${
                        versionActiveTab === 'add' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {versionActiveTab === 'add' ? 'Adding to' : 'Removing from'} selected versions
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tags Management Dropdown */}
          {availableTags.length > 0 && (
            <div className="relative">
              <button
                onClick={handleTagsDropdownToggle}
                className="px-3 py-1 border border-indigo-500 text-indigo-700 bg-indigo-50 rounded hover:bg-indigo-100 hover:border-indigo-600 text-sm transition-colors flex items-center"
                title="Manage tags"
              >
                <Hash size={14} className="mr-1" />
                Tags ({availableTags.length})
                <ChevronDown 
                  className={`ml-1 transform transition-transform ${showTagsDropdown ? 'rotate-180' : ''}`} 
                  size={14} 
                />
              </button>

              {/* Tags Actions Dropdown */}
              {showTagsDropdown && (
                <div className="absolute right-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 flex flex-col">
                  {/* Header with Search */}
                  <div className="p-3 border-b border-gray-100">
                    <div className="relative mb-3">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                      <input
                        type="text"
                        placeholder="Search tags..."
                        value={tagSearchQuery}
                        onChange={(e) => setTagSearchQuery(e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* Action Tabs */}
                    <div className="flex space-x-1 bg-gray-100 rounded p-1">
                      <button
                        onClick={() => setTagActiveTab('add')}
                        className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                          tagActiveTab === 'add' 
                            ? 'bg-white text-green-700 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        <Plus size={12} className="inline mr-1" />
                        Add Tags
                      </button>
                      <button
                        onClick={() => setTagActiveTab('remove')}
                        className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                          tagActiveTab === 'remove' 
                            ? 'bg-white text-red-700 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        <Minus size={12} className="inline mr-1" />
                        Remove Tags
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto">
                    {/* Custom Tag Input */}
                    <div className="p-3 border-b border-gray-100 bg-gray-50">
                      <div className="text-xs font-medium text-gray-700 mb-2">Add Custom Tag</div>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Enter tag name..."
                          value={customTagInput}
                          onChange={(e) => setCustomTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCustomTagAdd();
                            }
                          }}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={handleCustomTagAdd}
                          disabled={!customTagInput.trim() || availableTags.includes(customTagInput.trim())}
                          className="px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm transition-colors"
                          title="Add custom tag"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      {customTagInput.trim() && availableTags.includes(customTagInput.trim()) && (
                        <div className="text-xs text-amber-600 mt-1 flex items-center">
                          <AlertCircle size={12} className="mr-1" />
                          Tag already exists
                        </div>
                      )}
                    </div>

                    {/* Existing Tags */}
                    {filteredTags.length > 0 ? (
                      <div className="p-2">
                        <div className="text-xs font-medium text-gray-700 mb-2 px-1">
                          Existing Tags ({filteredTags.length})
                        </div>
                        
                        {/* Select All/None */}
                        <div className="flex justify-between items-center mb-2 px-1">
                          <button
                            onClick={() => setSelectedTagsForAction(new Set(filteredTags))}
                            className="text-xs text-indigo-600 hover:text-indigo-800"
                          >
                            Select All
                          </button>
                          <button
                            onClick={() => setSelectedTagsForAction(new Set())}
                            className="text-xs text-gray-600 hover:text-gray-800"
                          >
                            Select None
                          </button>
                        </div>

                        {/* Tag List */}
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {filteredTags.map(tag => (
                            <div
                              key={tag}
                              onClick={() => toggleTagSelection(tag)}
                              className={`flex items-center justify-between p-2 text-sm rounded cursor-pointer transition-colors ${
                                selectedTagsForAction.has(tag)
                                  ? (tagActiveTab === 'add' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200')
                                  : 'hover:bg-gray-50 border border-transparent'
                              }`}
                            >
                              <div className="flex items-center min-w-0 flex-1">
                                <span className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${
                                  selectedTagsForAction.has(tag)
                                    ? (tagActiveTab === 'add' ? 'bg-green-400' : 'bg-red-400')
                                    : 'bg-gray-300'
                                }`}></span>
                                <span className="truncate">{tag}</span>
                              </div>
                              {selectedTagsForAction.has(tag) && (
                                <Check size={14} className={tagActiveTab === 'add' ? 'text-green-600' : 'text-red-600'} />
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Apply Selected Tags */}
                        {selectedTagsForAction.size > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <button
                              onClick={handleBulkTagsAction}
                              className={`w-full px-3 py-2 text-sm font-medium rounded transition-colors ${
                                tagActiveTab === 'add'
                                  ? 'bg-green-600 text-white hover:bg-green-700'
                                  : 'bg-red-600 text-white hover:bg-red-700'
                              }`}
                            >
                              {tagActiveTab === 'add' ? 'Add' : 'Remove'} {selectedTagsForAction.size} Tag{selectedTagsForAction.size !== 1 ? 's' : ''}
                              {tagActiveTab === 'add' ? (
                                <Plus size={14} className="ml-1 inline" />
                              ) : (
                                <Minus size={14} className="ml-1 inline" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        {tagSearchQuery ? 'No tags found matching search' : 'No tags available'}
                      </div>
                    )}
                  </div>

                  {/* Action Summary - UPDATED to be generic */}
                  <div className="border-t border-gray-100 p-3 bg-gray-50 text-xs text-gray-600">
                    <div className="flex items-center justify-center">
                      <span className={`font-medium ${
                        tagActiveTab === 'add' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {tagActiveTab === 'add' ? 'Adding' : 'Removing'} tags {tagActiveTab === 'add' ? 'to' : 'from'} selected {itemType}s
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Export Button - Show conditionally */}
          {showExportButton && onExport && (
            <button
              onClick={onExport}
              className="px-3 py-1 border border-orange-500 text-orange-700 bg-orange-50 rounded hover:bg-orange-100 hover:border-orange-600 text-sm transition-colors flex items-center"
              title={`Export selected ${itemType}s`}
            >
              <FileDown size={14} className="mr-1" />
              Export ({selectedCount})
            </button>
          )}

          {/* Delete Button - UPDATED tooltip to be generic */}
          <button
            onClick={onBulkDelete}
            className="px-3 py-1 border border-red-500 text-red-700 bg-red-50 rounded hover:bg-red-100 hover:border-red-600 text-sm transition-colors flex items-center"
            title={`Delete selected ${itemType}s`}
          >
            <Trash2 size={14} className="mr-1" />
            Delete ({selectedCount})
          </button>

          {/* Clear Selection - UPDATED tooltip to be generic */}
          <button
            onClick={onClearSelection}
            className="px-3 py-1 border border-gray-400 text-gray-700 bg-gray-50 rounded hover:bg-gray-100 hover:border-gray-500 text-sm transition-colors flex items-center"
            title="Clear current selection"
          >
            <X size={14} className="mr-1" />
            Clear ({selectedCount})
          </button>
        </div>
      </div>

      {/* Enhanced Selection Summary - UPDATED to be generic */}
      <div className="mt-3 pt-3 border-t border-blue-200">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4 text-blue-600">
            <span>Quick Actions Available:</span>
            <div className="flex items-center space-x-2">
              {showExecuteButton && onExecuteTests && (
                <span className="flex items-center">
                  <Play size={12} className="mr-1" />
                  Execute ({selectedCount})
                </span>
              )}
              {availableVersions.length > 0 && (
                <span className="flex items-center">
                  <Settings size={12} className="mr-1" />
                  Version Management ({availableVersions.length} versions)
                </span>
              )}
              {availableTags.length > 0 && (
                <span className="flex items-center">
                  <Hash size={12} className="mr-1" />
                  Tag Management ({availableTags.length} tags)
                </span>
              )}
              <span className="flex items-center">
                <Trash2 size={12} className="mr-1" />
                Delete ({selectedCount})
              </span>
            </div>
          </div>
          
          <div className="text-blue-500">
            {selectedCount === 1 ? 
              `Select more ${itemType}s for additional bulk operations` : 
              `${selectedCount} ${itemType}s selected`}
          </div>
        </div>
      </div>

      {/* Click outside handler to close dropdowns */}
      {(showVersionDropdown || showTagsDropdown) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowVersionDropdown(false);
            setShowTagsDropdown(false);
          }}
        />
      )}
    </div>
  );
};

export default BulkActionsPanel;
import React, { useState, useMemo } from 'react';
import RightSidebarPanel, {
  SidebarSection,
  SidebarActionButton,
  SidebarBadge
} from './RightSidebarPanel';
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
  Hash,
  CheckSquare,
  AlertTriangle
} from 'lucide-react';

/**
 * Enhanced Bulk Actions Panel - For Right Sidebar
 * Combines version management, tag management, and bulk operations
 * Supports both requirements and test cases
 */
const BulkActionsPanel = ({
  selectedCount = 0,
  selectedItems = [],
  availableVersions = [],
  availableTags = [],
  
  // Generic props to customize the component
  itemType = "requirement", // "requirement" or "test case"
  showExecuteButton = false, // Only show for test cases
  showExportButton = true,
  automatedCount = 0,
  
  // Callbacks
  onVersionAssign,
  onTagsUpdate,
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

  // Calculate stats about selection
  const stats = {
    highPriority: selectedItems.filter(r => r.priority === 'High').length,
    mediumPriority: selectedItems.filter(r => r.priority === 'Medium').length,
    lowPriority: selectedItems.filter(r => r.priority === 'Low').length,
  };

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

  return (
    <RightSidebarPanel
      title="Bulk Actions"
      onClose={onClearSelection}
    >
      {/* Selection Header */}
      <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <CheckSquare size={20} />
              <span className="text-lg font-bold">{selectedCount}</span>
            </div>
            <div className="text-sm text-blue-100 mt-1">
              {itemType.charAt(0).toUpperCase() + itemType.slice(1)}{selectedCount !== 1 ? 's' : ''} Selected
            </div>
          </div>
          <button
            onClick={onClearSelection}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            title="Clear selection"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4 bg-blue-50 border-b border-blue-200">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-red-600">{stats.highPriority}</div>
            <div className="text-xs text-gray-600">High</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-600">{stats.mediumPriority}</div>
            <div className="text-xs text-gray-600">Medium</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">{stats.lowPriority}</div>
            <div className="text-xs text-gray-600">Low</div>
          </div>
        </div>
      </div>

      {/* Warning if risky operation */}
      {stats.highPriority > 0 && (
        <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 mx-4 mt-4 rounded">
          <div className="flex items-start">
            <AlertTriangle size={16} className="text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-xs text-yellow-800">
              <strong>Caution:</strong> {stats.highPriority} high-priority {itemType}{stats.highPriority !== 1 ? 's' : ''} selected.
              Please review changes carefully.
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <SidebarSection title="Quick Actions" defaultOpen={true}>
        <div className="space-y-2">
          {/* Execute Tests Button - Only for test cases */}
          {showExecuteButton && onExecuteTests && (
            <SidebarActionButton
              icon={<Play size={16} />}
              label={`Execute ${automatedCount > 0 ? `${automatedCount} Automated` : selectedCount} Test${selectedCount !== 1 ? 's' : ''}`}
              onClick={onExecuteTests}
              variant="primary"
              disabled={automatedCount === 0}
            />
          )}

          {/* Version Management Dropdown */}
          {availableVersions.length > 0 && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowVersionDropdown(!showVersionDropdown);
                  setShowTagsDropdown(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center text-sm text-gray-700">
                  <Settings size={16} className="mr-2" />
                  Manage Versions
                </span>
                <ChevronDown size={16} className={`text-gray-500 transition-transform ${showVersionDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showVersionDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden flex flex-col">
                  {/* Tab Selector */}
                  <div className="flex border-b border-gray-200 bg-gray-50">
                    <button
                      onClick={() => setVersionActiveTab('add')}
                      className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                        versionActiveTab === 'add'
                          ? 'text-green-600 bg-green-50 border-b-2 border-green-600'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <Plus size={14} className="inline mr-1" />
                      Add to Versions
                    </button>
                    <button
                      onClick={() => setVersionActiveTab('remove')}
                      className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                        versionActiveTab === 'remove'
                          ? 'text-red-600 bg-red-50 border-b-2 border-red-600'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <Minus size={14} className="inline mr-1" />
                      Remove from Versions
                    </button>
                  </div>

                  {/* Search Box */}
                  <div className="p-2 border-b border-gray-100">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        value={versionSearchQuery}
                        onChange={(e) => setVersionSearchQuery(e.target.value)}
                        placeholder="Search versions..."
                        className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  {/* Version Groups */}
                  <div className="overflow-y-auto max-h-60">
                    {Object.keys(groupedVersions).length > 0 ? (
                      Object.entries(groupedVersions).map(([groupKey, versions]) => (
                        <div key={groupKey} className="border-b border-gray-100 last:border-b-0">
                          <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase flex items-center">
                            <span className="mr-2">{getGroupIcon(groupKey)}</span>
                            {getGroupTitle(groupKey)}
                            <span className="ml-auto text-gray-400">({versions.length})</span>
                          </div>
                          <div>
                            {versions.map(version => (
                              <button
                                key={version.id}
                                onClick={() => handleVersionAction(versionActiveTab, version.id)}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                                  versionActiveTab === 'add' ? 'hover:bg-green-50' : 'hover:bg-red-50'
                                }`}
                              >
                                <span className="text-gray-700">{version.name}</span>
                                {versionActiveTab === 'add' ? (
                                  <Plus size={14} className="text-green-600" />
                                ) : (
                                  <Minus size={14} className="text-red-600" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        {versionSearchQuery ? 'No versions found' : 'No versions available'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tag Management Dropdown */}
          {availableTags.length > 0 && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowTagsDropdown(!showTagsDropdown);
                  setShowVersionDropdown(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center text-sm text-gray-700">
                  <Tag size={16} className="mr-2" />
                  Manage Tags
                </span>
                <ChevronDown size={16} className={`text-gray-500 transition-transform ${showTagsDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showTagsDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden flex flex-col">
                  {/* Tab Selector */}
                  <div className="flex border-b border-gray-200 bg-gray-50">
                    <button
                      onClick={() => setTagActiveTab('add')}
                      className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                        tagActiveTab === 'add'
                          ? 'text-green-600 bg-green-50 border-b-2 border-green-600'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <Plus size={14} className="inline mr-1" />
                      Add Tags
                    </button>
                    <button
                      onClick={() => setTagActiveTab('remove')}
                      className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                        tagActiveTab === 'remove'
                          ? 'text-red-600 bg-red-50 border-b-2 border-red-600'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <Minus size={14} className="inline mr-1" />
                      Remove Tags
                    </button>
                  </div>

                  {/* Search Box */}
                  <div className="p-2 border-b border-gray-100">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        value={tagSearchQuery}
                        onChange={(e) => setTagSearchQuery(e.target.value)}
                        placeholder="Search tags..."
                        className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  {/* Custom Tag Input */}
                  <div className="p-2 border-b border-gray-100 bg-indigo-50">
                    <div className="text-xs font-medium text-indigo-700 mb-2 px-1">
                      Create Custom Tag
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={customTagInput}
                        onChange={(e) => setCustomTagInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCustomTagAdd();
                          }
                        }}
                        placeholder="Enter new tag..."
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={handleCustomTagAdd}
                        disabled={!customTagInput.trim() || availableTags.includes(customTagInput.trim())}
                        className="px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm transition-colors"
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

                  {/* Tags List */}
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
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      {tagSearchQuery ? 'No tags found' : 'No tags available'}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Export Button */}
          {showExportButton && onExport && (
            <SidebarActionButton
              icon={<FileDown size={16} />}
              label={`Export ${selectedCount} Item${selectedCount !== 1 ? 's' : ''}`}
              onClick={onExport}
              variant="secondary"
            />
          )}
        </div>
      </SidebarSection>

      {/* Selected Items List */}
      <SidebarSection
        title={`Selected Items (${selectedCount})`}
        defaultOpen={selectedCount <= 5}
      >
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {selectedItems.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-mono text-xs text-blue-600 font-semibold">
                  {item.id}
                </span>
                <SidebarBadge
                  label={item.priority}
                  color={
                    item.priority === 'High' ? 'red' :
                    item.priority === 'Medium' ? 'yellow' : 'green'
                  }
                />
              </div>
              <div className="text-sm text-gray-900 line-clamp-2">
                {item.name || item.title}
              </div>
            </div>
          ))}
        </div>
      </SidebarSection>

      {/* Danger Zone */}
      <div className="p-4 border-t-2 border-red-100 bg-red-50">
        <h3 className="text-xs font-semibold text-red-700 uppercase mb-3 flex items-center">
          <AlertTriangle size={14} className="mr-1" />
          Danger Zone
        </h3>
        <SidebarActionButton
          icon={<Trash2 size={16} />}
          label={`Delete ${selectedCount} ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}${selectedCount !== 1 ? 's' : ''}`}
          onClick={onBulkDelete}
          variant="danger"
        />
        <p className="text-xs text-red-600 mt-2">
          This action cannot be undone. Please confirm before proceeding.
        </p>
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
    </RightSidebarPanel>
  );
};

export default BulkActionsPanel;
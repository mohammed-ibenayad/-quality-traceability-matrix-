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
 * With multi-select tag support and database persistence
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

  // Calculate which tags are currently assigned to ALL selected items
  const commonAssignedTags = useMemo(() => {
    if (selectedItems.length === 0) return [];
    
    // Get tags from first item
    const firstItemTags = new Set(selectedItems[0].tags || []);
    
    // Filter to only tags that exist on ALL selected items
    return Array.from(firstItemTags).filter(tag => 
      selectedItems.every(item => (item.tags || []).includes(tag))
    );
  }, [selectedItems]);

  // Calculate which tags are assigned to SOME (but not all) selected items
  const partiallyAssignedTags = useMemo(() => {
    if (selectedItems.length === 0) return [];
    
    const allTags = new Set();
    selectedItems.forEach(item => {
      (item.tags || []).forEach(tag => allTags.add(tag));
    });
    
    return Array.from(allTags).filter(tag => 
      !commonAssignedTags.includes(tag)
    );
  }, [selectedItems, commonAssignedTags]);

  // For Add tab: separate assigned vs unassigned tags
  const unassignedTags = useMemo(() => {
    return availableTags.filter(tag => 
      !commonAssignedTags.includes(tag) && !partiallyAssignedTags.includes(tag)
    );
  }, [availableTags, commonAssignedTags, partiallyAssignedTags]);

  const assignedTags = useMemo(() => {
    return availableTags.filter(tag => 
      commonAssignedTags.includes(tag) || partiallyAssignedTags.includes(tag)
    );
  }, [availableTags, commonAssignedTags, partiallyAssignedTags]);

  // For Remove tab: only show assigned tags
  const removableTags = useMemo(() => {
    return [...commonAssignedTags, ...partiallyAssignedTags];
  }, [commonAssignedTags, partiallyAssignedTags]);

  // Filter tags based on search query and active tab
  const filteredTagsForAdd = useMemo(() => {
    const tagsToFilter = tagActiveTab === 'add' 
      ? [...unassignedTags, ...assignedTags]  // Show all, but assigned will be grayed out
      : removableTags;  // Only show assigned tags

    if (!tagSearchQuery) return tagsToFilter;
    return tagsToFilter.filter(tag =>
      tag.toLowerCase().includes(tagSearchQuery.toLowerCase())
    );
  }, [tagActiveTab, unassignedTags, assignedTags, removableTags, tagSearchQuery]);

  // Filter versions based on search query
  const filteredVersions = useMemo(() => {
    if (!versionSearchQuery) return availableVersions;
    return availableVersions.filter(version =>
      version.name.toLowerCase().includes(versionSearchQuery.toLowerCase()) ||
      version.id.toLowerCase().includes(versionSearchQuery.toLowerCase())
    );
  }, [availableVersions, versionSearchQuery]);

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

  // Toggle tag selection for multi-select
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

  // Apply selected tags
  const handleApplyTagsAction = () => {
    if (selectedTagsForAction.size > 0 && onTagsUpdate) {
      const tagsArray = Array.from(selectedTagsForAction);
      onTagsUpdate(tagsArray, tagActiveTab);
      
      // Clear selection and close dropdown
      setSelectedTagsForAction(new Set());
      setShowTagsDropdown(false);
      setTagSearchQuery('');
    }
  };

  // Handle custom tag creation
  const handleCustomTagAdd = () => {
    const trimmedTag = customTagInput.trim();
    if (trimmedTag && !availableTags.includes(trimmedTag)) {
      // Add custom tag to selection
      setSelectedTagsForAction(prev => new Set([...prev, trimmedTag]));
      setCustomTagInput('');
    }
  };

  // Select all visible tags (for current tab)
  const handleSelectAllTags = () => {
    const tagsToSelect = tagActiveTab === 'add' 
      ? filteredTagsForAdd.filter(tag => !isTagFullyAssigned(tag))  // Only unassigned in Add tab
      : filteredTagsForAdd;  // All tags in Remove tab
    
    setSelectedTagsForAction(new Set(tagsToSelect));
  };

  // Clear tag selection
  const handleClearTagSelection = () => {
    setSelectedTagsForAction(new Set());
  };

  // Check if a tag is assigned (common or partial)
  const isTagAssigned = (tag) => {
    return commonAssignedTags.includes(tag) || partiallyAssignedTags.includes(tag);
  };

  // Check if a tag is partially assigned
  const isTagPartial = (tag) => {
    return partiallyAssignedTags.includes(tag);
  };

  // NEW: Check if a tag is fully assigned (on ALL items)
  const isTagFullyAssigned = (tag) => {
    return commonAssignedTags.includes(tag);
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
            <div className="text-xs text-gray-600">High Priority</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-600">{stats.mediumPriority}</div>
            <div className="text-xs text-gray-600">Medium</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">{stats.lowPriority}</div>
            <div className="text-xs text-gray-600">Low Priority</div>
          </div>
        </div>
      </div>

      {/* Actions Section */}
      <SidebarSection title="Actions" defaultOpen={true}>
        <div className="space-y-3">
          {/* Execute Tests Button (Test Cases Only) */}
          {showExecuteButton && (
            <SidebarActionButton
              icon={<Play size={16} />}
              label={`Execute ${automatedCount} Automated Test${automatedCount !== 1 ? 's' : ''}`}
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
                      className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${versionActiveTab === 'add'
                        ? 'text-green-600 bg-green-50 border-b-2 border-green-600'
                        : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                      <Plus size={14} className="inline mr-1" />
                      Add to Versions
                    </button>
                    <button
                      onClick={() => setVersionActiveTab('remove')}
                      className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${versionActiveTab === 'remove'
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
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${versionActiveTab === 'add' ? 'hover:bg-green-50' : 'hover:bg-red-50'
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
                  setSelectedTagsForAction(new Set()); // Clear selection when opening
                }}
                className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center text-sm text-gray-700">
                  <Tag size={16} className="mr-2" />
                  Manage Tags
                  {selectedTagsForAction.size > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                      {selectedTagsForAction.size}
                    </span>
                  )}
                </span>
                <ChevronDown size={16} className={`text-gray-500 transition-transform ${showTagsDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showTagsDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden flex flex-col">
                  {/* Tab Selector */}
                  <div className="flex border-b border-gray-200 bg-gray-50">
                    <button
                      onClick={() => {
                        setTagActiveTab('add');
                        setSelectedTagsForAction(new Set());
                      }}
                      className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${tagActiveTab === 'add'
                        ? 'text-green-600 bg-green-50 border-b-2 border-green-600'
                        : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                      <Plus size={14} className="inline mr-1" />
                      Add Tags
                    </button>
                    <button
                      onClick={() => {
                        setTagActiveTab('remove');
                        setSelectedTagsForAction(new Set());
                      }}
                      className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${tagActiveTab === 'remove'
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
                        placeholder={tagActiveTab === 'add' ? "Search all tags..." : "Search assigned tags..."}
                        className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  {/* Custom Tag Input (Only in Add Tab) */}
                  {tagActiveTab === 'add' && (
                    <div className="p-2 border-b border-gray-100 bg-blue-50">
                      <div className="text-xs font-medium text-blue-700 mb-2 px-1">
                        Create New Tag
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
                          placeholder="Enter new tag name..."
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={handleCustomTagAdd}
                          disabled={!customTagInput.trim() || availableTags.includes(customTagInput.trim())}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
                  )}

                  {/* Selection Controls */}
                  {filteredTagsForAdd.length > 0 && (
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleSelectAllTags}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Select All {tagActiveTab === 'add' ? 'Available' : ''}
                        </button>
                        {selectedTagsForAction.size > 0 && (
                          <>
                            <span className="text-gray-400">|</span>
                            <button
                              onClick={handleClearTagSelection}
                              className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                            >
                              Clear
                            </button>
                          </>
                        )}
                      </div>
                      {selectedTagsForAction.size > 0 && (
                        <span className="text-xs text-gray-600">
                          {selectedTagsForAction.size} selected
                        </span>
                      )}
                    </div>
                  )}

                  {/* Tags List */}
                  {filteredTagsForAdd.length > 0 ? (
                    <div className="overflow-y-auto max-h-48">
                      {tagActiveTab === 'add' ? (
                        <>
                          {/* Unassigned or Partially Assigned Tags (Active/Clickable) */}
                          {filteredTagsForAdd.filter(tag => !isTagFullyAssigned(tag)).length > 0 && (
                            <div className="border-b border-gray-100">
                              <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase flex items-center">
                                <span className="mr-2">➕</span>
                                Available Tags
                                <span className="ml-auto text-gray-400">
                                  ({filteredTagsForAdd.filter(tag => !isTagFullyAssigned(tag)).length})
                                </span>
                              </div>
                              <div>
                                {filteredTagsForAdd.filter(tag => !isTagFullyAssigned(tag)).map(tag => (
                                  <button
                                    key={tag}
                                    onClick={() => toggleTagSelection(tag)}
                                    className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${
                                      selectedTagsForAction.has(tag)
                                        ? 'bg-green-100 border-l-4 border-green-600'
                                        : 'hover:bg-green-50'
                                    }`}
                                  >
                                    <span className="text-gray-700 font-medium flex items-center">
                                      {selectedTagsForAction.has(tag) && (
                                        <Check size={14} className="mr-2 text-green-600" />
                                      )}
                                      {tag}
                                      {isTagPartial(tag) && (
                                        <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded" title="On some requirements">
                                          partial
                                        </span>
                                      )}
                                    </span>
                                    {!selectedTagsForAction.has(tag) && (
                                      <Plus size={14} className="text-green-600" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Fully Assigned Tags (Grayed Out) */}
                          {filteredTagsForAdd.filter(tag => isTagFullyAssigned(tag)).length > 0 && (
                            <div>
                              <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase flex items-center">
                                <span className="mr-2">✓</span>
                                Already Assigned to All
                                <span className="ml-auto text-gray-400">
                                  ({filteredTagsForAdd.filter(tag => isTagFullyAssigned(tag)).length})
                                </span>
                              </div>
                              <div>
                                {filteredTagsForAdd.filter(tag => isTagFullyAssigned(tag)).map(tag => (
                                  <div
                                    key={tag}
                                    className="w-full text-left px-4 py-2 text-sm bg-gray-100 cursor-not-allowed flex items-center justify-between opacity-60"
                                    title="This tag is already assigned to all selected items"
                                  >
                                    <span className="text-gray-500 flex items-center">
                                      {tag}
                                    </span>
                                    <Check size={14} className="text-gray-400" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        // Remove Tab - Only show assigned tags (multi-select)
                        <div>
                          {filteredTagsForAdd.map(tag => (
                            <button
                              key={tag}
                              onClick={() => toggleTagSelection(tag)}
                              className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${
                                selectedTagsForAction.has(tag)
                                  ? 'bg-red-100 border-l-4 border-red-600'
                                  : 'hover:bg-red-50'
                              }`}
                              title={isTagPartial(tag) 
                                ? "This tag is assigned to some of the selected items"
                                : "This tag is assigned to all selected items"
                              }
                            >
                              <span className="text-gray-700 flex items-center">
                                {selectedTagsForAction.has(tag) && (
                                  <Check size={14} className="mr-2 text-red-600" />
                                )}
                                {tag}
                                {isTagPartial(tag) && (
                                  <span className="ml-2 inline-block w-2 h-2 rounded-full bg-amber-400" title="Partially assigned"></span>
                                )}
                              </span>
                              {!selectedTagsForAction.has(tag) && (
                                <Minus size={14} className="text-red-600" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      {tagSearchQuery ? 'No tags found' : (
                        tagActiveTab === 'add' 
                          ? 'All tags are already assigned' 
                          : 'No tags assigned to selected items'
                      )}
                    </div>
                  )}

                  {/* Legend for partial tags */}
                  {(tagActiveTab === 'remove' || (tagActiveTab === 'add' && assignedTags.length > 0)) && 
                   partiallyAssignedTags.length > 0 && (
                    <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
                      <p className="text-xs text-gray-600 flex items-center">
                        <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1.5"></span>
                        = Tag on some items (not all)
                      </p>
                    </div>
                  )}

                  {/* Apply Button */}
                  {selectedTagsForAction.size > 0 && (
                    <div className="p-3 bg-gray-50 border-t border-gray-200">
                      <button
                        onClick={handleApplyTagsAction}
                        className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
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
            setSelectedTagsForAction(new Set());
          }}
        />
      )}
    </RightSidebarPanel>
  );
};

export default BulkActionsPanel;
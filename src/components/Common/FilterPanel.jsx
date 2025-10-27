import React, { useState } from 'react';
import RightSidebarPanel, {
  SidebarSection,
  SidebarField,
  SidebarBadge
} from './RightSidebarPanel';
import { Search, Filter, X, TrendingUp } from 'lucide-react';

/**
 * FilterPanel - Comprehensive filter panel for requirements
 * Shows in right sidebar when no requirements are selected
 */
const FilterPanel = ({
  // Filter values
  searchQuery = '',
  priorityFilter = 'All',
  statusFilter = 'All',
  typeFilter = 'All',
  coverageFilter = 'All',
  selectedTags = [],

  // Available options
  allTags = [],

  // Callbacks
  onSearchChange,
  onPriorityChange,
  onStatusChange,
  onTypeChange,
  onCoverageChange,
  onTagsChange,
  onClearAll,

  // Statistics
  stats = {
    total: 0,
    filtered: 0,
    highPriority: 0,
    withTests: 0,
    noCoverage: 0
  }
}) => {
  const [expandedSections, setExpandedSections] = useState({
    search: true,
    priority: true,
    status: true,
    coverage: false,
    tags: false,
    stats: true  // Statistics section expanded by default
  });

  // Count active filters
  const activeFiltersCount = [
    searchQuery !== '',
    priorityFilter !== 'All',
    statusFilter !== 'All',
    typeFilter !== 'All',
    coverageFilter !== 'All',
    selectedTags.length > 0
  ].filter(Boolean).length;

  const handleToggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <RightSidebarPanel
      title="Filters & Search"
      onClose={null} // Can't close this panel
    >
      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
              </span>
            </div>
            <button
              onClick={onClearAll}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <SidebarSection
        title="Search"
        icon={<Search size={16} />}
        defaultOpen={expandedSections.search}
        onToggle={() => toggleSection('search')}
      >
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by ID, name, or description..."
            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </SidebarSection>

      {/* Priority Filter */}
      <SidebarSection
        title="Priority"
        defaultOpen={expandedSections.priority}
        onToggle={() => toggleSection('priority')}
      >
        <div className="space-y-2">
          {['All', 'High', 'Medium', 'Low'].map((priority) => (
            <label
              key={priority}
              className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
            >
              <input
                type="radio"
                name="priority"
                value={priority}
                checked={priorityFilter === priority}
                onChange={(e) => onPriorityChange(e.target.value)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 text-sm text-gray-700">
                {priority}
                {priority === 'High' && stats.highPriority > 0 && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({stats.highPriority})
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>
      </SidebarSection>

      {/* Status Filter */}
      <SidebarSection
        title="Status"
        defaultOpen={expandedSections.status}
        onToggle={() => toggleSection('status')}
      >
        <div className="space-y-2">
          {['All', 'Active', 'Draft', 'Deprecated'].map((status) => (
            <label
              key={status}
              className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
            >
              <input
                type="radio"
                name="status"
                value={status}
                checked={statusFilter === status}
                onChange={(e) => onStatusChange(e.target.value)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 text-sm text-gray-700">{status}</span>
            </label>
          ))}
        </div>
      </SidebarSection>

      {/* Type Filter */}
      <SidebarSection
        title="Type"
        defaultOpen={expandedSections.type}
        onToggle={() => toggleSection('type')}
      >
        <select
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Types</option>
          <option value="Functional">Functional</option>
          <option value="Non-Functional">Non-Functional</option>
          <option value="Security">Security</option>
          <option value="Performance">Performance</option>
          <option value="Usability">Usability</option>
          <option value="Compliance">Compliance</option>
        </select>
      </SidebarSection>

      {/* Coverage Filter */}
      <SidebarSection
        title="Test Coverage"
        defaultOpen={expandedSections.coverage}
        onToggle={() => toggleSection('coverage')}
      >
        <div className="space-y-2">
          {['All', 'With Tests', 'No Coverage'].map((coverage) => (
            <label
              key={coverage}
              className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
            >
              <input
                type="radio"
                name="coverage"
                value={coverage}
                checked={coverageFilter === coverage}
                onChange={(e) => onCoverageChange(e.target.value)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 text-sm text-gray-700">
                {coverage}
                {coverage === 'With Tests' && stats.withTests > 0 && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({stats.withTests})
                  </span>
                )}
                {coverage === 'No Coverage' && stats.noCoverage > 0 && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({stats.noCoverage})
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>
      </SidebarSection>

      {/* Tags Filter */}
      {allTags.length > 0 && (
        <SidebarSection
          title="Tags"
          defaultOpen={expandedSections.tags}
          onToggle={() => toggleSection('tags')}
        >
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {allTags.map((tag) => (
              <label
                key={tag}
                className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag)}
                  onChange={() => handleToggleTag(tag)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">{tag}</span>
              </label>
            ))}
          </div>
          {selectedTags.length > 0 && (
            <button
              onClick={() => onTagsChange([])}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Clear Tags
            </button>
          )}
        </SidebarSection>
      )}

      {/* Statistics Section */}
      <SidebarSection
        title="Statistics"
        icon={<TrendingUp size={16} />}
        defaultOpen={expandedSections.stats}
        onToggle={() => toggleSection('stats')}
      >
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Requirements:</span>
            <span className="font-semibold text-gray-900">{stats.total}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Showing:</span>
            <span className="font-semibold text-blue-600">{stats.filtered}</span>
          </div>
          {stats.filtered !== stats.total && (
            <div className="pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                {stats.total - stats.filtered} hidden by filters
              </div>
            </div>
          )}
          
          <div className="pt-2 border-t border-gray-200 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">High Priority:</span>
              <span className="font-medium text-red-600">{stats.highPriority}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">With Tests:</span>
              <span className="font-medium text-green-600">{stats.withTests}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">No Coverage:</span>
              <span className="font-medium text-orange-600">{stats.noCoverage}</span>
            </div>
          </div>
        </div>
      </SidebarSection>

      {/* Quick Tips */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">
          💡 Quick Tips
        </h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Use search for quick filtering</li>
          <li>• Combine multiple filters</li>
          <li>• Click requirement to see details</li>
          <li>• Select multiple for bulk actions</li>
        </ul>
      </div>
    </RightSidebarPanel>
  );
};

export default FilterPanel;
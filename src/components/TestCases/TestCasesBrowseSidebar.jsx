import React, { useState } from 'react';
import RightSidebarPanel, {
  SidebarSection,
  SidebarField,
  SidebarActionButton,
  SidebarBadge
} from '../Common/RightSidebarPanel';
import {
  Plus,
  FolderOpen,
  Filter,
  Tag,
  TrendingUp,
  Layers,
  X
} from 'lucide-react';

/**
 * TestCasesBrowseSidebar - Browse Mode Sidebar
 * FINAL FIXED VERSION - Dropdowns render correctly
 */
const TestCasesBrowseSidebar = ({
  // Test Suites data
  testSuites = [],
  onSuiteClick,
  onCreateSuite,
  onAddTestCase,

  // Filter values
  categoryFilter = 'All',
  statusFilter = 'All',
  priorityFilter = 'All',
  automationFilter = 'All',
  selectedTagsFilter = [],

  // Available options
  allCategories = [],
  allTags = [],

  // Callbacks
  onCategoryChange,
  onStatusChange,
  onPriorityChange,
  onAutomationChange,
  onTagsChange,
  onClearAllFilters,

  // Statistics
  stats = {
    total: 0,
    filtered: 0,
    automated: 0,
    manual: 0,
    passed: 0,
    failed: 0
  }
}) => {
  const [expandedSections, setExpandedSections] = useState({
    suites: true,
    filters: true,
    stats: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Count active filters
  const activeFiltersCount = [
    categoryFilter !== 'All',
    statusFilter !== 'All',
    priorityFilter !== 'All',
    automationFilter !== 'All',
    selectedTagsFilter.length > 0
  ].filter(Boolean).length;

  const handleToggleTag = (tag) => {
    if (selectedTagsFilter.includes(tag)) {
      onTagsChange(selectedTagsFilter.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTagsFilter, tag]);
    }
  };

  // Get suite type badge color
  const getSuiteTypeBadge = (suiteType) => {
    const colors = {
      smoke: 'bg-orange-100 text-orange-800',
      regression: 'bg-blue-100 text-blue-800',
      sanity: 'bg-green-100 text-green-800',
      integration: 'bg-purple-100 text-purple-800',
      custom: 'bg-gray-100 text-gray-800'
    };
    return colors[suiteType?.toLowerCase()] || colors.custom;
  };

  return (
    <RightSidebarPanel
      title="Browse & Organize"
      subtitle="Test Cases"
      onClose={null}
    >
      {/* Quick Actions */}
      <div className="p-4 space-y-2 border-b border-gray-200 bg-gray-50">
        <SidebarActionButton
          icon={<Layers size={16} />}
          label="Create Suite"
          onClick={onCreateSuite}
          variant="secondary"
          fullWidth
        />
      </div>

      {/* Test Suites Section */}
      <SidebarSection
        title="Test Suites"
        icon={<FolderOpen size={16} />}
        defaultOpen={expandedSections.suites}
        onToggle={() => toggleSection('suites')}
        badge={testSuites.length > 0 ? String(testSuites.length) : null}
      >
        {testSuites.length === 0 ? (
          <div className="text-sm text-gray-500 italic text-center py-4">
            No test suites yet.
            <br />
            <button
              onClick={onCreateSuite}
              className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
            >
              Create your first suite
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {testSuites.map((suite) => (
              <div
                key={suite.id}
                onClick={() => onSuiteClick(suite)}
                className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600">
                      {suite.name}
                    </h4>
                    {suite.version && (
                      <p className="text-xs text-gray-500 mt-0.5">{suite.version}</p>
                    )}
                  </div>
                  {suite.suite_type && (
                    <SidebarBadge
                      label={suite.suite_type}
                      className={getSuiteTypeBadge(suite.suite_type)}
                    />
                  )}
                </div>
                {suite.description && (
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    {suite.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {suite.test_count || 0} test{suite.test_count !== 1 ? 's' : ''}
                  </span>
                  {suite.estimated_duration && (
                    <span className="text-gray-500">
                      ~{suite.estimated_duration}m
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SidebarSection>

      {/* Filters Section */}
      <SidebarSection
        title="Filters"
        icon={<Filter size={16} />}
        defaultOpen={expandedSections.filters}
        onToggle={() => toggleSection('filters')}
        badge={activeFiltersCount > 0 ? String(activeFiltersCount) : null}
      >
        {/* Active Filters Badge */}
        {activeFiltersCount > 0 && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-900">
                {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
              </span>
              <button
                onClick={onClearAllFilters}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <X size={12} />
                Clear all
              </button>
            </div>
          </div>
        )}

        {/* Category Filter - NOT wrapped in SidebarField */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Category
          </label>
          {allCategories.length > 0 ? (
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All Categories</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          ) : (
            <select disabled className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-400">
              <option>No categories available</option>
            </select>
          )}
        </div>

        {/* Status Filter - NOT wrapped in SidebarField */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="Not Run">Not Run</option>
            <option value="Passed">Passed</option>
            <option value="Failed">Failed</option>
            <option value="Blocked">Blocked</option>
            <option value="Skipped">Skipped</option>
          </select>
        </div>

        {/* Priority Filter - NOT wrapped in SidebarField */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Priority
          </label>
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Automation Filter - NOT wrapped in SidebarField */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Automation
          </label>
          <select
            value={automationFilter}
            onChange={(e) => onAutomationChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="All">All Types</option>
            <option value="Automated">Automated</option>
            <option value="Manual">Manual</option>
            <option value="Semi-Automated">Semi-Automated</option>
            <option value="Planned">Planned</option>
          </select>
        </div>

        {/* Tags Filter - NOT wrapped in SidebarField */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Tags
          </label>
          {allTags.length > 0 ? (
            <div className="space-y-2">
              {selectedTagsFilter.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-md">
                  {selectedTagsFilter.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-md"
                    >
                      {tag}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTag(tag);
                        }}
                        className="hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {allTags
                  .filter(tag => !selectedTagsFilter.includes(tag))
                  .map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleToggleTag(tag)}
                      className="px-2 py-1 rounded text-xs font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      {tag}
                    </button>
                  ))}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 rounded-md text-center">
              <Tag size={20} className="mx-auto text-gray-300 mb-1" />
              <p className="text-xs text-gray-500">No tags available</p>
            </div>
          )}
        </div>
      </SidebarSection>

      {/* Statistics Section */}
      <SidebarSection
        title="Statistics"
        icon={<TrendingUp size={16} />}
        defaultOpen={expandedSections.stats}
        onToggle={() => toggleSection('stats')}
      >
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Test Cases:</span>
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
              <span className="text-gray-600">Automated:</span>
              <span className="font-medium text-green-600">{stats.automated}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Manual:</span>
              <span className="font-medium text-orange-600">{stats.manual}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Passed:</span>
              <span className="font-medium text-green-600">{stats.passed}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Failed:</span>
              <span className="font-medium text-red-600">{stats.failed}</span>
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
          <li>• Click a suite to view its tests</li>
          <li>• Use filters to narrow results</li>
          <li>• Select tests for bulk actions</li>
          <li>• Create suites to organize tests</li>
        </ul>
      </div>
    </RightSidebarPanel>
  );
};

export default TestCasesBrowseSidebar;
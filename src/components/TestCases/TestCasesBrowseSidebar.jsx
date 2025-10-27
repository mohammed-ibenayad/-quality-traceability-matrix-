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
  X
} from 'lucide-react';

/**
 * TestCasesBrowseSidebar - Browse Mode Sidebar
 * Shows filters, test suites, and statistics
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
      title="Browse & Filter"
      subtitle="Organize and filter test cases"
      badge={activeFiltersCount > 0 ? `${activeFiltersCount}` : null}
    >
      {/* ========================================
          TEST SUITES SECTION
      ======================================== */}
      <SidebarSection
        title="Test Suites"
        icon={FolderOpen}
        defaultOpen={expandedSections.suites}
        onToggle={() => toggleSection('suites')}
        action={
          <SidebarActionButton
            onClick={onCreateSuite}
            icon={Plus}
            label="New Suite"
          />
        }
      >
        <div className="space-y-2">
          {testSuites.length === 0 ? (
            <div className="py-6 text-center">
              <FolderOpen size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No test suites yet</p>
              <button
                onClick={onCreateSuite}
                className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first suite
              </button>
            </div>
          ) : (
            testSuites.map((suite) => (
              <div
                key={suite.id}
                onClick={() => onSuiteClick(suite)}
                className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-900">
                    {suite.name}
                  </h4>
                  {suite.suite_type && (
                    <SidebarBadge
                      text={suite.suite_type}
                      className={getSuiteTypeBadge(suite.suite_type)}
                    />
                  )}
                </div>
                {suite.description && (
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                    {suite.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {suite.test_case_count || 0} test{suite.test_case_count !== 1 ? 's' : ''}
                  </span>
                  {suite.estimated_duration && (
                    <span className="text-gray-500">
                      ~{suite.estimated_duration}m
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </SidebarSection>

      {/* ========================================
          FILTERS SECTION
      ======================================== */}
      <SidebarSection
        title="Filters"
        icon={Filter}
        defaultOpen={expandedSections.filters}
        onToggle={() => toggleSection('filters')}
        badge={activeFiltersCount > 0 ? `${activeFiltersCount}` : null}
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

        {/* Category Filter */}
        {allCategories.length > 0 && (
          <SidebarField label="Category">
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="All">All Categories</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </SidebarField>
        )}

        {/* If no categories exist, show empty state */}
        {allCategories.length === 0 && (
          <SidebarField label="Category">
            <select
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-400"
            >
              <option>No categories available</option>
            </select>
          </SidebarField>
        )}

        {/* Status Filter - CORRECTED VALUES */}
        <SidebarField label="Status">
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="All">All Statuses</option>
            <option value="Not Run">Not Run</option>
            <option value="Passed">Passed</option>
            <option value="Failed">Failed</option>
            <option value="Blocked">Blocked</option>
            <option value="Skipped">Skipped</option>
          </select>
        </SidebarField>

        {/* Priority Filter */}
        <SidebarField label="Priority">
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </SidebarField>

        {/* Automation Status Filter */}
        <SidebarField label="Automation">
          <select
            value={automationFilter}
            onChange={(e) => onAutomationChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="All">All Types</option>
            <option value="Automated">Automated</option>
            <option value="Manual">Manual</option>
            <option value="Semi-Automated">Semi-Automated</option>
            <option value="Planned">Planned</option>
          </select>
        </SidebarField>

        {/* Tags Filter */}
        {allTags.length > 0 && (
          <SidebarField label="Tags">
            <div className="space-y-2">
              {/* Selected tags */}
              {selectedTagsFilter.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-md">
                  {selectedTagsFilter.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-md"
                    >
                      {tag}
                      <button
                        onClick={() => handleToggleTag(tag)}
                        className="hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              {/* Available tags */}
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
          </SidebarField>
        )}

        {/* If no tags exist, show empty state */}
        {allTags.length === 0 && (
          <SidebarField label="Tags">
            <div className="p-3 bg-gray-50 rounded-md text-center">
              <Tag size={20} className="mx-auto text-gray-300 mb-1" />
              <p className="text-xs text-gray-500">No tags available</p>
            </div>
          </SidebarField>
        )}
      </SidebarSection>

      {/* ========================================
          STATISTICS SECTION
      ======================================== */}
      <SidebarSection
        title="Statistics"
        defaultOpen={expandedSections.stats}
        onToggle={() => toggleSection('stats')}
      >
        <div className="space-y-3">
          {/* Test Count */}
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Total Tests</span>
            <span className="text-sm font-semibold text-gray-900">
              {stats.total}
            </span>
          </div>

          {/* Filtered Count */}
          {stats.filtered !== stats.total && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Filtered</span>
              <span className="text-sm font-semibold text-blue-600">
                {stats.filtered}
              </span>
            </div>
          )}

          {/* Automation Breakdown */}
          <div className="py-2 border-b border-gray-100">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Automation</span>
              <span className="text-sm font-semibold text-gray-900">
                {stats.automated + stats.manual > 0
                  ? Math.round((stats.automated / (stats.automated + stats.manual)) * 100)
                  : 0}%
              </span>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="text-gray-500">
                Automated: {stats.automated}
              </span>
              <span className="text-gray-500">
                Manual: {stats.manual}
              </span>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="py-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Status</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-green-600">Passed</span>
                <span className="font-medium text-green-600">{stats.passed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600">Failed</span>
                <span className="font-medium text-red-600">{stats.failed}</span>
              </div>
            </div>
          </div>
        </div>
      </SidebarSection>

      {/* ========================================
          QUICK ACTIONS
      ======================================== */}
      <div className="pt-4 border-t border-gray-200">
        <SidebarActionButton
          onClick={onAddTestCase}
          icon={Plus}
          label="Create Test Case"
          className="w-full justify-center bg-blue-600 text-white hover:bg-blue-700"
        />
      </div>
    </RightSidebarPanel>
  );
};

export default TestCasesBrowseSidebar;
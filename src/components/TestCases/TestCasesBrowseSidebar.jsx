import React, { useState, useEffect } from 'react';
import RightSidebarPanel, {
  SidebarSection,
  SidebarField,
  SidebarActionButton,
  SidebarBadge
} from '../Common/RightSidebarPanel';
import {
  Plus,
  Play,
  Settings,
  Edit,
  Copy,
  Trash2,
  ChevronRight,
  Package,
  Filter,
  X
} from 'lucide-react';
import dataStore from '../../services/DataStore';

/**
 * TestCasesBrowseSidebar - State 1: No Selection + No Suite Active
 * "Browse & Organize Mode"
 * 
 * Shows:
 * - Add Test Case button
 * - List of Test Suites
 * - Create Suite button
 * - Filters section
 */
const TestCasesBrowseSidebar = ({
  // Callbacks
  onAddTestCase,
  onCreateSuite,
  onSelectSuite,
  
  // Filter state
  categoryFilter = 'All',
  statusFilter = 'All',
  priorityFilter = 'All',
  selectedTags = [],
  
  // Filter callbacks
  onCategoryChange,
  onStatusChange,
  onPriorityChange,
  onTagsChange,
  onClearFilters,
  
  // Available filter options
  availableCategories = [],
  availableTags = [],
  
  // Statistics
  stats = {
    total: 0,
    filtered: 0
  }
}) => {
  const [testSuites, setTestSuites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch test suites on mount
  useEffect(() => {
    fetchTestSuites();
  }, []);

  const fetchTestSuites = async () => {
    try {
      setLoading(true);
      setError(null);
      const suites = await dataStore.getTestSuites();
      setTestSuites(suites);
    } catch (err) {
      console.error('Error fetching test suites:', err);
      setError('Failed to load test suites');
    } finally {
      setLoading(false);
    }
  };

  // Count active filters
  const activeFiltersCount = [
    categoryFilter !== 'All',
    statusFilter !== 'All',
    priorityFilter !== 'All',
    selectedTags.length > 0
  ].filter(Boolean).length;

  // Handle tag toggle
  const handleToggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  // Get suite type badge color
  const getSuiteTypeColor = (type) => {
    switch (type) {
      case 'smoke': return 'blue';
      case 'regression': return 'purple';
      case 'sanity': return 'green';
      case 'integration': return 'yellow';
      default: return 'gray';
    }
  };

  return (
    <RightSidebarPanel
      title="Browse & Organize"
      onClose={null} // Can't close this panel in State 1
    >
      {/* Add Test Case Button */}
      <div className="p-4 border-b border-gray-200">
        <SidebarActionButton
          icon={<Plus size={16} />}
          label="Add Test Case"
          onClick={onAddTestCase}
          variant="primary"
        />
      </div>

      {/* Test Suites Section */}
      <SidebarSection
        title="Test Suites"
        icon={<Package size={16} />}
        defaultOpen={true}
      >
        {loading && (
          <div className="text-sm text-gray-500 text-center py-4">
            Loading suites...
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 text-center py-4">
            {error}
          </div>
        )}

        {!loading && !error && testSuites.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-4">
            No test suites yet
          </div>
        )}

        {!loading && !error && testSuites.length > 0 && (
          <div className="space-y-2">
            {testSuites.map((suite) => (
              <button
                key={suite.id}
                onClick={() => onSelectSuite(suite)}
                className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm text-gray-900 truncate">
                        {suite.name}
                      </span>
                      {suite.suite_type && (
                        <SidebarBadge
                          label={suite.suite_type}
                          color={getSuiteTypeColor(suite.suite_type)}
                        />
                      )}
                    </div>
                    
                    {suite.version && (
                      <div className="text-xs text-gray-500 mb-1">
                        Version: {suite.version}
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-3 text-xs text-gray-600">
                      <span>{suite.test_count || 0} tests</span>
                      {suite.automated_count > 0 && (
                        <span className="text-green-600">
                          {suite.automated_count} automated
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-600 flex-shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Create Suite Button */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <button
            onClick={onCreateSuite}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 hover:border-blue-300"
          >
            <Plus size={16} />
            <span>Create Suite</span>
          </button>
        </div>
      </SidebarSection>

      {/* Filters Section */}
      <SidebarSection
        title={
          <div className="flex items-center justify-between w-full">
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <SidebarBadge
                label={`${activeFiltersCount} active`}
                color="blue"
              />
            )}
          </div>
        }
        icon={<Filter size={16} />}
        defaultOpen={false}
      >
        {/* Clear Filters Button */}
        {activeFiltersCount > 0 && (
          <div className="mb-3">
            <button
              onClick={onClearFilters}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <X size={12} />
              <span>Clear all filters</span>
            </button>
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="All">All Categories</option>
            {availableCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Status
          </label>
          <div className="space-y-2">
            {['All', 'Passed', 'Failed', 'Not Run', 'Blocked'].map((status) => (
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
        </div>

        {/* Priority Filter */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Priority
          </label>
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
                <span className="ml-3 text-sm text-gray-700">{priority}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Tags Filter */}
        {availableTags.length > 0 && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {availableTags.map((tag) => (
                <label
                  key={tag}
                  className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag)}
                    onChange={() => handleToggleTag(tag)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">{tag}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </SidebarSection>

      {/* Statistics Section */}
      <div className="p-4 bg-blue-50 border-t border-blue-200">
        <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">
          Statistics
        </h4>
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
            <div className="pt-2 border-t border-blue-200">
              <div className="text-xs text-gray-500">
                {stats.total - stats.filtered} hidden by filters
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">
          💡 Quick Tips
        </h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Click a suite to view its tests</li>
          <li>• Use filters to find specific tests</li>
          <li>• Create suites to organize tests</li>
          <li>• Select tests for bulk actions</li>
        </ul>
      </div>
    </RightSidebarPanel>
  );
};

export default TestCasesBrowseSidebar;
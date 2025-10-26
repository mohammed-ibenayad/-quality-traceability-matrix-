import React, { useState, useMemo } from 'react';
import { X, Layers, Search, Check, AlertCircle, CheckSquare, Square } from 'lucide-react';

/**
 * AddToSuiteModal - Modal for adding test cases to a suite
 * Features:
 * - Checkbox selection of multiple test cases
 * - Search/filter to find tests quickly
 * - Shows which tests are already in the suite
 * - Prevents duplicate additions
 * - Displays test details for easy identification
 * 
 * FIXED: Moved useMemo hook before conditional return to follow React's Rules of Hooks
 */
const AddToSuiteModal = ({
  isOpen,
  onClose,
  onAdd,
  suite = null,
  availableTestCases = [],
  existingMemberIds = [], // Test case IDs already in the suite
  isLoading = false
}) => {
  // ✅ ALL STATE HOOKS FIRST
  const [selectedTestCaseIds, setSelectedTestCaseIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectAll, setSelectAll] = useState(false);

  // ✅ ALL OTHER HOOKS (useMemo, useEffect, etc.) BEFORE CONDITIONAL RETURNS
  // Filter test cases based on search and status
  const filteredTestCases = useMemo(() => {
    let filtered = availableTestCases;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tc => 
        tc.id?.toLowerCase().includes(query) ||
        tc.name?.toLowerCase().includes(query) ||
        tc.description?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(tc => tc.status === statusFilter);
    }

    // Exclude tests already in the suite
    filtered = filtered.filter(tc => !existingMemberIds.includes(tc.id));

    return filtered;
  }, [availableTestCases, searchQuery, statusFilter, existingMemberIds]);

  // ✅ CONDITIONAL RETURN AFTER ALL HOOKS
  if (!isOpen) return null;

  // Handle individual checkbox toggle
  const handleToggleTestCase = (testCaseId) => {
    setSelectedTestCaseIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(testCaseId)) {
        newSet.delete(testCaseId);
      } else {
        newSet.add(testCaseId);
      }
      return newSet;
    });
  };

  // Handle select all toggle
  const handleSelectAll = () => {
    if (selectAll) {
      // Deselect all
      setSelectedTestCaseIds(new Set());
      setSelectAll(false);
    } else {
      // Select all filtered tests
      const allIds = filteredTestCases.map(tc => tc.id);
      setSelectedTestCaseIds(new Set(allIds));
      setSelectAll(true);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    if (selectedTestCaseIds.size === 0) {
      alert('Please select at least one test case');
      return;
    }

    try {
      await onAdd(suite.id, Array.from(selectedTestCaseIds));
      
      // Reset and close
      setSelectedTestCaseIds(new Set());
      setSearchQuery('');
      setStatusFilter('All');
      setSelectAll(false);
      onClose();
    } catch (error) {
      console.error('Failed to add tests to suite:', error);
      alert('Failed to add tests to suite. Please try again.');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    // Reset state and close
    setSelectedTestCaseIds(new Set());
    setSearchQuery('');
    setStatusFilter('All');
    setSelectAll(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Layers size={24} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Add Test Cases to Suite
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {suite?.name || 'Unknown Suite'}
                </p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Filters - Fixed */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex space-x-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search test cases by ID, name, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Not Run">Not Run</option>
              <option value="Passed">Passed</option>
              <option value="Failed">Failed</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>

          {/* Selection Summary */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSelectAll}
                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {selectAll ? <CheckSquare size={16} /> : <Square size={16} />}
                <span>{selectAll ? 'Deselect All' : 'Select All'}</span>
              </button>
              <span className="text-sm text-gray-600">
                {selectedTestCaseIds.size} selected
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {filteredTestCases.length} available test{filteredTestCases.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Test Cases List - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTestCases.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle size={48} className="text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Test Cases Available
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                {existingMemberIds.length > 0
                  ? 'All available test cases are already in this suite, or no tests match your filters.'
                  : 'No test cases found matching your search criteria.'}
              </p>
            </div>
          ) : (
            // Test Cases Grid
            <div className="space-y-2">
              {filteredTestCases.map((testCase) => {
                const isSelected = selectedTestCaseIds.has(testCase.id);
                
                return (
                  <div
                    key={testCase.id}
                    onClick={() => handleToggleTestCase(testCase.id)}
                    className={`
                      p-4 border rounded-lg cursor-pointer transition-all
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Checkbox */}
                      <div className="flex-shrink-0 mt-1">
                        {isSelected ? (
                          <CheckSquare size={20} className="text-blue-600" />
                        ) : (
                          <Square size={20} className="text-gray-400" />
                        )}
                      </div>

                      {/* Test Case Info */}
                      <div className="flex-1 min-w-0">
                        {/* ID and Name */}
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-mono text-gray-500">
                                {testCase.id}
                              </span>
                              {testCase.priority && (
                                <span className={`
                                  text-xs px-2 py-0.5 rounded-full font-medium
                                  ${testCase.priority === 'High' ? 'bg-red-100 text-red-700' :
                                    testCase.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'}
                                `}>
                                  {testCase.priority}
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-medium text-gray-900 mt-1">
                              {testCase.name}
                            </h4>
                          </div>
                          
                          {/* Status Badge */}
                          {testCase.status && (
                            <span className={`
                              text-xs px-2 py-1 rounded-full font-medium flex-shrink-0
                              ${testCase.status === 'Passed' ? 'bg-green-100 text-green-700' :
                                testCase.status === 'Failed' ? 'bg-red-100 text-red-700' :
                                testCase.status === 'Blocked' ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-100 text-gray-700'}
                            `}>
                              {testCase.status}
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        {testCase.description && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {testCase.description}
                          </p>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {testCase.automationStatus && (
                            <span className="flex items-center">
                              {testCase.automationStatus === 'Automated' ? '⚡' : '👤'} {testCase.automationStatus}
                            </span>
                          )}
                          {testCase.category && (
                            <span className="flex items-center">
                              📁 {testCase.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            {/* Info Message */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <AlertCircle size={16} />
              <span>
                {selectedTestCaseIds.size === 0
                  ? 'Select test cases to add'
                  : `Adding ${selectedTestCaseIds.size} test case${selectedTestCaseIds.size !== 1 ? 's' : ''}`
                }
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || selectedTestCaseIds.size === 0}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Add to Suite</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddToSuiteModal;
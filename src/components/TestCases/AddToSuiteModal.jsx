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
  const [selectedTestCaseIds, setSelectedTestCaseIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectAll, setSelectAll] = useState(false);

  if (!isOpen) return null;

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
    setSelectedTestCaseIds(new Set());
    setSearchQuery('');
    setStatusFilter('All');
    setSelectAll(false);
    onClose();
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      'Passed': 'bg-green-100 text-green-800',
      'Failed': 'bg-red-100 text-red-800',
      'Not Run': 'bg-gray-100 text-gray-800',
      'Blocked': 'bg-yellow-100 text-yellow-800',
      'Not Found': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <Layers size={24} className="text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Add Tests to Suite
                </h2>
                {suite && (
                  <p className="text-sm text-gray-600 mt-1">
                    {suite.name} {suite.version && `(v${suite.version})`}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
            >
              <X size={24} />
            </button>
          </div>

          {/* Search and Filter Bar */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search test cases..."
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
              {(searchQuery || statusFilter !== 'All') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('All');
                  }}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear filters
                </button>
              )}
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
                      p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }
                    `}
                  >
                    <div className="flex items-start">
                      {/* Checkbox */}
                      <div className="flex-shrink-0 mt-1 mr-3">
                        <div
                          className={`
                            w-5 h-5 rounded border-2 flex items-center justify-center
                            ${isSelected 
                              ? 'bg-blue-600 border-blue-600' 
                              : 'bg-white border-gray-300'
                            }
                          `}
                        >
                          {isSelected && <Check size={14} className="text-white" />}
                        </div>
                      </div>

                      {/* Test Case Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0 mr-4">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {testCase.id}
                            </h4>
                            {testCase.name && testCase.name !== testCase.id && (
                              <p className="text-sm text-gray-700 truncate">
                                {testCase.name}
                              </p>
                            )}
                          </div>
                          
                          {/* Status Badge */}
                          <span
                            className={`
                              px-2 py-1 rounded text-xs font-medium flex-shrink-0
                              ${getStatusColor(testCase.status)}
                            `}
                          >
                            {testCase.status || 'Not Run'}
                          </span>
                        </div>

                        {/* Description */}
                        {testCase.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {testCase.description}
                          </p>
                        )}

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          {testCase.priority && (
                            <span className="flex items-center">
                              Priority: <span className="font-medium ml-1">{testCase.priority}</span>
                            </span>
                          )}
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
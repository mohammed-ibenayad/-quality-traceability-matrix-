// src/pages/TestCases.jsx - Enhanced Version with Clear Selection, Execute Button, and Last Execution Info
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Upload,
  Link,
  Unlink,
  Eye,
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import MainLayout from '../components/Layout/MainLayout';
import EmptyState from '../components/Common/EmptyState';
import TestExecutionModal from '../components/TestExecution/TestExecutionModal';
import { useVersionContext } from '../context/VersionContext';
import dataStore from '../services/DataStore';

const TestCases = () => {
  // Get version context
  const { selectedVersion, versions } = useVersionContext();

  // State for data from DataStore
  const [testCases, setTestCases] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [mapping, setMapping] = useState({});
  const [hasTestCases, setHasTestCases] = useState(false);

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [automationFilter, setAutomationFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [versionFilter, setVersionFilter] = useState('All');
  const [traceabilityMode, setTraceabilityMode] = useState('standalone');
  const [selectedTestCases, setSelectedTestCases] = useState(new Set());
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState(null);

  // Load data from DataStore
  useEffect(() => {
    const updateData = () => {
      setTestCases(dataStore.getTestCases());
      setRequirements(dataStore.getRequirements());
      setMapping(dataStore.getMapping());
      setHasTestCases(dataStore.getTestCases().length > 0);
    };
    
    updateData();
    
    // Subscribe to DataStore changes
    const unsubscribe = dataStore.subscribe(updateData);
    
    // Clean up subscription
    return () => unsubscribe();
  }, []);

  // Filter test cases by selected version
  const versionFilteredTestCases = selectedVersion === 'unassigned'
    ? testCases
    : testCases.filter(tc => !tc.version || tc.version === selectedVersion || tc.version === '');

  // Filter test cases based on various criteria
  const filteredTestCases = useMemo(() => {
    return versionFilteredTestCases.filter(testCase => {
      // Search filter
      if (searchQuery && !testCase.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !testCase.id.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'All' && testCase.status !== statusFilter) {
        return false;
      }

      // Automation filter
      if (automationFilter !== 'All' && testCase.automationStatus !== automationFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'All' && testCase.priority !== priorityFilter) {
        return false;
      }

      // Version filter (keeping original logic for compatibility)
      if (selectedVersion !== 'unassigned' && testCase.version !== selectedVersion) {
        return false;
      }

      // Traceability mode filter
      if (traceabilityMode === 'linked' && (!testCase.requirementIds || testCase.requirementIds.length === 0)) {
        return false;
      }
      if (traceabilityMode === 'unlinked' && testCase.requirementIds && testCase.requirementIds.length > 0) {
        return false;
      }

      return true;
    });
  }, [versionFilteredTestCases, searchQuery, statusFilter, automationFilter, priorityFilter, selectedVersion, traceabilityMode]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const total = filteredTestCases.length;
    const passed = filteredTestCases.filter(tc => tc.status === 'Passed').length;
    const failed = filteredTestCases.filter(tc => tc.status === 'Failed').length;
    const notRun = filteredTestCases.filter(tc => tc.status === 'Not Run').length;
    const blocked = filteredTestCases.filter(tc => tc.status === 'Blocked').length;
    const automated = filteredTestCases.filter(tc => tc.automationStatus === 'Automated').length;
    const linked = filteredTestCases.filter(tc => tc.requirementIds && tc.requirementIds.length > 0).length;

    return {
      total,
      passed,
      failed,
      notRun,
      blocked,
      automated,
      linked,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      automationRate: total > 0 ? Math.round((automated / total) * 100) : 0,
      linkageRate: total > 0 ? Math.round((linked / total) * 100) : 0
    };
  }, [filteredTestCases]);

  // Handle test case selection
  const handleTestCaseSelection = (testCaseId, checked) => {
    const newSelection = new Set(selectedTestCases);
    if (checked) {
      newSelection.add(testCaseId);
    } else {
      newSelection.delete(testCaseId);
    }
    setSelectedTestCases(newSelection);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedTestCases(new Set(filteredTestCases.map(tc => tc.id)));
    } else {
      setSelectedTestCases(new Set());
    }
  };

  // NEW: Clear selection function like in Requirements
  const handleClearSelection = () => {
    setSelectedTestCases(new Set());
  };

  // Execute selected test cases
  const executeSelectedTests = () => {
    if (selectedTestCases.size === 0) return;
    setShowExecutionModal(true);
  };

  // Toggle row expansion
  const toggleRowExpansion = (testCaseId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(testCaseId)) {
      newExpanded.delete(testCaseId);
    } else {
      newExpanded.add(testCaseId);
    }
    setExpandedRows(newExpanded);
  };

  // Handle new test case creation
  const handleNewTestCase = () => {
    setEditingTestCase({
      id: '',
      name: '',
      description: '',
      status: 'Not Run',
      automationStatus: 'Manual',
      priority: 'Medium',
      requirementIds: [],
      version: selectedVersion !== 'unassigned' ? selectedVersion : '',
      tags: [],
      assignee: ''
    });
    setShowEditModal(true);
  };

  // Handle test case editing
  const handleEditTestCase = (testCase) => {
    setEditingTestCase({...testCase});
    setShowEditModal(true);
  };

  // Save test case (create or update)
  const handleSaveTestCase = (testCaseData) => {
    try {
      if (testCaseData.id && testCases.find(tc => tc.id === testCaseData.id)) {
        // Update existing
        dataStore.updateTestCase(testCaseData.id, testCaseData);
      } else {
        // Create new
        dataStore.addTestCase(testCaseData);
      }
      setShowEditModal(false);
      setEditingTestCase(null);
    } catch (error) {
      console.error('Error saving test case:', error);
      alert('Error saving test case: ' + error.message);
    }
  };

  // Delete test case
  const handleDeleteTestCase = (testCaseId) => {
    if (window.confirm('Are you sure you want to delete this test case?')) {
      try {
        dataStore.deleteTestCase(testCaseId);
        setSelectedTestCases(prev => {
          const newSet = new Set(prev);
          newSet.delete(testCaseId);
          return newSet;
        });
      } catch (error) {
        console.error('Error deleting test case:', error);
        alert('Error deleting test case: ' + error.message);
      }
    }
  };

  // Execute single test case
  const handleExecuteTestCase = (testCase) => {
    setSelectedTestCases(new Set([testCase.id]));
    setShowExecutionModal(true);
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedTestCases.size === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedTestCases.size} test case(s)?`)) {
      try {
        Array.from(selectedTestCases).forEach(testCaseId => {
          dataStore.deleteTestCase(testCaseId);
        });
        setSelectedTestCases(new Set());
      } catch (error) {
        console.error('Error deleting test cases:', error);
        alert('Error deleting test cases: ' + error.message);
      }
    }
  };

  // Format last execution date
  const formatLastExecution = (lastExecuted) => {
    if (!lastExecuted) return 'Never';
    const date = new Date(lastExecuted);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!hasTestCases) {
    return (
      <MainLayout title="Test Cases" hasData={false}>
        <EmptyState 
          title="No Test Cases Found" 
          message="Import test cases to start managing your test suite. You can import from GitHub repositories or upload JSON files."
          actionText="Import Test Cases"
          actionPath="/import#testcases-tab"
          icon="testcases"
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Test Cases" hasData={hasTestCases}>
      <div className="space-y-6">
        {/* Version indicator for unassigned view */}
        {selectedVersion === 'unassigned' && (
          <div className="bg-blue-100 p-4 rounded-lg mb-6 text-blue-800">
            <div className="font-medium">Showing All Items (Unassigned View)</div>
            <p className="text-sm mt-1">
              This view shows all test cases, including those that may be assigned to versions that haven't been created yet.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Test Cases</h1>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleNewTestCase}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="mr-2" size={16} />
              Add
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">{summaryStats.total}</div>
            <div className="text-sm text-gray-500">Total Test Cases</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{summaryStats.passed}</div>
            <div className="text-sm text-gray-500">Passed</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">{summaryStats.failed}</div>
            <div className="text-sm text-gray-500">Failed</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-600">{summaryStats.notRun}</div>
            <div className="text-sm text-gray-500">Not Run</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">{summaryStats.blocked}</div>
            <div className="text-sm text-gray-500">Blocked</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{summaryStats.automationRate}%</div>
            <div className="text-sm text-gray-500">Automated</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">{summaryStats.linkageRate}%</div>
            <div className="text-sm text-gray-500">Linked</div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search test cases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 p-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All Status</option>
              <option value="Passed">Passed</option>
              <option value="Failed">Failed</option>
              <option value="Not Found">Not Found</option>
              <option value="Blocked">Blocked</option>
              <option value="Not Run">Not Run</option>
            </select>

            {/* Automation Filter */}
            <select
              value={automationFilter}
              onChange={(e) => setAutomationFilter(e.target.value)}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All Automation</option>
              <option value="Automated">Automated</option>
              <option value="Manual">Manual</option>
              <option value="Semi-Automated">Semi-Automated</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Traceability Mode */}
            <select
              value={traceabilityMode}
              onChange={(e) => setTraceabilityMode(e.target.value)}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="standalone">All Test Cases</option>
              <option value="linked">Linked to Requirements</option>
              <option value="unlinked">Orphaned Test Cases</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions - Updated with Clear Selection like Requirements */}
        {selectedTestCases.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-blue-700">
                {selectedTestCases.size} test case(s) selected
              </span>
              <div className="flex gap-2">
                {/* UPDATED: Execute button styled like traceability matrix */}
                <button
                  onClick={executeSelectedTests}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                  disabled={selectedTestCases.size === 0}
                  title="Execute selected test cases"
                >
                  <Play className="mr-1" size={14} />
                  Run Tests
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
                >
                  <Trash2 size={14} className="mr-1" />
                  Delete Selected
                </button>
                {/* NEW: Clear Selection button like Requirements */}
                <button
                  onClick={handleClearSelection}
                  className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Test Cases Table - FIXED: Better sizing and added Last Execution */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      checked={filteredTestCases.length > 0 && selectedTestCases.size === filteredTestCases.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    ID
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-80">
                    TEST CASE
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    STATUS
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    PRIORITY
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    AUTO
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    REQS
                  </th>
                  {/* NEW: Last Execution column */}
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    LAST RUN
                  </th>
                  <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTestCases.map((testCase) => {
                  const isExpanded = expandedRows.has(testCase.id);
                  const isSelected = selectedTestCases.has(testCase.id);
                  
                  return (
                    <React.Fragment key={testCase.id}>
                      <tr className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleTestCaseSelection(testCase.id, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            <button
                              onClick={() => toggleRowExpansion(testCase.id)}
                              className="mr-1 p-1 hover:bg-gray-200 rounded"
                            >
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                            <span className="truncate">{testCase.id}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-start">
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate" title={testCase.name}>
                                {testCase.name}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {testCase.description && testCase.description.substring(0, 60)}
                                {testCase.description && testCase.description.length > 60 && '...'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded ${
                            testCase.status === 'Passed' ? 'bg-green-100 text-green-800' :
                            testCase.status === 'Failed' ? 'bg-red-100 text-red-800' :
                            testCase.status === 'Blocked' ? 'bg-yellow-100 text-yellow-800' :
                            testCase.status === 'Not Found' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {testCase.status === 'Not Run' ? 'Not Run' : testCase.status}
                          </span>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded ${
                            testCase.priority === 'High' ? 'bg-red-50 text-red-600' :
                            testCase.priority === 'Medium' ? 'bg-yellow-50 text-yellow-600' :
                            'bg-gray-50 text-gray-600'
                          }`}>
                            {testCase.priority}
                          </span>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded ${
                            testCase.automationStatus === 'Automated' ? 'bg-blue-100 text-blue-800' :
                            testCase.automationStatus === 'Semi-Automated' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {testCase.automationStatus === 'Automated' ? 'Auto' : 
                             testCase.automationStatus === 'Semi-Automated' ? 'Semi' : 'Manual'}
                          </span>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-500">
                            {testCase.requirementIds && testCase.requirementIds.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {testCase.requirementIds.slice(0, 1).map(reqId => (
                                  <span key={reqId} className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs truncate">
                                    {reqId}
                                  </span>
                                ))}
                                {testCase.requirementIds.length > 1 && (
                                  <span className="text-gray-400">+{testCase.requirementIds.length - 1}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">None</span>
                            )}
                          </div>
                        </td>
                        {/* NEW: Last Execution column */}
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-500 truncate">
                            {testCase.lastExecuted ? (
                              <>
                                <div>{new Date(testCase.lastExecuted).toLocaleDateString()}</div>
                                {testCase.lastExecutedBy && (
                                  <div className="text-xs text-gray-400 truncate">
                                    {testCase.lastExecutedBy}
                                  </div>
                                )}
                              </>
                            ) : (
                              'Never'
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-1">
                            {/* UPDATED: Execute button styled like traceability matrix */}
                            <button
                              onClick={() => handleExecuteTestCase(testCase)}
                              className="inline-flex items-center px-1.5 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs"
                              title="Execute Test"
                            >
                              <Play size={12} />
                            </button>
                            <button
                              onClick={() => handleEditTestCase(testCase)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Edit Test Case"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteTestCase(testCase.id)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Delete Test Case"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Row Content */}
                      {isExpanded && (
                        <tr>
                          <td colSpan="9" className="px-4 py-4 bg-gray-50">
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium text-gray-900">Description</h4>
                                <p className="text-sm text-gray-600 mt-1">{testCase.description}</p>
                              </div>
                              
                              {testCase.steps && (
                                <div>
                                  <h4 className="font-medium text-gray-900">Steps</h4>
                                  <ol className="list-decimal list-inside text-sm text-gray-600 mt-1 space-y-1">
                                    {testCase.steps.map((step, index) => (
                                      <li key={index}>{step}</li>
                                    ))}
                                  </ol>
                                </div>
                              )}
                              
                              {testCase.expectedResult && (
                                <div>
                                  <h4 className="font-medium text-gray-900">Expected Result</h4>
                                  <p className="text-sm text-gray-600 mt-1">{testCase.expectedResult}</p>
                                </div>
                              )}
                              
                              {testCase.tags && testCase.tags.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-gray-900">Tags</h4>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {testCase.tags.map(tag => (
                                      <span key={tag} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-gray-900">Version:</span>
                                  <span className="ml-1 text-gray-600">{testCase.version || 'Unassigned'}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-900">Assignee:</span>
                                  <span className="ml-1 text-gray-600">{testCase.assignee || 'Unassigned'}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-900">Duration:</span>
                                  <span className="ml-1 text-gray-600">{testCase.estimatedDuration || 0} min</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-900">Last Executed:</span>
                                  <span className="ml-1 text-gray-600">
                                    {formatLastExecution(testCase.lastExecuted)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Info */}
        <div className="text-sm text-gray-500 text-center">
          Showing {filteredTestCases.length} of {versionFilteredTestCases.length} test cases
          {selectedVersion !== 'unassigned' && (
            <span> for version {versions.find(v => v.id === selectedVersion)?.name || selectedVersion}</span>
          )}
        </div>

        {/* Traceability Mode Info */}
        {traceabilityMode !== 'standalone' && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            {traceabilityMode === 'linked' && (
              <p className="text-sm text-blue-800">
                Showing only test cases that are linked to requirements. Use this mode to focus on traced test cases.
              </p>
            )}
            {traceabilityMode === 'unlinked' && (
              <p className="text-sm text-blue-800">
                Showing only test cases that are NOT linked to any requirements. These orphaned test cases may need requirement association.
              </p>
            )}
          </div>
        )}

        {/* Test Execution Modal - USE UNIFIED COMPONENT */}
        {showExecutionModal && (
          <TestExecutionModal
            requirement={null} // null for bulk execution from Test Cases page
            testCases={Array.from(selectedTestCases).map(id => filteredTestCases.find(tc => tc.id === id)).filter(Boolean)}
            isOpen={showExecutionModal}
            onClose={() => {
              setShowExecutionModal(false);
              setSelectedTestCases(new Set());
            }}
            onTestComplete={(results) => {
              console.log('Test execution completed in TestCases page:', results);
              // The unified TestExecutionModal handles all DataStore updates
              // Just clean up UI state here
              setShowExecutionModal(false);
              setSelectedTestCases(new Set());
            }}
          />
        )}

        {/* Edit Test Case Modal */}
        {showEditModal && (
          <EditTestCaseModal
            testCase={editingTestCase}
            onSave={handleSaveTestCase}
            onCancel={() => {
              setShowEditModal(false);
              setEditingTestCase(null);
            }}
          />
        )}
      </div>
    </MainLayout>
  );
};

// Edit Test Case Modal Component
const EditTestCaseModal = ({ testCase, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    id: testCase?.id || '',
    name: testCase?.name || '',
    description: testCase?.description || '',
    status: testCase?.status || 'Not Run',
    automationStatus: testCase?.automationStatus || 'Manual',
    priority: testCase?.priority || 'Medium',
    version: testCase?.version || '',
    requirementIds: testCase?.requirementIds || [],
    steps: testCase?.steps || [],
    expectedResult: testCase?.expectedResult || '',
    tags: testCase?.tags || [],
    assignee: testCase?.assignee || '',
    estimatedDuration: testCase?.estimatedDuration || 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      alert('Test case name is required');
      return;
    }

    // Generate ID if creating new test case
    if (!formData.id) {
      formData.id = `TC_${Date.now()}`;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {testCase?.id ? 'Edit Test Case' : 'Create New Test Case'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">ID</label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({...formData, id: e.target.value})}
                  placeholder="Auto-generated if empty"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Not Run">Not Run</option>
                  <option value="Passed">Passed</option>
                  <option value="Failed">Failed</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Not Found">Not Found</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Automation</label>
                <select
                  value={formData.automationStatus}
                  onChange={(e) => setFormData({...formData, automationStatus: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Manual">Manual</option>
                  <option value="Automated">Automated</option>
                  <option value="Semi-Automated">Semi-Automated</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Version</label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData({...formData, version: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Expected Result</label>
              <textarea
                value={formData.expectedResult}
                onChange={(e) => setFormData({...formData, expectedResult: e.target.value})}
                rows={2}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
              >
                {testCase?.id ? 'Update' : 'Create'} Test Case
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TestCases;
// src/pages/TestCases.jsx - Complete Fixed Version
import React, { useState, useEffect, useMemo } from 'react';
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
import { useVersionContext } from '../context/VersionContext';
import dataStore from '../services/DataStore';

const TestCases = () => {
  // Get version context
  const { selectedVersion } = useVersionContext();

  // State for data from DataStore
  const [testCases, setTestCases] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [mapping, setMapping] = useState({});
  const [hasTestCases, setHasTestCases] = useState(false); // FIXED: Check specifically for test cases

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [automationFilter, setAutomationFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [versionFilter, setVersionFilter] = useState('All');
  const [traceabilityMode, setTraceabilityMode] = useState('standalone'); // 'linked', 'unlinked', 'standalone'
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
      setHasTestCases(dataStore.hasTestCases()); // FIXED: Use specific test case check
    };

    // Initial load
    updateData();
    
    // Subscribe to DataStore changes
    const unsubscribe = dataStore.subscribe(updateData);
    
    return () => unsubscribe();
  }, []);

  // Filtered test cases
  const filteredTestCases = useMemo(() => {
    return testCases.filter(tc => {
      const matchesSearch = tc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           tc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (tc.description && tc.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'All' || tc.status === statusFilter;
      const matchesAutomation = automationFilter === 'All' || tc.automationStatus === automationFilter;
      const matchesPriority = priorityFilter === 'All' || tc.priority === priorityFilter;
      const matchesVersion = versionFilter === 'All' || tc.version === versionFilter;
      
      // Determine if test case has requirement links
      const hasRequirementLinks = tc.requirementIds && tc.requirementIds.length > 0;
      
      const matchesTraceability = traceabilityMode === 'standalone' || 
                                 (traceabilityMode === 'linked' && hasRequirementLinks) ||
                                 (traceabilityMode === 'unlinked' && !hasRequirementLinks);

      return matchesSearch && matchesStatus && matchesAutomation && 
             matchesPriority && matchesVersion && matchesTraceability;
    });
  }, [testCases, searchQuery, statusFilter, automationFilter, priorityFilter, versionFilter, traceabilityMode]);

  // Get unique values for filters
  const uniqueVersions = [...new Set(testCases.map(tc => tc.version).filter(Boolean))];
  const statuses = ['All', 'Passed', 'Failed', 'Not Run', 'Blocked'];
  const automationStatuses = ['All', 'Automated', 'Manual', 'Planned'];
  const priorities = ['All', 'High', 'Medium', 'Low'];

  // Status styling
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Passed': return 'bg-green-100 text-green-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      case 'Blocked': return 'bg-yellow-100 text-yellow-800';
      case 'Not Run': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAutomationStyle = (automation) => {
    switch (automation) {
      case 'Automated': return 'bg-blue-100 text-blue-800';
      case 'Planned': return 'bg-orange-100 text-orange-800';
      case 'Manual': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Summary statistics
  const summaryStats = useMemo(() => {
    const total = filteredTestCases.length;
    const passed = filteredTestCases.filter(tc => tc.status === 'Passed').length;
    const failed = filteredTestCases.filter(tc => tc.status === 'Failed').length;
    const notRun = filteredTestCases.filter(tc => tc.status === 'Not Run').length;
    const automated = filteredTestCases.filter(tc => tc.automationStatus === 'Automated').length;
    const linked = filteredTestCases.filter(tc => tc.requirementIds && tc.requirementIds.length > 0).length;

    return {
      total,
      passed,
      failed,
      notRun,
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

  return (
    <MainLayout title="Test Cases" hasData={hasTestCases}>
      {!hasTestCases ? (
        <EmptyState 
          title="No Test Cases Found" 
          message="Import test cases to start managing your test suite. You can import from GitHub repositories or upload JSON files."
          actionText="Import Data"
          actionPath="/import"
          icon="testcases"
        />
      ) : (
        <div className="space-y-6">
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
              <div className="text-2xl font-bold text-blue-600">{summaryStats.passRate}%</div>
              <div className="text-sm text-gray-500">Pass Rate</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-purple-600">{summaryStats.automationRate}%</div>
              <div className="text-sm text-gray-500">Automated</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-orange-600">{summaryStats.linkageRate}%</div>
              <div className="text-sm text-gray-500">Linked</div>
            </div>
          </div>

          {/* No Requirements Warning */}
          {requirements.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">No Requirements Found</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>You have test cases but no requirements. Some features like requirement linking and traceability analysis will be limited. Consider importing requirements to enable full functionality.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters and Controls */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search test cases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>

              {/* Automation Filter */}
              <select
                value={automationFilter}
                onChange={(e) => setAutomationFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {automationStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {priorities.map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Traceability Mode Toggle - Only show if requirements exist */}
              {requirements.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">View Mode:</span>
                  <div className="bg-gray-100 rounded-lg p-1 flex">
                    <button
                      onClick={() => setTraceabilityMode('linked')}
                      className={`px-3 py-1 rounded-md text-sm ${
                        traceabilityMode === 'linked' 
                          ? 'bg-white shadow-sm text-blue-600' 
                          : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Link className="inline mr-1" size={14} />
                      Linked Only
                    </button>
                    <button
                      onClick={() => setTraceabilityMode('unlinked')}
                      className={`px-3 py-1 rounded-md text-sm ${
                        traceabilityMode === 'unlinked' 
                          ? 'bg-white shadow-sm text-orange-600' 
                          : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Unlink className="inline mr-1" size={14} />
                      Unlinked Only
                    </button>
                    <button
                      onClick={() => setTraceabilityMode('standalone')}
                      className={`px-3 py-1 rounded-md text-sm ${
                        traceabilityMode === 'standalone' 
                          ? 'bg-white shadow-sm text-green-600' 
                          : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Eye className="inline mr-1" size={14} />
                      All Test Cases
                    </button>
                  </div>
                </div>
              )}

              {/* Bulk Actions */}
              {selectedTestCases.size > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {selectedTestCases.size} selected
                  </span>
                  <button
                    onClick={executeSelectedTests}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center"
                  >
                    <Play className="mr-1" size={14} />
                    Run Selected
                  </button>
                  <button 
                    onClick={handleBulkDelete}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Delete Selected
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Test Cases Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedTestCases.size === filteredTestCases.length && filteredTestCases.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Test Case
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Automation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    {requirements.length > 0 && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requirements
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Executed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTestCases.map((testCase) => (
                    <React.Fragment key={testCase.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedTestCases.has(testCase.id)}
                            onChange={(e) => handleTestCaseSelection(testCase.id, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <button
                              onClick={() => toggleRowExpansion(testCase.id)}
                              className="mr-2 text-gray-400 hover:text-gray-600"
                            >
                              {expandedRows.has(testCase.id) ? (
                                <ChevronDown size={16} />
                              ) : (
                                <ChevronRight size={16} />
                              )}
                            </button>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{testCase.id}</div>
                              <div className="text-sm text-gray-500">{testCase.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusStyle(testCase.status)}`}>
                            {testCase.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAutomationStyle(testCase.automationStatus)}`}>
                            {testCase.automationStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityStyle(testCase.priority)}`}>
                            {testCase.priority}
                          </span>
                        </td>
                        {requirements.length > 0 && (
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {testCase.requirementIds && testCase.requirementIds.length > 0 ? (
                                testCase.requirementIds.map(reqId => (
                                  <span key={reqId} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                    {reqId}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-400 italic">No requirements linked</span>
                              )}
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {testCase.lastExecuted ? (
                            <div>
                              <div>{new Date(testCase.lastExecuted).toLocaleDateString()}</div>
                              <div className="text-xs">{testCase.executionTime}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Never</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleExecuteTestCase(testCase)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Execute test case"
                            >
                              <Play size={16} />
                            </button>
                            <button 
                              onClick={() => handleEditTestCase(testCase)}
                              className="text-gray-600 hover:text-gray-900"
                              title="Edit test case"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteTestCase(testCase.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete test case"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRows.has(testCase.id) && (
                        <tr>
                          <td colSpan={requirements.length > 0 ? "8" : "7"} className="px-6 py-4 bg-gray-50">
                            <div className="space-y-3">
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-1">Description</h4>
                                <p className="text-sm text-gray-700">{testCase.description || 'No description available'}</p>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 mb-1">Version</h4>
                                  <p className="text-sm text-gray-700">{testCase.version || 'Not specified'}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 mb-1">Assignee</h4>
                                  <p className="text-sm text-gray-700">{testCase.assignee || 'Not assigned'}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 mb-1">Tags</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {testCase.tags && testCase.tags.length > 0 ? (
                                      testCase.tags.map(tag => (
                                        <span key={tag} className="inline-flex px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                                          {tag}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-xs text-gray-500 italic">No tags</span>
                                    )}
                                  </div>
                                </div>
                                {requirements.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-1">Requirements</h4>
                                    <div className="space-y-1">
                                      {testCase.requirementIds && testCase.requirementIds.length > 0 ? (
                                        testCase.requirementIds.map(reqId => {
                                          const req = requirements.find(r => r.id === reqId);
                                          return (
                                            <div key={reqId} className="text-sm text-gray-700">
                                              <span className="font-medium">{reqId}</span>
                                              {req && <span className="text-gray-500"> - {req.name}</span>}
                                            </div>
                                          );
                                        })
                                      ) : (
                                        <p className="text-sm text-gray-500 italic">Not linked to any requirements</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTestCases.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  <Clock className="mx-auto h-12 w-12 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No test cases found</h3>
                  <p>Try adjusting your filters or import some test cases to get started.</p>
                </div>
              </div>
            )}
          </div>

          {/* Mode Description - Only show if requirements exist */}
          {requirements.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Current View Mode: {traceabilityMode}</h3>
              {traceabilityMode === 'linked' && (
                <p className="text-sm text-blue-800">
                  Showing only test cases that are linked to requirements. Use this mode to focus on requirement coverage and traceability analysis.
                </p>
              )}
              {traceabilityMode === 'unlinked' && (
                <p className="text-sm text-blue-800">
                  Showing only test cases that are NOT linked to any requirements. Use this mode to identify orphaned test cases that may need requirement mapping.
                </p>
              )}
              {traceabilityMode === 'standalone' && (
                <p className="text-sm text-blue-800">
                  Showing all test cases regardless of requirement linkage. Use this mode for comprehensive test case management without focusing on traceability.
                </p>
              )}
            </div>
          )}

          {/* Test Case Edit Modal */}
          {showEditModal && (
            <TestCaseEditModal
              testCase={editingTestCase}
              requirements={requirements}
              onSave={handleSaveTestCase}
              onCancel={() => {
                setShowEditModal(false);
                setEditingTestCase(null);
              }}
            />
          )}

          {/* Test Execution Modal */}
          {showExecutionModal && (
            <TestExecutionModal
              testCases={Array.from(selectedTestCases).map(id => 
                testCases.find(tc => tc.id === id)
              ).filter(Boolean)}
              onComplete={(results) => {
                // Update test case statuses based on execution results
                try {
                  dataStore.updateTestExecutionResults(results);
                } catch (error) {
                  console.error('Error updating test execution results:', error);
                }
                
                setShowExecutionModal(false);
                setSelectedTestCases(new Set());
              }}
              onCancel={() => {
                setShowExecutionModal(false);
              }}
            />
          )}
        </div>
      )}
    </MainLayout>
  );
};

// Test Case Edit Modal Component
const TestCaseEditModal = ({ testCase, requirements, onSave, onCancel }) => {
  const [formData, setFormData] = useState(testCase);
  const [selectedRequirements, setSelectedRequirements] = useState(new Set(testCase.requirementIds || []));
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      requirementIds: Array.from(selectedRequirements),
      tags: formData.tags || []
    });
  };

  const toggleRequirement = (reqId) => {
    const newSet = new Set(selectedRequirements);
    if (newSet.has(reqId)) {
      newSet.delete(reqId);
    } else {
      newSet.add(reqId);
    }
    setSelectedRequirements(newSet);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {testCase.id ? 'Edit Test Case' : 'New Test Case'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Case Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Not Run">Not Run</option>
                <option value="Passed">Passed</option>
                <option value="Failed">Failed</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Automation Status
              </label>
              <select
                value={formData.automationStatus}
                onChange={(e) => setFormData(prev => ({ ...prev, automationStatus: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Manual">Manual</option>
                <option value="Planned">Planned</option>
                <option value="Automated">Automated</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Version
              </label>
              <input
                type="text"
                value={formData.version || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., v1.0"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assignee
            </label>
            <input
              type="email"
              value={formData.assignee || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, assignee: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="assignee@company.com"
            />
          </div>

          {/* Only show requirements section if requirements exist */}
          {requirements.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Requirements Linkage
              </label>
              <div className="border border-gray-300 rounded-md p-3 max-h-32 overflow-y-auto">
                {requirements.map(req => (
                  <label key={req.id} className="flex items-center mb-2 last:mb-0">
                    <input
                      type="checkbox"
                      checked={selectedRequirements.has(req.id)}
                      onChange={() => toggleRequirement(req.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    <span className="text-sm">
                      <span className="font-medium">{req.id}</span> - {req.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(formData.tags || []).map(tag => (
                <span key={tag} className="inline-flex items-center px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add tag"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-gray-600 text-white rounded-r-md hover:bg-gray-700"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {testCase.id ? 'Update' : 'Create'} Test Case
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Test Execution Modal Component
const TestExecutionModal = ({ testCases, onComplete, onCancel }) => {
  const [executing, setExecuting] = useState(false);
  const [currentTest, setCurrentTest] = useState(0);
  const [results, setResults] = useState([]);

  const executeTests = async () => {
    setExecuting(true);
    const newResults = [];

    for (let i = 0; i < testCases.length; i++) {
      setCurrentTest(i);
      
      // Simulate test execution
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      const result = {
        testCaseId: testCases[i].id,
        status: Math.random() > 0.3 ? 'Passed' : 'Failed',
        executionTime: `${(Math.random() * 5 + 0.5).toFixed(1)}s`
      };
      
      newResults.push(result);
      setResults([...newResults]);
    }

    setExecuting(false);
    setTimeout(() => onComplete(newResults), 1500);
  };

  useEffect(() => {
    executeTests();
  }, []);

  const passedCount = results.filter(r => r.status === 'Passed').length;
  const failedCount = results.filter(r => r.status === 'Failed').length;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Test Execution
          </h3>

          {executing ? (
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">
                Executing test {currentTest + 1} of {testCases.length}
              </div>
              <div className="text-sm font-medium mb-2">
                {testCases[currentTest]?.name}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${((currentTest + 1) / testCases.length) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <div className="text-lg font-semibold text-green-600 mb-2">
                Execution Complete!
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-green-100 p-2 rounded">
                  <div className="font-semibold text-green-800">{passedCount}</div>
                  <div className="text-green-600">Passed</div>
                </div>
                <div className="bg-red-100 p-2 rounded">
                  <div className="font-semibold text-red-800">{failedCount}</div>
                  <div className="text-red-600">Failed</div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
            {results.map((result, index) => (
              <div key={result.testCaseId} className="flex justify-between items-center text-sm">
                <span className="text-left">{testCases[index]?.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">{result.executionTime}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    result.status === 'Passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {!executing && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestCases;
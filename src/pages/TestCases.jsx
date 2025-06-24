// src/pages/TestCases.jsx - Complete Fixed Version
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
      setHasTestCases(dataStore.getTestCases().length > 0);
    };
    
    updateData();
    
    // Subscribe to DataStore changes
    const unsubscribe = dataStore.subscribe(updateData);
    
    // Clean up subscription
    return () => unsubscribe();
  }, []);

  // Filter test cases based on various criteria
  const filteredTestCases = useMemo(() => {
    return testCases.filter(testCase => {
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

      // Version filter
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
  }, [testCases, searchQuery, statusFilter, automationFilter, priorityFilter, selectedVersion, traceabilityMode]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const total = filteredTestCases.length;
    const passed = filteredTestCases.filter(tc => tc.status === 'Pass').length;
    const failed = filteredTestCases.filter(tc => tc.status === 'Fail').length;
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
          actionText="Import Test Cases"
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

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search test cases..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="All">All Statuses</option>
                <option value="Not Run">Not Run</option>
                <option value="Pass">Pass</option>
                <option value="Fail">Fail</option>
                <option value="Blocked">Blocked</option>
                <option value="Skip">Skip</option>
              </select>

              {/* Automation Filter */}
              <select
                value={automationFilter}
                onChange={(e) => setAutomationFilter(e.target.value)}
                className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="All">All Types</option>
                <option value="Manual">Manual</option>
                <option value="Automated">Automated</option>
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

          {/* Bulk Actions */}
          {selectedTestCases.size > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-blue-800">
                  {selectedTestCases.size} test case(s) selected
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={executeSelectedTests}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                  >
                    <Play className="mr-1" size={14} />
                    Execute
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
                  >
                    <Trash2 className="mr-1" size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Test Cases Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={filteredTestCases.length > 0 && selectedTestCases.size === filteredTestCases.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Test Case
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Automation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requirements
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTestCases.map((testCase) => (
                    <React.Fragment key={testCase.id}>
                      <tr className={selectedTestCases.has(testCase.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedTestCases.has(testCase.id)}
                            onChange={(e) => handleTestCaseSelection(testCase.id, e.target.checked)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
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
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            testCase.status === 'Pass' ? 'bg-green-100 text-green-800' :
                            testCase.status === 'Fail' ? 'bg-red-100 text-red-800' :
                            testCase.status === 'Blocked' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {testCase.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            testCase.priority === 'High' ? 'bg-red-100 text-red-800' :
                            testCase.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {testCase.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            testCase.automationStatus === 'Automated' ? 'bg-blue-100 text-blue-800' :
                            testCase.automationStatus === 'Semi-Automated' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {testCase.automationStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {testCase.requirementIds && testCase.requirementIds.length > 0 ? (
                              <span className="flex items-center text-green-600">
                                <Link size={14} className="mr-1" />
                                {testCase.requirementIds.length}
                              </span>
                            ) : (
                              <span className="flex items-center text-gray-400">
                                <Unlink size={14} className="mr-1" />
                                None
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleExecuteTestCase(testCase)}
                              className="text-green-600 hover:text-green-900"
                              title="Execute Test"
                            >
                              <Play size={16} />
                            </button>
                            <button
                              onClick={() => handleEditTestCase(testCase)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit Test Case"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteTestCase(testCase.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Test Case"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded Row Details */}
                      {expandedRows.has(testCase.id) && (
                        <tr>
                          <td colSpan="7" className="px-6 py-4 bg-gray-50">
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium text-gray-900">Description</h4>
                                <p className="text-sm text-gray-600">{testCase.description || 'No description provided'}</p>
                              </div>
                              
                              {testCase.steps && testCase.steps.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-gray-900">Test Steps</h4>
                                  <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                                    {testCase.steps.map((step, index) => (
                                      <li key={index}>{step}</li>
                                    ))}
                                  </ol>
                                </div>
                              )}
                              
                              {testCase.expectedResult && (
                                <div>
                                  <h4 className="font-medium text-gray-900">Expected Result</h4>
                                  <p className="text-sm text-gray-600">{testCase.expectedResult}</p>
                                </div>
                              )}
                              
                              {testCase.tags && testCase.tags.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-gray-900">Tags</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {testCase.tags.map((tag, index) => (
                                      <span key={index} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-gray-900">Version:</span>
                                  <span className="ml-1 text-gray-600">{testCase.version || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-900">Assignee:</span>
                                  <span className="ml-1 text-gray-600">{testCase.assignee || 'Unassigned'}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-900">Duration:</span>
                                  <span className="ml-1 text-gray-600">{testCase.estimatedDuration || 'N/A'} min</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-900">Last Executed:</span>
                                  <span className="ml-1 text-gray-600">
                                    {testCase.lastExecuted ? new Date(testCase.lastExecuted).toLocaleDateString() : 'Never'}
                                  </span>
                                </div>
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
                  Showing only test cases that are NOT linked to any requirements. Use this mode to identify orphaned test cases that may need requirement mapping.
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

// FIXED Test Case Edit Modal Component with proper scrolling layout
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-screen flex flex-col">
        {/* Fixed Header */}
        <div className="p-6 pb-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold">
            {testCase.id ? 'Edit Test Case' : 'Create New Test Case'}
          </h3>
        </div>
        
        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-4">
          <form onSubmit={handleSubmit} id="test-case-form">
            {/* ID Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
              <input
                type="text"
                name="id"
                value={formData.id || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={!formData.id ? "Auto-generated" : ""}
                disabled={!!formData.id}
              />
            </div>

            {/* Name Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="Enter test case name"
              />
            </div>

            {/* Description Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                required
                placeholder="Enter test case description"
              />
            </div>

            {/* Status and Priority */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status || 'Not Run'}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Not Run">Not Run</option>
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Skip">Skip</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  name="priority"
                  value={formData.priority || 'Medium'}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* Automation Status and Version */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Automation Status</label>
                <select
                  name="automationStatus"
                  value={formData.automationStatus || 'Manual'}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Manual">Manual</option>
                  <option value="Automated">Automated</option>
                  <option value="Semi-Automated">Semi-Automated</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                <input
                  type="text"
                  name="version"
                  value={formData.version || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., v1.0"
                />
              </div>
            </div>

            {/* Assignee */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
              <input
                type="text"
                name="assignee"
                value={formData.assignee || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter assignee name"
              />
            </div>

            {/* Test Steps */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Steps</label>
              <textarea
                name="steps"
                value={Array.isArray(formData.steps) ? formData.steps.join('\n') : (formData.steps || '')}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  steps: e.target.value.split('\n').filter(step => step.trim())
                }))}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="4"
                placeholder="Enter test steps (one per line)"
              />
            </div>

            {/* Expected Result */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Result</label>
              <textarea
                name="expectedResult"
                value={formData.expectedResult || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="2"
                placeholder="Enter expected result"
              />
            </div>

            {/* Estimated Duration */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Duration (minutes)</label>
              <input
                type="number"
                name="estimatedDuration"
                value={formData.estimatedDuration || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                placeholder="Enter estimated duration in minutes"
              />
            </div>

            {/* Linked Requirements */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Linked Requirements</label>
              <div className="border rounded p-3 max-h-40 overflow-y-auto bg-gray-50">
                {requirements && requirements.length > 0 ? (
                  requirements.map(req => (
                    <label key={req.id} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={selectedRequirements.has(req.id)}
                        onChange={() => toggleRequirement(req.id)}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        <strong>{req.id}</strong>: {req.name}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No requirements available</p>
                )}
              </div>
            </div>

            {/* Tags Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2 min-h-[2rem]">
                {(formData.tags || []).length > 0 ? (
                  (formData.tags || []).map((tag, index) => (
                    <div key={index} className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800 font-bold"
                        title="Remove tag"
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 italic">No tags added</span>
                )}
              </div>
              <div className="flex">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add a tag..."
                  className="flex-1 p-2 border border-r-0 rounded-l focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={addTag}
                  disabled={!tagInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Press Enter or click Add to add a tag</p>
            </div>
          </form>
        </div>
        
        {/* Fixed Footer with Action Buttons */}
        <div className="flex-shrink-0 p-6 pt-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="test-case-form"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              {testCase.id ? 'Update' : 'Create'} Test Case
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Test Execution Modal Component with Live Status and Cancel Capability
const TestExecutionModal = ({ testCases, onComplete, onCancel }) => {
  const [executing, setExecuting] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(-1);
  const [testResults, setTestResults] = useState([]);
  const [executionStarted, setExecutionStarted] = useState(false);
  const [completedTests, setCompletedTests] = useState(0);

  // Initialize test results with "Not Started" status
  useEffect(() => {
    const initialResults = testCases.map(testCase => ({
      id: testCase.id,
      name: testCase.name,
      status: 'Not Started',
      duration: 0,
      startTime: null,
      endTime: null
    }));
    setTestResults(initialResults);
  }, [testCases]);

  // Execute tests sequentially with live updates
  const executeTests = async () => {
    if (cancelled) return;
    
    setExecuting(true);
    setExecutionStarted(true);
    setCompletedTests(0);

    for (let i = 0; i < testCases.length; i++) {
      if (cancelled) {
        // Mark remaining tests as cancelled
        setTestResults(prev => prev.map((result, index) => 
          index >= i ? { ...result, status: 'Cancelled' } : result
        ));
        break;
      }

      setCurrentTestIndex(i);
      
      // Update status to "Running"
      setTestResults(prev => prev.map((result, index) => 
        index === i ? { 
          ...result, 
          status: 'Running', 
          startTime: new Date().toISOString() 
        } : result
      ));

      // Simulate test execution time (1-4 seconds)
      const executionTime = 1000 + Math.random() * 3000;
      await new Promise(resolve => setTimeout(resolve, executionTime));

      if (cancelled) {
        setTestResults(prev => prev.map((result, index) => 
          index === i ? { ...result, status: 'Cancelled' } : result
        ));
        break;
      }

      // Generate random result (70% pass rate)
      const passed = Math.random() > 0.3;
      const endTime = new Date().toISOString();
      
      // Update with final result
      setTestResults(prev => prev.map((result, index) => 
        index === i ? {
          ...result,
          status: passed ? 'Pass' : 'Fail',
          duration: Math.round(executionTime),
          endTime: endTime
        } : result
      ));

      setCompletedTests(i + 1);
    }

    setExecuting(false);
    setCurrentTestIndex(-1);

    // Auto-close after showing results for 3 seconds (unless cancelled)
    if (!cancelled) {
      setTimeout(() => {
        const finalResults = testResults.map(result => ({
          testCaseId: result.id,
          status: result.status,
          duration: result.duration
        }));
        onComplete(finalResults);
      }, 3000);
    }
  };

  // Start execution when modal opens
  useEffect(() => {
    if (testCases.length > 0 && !executionStarted) {
      // Small delay to show the initial state
      setTimeout(() => {
        executeTests();
      }, 500);
    }
  }, [testCases, executionStarted]);

  // Handle cancellation
  const handleCancel = () => {
    setCancelled(true);
    setExecuting(false);
    setCurrentTestIndex(-1);
  };

  // Calculate progress
  const progress = testCases.length > 0 ? (completedTests / testCases.length) * 100 : 0;
  
  // Add progress logging and test results logging
  useEffect(() => {
    console.log('📊 Progress calculation:', {
      completedTests,
      totalTests: testCases.length,
      progress: Math.round(progress),
      cancelled,
      executing
    });
  }, [completedTests, testCases.length, progress, cancelled, executing]);

  // Log test results changes with detailed status info
  useEffect(() => {
    console.log('📋 Test results updated:', testResults.map(r => ({ 
      id: r.id, 
      status: r.status, 
      duration: r.duration,
      startTime: r.startTime ? 'set' : 'null',
      endTime: r.endTime ? 'set' : 'null'
    })));
  }, [testResults]);

  // Get status icon and color for each test
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'Not Started':
        return { icon: Clock, color: 'text-gray-400', bgColor: 'bg-gray-100' };
      case 'Running':
        return { icon: 'spinner', color: 'text-blue-600', bgColor: 'bg-blue-100' };
      case 'Pass':
        return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' };
      case 'Fail':
        return { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' };
      case 'Cancelled':
        return { icon: Pause, color: 'text-orange-600', bgColor: 'bg-orange-100' };
      default:
        return { icon: Clock, color: 'text-gray-400', bgColor: 'bg-gray-100' };
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-screen flex flex-col">
        {/* Fixed Header */}
        <div className="p-6 pb-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            Test Execution {cancelled ? '(Cancelled)' : executing ? '(Running)' : '(Complete)'}
          </h3>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress: {completedTests} of {testCases.length} tests</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  cancelled ? 'bg-orange-500' : executing ? 'bg-blue-600' : 'bg-green-500'
                }`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            {cancelled && (
              <div className="text-xs text-orange-600 mt-1 font-medium">
                Execution cancelled at {Math.round(progress)}%
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Test Results */}
        <div className="flex-1 overflow-y-auto p-6 pt-4">
          <div className="space-y-3">
            {testResults.map((result, index) => {
              const statusDisplay = getStatusDisplay(result.status);
              const StatusIcon = statusDisplay.icon;
              const isCurrentTest = index === currentTestIndex;
              
              return (
                <div 
                  key={result.id}
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    isCurrentTest 
                      ? 'border-blue-300 bg-blue-50 shadow-md' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${statusDisplay.bgColor}`}>
                        {StatusIcon === 'spinner' ? (
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <StatusIcon className={`w-4 h-4 ${statusDisplay.color}`} />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{result.id}</div>
                        <div className="text-sm text-gray-600 truncate max-w-md">{result.name}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm">
                      {result.duration > 0 && (
                        <span className="text-gray-500">
                          {(result.duration / 1000).toFixed(1)}s
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        result.status === 'Pass' ? 'bg-green-100 text-green-800' :
                        result.status === 'Fail' ? 'bg-red-100 text-red-800' :
                        result.status === 'Running' ? 'bg-blue-100 text-blue-800' :
                        result.status === 'Cancelled' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {result.status}
                      </span>
                    </div>
                  </div>
                  
                  {isCurrentTest && executing && (
                    <div className="mt-2 text-xs text-blue-600 font-medium">
                      Currently executing...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 p-6 pt-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {executing ? (
                <span className="flex items-center">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Execution in progress...
                </span>
              ) : cancelled ? (
                <span className="text-orange-600">Execution cancelled</span>
              ) : (
                <span className="text-green-600">Execution completed</span>
              )}
            </div>
            
            <div className="flex gap-3">
              {executing ? (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:ring-2 focus:ring-red-500"
                >
                  Cancel Execution
                </button>
              ) : (
                <>
                  <button
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500"
                  >
                    Close
                  </button>
                  {!cancelled && (
                    <button
                      onClick={() => {
                        const finalResults = testResults
                          .filter(result => result.status === 'Pass' || result.status === 'Fail')
                          .map(result => ({
                            testCaseId: result.id,
                            status: result.status,
                            duration: result.duration
                          }));
                        onComplete(finalResults);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                    >
                      Apply Results
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCases;
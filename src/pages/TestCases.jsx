// src/pages/TestCases.jsx - Simplified Version
import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  X,
} from 'lucide-react';
import MainLayout from '../components/Layout/MainLayout';
import EmptyState from '../components/Common/EmptyState';
import { useVersionContext } from '../context/VersionContext';
import dataStore from '../services/DataStore';

// Helper to get linked requirements for a test case
const getLinkedRequirements = (testCaseId, mapping, requirements) => {
  const linkedReqIds = Object.entries(mapping)
    .filter(([reqId, tcIds]) => tcIds.includes(testCaseId))
    .map(([reqId]) => reqId);
  return requirements.filter(req => linkedReqIds.includes(req.id));
};

// Simplified TestCaseRow Component - No actions, split ID/Name
const TestCaseRow = ({
  testCase,
  onSelect,
  isSelected,
  mapping,
  requirements
}) => {
  const linkedReqs = getLinkedRequirements(testCase.id, mapping, requirements);

  return (
    <tr className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
      {/* Checkbox */}
      <td className="px-6 py-4 whitespace-nowrap w-12">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(testCase.id, e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </td>
      
      {/* ID Column */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">
          {testCase.id}
        </div>
        {testCase.category && (
          <div className="text-xs text-gray-500">
            {testCase.category}
          </div>
        )}
      </td>

      {/* Name Column */}
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">
          {testCase.name}
        </div>
        {testCase.description && (
          <div className="text-xs text-gray-500 mt-1 line-clamp-2">
            {testCase.description}
          </div>
        )}
      </td>

      {/* Priority Column */}
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${
          testCase.priority === 'Critical' || testCase.priority === 'High'
            ? 'bg-red-100 text-red-800 border-red-200'
            : testCase.priority === 'Medium'
            ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
            : 'bg-blue-100 text-blue-800 border-blue-200'
        }`}>
          {testCase.priority || 'Medium'}
        </span>
      </td>

      {/* Automation Column */}
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${
          testCase.automationStatus === 'Automated'
            ? 'bg-green-100 text-green-800 border-green-200'
            : testCase.automationStatus === 'Semi-Automated'
            ? 'bg-blue-100 text-blue-800 border-blue-200'
            : testCase.automationStatus === 'Planned'
            ? 'bg-purple-100 text-purple-800 border-purple-200'
            : 'bg-gray-100 text-gray-800 border-gray-200'
        }`}>
          {testCase.automationStatus || 'Manual'}
        </span>
      </td>

      {/* Requirements Column */}
      <td className="px-6 py-4">
        {linkedReqs.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {linkedReqs.slice(0, 3).map((req) => (
              <span
                key={req.id}
                className="inline-flex px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded border border-purple-200"
                title={req.name}
              >
                {req.id}
              </span>
            ))}
            {linkedReqs.length > 3 && (
              <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded border border-gray-200">
                +{linkedReqs.length - 3}
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-400">
            No requirements linked
          </span>
        )}
      </td>
    </tr>
  );
};

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
  const [selectedTestCases, setSelectedTestCases] = useState(new Set());

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
    return () => unsubscribe();
  }, []);

  // Filter test cases by selected version
  const versionFilteredTestCases = useMemo(() => {
    if (selectedVersion === 'unassigned') {
      return testCases;
    }
    
    return testCases.filter(tc => {
      if (tc.applicableVersions) {
        if (tc.applicableVersions.length === 0) return true;
        return tc.applicableVersions.includes(selectedVersion);
      }
      return !tc.version || tc.version === selectedVersion || tc.version === '';
    });
  }, [testCases, selectedVersion]);

  // Filter test cases by search
  const filteredTestCases = useMemo(() => {
    let filtered = versionFilteredTestCases;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(testCase =>
        testCase.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        testCase.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        testCase.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [versionFilteredTestCases, searchQuery]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const total = filteredTestCases.length;
    const automated = filteredTestCases.filter(tc => tc.automationStatus === 'Automated').length;
    const manual = filteredTestCases.filter(tc => tc.automationStatus === 'Manual').length;
    const notRun = filteredTestCases.filter(tc => tc.status === 'Not Run').length;
    const failed = filteredTestCases.filter(tc => tc.status === 'Failed').length;

    return {
      total,
      automated,
      manual,
      notRun,
      failed,
      automationRate: total > 0 ? Math.round((automated / total) * 100) : 0,
    };
  }, [filteredTestCases]);

  // Handle test case selection
  const handleTestCaseSelection = (testCaseId, checked) => {
    setSelectedTestCases(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(testCaseId);
      } else {
        newSet.delete(testCaseId);
      }
      return newSet;
    });
  };

  // Handle select all
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedTestCases(new Set(filteredTestCases.map(tc => tc.id)));
    } else {
      setSelectedTestCases(new Set());
    }
  };

  // Handle clear selection
  const handleClearSelection = () => {
    setSelectedTestCases(new Set());
  };

  // Handle new test case
  const handleNewTestCase = () => {
    window.location.href = '/import#testcases-tab';
  };

  // Check if no test cases exist
  if (!hasTestCases) {
    return (
      <MainLayout title="Test Cases" hasData={false}>
        <EmptyState
          title="No Test Cases Found"
          message="Get started by importing your test cases to begin tracking your test coverage."
          actionText="Create Test Cases"
          actionPath="/import#testcases-tab"
          icon="tests"
          className="mt-8"
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Test Cases" hasData={hasTestCases}>
      <div className="space-y-6">
        {/* Version indicator for unassigned view */}
        {selectedVersion === 'unassigned' && (
          <div className="mb-4 bg-blue-50 p-3 rounded border border-blue-100">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              Showing All Items (Unassigned View)
            </h3>
            <p className="text-xs text-blue-700 mt-1">
              This view shows all test cases, including those that may be assigned to versions that haven't been created yet.
            </p>
          </div>
        )}

        {/* Header Section - Similar to Requirements page */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header Row: Title, Version, Metrics, Add Button */}
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <div className="flex items-center space-x-6">
              {/* Title & Version */}
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">Test Cases</h1>
                {selectedVersion !== 'unassigned' && (
                  <div className="text-xs text-gray-600 mt-1">
                    Version: <span className="font-medium text-blue-600">
                      {versions.find(v => v.id === selectedVersion)?.name || selectedVersion}
                    </span>
                  </div>
                )}
              </div>

              {/* Inline Metrics Bar */}
              <div className="hidden lg:flex items-center divide-x divide-gray-300">
                <div className="flex items-center space-x-2 px-4">
                  <span className="text-lg font-bold text-gray-900">{summaryStats.total}</span>
                  <span className="text-xs text-gray-500">Total</span>
                </div>
                <div className="flex items-center space-x-2 px-4">
                  <span className="text-lg font-bold text-green-600">{summaryStats.automated}</span>
                  <span className="text-xs text-gray-500">Automated</span>
                </div>
                <div className="flex items-center space-x-2 px-4">
                  <span className="text-lg font-bold text-gray-600">{summaryStats.manual}</span>
                  <span className="text-xs text-gray-500">Manual</span>
                </div>
                <div className="flex items-center space-x-2 px-4">
                  <span className="text-lg font-bold text-orange-600">{summaryStats.notRun}</span>
                  <span className="text-xs text-gray-500">Not Run</span>
                </div>
              </div>
            </div>

            {/* Add Button */}
            <button
              onClick={handleNewTestCase}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center text-sm flex-shrink-0"
            >
              <Plus className="mr-2" size={16} />
              Add
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-6 py-3 bg-gray-50 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search test cases by ID, name, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Mobile Metrics */}
          <div className="lg:hidden px-6 py-3 bg-gray-50">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-lg font-bold text-gray-900">{summaryStats.total}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">{summaryStats.automated}</div>
                <div className="text-xs text-gray-600">Auto</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-600">{summaryStats.manual}</div>
                <div className="text-xs text-gray-600">Manual</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">{summaryStats.notRun}</div>
                <div className="text-xs text-gray-600">Not Run</div>
              </div>
            </div>
          </div>

          {/* Results count */}
          <div className="px-6 py-2 text-sm text-gray-600 bg-gray-50">
            Showing {filteredTestCases.length} of {versionFilteredTestCases.length} test cases
            {selectedTestCases.size > 0 && (
              <span className="ml-2">
                · {selectedTestCases.size} selected
                <button
                  onClick={handleClearSelection}
                  className="ml-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear selection
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Test Cases Table - No grouping, no filters, no actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredTestCases.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No test cases found matching your search.</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 w-12">
                      <input
                        type="checkbox"
                        checked={filteredTestCases.length > 0 && filteredTestCases.every(tc => selectedTestCases.has(tc.id))}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Automation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requirements
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTestCases.map((testCase) => (
                    <TestCaseRow
                      key={testCase.id}
                      testCase={testCase}
                      onSelect={handleTestCaseSelection}
                      isSelected={selectedTestCases.has(testCase.id)}
                      mapping={mapping}
                      requirements={requirements}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default TestCases;
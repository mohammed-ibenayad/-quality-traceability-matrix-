import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Edit,
  Trash2,
  Search,
  Filter,
  Plus,
  ChevronDown,
  ChevronRight,
  Eye,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import MainLayout from '../components/Layout/MainLayout';
import EmptyState from '../components/Common/EmptyState';
import EditRequirementModal from '../components/Requirements/EditRequirementModal';
import TDFInfoTooltip from '../components/Common/TDFInfoTooltip';
import { useVersionContext } from '../context/VersionContext';
import { calculateCoverage } from '../utils/coverage';
import dataStore from '../services/DataStore';
import BulkActionsPanel from '../components/Common/BulkActionsPanel';

import { useLocation } from 'react-router-dom';


/**
 * Helper function to check if a test case applies to a version
 * @param {Object} testCase - Test case object
 * @param {string} selectedVersion - Currently selected version
 * @returns {boolean} True if test case applies to the version
 */
const testCaseAppliesTo = (testCase, selectedVersion) => {
  if (selectedVersion === 'unassigned') return true;

  // Handle new format
  if (testCase.applicableVersions) {
    // Empty array means applies to all versions
    if (testCase.applicableVersions.length === 0) return true;
    return testCase.applicableVersions.includes(selectedVersion);
  }

  // Handle legacy format during transition
  return !testCase.version || testCase.version === selectedVersion || testCase.version === '';
};

/**
 * Helper function to get version tags for display
 * @param {Object} testCase - Test case object
 * @returns {Array} Array of version strings for tag display
 */
const getVersionTags = (testCase) => {
  // Handle new format
  if (testCase.applicableVersions) {
    return testCase.applicableVersions.length > 0
      ? testCase.applicableVersions
      : ['All Versions'];
  }

  // Handle legacy format
  return testCase.version ? [testCase.version] : ['All Versions'];
};

/**
 * Helper function to get display text for test case versions
 * @param {Object} testCase - Test case object
 * @returns {string} Display text for versions
 */
const getVersionDisplayText = (testCase) => {
  const tags = getVersionTags(testCase);
  return tags.length > 3 ? `${tags.length} versions` : tags.join(', ');
};

// Add this helper function near the top with other helper functions
const getAllTags = (requirements) => {
  return [...new Set(requirements.flatMap(req => req.tags || []))];
};

const Requirements = () => {
  // Move ALL useState declarations to the top
  const [requirements, setRequirements] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [mapping, setMapping] = useState({});
  const [editingRequirement, setEditingRequirement] = useState(null);
  const [hasData, setHasData] = useState(false);
  const location = useLocation();


  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [showAllTags, setShowAllTags] = useState(false);
  const [priorityFilterTab, setPriorityFilterTab] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [coverageFilter, setCoverageFilter] = useState('All'); // NEW
  const [selectedTagsFilter, setSelectedTagsFilter] = useState([]); // NEW
  const [selectedRequirements, setSelectedRequirements] = useState(new Set());
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Add the modal state hooks here, before any conditional logic
  const [showVersionAssignmentModal, setShowVersionAssignmentModal] = useState(false);
  const [versionAssignmentAction, setVersionAssignmentAction] = useState(null);
  const [selectedVersionForAssignment, setSelectedVersionForAssignment] = useState('');
  const [showTagAssignmentModal, setShowTagAssignmentModal] = useState(false);
  const [selectedTagsForAssignment, setSelectedTagsForAssignment] = useState([]);
  const [tagAssignmentAction, setTagAssignmentAction] = useState('add');

  // Get version context
  const { selectedVersion, versions } = useVersionContext();

  // Load data from DataStore
  useEffect(() => {
    const updateData = () => {
      setRequirements(dataStore.getRequirements());
      setTestCases(dataStore.getTestCases());
      setMapping(dataStore.getMapping());
      setHasData(dataStore.hasData());
    };

    updateData();

    if (location.state?.searchQuery) {
      setSearchQuery(location.state.searchQuery);
      // Clear the state after using it
      window.history.replaceState({}, document.title);
    }

    // Subscribe to DataStore changes
    const unsubscribe = dataStore.subscribe(updateData);

    // Clean up subscription
    return () => unsubscribe();
  }, [location]);

  // Calculate version-specific coverage
  const versionCoverage = useMemo(() => {
    if (selectedVersion === 'unassigned') {
      return calculateCoverage(requirements, mapping, testCases);
    } else {
      // Pass filtered test cases to calculateCoverage
      const filteredTests = testCases.filter(tc => testCaseAppliesTo(tc, selectedVersion));
      return calculateCoverage(requirements, mapping, filteredTests);
    }
  }, [requirements, mapping, testCases, selectedVersion]);


  // Filter requirements by selected version
  const versionFilteredRequirements = selectedVersion === 'unassigned'
    ? requirements
    : requirements.filter(req => req.versions && req.versions.includes(selectedVersion));

  const nonPriorityFilteredRequirements = useMemo(() => {
    return versionFilteredRequirements.filter(req => {
      // Search filter
      const matchesSearch = !searchQuery || (() => {
        const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/);
        return searchTerms.some(term =>
          req.name.toLowerCase().includes(term) ||
          req.id.toLowerCase().includes(term) ||
          req.description.toLowerCase().includes(term)
        );
      })();

      // Status filter
      const matchesStatus = statusFilter === 'All' || req.status === statusFilter;

      // Type filter
      const matchesType = typeFilter === 'All' || req.type === typeFilter;

      // Coverage filter
      const matchesCoverage = (() => {
        if (coverageFilter === 'All') return true;
        const coverage = versionCoverage.find(c => c.reqId === req.id);
        const hasTests = coverage && coverage.totalTests > 0;
        if (coverageFilter === 'With Tests') return hasTests;
        if (coverageFilter === 'No Coverage') return !hasTests;
        return true;
      })();

      // Tags filter
      const matchesTags = selectedTagsFilter.length === 0 ||
        (req.tags && req.tags.some(tag => selectedTagsFilter.includes(tag)));

      // Apply all filters EXCEPT priorityFilterTab
      const matchesPriorityDropdown = priorityFilter === 'All' || req.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesType &&
        matchesCoverage && matchesTags && matchesPriorityDropdown;
    });
  }, [
    versionFilteredRequirements,
    searchQuery,
    statusFilter,
    typeFilter,
    coverageFilter,
    selectedTagsFilter,
    versionCoverage,
    priorityFilter
  ]);

  // Apply search and filters
  const filteredRequirements = useMemo(() => {
    return versionFilteredRequirements.filter(req => {
      // Search filter
      const matchesSearch = !searchQuery || (() => {
        const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/);
        return searchTerms.some(term =>
          req.name.toLowerCase().includes(term) ||
          req.id.toLowerCase().includes(term) ||
          req.description.toLowerCase().includes(term)
        );
      })();

      // Priority filters (both tab and dropdown)
      const matchesPriority = priorityFilter === 'All' || req.priority === priorityFilter;
      const matchesTabFilter = priorityFilterTab === 'All' || req.priority === priorityFilterTab;

      // Status filter
      const matchesStatus = statusFilter === 'All' || req.status === statusFilter;

      // Type filter
      const matchesType = typeFilter === 'All' || req.type === typeFilter;

      // NEW: Coverage filter
      const matchesCoverage = (() => {
        if (coverageFilter === 'All') return true;

        const coverage = versionCoverage.find(c => c.reqId === req.id);
        const hasTests = coverage && coverage.totalTests > 0;

        if (coverageFilter === 'With Tests') return hasTests;
        if (coverageFilter === 'No Coverage') return !hasTests;

        return true;
      })();

      // NEW: Tags filter
      const matchesTags = selectedTagsFilter.length === 0 ||
        (req.tags && req.tags.some(tag => selectedTagsFilter.includes(tag)));

      return matchesSearch && matchesPriority && matchesStatus && matchesType &&
        matchesTabFilter && matchesCoverage && matchesTags;
    });
  }, [
    versionFilteredRequirements,
    searchQuery,
    priorityFilter,
    statusFilter,
    typeFilter,
    priorityFilterTab,
    coverageFilter,
    selectedTagsFilter,
    versionCoverage
  ]);
  // Calculate summary statistics
  const stats = useMemo(() => {
    const total = filteredRequirements.length;
    const highPriority = filteredRequirements.filter(req => req.priority === 'High').length;

    // FIXED: Calculate stats based on FILTERED requirements only
    const filteredRequirementIds = new Set(filteredRequirements.map(req => req.id));
    const filteredCoverage = versionCoverage.filter(stat => filteredRequirementIds.has(stat.reqId));

    const withTests = filteredCoverage.filter(stat => stat.totalTests > 0).length;
    const noCoverage = total - withTests; // NOW CORRECT: Uses filtered count
    const fullyTested = filteredCoverage.filter(stat => stat.meetsMinimum).length;
    const fullyAutomated = filteredCoverage.filter(stat =>
      stat.automationPercentage === 100 && stat.totalTests > 0
    ).length;

    const avgTDF = total > 0 ?
      (filteredRequirements.reduce((sum, req) => sum + req.testDepthFactor, 0) / total).toFixed(1) : 0;
    const testCoverage = total > 0 ? Math.round((withTests / total) * 100) : 0;

    return {
      total,
      highPriority,
      withTests,
      noCoverage,
      fullyTested,
      fullyAutomated,
      avgTDF,
      testCoverage
    };
  }, [filteredRequirements, versionCoverage]);

  // Handle requirement selection
  const handleRequirementSelection = (reqId, checked) => {
    const newSelection = new Set(selectedRequirements);
    if (checked) {
      newSelection.add(reqId);
    } else {
      newSelection.delete(reqId);
    }
    setSelectedRequirements(newSelection);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRequirements(new Set(filteredRequirements.map(req => req.id)));
    } else {
      setSelectedRequirements(new Set());
    }
  };

  // Toggle row expansion
  const toggleRowExpansion = (reqId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(reqId)) {
      newExpanded.delete(reqId);
    } else {
      newExpanded.add(reqId);
    }
    setExpandedRows(newExpanded);
  };

  // Handle saving the edited requirement
  const handleSaveRequirement = async (updatedRequirement) => {
    try {
      console.log('Saving requirement:', updatedRequirement);

      if (updatedRequirement.id) {
        // UPDATE EXISTING
        console.log('Updating existing requirement:', updatedRequirement.id);
        await dataStore.updateRequirement(updatedRequirement.id, {
          ...updatedRequirement,
          updatedAt: new Date().toISOString()
        });
        console.log('✅ Requirement updated successfully');
      } else {
        // CREATE NEW
        const newRequirement = {
          ...updatedRequirement,
          id: `REQ-${Date.now()}`, // Generate unique ID
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        console.log('Creating new requirement:', newRequirement.id);
        await dataStore.addRequirement(newRequirement);
        console.log('✅ Requirement created successfully');
      }

      // Close the modal
      setEditingRequirement(null);

    } catch (error) {
      console.error("❌ Error saving requirement:", error);
      alert('Error saving requirement: ' + error.message);
    }
  };

  // Handle requirement deletion
  const handleDeleteRequirement = async (reqId) => {
    if (window.confirm('Are you sure you want to delete this requirement?')) {
      try {
        console.log('Deleting requirement:', reqId);

        // Delete from database (this will also update localStorage)
        await dataStore.deleteRequirement(reqId);

        // Clear from selection if selected
        setSelectedRequirements(prev => {
          const newSet = new Set(prev);
          newSet.delete(reqId);
          return newSet;
        });

        console.log('✅ Requirement deleted successfully');
      } catch (error) {
        console.error('❌ Error deleting requirement:', error);
        alert('Error deleting requirement: ' + error.message);
      }
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedRequirements.size === 0) return;

    if (window.confirm(`Are you sure you want to delete ${selectedRequirements.size} requirement(s)?`)) {
      try {
        console.log(`Deleting ${selectedRequirements.size} requirements...`);

        // Delete each requirement (this will update database and localStorage)
        for (const reqId of selectedRequirements) {
          await dataStore.deleteRequirement(reqId);
        }

        // Clear selection
        setSelectedRequirements(new Set());

        console.log(`✅ ${selectedRequirements.size} requirements deleted successfully`);
      } catch (error) {
        console.error('❌ Error deleting requirements:', error);
        alert('Error deleting requirements: ' + error.message);
      }
    }
  };

  // Handle new requirement creation
  const handleNewRequirement = () => {
    setEditingRequirement({
      id: '',
      name: '',
      description: '',
      priority: 'Medium',
      type: 'Functional',
      status: 'Active',
      businessImpact: 3,
      technicalComplexity: 3,
      regulatoryFactor: 1,
      usageFrequency: 3,
      versions: selectedVersion !== 'unassigned' ? [selectedVersion] : [],
      tags: []
    });
  };

  if (requirements.length === 0) {
    return (
      <MainLayout title="Requirements" hasData={hasData}>
        <EmptyState
          title="No Requirements Found"
          message="Get started by importing your requirements to begin tracking your quality metrics."
          actionText="Create Requirements"
          actionPath="/import#requirements-tab"  // Using actionPath for navigation
          icon="requirements"
          className="mt-8"
        />
      </MainLayout>
    );
  }

  // Bulk action handlers
  const handleBulkVersionAssignment = (versionId, action) => {
    if (selectedRequirements.size === 0) return;

    setSelectedVersionForAssignment(versionId);
    setVersionAssignmentAction(action);
    setShowVersionAssignmentModal(true);
  };

  const handleBulkTagsUpdate = (tags, action) => {
    if (selectedRequirements.size === 0) return;

    setSelectedTagsForAssignment(tags);
    setTagAssignmentAction(action);
    setShowTagAssignmentModal(true);
  };

  const handleExportSelected = () => {
    if (selectedRequirements.size === 0) return;

    const selectedIds = Array.from(selectedRequirements);
    const selectedReqs = requirements.filter(req => selectedIds.includes(req.id));

    const exportData = selectedReqs.map(req => ({
      id: req.id,
      name: req.name,
      description: req.description,
      type: req.type,
      priority: req.priority,
      status: req.status,
      versions: req.versions?.join(', ') || '',
      tags: req.tags?.join(', ') || '',
      businessImpact: req.businessImpact,
      technicalComplexity: req.technicalComplexity,
      regulatoryFactor: req.regulatoryFactor,
      usageFrequency: req.usageFrequency,
      testDepthFactor: req.testDepthFactor
    }));

    // Convert to CSV
    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(','),
      ...exportData.map(row =>
        headers.map(header => {
          const value = row[header]?.toString() || '';
          return value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `requirements-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    setSelectedRequirements(new Set());
  };

  // Add confirmation handler for version assignment
  const confirmVersionAssignment = async () => {
    try {
      const updatedRequirements = requirements.map(req =>
        selectedRequirements.has(req.id)
          ? {
            ...req,
            versions: versionAssignmentAction === 'add'
              ? [...new Set([...(req.versions || []), selectedVersionForAssignment])]
              : (req.versions || []).filter(v => v !== selectedVersionForAssignment),
            updatedAt: new Date().toISOString()
          }
          : req
      );

      dataStore.setRequirements(updatedRequirements);
      setSelectedRequirements(new Set());
      setShowVersionAssignmentModal(false);

      // Show success message
      const versionName = versions.find(v => v.id === selectedVersionForAssignment)?.name;
      const actionText = versionAssignmentAction === 'add' ? 'added to' : 'removed from';
      alert(`✅ ${selectedRequirements.size} requirements ${actionText} ${versionName}`);

    } catch (error) {
      console.error('Version assignment failed:', error);
      alert('❌ Version assignment failed: ' + error.message);
    }
  };

  // Add confirmation handler for tag assignment
  const confirmTagAssignment = async () => {
    try {
      const updatedRequirements = requirements.map(req =>
        selectedRequirements.has(req.id)
          ? {
            ...req,
            tags: tagAssignmentAction === 'add'
              ? [...new Set([...(req.tags || []), ...selectedTagsForAssignment])]
              : (req.tags || []).filter(t => !selectedTagsForAssignment.includes(t)),
            updatedAt: new Date().toISOString()
          }
          : req
      );

      dataStore.setRequirements(updatedRequirements);
      setSelectedRequirements(new Set());
      setShowTagAssignmentModal(false);

      // Show success message
      const actionText = tagAssignmentAction === 'add' ? 'added to' : 'removed from';
      const tagText = selectedTagsForAssignment.length === 1
        ? `"${selectedTagsForAssignment[0]}"`
        : `${selectedTagsForAssignment.length} tags`;
      alert(`✅ Tag ${tagText} ${actionText} ${selectedRequirements.size} requirements`);

    } catch (error) {
      console.error('Tag assignment failed:', error);
      alert('❌ Tag assignment failed: ' + error.message);
    }
  };

  // Define modal components outside the main component
  const VersionAssignmentModal = ({
    show,
    onClose,
    onConfirm,
    action,
    version,
    selectedCount,
    versions
  }) => {
    if (!show) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-4">
            Confirm Version {action === 'add' ? 'Addition' : 'Removal'}
          </h3>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm mb-2">
              You are about to <strong>{action}</strong> {selectedCount} requirement(s) {action === 'add' ? 'to' : 'from'}:
            </p>
            <div className="font-medium text-blue-800">
              {versions.find(v => v.id === version)?.name || version}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onConfirm}
              className={`flex-1 py-2 px-4 rounded font-medium ${action === 'add'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-red-600 text-white hover:bg-red-700'
                }`}
            >
              Confirm {action === 'add' ? 'Addition' : 'Removal'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const TagAssignmentModal = ({
    show,
    onClose,
    onConfirm,
    action,
    tags,
    selectedCount
  }) => {
    if (!show) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-4">
            Confirm Tag {action === 'add' ? 'Addition' : 'Removal'}
          </h3>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm mb-2">
              You are about to <strong>{action}</strong> the following tags {action === 'add' ? 'to' : 'from'} {selectedCount} requirement(s):
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onConfirm}
              className={`flex-1 py-2 px-4 rounded font-medium ${action === 'add'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-red-600 text-white hover:bg-red-700'
                }`}
            >
              Confirm {action === 'add' ? 'Addition' : 'Removal'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <MainLayout title="Requirements" hasData={hasData}>
      <div className="space-y-6">
        {/* Unified Filter Card — Merged Main + Advanced Filters */}
        <div className="bg-white rounded-lg shadow mb-4">
          {/* Header Row: Title, Version, Metrics, Add Button */}
          <div className="flex justify-between items-center px-4 py-3 border-b">
            <div className="flex items-center space-x-6">
              {/* Title & Version */}
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">Requirements</h1>
                {selectedVersion !== 'unassigned' && (
                  <div className="text-xs text-gray-600">
                    Version: <span className="font-medium text-blue-600">
                      {versions.find(v => v.id === selectedVersion)?.name || selectedVersion}
                    </span>
                  </div>
                )}
              </div>

              {/* Inline Metrics Bar (Desktop) */}
              <div className="hidden lg:flex items-center divide-x divide-gray-300">
                <div className="flex items-center space-x-1.5 px-4">
                  <span className="text-lg font-bold text-gray-900">{stats.total}</span>
                  <span className="text-xs text-gray-500">Total</span>
                </div>
                <div className="flex items-center space-x-1.5 px-4">
                  <span className="text-lg font-bold text-red-600">{stats.highPriority}</span>
                  <span className="text-xs text-gray-500">High</span>
                </div>
                <div className="flex items-center space-x-1.5 px-4">
                  <span className="text-lg font-bold text-blue-600">{stats.withTests}</span>
                  <span className="text-xs text-gray-500">With Tests</span>
                </div>
                <div className="flex items-center space-x-1.5 px-4">
                  <span className="text-lg font-bold text-orange-600">{stats.noCoverage}</span>
                  <span className="text-xs text-gray-500">No Coverage</span>
                </div>
              </div>
            </div>

            {/* Add Button */}
            <button
              onClick={handleNewRequirement}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center text-sm flex-shrink-0"
            >
              <Plus className="mr-2" size={16} />
              Add
            </button>
          </div>

          {/* Priority Filter Tabs Row */}
          <div className="px-4 py-2 bg-gray-50 border-b flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={() => setPriorityFilterTab('All')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${priorityFilterTab === 'All'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
              >
                📊 All ({nonPriorityFilteredRequirements.length})
              </button>

              <button
                onClick={() => setPriorityFilterTab('High')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${priorityFilterTab === 'High'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
              >
                🔴 High ({nonPriorityFilteredRequirements.filter(r => r.priority === 'High').length})
              </button>

              <button
                onClick={() => setPriorityFilterTab('Medium')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${priorityFilterTab === 'Medium'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
              >
                🟡 Medium ({nonPriorityFilteredRequirements.filter(r => r.priority === 'Medium').length})
              </button>

              <button
                onClick={() => setPriorityFilterTab('Low')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${priorityFilterTab === 'Low'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
              >
                🟢 Low ({nonPriorityFilteredRequirements.filter(r => r.priority === 'Low').length})
              </button>
            </div>

            {/* Quick Search */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search requirements..."
                className="px-3 py-1.5 text-sm border rounded-md w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Mobile Metrics (shown on mobile only) */}
          <div className="lg:hidden px-4 py-3 border-t bg-gray-50">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-bold text-gray-900">{stats.total}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-600">{stats.highPriority}</div>
                <div className="text-xs text-gray-600">High</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">{stats.noCoverage}</div>
                <div className="text-xs text-gray-600">No Coverage</div>
              </div>
            </div>
          </div>

          {/* Advanced Filters - Expandable Section */}
          <div className="border-t">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Filter size={16} className="text-gray-600" />
                <span className="font-medium text-gray-700">Advanced Filters</span>
                {(statusFilter !== 'All' || typeFilter !== 'All' || coverageFilter !== 'All' || selectedTagsFilter.length > 0) && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                    Active
                  </span>
                )}
              </div>
              <ChevronDown
                size={16}
                className={`text-gray-600 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Advanced Filters Content */}
            {showAdvancedFilters && (
              <div className="px-4 py-4 bg-gray-50">
                <div className="space-y-4">
                  {/* First Row: Status, Type, Coverage */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Status Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="All">All Status</option>
                        <option value="Draft">Draft</option>
                        <option value="In Review">In Review</option>
                        <option value="Approved">Approved</option>
                        <option value="Deprecated">Deprecated</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </div>

                    {/* Type Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="All">All Types</option>
                        <option value="Functional">Functional</option>
                        <option value="Non-Functional">Non-Functional</option>
                        <option value="Security">Security</option>
                        <option value="Performance">Performance</option>
                        <option value="Usability">Usability</option>
                        <option value="Compliance">Compliance</option>
                      </select>
                    </div>

                    {/* Coverage Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Coverage</label>
                      <select
                        value={coverageFilter}
                        onChange={(e) => setCoverageFilter(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="All">All Coverage</option>
                        <option value="With Tests">With Tests</option>
                        <option value="No Coverage">No Coverage</option>
                      </select>
                    </div>
                  </div>

                  {/* Second Row: Tags - Full Width with Show More/Less */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const allTags = getAllTags(requirements);
                        const INITIAL_TAGS_COUNT = 10;
                        const tagsToShow = showAllTags ? allTags : allTags.slice(0, INITIAL_TAGS_COUNT);
                        const remainingCount = allTags.length - INITIAL_TAGS_COUNT;

                        return (
                          <>
                            {tagsToShow.map(tag => {
                              const count = versionFilteredRequirements.filter(req =>
                                req.tags && req.tags.includes(tag)
                              ).length;
                              const isSelected = selectedTagsFilter.includes(tag);

                              return (
                                <button
                                  key={tag}
                                  onClick={() => {
                                    setSelectedTagsFilter(prev =>
                                      prev.includes(tag)
                                        ? prev.filter(t => t !== tag)
                                        : [...prev, tag]
                                    );
                                  }}
                                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${isSelected
                                    ? 'bg-blue-600 text-white font-medium'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                                    }`}
                                >
                                  {tag} ({count})
                                </button>
                              );
                            })}

                            {/* Show More / Show Less button */}
                            {allTags.length > INITIAL_TAGS_COUNT && (
                              <button
                                onClick={() => setShowAllTags(!showAllTags)}
                                className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                              >
                                {showAllTags ? 'Show Less' : `+${remainingCount} more`}
                              </button>
                            )}

                            {allTags.length === 0 && (
                              <span className="text-sm text-gray-500">No tags available</span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Clear Filters Section */}
                  {(statusFilter !== 'All' || typeFilter !== 'All' || coverageFilter !== 'All' || selectedTagsFilter.length > 0) && (
                    <div className="pt-4 border-t flex justify-end">
                      <button
                        onClick={() => {
                          setStatusFilter('All');
                          setTypeFilter('All');
                          setCoverageFilter('All');
                          setSelectedTagsFilter([]);
                        }}
                        className="px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg font-medium"
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedRequirements.size > 0 && (
          <BulkActionsPanel
            selectedCount={selectedRequirements.size}
            itemType="requirement"
            availableVersions={versions}
            availableTags={getAllTags(requirements)} // Pass requirements array
            onVersionAssign={handleBulkVersionAssignment}
            onTagsUpdate={handleBulkTagsUpdate}
            onBulkDelete={handleBulkDelete}
            onClearSelection={() => setSelectedRequirements(new Set())}
            showExecuteButton={false}
            showExportButton={true}
            onExport={handleExportSelected}
          />
        )}

        {/* Requirements Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-auto divide-y divide-gray-200" style={{ minWidth: '1000px' }}>
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      checked={selectedRequirements.size === filteredRequirements.length && filteredRequirements.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-80">
                    ID / Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    <div className="flex items-center">
                      Coverage
                      <TDFInfoTooltip />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Versions
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequirements.map((req) => {
                  // Find corresponding coverage data
                  const coverage = versionCoverage.find(c => c.reqId === req.id);

                  // Change 2: Get linked test cases for this requirement using new format
                  const linkedTests = (mapping[req.id] || [])
                    .map(tcId => testCases.find(tc => tc.id === tcId))
                    .filter(Boolean)
                    .filter(tc => testCaseAppliesTo(tc, selectedVersion));

                  const linkedTestCount = linkedTests.length;

                  const isExpanded = expandedRows.has(req.id);

                  return (
                    <React.Fragment key={req.id}>
                      <tr className={`hover:bg-gray-50 ${selectedRequirements.has(req.id) ? 'bg-blue-50' : ''}`}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedRequirements.has(req.id)}
                            onChange={(e) => handleRequirementSelection(req.id, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          <div className="flex items-start">
                            <button
                              onClick={() => toggleRowExpansion(req.id)}
                              className="mr-2 p-1 hover:bg-gray-200 rounded flex-shrink-0 mt-0.5"
                            >
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 mb-1">{req.id}</div>
                              <div className="text-sm text-gray-700 break-words" title={req.name}>
                                {req.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 py-1 rounded text-xs ${req.type === 'Security' ? 'bg-red-100 text-red-800' :
                            req.type === 'Performance' ? 'bg-orange-100 text-orange-800' :
                              req.type === 'Functional' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {req.type}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 py-1 rounded text-xs ${req.priority === 'High' ? 'bg-red-100 text-red-800' :
                            req.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                            {req.priority}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 py-1 rounded text-xs ${req.status === 'Active' ? 'bg-green-100 text-green-800' :
                            req.status === 'Proposed' ? 'bg-yellow-100 text-yellow-800' :
                              req.status === 'Implemented' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <div className="flex-1 min-w-24">
                              <div className={`text-sm font-medium ${coverage && coverage.meetsMinimum ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {linkedTestCount} / {req.minTestCases}
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div
                                  className={`h-2 rounded-full ${coverage && coverage.meetsMinimum ? 'bg-green-500' : 'bg-red-500'
                                    }`}
                                  style={{
                                    width: `${Math.min(100, (linkedTestCount / req.minTestCases) * 100)}%`
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex flex-wrap gap-1">
                            {req.versions && req.versions.length > 0 ? req.versions.slice(0, 2).map(vId => {
                              const versionExists = versions.some(v => v.id === vId);
                              return (
                                <span
                                  key={vId}
                                  className={`px-2 py-1 rounded text-xs ${versionExists
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                  title={versionExists ? 'Existing version' : 'Version not created yet'}
                                >
                                  {vId}
                                </span>
                              );
                            }) : (
                              <span className="text-gray-400 text-xs">No versions</span>
                            )}
                            {req.versions && req.versions.length > 2 && (
                              <span className="text-gray-400 text-xs">+{req.versions.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setEditingRequirement(req)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Edit requirement"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteRequirement(req.id)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Delete requirement"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Row Details */}
                      {isExpanded && (
                        <tr>
                          <td colSpan="8" className="p-0">
                            <div className="bg-gradient-to-r from-green-50 to-gray-50 border-l-4 border-green-400">
                              <div className="p-6">
                                {/* Header Section */}
                                <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <h3 className="text-lg font-semibold text-gray-900">Requirement Details</h3>
                                  </div>
                                </div>

                                {/* Main Content Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                  {/* Left Column - Requirement Details */}
                                  <div className="lg:col-span-2 space-y-6">
                                    {/* Description */}
                                    {req.description && (
                                      <div className="bg-white rounded-lg p-4 shadow-sm border">
                                        <div className="flex items-center mb-3">
                                          <div className="w-1 h-6 bg-green-500 rounded mr-3"></div>
                                          <h4 className="font-semibold text-gray-900">Description</h4>
                                        </div>
                                        <p className="text-gray-700 leading-relaxed">{req.description}</p>
                                      </div>
                                    )}

                                    {/* Business Rationale (if available) */}
                                    {req.businessRationale && (
                                      <div className="bg-white rounded-lg p-4 shadow-sm border">
                                        <div className="flex items-center mb-3">
                                          <div className="w-1 h-6 bg-blue-500 rounded mr-3"></div>
                                          <h4 className="font-semibold text-gray-900">Business Rationale</h4>
                                        </div>
                                        <p className="text-gray-700 leading-relaxed">{req.businessRationale}</p>
                                      </div>
                                    )}

                                    {/* Acceptance Criteria (if available) */}
                                    {req.acceptanceCriteria && req.acceptanceCriteria.length > 0 && (
                                      <div className="bg-white rounded-lg p-4 shadow-sm border">
                                        <div className="flex items-center mb-3">
                                          <div className="w-1 h-6 bg-purple-500 rounded mr-3"></div>
                                          <h4 className="font-semibold text-gray-900">Acceptance Criteria</h4>
                                        </div>
                                        <ul className="space-y-2">
                                          {req.acceptanceCriteria.map((criteria, index) => (
                                            <li key={index} className="flex items-start">
                                              <span className="flex-shrink-0 w-5 h-5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium flex items-center justify-center mr-3 mt-0.5">
                                                ✓
                                              </span>
                                              <span className="text-gray-700 leading-relaxed">{criteria}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Risk Factors */}
                                    <div className="bg-white rounded-lg p-4 shadow-sm border">
                                      <div className="flex items-center mb-3">
                                        <div className="w-1 h-6 bg-orange-500 rounded mr-3"></div>
                                        <h4 className="font-semibold text-gray-900">Risk Assessment Factors</h4>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 rounded-lg p-3">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700">Business Impact</span>
                                            <span className="text-lg font-bold text-gray-600">{req.businessImpact}/5</span>
                                          </div>
                                          <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                              className="bg-gray-500 h-2 rounded-full"
                                              style={{ width: `${(req.businessImpact / 5) * 100}%` }}
                                            ></div>
                                          </div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700">Technical Complexity</span>
                                            <span className="text-lg font-bold text-gray-600">{req.technicalComplexity}/5</span>
                                          </div>
                                          <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                              className="bg-gray-500 h-2 rounded-full"
                                              style={{ width: `${(req.technicalComplexity / 5) * 100}%` }}
                                            ></div>
                                          </div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700">Regulatory Factor</span>
                                            <span className="text-lg font-bold text-gray-600">{req.regulatoryFactor}/5</span>
                                          </div>
                                          <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                              className="bg-gray-500 h-2 rounded-full"
                                              style={{ width: `${(req.regulatoryFactor / 5) * 100}%` }}
                                            ></div>
                                          </div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700">Usage Frequency</span>
                                            <span className="text-lg font-bold text-green-600">{req.usageFrequency}/5</span>
                                          </div>
                                          <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                              className="bg-gray-500 h-2 rounded-full"
                                              style={{ width: `${(req.usageFrequency / 5) * 100}%` }}
                                            ></div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right Column - Metadata */}
                                  <div className="space-y-4">
                                    {/* Quick Info Card */}
                                    <div className="bg-white rounded-lg p-4 shadow-sm border">
                                      <h4 className="font-semibold text-gray-900 mb-4">Quick Info</h4>
                                      <div className="space-y-3">
                                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                          <span className="text-sm text-gray-600">Type</span>
                                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${req.type === 'Security' ? 'bg-red-100 text-red-800' :
                                            req.type === 'Performance' ? 'bg-orange-100 text-orange-800' :
                                              req.type === 'Functional' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                            {req.type}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                          <span className="text-sm text-gray-600">Priority</span>
                                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${req.priority === 'High' ? 'bg-red-100 text-red-800' :
                                            req.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                              'bg-green-100 text-green-800'
                                            }`}>
                                            {req.priority}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                          <span className="text-sm text-gray-600">Status</span>
                                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${req.status === 'Active' ? 'bg-green-100 text-green-800' :
                                            req.status === 'Proposed' ? 'bg-yellow-100 text-yellow-800' :
                                              req.status === 'Implemented' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                            {req.status}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                          <span className="text-sm text-gray-600">Created</span>
                                          <span className="text-sm font-medium text-gray-900">
                                            {req.createdDate ? new Date(req.createdDate).toLocaleDateString() : 'Unknown'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Test Depth Analysis */}
                                    <div className="bg-white rounded-lg p-4 shadow-sm border">
                                      <h4 className="font-semibold text-gray-900 mb-4">Test Depth Analysis</h4>
                                      <div className="space-y-4">
                                        <div className="text-center">
                                          <div className="text-3xl font-bold text-indigo-600 mb-1">
                                            {req.testDepthFactor}
                                          </div>
                                          <div className="text-sm text-gray-500">Test Depth Factor</div>
                                        </div>
                                        <div className="text-center pt-2 border-t border-gray-100">
                                          <div className="text-2xl font-bold text-green-600 mb-1">
                                            {req.minTestCases}
                                          </div>
                                          <div className="text-sm text-gray-500">Required Test Cases</div>
                                        </div>
                                        {/* Change 5: Enhanced Test Coverage Summary */}
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                          <h4 className="font-semibold text-blue-800 mb-2">Test Coverage</h4>
                                          <div className="space-y-2">
                                            <div className="text-sm text-blue-700">
                                              This requirement has {linkedTestCount} associated test case{linkedTestCount !== 1 ? 's' : ''}
                                              {selectedVersion !== 'unassigned' && (
                                                <span className="font-medium"> for {selectedVersion}</span>
                                              )}
                                            </div>
                                            {linkedTests.length > 0 && (
                                              <div className="text-xs text-blue-600">
                                                Status breakdown: {' '}
                                                {['Passed', 'Failed', 'Not Run', 'Blocked'].map(status => {
                                                  const count = linkedTests.filter(tc => tc.status === status).length;
                                                  return count > 0 ? `${count} ${status}` : null;
                                                }).filter(Boolean).join(', ')}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Versions */}
                                    {req.versions && req.versions.length > 0 && (
                                      <div className="bg-white rounded-lg p-4 shadow-sm border">
                                        <h4 className="font-semibold text-gray-900 mb-3">Associated Versions</h4>
                                        <div className="space-y-2">
                                          {req.versions.map(vId => {
                                            const versionExists = versions.some(v => v.id === vId);
                                            return (
                                              <div key={vId} className="flex items-center space-x-2">
                                                <div className={`w-2 h-2 rounded-full ${versionExists ? 'bg-blue-400' : 'bg-yellow-400'
                                                  }`}></div>
                                                <span className="text-sm text-gray-700 font-mono">{vId}</span>
                                                {!versionExists && (
                                                  <span className="text-xs text-yellow-600">(Pending)</span>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {/* Tags */}
                                    {req.tags && req.tags.length > 0 && (
                                      <div className="bg-white rounded-lg p-4 shadow-sm border">
                                        <h4 className="font-semibold text-gray-900 mb-3">Tags</h4>
                                        <div className="flex flex-wrap gap-2">
                                          {req.tags.map(tag => (
                                            <span key={tag} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                              {tag}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}


                                  </div>
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
          Showing {filteredRequirements.length} of {versionFilteredRequirements.length} requirements
          {selectedVersion !== 'unassigned' && (
            <span> for version {versions.find(v => v.id === selectedVersion)?.name || selectedVersion}</span>
          )}
        </div>

        {/* Edit Requirement Modal */}
        {editingRequirement && (
          <EditRequirementModal
            requirement={editingRequirement}
            onSave={handleSaveRequirement}
            onCancel={() => setEditingRequirement(null)}
          />
        )}

        {/* Version and Tag Assignment Modals */}
        <VersionAssignmentModal
          show={showVersionAssignmentModal}
          onClose={() => setShowVersionAssignmentModal(false)}
          onConfirm={confirmVersionAssignment}
          action={versionAssignmentAction}
          version={selectedVersionForAssignment}
          selectedCount={selectedRequirements.size}
          versions={versions}
        />

        <TagAssignmentModal
          show={showTagAssignmentModal}
          onClose={() => setShowTagAssignmentModal(false)}
          onConfirm={confirmTagAssignment}
          action={tagAssignmentAction}
          tags={selectedTagsForAssignment}
          selectedCount={selectedRequirements.size}
        />
      </div>
    </MainLayout>
  );
};

export default Requirements;

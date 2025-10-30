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
  CheckCircle,
  FileText,
  Tag,
  BarChart3,
  Users,
  Calendar,
  Activity
} from 'lucide-react';
import MainLayout from '../components/Layout/MainLayout';
import EmptyState from '../components/Common/EmptyState';
import SlideOutPanel from '../components/Common/SlideOutPanel';
import FilterPanel from '../components/Common/FilterPanel';
import BulkUpdateModal from '../components/Common/BulkUpdateModal';


import RightSidebarPanel, {
  SidebarSection,
  SidebarField,
  SidebarActionButton,
  SidebarBadge
} from '../components/Common/RightSidebarPanel';
import TDFInfoTooltip from '../components/Common/TDFInfoTooltip';
import { useVersionContext } from '../context/VersionContext';
import { calculateCoverage } from '../utils/coverage';
import dataStore from '../services/DataStore';
import BulkActionsPanel from '../components/Common/BulkActionsPanel'; // Already imported
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
  const [editingRequirement, setEditingRequirement] = useState(null); // Renamed from setEditingRequirement to setRequirementToEdit
  const [hasData, setHasData] = useState(false);
  const location = useLocation();

  // NEW: Add these state variables
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const [requirementToEdit, setRequirementToEdit] = useState(null);

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState({ current: 0, total: 0 });



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
    : requirements.filter(req => {
      // If no versions assigned, show in all version views
      if (!req.versions || req.versions.length === 0) {
        return true;
      }
      // Otherwise check if this version is in the list
      return req.versions.includes(selectedVersion);
    });



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
  const handleSaveRequirement = async () => {
    if (!requirementToEdit) {
      console.error('No requirement to save');
      return;
    }

    // Validate required fields
    if (!requirementToEdit.id?.trim()) {
      alert('Requirement ID is required');
      return;
    }
    if (!requirementToEdit.name?.trim()) {
      alert('Requirement name is required');
      return;
    }
    if (!requirementToEdit.description?.trim()) {
      alert('Description is required');
      return;
    }

    try {
      console.log('Saving requirement:', requirementToEdit);
      if (requirementToEdit.id && requirements.some(r => r.id === requirementToEdit.id)) {
        // UPDATE EXISTING
        console.log('Updating existing requirement:', requirementToEdit.id);
        await dataStore.updateRequirement(requirementToEdit.id, {
          ...requirementToEdit,
          updatedAt: new Date().toISOString()
        });
        console.log('✅ Requirement updated successfully');
      } else {
        // CREATE NEW
        const newRequirement = {
          ...requirementToEdit,
          id: `REQ-${Date.now()}`, // Generate unique ID if not provided by form
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        console.log('Creating new requirement:', newRequirement.id);
        await dataStore.addRequirement(newRequirement);
        console.log('✅ Requirement created successfully');
      }
      // Close the panel
      setEditPanelOpen(false);
      setRequirementToEdit(null);

      // Update selected requirement if it was edited
      if (selectedRequirement?.id === requirementToEdit.id) {
        setSelectedRequirement(requirementToEdit);
      }
    } catch (error) {
      console.error("❌ Error saving requirement:", error);
      alert('Failed to save requirement. Please try again.');
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
        // Deselect the requirement if it was the one being viewed in the sidebar
        if (selectedRequirement && selectedRequirement.id === reqId) {
          setSelectedRequirement(null);
        }
        console.log('✅ Requirement deleted successfully');
      } catch (error) {
        console.error('❌ Error deleting requirement:', error);
        alert('Error deleting requirement: ' + error.message);
      }
    }
  };

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
    setRequirementToEdit({
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
      minTestCases: 1,
      versions: selectedVersion !== 'unassigned' ? [selectedVersion] : [],
      tags: [],
      acceptanceCriteria: [],
      businessRationale: '',
      dependencies: [],
      parentRequirementId: null
    });
    setEditPanelOpen(true);
  };

  // NEW: Helper function to get linked test cases
  const getLinkedTests = (requirementId) => {
    const mappings = Object.entries(mapping).flatMap(([reqId, testCaseIds]) =>
      reqId === requirementId ? testCaseIds.map(tcId => tcId) : []
    );
    return mappings
      .map(tcId => testCases.find(tc => tc.id === tcId))
      .filter(Boolean)
      .filter(tc => testCaseAppliesTo(tc, selectedVersion));
  };

  // NEW: Create right sidebar content - DYNAMIC BASED ON SELECTION STATE
  const rightSidebarContent = useMemo(() => {
    // Case 1: Multiple requirements selected -> Show Bulk Actions
    if (selectedRequirements.size > 1) {
      return (
        <BulkActionsPanel
          selectedCount={selectedRequirements.size}
          selectedItems={requirements.filter(req => selectedRequirements.has(req.id))}
          itemType="requirement"
          availableVersions={versions}
          availableTags={getAllTags(requirements)}
          onVersionAssign={handleBulkVersionAssignment}
          onTagsUpdate={handleBulkTagsUpdate}
          onBulkDelete={handleBulkDelete}
          onClearSelection={() => setSelectedRequirements(new Set())}
          showExecuteButton={false}
          showExportButton={true}
          onExport={handleExportSelected}
        />
      );
    }

    // Case 2: Single requirement selected -> Show Details
    if (selectedRequirement) {
      return (
        <RightSidebarPanel title="Requirement Details" onClose={() => setSelectedRequirement(null)}>
          {/* Quick Actions */}
          <div className="p-4 space-y-2 border-b border-gray-200">
            <SidebarActionButton
              icon={<Edit size={16} />}
              label="Edit Requirement"
              onClick={() => {
                // Create a complete copy with all fields
                setRequirementToEdit({
                  id: selectedRequirement.id || '',
                  name: selectedRequirement.name || '',
                  description: selectedRequirement.description || '',
                  priority: selectedRequirement.priority || 'Medium',
                  type: selectedRequirement.type || 'Functional',
                  status: selectedRequirement.status || 'Active',
                  owner: selectedRequirement.owner || '',
                  businessImpact: selectedRequirement.businessImpact || 3,
                  technicalComplexity: selectedRequirement.technicalComplexity || 3,
                  regulatoryFactor: selectedRequirement.regulatoryFactor || 1,
                  usageFrequency: selectedRequirement.usageFrequency || 3,
                  minTestCases: selectedRequirement.minTestCases || 1,
                  versions: selectedRequirement.versions || [],
                  tags: selectedRequirement.tags || [],
                  acceptanceCriteria: selectedRequirement.acceptanceCriteria || [],
                  businessRationale: selectedRequirement.businessRationale || '',
                  dependencies: selectedRequirement.dependencies || [],
                  parentRequirementId: selectedRequirement.parentRequirementId || null
                });
                setEditPanelOpen(true);
              }}
              variant="primary"
            />
            <SidebarActionButton
              icon={<Trash2 size={16} />}
              label="Delete Requirement"
              onClick={() => handleDeleteRequirement(selectedRequirement.id)}
              variant="danger"
            />
          </div>

          {/* Basic Information */}
          <SidebarSection title="Basic Information" icon={<FileText size={16} />} defaultOpen={true}>
            <SidebarField
              label="Requirement ID"
              value={<span className="font-mono font-semibold">{selectedRequirement.id}</span>}
            />
            <SidebarField
              label="Name"
              value={selectedRequirement.name}
            />
            <SidebarField
              label="Description"
              value={<p className="text-sm leading-relaxed">{selectedRequirement.description}</p>}
            />
          </SidebarSection>

          {/* Classification */}
          <SidebarSection title="Classification" icon={<Tag size={16} />} defaultOpen={true}>
            <SidebarField
              label="Priority"
              value={
                <SidebarBadge
                  label={selectedRequirement.priority}
                  color={
                    selectedRequirement.priority === 'High' ? 'red' : selectedRequirement.priority === 'Medium' ? 'yellow' : 'green'
                  }
                />
              }
            />
            <SidebarField
              label="Type"
              value={selectedRequirement.type}
            />
            <SidebarField
              label="Status"
              value={
                <SidebarBadge label={selectedRequirement.status || 'Active'} color="green" />
              }
            />
          </SidebarSection>

          {/* Test Depth Factors */}
          <SidebarSection title="Test Depth Analysis" icon={<BarChart3 size={16} />} defaultOpen={false}>
            <div className="space-y-3">
              <SidebarField
                label="Business Impact"
                value={
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(selectedRequirement.businessImpact / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{selectedRequirement.businessImpact}/5</span>
                  </div>
                }
              />
              <SidebarField
                label="Technical Complexity"
                value={
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${(selectedRequirement.technicalComplexity / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{selectedRequirement.technicalComplexity}/5</span>
                  </div>
                }
              />
              <SidebarField
                label="Regulatory Factor"
                value={
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-600 h-2 rounded-full"
                        style={{ width: `${(selectedRequirement.regulatoryFactor / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{selectedRequirement.regulatoryFactor}/5</span>
                  </div>
                }
              />
              <SidebarField
                label="Usage Frequency"
                value={
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(selectedRequirement.usageFrequency / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{selectedRequirement.usageFrequency}/5</span>
                  </div>
                }
              />
              <SidebarField
                label="Test Depth Factor"
                value={
                  <div className="text-2xl font-bold text-indigo-600">
                    {selectedRequirement.testDepthFactor}
                  </div>
                }
              />
              <SidebarField
                label="Required Test Cases"
                value={
                  <div className="text-2xl font-bold text-green-600">
                    {selectedRequirement.minTestCases}
                  </div>
                }
              />
            </div>
          </SidebarSection>

          {/* Linked Test Cases */}
          <SidebarSection title="Linked Test Cases" defaultOpen={true}>
            {(() => {
              const linkedTests = getLinkedTests(selectedRequirement.id);
              return linkedTests.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-xs text-gray-500">
                    {linkedTests.length} test case{linkedTests.length !== 1 ? 's' : ''} linked
                  </span>
                  {linkedTests.map((test, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-gray-50 rounded border border-gray-200"
                    >
                      <div className="font-mono text-xs text-blue-600">{test.id}</div>
                      <div className="text-sm text-gray-900 mt-1">{test.title}</div>
                      <div className="text-xs text-gray-500 mt-1">{getVersionDisplayText(test)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No test cases linked</p>
              );
            })()}
          </SidebarSection>

          {/* Versions */}
          {selectedRequirement.versions && selectedRequirement.versions.length > 0 && (
            <SidebarSection title="Associated Versions" icon={<Activity size={16} />} defaultOpen={false}>
              <div className="space-y-2">
                {selectedRequirement.versions.map(vId => {
                  const versionExists = versions.some(v => v.id === vId);
                  return (
                    <div key={vId} className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${versionExists ? 'bg-blue-400' : 'bg-yellow-400'}`}></div>
                      <span className="text-sm text-gray-700 font-mono">{vId}</span>
                      {!versionExists && (
                        <span className="text-xs text-yellow-600">(Pending)</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </SidebarSection>
          )}

          {/* Tags */}
          {selectedRequirement.tags && selectedRequirement.tags.length > 0 && (
            <SidebarSection title="Tags" icon={<Tag size={16} />} defaultOpen={false}>
              <div className="flex flex-wrap gap-2">
                {selectedRequirement.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </SidebarSection>
          )}

          {/* Metadata */}
          <SidebarSection title="Metadata" icon={<Calendar size={16} />} defaultOpen={false}>
            <SidebarField
              label="Created"
              value={selectedRequirement.createdDate ? new Date(selectedRequirement.createdDate).toLocaleDateString() : 'Unknown'}
            />
            <SidebarField
              label="Updated"
              value={selectedRequirement.updatedAt ? new Date(selectedRequirement.updatedAt).toLocaleDateString() : 'Never'}
            />
          </SidebarSection>
        </RightSidebarPanel>
      );
    }


    // Case 3: Nothing selected -> Show Filters
    return (
      <FilterPanel
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        coverageFilter={coverageFilter}
        onCoverageChange={setCoverageFilter}
        selectedTags={selectedTagsFilter}
        allTags={getAllTags(requirements)}
        onTagsChange={setSelectedTagsFilter}
        onClearAll={() => {
          setSearchQuery('');
          setPriorityFilter('All');
          setStatusFilter('All');
          setTypeFilter('All');
          setCoverageFilter('All');
          setSelectedTagsFilter([]);
        }}
        stats={{
          total: requirements.length,
          filtered: filteredRequirements.length,
          highPriority: stats.highPriority,
          withTests: stats.withTests,
          noCoverage: stats.noCoverage
        }}
      />
    );
  }, [
    selectedRequirement,
    selectedRequirements,
    requirements,
    versions,
    mapping,  // ✅ Added - used in getLinkedTests
    testCases,  // ✅ Added - used in getLinkedTests
    selectedVersion,  // ✅ Added - used in getLinkedTests via testCaseAppliesTo
    handleBulkVersionAssignment,  // ✅ Added
    handleBulkTagsUpdate,  // ✅ Added
    handleBulkDelete,  // ✅ Added
    handleExportSelected  // ✅ Added
  ]);


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


  const confirmVersionAssignment = async () => {
    try {
      setIsProcessing(true);
      const totalRequirements = selectedRequirements.size;
      setProcessProgress({ current: 0, total: totalRequirements });

      console.log('🔧 Starting version assignment...', {
        action: versionAssignmentAction,
        version: selectedVersionForAssignment,
        selectedCount: totalRequirements
      });

      const results = {
        successful: [],
        failed: []
      };

      let currentIndex = 0;

      for (const reqId of selectedRequirements) {
        try {
          const requirement = requirements.find(r => r.id === reqId);
          if (!requirement) {
            console.warn(`⚠️ Requirement ${reqId} not found`);
            results.failed.push(reqId);
            currentIndex++;
            setProcessProgress({ current: currentIndex, total: totalRequirements });
            continue;
          }

          const currentVersions = requirement.versions || [];
          let newVersions;

          if (versionAssignmentAction === 'add') {
            newVersions = [...new Set([...currentVersions, selectedVersionForAssignment])];
          } else {
            newVersions = currentVersions.filter(v => v !== selectedVersionForAssignment);
          }

          if (JSON.stringify(currentVersions.sort()) === JSON.stringify(newVersions.sort())) {
            console.log(`ℹ️ No version changes needed for ${reqId}`);
            results.successful.push(reqId);
            currentIndex++;
            setProcessProgress({ current: currentIndex, total: totalRequirements });
            continue;
          }

          await dataStore.updateRequirement(reqId, {
            versions: newVersions,
            updatedAt: new Date().toISOString()
          });

          results.successful.push(reqId);
        } catch (error) {
          console.error(`❌ Failed to update versions for ${reqId}:`, error);
          results.failed.push(reqId);
        }

        currentIndex++;
        setProcessProgress({ current: currentIndex, total: totalRequirements });
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setSelectedRequirements(new Set());
      setShowVersionAssignmentModal(false);
      setIsProcessing(false);
      setProcessProgress({ current: 0, total: 0 });

      const versionName = versions.find(v => v.id === selectedVersionForAssignment)?.name;
      const actionText = versionAssignmentAction === 'add' ? 'added to' : 'removed from';

      if (results.failed.length === 0) {
        alert(`✅ Successfully ${actionText} "${versionName}" for ${results.successful.length} requirement(s)`);
      } else {
        alert(
          `⚠️ Bulk update completed:\n` +
          `✅ ${results.successful.length} successful\n` +
          `❌ ${results.failed.length} failed`
        );
      }
    } catch (error) {
      console.error('❌ Error in bulk version assignment:', error);
      alert('Error updating requirements: ' + error.message);
      setIsProcessing(false);
      setProcessProgress({ current: 0, total: 0 });
    }
  };

  // Add confirmation handler for tag assignment
  const confirmTagAssignment = async () => {
    try {
      setIsProcessing(true);
      const totalRequirements = selectedRequirements.size;
      setProcessProgress({ current: 0, total: totalRequirements });

      console.log('🏷️ Starting tag assignment...', {
        action: tagAssignmentAction,
        tags: selectedTagsForAssignment,
        selectedCount: totalRequirements
      });

      const results = {
        successful: [],
        failed: []
      };

      let currentIndex = 0;

      for (const reqId of selectedRequirements) {
        try {
          const requirement = requirements.find(r => r.id === reqId);
          if (!requirement) {
            console.warn(`⚠️ Requirement ${reqId} not found`);
            results.failed.push(reqId);
            currentIndex++;
            setProcessProgress({ current: currentIndex, total: totalRequirements });
            continue;
          }

          const currentTags = requirement.tags || [];
          let newTags;

          if (tagAssignmentAction === 'add') {
            newTags = [...new Set([...currentTags, ...selectedTagsForAssignment])];
          } else {
            newTags = currentTags.filter(t => !selectedTagsForAssignment.includes(t));
          }

          if (JSON.stringify(currentTags.sort()) === JSON.stringify(newTags.sort())) {
            console.log(`ℹ️ No tag changes needed for ${reqId}`);
            results.successful.push(reqId);
            currentIndex++;
            setProcessProgress({ current: currentIndex, total: totalRequirements });
            continue;
          }

          await dataStore.updateRequirement(reqId, {
            tags: newTags,
            updatedAt: new Date().toISOString()
          });

          results.successful.push(reqId);
        } catch (error) {
          console.error(`❌ Failed to update tags for ${reqId}:`, error);
          results.failed.push(reqId);
        }

        currentIndex++;
        setProcessProgress({ current: currentIndex, total: totalRequirements });
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setSelectedRequirements(new Set());
      setShowTagAssignmentModal(false);
      setIsProcessing(false);
      setProcessProgress({ current: 0, total: 0 });

      const actionText = tagAssignmentAction === 'add' ? 'added to' : 'removed from';
      const tagText = selectedTagsForAssignment.length === 1
        ? `"${selectedTagsForAssignment[0]}"`
        : `${selectedTagsForAssignment.length} tags`;

      let message = `✅ ${tagText} ${actionText} ${results.successful.length} requirement(s)`;

      if (results.failed.length > 0) {
        message += `\n⚠️ Failed to update ${results.failed.length} requirement(s)`;
      }

      alert(message);
    } catch (error) {
      console.error('❌ Tag assignment failed:', error);
      alert('❌ Tag assignment failed: ' + error.message);
      setIsProcessing(false);
      setProcessProgress({ current: 0, total: 0 });
    }
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
    <MainLayout title="Requirements" hasData={hasData} showRightSidebar={true} rightSidebar={rightSidebarContent}> {/* Updated: Always show sidebar */}
      <div className="space-y-6">
        {/* Simplified Top Bar - Removed main filter card */}
        <div className="bg-white rounded-lg shadow mb-4 p-4">
          <div className="flex items-center justify-between">
            {/* Left: Results count */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">
                  {filteredRequirements.length}
                </span> of {requirements.length} requirements
              </div>
              {/* Show if filters active */}
              {(searchQuery || priorityFilter !== 'All' || statusFilter !== 'All' || typeFilter !== 'All' || coverageFilter !== 'All' || selectedTagsFilter.length > 0) && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Filters active
                </span>
              )}
            </div>
            {/* Right: Add Button */}
            <button
              onClick={handleNewRequirement}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={16} className="mr-2" />
              Add Requirement
            </button>
          </div>
        </div>

        {/* Requirements Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  {/* Checkbox - Fixed small width */}
                  <th className="px-4 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      checked={selectedRequirements.size === filteredRequirements.length && filteredRequirements.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>

                  {/* ID / Name - Flexible, takes remaining space */}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID / Name
                  </th>

                  {/* Type - Fixed width */}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Type
                  </th>

                  {/* Priority - Fixed width */}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    Priority
                  </th>

                  {/* Status - Fixed width */}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequirements.map((req) => {
                  return (
                    <tr
                      key={req.id}
                      className={`hover:bg-gray-50 ${selectedRequirements.has(req.id) ? 'bg-blue-50' : ''} ${selectedRequirement?.id === req.id ? 'bg-blue-100' : ''} cursor-pointer`}
                      onClick={() => setSelectedRequirement(req)}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedRequirements.has(req.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleRequirementSelection(req.id, e.target.checked);
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>

                      {/* ID / Name - Allow text to wrap naturally */}
                      <td className="px-4 py-4 text-sm text-gray-900">
                        <div className="font-medium text-gray-900 mb-1">{req.id}</div>
                        <div className="text-sm text-gray-700 line-clamp-2" title={req.name}>
                          {req.name}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                          {req.type}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 rounded text-xs ${req.priority === 'High' ? 'bg-red-100 text-red-800' :
                          req.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                          {req.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="text-sm text-gray-700 flex items-center">
                          {req.status}
                          {req.status === 'Active' && <CheckCircle className="ml-1 text-green-600" size={14} />}
                          {req.status === 'Deprecated' && <AlertTriangle className="ml-1 text-orange-600" size={14} />}
                          {req.status === 'Archived' && <Trash2 className="ml-1 text-gray-500" size={14} />}
                        </span>
                      </td>
                    </tr>
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

        {/* NEW: Replace EditRequirementModal with SlideOutPanel */}
        {/* Fix the SlideOutPanel onClose handler */}
        <SlideOutPanel
          isOpen={editPanelOpen}
          onClose={() => {
            // Check for unsaved changes
            const originalRequirement = requirementToEdit?.id
              ? requirements.find(r => r.id === requirementToEdit.id)
              : null;

            // Only check for changes if editing an existing requirement
            if (originalRequirement) {
              // Create a normalized comparison by only comparing the fields that matter
              const hasChanges = JSON.stringify({
                id: requirementToEdit.id,
                name: requirementToEdit.name,
                description: requirementToEdit.description,
                priority: requirementToEdit.priority,
                type: requirementToEdit.type,
                status: requirementToEdit.status,
                businessImpact: requirementToEdit.businessImpact,
                technicalComplexity: requirementToEdit.technicalComplexity,
                regulatoryFactor: requirementToEdit.regulatoryFactor,
                usageFrequency: requirementToEdit.usageFrequency,
                minTestCases: requirementToEdit.minTestCases,
                versions: requirementToEdit.versions || [],
                tags: requirementToEdit.tags || []
              }) !== JSON.stringify({
                id: originalRequirement.id,
                name: originalRequirement.name,
                description: originalRequirement.description,
                priority: originalRequirement.priority,
                type: originalRequirement.type,
                status: originalRequirement.status,
                businessImpact: originalRequirement.businessImpact,
                technicalComplexity: originalRequirement.technicalComplexity,
                regulatoryFactor: originalRequirement.regulatoryFactor,
                usageFrequency: originalRequirement.usageFrequency,
                minTestCases: originalRequirement.minTestCases,
                versions: originalRequirement.versions || [],
                tags: originalRequirement.tags || []
              });

              if (hasChanges && window.confirm('You have unsaved changes. Discard them?')) {
                setEditPanelOpen(false);
                setRequirementToEdit(null);
              } else if (!hasChanges) {
                setEditPanelOpen(false);
                setRequirementToEdit(null);
              }
            } else {
              // Creating new requirement - just close without warning if empty
              const isEmpty = !requirementToEdit?.name && !requirementToEdit?.description;
              if (isEmpty || window.confirm('Discard new requirement?')) {
                setEditPanelOpen(false);
                setRequirementToEdit(null);
              }
            }
          }}
          title={requirementToEdit?.id && requirements.some(r => r.id === requirementToEdit.id) ? 'Edit Requirement' : 'Create New Requirement'}
          width="lg"
          footer={
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  // Use the same logic as onClose
                  const originalRequirement = requirementToEdit?.id
                    ? requirements.find(r => r.id === requirementToEdit.id)
                    : null;

                  if (originalRequirement) {
                    const hasChanges = JSON.stringify({
                      id: requirementToEdit.id,
                      name: requirementToEdit.name,
                      description: requirementToEdit.description,
                      priority: requirementToEdit.priority,
                      type: requirementToEdit.type,
                      status: requirementToEdit.status,
                      businessImpact: requirementToEdit.businessImpact,
                      technicalComplexity: requirementToEdit.technicalComplexity,
                      regulatoryFactor: requirementToEdit.regulatoryFactor,
                      usageFrequency: requirementToEdit.usageFrequency,
                      minTestCases: requirementToEdit.minTestCases,
                      versions: requirementToEdit.versions || [],
                      tags: requirementToEdit.tags || []
                    }) !== JSON.stringify({
                      id: originalRequirement.id,
                      name: originalRequirement.name,
                      description: originalRequirement.description,
                      priority: originalRequirement.priority,
                      type: originalRequirement.type,
                      status: originalRequirement.status,
                      businessImpact: originalRequirement.businessImpact,
                      technicalComplexity: originalRequirement.technicalComplexity,
                      regulatoryFactor: originalRequirement.regulatoryFactor,
                      usageFrequency: originalRequirement.usageFrequency,
                      minTestCases: originalRequirement.minTestCases,
                      versions: originalRequirement.versions || [],
                      tags: originalRequirement.tags || []
                    });

                    if (hasChanges && window.confirm('You have unsaved changes. Discard them?')) {
                      setEditPanelOpen(false);
                      setRequirementToEdit(null);
                    } else if (!hasChanges) {
                      setEditPanelOpen(false);
                      setRequirementToEdit(null);
                    }
                  } else {
                    const isEmpty = !requirementToEdit?.name && !requirementToEdit?.description;
                    if (isEmpty || window.confirm('Discard new requirement?')) {
                      setEditPanelOpen(false);
                      setRequirementToEdit(null);
                    }
                  }
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRequirement}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                {requirementToEdit?.id && requirements.some(r => r.id === requirementToEdit.id) ? 'Update Requirement' : 'Create Requirement'}
              </button>
            </div>
          }
        >
          {/* NEW: Put your edit form content here */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="space-y-4">
                {/* ID Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requirement ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={requirementToEdit?.id || ''}
                    onChange={(e) => setRequirementToEdit({
                      ...requirementToEdit,
                      id: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., REQ-001"
                    disabled={!!(requirementToEdit?.id && requirements.some(r => r.id === requirementToEdit.id))} // Can't edit existing ID
                  />
                </div>
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={requirementToEdit?.name || ''}
                    onChange={(e) => setRequirementToEdit({
                      ...requirementToEdit,
                      name: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter requirement name"
                  />
                </div>
                {/* Description Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={requirementToEdit?.description || ''}
                    onChange={(e) => setRequirementToEdit({
                      ...requirementToEdit,
                      description: e.target.value
                    })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Describe the requirement"
                  />
                </div>
              </div>
            </div>

            {/* Classification */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Classification</h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={requirementToEdit?.priority || 'Medium'}
                    onChange={(e) => setRequirementToEdit({
                      ...requirementToEdit,
                      priority: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={requirementToEdit?.type || 'Functional'}
                    onChange={(e) => setRequirementToEdit({
                      ...requirementToEdit,
                      type: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Functional">Functional</option>
                    <option value="Non-Functional">Non-Functional</option>
                    <option value="Security">Security</option>
                    <option value="Performance">Performance</option>
                    <option value="Usability">Usability</option>
                    <option value="Compliance">Compliance</option>
                  </select>
                </div>
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={requirementToEdit?.status || 'Active'}
                    onChange={(e) => setRequirementToEdit({
                      ...requirementToEdit,
                      status: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                    <option value="In Review">In Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Deprecated">Deprecated</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
                {/* Business Rationale */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Rationale
                  </label>
                  <input
                    type="text"
                    value={requirementToEdit?.businessRationale || ''}
                    onChange={(e) => setRequirementToEdit({
                      ...requirementToEdit,
                      businessRationale: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Business rationale"
                  />
                </div>
              </div>
            </div>

            {/* Test Depth Factors */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Depth Analysis Factors</h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Business Impact */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Impact (1-5)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={requirementToEdit?.businessImpact || 3}
                    onChange={(e) => setRequirementToEdit({
                      ...requirementToEdit,
                      businessImpact: parseInt(e.target.value) || 3
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                {/* Technical Complexity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Technical Complexity (1-5)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={requirementToEdit?.technicalComplexity || 3}
                    onChange={(e) => setRequirementToEdit({
                      ...requirementToEdit,
                      technicalComplexity: parseInt(e.target.value) || 3
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                {/* Regulatory Factor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Regulatory Factor (1-5)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={requirementToEdit?.regulatoryFactor || 1}
                    onChange={(e) => setRequirementToEdit({
                      ...requirementToEdit,
                      regulatoryFactor: parseInt(e.target.value) || 1
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                {/* Usage Frequency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usage Frequency (1-5)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={requirementToEdit?.usageFrequency || 3}
                    onChange={(e) => setRequirementToEdit({
                      ...requirementToEdit,
                      usageFrequency: parseInt(e.target.value) || 3
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                {/* Min Test Cases */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Test Cases
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={requirementToEdit?.minTestCases || 1}
                    onChange={(e) => setRequirementToEdit({
                      ...requirementToEdit,
                      minTestCases: parseInt(e.target.value) || 1
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                {/* Test Depth Factor (Calculated) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Depth Factor (Calculated)
                  </label>
                  <input
                    type="text"
                    value={requirementToEdit ? (
                      (requirementToEdit.businessImpact + requirementToEdit.technicalComplexity + requirementToEdit.regulatoryFactor + requirementToEdit.usageFrequency) / 4
                    ).toFixed(1) : '0.0'}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Versions and Tags */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Versions & Tags</h3>
              <div className="grid grid-cols-1 gap-4">
                {/* Versions - Multi-select with Badges */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Applicable Versions
                  </label>
                  <div className="space-y-3">
                    {/* Selected versions display */}
                    {requirementToEdit?.versions && requirementToEdit.versions.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        {requirementToEdit.versions.map((versionId) => {
                          const version = versions.find(v => v.id === versionId);
                          return (
                            <span key={versionId}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-600 text-white">
                              {version?.name || versionId}
                              <button
                                type="button"
                                onClick={() => {
                                  setRequirementToEdit({
                                    ...requirementToEdit,
                                    versions: requirementToEdit.versions.filter(v => v !== versionId)
                                  });
                                }}
                                className="hover:bg-blue-700 rounded-full p-0.5"
                                title="Remove"
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {/* Dropdown to add versions */}
                    {versions.length > 0 ? (
                      <>
                        <select
                          value=""
                          onChange={(e) => {
                            const versionId = e.target.value;
                            if (versionId && !requirementToEdit?.versions?.includes(versionId)) {
                              setRequirementToEdit({
                                ...requirementToEdit,
                                versions: [...(requirementToEdit?.versions || []), versionId]
                              });
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">+ Select Version to Add</option>
                          {versions
                            .filter(v => !requirementToEdit?.versions?.includes(v.id))
                            .map(v => (
                              <option key={v.id} value={v.id}>
                                {v.name}
                              </option>
                            ))}
                        </select>
                        {/* Quick actions */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setRequirementToEdit({
                                  ...requirementToEdit,
                                  versions: versions.map(v => v.id)
                                });
                              }}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Select All
                            </button>
                            {requirementToEdit?.versions && requirementToEdit.versions.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRequirementToEdit({
                                    ...requirementToEdit,
                                    versions: []
                                  });
                                }}
                                className="text-red-600 hover:text-red-800 font-medium"
                              >
                                Clear All
                              </button>
                            )}
                          </div>
                          {requirementToEdit?.versions && requirementToEdit.versions.length > 0 && (
                            <span className="text-gray-500"> {requirementToEdit.versions.length} selected </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          ⚠ No versions available. Create versions in the Releases page first.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={requirementToEdit?.tags?.join(', ') || ''}
                    onChange={(e) => setRequirementToEdit({
                      ...requirementToEdit,
                      tags: e.target.value ? e.target.value.split(',').map(t => t.trim()) : []
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., critical, login, api"
                  />
                </div>
              </div>
            </div>

            {/* Acceptance Criteria */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Acceptance Criteria</h3>
              <textarea
                value={requirementToEdit?.acceptanceCriteria ? requirementToEdit.acceptanceCriteria.join('\n') : ''}
                onChange={(e) => setRequirementToEdit({
                  ...requirementToEdit,
                  acceptanceCriteria: e.target.value ? e.target.value.split('\n').filter(line => line.trim() !== '') : []
                })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter acceptance criteria, one per line"
              />
            </div>
          </div>
        </SlideOutPanel>

        {/* Version Assignment Modal */}
        <BulkUpdateModal
          show={showVersionAssignmentModal}
          onClose={() => {
            setShowVersionAssignmentModal(false);
            setIsProcessing(false);
            setProcessProgress({ current: 0, total: 0 });
          }}
          onConfirm={confirmVersionAssignment}
          type="version"
          action={versionAssignmentAction}
          itemType="requirement"
          selectedCount={selectedRequirements.size}
          items={selectedVersionForAssignment}
          allItems={versions}
          isProcessing={isProcessing}
          processProgress={processProgress}
        />

        {/* Tag Assignment Modal */}
        <BulkUpdateModal
          show={showTagAssignmentModal}
          onClose={() => {
            setShowTagAssignmentModal(false);
            setIsProcessing(false);
            setProcessProgress({ current: 0, total: 0 });
          }}
          onConfirm={confirmTagAssignment}
          type="tag"
          action={tagAssignmentAction}
          itemType="requirement"
          selectedCount={selectedRequirements.size}
          items={selectedTagsForAssignment}
          allItems={[]}  // Not needed for tags as we show the actual tag names
          isProcessing={isProcessing}
          processProgress={processProgress}
        />
      </div>
    </MainLayout>
  );
};

export default Requirements;
import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  X,
  FileText,
  Tag,
  BarChart3,
  Edit,
  Trash2,
  Link,
  User,
  Calendar,
  CheckCircle,
  AlertCircle,
  Zap,
  Layers,
  FolderOpen,
} from 'lucide-react';
import MainLayout from '../components/Layout/MainLayout';
import EmptyState from '../components/Common/EmptyState';
import BulkActionsPanel from '../components/Common/BulkActionsPanel';
import EditTestCasePanel from '../components/TestCases/EditTestCasePanel';
import TestCasesSuiteSidebar from '../components/TestCases/TestCasesSuiteSidebar';
import BulkUpdateModal from '../components/Common/BulkUpdateModal';


import RightSidebarPanel, {
  SidebarSection,
  SidebarField,
  SidebarActionButton,
  SidebarBadge
} from '../components/Common/RightSidebarPanel';
import { useVersionContext } from '../context/VersionContext';
import dataStore from '../services/DataStore';
import TestCasesBrowseSidebar from '../components/TestCases/TestCasesBrowseSidebar';

// === NEW IMPORTS FROM SECTION 1 ===
import CreateSuiteModal from '../components/TestCases/CreateSuiteModal';
import AddToSuiteModal from '../components/TestCases/AddToSuiteModal';

// Helper to get linked requirements for a test case
const getLinkedRequirements = (testCaseId, mapping, requirements) => {
  const linkedReqIds = Object.entries(mapping)
    .filter(([reqId, tcIds]) => tcIds.includes(testCaseId))
    .map(([reqId]) => reqId);
  return requirements.filter(req => linkedReqIds.includes(req.id));
};

// Simplified TestCaseRow Component - No actions, split ID/Name, clickable for details
const TestCaseRow = ({
  testCase,
  onSelect,
  onRowClick,
  isSelected,
  isHighlighted,
  mapping,
  requirements
}) => {
  const linkedReqs = getLinkedRequirements(testCase.id, mapping, requirements);

  return (
    <tr
      className={`hover:bg-gray-50 cursor-pointer ${isHighlighted ? 'bg-blue-100 border-l-4 border-blue-500' : ''
        }`}
      onClick={(e) => {
        // Don't trigger row click if clicking checkbox
        if (e.target.type !== 'checkbox') {
          onRowClick(testCase);
        }
      }}
    >
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
      {/* Name Column */}
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">
          {testCase.name}
        </div>
      </td>

      {/* Priority Column */}
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${testCase.priority === 'Critical' || testCase.priority === 'High'
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
        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${testCase.automationStatus === 'Automated'
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
  const [selectedTestCase, setSelectedTestCase] = useState(null);
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const [testCaseToEdit, setTestCaseToEdit] = useState(null);
  const [selectedSuite, setSelectedSuite] = useState(null);
  const [activeSuiteFilter, setActiveSuiteFilter] = useState(null);
  const [showEditSuiteModal, setShowEditSuiteModal] = useState(false);
  const [suiteToEdit, setSuiteToEdit] = useState(null);

  // Progress tracking state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState({ current: 0, total: 0 });

  // Modal state
  const [showVersionAssignmentModal, setShowVersionAssignmentModal] = useState(false);
  const [versionAssignmentAction, setVersionAssignmentAction] = useState('add');
  const [selectedVersionForAssignment, setSelectedVersionForAssignment] = useState('');

  const [showTagAssignmentModal, setShowTagAssignmentModal] = useState(false);
  const [tagAssignmentAction, setTagAssignmentAction] = useState('add');
  const [selectedTagsForAssignment, setSelectedTagsForAssignment] = useState([]);


  // === FILTER STATE ===
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [automationFilter, setAutomationFilter] = useState('All');
  const [selectedTagsFilter, setSelectedTagsFilter] = useState([]);

  // === NEW STATE VARIABLES FROM SECTION 2 ===
  // Test Suite State
  const [testSuites, setTestSuites] = useState([]);
  const [showCreateSuiteModal, setShowCreateSuiteModal] = useState(false);
  const [showAddToSuiteModal, setShowAddToSuiteModal] = useState(false);
  const [selectedSuiteForAdding, setSelectedSuiteForAdding] = useState(null);
  const [suiteMembers, setSuiteMembers] = useState([]);
  const [isLoadingSuiteOperation, setIsLoadingSuiteOperation] = useState(false);

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

  // === NEW USEEFFECT FROM SECTION 3 ===
  // Load test suites
  useEffect(() => {
    const loadTestSuites = async () => {
      try {
        const suites = await dataStore.getTestSuites();
        setTestSuites(suites);
      } catch (error) {
        console.error('Error loading test suites:', error);
      }
    };
    loadTestSuites();
    const unsubscribe = dataStore.subscribe(() => {
      loadTestSuites();
    });
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

  // === HELPER FUNCTIONS ===
  const getAllCategories = (testCases) => {
    const categories = new Set();
    testCases.forEach(tc => {
      if (tc.category) categories.add(tc.category);
    });
    return Array.from(categories).sort();
  };

  const getAllTags = (testCases) => {
    const tags = new Set();
    testCases.forEach(tc => {
      if (tc.tags && Array.isArray(tc.tags)) {
        tc.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  };

  // === COMPREHENSIVE FILTERING LOGIC ===
  const filteredTestCases = useMemo(() => {
    let filtered = versionFilteredTestCases;

    // Apply category filter
    if (categoryFilter !== 'All') {
      filtered = filtered.filter(tc => tc.category === categoryFilter);
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(tc => tc.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'All') {
      filtered = filtered.filter(tc => tc.priority === priorityFilter);
    }

    // Apply automation filter
    if (automationFilter !== 'All') {
      filtered = filtered.filter(tc => tc.automationStatus === automationFilter);
    }

    // Apply tags filter
    if (selectedTagsFilter.length > 0) {
      filtered = filtered.filter(tc =>
        selectedTagsFilter.every(tag => tc.tags?.includes(tag))
      );
    }

    if (activeSuiteFilter) {
      if (suiteMembers.length === 0) {
        filtered = []; // Empty suite = show zero test cases
      } else {
        const suiteMemberIds = suiteMembers.map(m => m.id);
        filtered = filtered.filter(tc => suiteMemberIds.includes(tc.id));
      }
    }

    return filtered;
  }, [
    versionFilteredTestCases,
    categoryFilter,
    statusFilter,
    priorityFilter,
    automationFilter,
    selectedTagsFilter,
    activeSuiteFilter,    // NEW dependency
    suiteMembers          // NEW dependency
  ]);

  // === FILTER STATISTICS ===
  const filterStats = useMemo(() => {
    return {
      total: versionFilteredTestCases.length,
      filtered: filteredTestCases.length,
      automated: filteredTestCases.filter(tc => tc.automationStatus === 'Automated').length,
      manual: filteredTestCases.filter(tc => tc.automationStatus === 'Manual').length,
      passed: filteredTestCases.filter(tc => tc.status === 'Passed').length,
      failed: filteredTestCases.filter(tc => tc.status === 'Failed').length
    };
  }, [versionFilteredTestCases, filteredTestCases]);

  // Calculate summary statistics (kept for header metrics)
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
    setTestCaseToEdit(null);  // null = create mode
    setEditPanelOpen(true);
  };

  // Handle save test case from edit panel
  const handleSaveTestCase = async (updatedTestCase) => {
    try {
      if (testCaseToEdit) {
        await dataStore.updateTestCase(updatedTestCase.id, updatedTestCase);
      } else {
        await dataStore.addTestCase(updatedTestCase);
      }

      // ✅ FIX: Refresh ALL data including mapping
      setTestCases(dataStore.getTestCases());
      setMapping(dataStore.getMapping());
      setRequirements(dataStore.getRequirements());

      // Close panels
      setEditPanelOpen(false);
      setTestCaseToEdit(null);

      // ✅ FIX: Refresh selected test case from store
      if (selectedTestCase?.id === updatedTestCase.id) {
        const refreshedTestCase = dataStore.getTestCase(updatedTestCase.id);
        setSelectedTestCase(refreshedTestCase);
      }
    } catch (error) {
      console.error('Failed to save test case:', error);
      throw error;
    }
  };

  // Handle row click to show details
  const handleRowClick = (testCase) => {
    // Clear multi-selection when clicking a single row
    setSelectedTestCases(new Set());
    setSelectedTestCase(testCase);
  };

  // Get linked requirements for selected test case
  const linkedRequirements = useMemo(() => {
    if (!selectedTestCase) return [];
    return getLinkedRequirements(selectedTestCase.id, mapping, requirements);
  }, [selectedTestCase, mapping, requirements]);

  // Get all available tags from test cases
  const allTags = useMemo(() => {
    const tags = new Set();
    testCases.forEach(tc => {
      if (tc.tags && Array.isArray(tc.tags)) {
        tc.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [testCases]);

  // Available versions for bulk assignment
  const availableVersions = useMemo(() => {
    return versions.map(v => ({
      id: v.id,
      name: v.name
    }));
  }, [versions]);

  // === NEW HANDLER FUNCTIONS FROM SECTION 4 ===
  // Handler: Create a new test suite
  const handleCreateSuite = async (suiteData) => {
    try {
      setIsLoadingSuiteOperation(true);
      const newSuite = await dataStore.createTestSuite({
        name: suiteData.name,
        description: suiteData.description || '',
        version: suiteData.version || '',
        suite_type: suiteData.suite_type || 'custom',
        estimated_duration: suiteData.estimated_duration ?
          parseInt(suiteData.estimated_duration) : null,
        recommended_environment: suiteData.recommended_environment || ''
      });

      setShowCreateSuiteModal(false);
      alert(`Test suite "${newSuite.name}" created successfully!`);

      // Reload suites list
      const updatedSuites = await dataStore.getTestSuites();
      setTestSuites(updatedSuites);

      // ✅ FIX: Automatically open the newly created suite
      // This will show 0 test cases (empty suite) instead of all test cases
      setSelectedSuite(newSuite);
      setActiveSuiteFilter(newSuite.id);
      setSuiteMembers([]); // New suite has no members yet
      setSelectedTestCases(new Set()); // Clear any selections
      setSelectedTestCase(null); // Clear detail view

    } catch (error) {
      console.error('Error creating test suite:', error);
      alert(`Failed to create test suite: ${error.message}`);
    } finally {
      setIsLoadingSuiteOperation(false);
    }
  };



  /**
 * Handler: When user clicks on a test suite
 * - Loads suite details and members
 * - Sets active filter to show only suite members in main table
 * - Opens suite details in sidebar
 */
  const handleSuiteClick = async (suite) => {
    try {
      setIsLoadingSuiteOperation(true);

      // Set as currently selected suite (for sidebar)
      setSelectedSuite(suite);

      // Set as active filter (filters main table)
      setActiveSuiteFilter(suite.id);

      // Load suite members
      const members = await dataStore.getTestSuiteMembers(suite.id);
      setSuiteMembers(members);

      // Clear any test case selections (optional but recommended)
      setSelectedTestCases(new Set());
      setSelectedTestCase(null);

    } catch (error) {
      console.error('Error loading suite:', error);
      alert('Failed to load suite details');
    } finally {
      setIsLoadingSuiteOperation(false);
    }
  };



  /**
   * Handler: Exit suite view mode
   * - Clears suite filter
   * - Returns to browse all test cases mode
   */
  const handleClearSuiteFilter = () => {
    setSelectedSuite(null);
    setActiveSuiteFilter(null);
    setSuiteMembers([]);
  };




  /**
   * Handler: Open modal to add test cases to suite
   * Note: This is now called FROM the sidebar, not on suite click
   */
  const handleOpenAddToSuite = (suite) => {
    // Suite members are already loaded when suite was clicked
    setSelectedSuiteForAdding(suite || selectedSuite);
    setShowAddToSuiteModal(true);
  };
  /**
   * Handler: Open edit modal for suite
   */
  const handleEditSuite = (suite) => {
    setSuiteToEdit(suite || selectedSuite);
    setShowEditSuiteModal(true);
  };

  /**
   * Handler: Save edited suite
   */
  const handleUpdateSuite = async (suiteData) => {
    try {
      setIsLoadingSuiteOperation(true);

      // Call API to update suite
      await dataStore.updateTestSuite(suiteToEdit.id, suiteData);

      // Reload suites
      const updatedSuites = await dataStore.getTestSuites();
      setTestSuites(updatedSuites);

      // Update selected suite if it's the one being edited
      if (selectedSuite?.id === suiteId) {
        const updatedSuite = updatedSuites.find(s => s.id === suiteId);
        if (updatedSuite) {
          setSelectedSuite(updatedSuite);
        }
      }

      // Close modal
      setShowEditSuiteModal(false);
      setSuiteToEdit(null);

      alert('Suite updated successfully!');

    } catch (error) {
      console.error('Error updating suite:', error);
      alert(`Failed to update suite: ${error.message}`);
    } finally {
      setIsLoadingSuiteOperation(false);
    }
  };

  /**
   * Handler: Delete a test suite
   */
  const handleDeleteSuite = async (suite) => {
    const suiteToDelete = suite || selectedSuite;

    if (!window.confirm(`Are you sure you want to delete "${suiteToDelete.name}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      setIsLoadingSuiteOperation(true);

      // Call API to delete suite
      await dataStore.deleteTestSuite(suiteToDelete.id);

      // Reload suites
      const updatedSuites = await dataStore.getTestSuites();
      setTestSuites(updatedSuites);

      // Clear suite filter if we deleted the active suite
      if (selectedSuite?.id === suiteToDelete.id) {
        handleClearSuiteFilter();
      }

      alert('Suite deleted successfully!');

    } catch (error) {
      console.error('Error deleting suite:', error);
      alert(`Failed to delete suite: ${error.message}`);
    } finally {
      setIsLoadingSuiteOperation(false);
    }
  };

  /**
   * Handler: Remove a single test case from suite
   */
  const handleRemoveTestFromSuite = async (testCaseId) => {
    if (!selectedSuite) return;

    if (!window.confirm('Remove this test case from the suite?')) {
      return;
    }

    try {
      setIsLoadingSuiteOperation(true);

      // Call API to remove test case
      await dataStore.removeTestCaseFromSuite(selectedSuite.id, testCaseId);

      // Reload suite members
      const updatedMembers = await dataStore.getTestSuiteMembers(selectedSuite.id);
      setSuiteMembers(updatedMembers);

      // Reload suites to update counts
      const updatedSuites = await dataStore.getTestSuites();
      setTestSuites(updatedSuites);

      // Update selected suite with new member count
      const updatedSuite = updatedSuites.find(s => s.id === selectedSuite.id);
      if (updatedSuite) {
        setSelectedSuite(updatedSuite);
      }

    } catch (error) {
      console.error('Error removing test case:', error);
      alert('Failed to remove test case from suite');
    } finally {
      setIsLoadingSuiteOperation(false);
    }
  };


  /**
 * Handler: Add test cases to suite
 * Updated to refresh suite members after adding
 */
  const handleAddTestCasesToSuite = async (suiteId, testCaseIds) => {
    try {
      setIsLoadingSuiteOperation(true);

      const result = await dataStore.addTestCasesToSuite(suiteId, testCaseIds);

      if (result.added > 0) {
        alert(`Successfully added ${result.added} test case(s) to the suite.${result.skipped > 0 ? ` (${result.skipped} already in suite)` : ''}`);
      } else {
        alert('No new test cases were added. They may already be in the suite.');
      }

      // Reload suites
      const updatedSuites = await dataStore.getTestSuites();
      setTestSuites(updatedSuites);

      // Reload suite members if we're viewing this suite
      if (selectedSuite?.id === suiteId) {
        const updatedMembers = await dataStore.getTestSuiteMembers(suiteId);
        setSuiteMembers(updatedMembers);

        // Update selected suite
        const updatedSuite = updatedSuites.find(s => s.id === suiteId);
        if (updatedSuite) {
          setSelectedSuite(updatedSuite);
        }
      }

      // Close modal
      setShowAddToSuiteModal(false);
      setSelectedSuiteForAdding(null);

    } catch (error) {
      console.error('Error adding test cases to suite:', error);
      alert(`Failed to add test cases: ${error.message}`);
      throw error;
    } finally {
      setIsLoadingSuiteOperation(false);
    }
  };

  // ============================================
  // BULK ACTION HANDLERS
  // ============================================

  /**
   * Handler for bulk version assignment
   */
  const handleBulkVersionAssignment = (versionId, action) => {
    if (selectedTestCases.size === 0) return;
    setSelectedVersionForAssignment(versionId);
    setVersionAssignmentAction(action);
    setShowVersionAssignmentModal(true);
  };

  /**
   * Handler for bulk tag updates
   */
  const handleBulkTagsUpdate = (tags, action) => {
    if (selectedTestCases.size === 0) return;
    setSelectedTagsForAssignment(tags);
    setTagAssignmentAction(action);
    setShowTagAssignmentModal(true);
  };
  /**
   * Confirm and execute version assignment for test cases
   */
  const confirmVersionAssignment = async () => {
    try {
      setIsProcessing(true);
      const totalTestCases = selectedTestCases.size;
      setProcessProgress({ current: 0, total: totalTestCases });

      console.log('🔧 Starting version assignment for test cases...', {
        action: versionAssignmentAction,
        version: selectedVersionForAssignment,
        selectedCount: totalTestCases
      });

      const results = {
        successful: [],
        failed: []
      };

      let currentIndex = 0;

      for (const tcId of selectedTestCases) {
        try {
          const testCase = testCases.find(tc => tc.id === tcId);
          if (!testCase) {
            results.failed.push(tcId);
            currentIndex++;
            setProcessProgress({ current: currentIndex, total: totalTestCases });
            continue;
          }

          const currentVersions = testCase.applicableVersions || [];
          let newVersions;

          if (versionAssignmentAction === 'add') {
            newVersions = [...new Set([...currentVersions, selectedVersionForAssignment])];
          } else {
            newVersions = currentVersions.filter(v => v !== selectedVersionForAssignment);
          }

          if (JSON.stringify(currentVersions.sort()) === JSON.stringify(newVersions.sort())) {
            results.successful.push(tcId);
            currentIndex++;
            setProcessProgress({ current: currentIndex, total: totalTestCases });
            continue;
          }

          await dataStore.updateTestCase(tcId, {
            applicableVersions: newVersions,
            updatedAt: new Date().toISOString()
          });

          results.successful.push(tcId);
        } catch (error) {
          console.error(`❌ Failed to update versions for ${tcId}:`, error);
          results.failed.push(tcId);
        }

        currentIndex++;
        setProcessProgress({ current: currentIndex, total: totalTestCases });
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setSelectedTestCases(new Set());
      setShowVersionAssignmentModal(false);
      setIsProcessing(false);
      setProcessProgress({ current: 0, total: 0 });

      const versionName = versions.find(v => v.id === selectedVersionForAssignment)?.name;
      const actionText = versionAssignmentAction === 'add' ? 'added to' : 'removed from';

      if (results.failed.length === 0) {
        alert(`✅ Successfully ${actionText} "${versionName}" for ${results.successful.length} test case(s)`);
      } else {
        alert(
          `⚠️ Bulk update completed:\n` +
          `✅ ${results.successful.length} successful\n` +
          `❌ ${results.failed.length} failed`
        );
      }
    } catch (error) {
      console.error('❌ Error in bulk version assignment:', error);
      alert('Error updating test cases: ' + error.message);
      setIsProcessing(false);
      setProcessProgress({ current: 0, total: 0 });
    }
  };

  /**
   * Confirm and execute tag assignment for test cases
   */
  const confirmTagAssignment = async () => {
    try {
      setIsProcessing(true);
      const totalTestCases = selectedTestCases.size;
      setProcessProgress({ current: 0, total: totalTestCases });

      const results = {
        successful: [],
        failed: []
      };

      let currentIndex = 0;

      for (const tcId of selectedTestCases) {
        try {
          const testCase = testCases.find(tc => tc.id === tcId);
          if (!testCase) {
            results.failed.push(tcId);
            currentIndex++;
            setProcessProgress({ current: currentIndex, total: totalTestCases });
            continue;
          }

          const currentTags = testCase.tags || [];
          let newTags;

          if (tagAssignmentAction === 'add') {
            newTags = [...new Set([...currentTags, ...selectedTagsForAssignment])];
          } else {
            newTags = currentTags.filter(t => !selectedTagsForAssignment.includes(t));
          }

          if (JSON.stringify(currentTags.sort()) === JSON.stringify(newTags.sort())) {
            results.successful.push(tcId);
            currentIndex++;
            setProcessProgress({ current: currentIndex, total: totalTestCases });
            continue;
          }

          await dataStore.updateTestCase(tcId, {
            tags: newTags,
            updatedAt: new Date().toISOString()
          });

          results.successful.push(tcId);
        } catch (error) {
          console.error(`❌ Failed to update tags for ${tcId}:`, error);
          results.failed.push(tcId);
        }

        currentIndex++;
        setProcessProgress({ current: currentIndex, total: totalTestCases });
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setSelectedTestCases(new Set());
      setShowTagAssignmentModal(false);
      setIsProcessing(false);
      setProcessProgress({ current: 0, total: 0 });

      const actionText = tagAssignmentAction === 'add' ? 'added to' : 'removed from';
      const tagText = selectedTagsForAssignment.length === 1
        ? `"${selectedTagsForAssignment[0]}"`
        : `${selectedTagsForAssignment.length} tags`;

      if (results.failed.length === 0) {
        alert(`✅ ${tagText} ${actionText} ${results.successful.length} test case(s)`);
      } else {
        alert(
          `⚠️ Bulk update completed:\n` +
          `✅ ${results.successful.length} successful\n` +
          `❌ ${results.failed.length} failed`
        );
      }
    } catch (error) {
      console.error('❌ Tag assignment failed:', error);
      alert('❌ Tag assignment failed: ' + error.message);
      setIsProcessing(false);
      setProcessProgress({ current: 0, total: 0 });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTestCases.size === 0) return;
    const count = selectedTestCases.size;
    if (!window.confirm(`Delete ${count} test case(s)? This cannot be undone.`)) return;
    try {
      const testCaseIds = Array.from(selectedTestCases);
      for (const tcId of testCaseIds) {
        await dataStore.deleteTestCase(tcId);
      }
      setTestCases(dataStore.getTestCases());
      setSelectedTestCases(new Set());
      alert(`Successfully deleted ${count} test case(s)`);
    } catch (error) {
      console.error('Error deleting test cases:', error);
      alert('Failed to delete test cases');
    }
  };

  const rightSidebarContent = useMemo(() => {
    // 🔥 PRIORITY 1: Suite is selected → Show suite details
    if (selectedSuite) {
      return (
        <TestCasesSuiteSidebar
          suite={{ ...selectedSuite, members: suiteMembers }}
          onEditSuite={() => handleEditSuite(selectedSuite)}
          onDeleteSuite={() => handleDeleteSuite(selectedSuite)}
          onClose={handleClearSuiteFilter}  // X button clears filter
          onAddTests={() => handleOpenAddToSuite(selectedSuite)}
          onRemoveTest={handleRemoveTestFromSuite}  // NEW: Remove test from suite
          isFiltering={activeSuiteFilter !== null}  // Show filter indicator
        />
      );
    }

    // PRIORITY 2: Multiple test cases selected → Bulk actions
    if (selectedTestCases.size > 1) {
      return (
        <BulkActionsPanel
          selectedCount={selectedTestCases.size}
          selectedItems={Array.from(selectedTestCases).map(id =>
            testCases.find(tc => tc.id === id)
          ).filter(Boolean)}
          itemType="testcase"
          availableVersions={versions}
          availableTags={getAllTags(testCases)}
          onVersionAssign={handleBulkVersionAssignment}
          onTagsUpdate={handleBulkTagsUpdate}
          onBulkDelete={handleBulkDelete}
          onClearSelection={() => setSelectedTestCases(new Set())}
          showExecuteButton={true}
          onExecute={() => console.log('Execute selected tests')}
        />
      );
    }

    // PRIORITY 3: Single test case selected → Test case details
    if (selectedTestCase) {
      return (
        <RightSidebarPanel
          title="Test Case Details"
          onClose={() => setSelectedTestCase(null)}
        >
          {/* Quick Actions */}
          <div className="p-4 space-y-2 border-b border-gray-200">
            <SidebarActionButton
              icon={<Edit size={16} />}
              label="Edit Test Case"
              onClick={() => {
                setTestCaseToEdit({
                  id: selectedTestCase.id || '',
                  name: selectedTestCase.name || '',
                  description: selectedTestCase.description || '',
                  category: selectedTestCase.category || '',
                  priority: selectedTestCase.priority || 'Medium',
                  automationStatus: selectedTestCase.automationStatus || 'Manual',
                  status: selectedTestCase.status || 'Not Run',
                  steps: selectedTestCase.steps || [],
                  expectedResult: selectedTestCase.expectedResult || '',
                  preconditions: selectedTestCase.preconditions || '',
                  testData: selectedTestCase.testData || '',
                  tags: selectedTestCase.tags || [],
                  requirementIds: selectedTestCase.requirementIds || [],
                  applicableVersions: selectedTestCase.applicableVersions || [],
                  assignee: selectedTestCase.assignee || '',
                  estimatedDuration: selectedTestCase.estimatedDuration || null
                });
                setEditPanelOpen(true);
              }}
              variant="primary"
              fullWidth
            />
            <SidebarActionButton
              icon={<Trash2 size={16} />}
              label="Delete Test Case"
              onClick={() => {
                if (confirm(`Delete test case ${selectedTestCase.id}?`)) {
                  console.log('Delete test case:', selectedTestCase.id);
                  // TODO: Implement delete
                  setSelectedTestCase(null);
                }
              }}
              variant="danger"
              fullWidth
            />
          </div>

          {/* Basic Information */}
          <SidebarSection
            title="Basic Information"
            icon={<FileText size={16} />}
            defaultOpen={true}
          >
            <SidebarField
              label="Test Case ID"
              value={<span className="font-mono font-semibold">{selectedTestCase.id}</span>}
            />
            <SidebarField
              label="Name"
              value={selectedTestCase.name}
            />
            {selectedTestCase.description && (
              <SidebarField
                label="Description"
                value={<p className="text-sm leading-relaxed">{selectedTestCase.description}</p>}
              />
            )}
            {selectedTestCase.category && (
              <SidebarField
                label="Category"
                value={selectedTestCase.category}
              />
            )}
          </SidebarSection>

          {/* Classification */}
          <SidebarSection
            title="Classification"
            icon={<Tag size={16} />}
            defaultOpen={true}
          >
            <SidebarField
              label="Priority"
              value={
                <SidebarBadge
                  label={selectedTestCase.priority || 'Medium'}
                  color={
                    selectedTestCase.priority === 'High' || selectedTestCase.priority === 'Critical'
                      ? 'red'
                      : selectedTestCase.priority === 'Medium'
                        ? 'yellow'
                        : 'blue'
                  }
                />
              }
            />
            <SidebarField
              label="Status"
              value={
                <SidebarBadge
                  label={selectedTestCase.status || 'Not Run'}
                  color={
                    selectedTestCase.status === 'Passed'
                      ? 'green'
                      : selectedTestCase.status === 'Failed'
                        ? 'red'
                        : selectedTestCase.status === 'Blocked'
                          ? 'orange'
                          : 'gray'
                  }
                />
              }
            />
            <SidebarField
              label="Automation"
              value={
                <SidebarBadge
                  label={selectedTestCase.automationStatus || 'Manual'}
                  color={
                    selectedTestCase.automationStatus === 'Automated'
                      ? 'green'
                      : selectedTestCase.automationStatus === 'Semi-Automated'
                        ? 'blue'
                        : selectedTestCase.automationStatus === 'Planned'
                          ? 'purple'
                          : 'gray'
                  }
                />
              }
            />
          </SidebarSection>

          {/* Test Steps */}
          {selectedTestCase.steps && selectedTestCase.steps.length > 0 && (
            <SidebarSection
              title="Test Steps"
              icon={<CheckCircle size={16} />}
              defaultOpen={false}
            >
              <ol className="space-y-2 text-sm">
                {selectedTestCase.steps.map((step, index) => (
                  <li key={index} className="flex">
                    <span className="font-semibold text-gray-700 mr-2">{index + 1}.</span>
                    <span className="text-gray-600">{step}</span>
                  </li>
                ))}
              </ol>
            </SidebarSection>
          )}

          {/* Expected Result */}
          {selectedTestCase.expectedResult && (
            <SidebarSection
              title="Expected Result"
              icon={<CheckCircle size={16} />}
              defaultOpen={false}
            >
              <p className="text-sm text-gray-600 leading-relaxed">
                {selectedTestCase.expectedResult}
              </p>
            </SidebarSection>
          )}

          {/* Preconditions */}
          {selectedTestCase.preconditions && (
            <SidebarSection
              title="Preconditions"
              icon={<AlertCircle size={16} />}
              defaultOpen={false}
            >
              <p className="text-sm text-gray-600 leading-relaxed">
                {selectedTestCase.preconditions}
              </p>
            </SidebarSection>
          )}

          {/* Test Data */}
          {selectedTestCase.testData && (
            <SidebarSection
              title="Test Data"
              icon={<FileText size={16} />}
              defaultOpen={false}
            >
              <p className="text-sm text-gray-600 leading-relaxed">
                {selectedTestCase.testData}
              </p>
            </SidebarSection>
          )}

          {/* Tags */}
          {selectedTestCase.tags && selectedTestCase.tags.length > 0 && (
            <SidebarSection
              title="Tags"
              icon={<Tag size={16} />}
              defaultOpen={false}
            >
              <div className="flex flex-wrap gap-2">
                {selectedTestCase.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </SidebarSection>
          )}

          {/* Linked Requirements */}
          {linkedRequirements.length > 0 && (
            <SidebarSection
              title="Linked Requirements"
              icon={<Link size={16} />}
              defaultOpen={false}
              badge={linkedRequirements.length}
            >
              <div className="space-y-2">
                {linkedRequirements.map((req) => (
                  <div
                    key={req.id}
                    className="p-2 bg-purple-50 border border-purple-200 rounded text-sm"
                  >
                    <div className="font-medium text-purple-900">{req.id}</div>
                    <div className="text-xs text-purple-700 mt-1">{req.name}</div>
                  </div>
                ))}
              </div>
            </SidebarSection>
          )}

          {/* Metadata */}
          <SidebarSection
            title="Metadata"
            icon={<BarChart3 size={16} />}
            defaultOpen={false}
          >
            {selectedTestCase.assignee && (
              <SidebarField
                label="Assignee"
                value={
                  <div className="flex items-center">
                    <User size={14} className="mr-1 text-gray-500" />
                    <span className="text-sm">{selectedTestCase.assignee}</span>
                  </div>
                }
              />
            )}
            {selectedTestCase.estimatedDuration && (
              <SidebarField
                label="Estimated Duration"
                value={
                  <div className="flex items-center">
                    <Calendar size={14} className="mr-1 text-gray-500" />
                    <span className="text-sm">{selectedTestCase.estimatedDuration} min</span>
                  </div>
                }
              />
            )}
            {selectedTestCase.applicableVersions && selectedTestCase.applicableVersions.length > 0 && (
              <SidebarField
                label="Versions"
                value={
                  <div className="flex flex-wrap gap-1">
                    {selectedTestCase.applicableVersions.map((version, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded"
                      >
                        {version}
                      </span>
                    ))}
                  </div>
                }
              />
            )}
            {selectedTestCase.automationPath && (
              <SidebarField
                label="Automation Path"
                value={
                  <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                    {selectedTestCase.automationPath}
                  </span>
                }
              />
            )}
            {selectedTestCase.lastExecuted && (
              <SidebarField
                label="Last Executed"
                value={new Date(selectedTestCase.lastExecuted).toLocaleDateString()}
              />
            )}
            {selectedTestCase.executedBy && (
              <SidebarField
                label="Executed By"
                value={selectedTestCase.executedBy}
              />
            )}
          </SidebarSection>
        </RightSidebarPanel>
      );
    }

    // DEFAULT: Browse mode → Show browse sidebar
    return (
      <TestCasesBrowseSidebar
        testSuites={testSuites}
        onCreateSuite={() => setShowCreateSuiteModal(true)}
        onSuiteClick={handleSuiteClick}  // 🔥 Changed from handleOpenAddToSuite
        onAddTestCase={handleNewTestCase}

        // Filters
        categoryFilter={categoryFilter}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        automationFilter={automationFilter}
        selectedTagsFilter={selectedTagsFilter}

        // Available options
        allCategories={getAllCategories(versionFilteredTestCases)}
        allTags={getAllTags(versionFilteredTestCases)}

        // Filter callbacks
        onCategoryChange={setCategoryFilter}
        onStatusChange={setStatusFilter}
        onPriorityChange={setPriorityFilter}
        onAutomationChange={setAutomationFilter}
        onTagsChange={setSelectedTagsFilter}
        onClearAllFilters={() => {
          setCategoryFilter('All');
          setStatusFilter('All');
          setPriorityFilter('All');
          setAutomationFilter('All');
          setSelectedTagsFilter([]);
        }}

        // Statistics
        stats={filterStats}
      />
    );
  }, [
    selectedSuite,
    selectedTestCase,
    selectedTestCases,
    testCases,
    testSuites,
    suiteMembers,
    activeSuiteFilter,  // NEW
    versionFilteredTestCases,
    categoryFilter,
    statusFilter,
    priorityFilter,
    automationFilter,
    selectedTagsFilter,
    filterStats
  ]);

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
    <MainLayout
      title="Test Cases"
      hasData={hasTestCases}
      showRightSidebar={true}
      rightSidebar={rightSidebarContent}
    >
      {/* Top Bar with count and Add button */}
      <div className="bg-white rounded-lg shadow mb-4 p-4">
        <div className="flex items-center justify-between">
          {/* Left: Results count */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">
                {filteredTestCases.length}
              </span> of {testCases.length} test cases
            </div>
            {/* Show if filters active */}
            {(categoryFilter !== 'All' || statusFilter !== 'All' || priorityFilter !== 'All' || automationFilter !== 'All' || selectedTagsFilter.length > 0) && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Filters active
              </span>
            )}
          </div>
          {/* Right: Add Button */}
          <button
            onClick={handleNewTestCase}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} className="mr-2" />
            Add Test Case
          </button>
        </div>
      </div>
      <div className="space-y-6">
        {activeSuiteFilter && selectedSuite && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FolderOpen size={20} className="text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Viewing: {selectedSuite.name}
                  </p>
                  <p className="text-xs text-blue-700">
                    Showing {filteredTestCases.length} test case{filteredTestCases.length !== 1 ? 's' : ''} from this suite
                  </p>
                </div>
              </div>
              <button
                onClick={handleClearSuiteFilter}
                className="px-3 py-1.5 text-sm text-blue-700 hover:text-blue-900 hover:bg-blue-100 rounded transition-colors flex items-center gap-1"
              >
                <X size={14} />
                Clear Filter
              </button>
            </div>
          </div>
        )}

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

                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTestCases.map((testCase) => (
                    <TestCaseRow
                      key={testCase.id}
                      testCase={testCase}
                      onSelect={handleTestCaseSelection}
                      onRowClick={handleRowClick}
                      isSelected={selectedTestCases.has(testCase.id)}
                      isHighlighted={selectedTestCases.has(testCase.id) || selectedTestCase?.id === testCase.id}
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

      {/* Edit Test Case Panel */}
      <EditTestCasePanel
        isOpen={editPanelOpen}
        onClose={() => {
          setEditPanelOpen(false);
          setTestCaseToEdit(null);
        }}
        testCase={testCaseToEdit}
        onSave={handleSaveTestCase}
        versions={versions}
        requirements={requirements}
      />

      {/* === SECTION 5: MODALS === */}

      {/* Create Suite Modal (NEW SUITE) */}
      <CreateSuiteModal
        isOpen={showCreateSuiteModal}
        onClose={() => setShowCreateSuiteModal(false)}
        onCreate={handleCreateSuite}
        isEditMode={false}
      />

      {/* Edit Suite Modal (EXISTING SUITE) */}
      <CreateSuiteModal
        isOpen={showEditSuiteModal}
        onClose={() => {
          setShowEditSuiteModal(false);
          setSuiteToEdit(null);
        }}
        onCreate={handleUpdateSuite}
        initialData={suiteToEdit}
        isEditMode={true}
      />

      {/* Add to Suite Modal */}
      <AddToSuiteModal
        isOpen={showAddToSuiteModal}
        onClose={() => {
          setShowAddToSuiteModal(false);
          setSelectedSuiteForAdding(null);
        }}
        onAdd={handleAddTestCasesToSuite}
        suite={selectedSuiteForAdding}
        availableTestCases={testCases}
        existingMemberIds={suiteMembers.map(m => m.id)}
        isLoading={isLoadingSuiteOperation}
      />

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
        itemType="test case"
        selectedCount={selectedTestCases.size}
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
        itemType="test case"
        selectedCount={selectedTestCases.size}
        items={selectedTagsForAssignment}
        allItems={[]}
        isProcessing={isProcessing}
        processProgress={processProgress}
      />
    </MainLayout>
  );
};

export default TestCases;
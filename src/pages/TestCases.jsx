// src/pages/TestCases.jsx - Enhanced Version with Test Suites Integration
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
  Eye, // NEW: Eye icon for view action
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  AlertTriangle,
  FileText,
  Code,
  X,
  Copy, // NEW: Copy icon for duplicate action
  Hash,     // 🆕 ADD - for tag icon  
  Minus,    // 🆕 ADD - for remove operations
  Tag,
  FolderOpen, // NEW: For suite filter banner
  // NEW: Import icons for sidebar states
  Folder,
  Filter as FilterIcon,
  User,
  Calendar,
  BarChart3,
  CheckSquare,
  AlertCircle,
  Zap,
  FileText as FileTextIcon,
  Layers,
  Plus as PlusIcon,
  Edit as EditIcon,
  Trash2 as TrashIcon,
  XCircle as XCircleIcon,
  CheckCircle as CheckCircleIcon,
  Clock as ClockIcon,
  Play as PlayIcon,
  Eye as EyeIcon
} from 'lucide-react';
import MainLayout from '../components/Layout/MainLayout';
import EmptyState from '../components/Common/EmptyState';
import TestExecutionModal from '../components/TestExecution/TestExecutionModal';
import FailureDetailsPanel from '../components/TestExecution/FailureDetailsPanel';
import { useVersionContext } from '../context/VersionContext';
import dataStore from '../services/DataStore';

// NEW: Import enhanced modals - UNCOMMENT when components are created
import ViewTestCaseModal from '../components/TestCases/ViewTestCaseModal';
import EditTestCaseModal from '../components/TestCases/EditTestCaseModal';
import TestCasesSuiteSidebar from '../components/TestCases/TestCasesSuiteSidebar';
import TestCaseDetailsSidebar from '../components/TestCases/TestCaseDetailsSidebar';

// NEW: Import the sidebar component
import TestCasesBrowseSidebar from '../components/TestCases/TestCasesBrowseSidebar';
// NEW: Import additional sidebar components (placeholder for now)
import BulkActionsPanel from '../components/Common/BulkActionsPanel';
import TestCaseRowActions from '../components/TestCases/TestCaseRowActions';
// Helper function to format last execution date
const formatLastExecution = (lastExecuted) => {
  if (!lastExecuted) return 'Never';
  const date = new Date(lastExecuted);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
/**
 * Helper function to get display text for test case versions
 * @param {Object} testCase - Test case object
 * @returns {string} Display text for versions
 */
const getVersionDisplayText = (testCase) => {
  // Handle new format
  if (testCase.applicableVersions) {
    if (testCase.applicableVersions.length === 0) {
      return 'All Versions';
    }
    return testCase.applicableVersions.join(', ');
  }
  // Handle legacy format
  return testCase.version || 'All Versions';
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

// NEW: Get all unique categories
const getAllCategories = (testCases) => {
  const categories = new Set();
  testCases.forEach(tc => {
    if (tc.category) categories.add(tc.category);
  });
  return Array.from(categories).sort();
};

// NEW: Get all unique tags
const getAllTags = (testCases) => {
  const tags = new Set();
  testCases.forEach(tc => {
    if (tc.tags && Array.isArray(tc.tags)) {
      tc.tags.forEach(tag => tags.add(tag));
    }
  });
  return Array.from(tags).sort();
};

// NEW: Get linked requirements for a test case
const getLinkedRequirements = (testCaseId, mapping, requirements) => {
  const linkedReqIds = Object.entries(mapping)
    .filter(([reqId, tcIds]) => tcIds.includes(testCaseId))
    .map(([reqId]) => reqId);
  return requirements.filter(req => linkedReqIds.includes(req.id));
};

// TestCaseRow Component (updated with view action and optimized layout)
const TestCaseRow = ({
  testCase,
  versions,
  selectedVersion,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onExecute,
  onDuplicate,
  isSelected,
  isExpanded,
  onToggleExpand,
  expandedTests,
  onToggleFailureExpand,
  setModalVersions, // Add this line
  setShowVersionModal // Add this line
}) => {
  const isFailureExpanded = expandedTests.has(testCase.id);
  return (
    <React.Fragment>
      <tr className={`flex w-full hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
        <td className="px-2 py-3 w-10 flex-shrink-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(testCase.id, e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </td>
        {/* REPLACE WITH THIS SINGLE COMBINED COLUMN: */}
        <td className="px-2 py-3 text-sm text-gray-900 w-80 flex-shrink-0">
          <div className="flex items-start">
            <button
              onClick={() => onToggleExpand(testCase.id)}
              className="mr-2 p-1 hover:bg-gray-200 rounded flex-shrink-0 mt-0.5"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 mb-1 truncate">{testCase.id}</div>
              {/* Only show name if it's different from ID */}
              {testCase.name && testCase.name !== testCase.id && (
                <div className="text-sm text-gray-700 truncate" title={testCase.name}>
                  {testCase.name}
                </div>
              )}
            </div>
          </div>
        </td>
        <td className="px-2 py-3 w-20 flex-shrink-0">
          <div className="flex flex-col items-start">
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded">
              {testCase.status === 'Passed' && <CheckCircle size={12} className="text-green-600 mr-1" />}
              {testCase.status === 'Failed' && <XCircle size={12} className="text-red-600 mr-1" />}
              {testCase.status === 'Blocked' && <Pause size={12} className="text-yellow-600 mr-1" />}
              {testCase.status === 'Not Found' && <AlertTriangle size={12} className="text-orange-600 mr-1" />}
              {testCase.status === 'Not Run' && <Clock size={12} className="text-gray-500 mr-1" />}
              {testCase.status === 'Not Run' ? 'Not Run' : testCase.status}
            </span>
            {/* Execution Info - moved below status */}
            {(testCase.status === 'Passed' || testCase.status === 'Failed') && testCase.duration && (
              <div className="flex items-center mt-1 text-xs text-gray-500">
                <Clock size={12} />
                <span className="ml-1">{testCase.duration}ms</span>
              </div>
            )}
            {/* Expand/Collapse Button - only for failed/error tests */}
            {(testCase.status === 'Failed' || testCase.status === 'Not Found') && (
              <button
                onClick={() => onToggleFailureExpand(testCase.id)} // Corrected handler
                className="mt-1 p-1 hover:bg-gray-200 rounded transition-colors"
                title={isFailureExpanded ? 'Collapse details' : 'Expand details'}
              >
                {isFailureExpanded ? (
                  <ChevronUp size={14} className="text-gray-600" />
                ) : (
                  <ChevronDown size={14} className="text-gray-600" />
                )}
              </button>
            )}
          </div>
        </td>
        <td className="px-2 py-3 w-16 flex-shrink-0">
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${testCase.priority === 'High' ? 'bg-red-50 text-red-600' :
            testCase.priority === 'Medium' ? 'bg-yellow-50 text-yellow-600' :
              'bg-gray-50 text-gray-600'
            }`}>
            {testCase.priority} {/* Show full priority name */}
          </span>
        </td>
        <td className="px-2 py-3 w-20 flex-shrink-0">
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded">
            {testCase.automationStatus === 'Automated' && <Code size={12} className="mr-1 text-blue-600" />}
            {testCase.automationStatus === 'Semi-Automated' && <Edit size={12} className="mr-1 text-purple-600" />}
            {testCase.automationStatus === 'Manual' && <FileText size={12} className="mr-1 text-gray-600" />}
            {testCase.automationStatus === 'Automated' ? 'Auto' :
              testCase.automationStatus === 'Semi-Automated' ? 'Semi' : 'Manual'}
          </span>
        </td>
        <td className="px-2 py-3 w-20 flex-shrink-0">
          <div className="text-xs text-gray-500">
            {testCase.requirementIds && testCase.requirementIds.length > 0 ? (
              <div className="flex flex-col">
                <span className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs truncate">
                  {testCase.requirementIds[0]}
                </span>
                {testCase.requirementIds.length > 1 && (
                  <span className="text-gray-400 text-xs mt-0.5">+{testCase.requirementIds.length - 1}</span>
                )}
              </div>
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </div>
        </td>
        <td className="px-2 py-3 w-20 flex-shrink-0">
          <div className="text-xs text-gray-500 truncate">
            {testCase.lastExecuted ? (
              <>
                <div>{new Date(testCase.lastExecuted).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                {testCase.lastExecutedBy && (
                  <div className="text-xs text-gray-400 truncate">
                    {testCase.lastExecutedBy.substring(0, 10)}...
                  </div>
                )}
              </>
            ) : (
              'Never'
            )}
          </div>
        </td>
        <td className="px-2 py-3 w-24 flex-shrink-0">
          <div className="text-xs text-gray-500">
            {testCase.applicableVersions?.length > 0 ? (
              <div>
                <div className="flex flex-wrap gap-1">
                  {(() => {
                    // Smart display: always show current version first if it's assigned
                    const currentVersionAssigned = testCase.applicableVersions.includes(selectedVersion);
                    const otherVersions = testCase.applicableVersions.filter(v => v !== selectedVersion);
                    let versionsToShow = [];
                    let remainingCount = 0;
                    if (currentVersionAssigned) {
                      // Show current version first, then fill remaining slot
                      versionsToShow = [selectedVersion, ...otherVersions.slice(0, 1)];
                      remainingCount = Math.max(0, testCase.applicableVersions.length - 2);
                    } else {
                      // No current version assigned, show first 2
                      versionsToShow = testCase.applicableVersions.slice(0, 2);
                      remainingCount = Math.max(0, testCase.applicableVersions.length - 2);
                    }
                    return (
                      <>
                        {versionsToShow.map(versionId => {
                          const version = versions.find(v => v.id === versionId);
                          const isCurrent = versionId === selectedVersion;
                          return (
                            <span
                              key={versionId}
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${isCurrent
                                ? 'bg-green-100 text-green-800 font-medium ring-1 ring-green-300'
                                : 'bg-blue-100 text-blue-800'
                                }`}
                            >
                              {isCurrent && '★ '}{version?.name || versionId}
                            </span>
                          );
                        })}
                        {remainingCount > 0 && (
                          <button
                            onClick={() => {
                              setModalVersions({
                                versions: testCase.applicableVersions,
                                testCaseId: testCase.id,
                                testCaseName: testCase.name
                              });
                              setShowVersionModal(true);
                            }}
                            className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded cursor-pointer hover:bg-blue-100 transition-colors font-medium"
                          >
                            +{remainingCount} more
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <span className="text-gray-400 italic text-xs">All</span>
            )}
          </div>
        </td>
        <td className="px-2 py-3 w-24 flex-shrink-0">
          <TestCaseRowActions
            testCase={testCase}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onExecute={onExecute}
            onDuplicate={onDuplicate}
          />
        </td>
      </tr>
      {/* Expanded Failure Details Row */}
      {/* Expanded Failure Details Row */}
      {isFailureExpanded && (testCase.status === 'Failed' || testCase.status === 'Not Found') && (
        <tr className={`flex w-full`}>
          <td colSpan="8" className="p-0 w-full">
            <div className={`${testCase.status === 'Failed'
              ? 'bg-gradient-to-r from-red-50 to-gray-50 border-l-4 border-red-400'
              : 'bg-gradient-to-r from-orange-50 to-gray-50 border-l-4 border-orange-400'
              }`}>
              <div className="p-6">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${testCase.status === 'Failed' ? 'bg-red-500' : 'bg-orange-500'
                      }`}></div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {testCase.status === 'Failed' ? 'Failure Details' : 'Issue Details'}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${testCase.status === 'Failed' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                      {testCase.status}
                    </span>
                  </div>
                </div>
                {/* Error Summary - Compact Horizontal */}
                <div className="mb-6">
                  <div className="bg-white rounded-lg p-4 shadow-sm border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className={`w-1 h-6 rounded mr-3 ${testCase.status === 'Failed' ? 'bg-red-500' : 'bg-orange-500'
                          }`}></div>
                        <h4 className="font-semibold text-gray-900">Error Summary</h4>
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(
                          `${(testCase.failure && testCase.failure.type) || 'Test Failure'}: ${(testCase.failure && testCase.failure.message) || 'Test execution failed'}`
                        )}
                        className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                        title="Copy error message"
                      >
                        📋 Copy
                      </button>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2 flex-wrap">
                          <div className={`font-medium ${testCase.status === 'Failed' ? 'text-red-800' : 'text-orange-800'}`}>
                            {(testCase.failure && testCase.failure.type) ||
                              (testCase.status === 'Not Found' ? 'Test result not found in artifacts' : 'Test Failure')}
                          </div>
                          {/* Assertion Type Badge - Prominently displayed */}
                          {testCase.failure?.assertionType && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-mono">
                              {testCase.failure.assertionType}
                            </span>
                          )}
                          {(() => {
                            const errorType = testCase.failure?.type || '';
                            if (errorType.includes('Timeout') || errorType.includes('timeout')) {
                              return <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">⏱️ Timing Issue</span>
                            } else if (errorType.includes('Element') || errorType.includes('element')) {
                              return <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">🎯 Element Issue</span>
                            } else if (errorType.includes('Assert') || errorType.includes('assert')) {
                              return <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">⚖️ Assertion</span>
                            } else if (errorType.includes('Connection') || errorType.includes('Network')) {
                              return <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">🌐 Network</span>
                            }
                            return null;
                          })()}
                        </div>
                        <div className={`${testCase.status === 'Failed' ? 'text-red-700' : 'text-orange-700'} break-words leading-relaxed text-sm`}>
                          {(testCase.failure && testCase.failure.message) ||
                            (testCase.status === 'Not Found' ? 'Test result not found in artifacts' : 'Test execution failed')}
                        </div>
                      </div>
                      {testCase.failure?.parsingSource && (
                        <div className="flex flex-col space-y-1">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            {testCase.failure.parsingSource}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Stack Trace - Full Width */}
                {testCase.failure?.stackTrace && (
                  <div className="mb-6">
                    <div className="bg-white rounded-lg p-4 shadow-sm border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="w-1 h-6 bg-gray-500 rounded mr-3"></div>
                          <h4 className="font-semibold text-gray-900">Stack Trace</h4>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {testCase.failure.stackTrace.split('').length} lines
                          </span>
                          <button
                            onClick={() => navigator.clipboard.writeText(testCase.failure.stackTrace)}
                            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                            title="Copy stack trace"
                          >
                            📋 Copy
                          </button>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs overflow-auto h-80 border">
                          <pre className="whitespace-pre-wrap">
                            {testCase.failure.stackTrace.split('').map((line, index) => (
                              <div
                                key={index}
                                className={`${line.includes('at ') && (line.includes('.spec.') || line.includes('.test.') || line.includes(testCase.name))
                                  ? 'bg-red-900 bg-opacity-50 text-red-300'
                                  : ''
                                  }`}
                              >
                                {line}
                              </div>
                            ))}
                          </pre>
                        </div>
                        <div className="absolute bottom-3 left-3 text-xs text-gray-400 bg-gray-800 bg-opacity-75 px-2 py-1 rounded">
                          <span className="inline-block w-3 h-3 bg-red-900 bg-opacity-50 rounded mr-1"></span>
                          Test-related frames highlighted
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Assertion Details - Full Width */}
                {testCase.failure?.assertion?.available && (
                  <div className="mb-6">
                    <div className="bg-white rounded-lg p-4 shadow-sm border">
                      <div className="flex items-center mb-3">
                        <div className="w-1 h-6 bg-purple-500 rounded mr-3"></div>
                        <h4 className="font-semibold text-gray-900">Assertion Details</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs font-medium text-green-700">Expected:</span>
                          <div className="font-mono bg-green-50 p-3 rounded mt-1 border border-green-200 break-all text-sm">
                            {testCase.failure.assertion.expected || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-red-700">Actual:</span>
                          <div className="font-mono bg-red-50 p-3 rounded mt-1 border border-red-200 break-all text-sm">
                            {testCase.failure.assertion.actual || 'N/A'}
                          </div>
                        </div>
                      </div>
                      {testCase.failure.assertion.operator && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <span className="text-sm font-medium text-gray-600">Operator:</span>
                          <span className="text-sm ml-2 font-mono">{testCase.failure.assertion.operator}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* Bottom Row - Technical Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-4 shadow-sm border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-1 h-6 bg-blue-500 rounded mr-3"></div>
                        <h4 className="font-semibold text-gray-900">Technical Details</h4>
                      </div>
                      {(testCase.failure?.location?.display || testCase.failure?.file || testCase.file) && (
                        <button
                          onClick={() => navigator.clipboard.writeText(
                            testCase.failure?.location?.display || testCase.failure?.file || testCase.file || ''
                          )}
                          className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                          title="Copy file path"
                        >
                          📂 Copy Path
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1 text-xs font-medium text-gray-600">
                          <FileText size={12} />
                          <span>{testCase.failure?.location ? 'Error Location' : 'File Location'}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="font-mono text-xs text-gray-800 break-all bg-blue-50 px-2 py-1 rounded">
                            {testCase.failure?.location
                              ? testCase.failure.location.display
                              : (testCase.failure?.file || testCase.file || 'N/A')
                            }
                          </div>
                          {testCase.failure?.location && (
                            <div className="text-xs text-red-600 font-medium">
                              ➤ Line {testCase.failure.location.line}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1 text-xs font-medium text-gray-600">
                          <Code size={12} />
                          <span>Method</span>
                        </div>
                        <div className="font-mono text-xs text-gray-800 break-all">
                          {testCase.failure?.method || testCase.method || testCase.name}
                        </div>
                        {(testCase.failure?.classname || testCase.classname) && (
                          <div className="text-xs text-gray-500 break-all">
                            Class: {testCase.failure.classname || testCase.classname}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border">
                    <div className="flex items-center mb-3">
                      <div className="w-1 h-6 bg-indigo-500 rounded mr-3"></div>
                      <h4 className="font-semibold text-gray-900">Execution Context</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Framework</span>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {testCase.execution?.framework?.name || 'Unknown'}
                          </div>
                          {testCase.execution?.framework?.version && (
                            <div className="text-xs text-gray-500">v{testCase.execution.framework.version}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Duration</span>
                        <span className="text-sm font-medium text-gray-900">
                          {testCase.duration ? `${testCase.duration}ms` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-600">Executed At</span>
                        <span className="text-sm font-medium text-gray-900">
                          {testCase.lastExecuted ? new Date(testCase.lastExecuted).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                      {testCase.execution?.parsingSource && (
                        <div className="pt-2 border-t border-gray-100">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded inline-block">
                            {testCase.execution.parsingSource}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
      {/* Expanded Row Content - IMPROVED UI/UX */}
      {isExpanded && (
        <tr className="flex w-full">
          <td colSpan="8" className="p-0 w-full">
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="p-6">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Test Case Details</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Status Badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${testCase.status === 'Passed' ? 'bg-green-100 text-green-800' :
                      testCase.status === 'Failed' ? 'bg-red-100 text-red-800' :
                        testCase.status === 'Blocked' ? 'bg-yellow-100 text-yellow-800' :
                          testCase.status === 'Not Found' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                      }`}>
                      {testCase.status}
                    </span>
                    {/* Priority Badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${testCase.priority === 'High' ? 'bg-red-100 text-red-800' :
                      testCase.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                      {testCase.priority} Priority
                    </span>
                  </div>
                </div>
                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Test Details */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    {testCase.description && (
                      <div className="bg-white rounded-lg p-4 shadow-sm border">
                        <div className="flex items-center mb-3">
                          <div className="w-1 h-6 bg-blue-500 rounded mr-3"></div>
                          <h4 className="font-semibold text-gray-900">Description</h4>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{testCase.description}</p>
                      </div>
                    )}
                    {/* Preconditions */}
                    {testCase.preconditions && (
                      <div className="bg-white rounded-lg p-4 shadow-sm border">
                        <div className="flex items-center mb-3">
                          <div className="w-1 h-6 bg-yellow-500 rounded mr-3"></div>
                          <h4 className="font-semibold text-gray-900">Preconditions</h4>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{testCase.preconditions}</p>
                      </div>
                    )}
                    {/* Test Steps */}
                    {testCase.steps && testCase.steps.length > 0 && (
                      <div className="bg-white rounded-lg p-4 shadow-sm border">
                        <div className="flex items-center mb-3">
                          <div className="w-1 h-6 bg-green-500 rounded mr-3"></div>
                          <h4 className="font-semibold text-gray-900">Test Steps</h4>
                        </div>
                        <ol className="space-y-3">
                          {testCase.steps.map((step, index) => (
                            <li key={index} className="flex items-start">
                              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center justify-center mr-3 mt-0.5">
                                {index + 1}
                              </span>
                              <span className="text-gray-700 leading-relaxed">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {/* Expected Result */}
                    {testCase.expectedResult && (
                      <div className="bg-white rounded-lg p-4 shadow-sm border">
                        <div className="flex items-center mb-3">
                          <div className="w-1 h-6 bg-purple-500 rounded mr-3"></div>
                          <h4 className="font-semibold text-gray-900">Expected Result</h4>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{testCase.expectedResult}</p>
                      </div>
                    )}
                    {/* Test Data */}
                    {testCase.testData && (
                      <div className="bg-white rounded-lg p-4 shadow-sm border">
                        <div className="flex items-center mb-3">
                          <div className="w-1 h-6 bg-indigo-500 rounded mr-3"></div>
                          <h4 className="font-semibold text-gray-900">Test Data</h4>
                        </div>
                        <div className="bg-gray-50 rounded p-3 font-mono text-sm text-gray-800">
                          {testCase.testData}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Right Column - Metadata */}
                  <div className="space-y-4">
                    {/* Quick Info Card */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border">
                      <h4 className="font-semibold text-gray-900 mb-4">Quick Info</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-600">Category</span>
                          <span className="text-sm font-medium text-gray-900">
                            {testCase.category || 'Uncategorized'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-600">Automation</span>
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                            {testCase.automationStatus === 'Automated' && <Code size={12} className="mr-1 text-blue-600" />}
                            {testCase.automationStatus === 'Semi-Automated' && <Edit size={12} className="mr-1 text-purple-600" />}
                            {testCase.automationStatus === 'Manual' && <FileText size={12} className="mr-1 text-gray-600" />}
                            {testCase.automationStatus}
                          </span>
                        </div>
                        {/* Change 1 & 6: Applicable Versions Display */}
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-600">Versions</span>
                          <span className="text-sm font-medium text-gray-900">
                            {getVersionDisplayText(testCase)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-600">Assignee</span>
                          <span className="text-sm font-medium text-gray-900">
                            {testCase.assignee || 'Unassigned'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm text-gray-600">Duration</span>
                          <span className="text-sm font-medium text-gray-900">
                            {testCase.estimatedDuration || 0} min
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Execution History */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border">
                      <h4 className="font-semibold text-gray-900 mb-4">Execution History</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${testCase.status === 'Passed' ? 'bg-green-500' :
                            testCase.status === 'Failed' ? 'bg-red-500' :
                              'bg-gray-400'
                            }`}></div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {testCase.lastExecuted ? 'Last Run' : 'Never Executed'}
                            </div>
                            {testCase.lastExecuted && (
                              <div className="text-xs text-gray-500">
                                {formatLastExecution(testCase.lastExecuted)}
                                {testCase.lastExecutedBy && (
                                  <span> by {testCase.lastExecutedBy}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {testCase.duration && (
                          <div className="text-xs text-gray-500 pl-6">
                            Runtime: {testCase.duration}ms
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Tags */}
                    {testCase.tags && testCase.tags.length > 0 && (
                      <div className="bg-white rounded-lg p-4 shadow-sm border">
                        <h4 className="font-semibold text-gray-900 mb-3">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {testCase.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Linked Requirements */}
                    {testCase.requirementIds && testCase.requirementIds.length > 0 && (
                      <div className="bg-white rounded-lg p-4 shadow-sm border">
                        <h4 className="font-semibold text-gray-900 mb-3">Linked Requirements</h4>
                        <div className="space-y-2">
                          {testCase.requirementIds.slice(0, 5).map(reqId => (
                            <div key={reqId} className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                              <span className="text-sm text-gray-700 font-mono">{reqId}</span>
                            </div>
                          ))}
                          {testCase.requirementIds.length > 5 && (
                            <div className="text-xs text-gray-500 pl-4">
                              +{testCase.requirementIds.length - 5} more requirements
                            </div>
                          )}
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
};

const TestCases = () => {
  // Get version context
  const { selectedVersion, versions } = useVersionContext();
  // State for data from DataStore
  const [testCases, setTestCases] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [mapping, setMapping] = useState({});
  const [hasTestCases, setHasTestCases] = useState(false);
  // NEW: Add state variables for test suites
  const [testSuites, setTestSuites] = useState([]);
  const [selectedSuite, setSelectedSuite] = useState(null);
  const [activeSuite, setActiveSuite] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  // Modal states
  const [showCreateSuiteModal, setShowCreateSuiteModal] = useState(false);
  const [showEditSuiteModal, setShowEditSuiteModal] = useState(false);
  const [showAddToSuiteModal, setShowAddToSuiteModal] = useState(false);
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [versionFilter, setVersionFilter] = useState('All'); // This filter is now handled by selectedVersion from context
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [selectedTestCases, setSelectedTestCases] = useState(new Set());
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [automationFilter, setAutomationFilter] = useState('All');
  const [showAllTags, setShowAllTags] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set()); // Corrected line
  // Add new state variables for tag filter
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  // Modal states - ENHANCED
  const [showViewModal, setShowViewModal] = useState(false); // NEW: View modal state
  const [viewingTestCase, setViewingTestCase] = useState(null); // NEW: Currently viewing test case
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState(null);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  // State for collapsed/expanded sections
  const [collapsedSections, setCollapsedSections] = useState(new Set()); // Corrected initialization
  // Add new state variables for failure expansion
  const [expandedTests, setExpandedTests] = useState(new Set());
  const [allExpanded, setAllExpanded] = useState(false);
  const [showVersionAssignmentModal, setShowVersionAssignmentModal] = useState(false);
  const [versionAssignmentAction, setVersionAssignmentAction] = useState(null);
  const [selectedVersionForAssignment, setSelectedVersionForAssignment] = useState('');
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [modalVersions, setModalVersions] = useState(null);
  const [showTagAssignmentModal, setShowTagAssignmentModal] = useState(false);
  const [selectedTagsForAssignment, setSelectedTagsForAssignment] = useState([]);
  const [tagAssignmentAction, setTagAssignmentAction] = useState('add');
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
  // NEW: Load test suites
  useEffect(() => {
    const loadTestSuites = async () => {
      try {
        const suites = await dataStore.getTestSuites();
        setTestSuites(suites);
      } catch (error) {
        console.error('Failed to load test suites:', error);
        setTestSuites([]);
      }
    };
    loadTestSuites();
    // Subscribe to changes
    const unsubscribe = dataStore.subscribe(() => {
      loadTestSuites();
    });
    return () => unsubscribe();
  }, []);
  // Auto-reset filters when version changes to avoid confusion
  useEffect(() => {
    // Don't reset on initial load
    if (!selectedVersion) return;
    // Get tags available in the new version
    const newVersionTestCases = selectedVersion === 'unassigned'
      ? testCases
      : testCases.filter(tc => {
        if (tc.applicableVersions) {
          if (tc.applicableVersions.length === 0) return true;
          return tc.applicableVersions.includes(selectedVersion);
        }
        return !tc.version || tc.version === selectedVersion || tc.version === '';
      });
    const tagsInNewVersion = new Set();
    newVersionTestCases.forEach(tc => {
      if (tc.tags && Array.isArray(tc.tags)) {
        tc.tags.forEach(tag => tagsInNewVersion.add(tag));
      }
    });
    // Reset selected tags that don't exist in the new version
    setSelectedTags(prev => {
      const validTags = new Set();
      prev.forEach(tag => {
        if (tagsInNewVersion.has(tag)) {
          validTags.add(tag);
        }
      });
      // If some tags were removed, also reset status filter to "All" to avoid double confusion
      if (validTags.size < prev.size) {
        console.log('🔄 Version changed: Resetting invalid filters');
        setStatusFilter('All');
        setSearchQuery(''); // Optional: also reset search
      }
      return validTags;
    });
    // Optional: Reset other filters too
    // setStatusFilter('All');
    // setPriorityFilter('All');
    // setAutomationFilter('All');
  }, [selectedVersion, testCases]); // Triggers when version changes
  // NEW: Get linked requirements for the currently viewing test case
  const linkedRequirements = useMemo(() => {
    if (!viewingTestCase || !viewingTestCase.requirementIds?.length) return [];
    const requirements = dataStore.getRequirements();
    return requirements.filter(req =>
      viewingTestCase.requirementIds.includes(req.id)
    );
  }, [viewingTestCase]);
  // Toggle individual test expansion for failures
  const toggleTestExpansion = (testId) => {
    setExpandedTests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(testId)) {
        newSet.delete(testId);
      } else {
        newSet.add(testId);
      }
      return newSet;
    });
  };
  // Expand/Collapse All failures
  const toggleExpandAll = () => {
    if (allExpanded) {
      // Collapse all
      setExpandedTests(new Set());
      setAllExpanded(false);
    } else {
      // Expand all failed/error tests
      const failedTests = filteredTestCases
        .filter(tc => tc.status === 'Failed' || tc.status === 'Not Found')
        .map(tc => tc.id);
      setExpandedTests(new Set(failedTests));
      setAllExpanded(true);
    }
  };
  // Filter test cases by selected version (from context)
  const versionFilteredTestCases = useMemo(() => {
    if (selectedVersion === 'unassigned') {
      return testCases;
    }
    // Change 2: Update Test Case Filtering Logic
    return testCases.filter(tc => {
      // Handle new format
      if (tc.applicableVersions) {
        // Empty array means applies to all versions
        if (tc.applicableVersions.length === 0) return true;
        return tc.applicableVersions.includes(selectedVersion);
      }
      // Handle legacy format during transition
      return !tc.version || tc.version === selectedVersion || tc.version === '';
    });
  }, [testCases, selectedVersion]);
  // NEW: Filter logic including suite filtering
  const filteredTestCases = useMemo(() => {
    console.log('🔍 Filtering Debug:', {
      versionFilteredCount: versionFilteredTestCases.length,
      selectedVersion,
      selectedTags: Array.from(selectedTags),
      sampleTestCaseTags: versionFilteredTestCases.slice(0, 3).map(tc => ({ id: tc.id, tags: tc.tags }))
    });

    let filtered = versionFilteredTestCases;

    // Search filter
    filtered = filtered.filter(testCase => {
      const matchesSearch = !searchQuery ||
        testCase.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        testCase.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });

    // Status filter
    filtered = filtered.filter(testCase => statusFilter === 'All' || testCase.status === statusFilter);

    // Priority filter
    filtered = filtered.filter(testCase => priorityFilter === 'All' || testCase.priority === priorityFilter);

    // Automation filter
    filtered = filtered.filter(testCase => automationFilter === 'All' || testCase.automationStatus === automationFilter);

    // Tag filter
    filtered = filtered.filter(testCase => {
      const matchesTags = selectedTags.size === 0 ||
        (testCase.tags && Array.isArray(testCase.tags) &&
          Array.from(selectedTags).some(tag => testCase.tags.includes(tag)));
      return matchesTags;
    });

    // ✅ ADD THIS: Suite filter (Step 2.6)
    if (activeSuite) {
      const memberIds = activeSuite.members?.map(m => m.id) || [];
      filtered = filtered.filter(tc => memberIds.includes(tc.id));
    }

    // Debug specific test case if it has the Sample tag
    filtered.forEach(testCase => {
      if (testCase.tags && testCase.tags.includes('Sample')) {
        console.log('🏷️ Sample tag test case after filtering:', {
          id: testCase.id,
          tags: testCase.tags,
          selectedTags: Array.from(selectedTags)
        });
      }
    });

    return filtered;
  }, [
    versionFilteredTestCases,
    searchQuery,
    statusFilter,
    priorityFilter,
    automationFilter,
    selectedTags,
    activeSuite // ✅ ADD THIS DEPENDENCY
  ]);
  // NEW: Get all unique categories
  const allCategories = useMemo(() => {
    return getAllCategories(testCases);
  }, [testCases]);
  // NEW: Get all unique tags
  const allTags = useMemo(() => {
    return getAllTags(testCases);
  }, [testCases]);
  // NEW: Get linked requirements for a test case
  const getLinkedRequirementsForTestCase = (testCaseId) => {
    return getLinkedRequirements(testCaseId, mapping, requirements);
  };
  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    // Base counts from version-filtered test cases (before other filters)
    const totalBase = versionFilteredTestCases.length;
    const passedBase = versionFilteredTestCases.filter(tc => tc.status === 'Passed').length;
    const failedBase = versionFilteredTestCases.filter(tc => tc.status === 'Failed').length;
    const notRunBase = versionFilteredTestCases.filter(tc => tc.status === 'Not Run').length;
    const blockedBase = versionFilteredTestCases.filter(tc => tc.status === 'Blocked').length;
    const notFoundBase = versionFilteredTestCases.filter(tc => tc.status === 'Not Found').length;
    const automatedBase = versionFilteredTestCases.filter(tc => tc.automationStatus === 'Automated').length;
    const linkedBase = versionFilteredTestCases.filter(tc => tc.requirementIds && tc.requirementIds.length > 0).length;
    // Current filtered counts (for display in metrics cards)
    const total = filteredTestCases.length;
    const passed = filteredTestCases.filter(tc => tc.status === 'Passed').length;
    const failed = filteredTestCases.filter(tc => tc.status === 'Failed').length;
    const notRun = filteredTestCases.filter(tc => tc.status === 'Not Run').length;
    const blocked = filteredTestCases.filter(tc => tc.status === 'Blocked').length;
    const notFound = filteredTestCases.filter(tc => tc.status === 'Not Found').length;
    const automated = filteredTestCases.filter(tc => tc.automationStatus === 'Automated').length;
    const linked = filteredTestCases.filter(tc => tc.requirementIds && tc.requirementIds.length > 0).length;
    return {
      // Current filtered counts (for metrics cards)
      total,
      passed,
      failed,
      notRun,
      blocked,
      notFound,
      automated,
      linked,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      automationRate: total > 0 ? Math.round((automated / total) * 100) : 0,
      linkageRate: total > 0 ? Math.round((linked / total) * 100) : 0,
      // Base counts (for status filter buttons)
      totalBase,
      passedBase,
      failedBase,
      notRunBase,
      blockedBase,
      notFoundBase,
      automatedBase,
      linkedBase
    };
  }, [filteredTestCases, versionFilteredTestCases]);
  // NEW: Handle suite selection
  const handleSuiteClick = async (suite) => {
    try {
      const fullSuite = await dataStore.getTestSuite(suite.id);
      const members = await dataStore.getTestSuiteMembers(suite.id);
      setActiveSuite({ ...fullSuite, members });
      setSelectedTestCases(new Set());
    } catch (error) {
      console.error('Failed to load suite:', error);
    }
  };
  // NEW: Handle create suite
  const handleCreateSuite = () => {
    setShowCreateSuiteModal(true);
  };
  // NEW: Handle add test case
  const handleAddTestCase = () => {
    handleNewTestCase(); // Use existing function
  };
  // NEW: Handle clear suite filter
  const handleClearSuiteFilter = () => {
    setActiveSuite(null);
  };
  // NEW: Handle delete suite
  const handleDeleteSuite = async (suiteId) => {
    if (!confirm('Are you sure you want to delete this suite?')) return;
    try {
      await dataStore.deleteTestSuite(suiteId);
      if (activeSuite?.id === suiteId) {
        setActiveSuite(null);
      }
    } catch (error) {
      console.error('Failed to delete suite:', error);
      alert('Failed to delete suite');
    }
  };
  // Handle test case selection
  const handleTestCaseSelection = (testCaseId, checked) => {
    setSelectedTestCases(prev => {
      const newSelection = new Set(prev);
      if (checked) {
        newSelection.add(testCaseId);
      } else {
        newSelection.delete(testCaseId);
      }
      return newSelection;
    });
  };
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedTestCases(new Set(filteredTestCases.map(tc => tc.id)));
    } else {
      setSelectedTestCases(new Set());
    }
  };
  // Handle select/deselect all in a specific category
  const handleSelectAllInCategory = (category, checked) => {
    setSelectedTestCases(prev => {
      const newSelection = new Set(prev);
      const testsInCategory = groupedTestCases[category];
      if (testsInCategory) {
        testsInCategory.forEach(tc => {
          if (checked) {
            newSelection.add(tc.id);
          } else {
            newSelection.delete(tc.id);
          }
        });
      }
      return newSelection;
    });
  };
  // Clear selection function
  const handleClearSelection = () => {
    setSelectedTestCases(new Set());
  };
  const selectedAutomatedTestCases = useMemo(() => {
    return Array.from(selectedTestCases)
      .map(id => filteredTestCases.find(tc => tc.id === id))
      .filter(tc => tc && (tc.automationStatus === 'Automated' || tc.automationStatus === 'Semi-Automated'));
  }, [selectedTestCases, filteredTestCases]);
  // Execute selected test cases
  const executeSelectedTests = () => {
    if (selectedAutomatedTestCases.length === 0) {
      alert('No automated test cases selected. Only automated and semi-automated tests can be executed.');
      return;
    }
    setShowExecutionModal(true);
  };
  // Toggle row expansion
  const toggleRowExpansion = (testCaseId) => {
    setExpandedRows(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(testCaseId)) {
        newExpanded.delete(testCaseId);
      } else {
        newExpanded.add(testCaseId);
      }
      return newExpanded;
    });
  };
  // NEW: Handle view test case - ENHANCED VERSION
  const handleViewTestCase = (testCase) => {
    setViewingTestCase(testCase);
    setShowViewModal(true);
  };
  // Handle new test case creation
  const handleNewTestCase = () => {
    setEditingTestCase({
      id: '',
      name: '',
      description: '',
      category: '',
      preconditions: '',
      testData: '',
      status: 'Not Run',
      automationStatus: 'Manual',
      priority: 'Medium',
      requirementIds: [],
      applicableVersions: selectedVersion !== 'unassigned' ? [selectedVersion] : [], // Initialize with applicableVersions
      tags: [],
      assignee: ''
    });
    setShowEditModal(true);
  };
  // Handle test case editing (can be called from view modal)
  const handleEditTestCase = (testCase) => {
    setEditingTestCase({ ...testCase });
    setShowEditModal(true);
    setShowViewModal(false); // Close view modal when editing
  };
  // Handle execute test case
  const handleExecuteTestCase = (testCase) => {
    setSelectedTestCases(new Set([testCase.id]));
    setShowExecutionModal(true);
    setShowViewModal(false); // Close view modal when executing
  };
  // Handle duplicate test case - NEW
  // Handle duplicate test case
  const handleDuplicateTestCase = (testCase) => {
    const duplicatedTestCase = {
      ...testCase,
      id: `${testCase.id}_copy_${Date.now()}`,
      name: `${testCase.name} (Copy)`,
      status: 'Not Run',
      lastExecuted: '',
      executedBy: ''
    };
    setEditingTestCase(duplicatedTestCase);
    setShowEditModal(true);
    setShowViewModal(false); // Close view modal when duplicating
  };
  // Save test case (create or update)
  const handleSaveTestCase = async (testCaseData) => {
    try {
      if (testCaseData.id && testCases.find(tc => tc.id === testCaseData.id)) {
        // Update existing
        console.log('Updating test case:', testCaseData.id);
        await dataStore.updateTestCase(testCaseData.id, testCaseData);
        console.log('✅ Test case updated successfully');
      } else {
        // Create new
        const newTestCase = {
          ...testCaseData,
          id: testCaseData.id || `TC-${Date.now()}`
        };
        console.log('Creating new test case:', newTestCase.id);
        await dataStore.addTestCase(newTestCase);
        console.log('✅ Test case created successfully');
      }
      setShowEditModal(false);
      setEditingTestCase(null);
    } catch (error) {
      console.error('❌ Error saving test case:', error);
      alert('Error saving test case: ' + error.message);
    }
  };
  // Delete test case
  const handleDeleteTestCase = async (testCaseId) => {
    if (window.confirm('Are you sure you want to delete this test case?')) {
      try {
        console.log('Deleting test case:', testCaseId);
        // Delete from database (this will also update localStorage)
        await dataStore.deleteTestCase(testCaseId);
        // Clear from selection if selected
        setSelectedTestCases(prev => {
          const newSet = new Set(prev);
          newSet.delete(testCaseId);
          return newSet;
        });
        // Close view modal if currently viewing deleted test case
        setShowViewModal(false);
        console.log('✅ Test case deleted successfully');
      } catch (error) {
        console.error('❌ Error deleting test case:', error);
        alert('Error deleting test case: ' + error.message);
      }
    }
  };
  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedTestCases.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedTestCases.size} test case(s)?`)) {
      try {
        console.log(`Deleting ${selectedTestCases.size} test cases...`);
        // Delete each test case (this will update database and localStorage)
        for (const testCaseId of selectedTestCases) {
          await dataStore.deleteTestCase(testCaseId);
        }
        // Clear selection
        setSelectedTestCases(new Set());
        console.log(`✅ ${selectedTestCases.size} test cases deleted successfully`);
      } catch (error) {
        console.error('❌ Error deleting test cases:', error);
        alert('Error deleting test cases: ' + error.message);
      }
    }
  };
  // Bulk version assignment handler
  const handleBulkVersionAssignment = (versionId, action) => {
    if (selectedTestCases.size === 0) return;
    console.log('Bulk version assignment:', { versionId, action, selectedCount: selectedTestCases.size });
    setSelectedVersionForAssignment(versionId);
    setVersionAssignmentAction(action);
    setShowVersionAssignmentModal(true);
  };
  /**
   * NEW: Bulk tag assignment handler
   */
  const handleBulkTagAssignment = (tags, action) => {
    if (selectedTestCases.size === 0) return;
    console.log('Bulk tag assignment:', { tags, action, selectedCount: selectedTestCases.size });
    // Validate the operation before showing modal
    const testCaseIds = Array.from(selectedTestCases);
    const validation = dataStore.validateTagOperation(testCaseIds, tags, action);
    if (!validation.valid) {
      alert('Cannot proceed with tag operation:' + validation.errors.join(''));
      return;
    }
    // Show warnings if any
    if (validation.warnings.length > 0) {
      const proceed = confirm(
        `Tag operation warnings:
${validation.warnings.join('')}
Do you want to continue?`
      );
      if (!proceed) return;
    }
    setSelectedTagsForAssignment(tags);
    setTagAssignmentAction(action);
    setShowTagAssignmentModal(true);
  };
  /**
   * NEW: Confirm tag assignment
   */
  const confirmTagAssignment = async () => {
    try {
      const testCaseIds = Array.from(selectedTestCases);
      console.log('Confirming tag assignment:', {
        testCaseIds: testCaseIds.length,
        tags: selectedTagsForAssignment,
        action: tagAssignmentAction
      });
      const result = await dataStore.updateTestCaseTags(
        testCaseIds,
        selectedTagsForAssignment,
        tagAssignmentAction
      );
      // Clear selection and close modal
      setSelectedTestCases(new Set());
      setShowTagAssignmentModal(false);
      // Show detailed success message
      const actionText = tagAssignmentAction === 'add' ? 'added to' : 'removed from';
      const tagText = selectedTagsForAssignment.length === 1
        ? `"${selectedTagsForAssignment[0]}"`
        : `${selectedTagsForAssignment.length} tags`;
      if (result.successful.length > 0) {
        let message = `✅ ${tagText} ${actionText} ${result.successful.length} test case${result.successful.length !== 1 ? 's' : ''} `;
        // Add details for partial operations
        const details = [];
        if (result.skipped.length > 0) {
          details.push(`${result.skipped.length} skipped(no changes needed)`);
        }
        if (result.failed.length > 0) {
          details.push(`${result.failed.length} failed`);
        }
        if (details.length > 0) {
          message += `
      Details: ${details.join(', ')} `;
        }
        alert(message);
      } else {
        alert(`ℹ️ No changes were made.${result.skipped.length + result.failed.length} test cases were not modified.`);
      }
    } catch (error) {
      console.error('Tag assignment failed:', error);
      alert('❌ Tag assignment failed: ' + error.message);
      // Don't clear the modal so user can retry
      setShowTagAssignmentModal(false);
    }
  };
  /**
   * NEW: Enhanced export functionality
   */
  const handleExportSelected = () => {
    if (selectedTestCases.size === 0) return;
    const selectedIds = Array.from(selectedTestCases);
    const selectedTestCaseObjects = testCases.filter(tc => selectedIds.includes(tc.id));
    // Create export data with enhanced information
    const exportData = selectedTestCaseObjects.map(tc => ({
      id: tc.id,
      name: tc.name,
      description: tc.description,
      category: tc.category,
      status: tc.status,
      priority: tc.priority,
      automationStatus: tc.automationStatus,
      tags: tc.tags?.join(', ') || '',
      applicableVersions: tc.applicableVersions?.join(', ') || tc.version || '',
      requirementIds: tc.requirementIds?.join(', ') || '',
      assignee: tc.assignee || '',
      estimatedDuration: tc.estimatedDuration || '',
      lastExecuted: tc.lastExecuted || 'Never'
    }));
    // Convert to CSV
    const csvContent = convertToCSV(exportData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `test - cases -export -${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    // Clear selection after export
    setSelectedTestCases(new Set());
    alert(`✅ Exported ${selectedTestCaseObjects.length} test cases to CSV file.`);
  };
  /**
 * Converts an array of objects into a CSV (Comma Separated Values) string.
 *
 * @param {Array<Object>} data An array of objects to convert. Assumes all objects
 * have the same keys.
 * @returns {string} A string formatted as a CSV.
 */
  const convertToCSV = (data) => {
    // 1. Handle empty data
    if (!data || data.length === 0) {
      return "";
    }

    // 2. Get headers from the first object
    const headers = Object.keys(data[0]);

    // 3. Create an array to hold all rows, starting with the header row
    const csvRows = [
      headers.join(','), // Join header titles with a comma
    ];

    // 4. Process each data row
    data.forEach(row => {
      const values = headers.map(header => {
        // Get the value, default to empty string if null/undefined
        const value = row[header]?.toString() || '';

        // Escape all double-quotes (") by replacing them with two double-quotes ("")
        const escapedValue = value.replace(/"/g, '""');

        // Check if the value contains characters that require quoting
        const needsQuotes = value.includes(',') || value.includes('"') || value.includes('\n');

        // Wrap in quotes if needed, otherwise just use the (escaped) value
        return needsQuotes ? `"${escapedValue}"` : escapedValue;
      });

      // Add the newly formatted row string to our array
      csvRows.push(values.join(','));
    });

    // 5. Join all rows (header + data) with a newline character
    return csvRows.join('\n');
  };


  /**
   * NEW: Tag Assignment Confirmation Modal Component
   * Add this component inside your TestCases component (before the return statement)
   */
  const TagAssignmentModal = () => {
    if (!showTagAssignmentModal) return null;
    const actionText = tagAssignmentAction === 'add' ? 'add' : 'remove';
    const prepositionText = tagAssignmentAction === 'add' ? 'to' : 'from';
    const colorClass = tagAssignmentAction === 'add' ? 'text-green-600' : 'text-red-600';
    const bgColorClass = tagAssignmentAction === 'add' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Hash className={`mr-2 ${colorClass}`} size={20} />
            Confirm Tag {tagAssignmentAction === 'add' ? 'Addition' : 'Removal'}
          </h3>
          <div className={`p-4 rounded-lg ${bgColorClass} mb-4`}>
            <p className="text-sm mb-3">
              You are about to <strong className={colorClass}>{actionText}</strong> the following tag{selectedTagsForAssignment.length !== 1 ? 's' : ''}{' '}
              <strong className={colorClass}>{prepositionText}</strong> {selectedTestCases.size} selected test case{selectedTestCases.size !== 1 ? 's' : ''}:
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedTagsForAssignment.map(tag => (
                <span
                  key={tag}
                  className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${tagAssignmentAction === 'add'
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                    }`}
                >
                  <Tag size={14} className="mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="text-sm text-gray-600 mb-6 p-3 bg-gray-50 rounded">
            <strong>Selected test cases ({selectedTestCases.size}):</strong>
            <div className="mt-1 text-xs">
              {Array.from(selectedTestCases).slice(0, 5).map(id => {
                const tc = testCases.find(t => t.id === id);
                return tc?.name || id;
              }).join(', ')}
              {selectedTestCases.size > 5 && ` and ${selectedTestCases.size - 5} more...`}
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={confirmTagAssignment}
              className={`flex-1 py-2 px-4 rounded font-medium transition-colors flex items-center justify-center ${tagAssignmentAction === 'add'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-red-600 text-white hover:bg-red-700'
                }`}
            >
              {tagAssignmentAction === 'add' ? (
                <Plus size={16} className="mr-2" />
              ) : (
                <Minus size={16} className="mr-2" />
              )}
              Confirm {tagAssignmentAction === 'add' ? 'Addition' : 'Removal'}
            </button>
            <button
              onClick={() => setShowTagAssignmentModal(false)}
              className="flex-1 py-2 px-4 border border-gray-300 rounded font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              <X size={16} className="mr-2" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };
  const confirmVersionAssignment = async () => {
    try {
      const testCaseIds = Array.from(selectedTestCases);
      await dataStore.updateTestCaseVersions(
        testCaseIds,
        selectedVersionForAssignment,
        versionAssignmentAction
      );
      // Clear selection and close modal
      setSelectedTestCases(new Set());
      setShowVersionAssignmentModal(false);
      // Show success message
      const versionName = versions.find(v => v.id === selectedVersionForAssignment)?.name;
      const actionText = versionAssignmentAction === 'add' ? 'added to' : 'removed from';
      alert(`${testCaseIds.length} test cases ${actionText} ${versionName}`);
    } catch (error) {
      console.error('Version assignment failed:', error);
      alert('Version assignment failed: ' + error.message);
    }
  };
  // Handle tag selection
  // Find your handleTagToggle function and update it:
  const handleTagToggle = (tag) => {
    setSelectedTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
        // Auto-reset status filter when selecting a tag to avoid confusion
        setStatusFilter('All');
      }
      return newSet;
    });
  };
  // Clear all selected tags
  const handleClearTags = () => {
    setSelectedTags(new Set());
  };
  // Group test cases by category
  const groupedTestCases = useMemo(() => {
    const groups = {};
    filteredTestCases.forEach(tc => {
      const category = tc.category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(tc);
    });
    // Sort categories alphabetically
    return Object.keys(groups).sort().reduce((sorted, key) => {
      sorted[key] = groups[key];
      return sorted;
    }, {});
  }, [filteredTestCases]);
  // Toggle category section collapse
  const toggleSection = (category) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };
  // Generate category statistics
  const getCategoryStats = (testCases) => {
    const total = testCases.length;
    const passed = testCases.filter(tc => tc.status === 'Passed').length;
    const failed = testCases.filter(tc => tc.status === 'Failed').length;
    const automated = testCases.filter(tc => tc.automationStatus === 'Automated').length;
    return { total, passed, failed, automated, passRate: total > 0 ? Math.round((passed / total) * 100) : 0 };
  };
  // Available versions for the Edit Test Case Modal's multi-select
  const availableVersions = useMemo(() => {
    return versions.map(v => ({ id: v.id, name: v.name }));
  }, [versions]);
  // Handle version toggle in Edit Test Case Modal (for applicableVersions)
  const handleVersionToggle = (testCaseId, versionId, isChecked) => {
    setEditingTestCase(prev => {
      if (!prev) return null;
      const currentApplicableVersions = Array.isArray(prev.applicableVersions)
        ? [...prev.applicableVersions]
        : (prev.version ? [prev.version] : []); // Handle legacy during editing
      let newApplicableVersions;
      if (isChecked) {
        newApplicableVersions = [...new Set([...currentApplicableVersions, versionId])];
      } else {
        newApplicableVersions = currentApplicableVersions.filter(v => v !== versionId);
      }
      return {
        ...prev,
        applicableVersions: newApplicableVersions,
        // Ensure 'version' field is removed if 'applicableVersions' is being used
        ...(prev.hasOwnProperty('version') && { version: undefined })
      };
    });
  };
  // NEW: Right sidebar content logic with multiple states
  // Right sidebar content logic (Step 2.8)
  const rightSidebarContent = useMemo(() => {
    // State 1: Browse Mode
    if (selectedTestCases.size === 0 && !selectedSuite && !activeSuite) {
      return (
        <TestCasesBrowseSidebar
          testSuites={testSuites}
          onSuiteClick={handleSuiteClick}
          onCreateSuite={handleCreateSuite}
          onAddTestCase={handleAddTestCase}
          categoryFilter={categoryFilter}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          automationFilter={automationFilter}
          selectedTagsFilter={Array.from(selectedTags)}
          allCategories={getAllCategories(testCases)}
          allTags={getAllTags(testCases)}
          onCategoryChange={setCategoryFilter}
          onStatusChange={setStatusFilter}
          onPriorityChange={setPriorityFilter}
          onAutomationChange={setAutomationFilter}
          onTagsChange={(tags) => setSelectedTags(new Set(tags))}
          onClearAllFilters={() => {
            setCategoryFilter('All');
            setStatusFilter('All');
            setPriorityFilter('All');
            setAutomationFilter('All');
            setSelectedTags(new Set());
          }}
          stats={{
            total: versionFilteredTestCases.length,
            filtered: filteredTestCases.length,
            automated: filteredTestCases.filter(tc => tc.automationStatus === 'Automated').length,
            manual: filteredTestCases.filter(tc => tc.automationStatus === 'Manual').length,
            passed: filteredTestCases.filter(tc => tc.status === 'Passed').length,
            failed: filteredTestCases.filter(tc => tc.status === 'Failed').length
          }}
        />
      );
    }

    // State 2: Suite View (placeholder)
    // State 2: Suite View - Show suite details sidebar
    if (activeSuite && selectedTestCases.size === 0) {
      return (
        <TestCasesSuiteSidebar
          suite={activeSuite}
          onEditSuite={() => {
            setSelectedSuite(activeSuite);
            setShowEditSuiteModal(true);
          }}
          onDeleteSuite={() => handleDeleteSuite(activeSuite.id)}
          onClose={handleClearSuiteFilter}
          onAddTests={() => {
            setSelectedSuite(activeSuite);
            setShowAddToSuiteModal(true);
          }}
        />
      );
    }

    // State 3: Bulk Actions (existing)
    if (selectedTestCases.size > 1) {
      return (
        <BulkActionsPanel
          selectedCount={selectedTestCases.size}
          selectedItems={testCases.filter(tc => selectedTestCases.has(tc.id))}
          itemType="test case"
          showExecuteButton={true}
          availableVersions={versions}
          availableTags={getAllTags(testCases)}
          onVersionAssign={handleBulkVersionAssignment}
          onTagsUpdate={handleBulkTagAssignment}
          onBulkDelete={handleBulkDelete}
          onClearSelection={() => setSelectedTestCases(new Set())}
          onExecuteTests={executeSelectedTests}
          onExport={handleExportSelected}
        />
      );
    }

    // State 4: Single Selection (placeholder)
    // State 4: Single Selection - Show test case details sidebar
    if (selectedTestCases.size === 1) {
      const selectedId = Array.from(selectedTestCases)[0];
      const selectedTestCase = testCases.find(tc => tc.id === selectedId);

      if (!selectedTestCase) {
        return null;
      }

      return (
        <TestCaseDetailsSidebar
          testCase={selectedTestCase}
          onEdit={() => handleEditTestCase(selectedTestCase)}
          onDelete={() => {
            handleDeleteTestCase(selectedTestCase.id);
            setSelectedTestCases(new Set());
          }}
          onClose={() => setSelectedTestCases(new Set())}
          linkedRequirements={getLinkedRequirementsForTestCase(selectedTestCase.id)}
        />
      );
    }

    return null;
  }, [
    selectedTestCases,
    selectedSuite,
    activeSuite,
    testSuites,
    testCases,
    categoryFilter,
    statusFilter,
    priorityFilter,
    automationFilter,
    selectedTags,
    filteredTestCases,
    versionFilteredTestCases,
    versions,
    handleBulkVersionAssignment,
    handleBulkTagAssignment,
    handleBulkDelete,
    executeSelectedTests,
    handleExportSelected,
    handleClearSuiteFilter
  ]);
  const selectedTestCasesArray = Array.from(selectedTestCases)
    .map(id => filteredTestCases.find(tc => tc.id === id))
    .filter(Boolean);
  const hasAutomatedTests = selectedTestCasesArray.some(
    tc => tc.automationStatus === 'Automated' || tc.automationStatus === 'Semi-Automated'
  );
  if (!hasTestCases) {
    return (
      <MainLayout title="Test Cases" hasData={false}>
        <EmptyState
          title="No Test Cases Found"
          message="Get started by importing your test cases to begin tracking your test coverage."
          actionText="Create Test Cases"
          actionPath="/import#testcases-tab"  // Navigate to import page with test cases tab selected
          icon="tests"  // Use the tests icon
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
      rightSidebar={rightSidebarContent}>
      <div className="space-y-6">
        {/* Version indicator for unassigned view */}
        {selectedVersion === 'unassigned' && (
          <div className="mb-4 bg-blue-50 p-3 rounded border border-blue-100">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Showing All Items (Unassigned View)</h3>
            <p className="text-xs text-blue-700 mt-1">
              This view shows all test cases, including those that may be assigned to versions that haven't been created yet.
            </p>
          </div>
        )}
        {/* NEW: Suite Filter Banner */}
        {/* Suite Filter Banner */}
        {activeSuite && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FolderOpen size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Viewing Suite: {activeSuite.name}
                </span>
                <span className="text-xs text-blue-600">
                  ({activeSuite.members?.length || 0} tests)
                </span>
              </div>
              <button
                onClick={handleClearSuiteFilter}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
              >
                <X size={14} className="mr-1" />
                Clear Filter
              </button>
            </div>
          </div>
        )}
        {/* Header */}
        {/* Compact Header - Matching Requirements Design */}
        {/* Unified Filter Card — Merged from Quick + Advanced */}
        <div className="bg-white rounded-lg shadow mb-4">
          {/* Header Row: Title, Version, Metrics, Add Button */}
          <div className="flex justify-between items-center px-4 py-3 border-b">
            <div className="flex items-center space-x-6">
              {/* Title & Version */}
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">Test Cases</h1>
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
                  <span className="text-lg font-bold text-gray-900">{summaryStats.total}</span>
                  <span className="text-xs text-gray-500">Total</span>
                </div>
                <div className="flex items-center space-x-1.5 px-4">
                  <span className="text-lg font-bold text-red-600">{summaryStats.failed}</span>
                  <span className="text-xs text-gray-500">Failed</span>
                </div>
                <div className="flex items-center space-x-1.5 px-4">
                  <span className="text-lg font-bold text-blue-600">{summaryStats.automated}</span>
                  <span className="text-xs text-gray-500">Automated</span>
                </div>
                <div className="flex items-center space-x-1.5 px-4">
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
          {/* Status Filter Tabs */}
          <div className="px-4 py-2 bg-gray-50 border-b flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={() => setStatusFilter('All')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${statusFilter === 'All'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
              >
                📊 All ({summaryStats.totalBase})
              </button>
              <button
                onClick={() => setStatusFilter('Failed')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${statusFilter === 'Failed'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
              >
                🔴 Failed ({summaryStats.failedBase})
              </button>
              <button
                onClick={() => setStatusFilter('Passed')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${statusFilter === 'Passed'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
              >
                ✅ Passed ({summaryStats.passedBase})
              </button>
              <button
                onClick={() => setStatusFilter('Not Run')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${statusFilter === 'Not Run'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
              >
                ⏸️ Not Run ({summaryStats.notRunBase})
              </button>
              {summaryStats.notFoundBase > 0 && (
                <button
                  onClick={() => setStatusFilter('Not Found')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${statusFilter === 'Not Found'
                    ? 'bg-blue-600 text-white font-medium'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                >
                  ⚠️ Issues ({summaryStats.notFoundBase})
                </button>
              )}
            </div>
            {/* Quick Search */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search test cases..."
                className="px-3 py-1.5 text-sm border rounded-md w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          {/* Mobile Metrics */}
          <div className="lg:hidden px-4 py-3 border-t bg-gray-50">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-lg font-bold text-gray-900">{summaryStats.total}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-600">{summaryStats.failed}</div>
                <div className="text-xs text-gray-600">Failed</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">{summaryStats.automated}</div>
                <div className="text-xs text-gray-600">Auto</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">{summaryStats.notRun}</div>
                <div className="text-xs text-gray-600">Not Run</div>
              </div>
            </div>
          </div>
          {/* Advanced Filters - Collapsible Section */}
          <div className="border-t">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Filter size={16} className="text-gray-600" />
                <span className="font-medium text-gray-700">Advanced Filters</span>
                {(priorityFilter !== 'All' || automationFilter !== 'All' || selectedTags.size > 0) && (
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
            {showAdvancedFilters && (
              <div className="px-4 py-4 bg-gray-50">
                <div className="space-y-4">
                  {/* Priority & Automation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="All">All Priorities</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Automation</label>
                      <select
                        value={automationFilter}
                        onChange={(e) => setAutomationFilter(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="All">All</option>
                        <option value="Automated">Automated</option>
                        <option value="Manual">Manual</option>
                      </select>
                    </div>
                  </div>
                  {/* Tags */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const allTags = [...new Set(
                          versionFilteredTestCases.flatMap(tc => tc.tags || []).filter(Boolean)
                        )].sort();
                        const tagsToShow = showAllTags ? allTags : allTags.slice(0, 10);
                        return (
                          <>
                            {tagsToShow.map(tag => {
                              const count = versionFilteredTestCases.filter(tc => tc.tags?.includes(tag)).length;
                              return (
                                <button
                                  key={tag}
                                  onClick={() => handleTagToggle(tag)}
                                  className={`px-3 py-1.5 text-sm rounded-md ${selectedTags.has(tag)
                                    ? 'bg-blue-600 text-white font-medium'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                                    }`}
                                >
                                  {tag} ({count})
                                </button>
                              );
                            })}
                            {allTags.length > 10 && (
                              <button
                                onClick={() => setShowAllTags(!showAllTags)}
                                className="px-3 py-1.5 text-sm text-blue-600 font-medium"
                              >
                                {showAllTags ? 'Show Less' : `+${allTags.length - 10} more`}
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  {/* Clear Filters */}
                  {(priorityFilter !== 'All' || automationFilter !== 'All' || selectedTags.size > 0) && (
                    <div className="pt-4 border-t flex justify-end">
                      <button
                        onClick={() => {
                          setPriorityFilter('All');
                          setAutomationFilter('All');
                          setSelectedTags(new Set());
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

        {/* Suite Filter Banner (Step 2.9) */}
        {activeSuite && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FolderOpen size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Viewing Suite: {activeSuite.name}
                </span>
                <span className="text-xs text-blue-600">
                  ({activeSuite.members?.length || 0} tests)
                </span>
              </div>
              <button
                onClick={handleClearSuiteFilter}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
              >
                <X size={14} className="mr-1" />
                Clear Filter
              </button>
            </div>
          </div>
        )}
        {/* Bulk Actions */}
        {/* Enhanced Bulk Actions with Version Assignment */}
        {selectedTestCases.size > 0 && (
          <BulkActionsPanel
            selectedCount={selectedTestCases.size}
            automatedCount={selectedAutomatedTestCases.length}  // ✅ ADD THIS LINE
            availableVersions={availableVersions}
            availableTags={allTags}
            itemType="test case"
            showExecuteButton={selectedAutomatedTestCases.length > 0}
            showExportButton={true}
            onVersionAssign={handleBulkVersionAssignment}
            onTagsUpdate={handleBulkTagAssignment}
            onExecuteTests={executeSelectedTests}
            onBulkDelete={handleBulkDelete}
            onClearSelection={handleClearSelection}
            onExport={handleExportSelected}
          />
        )}
        {/* Test Cases Table - Grouped by Category */}
        <div className="space-y-4">
          {Object.entries(groupedTestCases).map(([category, categoryTests]) => {
            const isCollapsed = collapsedSections.has(category);
            const stats = getCategoryStats(categoryTests);
            return (
              <div key={category} className="bg-white rounded-lg shadow">
                {/* Category Header */}
                <div
                  className="flex items-center justify-between p-4 border-b cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleSection(category)}
                >
                  <div className="flex items-center space-x-3">
                    <ChevronRight
                      className={`transform transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                      size={16}
                    />
                    <h3 className="text-lg font-medium text-gray-900">{category}</h3>
                    <span className="text-sm text-gray-500">({stats.total} tests)</span>
                  </div>
                  {/* Category Stats */}
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-green-600">{stats.passed} passed</span>
                    <span className="text-red-600">{stats.failed} failed</span>
                    <span className="text-blue-600">{stats.automated} automated</span>
                    <span className="font-medium">{stats.passRate}% pass rate</span>
                  </div>
                </div>
                {/* Category Tests */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr className="flex w-full">
                          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10 flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={categoryTests.length > 0 && categoryTests.every(tc => selectedTestCases.has(tc.id))}
                              onChange={(e) => handleSelectAllInCategory(category, e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </th>
                          {/* REPLACE WITH THIS SINGLE COMBINED HEADER: */}
                          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase w-80 flex-shrink-0">ID / Name</th>
                          {/* END OF REPLACEMENT */}
                          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20 flex-shrink-0">Status</th>
                          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16 flex-shrink-0">Priority</th>
                          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20 flex-shrink-0">Auto.</th> {/* Changed from Automation */}
                          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20 flex-shrink-0">Reqs.</th> {/* Changed from Requirements */}
                          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20 flex-shrink-0">Last Run</th>
                          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24 flex-shrink-0">Versions</th>
                          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24 flex-shrink-0">Actions</th>                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {categoryTests.map((testCase) => (
                          <TestCaseRow
                            key={testCase.id}
                            testCase={testCase}
                            versions={versions}
                            selectedVersion={selectedVersion}
                            onSelect={handleTestCaseSelection}
                            onView={handleViewTestCase}
                            onEdit={handleEditTestCase}
                            onDelete={handleDeleteTestCase}
                            onExecute={handleExecuteTestCase}
                            onDuplicate={handleDuplicateTestCase}
                            isSelected={selectedTestCases.has(testCase.id)}
                            isExpanded={expandedRows.has(testCase.id)}
                            onToggleExpand={toggleRowExpansion}
                            expandedTests={expandedTests}
                            onToggleFailureExpand={toggleTestExpansion}
                            setModalVersions={setModalVersions} // Add this line
                            setShowVersionModal={setShowVersionModal} // Add this line
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* Results Info */}
        <div className="text-sm text-gray-500 text-center">
          Showing {filteredTestCases.length} of {versionFilteredTestCases.length} test cases
          {selectedVersion !== 'unassigned' && (
            <span> for version {versions.find(v => v.id === selectedVersion)?.name || selectedVersion}</span>
          )}
        </div>
        {/* MODALS */}
        {/* NEW: Enhanced View Test Case Modal - NOW ACTIVE */}
        <ViewTestCaseModal
          testCase={viewingTestCase}
          isOpen={showViewModal}
          linkedRequirements={linkedRequirements}
          onClose={() => {
            setShowViewModal(false);
            setViewingTestCase(null);
          }}
          onEdit={handleEditTestCase}
          onExecute={handleExecuteTestCase}
          onDuplicate={handleDuplicateTestCase}
          onDelete={handleDeleteTestCase}
        />
        {/* Test Execution Modal */}
        {showExecutionModal && (
          <TestExecutionModal
            requirement={null}
            testCases={selectedAutomatedTestCases}
            isOpen={showExecutionModal}
            onClose={() => {
              setShowExecutionModal(false);
              setSelectedTestCases(new Set());
            }}
            onTestComplete={(results) => {
              console.log('Test execution completed in TestCases page:', results);
              setSelectedTestCases(new Set());
            }}
          />
        )}
        {/* Edit Test Case Modal - NOW USING SEPARATE COMPONENT */}
        {showEditModal && (
          <EditTestCaseModal
            testCase={editingTestCase}
            onSave={handleSaveTestCase}
            onCancel={() => {
              setShowEditModal(false);
              setEditingTestCase(null);
            }}
            availableVersions={availableVersions} // Pass available versions to the modal
            onVersionToggle={handleVersionToggle} // Pass the new handler
          />
        )}
        {/* Version Details Modal */}
        {showVersionModal && modalVersions && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative bg-white p-6 border w-96 shadow-lg rounded-lg m-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Version Coverage
                </h3>
                <button
                  onClick={() => setShowVersionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3">
                  <strong>{modalVersions.testCaseId}</strong> applies to {modalVersions.versions.length} version{modalVersions.versions.length !== 1 ? 's' : ''}:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {modalVersions.versions.map(vId => {
                    const v = versions.find(ver => ver.id === vId);
                    const isCurrent = vId === selectedVersion;
                    return (
                      <div
                        key={vId}
                        className={`px-3 py-2 rounded text-sm font-medium text-center ${isCurrent
                          ? 'bg-green-100 text-green-800 ring-2 ring-green-300'
                          : 'bg-gray-100 text-gray-700'
                          }`}
                      >
                        {isCurrent && '★ '}{v?.name || vId}
                      </div>
                    );
                  })}
                </div>
              </div>
              {modalVersions.versions.includes(selectedVersion) && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-green-800 text-sm font-medium">
                    ✓ This test case applies to the currently selected version
                  </p>
                </div>
              )}
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowVersionModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        <TagAssignmentModal />
        {/* Version Assignment Confirmation Modal */}
        {showVersionAssignmentModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative bg-white p-6 border w-96 shadow-lg rounded-lg m-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Confirm Version Assignment
                </h3>
                <button
                  onClick={() => setShowVersionAssignmentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">
                  You are about to <strong>{versionAssignmentAction}</strong> {selectedTestCases.size} test case{selectedTestCases.size !== 1 ? 's' : ''}:
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                  <div className="text-sm font-medium text-blue-800">
                    {versionAssignmentAction === 'add' ? 'Add to' : 'Remove from'} version:
                    <span className="ml-1 font-bold">
                      {versions.find(v => v.id === selectedVersionForAssignment)?.name || selectedVersionForAssignment}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {selectedTestCases.size} test case{selectedTestCases.size !== 1 ? 's' : ''} selected
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowVersionAssignmentModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmVersionAssignment}
                  className={`px-4 py-2 text-white rounded hover:opacity-90 ${versionAssignmentAction === 'add'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                    }`}
                >
                  {versionAssignmentAction === 'add' ? 'Add to Version' : 'Remove from Version'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>


  );
};

export default TestCases;
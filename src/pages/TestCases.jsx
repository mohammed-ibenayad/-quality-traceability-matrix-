// src/pages/TestCases.jsx - Enhanced Version with Clear Selection, Execute Button, Last Execution Info, and Failure Details
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
  Copy // NEW: Copy icon for duplicate action
} from 'lucide-react';
import MainLayout from '../components/Layout/MainLayout';
import EmptyState from '../components/Common/EmptyState';
import TestExecutionModal from '../components/TestExecution/TestExecutionModal';
import FailureDetailsPanel from '../components/TestExecution/FailureDetailsPanel';
// NEW: Import enhanced modals - UNCOMMENT when components are created
import ViewTestCaseModal from '../components/TestCases/ViewTestCaseModal';
import EditTestCaseModal from '../components/TestCases/EditTestCaseModal';
import { useVersionContext } from '../context/VersionContext';
import dataStore from '../services/DataStore';
import BulkActionsPanel from '../components/TestCases/BulkActionsPanel';
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
        {/* END OF REPLACEMENT */}
        <td className="px-2 py-3 w-20 flex-shrink-0">
          <div className="flex flex-col items-start">
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
              testCase.status === 'Passed' ? 'bg-green-100 text-green-800' :
              testCase.status === 'Failed' ? 'bg-red-100 text-red-800' :
              testCase.status === 'Blocked' ? 'bg-yellow-100 text-yellow-800' :
              testCase.status === 'Not Found' ? 'bg-orange-100 text-orange-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {testCase.status === 'Not Run' ? 'Not Run' : testCase.status}
            </span>

            {/* Execution Info - moved below status */}
            {(testCase.status === 'Failed' || testCase.status === 'Passed') && testCase.duration && (
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
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
            testCase.priority === 'High' ? 'bg-red-50 text-red-600' :
            testCase.priority === 'Medium' ? 'bg-yellow-50 text-yellow-600' :
            'bg-gray-50 text-gray-600'
          }`}>
            {testCase.priority} {/* Show full priority name */}
          </span>
        </td>
        <td className="px-2 py-3 w-20 flex-shrink-0">
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
            testCase.automationStatus === 'Automated' ? 'bg-blue-100 text-blue-800' :
            testCase.automationStatus === 'Semi-Automated' ? 'bg-purple-100 text-purple-800' :
            'bg-gray-100 text-gray-800'
          }`}>
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
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${
                        isCurrent 
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
      <div className={`${
        testCase.status === 'Failed' 
          ? 'bg-gradient-to-r from-red-50 to-gray-50 border-l-4 border-red-400' 
          : 'bg-gradient-to-r from-orange-50 to-gray-50 border-l-4 border-orange-400'
      }`}>
        <div className="p-6">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className={`w-2 h-2 rounded-full ${
                testCase.status === 'Failed' ? 'bg-red-500' : 'bg-orange-500'
              }`}></div>
              <h3 className="text-lg font-semibold text-gray-900">
                {testCase.status === 'Failed' ? 'Failure Details' : 'Issue Details'}
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                testCase.status === 'Failed' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
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
                  <div className={`w-1 h-6 rounded mr-3 ${
                    testCase.status === 'Failed' ? 'bg-red-500' : 'bg-orange-500'
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
                      {testCase.failure.stackTrace.split('\n').length} lines
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
                      {testCase.failure.stackTrace.split('\n').map((line, index) => (
                        <div 
                          key={index} 
                          className={`${
                            line.includes('at ') && (line.includes('.spec.') || line.includes('.test.') || line.includes(testCase.name)) 
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
            <div className="bg-gradient-to-r from-blue-50 to-gray-50 border-l-4 border-blue-400">
              <div className="p-6">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Test Case Details</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Status Badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      testCase.status === 'Passed' ? 'bg-green-100 text-green-800' :
                      testCase.status === 'Failed' ? 'bg-red-100 text-red-800' :
                      testCase.status === 'Blocked' ? 'bg-yellow-100 text-yellow-800' :
                      testCase.status === 'Not Found' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {testCase.status}
                    </span>
                    {/* Priority Badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      testCase.priority === 'High' ? 'bg-red-100 text-red-800' :
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
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            testCase.automationStatus === 'Automated' ? 'bg-blue-100 text-blue-800' :
                            testCase.automationStatus === 'Semi-Automated' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
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
                          <div className={`w-3 h-3 rounded-full ${
                            testCase.status === 'Passed' ? 'bg-green-500' :
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

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [versionFilter, setVersionFilter] = useState('All'); // This filter is now handled by selectedVersion from context
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [selectedTestCases, setSelectedTestCases] = useState(new Set());
  const [expandedRows, setExpandedRows] = useState(new Set()); // Corrected line

  // Add new state variables for tag filter
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');

  // Modal states - ENHANCED
  const [showViewModal, setShowViewModal] = useState(false); // NEW: View modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [viewingTestCase, setViewingTestCase] = useState(null); // NEW: Currently viewing test case
  const [editingTestCase, setEditingTestCase] = useState(null);

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

  // Get unique tags from all test cases
  const availableTags = useMemo(() => {
    const tags = new Set();
    testCases.forEach(tc => {
      if (tc.tags && Array.isArray(tc.tags)) {
        tc.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [testCases]);

  // Add this computed value for filtered tags
  const filteredAvailableTags = useMemo(() => {
      if (!tagSearchQuery) return availableTags;
      return availableTags.filter(tag =>
          tag.toLowerCase().includes(tagSearchQuery.toLowerCase())
      );
  }, [availableTags, tagSearchQuery]);


  const filteredTestCases = useMemo(() => {
    return versionFilteredTestCases.filter(testCase => {
      // Search filter
      const matchesSearch = !searchQuery ||
                            testCase.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            testCase.id.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'All' || testCase.status === statusFilter;

      // Priority filter
      const matchesPriority = priorityFilter === 'All' || testCase.priority === priorityFilter;

      // Tag filter - test case must have ANY of the selected tags (changed from ALL for better UX)
      const matchesTags = selectedTags.size === 0 ||
                          (testCase.tags && Array.isArray(testCase.tags) &&
                           Array.from(selectedTags).some(tag => testCase.tags.includes(tag)));

      // Version filter is now handled by `versionFilteredTestCases`
      return matchesSearch && matchesStatus && matchesPriority && matchesTags;
    });
  }, [versionFilteredTestCases, searchQuery, statusFilter, priorityFilter, selectedTags]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const total = filteredTestCases.length;
    const passed = filteredTestCases.filter(tc => tc.status === 'Passed').length;
    const failed = filteredTestCases.filter(tc => tc.status === 'Failed').length;
    const notRun = filteredTestCases.filter(tc => tc.status === 'Not Run').length;
    const blocked = filteredTestCases.filter(tc => tc.status === 'Blocked').length;
    const notFound = filteredTestCases.filter(tc => tc.status === 'Not Found').length;
    const automated = filteredTestCases.filter(tc => tc.automationStatus === 'Automated').length;
    const linked = filteredTestCases.filter(tc => tc.requirementIds && tc.requirementIds.length > 0).length;

    return {
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
      linkageRate: total > 0 ? Math.round((linked / total) * 100) : 0
    };
  }, [filteredTestCases]);

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

  // Execute selected test cases
  const executeSelectedTests = () => {
    if (selectedTestCases.size === 0) return;
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
    setEditingTestCase({...testCase});
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
        setShowViewModal(false); // Close view modal if currently viewing deleted test case
      } catch (error) {
        console.error('Error deleting test case:', error);
        alert('Error deleting test cases: ' + error.message);
      }
    }
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

  // Bulk version assignment handler
const handleBulkVersionAssignment = (versionId, action) => {
  if (selectedTestCases.size === 0) return;
  
  setSelectedVersionForAssignment(versionId);
  setVersionAssignmentAction(action);
  setShowVersionAssignmentModal(true);
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
  const handleTagToggle = (tag) => {
    setSelectedTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
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
          {/* CHANGE 1: Update the grid layout in the Filters Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            {/* CHANGE 3: Update the Search section to accommodate Priority filter */}
            <div>
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

            {/* CHANGE 2: Update the filters to remove Status and Priority from the main grid */}
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

            {/* CHANGE 4: Add Priority Filter after Status Filter */}
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
          </div>

          {/* Enhanced Tag Filter Section - Collapsible */}
          {availableTags.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowTagFilter(!showTagFilter)}
                    className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <Filter size={16} />
                    <span>Filter by Tags</span>
                    <ChevronDown
                      className={`transform transition-transform ${showTagFilter ? 'rotate-180' : ''}`}
                      size={16}
                    />
                    {selectedTags.size > 0 && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full ml-2">
                        {selectedTags.size}
                      </span>
                    )}
                  </button>

                  {/* Show tag count and available tags indicator */}
                  <span className="text-xs text-gray-500">
                    ({availableTags.length} available)
                  </span>
                </div>

                {selectedTags.size > 0 && (
                  <button
                    onClick={handleClearTags}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                  >
                    Clear all ({selectedTags.size})
                  </button>
                )}
              </div>

              {/* Selected Tags Preview - Always visible when there are selected tags */}
              {selectedTags.size > 0 && (
                <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-xs font-medium text-blue-700 mb-2">Active Tag Filters:</div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(selectedTags).map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                      >
                        {tag}
                        <button
                          onClick={() => handleTagToggle(tag)}
                          className="ml-1 text-blue-600 hover:text-blue-900 font-bold"
                          title="Remove tag"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Collapsible Tag Selection Area */}
              {showTagFilter && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  {/* Tag Search */}
                  {availableTags.length > 10 && (
                    <div className="mb-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                        <input
                          type="text"
                          placeholder="Search tags..."
                          value={tagSearchQuery}
                          onChange={(e) => setTagSearchQuery(e.target.value)}
                          className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Tag Grid */}
                  <div className="max-h-48 overflow-y-auto">
                    {filteredAvailableTags.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {filteredAvailableTags.map(tag => (
                          <button
                            key={tag}
                            onClick={() => handleTagToggle(tag)}
                            className={`px-3 py-2 text-sm font-medium transition-all duration-200 rounded-md border ${
                              selectedTags.has(tag)
                                ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                            }`}
                            title={`Toggle ${tag} filter`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="truncate">{tag}</span>
                              {selectedTags.has(tag) && (
                                <CheckCircle size={14} className="ml-1 flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        {tagSearchQuery ? `No tags found matching "${tagSearchQuery}"` : 'No tags available'}
                      </div>
                    )}
                  </div>

                  {/* Filter Stats */}
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>
                        {filteredAvailableTags.length} of {availableTags.length} tags shown
                      </span>
                      {selectedTags.size > 0 && (
                        <span>
                          Filtering by {selectedTags.size} tag{selectedTags.size !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-3 pt-3 border-t border-gray-300 flex justify-between">
                    <button
                      onClick={() => {
                        const allFilteredTags = new Set([...selectedTags, ...filteredAvailableTags]);
                        setSelectedTags(allFilteredTags);
                      }}
                      disabled={filteredAvailableTags.length === 0}
                      className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      Select All Visible
                    </button>
                    <button
                      onClick={() => setShowTagFilter(false)}
                      className="text-xs text-gray-600 hover:text-gray-800"
                    >
                      Close Filter
                    </button>
                  </div>
                </div>
              )}

              {/* Tag Filter Summary - Always visible for context */}
              {selectedTags.size > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  Showing test cases with any of these tags: {Array.from(selectedTags).join(', ')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enhanced Filters Section with Expand/Collapse */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            {/* Status Filter Buttons */}
            <button
              onClick={() => setStatusFilter('Failed')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                statusFilter === 'Failed'
                  ? 'bg-red-200 text-red-800'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              🔴 Failed ({summaryStats.failed})
            </button>

            {summaryStats.notFound > 0 && (
              <button
                onClick={() => setStatusFilter('Not Found')}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  statusFilter === 'Not Found'
                    ? 'bg-orange-200 text-orange-800'
                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                }`}
              >
                ⚠️ Issues ({summaryStats.notFound})
              </button>
            )}

            <button
              onClick={() => setStatusFilter('Passed')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                statusFilter === 'Passed'
                  ? 'bg-green-200 text-green-800'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              ✅ Passed ({summaryStats.passed})
            </button>

            <button
              onClick={() => setStatusFilter('All')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                statusFilter === 'All'
                  ? 'bg-blue-200 text-blue-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📊 All ({summaryStats.total})
            </button>
          </div>

          {/* Expand/Collapse All Button */}
          {(summaryStats.failed > 0 || summaryStats.notFound > 0) && (
            <button
              onClick={toggleExpandAll}
              className="flex items-center space-x-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
            >
              {allExpanded ? (
                <>
                  <ChevronUp size={16} />
                  <span>Collapse All</span>
                </>
              ) : (
                <>
                  <ChevronDown size={16} />
                  <span>Expand All Failures</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Bulk Actions */}
        {/* Enhanced Bulk Actions with Version Assignment */}
{selectedTestCases.size > 0 && (
  <BulkActionsPanel
    selectedCount={selectedTestCases.size}
    availableVersions={availableVersions}
    onVersionAssign={handleBulkVersionAssignment}
    onExecuteTests={executeSelectedTests}
    onBulkDelete={handleBulkDelete}
    onClearSelection={handleClearSelection}
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
            testCases={Array.from(selectedTestCases).map(id => filteredTestCases.find(tc => tc.id === id)).filter(Boolean)}
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
                        className={`px-3 py-2 rounded text-sm font-medium text-center ${
                          isCurrent 
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
          className={`px-4 py-2 text-white rounded hover:opacity-90 ${
            versionAssignmentAction === 'add' 
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

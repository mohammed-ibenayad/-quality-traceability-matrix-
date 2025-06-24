// src/components/TraceabilityMatrix/MatrixTable.jsx - Updated to use Unified Modal
import React, { useState } from 'react';
import RequirementRow from './RequirementRow';
import CoverageIndicator from './CoverageIndicator';
import { getCellStatus } from '../../utils/coverage';
import { Play } from 'lucide-react';
import TestExecutionModal from '../TestExecution/TestExecutionModal';

const MatrixTable = ({ 
  requirements, 
  testCases, 
  mapping, 
  coverage, 
  collapseTestCases,
  expandedRequirement,
  toggleRequirementExpansion,
  toggleTestCaseView,
  selectedVersion
}) => {
  // State for test execution modal (for full matrix view)
  const [testModalState, setTestModalState] = useState({
    isOpen: false,
    requirement: null,
    testCases: []
  });
  
  // Check if we have data to display
  const hasRequirements = requirements && requirements.length > 0;
  const hasTestCases = testCases && testCases.length > 0;
  
  // Handler for opening test execution modal (for full matrix view)
  const handleOpenTestModal = (requirement) => {
    // Get test cases for this requirement
    const reqTestIds = mapping[requirement.id] || [];
    const reqTestCases = reqTestIds
      .map(tcId => testCases.find(tc => tc.id === tcId))
      .filter(Boolean);
    
    setTestModalState({
      isOpen: true,
      requirement,
      testCases: reqTestCases
    });
  };
  
  // Handler for test completion (for full matrix view)
  const handleTestComplete = (results) => {
    console.log('Test execution completed in MatrixTable:', results);
    // The unified modal handles all DataStore updates automatically
    // Just close the modal
    setTestModalState(prev => ({ ...prev, isOpen: false }));
  };
  
  // If no requirements, show empty state
  if (!hasRequirements) {
    return (
      <div className="bg-white p-4 rounded shadow">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Requirements and Test Cases Matrix</h2>
        </div>
        <div className="py-12 text-center text-gray-500">
          <p>No requirements found. Import requirements to get started.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-4 rounded shadow overflow-auto">
      {/* View toggle button - only show when there are test cases */}
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Requirements and Test Cases Matrix</h2>
        {hasTestCases && (
          <button 
            className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm"
            onClick={toggleTestCaseView}
          >
            {collapseTestCases ? 'Show All Test Cases' : 'Summary View'}
          </button>
        )}
      </div>
      
      {/* Show empty state if no test cases */}
      {!hasTestCases && (
        <div className="py-8 text-center text-gray-500 border-t">
          <p>No test cases found. Import test cases to build the traceability matrix.</p>
        </div>
      )}
      
      {/* The matrix table - Different display based on collapsed state and availability of test cases */}
      {hasTestCases && collapseTestCases && (
        // Summary view with collapsible rows - Uses RequirementRow with unified modal
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2"></th>
              <th className="border p-2">Requirement ID</th>
              <th className="border p-2">Requirement Name</th>
              <th className="border p-2">Priority</th>
              <th className="border p-2">Test Coverage</th>
              <th className="border p-2">Test Cases</th>
              <th className="border p-2">Execution Details</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requirements.map(req => (
              <RequirementRow 
                key={req.id}
                req={req}
                coverage={coverage.find(c => c.reqId === req.id)}
                mapping={mapping}
                testCases={testCases}
                expanded={expandedRequirement === req.id}
                onToggleExpand={() => toggleRequirementExpansion(req.id)}
                selectedVersion={selectedVersion}
              />
            ))}
          </tbody>
        </table>
      )}
      
      {hasTestCases && !collapseTestCases && (
        // Full detailed view with all test cases (horizontal scroll)
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 w-36">Requirement ID</th>
              <th className="border p-2">Requirement Name</th>
              <th className="border p-2">Priority</th>
              <th className="border p-2 w-20">Coverage</th>
              {testCases.map(tc => (
                <th key={tc.id} className="border p-2 w-24 text-xs">
                  {tc.id}<br/>
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    tc.status === 'Passed' ? 'bg-green-500' : 
                    tc.status === 'Failed' ? 'bg-red-500' : 'bg-gray-500'
                  }`}></span>
                  <span className={`text-xs ${
                    tc.automationStatus === 'Automated' ? 'text-blue-600' : 
                    tc.automationStatus === 'Planned' ? 'text-orange-600' : 'text-gray-600'
                  }`}>
                    {tc.automationStatus === 'Automated' ? 'A' : 
                     tc.automationStatus === 'Planned' ? 'P' : 'M'}
                  </span>
                </th>
              ))}
              <th className="border p-2 w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requirements.map(req => {
              const reqCoverage = coverage.find(c => c.reqId === req.id);
              const mappedTests = mapping[req.id] || [];
              
              // Filter mapped tests based on selected version
              const versionFilteredTests = selectedVersion === 'unassigned' 
                ? mappedTests
                : mappedTests.filter(tcId => {
                    const tc = testCases.find(t => t.id === tcId);
                    return tc && (!tc.version || tc.version === selectedVersion || tc.version === '');
                  });
              
              return (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="border p-2 font-medium">{req.id}</td>
                  <td className="border p-2">{req.name}</td>
                  <td className="border p-2 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${
                      req.priority === 'High' ? 'bg-red-100 text-red-800' : 
                      req.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {req.priority}
                    </span>
                  </td>
                  <td className="border p-2 text-center">
                    <CoverageIndicator 
                      coverage={reqCoverage} 
                      requirement={req}
                      mappedTests={versionFilteredTests}
                    />
                  </td>
                  
                  {/* Test case columns */}
                  {testCases.map(tc => {
                    const isMapped = versionFilteredTests.includes(tc.id);
                    const status = isMapped ? getCellStatus(tc) : null;
                    
                    return (
                      <td key={tc.id} className="border p-2 text-center">
                        {isMapped ? (
                          <div className={`w-4 h-4 mx-auto rounded-full ${
                            status === 'passed' ? 'bg-green-500' : 
                            status === 'failed' ? 'bg-red-500' : 'bg-gray-300'
                          }`}></div>
                        ) : (
                          <div className="w-4 h-4 mx-auto"></div>
                        )}
                      </td>
                    );
                  })}
                  
                  <td className="border p-2">
                    {reqCoverage ? (
                      <div className="flex flex-col">
                        <div className="text-xs mb-1">Pass: {reqCoverage.passPercentage}%</div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                          <div 
                            className="bg-green-600 h-1.5 rounded-full" 
                            style={{width: `${reqCoverage.passPercentage}%`}}
                          ></div>
                        </div>
                        
                        <div className="text-xs mb-1">Auto: {reqCoverage.automationPercentage}%</div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full" 
                            style={{width: `${reqCoverage.automationPercentage}%`}}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-red-500 text-xs">No Coverage</span>
                    )}
                  </td>
                  
                  {/* New cell for Run Tests button */}
                  <td className="border p-2 text-center">
                    <button
                      onClick={() => handleOpenTestModal(req)}
                      className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs"
                      disabled={versionFilteredTests.length === 0}
                      title={versionFilteredTests.length === 0 ? "No test cases to run" : "Run tests for this requirement"}
                    >
                      <Play className="mr-1" size={12} />
                      Run
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* UNIFIED Test Execution Modal - Same as TestCases page and RequirementRow */}
      <TestExecutionModal
        requirement={testModalState.requirement}
        testCases={testModalState.testCases}
        isOpen={testModalState.isOpen}
        onClose={() => setTestModalState(prev => ({ ...prev, isOpen: false }))}
        onTestComplete={handleTestComplete}
      />
    </div>
  );
};

export default MatrixTable;
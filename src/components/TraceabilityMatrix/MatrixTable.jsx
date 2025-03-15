import React from 'react';
import RequirementRow from './RequirementRow';
import CoverageIndicator from './CoverageIndicator';
import { getCellStatus } from '../../utils/coverage';

const MatrixTable = ({ 
  requirements, 
  testCases, 
  mapping, 
  coverage, 
  collapseTestCases,
  expandedRequirement,
  toggleRequirementExpansion,
  toggleTestCaseView 
}) => {
  
  return (
    <div className="bg-white p-4 rounded shadow overflow-auto">
      {/* View toggle button */}
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Requirements and Test Cases Matrix</h2>
        <button 
          className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm"
          onClick={toggleTestCaseView}
        >
          {collapseTestCases ? 'Show All Test Cases' : 'Summary View'}
        </button>
      </div>
      
      {/* The matrix table - Different display based on collapsed state */}
      {collapseTestCases ? (
        // Summary view with collapsible rows
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2"></th>
              <th className="border p-2">Requirement ID</th>
              <th className="border p-2">Requirement Name</th>
              <th className="border p-2">Priority</th>
              <th className="border p-2">Test Depth</th>
              <th className="border p-2">Test Cases</th>
              <th className="border p-2">Status</th>
              <th className="border p-2 w-40">Coverage</th>
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
              />
            ))}
          </tbody>
        </table>
      ) : (
        // Full detailed view with all test cases (horizontal scroll)
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 w-36">Requirement ID</th>
              <th className="border p-2">Requirement Name</th>
              <th className="border p-2">Priority</th>
              <th className="border p-2 w-20">Test Depth</th>
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
                    {tc.automationStatus.charAt(0)}
                  </span>
                </th>
              ))}
              <th className="border p-2 w-40">Coverage</th>
            </tr>
          </thead>
          <tbody>
            {requirements.map(req => (
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
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-medium">{req.testDepthFactor.toFixed(1)}</span>
                    <span className="text-xs text-gray-500">{(mapping[req.id] || []).length}/{req.minTestCases} tests</span>
                    <div className={`mt-1 w-4 h-4 rounded-full flex items-center justify-center ${
                      (mapping[req.id] || []).length >= req.minTestCases 
                        ? 'bg-green-500 text-white' 
                        : 'bg-orange-500 text-white'
                    }`}>
                      {(mapping[req.id] || []).length >= req.minTestCases ? '✓' : '!'}
                    </div>
                  </div>
                </td>
                
                {testCases.map(tc => {
                  const isLinked = (mapping[req.id] || []).includes(tc.id);
                  const status = isLinked ? getCellStatus(req.id, tc.id, testCases) : 'none';
                  
                  return (
                    <td key={`${req.id}-${tc.id}`} className="border p-2 text-center">
                      {isLinked ? (
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
                  <CoverageIndicator coverage={coverage.find(c => c.reqId === req.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MatrixTable;
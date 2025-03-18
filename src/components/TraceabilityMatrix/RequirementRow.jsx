import React from 'react';
import CoverageIndicator from './CoverageIndicator';
import TDFInfoTooltip from '../Common/TDFInfoTooltip';

const RequirementRow = ({ req, coverage, mapping, testCases, expanded, onToggleExpand }) => {
  const mappedTests = mapping[req.id] || [];
  const passedCount = mappedTests.filter(tcId => 
    testCases.find(tc => tc.id === tcId)?.status === 'Passed'
  ).length;
  const failedCount = mappedTests.filter(tcId => 
    testCases.find(tc => tc.id === tcId)?.status === 'Failed'
  ).length;
  const notRunCount = mappedTests.filter(tcId => 
    testCases.find(tc => tc.id === tcId)?.status === 'Not Run'
  ).length;

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="border p-2">
          <button 
            onClick={onToggleExpand}
            className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200"
          >
            {expanded ? '−' : '+'}
          </button>
        </td>
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
            <div className="flex items-center">
              <span className="text-sm font-medium">{req.testDepthFactor.toFixed(1)}</span>
              <TDFInfoTooltip />
            </div>
            <span className="text-xs text-gray-500">{mappedTests.length}/{req.minTestCases} tests</span>
            <div className={`mt-1 w-4 h-4 rounded-full flex items-center justify-center ${
              mappedTests.length >= req.minTestCases 
                ? 'bg-green-500 text-white' 
                : 'bg-orange-500 text-white'
            }`}>
              {mappedTests.length >= req.minTestCases ? '✓' : '!'}
            </div>
          </div>
        </td>
        <td className="border p-2">
          <div className="flex gap-2 items-center justify-center">
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">{passedCount} Passed</span>
            {failedCount > 0 && (
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">{failedCount} Failed</span>
            )}
            {notRunCount > 0 && (
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">{notRunCount} Not Run</span>
            )}
          </div>
        </td>
        <td className="border p-2 text-center">
          {mappedTests.length === 0 ? (
            <span className="text-red-500 text-sm">No Tests</span>
          ) : (
            <span className={`text-sm font-medium ${
              passedCount === mappedTests.length ? 'text-green-600' :
              failedCount > 0 ? 'text-red-600' : 'text-blue-600'
            }`}>
              {passedCount === mappedTests.length ? '✓ All Passing' :
               failedCount > 0 ? '✗ Failing' : '⟳ In Progress'}
            </span>
          )}
        </td>
        <td className="border p-2">
          <CoverageIndicator coverage={coverage} />
        </td>
      </tr>
      
      {expanded && (
        <tr>
          <td colSpan="8" className="border p-0">
            <div className="p-3 bg-gray-50">
              <h4 className="font-medium mb-2">Test Cases for {req.id}: {req.name}</h4>
              {mappedTests.length === 0 ? (
                <p className="text-gray-500 italic">No test cases associated with this requirement.</p>
              ) : (
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-1">Test ID</th>
                      <th className="border p-1">Name</th>
                      <th className="border p-1">Status</th>
                      <th className="border p-1">Automation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappedTests.map(tcId => {
                      const tc = testCases.find(t => t.id === tcId);
                      return tc ? (
                        <tr key={tc.id}>
                          <td className="border p-1">{tc.id}</td>
                          <td className="border p-1">{tc.name}</td>
                          <td className="border p-1">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                              tc.status === 'Passed' ? 'bg-green-100 text-green-800' : 
                              tc.status === 'Failed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {tc.status}
                            </span>
                          </td>
                          <td className="border p-1">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                              tc.automationStatus === 'Automated' ? 'bg-blue-100 text-blue-800' : 
                              tc.automationStatus === 'Planned' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {tc.automationStatus}
                            </span>
                          </td>
                        </tr>
                      ) : null;
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default RequirementRow;
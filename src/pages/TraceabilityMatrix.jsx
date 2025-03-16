import React, { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import MatrixTable from '../components/TraceabilityMatrix/MatrixTable';
import EmptyState from '../components/common/EmptyState';
import { useRelease } from '../hooks/useRelease';
import dataStore from '../services/DataStore';

// Import only versions data for the header dropdown
import versionsData from '../data/versions';

const TraceabilityMatrix = () => {
  // State for collapsed test case view
  const [collapseTestCases, setCollapseTestCases] = useState(true);
  const [expandedRequirement, setExpandedRequirement] = useState(null);
  
  // State to hold the data from DataStore
  const [requirements, setRequirements] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [mapping, setMapping] = useState({});
  
  // Load data from DataStore
  useEffect(() => {
    // Get data from DataStore
    setRequirements(dataStore.getRequirements());
    setTestCases(dataStore.getTestCases());
    setMapping(dataStore.getMapping());
    
    // Subscribe to DataStore changes
    const unsubscribe = dataStore.subscribe(() => {
      setRequirements(dataStore.getRequirements());
      setTestCases(dataStore.getTestCases());
      setMapping(dataStore.getMapping());
    });
    
    // Clean up subscription
    return () => unsubscribe();
  }, []);
  
  // Use the custom hook to get release data
  const { 
    selectedVersion, 
    setSelectedVersion, 
    coverage,
    summary,
    versions,
    hasData
  } = useRelease(requirements, testCases, mapping, versionsData, 'v2.2');
  
  // Toggle test case view
  const toggleTestCaseView = () => {
    setCollapseTestCases(!collapseTestCases);
    setExpandedRequirement(null);
  };
  
  // Toggle specific requirement expansion
  const toggleRequirementExpansion = (reqId) => {
    setExpandedRequirement(expandedRequirement === reqId ? null : reqId);
  };

  return (
    <MainLayout 
      title="Requirements-Test Case Traceability Matrix"
      selectedVersion={selectedVersion}
      setSelectedVersion={setSelectedVersion}
      versions={versions}
      hasData={hasData}
    >
      {!hasData ? (
        <EmptyState 
          title="No Requirements or Test Cases Found" 
          message="To build your traceability matrix, you need to import requirements and test cases first."
          actionText="Import Data"
          actionPath="/import"
          icon="requirements"
        />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded shadow">
              <div className="text-xl font-semibold">{summary.reqWithTests} / {summary.totalRequirements}</div>
              <div className="text-sm text-gray-500">Requirements With Tests</div>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <div className="text-xl font-semibold">{summary.reqFullyAutomated} / {summary.totalRequirements}</div>
              <div className="text-sm text-gray-500">Fully Automated Requirements</div>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <div className="text-xl font-semibold">{summary.reqFullyPassed} / {summary.totalRequirements}</div>
              <div className="text-sm text-gray-500">Fully Verified Requirements</div>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <div className="text-xl font-semibold">{summary.totalTestCases}</div>
              <div className="text-sm text-gray-500">Total Test Cases</div>
            </div>
          </div>
          
          {/* Matrix Table */}
          <MatrixTable
            requirements={requirements}
            testCases={testCases}
            mapping={mapping}
            coverage={coverage}
            collapseTestCases={collapseTestCases}
            expandedRequirement={expandedRequirement}
            toggleRequirementExpansion={toggleRequirementExpansion}
            toggleTestCaseView={toggleTestCaseView}
          />
          
          {/* Information Panel */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold mb-2">Test Depth Factor (TDF) Scale</h3>
              <div className="text-sm">
                <p className="mb-2">The Test Depth Factor is calculated based on:</p>
                <div className="ml-4 mb-2">
                  <div>• Business Impact (40%)</div>
                  <div>• Technical Complexity (30%)</div>
                  <div>• Regulatory Factor (20%)</div>
                  <div>• Usage Frequency (10%)</div>
                </div>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-1">TDF Range</th>
                      <th className="border p-1">Min Test Cases</th>
                      <th className="border p-1">Coverage Approach</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-1">4.1 - 5.0</td>
                      <td className="border p-1">8+</td>
                      <td className="border p-1">Exhaustive testing</td>
                    </tr>
                    <tr>
                      <td className="border p-1">3.1 - 4.0</td>
                      <td className="border p-1">5-7</td>
                      <td className="border p-1">Strong coverage</td>
                    </tr>
                    <tr>
                      <td className="border p-1">2.1 - 3.0</td>
                      <td className="border p-1">3-5</td>
                      <td className="border p-1">Standard coverage</td>
                    </tr>
                    <tr>
                      <td className="border p-1">1.0 - 2.0</td>
                      <td className="border p-1">1-2</td>
                      <td className="border p-1">Basic validation</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold mb-2">Legend</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                  <span>Passing Tests</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                  <span>Failing Tests</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-300 rounded-full mr-1"></div>
                  <span>Not Run Tests</span>
                </div>
                <div className="flex items-center">
                  <span className="text-blue-600 mr-1">A</span>
                  <span>Automated</span>
                </div>
                <div className="flex items-center">
                  <span className="text-orange-600 mr-1">P</span>
                  <span>Planned</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 mr-1">M</span>
                  <span>Manual</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center mr-1">✓</div>
                  <span>Meets Min Test Cases</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center mr-1">!</div>
                  <span>Below Min Test Cases</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </MainLayout>
  );
};

export default TraceabilityMatrix;
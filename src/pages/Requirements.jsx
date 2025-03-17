import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import EmptyState from '../components/Common/EmptyState';
import { useRelease } from '../hooks/useRelease';
import dataStore from '../services/DataStore';

// Import versions for the header dropdown
import versionsData from '../data/versions';

const Requirements = () => {
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
    versionCoverage,
    versions,
    hasData
  } = useRelease(requirements, testCases, mapping, versionsData, 'v2.2');

  // Filter requirements by selected version
  const filteredRequirements = requirements.filter(req => 
    req.versions && req.versions.includes(selectedVersion)
  );

  return (
    <MainLayout 
      title="Requirements" 
      selectedVersion={selectedVersion}
      setSelectedVersion={setSelectedVersion}
      versions={versions}
      hasData={hasData}
    >
      {!hasData ? (
        // Show empty state when no data is available
        <EmptyState 
          title="No Requirements Found" 
          message="Get started by importing your requirements to begin tracking your quality metrics."
          actionText="Import Requirements"
          actionPath="/import#requirements-tab"
          icon="requirements"
        />
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              Requirements
              <span className="ml-2 text-base font-normal text-gray-500">
                {versions.find(v => v.id === selectedVersion)?.name || ''}
              </span>
            </h2>
            <div className="flex gap-2">
              <Link 
                to="/import#requirements-tab" 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Import Requirements
              </Link>
            </div>
          </div>

          <div className="bg-white rounded shadow overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test Depth
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business Impact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coverage
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test Cases
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequirements.map((req) => {
                  // Find corresponding coverage data
                  const coverage = versionCoverage.find(c => c.reqId === req.id);
                  // Count linked test cases
                  const linkedTestCount = (mapping[req.id] || []).length;
                  
                  return (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        <Link to={`/matrix?req=${req.id}`} className="hover:underline">
                          {req.id}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {req.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          req.priority === 'High' ? 'bg-red-100 text-red-800' : 
                          req.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {req.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-medium">{req.testDepthFactor.toFixed(1)}</span>
                          <span className="text-xs text-gray-500">{req.minTestCases} min tests</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {req.businessImpact}/5
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {coverage ? (
                          <div className={`text-sm font-medium ${
                            coverage.meetsMinimum 
                              ? 'text-green-600' 
                              : 'text-orange-600'
                          }`}>
                            {coverage.coverageRatio}% of required
                          </div>
                        ) : (
                          <span className="text-red-500 text-xs">No Coverage</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {linkedTestCount === 0 ? (
                          <span className="text-red-500 text-xs">None</span>
                        ) : (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {linkedTestCount} test{linkedTestCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </MainLayout>
  );
};

export default Requirements;
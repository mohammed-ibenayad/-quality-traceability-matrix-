import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import EmptyState from '../components/Common/EmptyState';
import EditRequirementModal from '../components/Requirements/EditRequirementModal';
import TDFInfoTooltip from '../components/Common/TDFInfoTooltip';
import { useRelease } from '../hooks/useRelease';
import dataStore from '../services/DataStore';

// Import versions for the header dropdown
import versionsData from '../data/versions';

const Requirements = () => {
  // State to hold the data from DataStore
  const [requirements, setRequirements] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [mapping, setMapping] = useState({});
  const [editingRequirement, setEditingRequirement] = useState(null);
  
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
  } = useRelease(requirements, testCases, mapping, versionsData, 'unassigned');

  // Filter requirements by selected version
  const filteredRequirements = selectedVersion === 'unassigned'
    ? requirements // Show all requirements for "unassigned"
    : requirements.filter(req => req.versions && req.versions.includes(selectedVersion));

  // Handle saving the edited requirement
  const handleSaveRequirement = (updatedRequirement) => {
    try {
      dataStore.updateRequirement(updatedRequirement.id, updatedRequirement);
      setEditingRequirement(null);
    } catch (error) {
      console.error("Error updating requirement:", error);
      // You might want to show an error message to the user
    }
  };

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
                {selectedVersion === 'unassigned' 
                  ? 'All Items (Unassigned View)' 
                  : versions.find(v => v.id === selectedVersion)?.name || ''}
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

          {/* Version indicator for unassigned view */}
          {selectedVersion === 'unassigned' && (
            <div className="bg-blue-100 p-4 rounded-lg mb-6 text-blue-800">
              <div className="font-medium">Showing All Requirements (Unassigned View)</div>
              <p className="text-sm mt-1">
                This view shows all requirements, including those that may be assigned to versions that haven't been created yet.
              </p>
            </div>
          )}

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
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      Test Depth
                      <TDFInfoTooltip />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coverage
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Versions
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequirements.map((req) => {
                  // Find corresponding coverage data
                  const coverage = versionCoverage.find(c => c.reqId === req.id);
                  // Count linked test cases
                  const linkedTestCount = (mapping[req.id] || []).length;
                  
                  // Check for unassigned versions (versions that don't exist yet)
                  const assignedVersions = req.versions || [];
                  const existingVersionIds = versions.map(v => v.id);
                  const unassignedVersions = assignedVersions.filter(v => !existingVersionIds.includes(v));
                  
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
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {req.type || 'Functional'}
                        </span>
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
                          <span className="text-xs text-gray-500">{req.minTestCases} min tests</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {coverage ? (
                          <div className="flex flex-col">
                            <div className={`text-sm font-medium ${
                              coverage.meetsMinimum 
                                ? 'text-green-600' 
                                : 'text-orange-600'
                            }`}>
                              {coverage.coverageRatio}% of required
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {linkedTestCount} test{linkedTestCount !== 1 ? 's' : ''} linked
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-red-500 text-xs">No Coverage</span>
                            <div className="text-xs text-gray-500 mt-1">
                              {linkedTestCount} test{linkedTestCount !== 1 ? 's' : ''} linked
                            </div>
                            </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-wrap gap-1">
                          {req.versions && req.versions.map(vId => {
                            const versionExists = versions.some(v => v.id === vId);
                            return (
                              <span 
                                key={vId} 
                                className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                                  versionExists 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                                title={versionExists ? 'Existing version' : 'Version not created yet'}
                              >
                                {vId}
                              </span>
                            );
                          })}
                          {(!req.versions || req.versions.length === 0) && (
                            <span className="text-gray-400 text-xs">No versions</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <button
                          onClick={() => setEditingRequirement(req)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Edit Requirement Modal */}
          {editingRequirement && (
            <EditRequirementModal
              requirement={editingRequirement}
              onSave={handleSaveRequirement}
              onCancel={() => setEditingRequirement(null)}
            />
          )}
        </>
      )}
    </MainLayout>
  );
};

export default Requirements;
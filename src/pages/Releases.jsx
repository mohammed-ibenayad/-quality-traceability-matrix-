import React, { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import ReleaseVersionGrid from '../components/Releases/ReleaseVersionGrid';
import EmptyState from '../components/Common/EmptyState';
import { useVersionContext } from '../context/VersionContext';
import dataStore from '../services/DataStore';

const Releases = () => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [hasData, setHasData] = useState(false);
  
  // Use the version context
  const { selectedVersion, setSelectedVersion, versions } = useVersionContext();
  
  // Load data from DataStore
  useEffect(() => {
    // Check if we have any data
    setHasData(dataStore.hasData());
    
    // Subscribe to DataStore changes
    const unsubscribe = dataStore.subscribe(() => {
      setHasData(dataStore.hasData());
    });
    
    // Clean up subscription
    return () => unsubscribe();
  }, []);

  // No longer needed since we removed the new release button
  
  // Handler for updating a version
  const handleUpdateVersion = (versionId, updateData) => {
    try {
      // Use DataStore method if available
      if (dataStore.updateVersion) {
        dataStore.updateVersion(versionId, updateData);
      }
    } catch (error) {
      console.error("Error updating version:", error);
      // In a real app, show a notification
    }
  };
  
  // Handler for deleting a version
  const handleDeleteVersion = (versionId) => {
    if (window.confirm("Are you sure you want to delete this version? This action cannot be undone.")) {
      try {
        // Use DataStore method if available
        if (dataStore.deleteVersion) {
          dataStore.deleteVersion(versionId);
        }
        
        // If the deleted version was selected, switch to unassigned view
        if (selectedVersion === versionId) {
          setSelectedVersion('unassigned');
        }
      } catch (error) {
        console.error("Error deleting version:", error);
        // In a real app, show a notification
      }
    }
  };

  // Get status color class (for table view)
  const getStatusColor = (status) => {
    switch (status) {
      case 'Released': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Planned': return 'bg-yellow-100 text-yellow-800';
      case 'Deprecated': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <MainLayout 
      title="Release Management" 
      hasData={hasData}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Release Versions</h2>
        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-md text-sm ${
                viewMode === 'grid' 
                  ? 'bg-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-md text-sm ${
                viewMode === 'table' 
                  ? 'bg-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {versions.length === 0 ? (
        <EmptyState
          title="No Releases Found"
          message="Create your first release version to start tracking your quality metrics."
          actionText="Create Release"
          actionPath="#"
          icon="metrics"
          className="mt-8"
        />
      ) : viewMode === 'grid' ? (
        <ReleaseVersionGrid
          versions={versions}
          selectedVersion={selectedVersion}
          onSelectVersion={setSelectedVersion}
        />
      ) : (
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Version
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Release Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quality Gates
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {versions.map((version) => (
                <tr 
                  key={version.id} 
                  className={`${
                    version.id === selectedVersion ? 'bg-blue-50' : 'hover:bg-gray-50'
                  } cursor-pointer`}
                  onClick={() => setSelectedVersion(version.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{version.name}</div>
                    <div className="text-sm text-gray-500">{version.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(version.status)}`}>
                      {version.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(version.releaseDate).toLocaleDateString()}
                    {version.status === 'In Progress' && (
                      <div className="text-xs text-blue-600">
                        {Math.ceil((new Date(version.releaseDate) - new Date()) / (1000 * 60 * 60 * 24))} days left
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {version.qualityGates ? (
                      <div className="text-sm text-gray-900">
                        {version.qualityGates.filter(gate => gate.status === 'passed').length} / {version.qualityGates.length} passed
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">No quality gates defined</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteVersion(version.id);
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </MainLayout>
  );
};

export default Releases;
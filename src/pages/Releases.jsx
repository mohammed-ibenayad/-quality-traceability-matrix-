import React, { useState, useEffect } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import MainLayout from '../components/Layout/MainLayout';
import ReleaseVersionGrid from '../components/Releases/ReleaseVersionGrid';
import EmptyState from '../components/Common/EmptyState';
import NewReleaseModal from '../components/Releases/NewReleaseModal';
import EditVersionModal from '../components/Releases/EditVersionModal';
import { useVersionContext } from '../context/VersionContext';
import dataStore from '../services/DataStore';

const Releases = () => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [hasData, setHasData] = useState(false);
  const [isNewReleaseModalOpen, setIsNewReleaseModalOpen] = useState(false);
  const [isEditVersionModalOpen, setIsEditVersionModalOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use the version context with loading state
  const { selectedVersion, setSelectedVersion, versions, isLoading: versionsLoading } = useVersionContext();
  
  // Load data from DataStore
  useEffect(() => {
    const updateData = () => {
      try {
        setHasData(dataStore.hasData());
        console.log('Releases: Updated hasData to', dataStore.hasData());
      } catch (error) {
        console.error('Releases: Error checking hasData:', error);
        setHasData(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial load
    updateData();
    
    // Subscribe to DataStore changes
    const unsubscribe = dataStore.subscribe(() => {
      console.log('Releases: DataStore change detected');
      updateData();
    });
    
    // Clean up subscription
    return () => unsubscribe();
  }, []);

  // Debug logging for versions
  useEffect(() => {
    console.log('Releases: Versions updated:', {
      versionsLoading,
      versionsCount: versions.length,
      versions: versions.map(v => ({ id: v?.id, name: v?.name, status: v?.status }))
    });
  }, [versions, versionsLoading]);

  // Handler for adding a new version
  const handleAddVersion = (newVersion) => {
    try {
      console.log('Releases: Adding version:', newVersion);
      dataStore.addVersion(newVersion);
      // Removed success notification
    } catch (error) {
      console.error("Error adding version:", error);
      // You can keep error notifications if needed, or remove this too
      // showNotification(error.message, 'error');
    }
  };
  
  // Handler for updating a version
  const handleUpdateVersion = (versionId, updateData) => {
    try {
      console.log('Releases: Updating version:', versionId, updateData);
      dataStore.updateVersion(versionId, updateData);
      // Removed success notification
    } catch (error) {
      console.error("Error updating version:", error);
      // You can keep error notifications if needed, or remove this too
      // showNotification(error.message, 'error');
    }
  };

  // Handler for opening edit modal
  const handleEditVersion = (version) => {
    setEditingVersion(version);
    setIsEditVersionModalOpen(true);
  };

  // Handler for saving edited version
  const handleSaveEditedVersion = (updatedVersion) => {
    handleUpdateVersion(updatedVersion.id, updatedVersion);
    setIsEditVersionModalOpen(false);
    setEditingVersion(null);
  };
  
  // Handler for deleting a version
  const handleDeleteVersion = (versionId) => {
    if (window.confirm("Are you sure you want to delete this version? This action cannot be undone.")) {
      try {
        console.log('Releases: Deleting version:', versionId);
        
        dataStore.deleteVersion(versionId);
        
        // If the deleted version was selected, switch to unassigned view
        if (selectedVersion === versionId) {
          setSelectedVersion('unassigned');
        }
        
        // Removed success notification
      } catch (error) {
        console.error("Error deleting version:", error);
        // You can keep error notifications if needed, or remove this too
        // showNotification(error.message, 'error');
      }
    }
  };

  // Handler for opening the new release modal
  const handleCreateRelease = () => {
    setIsNewReleaseModalOpen(true);
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

  // Show loading state
  if (isLoading || versionsLoading) {
    return (
      <MainLayout title="Release Management" hasData={hasData}>
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <div className="mt-2 text-gray-600">Loading releases...</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Release Management" 
      hasData={hasData}
      onAddVersion={handleAddVersion}
    >
      {/* Debug information (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
          Debug: {versions.length} versions loaded, hasData: {hasData.toString()}
        </div>
      )}

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

      {!Array.isArray(versions) || versions.length === 0 ? (
        <EmptyState
          title="No Releases Found"
          message="Create your first release version to start tracking your quality metrics."
          actionText="Create Release"
          onAction={handleCreateRelease}
          icon="releases"
          className="mt-8"
        />
      ) : viewMode === 'grid' ? (
        <ReleaseVersionGrid
          versions={versions}
          selectedVersion={selectedVersion}
          onSelectVersion={setSelectedVersion}
          onDeleteVersion={handleDeleteVersion}
          onEditVersion={handleEditVersion}
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
              {versions.filter(version => version && typeof version === 'object').map((version) => (
                <tr 
                  key={version.id || Math.random()} 
                  className={`${
                    version.id === selectedVersion ? 'bg-blue-50' : 'hover:bg-gray-50'
                  } cursor-pointer`}
                  onClick={() => setSelectedVersion(version.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{version.name || 'Unnamed'}</div>
                    <div className="text-sm text-gray-500">{version.id || 'No ID'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(version.status || 'Planned')}`}>
                      {version.status || 'Planned'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {version.releaseDate ? new Date(version.releaseDate).toLocaleDateString() : 'Not set'}
                    {version.status === 'In Progress' && version.releaseDate && (
                      <div className="text-xs text-blue-600">
                        {Math.ceil((new Date(version.releaseDate) - new Date()) / (1000 * 60 * 60 * 24))} days left
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {version.qualityGates && Array.isArray(version.qualityGates) && version.qualityGates.length > 0 ? (
                      <div className="text-sm text-gray-900">
                        {version.qualityGates.filter(gate => gate && gate.status === 'passed').length} / {version.qualityGates.length} passed
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">No quality gates defined</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditVersion(version);
                      }}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Edit version"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteVersion(version.id);
                      }}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Delete version"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Version Modal */}
      <EditVersionModal
        version={editingVersion}
        isOpen={isEditVersionModalOpen}
        onClose={() => {
          setIsEditVersionModalOpen(false);
          setEditingVersion(null);
        }}
        onSave={handleSaveEditedVersion}
        existingVersions={versions || []}
      />

      {/* New Release Modal */}
      <NewReleaseModal
        isOpen={isNewReleaseModalOpen}
        onClose={() => setIsNewReleaseModalOpen(false)}
        onSave={(newVersion) => {
          handleAddVersion(newVersion);
          setIsNewReleaseModalOpen(false);
        }}
        existingVersions={versions || []}
      />
    </MainLayout>
  );
};

export default Releases;
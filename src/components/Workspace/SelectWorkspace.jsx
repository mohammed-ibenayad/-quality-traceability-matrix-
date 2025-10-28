import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceContext } from '../../contexts/WorkspaceContext';
import NewWorkspaceModal from './NewWorkspaceModal';
import { Loader } from 'lucide-react';
import dataStore from '../../services/DataStore';

const SelectWorkspace = () => {
  const navigate = useNavigate();
  const { currentWorkspace, setCurrentWorkspace, workspaces, isLoading } = useWorkspaceContext();
  const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState(false);
  
  // AUTO-REDIRECT: If workspace is selected, go to dashboard
  useEffect(() => {
    if (!isLoading && currentWorkspace && workspaces.length > 0) {
      console.log('✅ Workspace already selected, redirecting to dashboard:', currentWorkspace.name);
      navigate('/dashboard', { replace: true });
    }
  }, [currentWorkspace, isLoading, workspaces, navigate]);
  
  const handleCreateWorkspace = () => {
    setShowNewWorkspaceModal(true);
  };
  
  const handleSelectWorkspace = (workspace) => {
    setCurrentWorkspace(workspace);
    localStorage.setItem('currentWorkspace', JSON.stringify(workspace));
    dataStore.setCurrentWorkspace(workspace.id); 
    navigate('/dashboard');
  };
  
  const handleWorkspaceCreated = (workspace) => {
    setShowNewWorkspaceModal(false);
    handleSelectWorkspace(workspace);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex items-center space-x-2">
          <Loader className="w-6 h-6 text-blue-500 animate-spin" />
          <span className="text-gray-600">Loading workspaces...</span>
        </div>
      </div>
    );
  }

  // If a workspace is already selected, show loading while redirecting
  if (currentWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex items-center space-x-2">
          <Loader className="w-6 h-6 text-blue-500 animate-spin" />
          <span className="text-gray-600">Loading workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Select a Workspace</h1>
        
        {workspaces.length === 0 ? (
          <div className="text-center">
            <p className="mb-4 text-gray-600">You don't have any workspaces yet.</p>
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={handleCreateWorkspace}
            >
              Create Your First Workspace
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {workspaces.map(workspace => (
              <div 
                key={workspace.id}
                className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleSelectWorkspace(workspace)}
              >
                <h3 className="font-medium">{workspace.name}</h3>
                {workspace.description && (
                  <p className="text-sm text-gray-500 mt-1">{workspace.description}</p>
                )}
              </div>
            ))}
            
            <button 
              className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              onClick={handleCreateWorkspace}
            >
              Create New Workspace
            </button>
          </div>
        )}
      </div>
      
      {showNewWorkspaceModal && (
        <NewWorkspaceModal 
          onClose={() => setShowNewWorkspaceModal(false)} 
          onWorkspaceCreated={handleWorkspaceCreated}
        />
      )}
    </div>
  );
};

export default SelectWorkspace;
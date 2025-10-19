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
  
  // Add these console logs at the top of your SelectWorkspace component
  console.log("Rendering SelectWorkspace");
  console.log("- workspaces:", workspaces);
  console.log("- isLoading:", isLoading);
  console.log("- currentWorkspace:", currentWorkspace);
  console.log("- showNewWorkspaceModal:", showNewWorkspaceModal);  
  
  // Modify your handleCreateWorkspace function
  const handleCreateWorkspace = () => {
    console.log("Create workspace button clicked");
    console.log("Before state update - showNewWorkspaceModal:", showNewWorkspaceModal);
        
    setShowNewWorkspaceModal(true);
    
    // Use setTimeout to log the state after the update
    setTimeout(() => {
      console.log("After state update - showNewWorkspaceModal:", showNewWorkspaceModal);
    }, 0);
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Select a Workspace</h1>
        
        {workspaces.length === 0 ? (
          <div className="text-center">
            <p className="mb-4 text-gray-600">You don't have any workspaces yet.</p>
            {/* Update your button in the return statement */}
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={(e) => {
                console.log("Inline click handler");
                console.log("Event:", e);
                handleCreateWorkspace();
              }}
            >
              Create Your First Workspace
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {workspaces.map(workspace => (
              <div 
                key={workspace.id}
                className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
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
      
      {/* Debug information */}
      <div className="fixed bottom-4 right-4 p-4 bg-gray-800 text-white text-xs rounded opacity-70">
        showNewWorkspaceModal: {String(showNewWorkspaceModal)}
      </div>
    </div>
  );
};

export default SelectWorkspace;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronDown, Settings, LogOut } from 'lucide-react';
import { useWorkspaceContext } from '../../contexts/WorkspaceContext';
import NewWorkspaceModal from './NewWorkspaceModal';
import apiClient from '../../utils/apiClient';
import { Popover } from '../UI/Popover';
import dataStore from '../../services/DataStore';


const WorkspaceSelector = () => {
  const navigate = useNavigate();
  const { currentWorkspace, setCurrentWorkspace, workspaces, setWorkspaces } = useWorkspaceContext();
  const [showNewModal, setShowNewModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch workspaces on component mount
  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      setIsLoading(true);

      const response = await apiClient.get('/api/workspaces');

      if (response.data.success) {
        const fetchedWorkspaces = response.data.data;
        setWorkspaces(fetchedWorkspaces);

        // Check if we need to auto-select a workspace
        const savedWorkspace = localStorage.getItem('currentWorkspace');
        let shouldAutoSelect = false;

        if (!currentWorkspace && fetchedWorkspaces.length > 0) {
          // No workspace selected and we have workspaces
          shouldAutoSelect = true;
        } else if (currentWorkspace && !fetchedWorkspaces.find(w => w.id === currentWorkspace.id)) {
          // Current workspace doesn't exist anymore
          shouldAutoSelect = true;
        } else if (savedWorkspace && !currentWorkspace && fetchedWorkspaces.length > 0) {
          // We have saved workspace in localStorage but not in state
          try {
            const parsed = JSON.parse(savedWorkspace);
            const exists = fetchedWorkspaces.find(w => w.id === parsed.id);
            if (exists) {
              setCurrentWorkspace(exists);
              return fetchedWorkspaces;
            } else {
              shouldAutoSelect = true;
            }
          } catch (e) {
            shouldAutoSelect = true;
          }
        }

        if (shouldAutoSelect) {
          const defaultWorkspace = fetchedWorkspaces[0];
          setCurrentWorkspace(defaultWorkspace);
          localStorage.setItem('currentWorkspace', JSON.stringify(defaultWorkspace));
          console.log('✅ Auto-selected workspace:', defaultWorkspace.name);
        }

        return fetchedWorkspaces;
      }

      return [];
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkspaceChange = (workspace) => {
    setCurrentWorkspace(workspace);
    localStorage.setItem('currentWorkspace', JSON.stringify(workspace));

    // Notify DataStore of workspace change
    dataStore.setCurrentWorkspace(workspace.id);

    setIsOpen(false);
    navigate('/dashboard');
  };

  const handleOpenSettings = () => {
    setIsOpen(false);
    navigate(`/workspace-settings/${currentWorkspace?.id}`);
  };

  return (
    <>
      <div className="relative inline-block text-left">
        <Popover
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          trigger={
            <button
              className="inline-flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-w-[180px]"
            >
              <span className="truncate max-w-[160px]">
                {isLoading ? 'Loading...' : currentWorkspace?.name || 'Select Workspace'}
              </span>
              <ChevronDown size={16} />
            </button>
          }
          content={
            <div className="py-1 w-64">
              {/* Workspace List */}
              <div className="px-3 py-2 text-xs font-semibold text-gray-500">
                YOUR WORKSPACES
              </div>
              <div className="max-h-[240px] overflow-y-auto">
                {workspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between ${workspace.id === currentWorkspace?.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                      }`}
                    onClick={() => handleWorkspaceChange(workspace)}
                  >
                    <span className="truncate">{workspace.name}</span>
                    {workspace.user_role === 'owner' && (
                      <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                        Owner
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="border-t border-gray-100 mt-2 pt-2">
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  onClick={() => {
                    setIsOpen(false);
                    setShowNewModal(true);
                  }}
                >
                  <Plus size={16} className="mr-2" />
                  Create new workspace
                </button>

                {currentWorkspace && (
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    onClick={handleOpenSettings}
                  >
                    <Settings size={16} className="mr-2" />
                    Workspace settings
                  </button>
                )}
              </div>
            </div>
          }
        />
      </div>

      {showNewModal && (
        <NewWorkspaceModal
          onClose={() => setShowNewModal(false)}
          onWorkspaceCreated={(workspace) => {
            fetchWorkspaces();
            handleWorkspaceChange(workspace);
            setShowNewModal(false);
          }}
        />
      )}
    </>
  );
};

export default WorkspaceSelector;
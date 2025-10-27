import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import dataStore from '../services/DataStore';

const WorkspaceContext = createContext({
  currentWorkspace: null,
  setCurrentWorkspace: () => { },
  workspaces: [],
  setWorkspaces: () => { },
  fetchWorkspaces: () => Promise.resolve([]),
  isLoading: false
});

export const useWorkspaceContext = () => useContext(WorkspaceContext);

export const WorkspaceProvider = ({ children }) => {
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeWorkspace();
  }, []);

  // Notify DataStore when workspace changes
  useEffect(() => {
    if (currentWorkspace) {
      console.log('🔄 WorkspaceContext: Setting workspace in DataStore:', currentWorkspace.id);
      dataStore.setCurrentWorkspace(currentWorkspace.id);
    }
  }, [currentWorkspace]);

  const initializeWorkspace = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Initializing workspace context...');

      // Fetch all available workspaces
      const response = await apiClient.get('/api/workspaces');

      if (!response.data.success) {
        console.error('❌ Failed to fetch workspaces');
        setIsLoading(false);
        return;
      }

      const fetchedWorkspaces = response.data.data;
      console.log(`✅ Fetched ${fetchedWorkspaces.length} workspace(s)`);
      setWorkspaces(fetchedWorkspaces);

      // If no workspaces exist, user needs to create one
      if (fetchedWorkspaces.length === 0) {
        console.log('⚠️ No workspaces available');
        setIsLoading(false);
        return;
      }

      // Try to restore workspace from localStorage
      const savedWorkspace = localStorage.getItem('currentWorkspace');
      
      if (savedWorkspace) {
        try {
          const parsed = JSON.parse(savedWorkspace);
          const exists = fetchedWorkspaces.find(w => w.id === parsed.id);
          
          if (exists) {
            console.log('✅ Restored workspace from localStorage:', exists.name);
            setCurrentWorkspace(exists);
            setIsLoading(false);
            return;
          } else {
            console.log('⚠️ Saved workspace no longer exists, clearing localStorage');
            localStorage.removeItem('currentWorkspace');
          }
        } catch (e) {
          console.error('❌ Error parsing saved workspace:', e);
          localStorage.removeItem('currentWorkspace');
        }
      }

      // No valid saved workspace - auto-select the first one
      console.log('🎯 Auto-selecting first available workspace');
      const defaultWorkspace = fetchedWorkspaces[0];
      setCurrentWorkspace(defaultWorkspace);
      localStorage.setItem('currentWorkspace', JSON.stringify(defaultWorkspace));
      console.log(`✅ Auto-selected workspace: ${defaultWorkspace.name}`);

    } catch (error) {
      console.error('❌ Error initializing workspace context:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkspaces = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Fetching workspaces...');

      const response = await apiClient.get('/api/workspaces');

      if (response.data.success) {
        const fetchedWorkspaces = response.data.data;
        setWorkspaces(fetchedWorkspaces);
        console.log(`✅ Fetched ${fetchedWorkspaces.length} workspace(s)`);

        // Auto-select logic when fetching workspaces manually
        if (fetchedWorkspaces.length > 0) {
          // If no current workspace, select first one
          if (!currentWorkspace) {
            const defaultWorkspace = fetchedWorkspaces[0];
            setCurrentWorkspace(defaultWorkspace);
            localStorage.setItem('currentWorkspace', JSON.stringify(defaultWorkspace));
            console.log(`✅ Auto-selected workspace: ${defaultWorkspace.name}`);
          } 
          // If current workspace no longer exists, select first one
          else if (!fetchedWorkspaces.find(w => w.id === currentWorkspace.id)) {
            const defaultWorkspace = fetchedWorkspaces[0];
            setCurrentWorkspace(defaultWorkspace);
            localStorage.setItem('currentWorkspace', JSON.stringify(defaultWorkspace));
            console.log(`✅ Current workspace gone, auto-selected: ${defaultWorkspace.name}`);
          }
        }

        return fetchedWorkspaces;
      }

      return [];
    } catch (error) {
      console.error('❌ Error fetching workspaces:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        setCurrentWorkspace,
        workspaces,
        setWorkspaces,
        fetchWorkspaces,
        isLoading
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export default WorkspaceContext;
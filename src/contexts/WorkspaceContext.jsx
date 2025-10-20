import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';

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


  const initializeWorkspace = async () => {
    try {
      setIsLoading(true);

      // ✅ FIRST: Fetch fresh workspaces from API
      const fetchedWorkspaces = await fetchWorkspaces();

      // ✅ THEN: Try to restore saved workspace (only if it still exists)
      const savedWorkspace = localStorage.getItem('currentWorkspace');
      if (savedWorkspace) {
        try {
          const parsed = JSON.parse(savedWorkspace);
          const exists = fetchedWorkspaces.find(w => w.id === parsed.id);
          if (exists) {
            setCurrentWorkspace(exists);
          } else {
            // Saved workspace no longer accessible - clear it and select first available
            localStorage.removeItem('currentWorkspace');
            if (fetchedWorkspaces.length > 0) {
              setCurrentWorkspace(fetchedWorkspaces[0]);
              localStorage.setItem('currentWorkspace', JSON.stringify(fetchedWorkspaces[0]));
            }
          }
        } catch (e) {
          console.error('Error parsing saved workspace:', e);
          localStorage.removeItem('currentWorkspace');
        }
      } else if (fetchedWorkspaces.length > 0) {
        // No saved workspace - select first one
        setCurrentWorkspace(fetchedWorkspaces[0]);
        localStorage.setItem('currentWorkspace', JSON.stringify(fetchedWorkspaces[0]));
      }
    } catch (error) {
      console.error('Error initializing workspace context:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkspaces = async () => {
    try {
      setIsLoading(true);

      const response = await apiClient.get('/api/workspaces');

      if (response.data.success) {
        const fetchedWorkspaces = response.data.data;
        setWorkspaces(fetchedWorkspaces);

        // If no current workspace is selected or the current one doesn't exist anymore,
        // select the first available one
        if (
          (!currentWorkspace && fetchedWorkspaces.length > 0) ||
          (currentWorkspace && !fetchedWorkspaces.find(w => w.id === currentWorkspace.id))
        ) {
          const defaultWorkspace = fetchedWorkspaces[0];
          setCurrentWorkspace(defaultWorkspace);
          localStorage.setItem('currentWorkspace', JSON.stringify(defaultWorkspace));
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
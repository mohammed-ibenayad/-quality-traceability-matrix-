import React, { createContext, useState, useContext, useEffect } from 'react';
import dataStore from '../services/DataStore';

// Create context
const VersionContext = createContext();

// Create provider component
export const VersionProvider = ({ children }) => {
  // Read initial version from localStorage if available, otherwise use 'unassigned'
  const initialVersion = localStorage.getItem('selectedVersion') || 'unassigned';
  const [selectedVersion, setSelectedVersion] = useState(initialVersion);
  const [versions, setVersions] = useState([]);

  // Load versions from DataStore
  useEffect(() => {
    // Load versions if available
    if (typeof dataStore.getVersions === 'function') {
      setVersions(dataStore.getVersions());
      
      // Subscribe to DataStore changes
      const unsubscribe = dataStore.subscribe(() => {
        if (typeof dataStore.getVersions === 'function') {
          setVersions(dataStore.getVersions());
        }
      });
      
      // Clean up subscription
      return () => unsubscribe();
    }
  }, []);

  // Custom setter that also saves to localStorage
  const setVersion = (version) => {
    localStorage.setItem('selectedVersion', version);
    setSelectedVersion(version);
  };

  return (
    <VersionContext.Provider
      value={{
        selectedVersion,
        setSelectedVersion: setVersion,
        versions
      }}
    >
      {children}
    </VersionContext.Provider>
  );
};

// Custom hook to use the version context
export const useVersionContext = () => {
  const context = useContext(VersionContext);
  if (context === undefined) {
    throw new Error('useVersionContext must be used within a VersionProvider');
  }
  return context;
};
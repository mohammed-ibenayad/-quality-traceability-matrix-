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
  const [isLoading, setIsLoading] = useState(true);

  // Load versions from DataStore
  useEffect(() => {
    // Function to update versions
    const updateVersions = () => {
      try {
        if (typeof dataStore.getVersions === 'function') {
          const loadedVersions = dataStore.getVersions();
          
          // Validate that we got an array
          if (Array.isArray(loadedVersions)) {
            setVersions(loadedVersions);
            console.log(`VersionContext: Loaded ${loadedVersions.length} versions`);
          } else {
            console.warn('VersionContext: getVersions() did not return an array:', typeof loadedVersions);
            setVersions([]);
          }
        } else {
          console.warn('VersionContext: dataStore.getVersions is not a function');
          setVersions([]);
        }
      } catch (error) {
        console.error('VersionContext: Error loading versions:', error);
        setVersions([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial load
    updateVersions();
    
    // Subscribe to DataStore changes
    let unsubscribe;
    try {
      unsubscribe = dataStore.subscribe(() => {
        console.log('VersionContext: DataStore change detected, updating versions...');
        updateVersions();
      });
    } catch (error) {
      console.error('VersionContext: Error subscribing to DataStore:', error);
      setIsLoading(false);
    }
    
    // Clean up subscription
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Custom setter that also saves to localStorage
  const setVersion = (version) => {
    try {
      localStorage.setItem('selectedVersion', version);
      setSelectedVersion(version);
    } catch (error) {
      console.error('VersionContext: Error saving to localStorage:', error);
      // Still update the state even if localStorage fails
      setSelectedVersion(version);
    }
  };

  return (
    <VersionContext.Provider
      value={{
        selectedVersion,
        setSelectedVersion: setVersion,
        versions,
        isLoading
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
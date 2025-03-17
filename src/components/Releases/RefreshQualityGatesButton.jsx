import React, { useState } from 'react';
import dataStore from '../../services/DataStore';
import { calculateCoverage } from '../../utils/coverage';
import { refreshQualityGates } from '../../utils/calculateQualityGates';

/**
 * Button component to refresh quality gates for all versions
 */
const RefreshQualityGatesButton = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setNotification(null);
    
    try {
      // Validate that required methods exist
      if (typeof dataStore.getRequirements !== 'function' || 
          typeof dataStore.getTestCases !== 'function' || 
          typeof dataStore.getMapping !== 'function') {
        throw new Error('Required DataStore methods missing');
      }
      
      // Check if getVersions and setVersions exist
      if (typeof dataStore.getVersions !== 'function') {
        throw new Error('DataStore.getVersions method is missing');
      }
      
      if (typeof dataStore.setVersions !== 'function') {
        throw new Error('DataStore.setVersions method is missing');
      }
      
      // Perform the refresh
      refreshQualityGates(dataStore);
      
      // Show success notification
      setNotification({
        type: 'success',
        message: 'Quality gates refreshed successfully.'
      });
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (error) {
      console.error('Error refreshing quality gates:', error);
      
      // Show error notification
      setNotification({
        type: 'error',
        message: `Error: ${error.message}`
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={`px-4 py-2 rounded text-white flex items-center ${
          isRefreshing ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isRefreshing && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {isRefreshing ? 'Refreshing...' : 'Refresh Quality Gates'}
      </button>
      
      {notification && (
        <div className={`absolute top-full mt-2 right-0 p-2 rounded text-sm shadow-md ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default RefreshQualityGatesButton;
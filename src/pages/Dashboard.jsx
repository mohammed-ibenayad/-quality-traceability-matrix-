import React, { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import DashboardCards from '../components/Dashboard/DashboardCards';
import QualityGatesTable from '../components/Dashboard/QualityGatesTable';
import RiskAreasList from '../components/Dashboard/RiskAreasList';
import MetricsChart from '../components/Dashboard/MetricsChart';
import HealthScoreGauge from '../components/Dashboard/HealthScoreGauge';
import EmptyState from '../components/common/EmptyState';
import { useRelease } from '../hooks/useRelease';
import dataStore from '../services/DataStore';
import { refreshQualityGates } from '../utils/calculateQualityGates';

// Import initial versions for the dropdown
import versionsData from '../data/versions';

const Dashboard = () => {
  // State to hold the data from DataStore
  const [requirements, setRequirements] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [mapping, setMapping] = useState({});
  const [versions, setVersions] = useState(versionsData);
  
  // Load data from DataStore
  useEffect(() => {
    // Get data from DataStore
    setRequirements(dataStore.getRequirements());
    setTestCases(dataStore.getTestCases());
    setMapping(dataStore.getMapping());
    
    // Initialize versions in DataStore if needed
    if (typeof dataStore.getVersions === 'function') {
      if (dataStore.getVersions().length === 0) {
        if (typeof dataStore.setVersions === 'function') {
          dataStore.setVersions(versionsData);
        }
      } else {
        setVersions(dataStore.getVersions());
      }
    }
    
    // Try to refresh quality gates, but don't crash if methods aren't available
    try {
      refreshQualityGates(dataStore);
    } catch (error) {
      console.warn('Failed to refresh quality gates:', error);
    }
    
    // Subscribe to DataStore changes
    const unsubscribe = dataStore.subscribe(() => {
      setRequirements(dataStore.getRequirements());
      setTestCases(dataStore.getTestCases());
      setMapping(dataStore.getMapping());
      
      // Update versions if the method exists
      if (typeof dataStore.getVersions === 'function') {
        setVersions(dataStore.getVersions());
      }
      
      // Try to refresh quality gates
      try {
        refreshQualityGates(dataStore);
      } catch (error) {
        console.warn('Failed to refresh quality gates:', error);
      }
    });
    
    // Clean up subscription
    return () => unsubscribe();
  }, []);

  // Use the custom hook to get release data - use our local versions
  const { 
    selectedVersion, 
    setSelectedVersion, 
    metrics,
    hasData
  } = useRelease(requirements, testCases, mapping, versions, 'unassigned');

  // Handler for adding a new version
  const handleAddVersion = (newVersion) => {
    try {
      // Use DataStore method if available, otherwise update local state
      if (typeof dataStore.addVersion === 'function') {
        dataStore.addVersion(newVersion);
      } else {
        // Fallback to updating local state
        setVersions(prev => [...prev, newVersion]);
      }
      
      // Switch to the newly created version
      setSelectedVersion(newVersion.id);
    } catch (error) {
      console.error("Error adding version:", error);
      // In a real app, show a notification
    }
  };

  return (
    <MainLayout 
      title="Quality Dashboard" 
      selectedVersion={selectedVersion}
      setSelectedVersion={setSelectedVersion}
      versions={versions}
      hasData={hasData}
      onAddVersion={handleAddVersion} // Pass the handler
    >
      {!hasData ? (
        // Show empty state when no data is available
        <EmptyState 
          title="Welcome to Quality Tracker" 
          message="Get started by importing your requirements and test cases to begin tracking your quality metrics."
          actionText="Import Data"
          actionPath="/import"
          icon="metrics"
        />
      ) : (
        // Show dashboard content when data is available
        <>
          <h2 className="text-2xl font-bold mb-6">
            Release Quality Overview
            {/* Show version name next to title */}
            <span className="ml-2 text-base font-normal text-gray-500">
              {selectedVersion === 'unassigned' 
                ? 'All Items (Unassigned View)' 
                : versions.find(v => v.id === selectedVersion)?.name || ''}
            </span>
          </h2>
          
          {/* Unassigned Warning Banner */}
          {selectedVersion === 'unassigned' && (
            <div className="bg-blue-100 p-4 rounded-lg mb-6 text-blue-800">
              <div className="font-medium">Showing All Items (Unassigned View)</div>
              <p className="text-sm mt-1">
                This view shows metrics for all requirements and test cases, including those that may be assigned to versions that haven't been created yet. For specific release metrics, please select a version from the dropdown.
              </p>
            </div>
          )}
          
          {/* Dashboard Cards */}
          <DashboardCards metrics={metrics} />
          
          {selectedVersion !== 'unassigned' ? (
            // Show normal dashboard content for specific releases
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Health Score Gauge */}
                <div className="bg-white rounded shadow">
                  <HealthScoreGauge score={metrics?.healthScore} />
                </div>
                
                {/* Quality Gates */}
                <div className="lg:col-span-2">
                  <QualityGatesTable qualityGates={metrics?.qualityGates} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Risk Areas */}
                <div>
                  <RiskAreasList riskAreas={metrics?.riskAreas} />
                </div>
                
                {/* Metrics Chart */}
                <div>
                  <MetricsChart data={metrics ? metrics.versionCoverage : []} />
                </div>
              </div>
            </>
          ) : (
            // For unassigned view, show a simplified dashboard
            <>
              <div className="bg-white p-6 rounded shadow mb-6">
                <h2 className="text-lg font-semibold mb-4">Coverage Overview - All Requirements</h2>
                <p className="text-gray-600 mb-4">
                  When viewing all items, detailed release metrics like health scores and quality gates are not available. 
                  Please select a specific release version to see complete quality metrics.
                </p>
                
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Some requirements reference versions that haven't been created yet. Consider creating these releases or updating the requirements.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Metrics Chart - All Requirements */}
              <div className="bg-white rounded shadow p-4">
                <h2 className="text-lg font-semibold mb-4">Test Metrics - All Requirements</h2>
                <MetricsChart data={metrics ? metrics.versionCoverage : []} />
              </div>
            </>
          )}
        </>
      )}
    </MainLayout>
  );
};

export default Dashboard;
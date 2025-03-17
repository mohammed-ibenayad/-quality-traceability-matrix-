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
    if (!dataStore.getVersions || !dataStore.getVersions().length) {
      dataStore.setVersions && dataStore.setVersions(versionsData);
    } else {
      setVersions(dataStore.getVersions());
    }
    
    // Subscribe to DataStore changes
    const unsubscribe = dataStore.subscribe(() => {
      setRequirements(dataStore.getRequirements());
      setTestCases(dataStore.getTestCases());
      setMapping(dataStore.getMapping());
      
      // Update versions if the method exists
      if (dataStore.getVersions) {
        setVersions(dataStore.getVersions());
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
  } = useRelease(requirements, testCases, mapping, versions, 'v2.2');

  // Handler for adding a new version
  const handleAddVersion = (newVersion) => {
    try {
      // Use DataStore method if available, otherwise update local state
      if (dataStore.addVersion) {
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
              {versions.find(v => v.id === selectedVersion)?.name || ''}
            </span>
          </h2>
          
          {/* Dashboard Cards */}
          <DashboardCards metrics={metrics} />
          
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
      )}
    </MainLayout>
  );
};

export default Dashboard;
import React, { useState, useEffect, useMemo } from 'react';
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
  
  // State to trigger metric recalculation
  const [refreshCounter, setRefreshCounter] = useState(0);
  
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
      console.log("DataStore change detected - updating dashboard");
      
      const updatedTestCases = dataStore.getTestCases();
      const updatedRequirements = dataStore.getRequirements();
      const updatedMapping = dataStore.getMapping();
      
      // Update local state with new data
      setRequirements(updatedRequirements);
      setTestCases(updatedTestCases);
      setMapping(updatedMapping);
      
      // Update versions if the method exists
      if (typeof dataStore.getVersions === 'function') {
        setVersions(dataStore.getVersions());
      }
      
      // Increment the refresh counter to force metrics recalculation
      setRefreshCounter(prev => prev + 1);
      
      // Force immediate quality gates recalculation
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
  // Pass refreshCounter to force recalculation when DataStore changes
  const { 
    selectedVersion, 
    setSelectedVersion, 
    metrics,
    versionCoverage,
    summary,
    hasData,
    refreshCounter: hookRefreshCounter
  } = useRelease(requirements, testCases, mapping, versions, 'unassigned', refreshCounter);

  // Calculate direct metrics on test pass rate to mirror TraceabilityMatrix
  const directMetrics = useMemo(() => {
    if (!hasData || !requirements.length || !testCases.length) return null;
    
    console.log("Computing direct metrics for dashboard display");
    
    // Filter tests based on selected version
    const versionTests = selectedVersion === 'unassigned'
      ? testCases
      : testCases.filter(tc => 
          !tc.version || tc.version === selectedVersion || tc.version === '');
    
    // Calculate pass rate - mirror the calculation in TraceabilityMatrix
    const passedTests = versionTests.filter(tc => tc.status === 'Passed').length;
    const totalTests = versionTests.length;
    const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    
    // Calculate fully verified requirements - mirror TraceabilityMatrix approach
    const versionRequirements = selectedVersion === 'unassigned'
      ? requirements
      : requirements.filter(req => req.versions && req.versions.includes(selectedVersion));
      
    const reqFullyPassed = versionRequirements.filter(req => {
      const reqTestIds = mapping[req.id] || [];
      if (reqTestIds.length === 0) return false;
      
      // For version filtering
      const filteredTestIds = selectedVersion === 'unassigned'
        ? reqTestIds
        : reqTestIds.filter(tcId => {
            const tc = testCases.find(t => t.id === tcId);
            return tc && (!tc.version || tc.version === selectedVersion || tc.version === '');
          });
          
      if (filteredTestIds.length === 0) return false;
      
      // A requirement is fully passed if all its tests are passing
      return filteredTestIds.every(tcId => {
        const tc = testCases.find(t => t.id === tcId);
        return tc && tc.status === 'Passed';
      });
    }).length;
    
    // Return computed metrics
    return {
      directPassRate: passRate,
      reqFullyPassed,
      totalRequirements: versionRequirements.length
    };
  }, [
    requirements, 
    testCases, 
    mapping, 
    selectedVersion, 
    hasData, 
    refreshCounter
  ]);

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

  // Merge direct metrics with regular metrics for display
  const displayMetrics = useMemo(() => {
    if (!metrics) return null;
    
    return {
      ...metrics,
      // Override passRate with direct calculation if available
      passRate: directMetrics?.directPassRate ?? metrics.passRate,
      // Add direct calculation of fully verified requirements to summary
      summary: {
        ...(metrics.summary || {}),
        reqFullyPassed: directMetrics?.reqFullyPassed ?? metrics.summary?.reqFullyPassed ?? 0,
        totalRequirements: directMetrics?.totalRequirements ?? metrics.totalRequirements ?? 0
      }
    };
  }, [metrics, directMetrics]);

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
          
          {/* Dashboard Cards - Use displayMetrics which includes direct calculations */}
          <DashboardCards metrics={displayMetrics} />
          
          {selectedVersion !== 'unassigned' ? (
            // Show normal dashboard content for specific releases
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Health Score Gauge */}
                <div className="bg-white rounded shadow">
                  <HealthScoreGauge score={displayMetrics?.healthScore} />
                </div>
                
                {/* Quality Gates */}
                <div className="lg:col-span-2">
                  <QualityGatesTable qualityGates={displayMetrics?.qualityGates} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Risk Areas */}
                <div>
                  <RiskAreasList riskAreas={displayMetrics?.riskAreas} />
                </div>
                
                {/* Metrics Chart */}
                <div>
                  <MetricsChart data={versionCoverage || []} />
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
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v4a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
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
                <MetricsChart data={versionCoverage || []} />
              </div>
            </>
          )}
        </>
      )}
    </MainLayout>
  );
};

export default Dashboard;
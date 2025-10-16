// src/pages/Dashboard.jsx - Updated version with fixed pass rate calculation
import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import DashboardCards from '../components/Dashboard/DashboardCards';
import QualityGatesTable from '../components/Dashboard/QualityGatesTable';
import RiskAreasList from '../components/Dashboard/RiskAreasList';
import MetricsChart from '../components/Dashboard/MetricsChart';
import HealthScoreGauge from '../components/Dashboard/HealthScoreGauge';
import EmptyState from '../components/Common/EmptyState';
import { useVersionContext } from '../context/VersionContext';
import dataStore from '../services/DataStore';
import { refreshQualityGates } from '../utils/calculateQualityGates';
import { calculateCoverage } from '../utils/coverage';
import { calculateReleaseMetrics } from '../utils/metrics';

/**
 * Helper function to check if a test case applies to a version
 * @param {Object} testCase - Test case object
 * @param {string} selectedVersion - Currently selected version
 * @returns {boolean} True if test case applies to the version
 */
const testCaseAppliesTo = (testCase, selectedVersion) => {
  if (selectedVersion === 'unassigned') return true;
  
  // Handle new format
  if (testCase.applicableVersions) {
    // Empty array means applies to all versions
    if (testCase.applicableVersions.length === 0) return true;
    return testCase.applicableVersions.includes(selectedVersion);
  }
  
  // Handle legacy format during transition
  return !testCase.version || testCase.version === selectedVersion || testCase.version === '';
};

const Dashboard = () => {
  // State to hold the data from DataStore
  const [requirements, setRequirements] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [mapping, setMapping] = useState({});
  
  // Get version context
  const { selectedVersion, versions } = useVersionContext();
  
  // State to trigger metric recalculation
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // Track if data is loaded
  const [hasData, setHasData] = useState(false);
  
  // Load data from DataStore
  useEffect(() => {
    // Get data from DataStore
    setRequirements(dataStore.getRequirements());
    setTestCases(dataStore.getTestCases());
    setMapping(dataStore.getMapping());
    setHasData(dataStore.hasData());
    
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
      setHasData(dataStore.hasData());
      
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

  // Calculate overall coverage for all requirements and test cases
  const coverage = useMemo(() => {
    if (!hasData) return [];
    console.log("Recalculating overall coverage with refreshTrigger:", refreshCounter);
    return calculateCoverage(requirements, mapping, testCases);
  }, [requirements, mapping, testCases, hasData, refreshCounter]);
  
  // Calculate version-specific coverage or all coverage if "unassigned" is selected
  const versionCoverage = useMemo(() => {
    if (!hasData) return [];
    
    // If "unassigned" is selected, return coverage for all requirements
    if (selectedVersion === 'unassigned') {
      return coverage;
    }
    
    // Otherwise, filter by the selected version
    console.log("Recalculating version-specific coverage for:", selectedVersion);
    // Pass filtered test cases to calculateCoverage
    const filteredTestCasesForCoverage = testCases.filter(tc => testCaseAppliesTo(tc, selectedVersion));
    return calculateCoverage(requirements, mapping, filteredTestCasesForCoverage);
  }, [requirements, mapping, testCases, selectedVersion, coverage, hasData, refreshCounter]);
  
  // Calculate release metrics for the selected version
  const metrics = useMemo(() => {
    if (!hasData) return null;
    
    console.log("Recalculating metrics for version:", selectedVersion);
    
    // If "unassigned" is selected, don't calculate specific metrics
    if (selectedVersion === 'unassigned') {
      return {
        version: { id: 'unassigned', name: 'Unassigned/All Items', status: 'N/A' },
        reqByPriority: {
          High: requirements.filter(req => req.priority === 'High').length,
          Medium: requirements.filter(req => req.priority === 'Medium').length,
          Low: requirements.filter(req => req.priority === 'Low').length
        },
        totalRequirements: requirements.length,
        sufficientCoveragePercentage: 0,
        passRate: 0,
        automationRate: 0,
        healthScore: 0,
        riskAreas: [],
        versionCoverage: coverage
      };
    }
    
    const calculateVersionCoverage = (versionId) => {
      // Ensure this internal function also uses the new filtering logic
      const filteredTests = testCases.filter(tc => testCaseAppliesTo(tc, versionId));
      return calculateCoverage(requirements, mapping, filteredTests);
    };
    
    const calculatedMetrics = calculateReleaseMetrics(
      selectedVersion, 
      versions, 
      requirements, 
      calculateVersionCoverage
    );
    
    // Add versionCoverage to metrics for charts
    if (calculatedMetrics) {
      calculatedMetrics.versionCoverage = versionCoverage;
    }
    
    return calculatedMetrics;
  }, [selectedVersion, versions, requirements, mapping, testCases, versionCoverage, coverage, hasData, refreshCounter]);
  
  // Summary statistics - filter by version where appropriate
  const summary = useMemo(() => {
    if (!hasData) {
      return {
        totalRequirements: 0,
        reqWithTests: 0,
        reqFullyAutomated: 0,
        reqFullyPassed: 0,
        totalTestCases: 0
      };
    }
    
    // Filter requirements based on the selected version
    let versionRequirements;
    let versionTestCases;
    
    if (selectedVersion === 'unassigned') {
      // For "unassigned", include all requirements and test cases
      versionRequirements = requirements;
      versionTestCases = testCases;
    } else {
      // Otherwise, filter by the selected version
      versionRequirements = requirements.filter(req => 
        req.versions && req.versions.includes(selectedVersion)
      );
      
      // Change 1 & 4: Update Version Test Filtering & Simplify
      versionTestCases = testCases.filter(tc => testCaseAppliesTo(tc, selectedVersion));
    }
    
    const totalRequirements = versionRequirements.length;
    
    // Count requirements with tests
    const reqWithTests = versionRequirements.filter(req => 
      (mapping[req.id] || []).some(tcId => {
        const tc = testCases.find(t => t.id === tcId);
        return tc && testCaseAppliesTo(tc, selectedVersion); // Change 5: Update Summary Metrics Version Filtering
      })
    ).length;
    
    // Count fully automated requirements
    const reqFullyAutomated = versionCoverage.filter(stat => 
      stat.automationPercentage === 100 && stat.totalTests > 0
    ).length;
    
    // Count fully passed requirements
    const reqFullyPassed = versionCoverage.filter(stat => 
      stat.passPercentage === 100 && stat.totalTests > 0
    ).length;

    return {
      totalRequirements,
      reqWithTests,
      reqFullyAutomated,
      reqFullyPassed,
      totalTestCases: versionTestCases.length
    };
  }, [requirements, versionCoverage, mapping, testCases, selectedVersion, hasData, refreshCounter]);

  // Calculate direct metrics on test pass rate to mirror TraceabilityMatrix
  const directMetrics = useMemo(() => {
    if (!hasData || !requirements.length || !testCases.length) return null;
    
    console.log("Computing direct metrics for dashboard display");
    
    // Change 1 & 4: Update Version Test Filtering & Simplify
    const versionTests = selectedVersion === 'unassigned'
      ? testCases
      : testCases.filter(tc => testCaseAppliesTo(tc, selectedVersion));
    
    // Calculate pass rate - mirror the calculation in TraceabilityMatrix
    // Calculate based on tests that have actually been executed, not all tests
    const executedTests = versionTests.filter(tc => tc.status === 'Passed' || tc.status === 'Failed');
    const passedTests = versionTests.filter(tc => tc.status === 'Passed').length;
    const executedCount = executedTests.length;
    const failedTests = versionTests.filter(tc => tc.status === 'Failed').length;
    const notExecutedTests = versionTests.filter(tc => tc.status !== 'Passed' && tc.status !== 'Failed').length;
    
    // Calculate pass rate based on executed tests only
    const passRate = executedCount > 0 ? Math.round((passedTests / executedCount) * 100) : 0;
    
    // Calculate overall test case count
    const totalTests = versionTests.length;
    
    // Calculate fully verified requirements - mirror TraceabilityMatrix approach
    const versionRequirements = selectedVersion === 'unassigned'
      ? requirements
      : requirements.filter(req => req.versions && req.versions.includes(selectedVersion));
      
    const reqFullyPassed = versionRequirements.filter(req => {
      const reqTestIds = mapping[req.id] || [];
      if (reqTestIds.length === 0) return false;
      
      // Change 2 & 4: Update Requirements Filtering for Fully Passed Calculation & Simplify
      const filteredTestIds = selectedVersion === 'unassigned'
        ? reqTestIds
        : reqTestIds.filter(tcId => {
            const tc = testCases.find(t => t.id === tcId);
            return tc && testCaseAppliesTo(tc, selectedVersion);
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
      totalRequirements: versionRequirements.length,
      passedTests,
      failedTests,
      notExecutedTests,
      totalTests,
      summary: {
        passed: passedTests,
        failed: failedTests,
        notExecuted: notExecutedTests
      }
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
      }
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
        passed: directMetrics?.summary?.passed ?? 0,
        failed: directMetrics?.summary?.failed ?? 0,
        notExecuted: directMetrics?.summary?.notExecuted ?? 0,
        reqFullyPassed: directMetrics?.reqFullyPassed ?? metrics.summary?.reqFullyPassed ?? 0,
        totalRequirements: directMetrics?.totalRequirements ?? metrics.totalRequirements ?? 0
      }
    };
  }, [metrics, directMetrics]);

  return (
    <MainLayout 
      title="Quality Dashboard" 
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
            <div className="mb-4 bg-blue-50 p-3 rounded border border-blue-100">
    <h3 className="text-sm font-medium text-blue-800 mb-2">Showing All Items (Unassigned View)</h3>
    <p className="text-xs text-blue-700 mt-1">
                This view shows metrics for all requirements and test cases, including those that may be assigned to versions that haven't been created yet. For specific release metrics, please select a version from the dropdown.
              </p>
            </div>
          )}
          
          {/* Dashboard Cards */}
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

import { useState, useMemo, useEffect } from 'react';
import { calculateCoverage } from '../utils/coverage';
import { calculateReleaseMetrics } from '../utils/metrics';
import dataStore from '../services/DataStore';

/**
 * Custom hook for managing release data and metrics
 * @param {Array} requirements - Requirements data
 * @param {Array} testCases - Test cases data
 * @param {Object} mapping - Mapping between requirements and test cases
 * @param {Array} initialVersions - Initial version data
 * @param {string} initialVersion - Initial version to select
 * @returns {Object} Release data and functions
 */
export const useRelease = (requirements, testCases, mapping, initialVersions, initialVersion) => {
  // Create state for versions so we can keep it updated from DataStore
  const [versions, setVersions] = useState(initialVersions);
  
  // Check if we have actual data
  const hasData = useMemo(() => {
    return requirements.length > 0 && versions.length > 0;
  }, [requirements, versions]);

  // Default to unassigned/all items
  const [selectedVersion, setSelectedVersion] = useState(initialVersion || 'unassigned');
  
  // When versions change, update our internal versions state
  useEffect(() => {
    // Add a subscription to the DataStore to get updated versions
    if (typeof dataStore !== 'undefined' && typeof dataStore.getVersions === 'function') {
      setVersions(dataStore.getVersions());
      
      const unsubscribe = dataStore.subscribe(() => {
        setVersions(dataStore.getVersions());
      });
      
      // Cleanup subscription
      return () => unsubscribe();
    }
  }, []);
  
  // When versions change and the selected version isn't in the list and not "unassigned", update it
  useEffect(() => {
    if (selectedVersion !== 'unassigned' && versions.length > 0 && !versions.find(v => v.id === selectedVersion)) {
      setSelectedVersion(versions[0].id);
    }
  }, [versions, selectedVersion]);
  
  // Calculate overall coverage for all requirements and test cases
  const coverage = useMemo(() => {
    if (!hasData) return [];
    return calculateCoverage(requirements, mapping, testCases);
  }, [requirements, mapping, testCases, hasData]);
  
  // Calculate version-specific coverage or all coverage if "unassigned" is selected
  const versionCoverage = useMemo(() => {
    if (!hasData) return [];
    
    // If "unassigned" is selected, return coverage for all requirements
    if (selectedVersion === 'unassigned') {
      return coverage;
    }
    
    // Otherwise, filter by the selected version
    return calculateCoverage(requirements, mapping, testCases, selectedVersion);
  }, [requirements, mapping, testCases, selectedVersion, coverage, hasData]);
  
  // Calculate release metrics for the selected version
  const metrics = useMemo(() => {
    if (!hasData) return null;
    
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
      return calculateCoverage(requirements, mapping, testCases, versionId);
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
  }, [selectedVersion, versions, requirements, mapping, testCases, versionCoverage, coverage, hasData]);
  
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
      
      // Filter test cases by selected version (empty version means applies to all)
      versionTestCases = testCases.filter(tc => 
        !tc.version || tc.version === selectedVersion || tc.version === ''
      );
    }
    
    const totalRequirements = versionRequirements.length;
    
    // Count requirements with tests
    const reqWithTests = versionRequirements.filter(req => 
      (mapping[req.id] || []).some(tcId => {
        const tc = testCases.find(t => t.id === tcId);
        return tc && (selectedVersion === 'unassigned' || !tc.version || tc.version === selectedVersion || tc.version === '');
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
  }, [requirements, versionCoverage, mapping, testCases, selectedVersion, hasData]);

  return {
    selectedVersion,
    setSelectedVersion,
    coverage,
    versionCoverage,
    metrics,
    summary,
    versions,
    hasData
  };
};
import { useState, useMemo } from 'react';
import { calculateCoverage } from '../utils/coverage';
import { calculateReleaseMetrics } from '../utils/metrics';

/**
 * Custom hook for managing release data and metrics
 * @param {Array} requirements - Requirements data
 * @param {Array} testCases - Test cases data
 * @param {Object} mapping - Mapping between requirements and test cases
 * @param {Array} versions - Version data
 * @param {string} initialVersion - Initial version to select
 * @returns {Object} Release data and functions
 */
export const useRelease = (requirements, testCases, mapping, versions, initialVersion) => {
  // Check if we have actual data
  const hasData = useMemo(() => {
    return requirements.length > 0 && versions.length > 0;
  }, [requirements, versions]);

  // Default to first version or empty string if no versions
  const defaultVersion = versions && versions.length > 0 ? versions[0].id : '';
  const [selectedVersion, setSelectedVersion] = useState(initialVersion || defaultVersion);
  
  // Calculate coverage using the utility function
  const coverage = useMemo(() => {
    if (!hasData) return [];
    return calculateCoverage(requirements, mapping, testCases);
  }, [requirements, mapping, testCases, hasData]);
  
  // Calculate version-specific coverage
  const versionCoverage = useMemo(() => {
    if (!hasData) return [];
    return calculateCoverage(requirements, mapping, testCases, selectedVersion);
  }, [requirements, mapping, testCases, selectedVersion, hasData]);
  
  // Calculate release metrics for the selected version
  const metrics = useMemo(() => {
    if (!hasData) return null;
    
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
  }, [selectedVersion, versions, requirements, mapping, testCases, versionCoverage, hasData]);
  
  // Summary statistics
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
    
    const totalRequirements = requirements.length;
    const reqWithTests = requirements.filter(req => (mapping[req.id] || []).length > 0).length;
    const reqFullyAutomated = coverage.filter(stat => 
      stat.automationPercentage === 100 && stat.totalTests > 0
    ).length;
    const reqFullyPassed = coverage.filter(stat => 
      stat.passPercentage === 100 && stat.totalTests > 0
    ).length;

    return {
      totalRequirements,
      reqWithTests,
      reqFullyAutomated,
      reqFullyPassed,
      totalTestCases: testCases.length
    };
  }, [requirements, coverage, mapping, testCases, hasData]);

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
import { useState, useMemo, useEffect } from 'react';
import { calculateCoverage } from '../utils/coverage';
import { calculateReleaseMetrics } from '../utils/metrics';
import dataStore from '../services/DataStore';

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

/**
 * Custom hook for managing release data and metrics
 * @param {Array} requirements - Requirements data
 * @param {Array} testCases - Test cases data
 * @param {Object} mapping - Mapping between requirements and test cases
 * @param {Array} initialVersions - Initial version data
 * @param {string} initialVersion - Initial version to select
 * @param {number} refreshTrigger - A counter to force recalculation of metrics
 * @returns {Object} Release data and functions
 */
export const useRelease = (requirements, testCases, mapping, initialVersions, initialVersion, refreshTrigger = 0) => {
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
  // Use refreshTrigger to force recalculation when test statuses change
  const coverage = useMemo(() => {
    if (!hasData) return [];
    console.log("Recalculating overall coverage with refreshTrigger:", refreshTrigger);
    return calculateCoverage(requirements, mapping, testCases);
  }, [requirements, mapping, testCases, hasData, refreshTrigger]);
  
  // Calculate version-specific coverage or all coverage if "unassigned" is selected
  const versionCoverage = useMemo(() => {
    if (!hasData) return [];
    
    // If "unassigned" is selected, return coverage for all requirements
    if (selectedVersion === 'unassigned') {
      return coverage;
    }
    
    // Otherwise, filter by the selected version
    console.log("Recalculating version-specific coverage for:", selectedVersion);
    // Change 3: Update Version Coverage Calculation (and Change 5: Simplify Filter Logic Using Helper)
    const allTests = testCases; // Assuming calculateCoverage needs all test cases to then filter internally
    const relevantTests = allTests.filter(tc => testCaseAppliesTo(tc, selectedVersion));

    // We need to pass the *filtered* test cases to calculateCoverage if it expects already filtered data.
    // If calculateCoverage handles filtering internally based on a versionId argument,
    // then the original call `calculateCoverage(requirements, mapping, testCases, selectedVersion)` is correct.
    // Given the prompt's structure, it implies calculateCoverage takes an optional versionId.
    // Let's assume calculateCoverage itself will use the testCaseAppliesTo logic.
    // This change is about filtering the `allTests` *before* passing to `calculateCoverage` if `calculateCoverage`
    // doesn't have its own internal filtering for `selectedVersion`.
    // Re-reading the original `calculateCoverage(requirements, mapping, testCases, selectedVersion);`
    // it implies `calculateCoverage` already handles the version filtering internally.
    // So, the change should be *inside* `calculateCoverage` if it's not already updated.
    // For `useRelease.js`, the change is about how `relevantTests` is determined if `calculateCoverage`
    // is expected to receive pre-filtered tests.

    // Given the context of `calculateCoverage(requirements, mapping, testCases, selectedVersion);`
    // it implies that `calculateCoverage` itself is responsible for filtering tests based on `selectedVersion`.
    // So, the `relevantTests` filtering block here is likely redundant or meant for internal `calculateCoverage` logic.
    // For this hook, we should ensure `calculateCoverage` is passed the correct parameters.
    // The prompt for Change 3 is a bit ambiguous if it means modifying `useMemo` of `versionCoverage`
    // to filter `allTests` *before* calling `calculateCoverage`, or if it refers to an internal `relevantTests`
    // variable *within* `calculateCoverage` function.
    // Assuming `calculateCoverage` is already updated or will be updated to use `applicableVersions`,
    // the current call `calculateCoverage(requirements, mapping, testCases, selectedVersion)` is fine.
    // However, the prompt explicitly says "REPLACE the test filtering part with: const relevantTests = allTests.filter(tc => { ... });"
    // This means we *are* pre-filtering `testCases` here before passing them to `calculateCoverage`.
    
    // Let's adjust this to filter `testCases` directly using the helper.
    const filteredTestCasesForCoverage = testCases.filter(tc => testCaseAppliesTo(tc, selectedVersion));
    return calculateCoverage(requirements, mapping, filteredTestCasesForCoverage);

  }, [requirements, mapping, testCases, selectedVersion, coverage, hasData, refreshTrigger]);
  
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
      // This internal function also needs to use the new filtering logic
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
  }, [selectedVersion, versions, requirements, mapping, testCases, versionCoverage, coverage, hasData, refreshTrigger]);
  
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
      
      // Change 1: Update Test Case Filtering Logic (and Change 5: Simplify Filter Logic Using Helper)
      versionTestCases = testCases.filter(tc => testCaseAppliesTo(tc, selectedVersion));
    }
    
    const totalRequirements = versionRequirements.length;
    
    // Count requirements with tests
    // Change 2: Update Requirements With Tests Calculation (and Change 5: Simplify Filter Logic Using Helper)
    const reqWithTests = versionRequirements.filter(req => 
      (mapping[req.id] || []).some(tcId => {
        const tc = testCases.find(t => t.id === tcId);
        return tc && testCaseAppliesTo(tc, selectedVersion);
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
  }, [requirements, versionCoverage, mapping, testCases, selectedVersion, hasData, refreshTrigger]);

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

import { PREDEFINED_QUALITY_GATES } from '../components/Releases/QualityGateSelector';
import { calculateCoverage } from './coverage';

/**
 * Calculate actual values for quality gates based on current data
 * @param {Array} qualityGates - The quality gates configuration for a release
 * @param {Array} requirements - Array of requirement objects
 * @param {Array} testCases - Array of test case objects  
 * @param {Object} mapping - Mapping between requirements and test cases
 * @param {Array} coverage - Pre-calculated coverage metrics
 * @returns {Array} Updated quality gates with actual values and status
 */
export const calculateQualityGates = (qualityGates, requirements, testCases, mapping, coverage) => {
  if (!qualityGates || !requirements || !testCases || !mapping || !coverage) {
    return qualityGates;
  }
  
  return qualityGates.map(gate => {
    // Find the corresponding gate definition
    const gateDefinition = PREDEFINED_QUALITY_GATES.find(g => g.id === gate.id);
    
    // If we can't find the definition, return the gate as is
    if (!gateDefinition) return gate;
    
    // Calculate the actual value
    const actual = gateDefinition.calculateActual(requirements, testCases, mapping, coverage);
    
    // Determine if the gate is passed based on target and actual
    // For inverted metrics (like defect density), lower is better
    let status = 'failed';
    if (gateDefinition.isInverted) {
      status = actual <= gate.target ? 'passed' : 'failed';
    } else {
      status = actual >= gate.target ? 'passed' : 'failed';
    }
    
    return {
      ...gate,
      actual,
      status
    };
  });
};

/**
 * Update quality gates for all versions
 * @param {Array} versions - Array of version objects  
 * @param {Array} requirements - Array of requirement objects
 * @param {Array} testCases - Array of test case objects
 * @param {Object} mapping - Mapping between requirements and test cases
 * @param {Function} calculateCoverage - Function to calculate coverage metrics
 * @returns {Array} Updated versions with recalculated quality gates
 */
export const updateAllVersionQualityGates = (versions, requirements, testCases, mapping, calculateCoverageFn) => {
  if (!versions || !requirements || !testCases || !mapping) {
    return versions;
  }
  
  // Use provided function or imported calculateCoverage
  const coverageCalculator = calculateCoverageFn || calculateCoverage;
  
  return versions.map(version => {
    // Filter requirements for this version
    const versionRequirements = requirements.filter(req => 
      req.versions && req.versions.includes(version.id)
    );
    
    // Calculate coverage metrics for this version
    const versionCoverage = coverageCalculator(versionRequirements, mapping, testCases, version.id);
    
    // Update quality gates
    const updatedGates = calculateQualityGates(
      version.qualityGates,
      versionRequirements,
      testCases,
      mapping,
      versionCoverage
    );
    
    return {
      ...version,
      qualityGates: updatedGates
    };
  });
};

/**
 * Update the DataStore with recalculated quality gates
 * @param {Object} dataStore - The DataStore service
 */
export const refreshQualityGates = (dataStore) => {
  try {
    // Check if required methods exist
    if (!dataStore.getRequirements || !dataStore.getTestCases || !dataStore.getMapping) {
      console.warn('Required DataStore methods missing');
      return;
    }
    
    // Get data from DataStore
    const requirements = dataStore.getRequirements();
    const testCases = dataStore.getTestCases();
    const mapping = dataStore.getMapping();
    
    // Check if getVersions exists before calling it
    let versions = [];
    if (typeof dataStore.getVersions === 'function') {
      versions = dataStore.getVersions();
    } else if (typeof dataStore.versions !== 'undefined') {
      versions = dataStore.versions;
    } else {
      console.warn('DataStore does not have getVersions method or versions property');
      return;
    }
    
    const updatedVersions = updateAllVersionQualityGates(
      versions,
      requirements,
      testCases,
      mapping,
      calculateCoverage
    );
    
    // Update versions in DataStore if method exists
    if (typeof dataStore.setVersions === 'function') {
      dataStore.setVersions(updatedVersions);
    } else {
      console.warn('DataStore does not have setVersions method');
    }
  } catch (error) {
    console.error('Error refreshing quality gates:', error);
  }
};

export default {
  calculateQualityGates,
  updateAllVersionQualityGates,
  refreshQualityGates
};
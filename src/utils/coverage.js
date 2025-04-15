/**
 * Calculate coverage statistics for requirements
 * @param {Array} requirements - Array of requirement objects
 * @param {Object} mapping - Object mapping requirement IDs to test case IDs
 * @param {Array} testCases - Array of test case objects
 * @param {string} versionFilter - Optional version to filter by
 * @returns {Array} Coverage statistics for each requirement
 */
export const calculateCoverage = (requirements, mapping, testCases, versionFilter = null) => {
  const stats = requirements.map(req => {
    // Filter requirements by version if specified
    if (versionFilter && versionFilter !== 'unassigned' && (!req.versions || !req.versions.includes(versionFilter))) {
      return null;
    }
    
    const linkedTests = mapping[req.id] || [];
    
    // Filter test cases by version if specified
    const versionTests = versionFilter && versionFilter !== 'unassigned'
      ? linkedTests.filter(tcId => {
          const tc = testCases.find(t => t.id === tcId);
          return tc && (!tc.version || tc.version === versionFilter || tc.version === '');
        }) 
      : linkedTests;
    
    const totalTests = versionTests.length;
    const automatedTests = versionTests.filter(tcId => {
      const tc = testCases.find(tc => tc.id === tcId);
      return tc && tc.automationStatus === 'Automated';
    }).length;
    
    const passedTests = versionTests.filter(tcId => {
      const tc = testCases.find(tc => tc.id === tcId);
      return tc && tc.status === 'Passed';
    }).length;
    
    // Check if meets minimum required test cases
    const meetsMinimum = totalTests >= req.minTestCases;
    
    return {
      reqId: req.id,
      totalTests,
      automatedTests,
      passedTests,
      minTestCases: req.minTestCases,
      testDepthFactor: req.testDepthFactor,
      meetsMinimum,
      coverageRatio: Math.round((totalTests / req.minTestCases) * 100),
      automationPercentage: totalTests ? Math.round((automatedTests / totalTests) * 100) : 0,
      passPercentage: totalTests ? Math.round((passedTests / totalTests) * 100) : 0,
      priority: req.priority,
      businessImpact: req.businessImpact
    };
  }).filter(stat => stat !== null); // Remove filtered out requirements

  return stats;
};

/**
 * Get the status of a cell in the traceability matrix
 * @param {string} reqId - Requirement ID
 * @param {string} tcId - Test case ID
 * @param {Array} testCases - Array of test case objects
 * @returns {string} Status of the cell ('passed', 'failed', 'not-run', or 'none')
 */
export const getCellStatus = (reqId, tcId, testCases) => {
  const testCase = testCases.find(tc => tc.id === tcId);
  if (!testCase) return 'none';
  
  if (testCase.status === 'Passed') return 'passed';
  if (testCase.status === 'Failed') return 'failed';
  return 'not-run';
};
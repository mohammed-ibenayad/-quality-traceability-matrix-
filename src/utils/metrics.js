/**
 * Calculate release metrics for the dashboard
 * @param {string} versionId - The version ID to calculate metrics for
 * @param {Array} versions - Array of version objects
 * @param {Array} requirements - Array of requirement objects
 * @param {Function} calculateCoverage - Function to calculate coverage metrics
 * @returns {Object} Calculated metrics for the specified version
 */
export const calculateReleaseMetrics = (versionId, versions, requirements, calculateCoverage) => {
  const versionData = versions.find(v => v.id === versionId);
  if (!versionData) return null;
  
  // Filter requirements for this version
  const versionRequirements = requirements.filter(req => 
    req.versions && req.versions.includes(versionId)
  );
  
  // Use the calculateCoverage function to get coverage metrics for this version
  const versionCoverage = calculateCoverage(versionId);
  
  // Count requirements by priority
  const reqByPriority = {
    High: versionRequirements.filter(req => req.priority === 'High').length,
    Medium: versionRequirements.filter(req => req.priority === 'Medium').length,
    Low: versionRequirements.filter(req => req.priority === 'Low').length
  };
  
  // Count requirements with sufficient tests
  const reqWithSufficientTests = versionCoverage.filter(c => c.meetsMinimum).length;
  
  // Overall metrics
  const totalRequirements = versionRequirements.length;
  const sufficientCoveragePercentage = totalRequirements 
    ? Math.round((reqWithSufficientTests / totalRequirements) * 100) 
    : 0;
  
  // Test pass rate
  const totalTestsForVersion = versionCoverage.reduce((sum, c) => sum + c.totalTests, 0);
  const totalPassingTests = versionCoverage.reduce((sum, c) => sum + c.passedTests, 0);
  const passRate = totalTestsForVersion 
    ? Math.round((totalPassingTests / totalTestsForVersion) * 100)
    : 0;
  
  // Automation rate
  const totalAutomatedTests = versionCoverage.reduce((sum, c) => sum + c.automatedTests, 0);
  const automationRate = totalTestsForVersion
    ? Math.round((totalAutomatedTests / totalTestsForVersion) * 100)
    : 0;
  
  // Calculate overall test case coverage
  const totalMinRequiredTests = versionCoverage.reduce((sum, c) => sum + c.minTestCases, 0);
  const overallTestCaseCoverage = totalMinRequiredTests
    ? Math.round((totalTestsForVersion / totalMinRequiredTests) * 100)
    : 0;
  
  // Calculate manual test rate
  const totalManualTests = totalTestsForVersion - totalAutomatedTests;
  const manualTestRate = totalTestsForVersion
    ? Math.round((totalManualTests / totalTestsForVersion) * 100)
    : 0;
  
  // Calculate overall health score 
  const healthFactors = [
    { weight: 0.3, value: passRate },                  // Pass rate (30%)
    { weight: 0.25, value: sufficientCoveragePercentage }, // Requirements with enough tests (25%)
    { weight: 0.25, value: overallTestCaseCoverage },  // Test case coverage (25%)
    { weight: 0.2, value: automationRate }            // Automation rate (20%)
  ];
  
  const healthScore = healthFactors.reduce(
    (score, factor) => score + (factor.weight * factor.value), 
    0
  );
  
  // Find risk areas (requirements with high impact but failing tests or insufficient coverage)
  const riskAreas = versionCoverage
    .filter(c => {
      const req = requirements.find(r => r.id === c.reqId);
      return req && req.businessImpact >= 4 && (c.passPercentage < 100 || !c.meetsMinimum);
    })
    .sort((a, b) => {
      const reqA = requirements.find(r => r.id === a.reqId);
      const reqB = requirements.find(r => r.id === b.reqId);
      // Sort by business impact, then by pass percentage (ascending)
      return (reqB?.businessImpact || 0) - (reqA?.businessImpact || 0) || 
             a.passPercentage - b.passPercentage;
    })
    .slice(0, 5) // Top 5 risk areas
    .map(c => {
      const req = requirements.find(r => r.id === c.reqId);
      return {
        id: c.reqId,
        name: req?.name || '',
        reason: c.passPercentage < 100 ? 'Failing Tests' : 'Insufficient Coverage',
        impact: req?.businessImpact || 0,
        coverage: c.coverageRatio,
        passRate: c.passPercentage
      };
    });
  
  return {
    version: versionData,
    reqByPriority,
    totalRequirements,
    sufficientCoveragePercentage,
    passRate,
    automationRate,
    manualTestRate,
    overallTestCaseCoverage,
    totalMinRequiredTests,
    totalTestsForVersion,
    totalAutomatedTests,
    totalManualTests,
    healthScore,
    riskAreas,
    qualityGates: versionData.qualityGates,
    daysToRelease: versionData.status === 'In Progress' 
      ? Math.ceil((new Date(versionData.releaseDate) - new Date()) / (1000 * 60 * 60 * 24))
      : 0,
    versionCoverage
  };
};
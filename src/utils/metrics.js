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
    
    const versionRequirements = requirements.filter(req => req.versions.includes(versionId));
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
    
    // Calculate overall health score (simplified version)
    const healthFactors = [
      { weight: 0.4, value: passRate },
      { weight: 0.3, value: sufficientCoveragePercentage },
      { weight: 0.3, value: automationRate }
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
      healthScore,
      riskAreas,
      qualityGates: versionData.qualityGates,
      daysToRelease: versionData.status === 'In Progress' 
        ? Math.ceil((new Date(versionData.releaseDate) - new Date()) / (1000 * 60 * 60 * 24))
        : 0
    };
  };
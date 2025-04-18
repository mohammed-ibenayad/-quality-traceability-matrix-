import React from 'react';
import TDFInfoTooltip from '../Common/TDFInfoTooltip';

const DashboardCards = ({ metrics }) => {
  // Return null if no metrics
  if (!metrics) return null;
  
  // Calculate overall test case coverage percentage
  const totalMinTestCases = metrics.versionCoverage?.reduce((sum, cov) => sum + cov.minTestCases, 0) || 0;
  const totalActualTestCases = metrics.versionCoverage?.reduce((sum, cov) => sum + cov.totalTests, 0) || 0;
  const overallTestCaseCoverage = totalMinTestCases > 0 
    ? Math.round((totalActualTestCases / totalMinTestCases) * 100) 
    : 0;
  
  // Calculate manual test rate
  const totalManualTests = metrics.versionCoverage?.reduce(
    (sum, cov) => sum + (cov.totalTests - cov.automatedTests), 0
  ) || 0;
  const manualTestRate = totalActualTestCases > 0 
    ? Math.round((totalManualTests / totalActualTestCases) * 100)
    : 0;
  
  return (
    <div className="mb-6">
      {/* Requirements-focused metrics */}
      <h3 className="text-sm font-medium text-gray-700 mb-2">Requirements Coverage</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-600 mb-1">Requirements</div>
          <div className="flex justify-between items-end">
            <div className="text-2xl font-bold">{metrics.totalRequirements}</div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">{metrics.reqByPriority.High} High</span>
              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">{metrics.reqByPriority.Medium} Med</span>
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{metrics.reqByPriority.Low} Low</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-600 mb-1 flex items-center">
            Test Depth Coverage
            <TDFInfoTooltip />
          </div>
          <div className="flex flex-col">
            <div className="text-2xl font-bold">{metrics.sufficientCoveragePercentage}%</div>
            <div className="text-xs text-gray-500">Requirements with sufficient tests</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${
                  metrics.sufficientCoveragePercentage >= 90 ? 'bg-green-500' :
                  metrics.sufficientCoveragePercentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{width: `${metrics.sufficientCoveragePercentage}%`}}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-600 mb-1">Overall Test Coverage</div>
          <div className="flex flex-col">
            <div className="text-2xl font-bold">{overallTestCaseCoverage}%</div>
            <div className="text-xs text-gray-500">
              {totalActualTestCases} / {totalMinTestCases} required tests
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${
                  overallTestCaseCoverage >= 90 ? 'bg-green-500' :
                  overallTestCaseCoverage >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{width: `${overallTestCaseCoverage}%`}}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Test case-focused metrics */}
      <h3 className="text-sm font-medium text-gray-700 mb-2">Test Execution Status</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-600 mb-1">Test Pass Rate</div>
          <div className="flex flex-col">
            <div className="text-2xl font-bold">{metrics.passRate}%</div>
            <div className="text-xs text-gray-500">Tests passing</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${
                  metrics.passRate >= 90 ? 'bg-green-500' :
                  metrics.passRate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{width: `${metrics.passRate}%`}}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-600 mb-1">Automation Rate</div>
          <div className="flex flex-col">
            <div className="text-2xl font-bold">{metrics.automationRate}%</div>
            <div className="text-xs text-gray-500">
              {metrics.totalAutomatedTests || 0} / {metrics.totalTestsForVersion || 0} tests are automated
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${
                  metrics.automationRate >= 80 ? 'bg-green-500' :
                  metrics.automationRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{width: `${metrics.automationRate}%`}}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-600 mb-1">Manual Test Rate</div>
          <div className="flex flex-col">
            <div className="text-2xl font-bold">{manualTestRate}%</div>
            <div className="text-xs text-gray-500">
              {totalManualTests || 0} / {totalActualTestCases || 0} tests are manual
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${
                  manualTestRate <= 20 ? 'bg-green-500' :
                  manualTestRate <= 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{width: `${manualTestRate}%`}}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Release countdown (if applicable) */}
      {metrics.version && metrics.version.status === 'In Progress' && (
        <div className="bg-white p-4 rounded shadow col-span-1 md:col-span-2 lg:col-span-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-600 mb-1">Release Countdown</div>
              <div className="text-xl font-bold">{metrics.daysToRelease} days until release</div>
              <div className="text-xs text-gray-500">Release Date: {new Date(metrics.version.releaseDate).toLocaleDateString()}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Quality Health Score</div>
              <div className={`text-xl font-bold ${
                metrics.healthScore >= 80 ? 'text-green-600' :
                metrics.healthScore >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {Math.round(metrics.healthScore)}/100
              </div>
              <div className={`text-xs ${
                metrics.healthScore >= 80 ? 'text-green-600' :
                metrics.healthScore >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {metrics.healthScore >= 80 ? 'Healthy' :
                 metrics.healthScore >= 60 ? 'Needs Attention' : 'At Risk'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardCards;
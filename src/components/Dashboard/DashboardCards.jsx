import React from 'react';

const DashboardCards = ({ metrics }) => {
  // Return null if no metrics
  if (!metrics) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
        <div className="text-sm text-gray-600 mb-1">Coverage</div>
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
          <div className="text-xs text-gray-500">Tests automated</div>
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
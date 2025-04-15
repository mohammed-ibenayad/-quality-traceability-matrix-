import React from 'react';

const CoverageIndicator = ({ coverage }) => {
  if (!coverage || coverage.totalTests === 0) {
    return <span className="text-red-500 text-xs">No Coverage</span>;
  }

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-1">
        <div className="text-xs font-medium">Coverage:</div>
        <div className={`text-xs font-semibold ${
          coverage.meetsMinimum 
            ? 'text-green-600' 
            : 'text-orange-600'
        }`}>
          {coverage.coverageRatio}% of required
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div 
          className={`h-2 rounded-full ${
            coverage.meetsMinimum 
              ? 'bg-green-600' 
              : 'bg-orange-500'
          }`}
          style={{width: `${Math.min(coverage.coverageRatio || 0, 100)}%`}}
        ></div>
      </div>
      
      <div className="text-xs mb-1">Auto: {coverage.automationPercentage}%</div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div 
          className="bg-blue-600 h-1.5 rounded-full" 
          style={{width: `${coverage.automationPercentage}%`}}
        ></div>
      </div>
      
      <div className="text-xs mt-1 mb-1">Pass: {coverage.passPercentage}%</div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div 
          className="bg-green-600 h-1.5 rounded-full" 
          style={{width: `${coverage.passPercentage}%`}}
        ></div>
      </div>
    </div>
  );
};

export default CoverageIndicator;
import React from 'react';

const HealthScoreGauge = ({ score }) => {
  // If no score is provided, show a placeholder state
  if (score === undefined || score === null) {
    return (
      <div className="flex flex-col items-center p-4">
        <div className="text-xl font-bold mb-2">Quality Health Score</div>
        
        {/* Empty Gauge Component */}
        <div className="relative w-48 h-24 overflow-hidden mb-2">
          {/* Gauge Background (grayscale) */}
          <div className="absolute w-48 h-48 bg-gray-200 rounded-full bottom-0"></div>
          
          {/* Center Point */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
            <div className="w-4 h-4 bg-white border-2 border-gray-400 rounded-full -mt-2 ml-[-6px]"></div>
          </div>
        </div>
        
        {/* Empty Score Display */}
        <div className="text-3xl font-bold text-gray-400">--</div>
        
        {/* Placeholder Text */}
        <div className="text-sm font-medium text-gray-400">
          No data available
        </div>
      </div>
    );
  }
  
  // Default to 0 if score is provided but falsy (like 0)
  const healthScore = Math.round(score || 0);
  
  // Determine color based on score
  const getColor = () => {
    if (healthScore >= 80) return '#4CAF50'; // Green
    if (healthScore >= 60) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };
  
  // Calculate the position of the needle
  const needleRotation = (healthScore / 100) * 180 - 90;
  
  return (
    <div className="flex flex-col items-center p-4">
      <div className="text-xl font-bold mb-2">Quality Health Score</div>
      
      {/* Gauge Component */}
      <div className="relative w-48 h-24 overflow-hidden mb-2">
        {/* Gauge Background */}
        <div className="absolute w-48 h-48 bg-gray-200 rounded-full bottom-0"></div>
        
        {/* Colored Segments */}
        <div className="absolute w-48 h-48 rounded-full bottom-0 overflow-hidden">
          {/* Red Zone (0-60%) */}
          <div 
            className="absolute w-48 h-48 bg-red-500 rounded-full bottom-0"
            style={{ clipPath: 'polygon(50% 50%, 0 0, 0 50%, 50% 50%)' }}
          ></div>
          
          {/* Orange Zone (60-80%) */}
          <div 
            className="absolute w-48 h-48 bg-orange-500 rounded-full bottom-0"
            style={{ clipPath: 'polygon(50% 50%, 0 0, 50% 0, 50% 50%)' }}
          ></div>
          
          {/* Green Zone (80-100%) */}
          <div 
            className="absolute w-48 h-48 bg-green-500 rounded-full bottom-0"
            style={{ clipPath: 'polygon(50% 50%, 50% 0, 100% 0, 50% 50%)' }}
          ></div>
        </div>
        
        {/* Center Point and Needle */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
          {/* Needle */}
          <div 
            className="relative h-20 w-1 bg-gray-700 rounded origin-bottom"
            style={{ transform: `rotate(${needleRotation}deg)` }}
          ></div>
          
          {/* Center Point */}
          <div className="w-4 h-4 bg-white border-2 border-gray-700 rounded-full -mt-2 ml-[-6px]"></div>
        </div>
      </div>
      
      {/* Score Display */}
      <div className={`text-3xl font-bold`} style={{ color: getColor() }}>
        {healthScore}
      </div>
      
      {/* Rating Text */}
      <div className={`text-sm font-medium`} style={{ color: getColor() }}>
        {healthScore >= 80 ? 'Excellent' : 
         healthScore >= 60 ? 'Needs Attention' : 'At Risk'}
      </div>
    </div>
  );
};

export default HealthScoreGauge;
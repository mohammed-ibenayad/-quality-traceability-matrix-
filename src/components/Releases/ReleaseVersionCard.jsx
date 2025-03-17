import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Component for displaying a release version card
 */
const ReleaseVersionCard = ({ version, onSelect, isSelected }) => {
  // Calculate days to release
  const daysToRelease = version.status === 'In Progress' 
    ? Math.ceil((new Date(version.releaseDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  
  // Determine status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Released': return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Planned': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Deprecated': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  // Calculate quality gates status
  const passedGates = version.qualityGates?.filter(gate => gate.status === 'passed').length || 0;
  const totalGates = version.qualityGates?.length || 0;
  const gatePercentage = totalGates ? Math.round((passedGates / totalGates) * 100) : 0;
  
  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
        isSelected 
          ? 'border-blue-500 shadow-md transform scale-[1.02]' 
          : 'border-transparent hover:border-gray-200'
      }`}
      onClick={() => onSelect(version.id)}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{version.name}</h3>
            <p className="text-sm text-gray-500">{version.id}</p>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(version.status)}`}>
            {version.status}
          </span>
        </div>
        
        <div className="mb-3">
          <div className="text-sm text-gray-600 mb-1">Release Date</div>
          <div className="font-medium">
            {new Date(version.releaseDate).toLocaleDateString()}
            {daysToRelease !== null && (
              <span className="ml-2 text-sm font-normal text-blue-600">
                ({daysToRelease} days remaining)
              </span>
            )}
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <div className="text-sm text-gray-600">Quality Gates</div>
            <div className="text-sm font-medium">
              {passedGates}/{totalGates}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                gatePercentage >= 80 ? 'bg-green-500' :
                gatePercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${gatePercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Link
            to={`/matrix?version=${version.id}`}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
          >
            View Matrix
          </Link>
          <Link
            to="/"
            className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
          >
            View Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ReleaseVersionCard;
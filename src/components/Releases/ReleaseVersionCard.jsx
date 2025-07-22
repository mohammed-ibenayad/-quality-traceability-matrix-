import React from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Eye } from 'lucide-react';

/**
 * Component for displaying a release version card
 */
const ReleaseVersionCard = ({ version, onSelect, onDelete, onEdit, isSelected }) => {
  // Early return if version is not provided or invalid
  if (!version || typeof version !== 'object') {
    console.error('ReleaseVersionCard: Invalid version object provided:', version);
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
        <div className="text-red-800 text-sm font-medium">Invalid Version Data</div>
        <div className="text-red-600 text-xs mt-1">Version object is missing or invalid</div>
      </div>
    );
  }

  // Provide defaults for missing properties
  const safeVersion = {
    id: version.id || 'unknown',
    name: version.name || 'Unnamed Version',
    status: version.status || 'Planned',
    releaseDate: version.releaseDate || new Date().toISOString(),
    qualityGates: version.qualityGates || [],
    description: version.description || '',
    ...version
  };

  // Calculate days to release
  const daysToRelease = safeVersion.status === 'In Progress' 
    ? Math.ceil((new Date(safeVersion.releaseDate) - new Date()) / (1000 * 60 * 60 * 24))
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
  const qualityGates = Array.isArray(safeVersion.qualityGates) ? safeVersion.qualityGates : [];
  const passedGates = qualityGates.filter(gate => gate && gate.status === 'passed').length;
  const totalGates = qualityGates.length;
  const gatePercentage = totalGates ? Math.round((passedGates / totalGates) * 100) : 0;
  
  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border-2 transition-all cursor-pointer ${
        isSelected 
          ? 'border-blue-500 shadow-md transform scale-[1.02]' 
          : 'border-transparent hover:border-gray-200'
      }`}
      onClick={() => onSelect && onSelect(safeVersion.id)}
    >
      <div className="p-4">
        {/* Header with version info and actions */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{safeVersion.name}</h3>
            <p className="text-sm text-gray-500">{safeVersion.id}</p>
          </div>
          
          {/* Action buttons - styled consistently with other pages */}
          <div className="flex items-center space-x-1 ml-2">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(safeVersion);
                }}
                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                title="Edit version"
              >
                <Edit size={16} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(safeVersion.id);
                }}
                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                title="Delete version"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Status badge */}
        <div className="mb-3">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(safeVersion.status)}`}>
            {safeVersion.status}
          </span>
        </div>
        
        {/* Release date info */}
        <div className="mb-3">
          <div className="text-sm text-gray-600 mb-1">Release Date</div>
          <div className="font-medium">
            {safeVersion.releaseDate ? new Date(safeVersion.releaseDate).toLocaleDateString() : 'Not set'}
            {daysToRelease !== null && daysToRelease > 0 && (
              <span className="ml-2 text-sm font-normal text-blue-600">
                ({daysToRelease} days remaining)
              </span>
            )}
            {daysToRelease !== null && daysToRelease <= 0 && (
              <span className="ml-2 text-sm font-normal text-red-600">
                (Overdue by {Math.abs(daysToRelease)} days)
              </span>
            )}
          </div>
        </div>
        
        {/* Quality gates progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <div className="text-sm text-gray-600">Quality Gates</div>
            <div className="text-sm font-medium">
              {passedGates}/{totalGates}
            </div>
          </div>
          {totalGates > 0 ? (
            <>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    gatePercentage >= 80 ? 'bg-green-500' :
                    gatePercentage >= 60 ? 'bg-yellow-500' :
                    gatePercentage >= 40 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${gatePercentage}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {gatePercentage}% passed
              </div>
            </>
          ) : (
            <div className="text-xs text-gray-500 mt-1 italic">
              No quality gates defined
            </div>
          )}
        </div>
        
        {/* Description (if available) */}
        {safeVersion.description && (
          <div className="text-sm text-gray-600 truncate mb-3" title={safeVersion.description}>
            {safeVersion.description}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-end space-x-2">
          <Link
            to={`/matrix?version=${safeVersion.id}`}
            className="inline-flex items-center px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Eye className="mr-1" size={12} />
            Matrix
          </Link>
          <Link
            to={`/?version=${safeVersion.id}`}
            className="inline-flex items-center px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Eye className="mr-1" size={12} />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ReleaseVersionCard;
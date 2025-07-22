import React from 'react';
import ReleaseVersionCard from './ReleaseVersionCard';

/**
 * Component for displaying a grid of release versions
 */
const ReleaseVersionGrid = ({ versions, selectedVersion, onSelectVersion, onDeleteVersion, onEditVersion }) => {
  // Defensive check for versions array
  if (!Array.isArray(versions)) {
    console.error('ReleaseVersionGrid: versions prop must be an array, received:', typeof versions, versions);
    return (
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
        <div className="text-yellow-800 font-medium mb-2">Invalid Versions Data</div>
        <div className="text-yellow-700 text-sm">
          Expected an array of versions, but received: {typeof versions}
        </div>
      </div>
    );
  }

  // Handle empty versions array
  if (versions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 text-lg mb-2">No versions available</div>
        <div className="text-gray-400 text-sm">Create your first release version to get started</div>
      </div>
    );
  }

  // Filter out any null or undefined versions and log warnings
  const validVersions = versions.filter((version, index) => {
    if (!version) {
      console.warn(`ReleaseVersionGrid: Found null/undefined version at index ${index}`);
      return false;
    }
    if (typeof version !== 'object') {
      console.warn(`ReleaseVersionGrid: Found non-object version at index ${index}:`, version);
      return false;
    }
    if (!version.id) {
      console.warn(`ReleaseVersionGrid: Found version without ID at index ${index}:`, version);
      return false;
    }
    return true;
  });

  // Sort versions by status and release date (with null safety)
  const sortedVersions = [...validVersions].sort((a, b) => {
    // Sort by status first (with fallback)
    const statusOrder = { 'In Progress': 1, 'Planned': 2, 'Released': 3, 'Deprecated': 4 };
    const statusA = a.status || 'Planned';
    const statusB = b.status || 'Planned';
    const statusDiff = (statusOrder[statusA] || 5) - (statusOrder[statusB] || 5);
    
    if (statusDiff !== 0) return statusDiff;
    
    // Then sort by release date (newest first, with null safety)
    const dateA = a.releaseDate ? new Date(a.releaseDate) : new Date();
    const dateB = b.releaseDate ? new Date(b.releaseDate) : new Date();
    return dateB - dateA;
  });

  // Show warning if some versions were filtered out
  if (validVersions.length !== versions.length) {
    console.warn(`ReleaseVersionGrid: Filtered out ${versions.length - validVersions.length} invalid versions`);
  }
  
  return (
    <div className="space-y-4">
      {/* Warning message if some versions were invalid */}
      {validVersions.length !== versions.length && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="text-yellow-800 text-sm">
              Warning: {versions.length - validVersions.length} invalid version(s) were excluded from display.
              Check the console for details.
            </div>
          </div>
        </div>
      )}

      {/* Grid of version cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedVersions.map((version) => (
          <ReleaseVersionCard
            key={version.id}
            version={version}
            onSelect={onSelectVersion}
            onDelete={onDeleteVersion}
            onEdit={onEditVersion}
            isSelected={version.id === selectedVersion}
          />
        ))}
      </div>
    </div>
  );
};

export default ReleaseVersionGrid;
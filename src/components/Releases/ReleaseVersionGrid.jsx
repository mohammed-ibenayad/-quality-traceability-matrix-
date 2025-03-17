import React from 'react';
import ReleaseVersionCard from './ReleaseVersionCard';

/**
 * Component for displaying a grid of release versions
 */
const ReleaseVersionGrid = ({ versions, selectedVersion, onSelectVersion }) => {
  // Sort versions by status and release date
  const sortedVersions = [...versions].sort((a, b) => {
    // Sort by status first
    const statusOrder = { 'In Progress': 1, 'Planned': 2, 'Released': 3, 'Deprecated': 4 };
    const statusDiff = (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
    
    if (statusDiff !== 0) return statusDiff;
    
    // Then sort by release date (newest first)
    return new Date(b.releaseDate) - new Date(a.releaseDate);
  });
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedVersions.map((version) => (
        <ReleaseVersionCard
          key={version.id}
          version={version}
          onSelect={onSelectVersion}
          isSelected={version.id === selectedVersion}
        />
      ))}
    </div>
  );
};

export default ReleaseVersionGrid;
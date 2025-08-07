// Create new component: src/components/Common/VersionSelector.jsx
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search, Layers, Star } from 'lucide-react';

const VersionSelector = ({ 
  selectedVersion, 
  versions, 
  onVersionChange, 
  className = "",
  showCounts = false,
  testCaseCounts = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef(null);

  // Calculate dropdown position
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 320) // Minimum 320px width
      });
    }
  }, [isOpen]);

  // Filter versions based on search
  const filteredVersions = versions.filter(version =>
    version.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    version.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group versions by status for better organization
  const groupedVersions = {
    active: filteredVersions.filter(v => v.status === 'Active' || v.status === 'In Progress'),
    planned: filteredVersions.filter(v => v.status === 'Planned'),
    released: filteredVersions.filter(v => v.status === 'Released'),
    other: filteredVersions.filter(v => !['Active', 'In Progress', 'Planned', 'Released'].includes(v.status))
  };

  // Remove empty groups
  Object.keys(groupedVersions).forEach(key => {
    if (groupedVersions[key].length === 0) {
      delete groupedVersions[key];
    }
  });

  const getSelectedVersionInfo = () => {
    if (selectedVersion === 'unassigned') {
      return { name: 'All Items', id: 'unassigned', icon: '📊' };
    }
    const version = versions.find(v => v.id === selectedVersion);
    return version ? { 
      name: version.name, 
      id: version.id, 
      icon: version.status === 'Active' ? '🚀' : version.status === 'Released' ? '✅' : '📋'
    } : { name: 'Select Version', id: '', icon: '📦' };
  };

  const selectedInfo = getSelectedVersionInfo();

  const handleVersionSelect = (versionId) => {
    onVersionChange(versionId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const getGroupIcon = (groupKey) => {
    switch (groupKey) {
      case 'active': return '🚀';
      case 'planned': return '📋';
      case 'released': return '✅';
      default: return '📦';
    }
  };

  const getGroupTitle = (groupKey) => {
    switch (groupKey) {
      case 'active': return 'Active Versions';
      case 'planned': return 'Planned Versions';
      case 'released': return 'Released Versions';
      default: return 'Other Versions';
    }
  };

  const DropdownContent = () => (
    <div 
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2 max-h-96 flex flex-col"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width}px`
      }}
    >
      {/* Search Header */}
      <div className="px-3 pb-2 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Search versions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* All Items Option */}
        <div className="px-2 pt-2">
          <button
            onClick={() => handleVersionSelect('unassigned')}
            className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between hover:bg-blue-50 ${
              selectedVersion === 'unassigned' ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700'
            }`}
          >
            <div className="flex items-center">
              <span className="mr-2">📊</span>
              <div>
                <div className="font-medium">All Items</div>
              </div>
            </div>
            {selectedVersion === 'unassigned' && <Check size={16} className="text-blue-600" />}
          </button>
        </div>

        {/* Separator */}
        <div className="border-t border-gray-100 my-2"></div>

        {/* Grouped Versions */}
        {Object.keys(groupedVersions).length > 0 ? (
          Object.entries(groupedVersions).map(([groupKey, groupVersions]) => (
            <div key={groupKey} className="px-2 mb-3">
              <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center">
                <span className="mr-1">{getGroupIcon(groupKey)}</span>
                {getGroupTitle(groupKey)} ({groupVersions.length})
              </div>
              <div className="space-y-1 mt-1">
                {groupVersions.map(version => (
                  <button
                    key={version.id}
                    onClick={() => handleVersionSelect(version.id)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between hover:bg-gray-50 ${
                      selectedVersion === version.id ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center min-w-0 flex-1">
                      <span className="mr-2">{getGroupIcon(groupKey)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{version.name}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {version.id} {version.releaseDate && `• ${new Date(version.releaseDate).toLocaleDateString()}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      {showCounts && testCaseCounts[version.id] && (
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                          {testCaseCounts[version.id]}
                        </span>
                      )}
                      {selectedVersion === version.id && <Check size={16} className="text-blue-600" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="px-3 py-4 text-center text-gray-500 text-sm">
            {searchQuery ? `No versions found matching "${searchQuery}"` : 'No versions available'}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 pt-2 border-t border-gray-100 text-xs text-gray-500">
        {filteredVersions.length} of {versions.length} versions
      </div>
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      {/* Version Selector Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2.5 text-left bg-white border border-gray-300 rounded-lg shadow-sm hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
            <Layers size={16} className="text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 truncate">
              {selectedInfo.icon} {selectedInfo.name}
            </div>
            <div className="text-xs text-gray-500">
              {selectedVersion === 'unassigned' ? 'All Items' : `Version: ${selectedInfo.id}`}
            </div>
          </div>
        </div>
        <ChevronDown 
          className={`ml-2 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          size={16} 
        />
      </button>

      {/* Portal Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          {createPortal(<DropdownContent />, document.body)}
        </>
      )}
    </div>
  );
};

export default VersionSelector;
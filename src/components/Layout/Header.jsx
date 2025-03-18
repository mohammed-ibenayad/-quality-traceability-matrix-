import React from 'react';
import NewReleaseModal from '../Releases/NewReleaseModal';

const Header = ({ 
  title, 
  selectedVersion, 
  setSelectedVersion, 
  versions, 
  hasData = true,
  onAddVersion = null
}) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleAddVersion = (newVersion) => {
    if (onAddVersion) {
      onAddVersion(newVersion);
    }
  };

  return (
    <header className="bg-white shadow h-16 flex items-center justify-between px-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        {hasData && (
          <div className="flex items-center gap-2">
            {versions && versions.length > 0 && (
              <div className="flex items-center">
                <span className="mr-2 text-sm text-gray-500">Version:</span>
                <select 
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  className="border rounded p-1.5 text-sm"
                >
                  <option value="unassigned">Unassigned/All Items</option>
                  {versions.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            {/* New Release Button */}
            {onAddVersion && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="ml-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                New Release
              </button>
            )}
          </div>
        )}
        <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
          <span className="text-sm font-medium">JS</span>
        </div>
      </div>

      {/* New Release Modal */}
      <NewReleaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddVersion}
        existingVersions={versions || []}
      />
    </header>
  );
};

export default Header;
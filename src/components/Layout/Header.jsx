import React from 'react';
import NewReleaseModal from '../Releases/NewReleaseModal';
import VersionSelector from '../Common/VersionSelector';


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
    <header className="sticky top-0 z-50 bg-white shadow h-16 flex items-center justify-between px-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        {hasData && (
          <div className="flex items-center gap-2">
            {versions && versions.length > 0 && (
              <VersionSelector
                selectedVersion={selectedVersion}
                versions={versions}
                onVersionChange={setSelectedVersion}
                className="w-64"
                showCounts={false}
              />
            )}

            {/* New Release Button */}
            {onAddVersion && (
              <button
                onClick={onAddVersion}
                className="ml-3 flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
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
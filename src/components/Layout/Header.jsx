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
          </div>
        )}        
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
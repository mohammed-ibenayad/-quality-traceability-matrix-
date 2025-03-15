import React from 'react';

const Header = ({ title, selectedVersion, setSelectedVersion, versions }) => {
  return (
    <header className="bg-white shadow h-16 flex items-center justify-between px-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center">
          <span className="mr-2 text-sm text-gray-500">Version:</span>
          <select 
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            className="border rounded p-1.5 text-sm"
          >
            {versions.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
        <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
          <span className="text-sm font-medium">JS</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
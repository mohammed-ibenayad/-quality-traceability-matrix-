import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = ({ 
  children, 
  title, 
  selectedVersion, 
  setSelectedVersion, 
  versions,
  hasData = true,
  onAddVersion = null
}) => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64">
          <Header 
            title={title} 
            selectedVersion={selectedVersion} 
            setSelectedVersion={setSelectedVersion}
            versions={versions}
            hasData={hasData}
            onAddVersion={onAddVersion}
          />
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useVersionContext } from '../../context/VersionContext';

const MainLayout = ({
  children,
  title,
  hasData = true,
  onAddVersion = null
}) => {
  const { selectedVersion, setSelectedVersion, versions } = useVersionContext();

  return (
    <div className="h-screen overflow-hidden bg-gray-100">
      <div className="h-full flex">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title={title}
            selectedVersion={selectedVersion}
            setSelectedVersion={setSelectedVersion}
            versions={versions}
            hasData={hasData}
            onAddVersion={title !== "Release Management" ? onAddVersion : null}
          />

          {/* Main content area - scrollable */}
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto px-4 py-4">
              {children}
            </div>
          </main>

          {/* Footer - always at bottom */}
          <footer className="flex-shrink-0 bg-white shadow-md p-4 text-center text-gray-600">
            <div className="flex justify-center items-center mb-2">
              <img
                src="/asal-logo.png"
                alt="ASAL Technologies"
                className="h-5 mr-2"
              />
              <span className="font-medium">Developed by ASAL Technologies</span>
            </div>
            <div className="text-sm">
              © {new Date().getFullYear()} ASAL Technologies. All rights reserved.
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
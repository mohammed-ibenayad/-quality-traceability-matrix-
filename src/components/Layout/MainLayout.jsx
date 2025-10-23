import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useVersionContext } from '../../context/VersionContext';

/**
 * MainLayout - Updated layout with right sidebar support
 * 
 * @param {ReactNode} children - Main content
 * @param {string} title - Page title
 * @param {boolean} hasData - Whether data exists in the system
 * @param {function} onAddVersion - Optional callback for adding versions
 * @param {ReactNode} rightSidebar - Optional right sidebar content
 * @param {boolean} showRightSidebar - Control right sidebar visibility
 */
const MainLayout = ({
  children,
  title,
  hasData = true,
  onAddVersion = null,
  rightSidebar = null,
  showRightSidebar = false
}) => {
  const { selectedVersion, setSelectedVersion, versions } = useVersionContext();

  return (
    <div className="h-screen overflow-hidden bg-gray-100">
      <div className="h-full flex">
        {/* Left Sidebar - Navigation */}
        <Sidebar />
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header
            title={title}
            selectedVersion={selectedVersion}
            setSelectedVersion={setSelectedVersion}
            versions={versions}
            hasData={hasData}
            onAddVersion={title !== "Release Management" ? onAddVersion : null}
          />

          {/* Content area with optional right sidebar */}
          <div className="flex-1 flex overflow-hidden">
            {/* Main content - scrollable */}
            <main className={`flex-1 overflow-y-auto transition-all duration-300 ${
              showRightSidebar ? 'mr-0' : ''
            }`}>
              <div className="mx-auto px-4 py-4">
                {children}
              </div>
            </main>

            {/* Right sidebar - sticky, only shown when showRightSidebar is true */}
            {showRightSidebar && rightSidebar && (
              <aside className="hidden lg:block w-80 xl:w-96 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0 shadow-lg">
                {rightSidebar}
              </aside>
            )}
          </div>

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
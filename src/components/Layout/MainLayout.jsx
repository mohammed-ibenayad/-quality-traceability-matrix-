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
  // Use our version context instead of props
  const { selectedVersion, setSelectedVersion, versions } = useVersionContext();

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 flex flex-col">
          <Header 
            title={title} 
            selectedVersion={selectedVersion} 
            setSelectedVersion={setSelectedVersion}
            versions={versions}
            hasData={hasData}
            onAddVersion={onAddVersion}
          />
          {/* BALANCED APPROACH: Reasonable padding for visual comfort, more space than original */}
          <main className="px-3 py-4 flex-grow">
            {children}
          </main>
          
          {/* Alternative options (commented out): */}
          
          {/* OPTION 2: Slightly more padding - Good balance */}
          {/* 
          <main className="px-4 py-4 flex-grow">
            {children}
          </main>
          */}
          
          {/* OPTION 3: Responsive padding - Adapts to screen size */}
          {/* 
          <main className="px-2 sm:px-3 lg:px-4 xl:px-5 py-4 flex-grow">
            {children}
          </main>
          */}
          
          {/* OPTION 4: Minimal but visible padding */}
          {/* 
          <main className="px-2 py-4 flex-grow">
            {children}
          </main>
          */}
          
          {/* Footer with copyright */}
          <footer className="mt-auto bg-white shadow-md p-4 text-center text-gray-600">
            <div className="flex justify-center items-center mb-2">
              {/* Replace with your company logo */}
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
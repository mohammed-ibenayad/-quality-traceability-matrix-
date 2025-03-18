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
        <div className="flex-1 ml-64 flex flex-col">
          <Header 
            title={title} 
            selectedVersion={selectedVersion} 
            setSelectedVersion={setSelectedVersion}
            versions={versions}
            hasData={hasData}
            onAddVersion={onAddVersion}
          />
          <main className="p-6 flex-grow">
            {children}
          </main>
          
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
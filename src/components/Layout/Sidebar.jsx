// src/components/Layout/Sidebar.jsx - Restored Original Logo
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const path = location.pathname;
  
  // Menu items with active status
  const menuItems = [
    { 
      name: 'Dashboard', 
      path: '/', 
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', 
      active: false 
    },
    { 
      name: 'Traceability Matrix', 
      path: '/matrix', 
      icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', 
      active: false 
    },
    { 
      name: 'Requirements', 
      path: '/requirements', 
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', 
      active: true 
    },
    { 
      name: 'Test Cases', 
      path: '/testcases', // FIXED: Now points to /testcases
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', 
      active: true // FIXED: Now active
    },
    { 
      name: 'Releases', 
      path: '/releases', 
      icon: 'M11 17l-5-5m0 0l5-5m-5 5h12', 
      active: true 
    },
    { 
      name: 'Reports', 
      path: '#', 
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', 
      active: false 
    },
    { 
      name: 'Import Data', 
      path: '/import', 
      icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12', 
      active: true 
    },
    { 
      name: 'Roadmap', 
      path: '/roadmap', 
      icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9m0 0H9', 
      active: true 
    }
  ];
  
  return (
    <div className="w-64 bg-gray-800 text-white h-screen fixed flex flex-col">
      {/* RESTORED: Original header with Quality Check logo */}
      <div className="p-4 border-b border-gray-700 flex items-center">
        {/* Quality Check Logo - RESTORED ORIGINAL */}
        <div className="mr-3">
          <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
          </svg>
        </div>
        <h1 className="text-xl font-bold">Quality Tracker</h1>
      </div>
      
      {/* RESTORED: Original navigation structure */}
      <nav className="mt-4 flex-grow overflow-y-auto">
        {menuItems.map(item => (
          item.active ? (
            <Link 
              key={item.path}
              to={item.path} 
              className={`flex items-center px-4 py-3 ${
                path === item.path || (item.path === '/' && path === '')
                  ? 'bg-gray-700 text-white border-l-4 border-blue-500' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path>
              </svg>
              {item.name}
            </Link>
          ) : (
            <div 
              key={item.name}
              className="flex items-center px-4 py-3 text-gray-500 cursor-not-allowed opacity-60"
              title="Coming soon"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path>
              </svg>
              {item.name}
              <span className="ml-auto text-xs bg-gray-700 rounded px-1">Soon</span>
            </div>
          )
        ))}
      </nav>
      
      {/* RESTORED: Original ASAL Technologies Footer */}
      <div className="p-4 border-t border-gray-700 mt-auto">
        <div className="flex items-center justify-center mb-2">
          {/* Replace with your company logo */}
          <img 
            src="/asal-logo.png" 
            alt="ASAL Technologies" 
            className="h-6 mr-2" 
          />
          <span className="font-semibold text-blue-400">ASAL Technologies</span>
        </div>
        <div className="text-xs text-center text-gray-400">
          © {new Date().getFullYear()} ASAL Technologies. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
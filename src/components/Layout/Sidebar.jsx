import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const path = location.pathname;
  
  const menuItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Traceability Matrix', path: '/matrix' },
    { name: 'Requirements', path: '/requirements' },
    { name: 'Test Cases', path: '/test-cases' },
    { name: 'Reports', path: '/reports' }
  ];
  
  return (
    <div className="w-64 bg-gray-800 text-white h-screen">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">Quality Tracker</h1>
      </div>
      <nav className="mt-4">
        {menuItems.map(item => (
          <Link 
            key={item.path}
            to={item.path} 
            className={`block px-4 py-3 ${
              (path === item.path || (item.path === '/' && path === '')) 
                ? 'bg-gray-700 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
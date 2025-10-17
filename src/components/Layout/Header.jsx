import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, User, LogOut, Settings, HelpCircle } from 'lucide-react';
import { WorkspaceSelector } from '../Workspace';
import { Popover } from '../UI/Common';
import authService from '../../services/authService';
import logoImage from '../../assets/logo.svg'; // Replace with your actual logo path

const Header = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser() || { name: 'User', email: 'user@example.com' };
  
  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };
  
  return (
    <header className="bg-white border-b border-gray-200 z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo & Workspace Selector */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <img
                src={logoImage}
                alt="Quality Tracker"
                className="h-8 w-auto mr-6"
              />
            </div>
            
            <WorkspaceSelector />
          </div>

          {/* Right: User Menu, Notifications, etc. */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <button className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100">
              <Search size={20} />
            </button>
            
            {/* Help */}
            <button className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100">
              <HelpCircle size={20} />
            </button>
            
            {/* Notifications */}
            <Popover
              trigger={
                <button className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100">
                  <Bell size={20} />
                </button>
              }
              content={
                <div className="w-80 max-h-96 overflow-y-auto py-2">
                  <div className="px-4 py-2 text-sm font-medium text-gray-700">
                    Notifications
                  </div>
                  
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    No new notifications
                  </div>
                </div>
              }
            />
            
            {/* User Menu */}
            <Popover
              trigger={
                <button className="flex items-center text-gray-700 hover:text-gray-900">
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                    <User size={16} />
                  </div>
                </button>
              }
              content={
                <div className="w-56 py-2">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  
                  <div className="py-1">
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={() => navigate('/profile')}
                    >
                      <User size={16} className="mr-2" />
                      Your Profile
                    </button>
                    
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={() => navigate('/settings')}
                    >
                      <Settings size={16} className="mr-2" />
                      Settings
                    </button>
                    
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} className="mr-2" />
                      Sign out
                    </button>
                  </div>
                </div>
              }
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
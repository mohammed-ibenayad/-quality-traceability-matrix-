import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, FileText, CheckSquare, GitBranch, BarChart,
  Upload, Calendar, GitMerge, ChevronDown, Settings,
  Plus, ChevronsUpDown
} from 'lucide-react';
import { useWorkspaceContext } from '../../contexts/WorkspaceContext';
import { Popover } from '../UI/Popover';
import dataStore from '../../services/DataStore';


const Sidebar = () => {
  const navigate = useNavigate();
  const { currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspaceContext();
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);

  const handleWorkspaceChange = (workspace) => {
    setCurrentWorkspace(workspace);
    localStorage.setItem('currentWorkspace', JSON.stringify(workspace));
    dataStore.setCurrentWorkspace(workspace.id);
    setIsWorkspaceMenuOpen(false);
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Releases', path: '/releases', icon: Calendar },
    { name: 'Requirements', path: '/requirements', icon: FileText },
    { name: 'Test Cases', path: '/testcases', icon: CheckSquare },
    //{ name: 'Traceability', path: '/matrix', icon: GitBranch },    
    { name: 'Import', path: '/import', icon: Upload },
    //{ name: 'GitHub Sync', path: '/sync', icon: GitMerge },
    { name: 'Roadmap', path: '/roadmap', icon: BarChart }
  ];

  return (
    <div className="w-64 h-full bg-[#131a2b] text-gray-300 flex flex-col">
      {/* TOP SECTION: Workspace Selector - Fixed at top */}
      <div className="flex-shrink-0 p-4 border-b border-gray-800">
        <Popover
          isOpen={isWorkspaceMenuOpen}
          onOpenChange={setIsWorkspaceMenuOpen}
          trigger={
            <button className="w-full flex items-center justify-between text-left p-2 rounded-md bg-[#1e293b] hover:bg-[#283548] transition-colors">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-sm bg-blue-500 flex-shrink-0"></div>
                <span className="font-medium truncate text-white">
                  {currentWorkspace?.name || "Select Workspace"}
                </span>
              </div>
              <ChevronsUpDown size={16} className="text-gray-400 flex-shrink-0 ml-2" />
            </button>
          }
          content={
            <div className="py-2 w-full bg-[#1e293b] rounded-md border border-[#2a3a50] shadow-xl">
              <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">
                Workspaces
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {workspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center space-x-2 ${
                      workspace.id === currentWorkspace?.id 
                        ? 'bg-[#283548] text-white' 
                        : 'text-gray-300 hover:bg-[#283548]'
                    }`}
                    onClick={() => handleWorkspaceChange(workspace)}
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                    <span className="truncate">{workspace.name}</span>
                  </button>
                ))}
              </div>
              
              <div className="border-t border-[#2a3a50] mt-2 pt-2 px-2">
                <button
                  className="w-full text-left px-2 py-2 text-sm text-gray-300 hover:bg-[#283548] rounded-md flex items-center space-x-2"
                  onClick={() => {
                    setIsWorkspaceMenuOpen(false);
                    navigate('/select-workspace');
                  }}
                >
                  <Plus size={16} className="flex-shrink-0" />
                  <span>Manage Workspaces</span>
                </button>
                
                {currentWorkspace && (
                  <button
                    className="w-full text-left px-2 py-2 text-sm text-gray-300 hover:bg-[#283548] rounded-md flex items-center space-x-2"
                    onClick={() => {
                      setIsWorkspaceMenuOpen(false);
                      navigate(`/workspace-settings/${currentWorkspace.id}`);
                    }}
                  >
                    <Settings size={16} className="flex-shrink-0" />
                    <span>Workspace Settings</span>
                  </button>
                )}
              </div>
            </div>
          }
        />
        
        <div className="mt-2 text-xs text-gray-500 px-2">
          Quality Tracker
        </div>
      </div>
      
      {/* MIDDLE SECTION: Navigation Links - Scrollable */}
      <div className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center px-3 py-2 rounded-md text-sm font-medium
                    ${isActive
                      ? 'bg-[#283548] text-white'
                      : 'text-gray-300 hover:bg-[#283548] hover:text-white'
                    }
                  `}
                >
                  <Icon size={18} className="mr-3 flex-shrink-0" />
                  {item.name}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
      
      {/* BOTTOM SECTION: User Section - Fixed at bottom */}
      <div className="flex-shrink-0 p-4 border-t border-gray-800">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium">JS</span>
          </div>
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-medium text-white truncate">Admin User</p>
            <p className="text-xs text-gray-400 truncate">admin@qualitytracker.local</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
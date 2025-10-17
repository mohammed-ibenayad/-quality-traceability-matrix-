import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { WorkspaceProvider, useWorkspaceContext } from './contexts/WorkspaceContext';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard';
import RequirementsList from './components/Requirements/RequirementsList';
import TestCasesList from './components/TestCases/TestCasesList';
import TraceabilityMatrix from './components/Traceability/TraceabilityMatrix';
import { WorkspaceSettings } from './components/Workspace';
import Login from './components/Auth/Login';
import authService from './services/authService';

// Initialize auth service
authService.initialize();

// Main Layout Component with Workspace Check
const MainLayout = ({ children }) => {
  const { currentWorkspace, isLoading } = useWorkspaceContext();
  const navigate = useNavigate();

  // Redirect to workspace selector if no workspace is selected
  useEffect(() => {
    if (!isLoading && !currentWorkspace) {
      navigate('/select-workspace');
    }
  }, [currentWorkspace, isLoading, navigate]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!currentWorkspace) {
    return null; // Will redirect via the useEffect
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
};

// Workspace Selection Screen
const SelectWorkspace = () => {
  const { workspaces, isLoading } = useWorkspaceContext();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading workspaces...</div>;
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Select a Workspace</h1>
        
        {workspaces.length === 0 ? (
          <div className="text-center">
            <p className="mb-4 text-gray-600">You don't have any workspaces yet.</p>
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={() => {/* Open new workspace modal */}}
            >
              Create Your First Workspace
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {workspaces.map(workspace => (
              <div 
                key={workspace.id}
                className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                onClick={() => {/* Select this workspace */}}
              >
                <h3 className="font-medium">{workspace.name}</h3>
                {workspace.description && (
                  <p className="text-sm text-gray-500 mt-1">{workspace.description}</p>
                )}
              </div>
            ))}
            
            <button 
              className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              onClick={() => {/* Open new workspace modal */}}
            >
              Create New Workspace
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// App Component with Router
const App = () => {
  return (
    <WorkspaceProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/select-workspace" element={<SelectWorkspace />} />
          
          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/requirements" element={<ProtectedRoute><RequirementsList /></ProtectedRoute>} />
          <Route path="/test-cases" element={<ProtectedRoute><TestCasesList /></ProtectedRoute>} />
          <Route path="/traceability" element={<ProtectedRoute><TraceabilityMatrix /></ProtectedRoute>} />
          
          {/* Workspace Settings */}
          <Route path="/workspace-settings/:workspaceId" element={
            <ProtectedRoute><WorkspaceSettings /></ProtectedRoute>
          } />
          
          {/* Redirect to dashboard for unknown routes */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </WorkspaceProvider>
  );
};

export default App;
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
import SelectWorkspace from './components/Workspace/SelectWorkspace'; // Import the proper component
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
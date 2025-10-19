import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Requirements from './pages/Requirements';
import TestCases from './pages/TestCases';
import TraceabilityMatrix from './pages/TraceabilityMatrix';
import ImportData from './pages/ImportData';
import Releases from './pages/Releases';
import Roadmap from './pages/Roadmap';
import GitHubSyncDashboard from './pages/GitHubSyncDashboard';
import SelectWorkspace from './components/Workspace/SelectWorkspace';
import WorkspaceSettings from './components/Workspace/WorkspaceSettings';
import Login from './components/Auth/Login';
import dataStore from './services/DataStore';
import authService from './services/authService';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { VersionProvider } from './contexts/VersionContext';
import './App.css';

// Protected Route Component
function ProtectedRoute({ children }) {
  const isAuthenticated = authService.isAuthenticated();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <Layout>{children}</Layout>;
}

function App() {
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    // Subscribe to DataStore changes
    const unsubscribe = dataStore.subscribe(() => {
      const hasDataNow = dataStore.hasData();
      setHasData(hasDataNow);
    });

    // Initial check
    setHasData(dataStore.hasData());

    // Setup test results API
    if (typeof window !== 'undefined') {
      const testResultsApi = {
        baseUrl: 'http://213.6.2.229:3001/api/webhook/test-results',
        apis: {
          testResults: async (data) => {
            console.log('Test results received via window.qualityTracker.apis.testResults:', data);
            return { success: true, message: 'Test results processed' };
          }
        }
      };

      window.qualityTracker = testResultsApi;
      
      window.receiveTestResults = async (data) => {
        return testResultsApi.apis.testResults(data);
      };

      console.log('Quality Tracker APIs registered:');
      console.log('- window.qualityTracker.apis.testResults');
      console.log('- window.qualityTracker.processTestResults(data)');
      console.log('- window.receiveTestResults(data)');
      console.log('Test results callback URL:', testResultsApi.baseUrl);
    }
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  return (
    <WorkspaceProvider>
      <VersionProvider>
        <Router>
          <Routes>
            {/* Public Route - Login */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes - Wrapped in Layout */}
            <Route path="/" element={
              <ProtectedRoute>
                {hasData ? <Dashboard /> : <Navigate to="/import" />}
              </ProtectedRoute>
            } />
            
            <Route path="/select-workspace" element={
              <ProtectedRoute>
                <SelectWorkspace />
              </ProtectedRoute>
            } />
            
            <Route path="/workspace-settings/:workspaceId" element={
              <ProtectedRoute>
                <WorkspaceSettings />
              </ProtectedRoute>
            } />
            
            <Route path="/matrix" element={
              <ProtectedRoute>
                {hasData ? <TraceabilityMatrix /> : <Navigate to="/import" />}
              </ProtectedRoute>
            } />
            
            <Route path="/requirements" element={
              <ProtectedRoute>
                <Requirements />
              </ProtectedRoute>
            } />
            
            <Route path="/testcases" element={
              <ProtectedRoute>
                <TestCases />
              </ProtectedRoute>
            } />
            
            <Route path="/releases" element={
              <ProtectedRoute>
                <Releases />
              </ProtectedRoute>
            } />
            
            <Route path="/import" element={
              <ProtectedRoute>
                <ImportData />
              </ProtectedRoute>
            } />
            
            <Route path="/roadmap" element={
              <ProtectedRoute>
                <Roadmap />
              </ProtectedRoute>
            } />
            
            <Route path="/sync" element={
              <ProtectedRoute>
                <GitHubSyncDashboard />
              </ProtectedRoute>
            } />
            
            {/* Redirect any unknown paths */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </VersionProvider>
    </WorkspaceProvider>
  );
}

export default App;
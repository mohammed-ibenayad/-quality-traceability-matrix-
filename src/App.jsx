import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import dataStore from './services/DataStore';
import authService from './services/authService';
import { VersionProvider } from './context/VersionContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';

// Import API endpoints
import testResultsApi from './api/testResultsApi';

// Import pages
import Dashboard from './pages/Dashboard';
import TraceabilityMatrix from './pages/TraceabilityMatrix';
import Requirements from './pages/Requirements';
import TestCases from './pages/TestCases';
import ImportData from './pages/ImportData';
import Releases from './pages/Releases';
import Roadmap from './pages/Roadmap';
import GitHubSyncDashboard from './components/Sync/GitHubSyncDashboard';
import Login from './components/Auth/Login';
import ComponentTest from './pages/ComponentTest';

// In your <Routes>:
<Route path="/test-ui" element={<ComponentTest />} />

// Import workspace components
import SelectWorkspace from './components/Workspace/SelectWorkspace';
import WorkspaceSettings from './components/Workspace/WorkspaceSettings';

// Import ProtectedRoute component
import ProtectedRoute from './components/Auth/ProtectedRoute';

function App() {
  const [hasData, setHasData] = useState(false);

  // Initialize auth service
  useEffect(() => {
    authService.initialize();
  }, []);

  // Check for data presence when app loads
  useEffect(() => {
    setHasData(dataStore.hasData());

    // Setup a listener for data changes
    const unsubscribe = dataStore.subscribe(() => {
      setHasData(dataStore.hasData());
    });

    // Improved test results API handling
    if (!window.qualityTracker) {
      window.qualityTracker = {
        apis: {
          testResults: testResultsApi
        },
        processTestResults: (data) => {
          console.log("Test results received via window.qualityTracker.processTestResults:", data);
          return testResultsApi.test(data);
        }
      };

      window.receiveTestResults = (data) => {
        console.log("Test results received via window.receiveTestResults:", data);
        try {
          return testResultsApi.test(data);
        } catch (error) {
          console.error("Error processing test results:", error);
          return { success: false, error: error.message };
        }
      };

      console.log('Quality Tracker APIs registered');
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
            <Route path="/test-ui" element={<ComponentTest />} />

            {/* Public route - Login page */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes - All require authentication */}
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

            <Route path="/" element={
              <ProtectedRoute>
                {hasData ? <Dashboard /> : <Navigate to="/import" replace />}
              </ProtectedRoute>
            } />

            <Route path="/matrix" element={
              <ProtectedRoute>
                {hasData ? <TraceabilityMatrix /> : <Navigate to="/import" />}
              </ProtectedRoute>
            } />
            <Route path="/test-ui" element={<ComponentTest />} />

            <Route path="/requirements" element={
              <ProtectedRoute>
                <Requirements />
              </ProtectedRoute>
            } />

            */

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

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </VersionProvider>
    </WorkspaceProvider>
  );
}

export default App;
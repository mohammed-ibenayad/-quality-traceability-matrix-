import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import dataStore from './services/DataStore';
import { VersionProvider } from './context/VersionContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext'; // Add workspace context

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

// Import workspace components
import SelectWorkspace from './components/Workspace/SelectWorkspace';
import WorkspaceSettings from './components/Workspace/WorkspaceSettings';

function App() {
  const [hasData, setHasData] = useState(false);

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
        // Add a directly callable function to process test results
        processTestResults: (data) => {
          console.log("Test results received via window.qualityTracker.processTestResults:", data);
          return testResultsApi.test(data);
        }
      };

      // Also expose window.receiveTestResults for direct script invocation
      window.receiveTestResults = (data) => {
        console.log("Test results received via window.receiveTestResults:", data);
        try {
          return testResultsApi.test(data);
        } catch (error) {
          console.error("Error processing test results:", error);
          return { success: false, error: error.message };
        }
      };

      console.log('Quality Tracker APIs registered:');
      console.log('- window.qualityTracker.apis.testResults');
      console.log('- window.qualityTracker.processTestResults(data)');
      console.log('- window.receiveTestResults(data)');
      console.log('Test results callback URL:', testResultsApi.baseUrl);

      // Display helper message about how to manually test the API
      console.log('\nTo manually test the API, run this in the console:');
      console.log(`
window.receiveTestResults({
  requirementId: "REQ-001",
  timestamp: "${new Date().toISOString()}",
  results: [
    {
      id: "TC_001",
      name: "test_homepage_loads_TC_001",
      status: "Failed",
      duration: 13267
    }
  ]
}).then(result => console.log("Result:", result));
      `);
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
            {/* Authentication route - should come first */}
            <Route path="/login" element={<Login />} />

            {/* Workspace routes */}
            <Route path="/select-workspace" element={<SelectWorkspace />} />
            <Route path="/workspace-settings/:workspaceId" element={<WorkspaceSettings />} />

            {/* Main application routes */}
            <Route path="/" element={hasData ? <Dashboard /> : <Navigate to="/import" replace />} />
            <Route path="/matrix" element={hasData ? <TraceabilityMatrix /> : <Navigate to="/import" />} />
            <Route path="/requirements" element={<Requirements />} />
            <Route path="/testcases" element={<TestCases />} />
            <Route path="/releases" element={<Releases />} />
            <Route path="/import" element={<ImportData />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/sync" element={<GitHubSyncDashboard />} />

            {/* Redirect unknown paths */}
            <Route path="*" element={<Navigate to={hasData ? "/" : "/import"} />} />
          </Routes>
        </Router>
      </VersionProvider>
    </WorkspaceProvider>
  );
}

export default App;
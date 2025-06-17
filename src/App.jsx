import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import dataStore from './services/DataStore';
import { VersionProvider } from './context/VersionContext';

// Import API endpoints
import testResultsApi from './api/testResultsApi';

// Import pages
import Dashboard from './pages/Dashboard';
import TraceabilityMatrix from './pages/TraceabilityMatrix';
import Requirements from './pages/Requirements';
import ImportData from './pages/ImportData';
import Releases from './pages/Releases';
import Roadmap from './pages/Roadmap';

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
    <VersionProvider>
      <Router>
        <Routes>
          {/* If no data exists, redirect to import page */}
          <Route path="/" element={hasData ? <Dashboard /> : <Navigate to="/import" />} />
          <Route path="/matrix" element={hasData ? <TraceabilityMatrix /> : <Navigate to="/import" />} />
          <Route path="/requirements" element={hasData ? <Requirements /> : <Navigate to="/import" />} />
          <Route path="/releases" element={hasData ? <Releases /> : <Navigate to="/import" />} />
          
          {/* These routes are always accessible regardless of data */}
          <Route path="/import" element={<ImportData />} />
          <Route path="/roadmap" element={<Roadmap />} />
          
          {/* Redirect any unknown paths to dashboard or import based on data presence */}
          <Route path="*" element={<Navigate to={hasData ? "/" : "/import"} />} />
        </Routes>
      </Router>
    </VersionProvider>
  );
}

export default App;
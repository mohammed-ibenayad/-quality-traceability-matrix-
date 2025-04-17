import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import dataStore from './services/DataStore';

// Import API endpoints
import testResultsApi from './api/testResultsApi';

// Import pages
import Dashboard from './pages/Dashboard';
import TraceabilityMatrix from './pages/TraceabilityMatrix';
import Requirements from './pages/Requirements';
import ImportData from './pages/ImportData';
import Releases from './pages/Releases';

function App() {
  const [hasData, setHasData] = useState(false);
  
  // Check for data presence when app loads
  useEffect(() => {
    setHasData(dataStore.hasData());
    
    // Setup a listener for data changes
    const unsubscribe = dataStore.subscribe(() => {
      setHasData(dataStore.hasData());
    });
    
    // Register the test results endpoint with the window for debugging
    if (!window.qualityTracker) {
      window.qualityTracker = {
        apis: {
          testResults: testResultsApi
        }
      };
      
      console.log('Quality Tracker APIs registered on window.qualityTracker.apis');
      console.log('Test results callback URL:', testResultsApi.baseUrl);
    }
    
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <Router>
      <Routes>
        {/* If no data exists, redirect to import page */}
        <Route path="/" element={hasData ? <Dashboard /> : <Navigate to="/import" />} />
        <Route path="/matrix" element={hasData ? <TraceabilityMatrix /> : <Navigate to="/import" />} />
        <Route path="/requirements" element={hasData ? <Requirements /> : <Navigate to="/import" />} />
        <Route path="/releases" element={hasData ? <Releases /> : <Navigate to="/import" />} />
        <Route path="/import" element={<ImportData />} />
        
        {/* Redirect any unknown paths to dashboard or import based on data presence */}
        <Route path="*" element={<Navigate to={hasData ? "/" : "/import"} />} />
      </Routes>
    </Router>
  );
}

export default App;
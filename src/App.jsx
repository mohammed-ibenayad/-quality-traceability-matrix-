import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import dataStore from './services/DataStore';

// Import pages
import Dashboard from './pages/Dashboard';
import TraceabilityMatrix from './pages/TraceabilityMatrix';
import ImportData from './pages/ImportData';

function App() {
  const [hasData, setHasData] = useState(false);
  
  // Check for data presence when app loads
  useEffect(() => {
    setHasData(dataStore.hasData());
    
    // Setup a listener for data changes
    const unsubscribe = dataStore.subscribe(() => {
      setHasData(dataStore.hasData());
    });
    
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
        <Route path="/import" element={<ImportData />} />
        {/* Placeholder routes for future implementation */}
        <Route path="/requirements" element={hasData ? <Dashboard /> : <Navigate to="/import" />} />
        <Route path="/test-cases" element={hasData ? <Dashboard /> : <Navigate to="/import" />} />
        <Route path="/reports" element={hasData ? <Dashboard /> : <Navigate to="/import" />} />
        {/* Redirect any unknown paths to dashboard or import based on data presence */}
        <Route path="*" element={<Navigate to={hasData ? "/" : "/import"} />} />
      </Routes>
    </Router>
  );
}

export default App;
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import pages
import Dashboard from './pages/Dashboard';
import TraceabilityMatrix from './pages/TraceabilityMatrix';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/matrix" element={<TraceabilityMatrix />} />
        {/* Placeholder routes for future implementation */}
        <Route path="/requirements" element={<Dashboard />} />
        <Route path="/test-cases" element={<Dashboard />} />
        <Route path="/reports" element={<Dashboard />} />
        {/* Redirect any unknown paths to dashboard */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
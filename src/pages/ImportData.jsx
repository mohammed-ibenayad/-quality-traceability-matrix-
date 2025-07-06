import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import ImportRequirements from '../components/Import/ImportRequirements';
import ImportTestCases from '../components/Import/ImportTestCases';
import { useVersionContext } from '../context/VersionContext';
import dataStore from '../services/DataStore';

/**
 * Page for importing data into the system
 */
const ImportData = () => {
  const [importStatus, setImportStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('testcases'); // 'requirements' or 'testcases'
  const [hasData, setHasData] = useState(false);
  const navigate = useNavigate();

  // Use version context
  const { selectedVersion } = useVersionContext();

  // Check if the system has data
  useEffect(() => {
    setHasData(dataStore.hasData());
    
    // Setup a listener for data changes
    const unsubscribe = dataStore.subscribe(() => {
      setHasData(dataStore.hasData());
    });
    
    // Expose a function to load sample data
    window.loadSampleData = () => {
      // Load sample requirements and test cases
      dataStore.initWithDefaultData();
      
      // Also populate any open test runner modals with GitHub config
      if (typeof window.loadTestRunnerSampleData === 'function') {
        console.log('Loading sample GitHub configuration in test runner...');
        window.loadTestRunnerSampleData();
      }
      
      navigate('/');
    };
    
    return () => {
      unsubscribe();
      // Clean up the global function
      delete window.loadSampleData;
    };
  }, [navigate]);

  // NEW: Set the tab based on URL hash
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#testcases-tab') {
        setActiveTab('testcases');
      } else if (window.location.hash === '#requirements-tab') {
        setActiveTab('requirements');
      }
    };

    // Check hash on component mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    // Cleanup event listener
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleImportSuccess = (importedData) => {
    // In a real application, this would save to a database or API
    // For demonstration, we'll just show a success message
    
    try {
      // Create a formatted string of the JSON data
      const jsonString = JSON.stringify(importedData, null, 2);
      
      // Create a success message with a count
      setImportStatus({
        success: true,
        message: `Successfully imported ${importedData.length} ${activeTab === 'requirements' ? 'requirements' : 'test cases'}.`,
        jsonData: jsonString
      });
      
      // Scroll to import status (success message)
      setTimeout(() => {
        const statusElement = document.getElementById('import-status');
        if (statusElement) {
          statusElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
      
    } catch (error) {
      console.error("Error processing import:", error);
      setImportStatus({
        success: false,
        message: `Error importing ${activeTab === 'requirements' ? 'requirements' : 'test cases'}: ${error.message}`,
        jsonData: null
      });
    }
  };

  return (
    <MainLayout 
      title="Import Data"
      hasData={hasData}
    >
      <div className="max-w-4xl mx-auto">
        {/* Welcome message for new users (when no data exists) */}
        {!hasData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-800 mb-3">Welcome to Quality Tracker!</h2>
            <p className="text-blue-700 mb-4">
              There is no data in the system yet. To get started:
            </p>
            <ol className="list-decimal pl-6 text-blue-700 space-y-2">
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-blue-600 mr-2">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                  </svg>
                </div>
                <span className="text-blue-700">Import your requirements using the Requirements tab below</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-blue-600 mr-2">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                  </svg>
                </div>
                <span className="text-blue-700">Import your test cases using the Test Cases tab</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-blue-600 mr-2">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                  </svg>
                </div>
                <span className="text-blue-700">View the Traceability Matrix to see the relationship between requirements and tests</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-blue-600 mr-2">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <span className="text-blue-700">Check the Dashboard for quality metrics and release health</span>
              </li>
            </ol>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">Select a tab below to get started</p>
            </div>
          </div>
        )}
        
        <h1 className="text-2xl font-bold mb-6">Import Data</h1>
        
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              <button
                onClick={() => {
                  setActiveTab('requirements');
                  setImportStatus(null); // Clear previous import status when changing tabs
                }}
                className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'requirements'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                  </svg>
                  Import Requirements
                </div>
              </button>
              <button
                onClick={() => {
                  setActiveTab('testcases');
                  setImportStatus(null); // Clear previous import status when changing tabs
                }}
                className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'testcases'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                  </svg>
                  Import Test Cases
                </div>
              </button>
            </nav>
          </div>
        </div>
        
        {/* Requirements Import Interface */}
        {activeTab === 'requirements' && (
          <>
            {/* Import card moved to the top */}
            <ImportRequirements onImportSuccess={handleImportSuccess} />
            
            {/* Import Status (Success/Error) - Placed right after import component */}
            {importStatus && activeTab === 'requirements' && (
              <div 
                id="import-status"
                className={`mt-6 p-4 rounded shadow ${
                  importStatus.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
                style={{ 
                  animation: 'fadeIn 0.5s',
                  scrollMarginTop: '20px'
                }}
              >
                <h3 className={`font-semibold ${
                  importStatus.success ? 'text-green-700' : 'text-red-700'
                } text-lg mb-2`}>
                  {importStatus.success ? 'Import Successful!' : 'Import Failed'}
                </h3>
                <p className={importStatus.success ? 'text-green-600' : 'text-red-600'}>
                  {importStatus.message}
                </p>
                
                {importStatus.success && importStatus.jsonData && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">Imported Data Preview:</h4>
                    <div className="bg-gray-800 text-green-400 p-4 rounded overflow-auto max-h-96">
                      <pre className="text-sm">{importStatus.jsonData}</pre>
                    </div>
                  </div>
                )}
                
                {importStatus.success && (
                  <div className="mt-6 flex gap-4">
                    <button
                      onClick={() => navigate('/requirements')}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      View Requirements
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        
        {/* Test Case Import Interface */}
        {activeTab === 'testcases' && (
          <>
            {/* Import card moved to the top */}
            <ImportTestCases onImportSuccess={handleImportSuccess} />
            
            {/* Import Status (Success/Error) - Placed right after import component */}
            {importStatus && activeTab === 'testcases' && (
              <div 
                id="import-status"
                className={`mt-6 p-4 rounded shadow ${
                  importStatus.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
                style={{ 
                  animation: 'fadeIn 0.5s',
                  scrollMarginTop: '20px'
                }}
              >
                <h3 className={`font-semibold ${
                  importStatus.success ? 'text-green-700' : 'text-red-700'
                } text-lg mb-2`}>
                  {importStatus.success ? 'Import Successful!' : 'Import Failed'}
                </h3>
                <p className={importStatus.success ? 'text-green-600' : 'text-red-600'}>
                  {importStatus.message}
                </p>
                
                {importStatus.success && importStatus.jsonData && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">Imported Data Preview:</h4>
                    <div className="bg-gray-800 text-green-400 p-4 rounded overflow-auto max-h-96">
                      <pre className="text-sm">{importStatus.jsonData}</pre>
                    </div>
                  </div>
                )}
                
                {importStatus.success && (
                  <div className="mt-6 flex gap-4">
                    <button
                      onClick={() => navigate('/testcases')}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      View Test Cases
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default ImportData;
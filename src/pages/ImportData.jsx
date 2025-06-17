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
  const [activeTab, setActiveTab] = useState('requirements'); // 'requirements' or 'testcases'
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
      
      console.log(`Import successful: ${importedData.length} ${activeTab} imported`);
      
      // Scroll to the success message
      setTimeout(() => {
        const successElement = document.getElementById('import-status');
        if (successElement) {
          successElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      console.error("Error in handleImportSuccess:", error);
      setImportStatus({
        success: false,
        message: `Error processing import: ${error.message}`
      });
    }
  };

  // Set the tab based on URL hash
  useEffect(() => {
    if (window.location.hash === '#testcases-tab') {
      setActiveTab('testcases');
    } else if (window.location.hash === '#requirements-tab') {
      setActiveTab('requirements');
    }
  }, []);

  return (
    <MainLayout
      title="Import Data"
      hasData={hasData}
    >
      <div className="max-w-4xl mx-auto">
        {/* Quick Start Notice - Streamlined version */}
        {!hasData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Getting Started</h3>
                <div className="mt-1 text-sm text-blue-700">
                  <p>Import your requirements and test cases to begin tracking quality metrics. Need help? Check the <a href="/roadmap" className="underline hover:text-blue-900">Roadmap page</a> for detailed information about Quality Tracker.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('requirements')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'requirements'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Requirements
            </button>
            <button
              onClick={() => setActiveTab('testcases')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'testcases'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Test Cases
            </button>
          </nav>
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
                      onClick={() => navigate('/matrix')}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Go to Traceability Matrix
                    </button>
                    <button
                      onClick={() => navigate('/')}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      View Dashboard
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
                      onClick={() => navigate('/matrix')}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Go to Traceability Matrix
                    </button>
                    <button
                      onClick={() => navigate('/')}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      View Dashboard
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Inline CSS for fade animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </MainLayout>
  );
};

export default ImportData;
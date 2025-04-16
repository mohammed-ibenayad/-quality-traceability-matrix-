import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import ImportRequirements from '../components/Import/ImportRequirements';
import ImportTestCases from '../components/Import/ImportTestCases';
import dataStore from '../services/DataStore';

// Import versions for the header
import versionsData from '../data/versions';

/**
 * Page for importing data into the system
 */
const ImportData = () => {
  const [selectedVersion, setSelectedVersion] = useState(versionsData[2]?.id || '');
  const [importStatus, setImportStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('requirements'); // 'requirements' or 'testcases'
  const [hasData, setHasData] = useState(false);
  const navigate = useNavigate();

  // Check if the system has data
  useEffect(() => {
    setHasData(dataStore.hasData());
    
    // Setup a listener for data changes
    const unsubscribe = dataStore.subscribe(() => {
      setHasData(dataStore.hasData());
    });
    
    // Expose a function to load sample data
    window.loadSampleData = () => {
      dataStore.initWithDefaultData();
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
      selectedVersion={selectedVersion}
      setSelectedVersion={setSelectedVersion}
      versions={versionsData}
      hasData={hasData}
    >
      <div className="max-w-4xl mx-auto">
        {/* Empty state guidance when no data */}
        {!hasData && (
          <div className="bg-white p-8 rounded-lg shadow-lg mb-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-3">Welcome to Quality Tracker</h1>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Get started by importing your requirements and test cases to begin tracking the quality of your software releases.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">Getting Started</h2>
              <ol className="space-y-3">
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
            </div>
            
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
            
            {/* Instructions moved below the import component */}
            <div className="mt-6 bg-white p-6 rounded shadow">
              <h2 className="text-lg font-semibold mb-3">How to Import Requirements</h2>
              <p className="mb-3">
                Use this page to import requirements data in JSONC format. The system will:
              </p>
              <ul className="list-disc list-inside mb-4 text-gray-700 space-y-1">
                <li>Validate your file structure</li>
                <li>Calculate Test Depth Factor (TDF) for each requirement</li>
                <li>Determine the minimum test cases needed</li>
                <li>Update the requirements data in the application</li>
              </ul>
              
              <div className="bg-blue-50 p-4 rounded border border-blue-200 mb-4">
                <h3 className="font-semibold text-blue-700 mb-2">Required Fields:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                  <div>• id (format: REQ-XXX)</div>
                  <div>• name</div>
                  <div>• description</div>
                  <div>• priority (High/Medium/Low)</div>
                  <div>• businessImpact (1-5)</div>
                  <div>• technicalComplexity (1-5)</div>
                  <div>• regulatoryFactor (1-5)</div>
                  <div>• usageFrequency (1-5)</div>
                </div>
              </div>
              
              <div className="text-sm bg-gray-50 p-3 rounded border border-gray-200">
                <p className="font-medium mb-1">Need a sample file?</p>
                <div className="flex items-center justify-between">
                  <a 
                    href="/sample-requirements.jsonc" 
                    download 
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"></path>
                    </svg>
                    Download sample
                  </a>
                  <button
                    className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                    onClick={() => window.loadSampleData && window.loadSampleData()}
                  >
                    Load Sample Data
                  </button>
                </div>
              </div>
            </div>
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
            
            {/* Instructions moved below the import component */}
            <div className="mt-6 bg-white p-6 rounded shadow">
              <h2 className="text-lg font-semibold mb-3">How to Import Test Cases</h2>
              <p className="mb-3">
                Use this page to import test case data in JSONC format. The system will:
              </p>
              <ul className="list-disc list-inside mb-4 text-gray-700 space-y-1">
                <li>Validate your test case file structure</li>
                <li>Optionally map test cases to requirements</li>
                <li>Update the test case data in the application</li>
                <li>Preserve existing requirement-test mappings</li>
              </ul>
              
              <div className="bg-blue-50 p-4 rounded border border-blue-200 mb-4">
                <h3 className="font-semibold text-blue-700 mb-2">Required Fields:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                  <div>• id (format: TC-XXX)</div>
                  <div>• name</div>
                </div>
                <h3 className="font-semibold text-blue-700 mt-3 mb-2">Optional Fields:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                  <div>• description</div>
                  <div>• steps (array)</div>
                  <div>• expectedResult</div>
                  <div>• status (Passed/Failed/Not Run/Blocked)</div>
                  <div>• automationStatus (Automated/Manual/Planned)</div>
                  <div>• lastExecuted (date)</div>
                  <div>• requirementIds (array)</div>
                  <div>• version</div>
                </div>
              </div>
              
              <div className="text-sm bg-gray-50 p-3 rounded border border-gray-200">
                <p className="font-medium mb-1">Need a sample file?</p>
                <div className="flex items-center justify-between">
                  <a 
                    href="/sample-testcases.jsonc" 
                    download 
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"></path>
                    </svg>
                    Download sample
                  </a>
                  <button
                    className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                    onClick={() => window.loadSampleData && window.loadSampleData()}
                  >
                    Load Sample Data
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Removed original import status section that was at the bottom */}
      </div>
      
      {/* Add CSS for animations */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </MainLayout>
  );
};

export default ImportData;
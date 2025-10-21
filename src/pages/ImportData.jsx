// src/pages/ImportData.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import ImportRequirements from '../components/Import/ImportRequirements';
import ImportTestCases from '../components/Import/ImportTestCases';
import { useVersionContext } from '../context/VersionContext';
import dataStore from '../services/DataStore';
import apiService from '../services/apiService';
import ImportStatusDisplay from '../components/Import/ImportStatusDisplay';



/**
 * Page for importing data into the system with database integration
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

  // Set the tab based on URL hash
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

  /**
   * Handle successful import - with database integration
   */
  const handleImportSuccess = (importedData) => {
    // ✅ Data is ALREADY imported to database via individual API calls
    // This function just displays the success message

    try {
      // Create formatted JSON string for display
      const jsonString = JSON.stringify(importedData, null, 2);

      // Show success message
      setImportStatus({
        success: true,
        message: `Successfully imported ${importedData.length} ${activeTab === 'requirements' ? 'requirements' : 'test cases'}`,
        jsonData: jsonString,
        loading: false
      });

      // Scroll to status message
      setTimeout(() => {
        const statusElement = document.getElementById('import-status');
        if (statusElement) {
          statusElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }
      }, 100);

    } catch (error) {
      console.error('Import error:', error);

      setImportStatus({
        success: false,
        message: `Import failed: ${error.message}`,
        error: error,
        loading: false
      });

      setTimeout(() => {
        const statusElement = document.getElementById('import-status');
        if (statusElement) {
          statusElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }
      }, 100);
    }
  };
  // Function to close the preview and reset import status
  const closePreview = () => {
    setImportStatus(null);
  };

  const handleImportStart = () => {
    setImportStatus({
      loading: true,
      message: `Importing ${activeTab === 'requirements' ? 'requirements' : 'test cases'}...`,
      success: null,
      jsonData: null,
      error: null
    });
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto py-6 px-4">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">Import Data</h1>
          <p className="text-gray-600">
            Import requirements or test cases from JSON/JSONC files into the database
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              <button
                onClick={() => {
                  setActiveTab('requirements');
                  setImportStatus(null); // Clear previous import status when changing tabs
                  window.location.hash = 'requirements-tab';
                }}
                className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'requirements'
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
                  window.location.hash = 'testcases-tab';
                }}
                className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'testcases'
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
            <ImportRequirements
              onImportStart={handleImportStart}
              onImportSuccess={handleImportSuccess}
            />

            {/* Import Status using the new component */}
            {importStatus && activeTab === 'requirements' && (
              <ImportStatusDisplay
                importStatus={importStatus}
                activeTab={activeTab}
                closePreview={closePreview}
                navigate={navigate}
              />
            )}
          </>
        )}

        {/* Test Case Import Interface */}
        {activeTab === 'testcases' && (
          <>
            <ImportTestCases            
            onImportStart={handleImportStart}
            onImportSuccess={handleImportSuccess} 
            />

            {/* Import Status using the new component */}
            {importStatus && activeTab === 'testcases' && (
              <ImportStatusDisplay
                importStatus={importStatus}
                activeTab={activeTab}
                closePreview={closePreview}
                navigate={navigate}
              />
            )}
          </>
        )}
      </div>

      {/* CSS for animations and scrollbar styling */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          /* Custom scrollbar styling */
          .scrollbar-thin::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          
          .scrollbar-thumb-gray-500::-webkit-scrollbar-thumb {
            background: #718096;
            border-radius: 3px;
          }
          
          .scrollbar-track-gray-900::-webkit-scrollbar-track {
            background: #1a202c;
            border-radius: 3px;
          }
        `}
      </style>
    </MainLayout>
  );
};

export default ImportData;
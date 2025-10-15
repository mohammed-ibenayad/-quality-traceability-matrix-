import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import ImportRequirements from '../components/Import/ImportRequirements';
import ImportTestCases from '../components/Import/ImportTestCases';
import { useVersionContext } from '../context/VersionContext';
import dataStore from '../services/DataStore';
import apiService from '../services/apiService';

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
   * Handle successful import - now with database integration
   */
  const handleImportSuccess = async (importedData) => {
    try {
      // Show loading state
      setImportStatus({
        success: null,
        message: 'Importing data to database...',
        loading: true
      });

      // Get current data from dataStore for complete export
      const currentData = dataStore.exportData();
      
      // Prepare data for API import
      const dataToImport = {
        requirements: activeTab === 'requirements' ? importedData : currentData.requirements,
        testCases: activeTab === 'testcases' ? importedData : currentData.testCases,
        versions: currentData.versions,
        mappings: currentData.mapping
      };

      console.log('📤 Importing to database via API...');
      
      // Import to database via API
      const result = await apiService.importDataToDatabase(dataToImport);
      
      // Also update localStorage (existing behavior for backward compatibility)
      if (activeTab === 'requirements') {
        dataStore.setRequirements(importedData);
      } else if (activeTab === 'testcases') {
        dataStore.setTestCases(importedData);
      }

      // Create formatted JSON string for display
      const jsonString = JSON.stringify(importedData, null, 2);
      
      // Show success with API import summary
      setImportStatus({
        success: true,
        message: `Successfully imported ${importedData.length} ${activeTab === 'requirements' ? 'requirements' : 'test cases'}`,
        apiResult: result.summary,
        jsonData: jsonString,
        loading: false
      });

      // Scroll to status message
      setTimeout(() => {
        document.getElementById('import-status')?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest' 
        });
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
        document.getElementById('import-status')?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest' 
        });
      }, 100);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Import Data</h1>
          <p className="text-gray-600">
            Import requirements or test cases from JSON/JSONC files into the database
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('requirements')}
              className={`${
                activeTab === 'requirements'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              📋 Import Requirements
            </button>
            <button
              onClick={() => setActiveTab('testcases')}
              className={`${
                activeTab === 'testcases'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              🧪 Import Test Cases
            </button>
          </nav>
        </div>

        {/* Requirements Import Interface */}
        {activeTab === 'requirements' && (
          <>
            <ImportRequirements onImportSuccess={handleImportSuccess} />
            
            {/* Import Status for Requirements */}
            {importStatus && activeTab === 'requirements' && (
              <div 
                id="import-status"
                className={`mt-6 p-4 rounded shadow ${
                  importStatus.loading 
                    ? 'bg-blue-50 border border-blue-200'
                    : importStatus.success 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                }`}
                style={{ 
                  animation: 'fadeIn 0.5s',
                  scrollMarginTop: '20px'
                }}
              >
                {/* Loading State */}
                {importStatus.loading && (
                  <>
                    <h3 className="font-semibold text-blue-700 text-lg mb-2 flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Importing to Database...
                    </h3>
                    <p className="text-blue-600">{importStatus.message}</p>
                  </>
                )}

                {/* Success State */}
                {!importStatus.loading && importStatus.success && (
                  <>
                    <h3 className="font-semibold text-green-700 text-lg mb-2">
                      ✅ Import Successful!
                    </h3>
                    <p className="text-green-600 mb-4">{importStatus.message}</p>
                    
                    {/* API Import Summary */}
                    {importStatus.apiResult && (
                      <div className="bg-white p-4 rounded border border-green-300 mb-4">
                        <h4 className="font-medium text-gray-700 mb-2">Database Import Summary:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          {importStatus.apiResult.requirements && (
                            <div className="bg-blue-50 p-3 rounded">
                              <div className="font-semibold text-blue-700">Requirements</div>
                              <div className="text-gray-700">
                                ✅ Imported: {importStatus.apiResult.requirements.imported}<br/>
                                ⏭️ Skipped: {importStatus.apiResult.requirements.skipped}<br/>
                                📊 Total: {importStatus.apiResult.requirements.total}
                              </div>
                            </div>
                          )}
                          
                          {importStatus.apiResult.testCases && (
                            <div className="bg-purple-50 p-3 rounded">
                              <div className="font-semibold text-purple-700">Test Cases</div>
                              <div className="text-gray-700">
                                ✅ Imported: {importStatus.apiResult.testCases.imported}<br/>
                                ⏭️ Skipped: {importStatus.apiResult.testCases.skipped}<br/>
                                📊 Total: {importStatus.apiResult.testCases.total}
                              </div>
                            </div>
                          )}
                          
                          {importStatus.apiResult.mappings && (
                            <div className="bg-green-50 p-3 rounded">
                              <div className="font-semibold text-green-700">Mappings</div>
                              <div className="text-gray-700">
                                🔗 Created: {importStatus.apiResult.mappings.created}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Show errors if any */}
                        {importStatus.apiResult.errors && importStatus.apiResult.errors.length > 0 && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <div className="font-semibold text-yellow-700 mb-2">
                              ⚠️ Warnings ({importStatus.apiResult.errors.length}):
                            </div>
                            <div className="text-sm text-gray-700 max-h-40 overflow-y-auto">
                              {importStatus.apiResult.errors.map((error, idx) => (
                                <div key={idx} className="mb-1">• {error}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Data Preview */}
                    {importStatus.jsonData && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-700 mb-2">Imported Data Preview:</h4>
                        <div className="bg-gray-800 text-green-400 p-4 rounded overflow-auto max-h-96">
                          <pre className="text-sm">{importStatus.jsonData}</pre>
                        </div>
                      </div>
                    )}
                    
                    {/* Navigation Buttons */}
                    <div className="mt-6 flex gap-4">
                      <button
                        onClick={() => navigate('/requirements')}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        View Requirements
                      </button>
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
                  </>
                )}

                {/* Error State */}
                {!importStatus.loading && importStatus.success === false && (
                  <>
                    <h3 className="font-semibold text-red-700 text-lg mb-2">
                      ❌ Import Failed
                    </h3>
                    <p className="text-red-600">{importStatus.message}</p>
                    
                    {importStatus.error && (
                      <div className="mt-4 p-3 bg-red-100 rounded text-sm">
                        <div className="font-semibold mb-1">Error Details:</div>
                        <pre className="text-red-800 whitespace-pre-wrap">{importStatus.error.toString()}</pre>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
        
        {/* Test Case Import Interface */}
        {activeTab === 'testcases' && (
          <>
            <ImportTestCases onImportSuccess={handleImportSuccess} />
            
            {/* Import Status for Test Cases */}
            {importStatus && activeTab === 'testcases' && (
              <div 
                id="import-status"
                className={`mt-6 p-4 rounded shadow ${
                  importStatus.loading 
                    ? 'bg-blue-50 border border-blue-200'
                    : importStatus.success 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                }`}
                style={{ 
                  animation: 'fadeIn 0.5s',
                  scrollMarginTop: '20px'
                }}
              >
                {/* Loading State */}
                {importStatus.loading && (
                  <>
                    <h3 className="font-semibold text-blue-700 text-lg mb-2 flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Importing to Database...
                    </h3>
                    <p className="text-blue-600">{importStatus.message}</p>
                  </>
                )}

                {/* Success State */}
                {!importStatus.loading && importStatus.success && (
                  <>
                    <h3 className="font-semibold text-green-700 text-lg mb-2">
                      ✅ Import Successful!
                    </h3>
                    <p className="text-green-600 mb-4">{importStatus.message}</p>
                    
                    {/* API Import Summary */}
                    {importStatus.apiResult && (
                      <div className="bg-white p-4 rounded border border-green-300 mb-4">
                        <h4 className="font-medium text-gray-700 mb-2">Database Import Summary:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          {importStatus.apiResult.requirements && (
                            <div className="bg-blue-50 p-3 rounded">
                              <div className="font-semibold text-blue-700">Requirements</div>
                              <div className="text-gray-700">
                                ✅ Imported: {importStatus.apiResult.requirements.imported}<br/>
                                ⏭️ Skipped: {importStatus.apiResult.requirements.skipped}<br/>
                                📊 Total: {importStatus.apiResult.requirements.total}
                              </div>
                            </div>
                          )}
                          
                          {importStatus.apiResult.testCases && (
                            <div className="bg-purple-50 p-3 rounded">
                              <div className="font-semibold text-purple-700">Test Cases</div>
                              <div className="text-gray-700">
                                ✅ Imported: {importStatus.apiResult.testCases.imported}<br/>
                                ⏭️ Skipped: {importStatus.apiResult.testCases.skipped}<br/>
                                📊 Total: {importStatus.apiResult.testCases.total}
                              </div>
                            </div>
                          )}
                          
                          {importStatus.apiResult.mappings && (
                            <div className="bg-green-50 p-3 rounded">
                              <div className="font-semibold text-green-700">Mappings</div>
                              <div className="text-gray-700">
                                🔗 Created: {importStatus.apiResult.mappings.created}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Show errors if any */}
                        {importStatus.apiResult.errors && importStatus.apiResult.errors.length > 0 && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <div className="font-semibold text-yellow-700 mb-2">
                              ⚠️ Warnings ({importStatus.apiResult.errors.length}):
                            </div>
                            <div className="text-sm text-gray-700 max-h-40 overflow-y-auto">
                              {importStatus.apiResult.errors.map((error, idx) => (
                                <div key={idx} className="mb-1">• {error}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Data Preview */}
                    {importStatus.jsonData && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-700 mb-2">Imported Data Preview:</h4>
                        <div className="bg-gray-800 text-green-400 p-4 rounded overflow-auto max-h-96">
                          <pre className="text-sm">{importStatus.jsonData}</pre>
                        </div>
                      </div>
                    )}
                    
                    {/* Navigation Buttons */}
                    <div className="mt-6 flex gap-4">
                      <button
                        onClick={() => navigate('/testcases')}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        View Test Cases
                      </button>
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
                  </>
                )}

                {/* Error State */}
                {!importStatus.loading && importStatus.success === false && (
                  <>
                    <h3 className="font-semibold text-red-700 text-lg mb-2">
                      ❌ Import Failed
                    </h3>
                    <p className="text-red-600">{importStatus.message}</p>
                    
                    {importStatus.error && (
                      <div className="mt-4 p-3 bg-red-100 rounded text-sm">
                        <div className="font-semibold mb-1">Error Details:</div>
                        <pre className="text-red-800 whitespace-pre-wrap">{importStatus.error.toString()}</pre>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
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
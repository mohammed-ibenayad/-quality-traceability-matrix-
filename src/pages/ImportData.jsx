import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import ImportRequirements from '../components/Import/ImportRequirements';

// Import versions for the header
import versionsData from '../data/versions';

/**
 * Page for importing data into the system
 */
const ImportData = () => {
  const [selectedVersion, setSelectedVersion] = useState(versionsData[2]?.id || '');
  const [importStatus, setImportStatus] = useState(null);
  const navigate = useNavigate();

  const handleImportSuccess = (importedRequirements) => {
    // In a real application, this would save to a database or API
    // For demonstration, we'll just show a success message
    
    try {
      // Create a formatted string of the JSON data
      const jsonString = JSON.stringify(importedRequirements, null, 2);
      
      // Create a success message with a count
      setImportStatus({
        success: true,
        message: `Successfully imported ${importedRequirements.length} requirements.`,
        jsonData: jsonString
      });
      
      // In a real application, you would update your data store here
      console.log('Imported requirements:', importedRequirements);
    } catch (error) {
      setImportStatus({
        success: false,
        message: `Error processing import: ${error.message}`
      });
    }
  };

  return (
    <MainLayout
      title="Import Data"
      selectedVersion={selectedVersion}
      setSelectedVersion={setSelectedVersion}
      versions={versionsData}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Import Requirements Data</h1>
        
        <div className="mb-6 bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">How It Works</h2>
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
            <a 
              href="/sample-requirements.jsonc" 
              download 
              className="text-blue-600 hover:underline flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
              Download sample requirements.jsonc
            </a>
          </div>
        </div>
        
        <ImportRequirements onImportSuccess={handleImportSuccess} />
        
        {importStatus && (
          <div className={`mt-6 p-4 rounded shadow ${
            importStatus.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
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
      </div>
    </MainLayout>
  );
};

export default ImportData;
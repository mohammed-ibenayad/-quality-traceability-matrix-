import React, { useState, useRef } from 'react';
import dataStore from '../../services/DataStore';

/**
 * Component for importing test case data via JSONC file upload
 */
const ImportTestCases = ({ onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [validationSuccess, setValidationSuccess] = useState(false);
  const [processedData, setProcessedData] = useState(null);
  const [importOption, setImportOption] = useState('withMapping'); // 'withMapping' or 'onlyTestCases'
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      validateFile(selectedFile);
    }
  };

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      validateFile(droppedFile);
    }
  };

  // Prevent default behavior for drag events
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Validate the selected file
  const validateFile = (selectedFile) => {
    setIsValidating(true);
    setValidationErrors([]);
    setValidationSuccess(false);
    setProcessedData(null);

    // Check file type
    if (!selectedFile.name.endsWith('.json') && !selectedFile.name.endsWith('.jsonc')) {
      setValidationErrors(['File must be in JSONC or JSON format']);
      setIsValidating(false);
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const fileContent = event.target.result;
        // Parse JSONC (remove comments first)
        const jsonContent = fileContent.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
        const testCases = JSON.parse(jsonContent);
        
        // Validate test case structure
        const errors = validateTestCaseData(testCases);
        
        if (errors.length === 0) {
          // Process the data
          const processed = processTestCaseData(testCases);
          setProcessedData(processed);
          setValidationSuccess(true);
        } else {
          setValidationErrors(errors);
        }
      } catch (error) {
        setValidationErrors([`Invalid JSON format: ${error.message}`]);
      }
      
      setIsValidating(false);
    };
    
    reader.onerror = () => {
      setValidationErrors(['Error reading file']);
      setIsValidating(false);
    };
    
    reader.readAsText(selectedFile);
  };

  // Process test case data 
  const processTestCaseData = (testCases) => {
    return testCases.map(tc => {
      // Add any derived fields or processing here
      return {
        ...tc,
        // Ensure default values for optional fields
        automationStatus: tc.automationStatus || 'Manual',
        status: tc.status || 'Not Run',
        lastExecuted: tc.lastExecuted || ''
      };
    });
  };

  // Extract requirement mappings from test cases
  const extractMappings = (testCases) => {
    const mappings = {};
    
    testCases.forEach(tc => {
      if (tc.requirementIds && Array.isArray(tc.requirementIds)) {
        tc.requirementIds.forEach(reqId => {
          if (!mappings[reqId]) {
            mappings[reqId] = [];
          }
          if (!mappings[reqId].includes(tc.id)) {
            mappings[reqId].push(tc.id);
          }
        });
      }
    });
    
    return mappings;
  };

  // Validate test case data structure
  const validateTestCaseData = (data) => {
    const errors = [];
    
    // Check if data is an array
    if (!Array.isArray(data)) {
      errors.push('Test case data must be an array');
      return errors;
    }

    // Required fields
    const requiredFields = ['id', 'name'];
    
    // Valid statuses and automation statuses
    const validStatuses = ['Passed', 'Failed', 'Not Run', 'Blocked'];
    const validAutomationStatuses = ['Automated', 'Manual', 'Planned'];
    
    // Track IDs to check for duplicates
    const ids = new Set();
    
    // Validate each test case
    data.forEach((tc, index) => {
      // Check required fields
      requiredFields.forEach(field => {
        if (tc[field] === undefined) {
          errors.push(`Test case at index ${index} (${tc.id || 'unknown'}) is missing required field '${field}'`);
        }
      });
      
      // Check for duplicate IDs
      if (tc.id) {
        if (ids.has(tc.id)) {
          errors.push(`Duplicate ID '${tc.id}' found`);
        } else {
          ids.add(tc.id);
        }
        
        // Check ID format (TC_XXX)
        if (!/^TC_\d+$/.test(tc.id)) {
          errors.push(`Invalid ID format for '${tc.id}'. Expected format: TC_XXX where XXX is a number`);
        }
      }
      
      // Validate status if provided
      if (tc.status && !validStatuses.includes(tc.status)) {
        errors.push(`Invalid status '${tc.status}' for ${tc.id || `test case at index ${index}`}. Must be one of: ${validStatuses.join(', ')}`);
      }
      
      // Validate automation status if provided
      if (tc.automationStatus && !validAutomationStatuses.includes(tc.automationStatus)) {
        errors.push(`Invalid automationStatus '${tc.automationStatus}' for ${tc.id || `test case at index ${index}`}. Must be one of: ${validAutomationStatuses.join(', ')}`);
      }
      
      // Validate requirement IDs if provided
      if (tc.requirementIds) {
        if (!Array.isArray(tc.requirementIds)) {
          errors.push(`requirementIds for ${tc.id || `test case at index ${index}`} must be an array`);
        } else {
          tc.requirementIds.forEach(reqId => {
            if (!/^REQ-\d+$/.test(reqId)) {
              errors.push(`Invalid requirement ID format '${reqId}' for test case ${tc.id || `at index ${index}`}. Expected format: REQ-XXX`);
            }
          });
        }
      }
      
      // Validate lastExecuted date format if provided
      if (tc.lastExecuted && tc.lastExecuted !== '') {
        if (isNaN(Date.parse(tc.lastExecuted))) {
          errors.push(`Invalid date format for lastExecuted '${tc.lastExecuted}' for ${tc.id || `test case at index ${index}`}`);
        }
      }
    });
    
    return errors;
  };

  // Process the import
  const handleImport = () => {
    if (!processedData || !validationSuccess) return;
    
    try {
      // Update the DataStore with test cases
      const updatedTestCases = dataStore.setTestCases(processedData);
      
      // If importing with mapping, extract and update mappings
      if (importOption === 'withMapping') {
        const mappings = extractMappings(processedData);
        
        // Update the mapping in the DataStore
        // This preserves existing mappings for requirements not in the current import
        if (Object.keys(mappings).length > 0) {
          dataStore.updateMappings(mappings);
        }
      }
      
      // Notify parent component of successful import
      if (onImportSuccess) {
        onImportSuccess(updatedTestCases);
      }
      
      // Reset the form
      resetForm();

      console.log("Test cases imported successfully:", updatedTestCases);
    } catch (error) {
      console.error("Error importing test cases:", error);
      setValidationErrors([`Error importing data: ${error.message}`]);
    }
  };

  // Reset the form
  const resetForm = () => {
    setFile(null);
    setValidationErrors([]);
    setValidationSuccess(false);
    setProcessedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Import Test Cases</h2>
      
      {/* Import Options */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Import Option
        </label>
        <div className="flex space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio text-blue-600"
              name="importOption"
              value="withMapping"
              checked={importOption === 'withMapping'}
              onChange={() => setImportOption('withMapping')}
            />
            <span className="ml-2">Import with requirement mappings</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio text-blue-600"
              name="importOption"
              value="onlyTestCases"
              checked={importOption === 'onlyTestCases'}
              onChange={() => setImportOption('onlyTestCases')}
            />
            <span className="ml-2">Import test cases only</span>
          </label>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {importOption === 'withMapping' 
            ? 'Test cases containing requirementIds will be linked to those requirements automatically.'
            : 'Only test case data will be imported. Existing mappings will be preserved.'}
        </p>
      </div>
      
      {/* File Upload Area */}
      <div 
        className={`mb-4 border-2 border-dashed rounded-lg p-6 text-center ${
          file ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="mb-3">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4h-12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="mt-1 text-sm text-gray-600">
            Drag and drop your JSONC file here, or
          </p>
        </div>
        
        <input
          type="file"
          accept=".json,.jsonc"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="hidden"
          id="test-case-file-upload"
        />
        <label
          htmlFor="test-case-file-upload"
          className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Select File
        </label>
        
        {file && (
          <div className="mt-3 text-sm text-gray-600">
            Selected file: <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
          </div>
        )}
      </div>
      
      {/* Validation Status */}
      {isValidating && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-blue-700">
            <svg className="inline w-5 h-5 mr-2 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Validating file...
          </p>
        </div>
      )}
      
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="text-red-700 font-medium mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
            </svg>
            Validation Errors:
          </h3>
          <ul className="list-disc pl-5 text-red-600 text-sm space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-red-700">
            Please correct these errors and try again.
          </p>
        </div>
      )}
      
      {/* Validation Success */}
      {validationSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="text-green-700 font-medium mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
            </svg>
            File Validated Successfully
          </h3>
          <p className="text-green-700 text-sm">
            Your test case file has been validated and processed. Ready to import.
          </p>
          
          {processedData && (
            <div className="mt-3 text-sm text-green-700">
              <p>Found {processedData.length} test cases</p>
              {importOption === 'withMapping' && (
                <p className="mt-1">
                  {Object.keys(extractMappings(processedData)).length} requirements will be mapped
                </p>
              )}
              <details className="mt-2">
                <summary className="cursor-pointer hover:underline">View Data Summary</summary>
                <div className="mt-2 p-2 bg-white rounded text-xs font-mono overflow-auto max-h-32">
                  {processedData.map((tc, i) => (
                    <div key={i} className="mb-1">
                      {tc.id}: {tc.name} ({tc.status}, {tc.automationStatus})
                      {tc.requirementIds && importOption === 'withMapping' && (
                        <span> → {tc.requirementIds.join(', ')}</span>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleImport}
          disabled={!validationSuccess}
          className={`px-4 py-2 rounded-md shadow-sm ${
            validationSuccess
              ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Import Test Cases
        </button>
        
        <button
          onClick={resetForm}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Reset
        </button>
      </div>
      
      {/* Help Text */}
      <div className="mt-6 text-xs text-gray-500 border-t pt-3">
        <p className="font-medium mb-1">Expected Format:</p>
        <pre className="p-2 bg-gray-50 rounded overflow-x-auto">
{`[
  {
    "id": "TC-001",
    "name": "Valid Login",
    "description": "Test valid user login",
    "steps": ["Enter username", "Enter password", "Click login"],
    "expectedResult": "User logged in successfully",
    "status": "Passed", // Passed, Failed, Not Run, Blocked
    "automationStatus": "Automated", // Automated, Manual, Planned
    "lastExecuted": "2025-03-15",
    "requirementIds": ["REQ-001", "REQ-002"] // Optional, for mapping
  },
  // More test cases...
]`}
        </pre>
      </div>
    </div>
  );
};

export default ImportTestCases;
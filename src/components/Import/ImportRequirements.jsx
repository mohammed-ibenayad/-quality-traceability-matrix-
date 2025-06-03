import React, { useState, useRef } from 'react';
import dataStore from '../../services/DataStore';

/**
 * Component for importing requirements data via JSONC file upload
 */
const ImportRequirements = ({ onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [validationSuccess, setValidationSuccess] = useState(false);
  const [processedData, setProcessedData] = useState(null);
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
        const requirements = JSON.parse(jsonContent);
        
        // Validate requirements structure
        const errors = validateRequirementsData(requirements);
        
        if (errors.length === 0) {
          // Process the data to calculate TDF and minTestCases
          const processed = processRequirementsData(requirements);
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

  // Process requirements data to add calculated fields
  const processRequirementsData = (requirements) => {
    return requirements.map(req => {
      // Calculate Test Depth Factor if not provided
      const testDepthFactor = req.testDepthFactor || (
        (req.businessImpact * 0.4) + 
        (req.technicalComplexity * 0.3) + 
        (req.regulatoryFactor * 0.2) + 
        (req.usageFrequency * 0.1)
      );
      
      // Determine minimum test cases if not provided
      let minTestCases = req.minTestCases;
      if (!minTestCases) {
        if (testDepthFactor >= 4.1) minTestCases = 8;
        else if (testDepthFactor >= 3.1) minTestCases = 5;
        else if (testDepthFactor >= 2.1) minTestCases = 3;
        else minTestCases = 1;
      }
      
      return {
        ...req,
        testDepthFactor: parseFloat(testDepthFactor.toFixed(1)),
        minTestCases
      };
    });
  };

  // Validate requirements data structure
  const validateRequirementsData = (data) => {
    const errors = [];
    
    // Check if data is an array
    if (!Array.isArray(data)) {
      errors.push('Requirements data must be an array');
      return errors;
    }

    // Required fields
    const requiredFields = ['id', 'name', 'description', 'priority', 'businessImpact', 
                           'technicalComplexity', 'regulatoryFactor', 'usageFrequency'];
    
    // Track IDs to check for duplicates
    const ids = new Set();
    
    // Validate each requirement
    data.forEach((req, index) => {
      // Check required fields
      requiredFields.forEach(field => {
        if (req[field] === undefined) {
          errors.push(`Requirement at index ${index} (${req.id || 'unknown'}) is missing required field '${field}'`);
        }
      });
      
      // Check for duplicate IDs
      if (req.id) {
        if (ids.has(req.id)) {
          errors.push(`Duplicate ID '${req.id}' found`);
        } else {
          ids.add(req.id);
        }
        
        // Check ID format
        if (!/^REQ-\d+$/.test(req.id)) {
          errors.push(`Invalid ID format for '${req.id}'. Expected format: REQ-XXX where XXX is a number`);
        }
      }
      
      // Validate rating fields (1-5 range)
      ['businessImpact', 'technicalComplexity', 'regulatoryFactor', 'usageFrequency'].forEach(field => {
        if (req[field] !== undefined) {
          const value = req[field];
          if (typeof value !== 'number' || value < 1 || value > 5) {
            errors.push(`Invalid ${field} value '${value}' for ${req.id || `requirement at index ${index}`}. Must be between 1 and 5`);
          }
        }
      });
      
      // Validate priority
      if (req.priority && !['High', 'Medium', 'Low'].includes(req.priority)) {
        errors.push(`Invalid priority '${req.priority}' for ${req.id || `requirement at index ${index}`}. Must be 'High', 'Medium', or 'Low'`);
      }
    });
    
    return errors;
  };

  // Process the import
  const handleImport = () => {
    if (!processedData || !validationSuccess) return;
    
    try {
      // Update the DataStore - THIS IS THE CRITICAL PART THAT WASN'T WORKING
      const updatedRequirements = dataStore.setRequirements(processedData);
      
      // Notify parent component of successful import
      if (onImportSuccess) {
        onImportSuccess(updatedRequirements);
      }
      
      // Reset the form
      resetForm();

      console.log("Requirements imported successfully:", updatedRequirements);
    } catch (error) {
      console.error("Error importing requirements:", error);
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
      <h2 className="text-xl font-semibold mb-4">Import Requirements</h2>
      
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
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
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
      
      {/* Sample File Section - Moved here for better visibility */}
      <div className="mb-4 text-sm bg-gray-50 p-3 rounded border border-gray-200">
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
            Your requirements file has been validated and processed. Ready to import.
          </p>
          
          {processedData && (
            <div className="mt-3 text-sm text-green-700">
              <p>Found {processedData.length} requirements</p>
              <details className="mt-2">
                <summary className="cursor-pointer hover:underline">View Data Summary</summary>
                <div className="mt-2 p-2 bg-white rounded text-xs font-mono overflow-auto max-h-32">
                  {processedData.map((req, i) => (
                    <div key={i} className="mb-1">
                      {req.id}: {req.name} (TDF: {req.testDepthFactor}, Min Tests: {req.minTestCases})
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
          Import Requirements
        </button>
        
        <button
          onClick={resetForm}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default ImportRequirements;
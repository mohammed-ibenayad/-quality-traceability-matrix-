import React, { useState, useRef } from 'react';

/**
 * Component for importing requirements data via JSONC file upload
 */
const ImportRequirements = ({ onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [validationSuccess, setValidationSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      validateFile(selectedFile);
    }
  };

  // Validate the selected file
  const validateFile = (selectedFile) => {
    setIsValidating(true);
    setValidationErrors([]);
    setValidationSuccess(false);

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
          errors.push(`Requirement at index ${index} is missing required field '${field}'`);
        }
      });
      
      // Check for duplicate IDs
      if (req.id) {
        if (ids.has(req.id)) {
          errors.push(`Duplicate ID '${req.id}' found`);
        } else {
          ids.add(req.id);
        }
        
        // Check ID format (optional)
        if (!/^REQ-\d+$/.test(req.id)) {
          errors.push(`Invalid ID format for '${req.id}'. Expected format: REQ-XXX`);
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
    if (!file || !validationSuccess) return;
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const fileContent = event.target.result;
        // Parse JSONC (remove comments first)
        const jsonContent = fileContent.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
        const requirements = JSON.parse(jsonContent);
        
        // Calculate TDF and minTestCases for each requirement
        const processedRequirements = requirements.map(req => {
          // Calculate Test Depth Factor
          const testDepthFactor = (
            (req.businessImpact * 0.4) + 
            (req.technicalComplexity * 0.3) + 
            (req.regulatoryFactor * 0.2) + 
            (req.usageFrequency * 0.1)
          );
          
          // Determine minimum test cases
          let minTestCases;
          if (testDepthFactor >= 4.1) minTestCases = 8;
          else if (testDepthFactor >= 3.1) minTestCases = 5;
          else if (testDepthFactor >= 2.1) minTestCases = 3;
          else minTestCases = 1;
          
          return {
            ...req,
            testDepthFactor: parseFloat(testDepthFactor.toFixed(1)),
            minTestCases
          };
        });
        
        // Notify parent component of successful import
        if (onImportSuccess) {
          onImportSuccess(processedRequirements);
        }
        
        // Reset the form
        setFile(null);
        setValidationSuccess(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
      } catch (error) {
        setValidationErrors([`Error processing file: ${error.message}`]);
      }
    };
    
    reader.onerror = () => {
      setValidationErrors(['Error reading file']);
    };
    
    reader.readAsText(file);
  };

  // Reset the form
  const handleReset = () => {
    setFile(null);
    setValidationErrors([]);
    setValidationSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Import Requirements</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select JSONC Requirements File
        </label>
        <input
          type="file"
          accept=".json,.jsonc"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <p className="mt-1 text-sm text-gray-500">
          Upload a JSONC file containing requirements data
        </p>
      </div>
      
      {isValidating && (
        <div className="mb-4 text-blue-600">
          <p>Validating file...</p>
        </div>
      )}
      
      {validationErrors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <h3 className="text-red-700 font-medium mb-2">Validation Errors:</h3>
          <ul className="list-disc pl-5 text-red-600 text-sm">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      {validationSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-green-700">✓ File validated successfully. Ready to import.</p>
        </div>
      )}
      
      <div className="flex gap-3 mt-4">
        <button
          onClick={handleImport}
          disabled={!validationSuccess}
          className={`px-4 py-2 rounded ${
            validationSuccess
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Import Requirements
        </button>
        
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default ImportRequirements;
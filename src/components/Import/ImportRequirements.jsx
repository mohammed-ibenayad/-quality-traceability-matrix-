import React, { useState, useRef } from 'react';
import Papa from 'papaparse'; // Add Papa Parse for CSV parsing
import dataStore from '../../services/DataStore';

/**
 * Component for importing requirements data via file upload
 * Now supports JSON, JSONC, and CSV formats
 */
const ImportRequirements = ({ onImportStart, onImportSuccess }) => {
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

    // Check file type - Add CSV support
    const validExtensions = ['.json', '.jsonc', '.csv'];
    const fileName = selectedFile.name.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    if (!hasValidExtension) {
      setValidationErrors(['File must be in JSON, JSONC, or CSV format']);
      setIsValidating(false);
      return;
    }

    // Route to appropriate parser based on file type
    if (fileName.endsWith('.csv')) {
      parseCSVFile(selectedFile);
      return;
    } else {
      parseJSONFile(selectedFile);
    }
  };

  // Parse JSON/JSONC files
  const parseJSONFile = (selectedFile) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const fileContent = event.target.result;
        // Parse JSONC (remove comments first)
        const jsonContent = fileContent.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '');
        const data = JSON.parse(jsonContent);

        // Ensure it's an array
        const requirementsArray = Array.isArray(data) ? data : [data];

        // Validate the requirements data
        const validationErrors = validateRequirements(requirementsArray);

        if (validationErrors.length > 0) {
          setValidationErrors(validationErrors);
          setIsValidating(false);
          return;
        }

        // Set processed data and validation success
        setProcessedData(requirementsArray);
        setValidationSuccess(true);
        setIsValidating(false);
      } catch (error) {
        console.error("JSON parse error:", error);
        setValidationErrors([`Error parsing file: ${error.message}`]);
        setIsValidating(false);
      }
    };

    reader.onerror = () => {
      setValidationErrors(['Error reading file']);
      setIsValidating(false);
    };

    reader.readAsText(selectedFile);
  };

  // Parse CSV files
  const parseCSVFile = (selectedFile) => {
    Papa.parse(selectedFile, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim(), // Trim whitespace from headers
      complete: (results) => {
        console.log("Papa parse results:", results); // Debug logging

        if (results.errors && results.errors.length > 0) {
          console.error("CSV parsing errors:", results.errors); // Debug logging
          setValidationErrors(results.errors.map(err => `CSV Error: ${err.message}`));
          setIsValidating(false);
          return;
        }

        try {
          // Transform CSV data to match requirements structure
          const transformedData = transformCSVToRequirements(results.data);

          // Check if we have any valid rows
          if (transformedData.length === 0) {
            setValidationErrors(['No valid requirements found in the file. Please ensure your CSV has at least one row with ID and Name/Title columns.']);
            setIsValidating(false);
            return;
          }

          // Validate the requirements data
          const validationErrors = validateRequirements(transformedData);

          if (validationErrors.length > 0) {
            setValidationErrors(validationErrors);
            setIsValidating(false);
            return;
          }

          // Set processed data and validation success
          setProcessedData(transformedData);
          setValidationSuccess(true);
          setIsValidating(false);
        } catch (error) {
          console.error("CSV transform error:", error);
          setValidationErrors([`Error processing CSV: ${error.message}`]);
          setIsValidating(false);
        }
      },
      error: (error) => {
        console.error("Papa parse error:", error); // Debug logging
        setValidationErrors([`Error parsing CSV: ${error.message}`]);
        setIsValidating(false);
      }
    });
  };

  // Transform CSV data to match requirements structure
  const transformCSVToRequirements = (csvData) => {
    console.log("CSV data:", csvData); // Debug logging

    // Check if we have actual data
    if (!csvData || csvData.length === 0) {
      throw new Error("CSV file appears to be empty");
    }

    // Check the column names in the CSV
    const firstRow = csvData[0];
    console.log("CSV columns:", Object.keys(firstRow)); // Debug logging

    return csvData.map((row, index) => {
      // Create a new requirement object with case-insensitive field mapping
      // This handles variations in column names regardless of case
      const keysLower = Object.keys(row).reduce((acc, key) => {
        acc[key.toLowerCase()] = key;
        return acc;
      }, {});

      // Function to get value regardless of case
      const getValue = (possibleNames) => {
        for (const name of possibleNames) {
          // Try exact match first
          if (row[name] !== undefined) return row[name];
          // Then try case-insensitive match
          const lowerName = name.toLowerCase();
          if (keysLower[lowerName] && row[keysLower[lowerName]] !== undefined) {
            return row[keysLower[lowerName]];
          }
        }
        return undefined;
      };

      // Extract values with flexible column name matching
      const requirement = {
        id: getValue(['id', 'ID', 'requirement_id', 'requirement id', 'requirementid']) || `REQ-${index + 1}`,
        name: getValue(['name', 'Name', 'title', 'Title', 'summary', 'Summary', 'requirement', 'Requirement']) || '',
        description: getValue(['description', 'Description', 'details', 'Details']) || '',
        priority: mapPriority(getValue(['priority', 'Priority'])),
        status: getValue(['status', 'Status']) || 'Active',
        category: getValue(['category', 'Category', 'type', 'Type', 'section', 'Section']) || '',
        testDepthFactor: parseFloat(getValue(['testDepthFactor', 'TestDepthFactor', 'tdf', 'TDF']) || '1.0') || 1.0,
        minTestCases: parseInt(getValue(['minTestCases', 'MinTestCases', 'min test cases', 'Min Test Cases']) || '1', 10) || 1,
        businessImpact: parseRating(getValue(['businessImpact', 'BusinessImpact', 'business impact', 'Business Impact'])),
        technicalComplexity: parseRating(getValue(['technicalComplexity', 'TechnicalComplexity', 'technical complexity', 'Technical Complexity'])),
        regulatoryFactor: parseRating(getValue(['regulatoryFactor', 'RegulatoryFactor', 'regulatory factor', 'Regulatory Factor'])),
        usageFrequency: parseRating(getValue(['usageFrequency', 'UsageFrequency', 'usage frequency', 'Usage Frequency'])),
        user_role: getValue(['user_role', 'UserRole', 'role', 'Role']),
        versions: getValue(['versions', 'Versions', 'applicable versions', 'Applicable Versions']),
        tags: getValue(['tags', 'Tags'])
      };

      // Log the created requirement for debugging
      console.log(`Created requirement ${index}:`, requirement);

      return requirement;
    }).filter(req => req.id && req.name); // Filter out any rows without ID or name
  };

  // Helper to map priority values
  const mapPriority = (priority) => {
    if (!priority) return 'Medium';

    const val = String(priority).toLowerCase();
    if (['high', '1', 'critical'].includes(val)) return 'High';
    if (['medium', '2', 'major'].includes(val)) return 'Medium';
    if (['low', '3', 'minor'].includes(val)) return 'Low';

    return 'Medium';
  };

  // Helper to parse rating values (1-5)
  const parseRating = (value) => {
    if (value === undefined || value === null || value === '') return 3; // Default to middle value

    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) return 3;

    return Math.min(Math.max(parsed, 1), 5); // Clamp between 1-5
  };

  // Validate requirements data
  const validateRequirements = (requirements) => {
    const errors = [];

    if (!requirements || requirements.length === 0) {
      errors.push('No requirements found in the file');
      return errors;
    }

    console.log(`Validating ${requirements.length} requirements`); // Debug logging

    // Check for required fields and format validation
    requirements.forEach((req, index) => {
      // If this is an empty object or missing crucial fields, skip detailed validation
      if (!req || Object.keys(req).length === 0) {
        errors.push(`Empty requirement object at index ${index}`);
        return;
      }

      console.log(`Validating requirement ${index}:`, req.id); // Debug logging

      // Validate ID format and uniqueness
      if (!req.id) {
        errors.push(`Missing ID for requirement at index ${index}`);
      } else if (typeof req.id === 'string') {
        // Only validate ID format if it's not an auto-generated one (doesn't start with REQ-)
        // or if it is a REQ- ID, ensure it follows the pattern
        if (req.id.startsWith('REQ-') && !/^REQ-\d+$/.test(req.id)) {
          errors.push(`Invalid ID format: ${req.id}. Expected format: REQ-XXX where XXX is a number`);
        }
      }

      // Validate name is present
      if (!req.name || (typeof req.name === 'string' && req.name.trim() === '')) {
        errors.push(`Missing Name/Title for requirement with ID ${req.id || `at index ${index}`}`);
      }

      // Validate rating fields (1-5 range) if they exist
      ['businessImpact', 'technicalComplexity', 'regulatoryFactor', 'usageFrequency'].forEach(field => {
        if (req[field] !== undefined && req[field] !== null) {
          const value = req[field];
          if (typeof value !== 'number' || isNaN(value) || value < 1 || value > 5) {
            errors.push(`Invalid ${field} value '${value}' for ${req.id || `requirement at index ${index}`}. Must be between 1 and 5`);
          }
        }
      });

      // Validate priority if present
      if (req.priority && !['High', 'Medium', 'Low'].includes(req.priority)) {
        errors.push(`Invalid priority '${req.priority}' for ${req.id || `requirement at index ${index}`}. Must be 'High', 'Medium', or 'Low'`);
      }
    });

    return errors;
  };

  // Process the import
  const handleImport = async () => {  // ✅ CHANGED: Make it async
    if (!processedData || !validationSuccess) return;

    onImportStart?.();

    try {
      console.log('🔍 Current workspace ID in DataStore:', dataStore._currentWorkspaceId);
      const savedWorkspace = localStorage.getItem('currentWorkspace');
      console.log('🔍 Saved workspace in localStorage:', savedWorkspace);

      console.log(`📥 Importing ${processedData.length} requirements...`);
      // ✅ CHANGED: Loop through and add each requirement individually
      // This ensures each one gets sent to the API with workspace_id
      const importedRequirements = [];
      const errors = [];

      for (const requirement of processedData) {
        try {
          await dataStore.addRequirement(requirement);
          importedRequirements.push(requirement);
          console.log(`✅ Imported requirement: ${requirement.id}`);
        } catch (error) {
          console.error(`❌ Failed to import ${requirement.id}:`, error.message);
          errors.push(`${requirement.id}: ${error.message}`);
        }
      }

      // Show results
      if (errors.length > 0) {
        console.warn(`⚠️ ${errors.length} requirements failed to import:`, errors);
        alert(`Imported ${importedRequirements.length} requirements, ${errors.length} failed:\n${errors.join('\n')}`);
      } else {
        console.log(`🎉 Successfully imported all ${importedRequirements.length} requirements`);
      }

      // Notify parent component of successful import
      if (onImportSuccess) {
        onImportSuccess(importedRequirements);
      }

      // Reset the form
      resetForm();

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

  // Generate CSV template with sample requirements
  const generateCSVTemplate = () => {
    const csvData = [
      {
        'ID': 'SAMPLE-REQ-001',
        'Name': '[SAMPLE] User Authentication',
        'Description': '[DEMO] Users should be able to log in to their account using valid credentials.',
        'Priority': 'High',
        'Type': 'Functional',
        'BusinessImpact': 5,
        'TechnicalComplexity': 3,
        'RegulatoryFactor': 3,
        'UsageFrequency': 4,
        'Versions': 'sample-v1.0',
        'Status': 'Active',
        'User_Role': 'End User',
        'Tags': 'Sample,Authentication,Account,Security'
      },
      {
        'ID': 'SAMPLE-REQ-002',
        'Name': '[SAMPLE] Dashboard Content and Display',
        'Description': '[DEMO] The homepage dashboard should display all essential e-commerce elements.',
        'Priority': 'High',
        'Type': 'Functional',
        'BusinessImpact': 5,
        'TechnicalComplexity': 3,
        'RegulatoryFactor': 2,
        'UsageFrequency': 5,
        'Versions': 'sample-v1.0',
        'Status': 'Active',
        'User_Role': 'End User',
        'Tags': 'Sample,Dashboard,Homepage,UI'
      },
      {
        'ID': 'SAMPLE-REQ-003',
        'Name': '[SAMPLE] Interactions with Dashboard Elements',
        'Description': '[DEMO] Users should be able to interact with all dashboard elements.',
        'Priority': 'Medium',
        'Type': 'Functional',
        'BusinessImpact': 4,
        'TechnicalComplexity': 4,
        'RegulatoryFactor': 2,
        'UsageFrequency': 5,
        'Versions': 'sample-v1.0',
        'Status': 'Active',
        'User_Role': 'End User',
        'Tags': 'Sample,Interactions,Navigation,UX'
      }
    ];

    // Add instructional rows
    const instructionRows = [
      {
        'ID': '# INSTRUCTIONS - DELETE THESE ROWS BEFORE IMPORTING',
        'Name': 'Only fill the columns you need - empty columns will be ignored',
        'Description': 'The system supports multiple column name variations for flexibility',
        'Priority': 'High/Medium/Low or 1/2/3 or Critical/Major/Minor',
        'Type': 'Functional, Non-Functional, Security, etc.',
        'BusinessImpact': 'Value from 1-5 (5 is highest impact)',
        'TechnicalComplexity': 'Value from 1-5 (5 is most complex)',
        'RegulatoryFactor': 'Value from 1-5 (5 is highest regulation need)',
        'UsageFrequency': 'Value from 1-5 (5 is most frequently used)',
        'Versions': 'Comma-separated list of applicable versions',
        'Status': 'Active, In Review, Approved, etc.',
        'User_Role': 'End User, Administrator, Guest, etc.',
        'Tags': 'Comma-separated tags for categorization'
      }
    ];

    const allData = [...instructionRows, ...csvData];

    // Convert to CSV
    const headers = Object.keys(allData[0]);
    const csvRows = allData.map(row =>
      headers.map(header => {
        const value = row[header] || '';
        if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );

    const csvContent = [headers.join(','), ...csvRows].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'requirements-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate JSONC template
  const generateJSONTemplate = () => {
    const sampleTemplate = [
      {
        id: "SAMPLE-REQ-001",
        name: "[SAMPLE] User Authentication",
        description: "[DEMO] Users should be able to log in to their account using valid credentials.",
        priority: "High",
        type: "Functional",
        businessImpact: 5,
        technicalComplexity: 3,
        regulatoryFactor: 3,
        usageFrequency: 4,
        versions: ["sample-v1.0"],
        status: "Active",
        user_role: "End User",
        tags: ["Sample", "Authentication", "Account", "Security"]
      },
      {
        id: "SAMPLE-REQ-002",
        name: "[SAMPLE] Dashboard Content",
        description: "[DEMO] The homepage dashboard should display all essential e-commerce elements.",
        priority: "Medium",
        type: "Functional",
        businessImpact: 4,
        technicalComplexity: 3,
        regulatoryFactor: 2,
        usageFrequency: 5,
        versions: ["sample-v1.0"],
        status: "Active",
        user_role: "End User",
        tags: ["Sample", "Dashboard", "Homepage", "UI"]
      }
    ];

    // Create JSONC with comments
    const jsonContent =
      `// Requirements Sample Template
// Delete these comments before importing
/* 
  Required fields:
  - id: Unique identifier (format is flexible)
  - name: Short name or title of requirement
  
  Optional fields with defaults:
  - description: Detailed description (default: "")
  - priority: High, Medium, Low (default: "Medium")
  - type: Functional, Non-Functional, etc. (default: "Functional")
  - status: Active, Inactive, etc. (default: "Active")
  - businessImpact: 1-5 (default: 3)
  - technicalComplexity: 1-5 (default: 3)
  - regulatoryFactor: 1-5 (default: 3)
  - usageFrequency: 1-5 (default: 3)
  - versions: Array of applicable versions (default: [])
  - user_role: Who will use this feature (default: "")
  - tags: Array of tags for categorization (default: [])
*/

${JSON.stringify(sampleTemplate, null, 2)}`;

    // Download file
    const blob = new Blob([jsonContent], { type: 'application/jsonc;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'requirements-template.jsonc');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Import Requirements</h2>

      {/* File Upload Area */}
      <div
        className={`mb-4 border-2 border-dashed rounded-lg p-6 text-center ${file ?
          (validationErrors.length > 0 ? 'border-red-300 bg-red-50' :
            validationSuccess ? 'border-green-300 bg-green-50' : 'border-blue-300 bg-blue-50')
          : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.jsonc,.csv"
          onChange={handleFileChange}
          className="hidden"
          id="requirement-file-input"
        />

        {!file && (
          <div>
            <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            <p className="mt-4 text-gray-700">
              Drag and drop your JSON, JSONC, or CSV file here or{' '}
              <label htmlFor="requirement-file-input" className="text-blue-600 hover:text-blue-800 cursor-pointer">
                browse
              </label>
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Supported file types: .json, .jsonc, .csv
            </p>
            <div className="mt-4 flex justify-center space-x-4">
              <button
                onClick={generateJSONTemplate}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Download JSONC Template
              </button>
              <span className="text-gray-400">|</span>
              <button
                onClick={generateCSVTemplate}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Download CSV Template
              </button>
            </div>
          </div>
        )}

        {file && (
          <div>
            <p className="text-lg mb-2">
              <span className="font-medium">{file.name}</span> ({Math.round(file.size / 1024)} KB)
            </p>

            {isValidating && (
              <div className="my-4 flex items-center justify-center">
                <svg className="w-6 h-6 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                <span className="ml-2 text-blue-600">Validating...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-md">
          <h3 className="text-red-700 text-md font-semibold mb-2">Validation Errors:</h3>
          <ul className="list-disc list-inside text-red-600 text-sm space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Validation Success */}
      {validationSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-green-700 text-md font-semibold mb-2">Validation Successful</h3>
          <p className="text-green-600">
            Ready to import.
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

          {/* Import button inside validation success box */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleImport}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
              </svg>
              Confirm and Import
            </button>

            <button
              onClick={resetForm}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Reset
            </button>
          </div>
        </div>
      )}
      {/* Show Reset button only if a file is selected but validation failed */}
      {file && validationErrors.length > 0 && (
        <div className="flex justify-end mt-4">
          <button
            onClick={resetForm}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Reset
          </button>
        </div>
      )}
    </div>
  );
};

export default ImportRequirements;
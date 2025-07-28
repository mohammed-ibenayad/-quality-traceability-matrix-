import React, { useState, useRef } from 'react';
import { GitBranch } from 'lucide-react';
import Papa from 'papaparse'; // NEW: Add Papa Parse for CSV parsing
import dataStore from '../../services/DataStore';
import GitHubImportTestCases from './GitHubImportTestCases'; // Corrected import path

/**
 * Enhanced component for importing test case data via multiple sources
 * This adds GitHub import as a new tab to your existing import interface
 */
const ImportTestCases = ({ onImportSuccess }) => {
  // Check if this is being used in a tabbed interface
  const [showGitHubImport, setShowGitHubImport] = useState(false);
  
  console.log('🔄 ImportTestCases render - showGitHubImport:', showGitHubImport);
  
  // File import state (existing functionality)
  const [file, setFile] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [validationSuccess, setValidationSuccess] = useState(false);
  const [processedData, setProcessedData] = useState(null);
  const [importOption, setImportOption] = useState('withMapping');
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

    // Check file type - ADD .csv support
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

  // NEW: Parse JSON/JSONC files
  const parseJSONFile = (selectedFile) => {
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

  // NEW: Parse CSV files (generic format)
  const parseCSVFile = (file) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        try {
          console.log('📊 CSV parsing complete. Rows found:', results.data.length);
          console.log('📋 CSV headers:', results.meta.fields);
                  
          if (results.errors.length > 0) {
            console.warn('⚠️ CSV parsing warnings:', results.errors);
          }
                  
          const mappedData = results.data.map(mapCSVRowToQualityTracker); // Updated function call
          const errors = validateTestCaseData(mappedData);
                  
          if (errors.length === 0) {
            const processed = processTestCaseData(mappedData);
            setProcessedData(processed);
            setValidationSuccess(true);
            console.log('✅ CSV import successful:', processed.length, 'test cases');
          } else {
            setValidationErrors(errors);
            console.error('❌ CSV validation errors:', errors);
          }
        } catch (error) {
          setValidationErrors([`CSV processing error: ${error.message}`]);
          console.error('❌ CSV processing error:', error);
        }
        setIsValidating(false);
      },
      error: (error) => {
        setValidationErrors([`CSV file error: ${error.message}`]);
        console.error('❌ CSV file error:', error);
        setIsValidating(false);
      }
    });
  };

  // NEW: Convert CSV row to Quality Tracker format
  const mapCSVRowToQualityTracker = (row) => { // Renamed function
    console.log('🔄 Mapping CSV row:', row); // Updated console log
      
    // Parse test steps (handle multi-line or numbered steps)
    const parseSteps = (stepsText) => {
      if (!stepsText) return [];
      return stepsText.toString().split('\n')
        .map(step => step.trim())
        .filter(step => step.length > 0);
    };
    // Build tags array from multiple TestRail fields
    const buildTags = (row) => {
      const tags = [];
      if (row['Type']) tags.push(row['Type'].toString().trim());
      if (row['Test Level']) tags.push(row['Test Level'].toString().trim());
      if (row['Environment']) tags.push(row['Environment'].toString().trim());
      if (row['Is Automated'] && row['Is Automated'].toString().toLowerCase() === 'yes') {
        tags.push('Regression');
      }
      return tags.filter(Boolean);
    };
    // Convert TestRail priority format
    const mapPriority = (priority) => {
      if (!priority) return 'Medium';
      const priorityStr = priority.toString().toLowerCase();
      const mapping = {
        'high': 'High', 'medium': 'Medium', 'low': 'Low',
        '1': 'High', '2': 'Medium', '3': 'Low',
        'critical': 'High', 'major': 'High', 'minor': 'Low'
      };
      return mapping[priorityStr] || priority || 'Medium';
    };
    // Convert automation status
    const mapAutomationStatus = (automationCandidate) => {
      if (!automationCandidate) return 'Manual';
      const candidate = automationCandidate.toString().toLowerCase();
      return candidate === 'yes' ? 'Automated' : 'Manual';
    };
    // Generate ID if missing
const generateId = (row) => {
  // Try common ID column names
  const idFields = ['TC ID', 'ID', 'Test Case ID', 'TestCase ID', 'Case ID'];
  
  for (const field of idFields) {
    if (row[field]) {
      let id = row[field].toString().trim();
      
      // If ID already starts with TC, use as-is
      if (id.startsWith('TC')) {
        return id;
      }
      
      // If it's just a number, add TC_ prefix
      if (/^\d+$/.test(id)) {
        return `TC_${id.padStart(3, '0')}`;
      }
      
      // Otherwise, add TC_ prefix
      return `TC_${id}`;
    }
  }
  
  // Fallback: generate sequential ID
  return `TC_${Date.now().toString().slice(-6)}`;
};
    const mappedTestCase = {
      id: generateId(row),
      name: (row['Title'] || row['Test Case'] || 'Untitled Test Case').toString(),
      description: (row['Description'] || row['Title'] || '').toString(),
          
      // NEW CSV fields for enhanced test case data
      category: (row['Module'] || row['Suite'] || row['Section'] || row['Category'] || '').toString(), // Added 'Category'
      preconditions: (row['Pre-requisites'] || row['Precondition'] || row['Preconditions'] || '').toString(),
      testData: (row['Test Data'] || row['TestData'] || '').toString(),
          
      // Parse complex fields
      steps: parseSteps(row['Test steps'] || row['Steps'] || ''),
      expectedResult: (row['Expected Result'] || row['Expected'] || '').toString(),
      tags: buildTags(row),
          
      // Map existing fields
      priority: mapPriority(row['Priority']),
      status: row['Status'] || 'Not Run',
      automationStatus: mapAutomationStatus(row['Automation Candidate'] || row['Is Automated']),
          
      // Default values for required Quality Tracker fields
      version: (row['Version'] || '').toString(),
      requirementIds: [], // Will be populated separately if needed
      assignee: (row['Created By'] || row['Assigned To'] || '').toString(),
      lastExecuted: '',
      executedBy: '',
      estimatedDuration: parseInt(row['Estimated Duration']) || 0,
      automationPath: (row['Automation Path'] || '').toString()
    };
    console.log('✅ Mapped test case:', mappedTestCase.id, '-', mappedTestCase.name);
    return mappedTestCase;
  };

  // Process test case data 
  const processTestCaseData = (testCases) => {
    return testCases.map(tc => {
      return {
        ...tc,
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
    
    if (!Array.isArray(data)) {
      errors.push('Test case data must be an array');
      return errors;
    }

    const requiredFields = ['id', 'name'];
    const validStatuses = ['Passed', 'Failed', 'Not Run', 'Blocked', 'Not Found'];
    const validAutomationStatuses = ['Automated', 'Manual', 'Planned'];
    const ids = new Set();
    
    data.forEach((tc, index) => {
      requiredFields.forEach(field => {
        if (tc[field] === undefined) {
          errors.push(`Test case at index ${index} (${tc.id || 'unknown'}) is missing required field '${field}'`);
        }
      });
      
      if (tc.id) {
        if (ids.has(tc.id)) {
          errors.push(`Duplicate ID '${tc.id}' found`);
        } else {
          ids.add(tc.id);
        }
        
        if (!/^TC_\d+$/.test(tc.id)) {
          // errors.push(`Invalid ID format for '${tc.id}'. Expected format: TC_XXX where XXX is a number`);
        }
      }
      
      if (tc.status && !validStatuses.includes(tc.status)) {
        errors.push(`Invalid status '${tc.status}' for ${tc.id || `test case at index ${index}`}. Must be one of: ${validStatuses.join(', ')}`);
      }
      
      if (tc.automationStatus && !validAutomationStatuses.includes(tc.automationStatus)) {
        errors.push(`Invalid automationStatus '${tc.automationStatus}' for ${tc.id || `test case at index ${index}`}. Must be one of: ${validAutomationStatuses.join(', ')}`);
      }
      
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

  // Handle GitHub import success
  const handleGitHubImportSuccess = (importedTestCases) => {
    console.log('✅ GitHub import success called with:', importedTestCases);
    if (onImportSuccess) {
      onImportSuccess(importedTestCases);
    }
    // Switch back to file import view after successful GitHub import
    console.log('🔄 Switching back to file import view');
    setShowGitHubImport(false);
  };

  // Handle GitHub button click
  const handleGitHubButtonClick = () => {
    console.log('🔵 GitHub button clicked! Current showGitHubImport:', showGitHubImport);
    console.log('🔄 Setting showGitHubImport to true...');
    setShowGitHubImport(true);
    console.log('✅ setShowGitHubImport(true) called');
  };

  // Handle back button click
  const handleBackButtonClick = () => {
    console.log('⬅️ Back button clicked!');
    console.log('🔄 Setting showGitHubImport to false...');
    setShowGitHubImport(false);
    console.log('✅ setShowGitHubImport(false) called');
  };

  console.log('🎯 Before render - showGitHubImport is:', showGitHubImport);

  // If showing GitHub import, render that component
  if (showGitHubImport) {
    console.log('🎨 Rendering GitHub import interface');
    return (
      <div className="bg-white p-6 rounded shadow">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Import Test Cases from GitHub</h2>
          <button
            onClick={handleBackButtonClick}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            ← Back to File Import
          </button>
        </div>
        <GitHubImportTestCases onImportSuccess={handleGitHubImportSuccess} />
      </div>
    );
  }

  console.log('🎨 Rendering file import interface');

  // Default file import view (your existing UI)
  return (
    <div className="bg-white p-6 rounded shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Import Test Cases</h2>
        {!showGitHubImport && (
          <button
            onClick={handleGitHubButtonClick}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <GitBranch className="h-4 w-4 mr-2" />
            Import from GitHub
          </button>
        )}
      </div>
      
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
          file ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
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
        />
        
        {file ? (
          <div>
            <svg className="mx-auto h-12 w-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-sm font-medium text-blue-600">{file.name}</p>
            <p className="text-xs text-gray-500">File selected - ready for validation</p>
          </div>
        ) : (
          <div>
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Click to upload
              </button>
              {' '}or drag and drop
            </p>
            <p className="text-xs text-gray-500">JSON, JSONC, or CSV files</p> {/* Updated UI text */}
          </div>
        )}
      </div>

      {/* Sample File Section */}
      <div className="mb-4 text-sm bg-gray-50 p-3 rounded border border-gray-200">
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
      
      {/* CSV Import Information */}
      <div className="mb-4 text-sm bg-blue-50 p-3 rounded border border-blue-200">
        <p className="font-medium mb-1 text-blue-800">CSV Import Support</p>
        <p className="text-blue-700 mb-2">
          Import test cases from CSV files with automatic field mapping.
        </p>
        <div className="text-xs text-blue-600">
          <p className="font-medium">Common CSV fields recognized:</p>
          <ul className="list-disc pl-4 mt-1">
            <li>ID, Title/Name, Steps, Expected Result</li>
            <li>Category, Preconditions, Test Data</li>
            <li>Priority, Status, Automation Status</li>
          </ul>
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
    </div>
  );
};

export default ImportTestCases;

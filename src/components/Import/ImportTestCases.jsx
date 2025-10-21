import React, { useState, useRef } from 'react';
import { GitBranch } from 'lucide-react';
import Papa from 'papaparse';
import dataStore from '../../services/DataStore';
import GitHubImportTestCases from './GitHubImportTestCases';

/**
 * Enhanced component for importing test case data via multiple sources
 */
const ImportTestCases = ({ onImportStart, onImportSuccess }) => {
    // Check if this is being used in a tabbed interface
  const [showGitHubImport, setShowGitHubImport] = useState(false);

  // File import state
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

    // Check file type
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
        const testCasesArray = Array.isArray(data) ? data : [data];

        // Validate the test case data
        const validationErrors = validateTestCases(testCasesArray);

        if (validationErrors.length > 0) {
          setValidationErrors(validationErrors);
          setIsValidating(false);
          return;
        }

        // Set processed data and validation success
        setProcessedData(testCasesArray);
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

  // Parse CSV files with improved error handling
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
          // Transform CSV data to match test cases structure
          const transformedData = transformCSVToTestCases(results.data);

          // Check if we have any valid rows
          if (transformedData.length === 0) {
            setValidationErrors(['No valid test cases found in the file. Please ensure your CSV has at least one row with ID and Name/Title columns.']);
            setIsValidating(false);
            return;
          }

          // Validate the test cases data
          const validationErrors = validateTestCases(transformedData);

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

  // Transform CSV data to match test cases structure
  const transformCSVToTestCases = (csvData) => {
    console.log("CSV data:", csvData); // Debug logging

    // Check if we have actual data
    if (!csvData || csvData.length === 0) {
      throw new Error("CSV file appears to be empty");
    }

    // Check the column names in the CSV
    const firstRow = csvData[0];
    console.log("CSV columns:", Object.keys(firstRow)); // Debug logging

    return csvData.map((row, index) => {
      // Create a new test case object with case-insensitive field mapping
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

      // Extract steps as array
      let steps = [];
      const stepsValue = getValue(['Test steps', 'Steps', 'Steps (Text)', 'test_steps']);
      if (stepsValue) {
        if (typeof stepsValue === 'string') {
          // Split by newlines if it's a string
          steps = stepsValue.split('\n').filter(s => s.trim());
        } else if (Array.isArray(stepsValue)) {
          steps = stepsValue;
        }
      }

      // Extract requirement IDs as array
      let requirementIds = [];
      const reqIdsValue = getValue(['Requirement IDs', 'RequirementIDs', 'Requirements', 'Req IDs', 'requirement_ids']);
      if (reqIdsValue) {
        if (typeof reqIdsValue === 'string') {
          // Split by commas if it's a string
          requirementIds = reqIdsValue.split(',').map(id => id.trim()).filter(id => id);
        } else if (Array.isArray(reqIdsValue)) {
          requirementIds = reqIdsValue;
        }
      }

      // Extract applicable versions as array
      let applicableVersions = [];
      const versionsValue = getValue(['Applicable Versions', 'Version', 'Versions', 'applicable_versions']);
      if (versionsValue) {
        if (typeof versionsValue === 'string') {
          // Split by commas if it's a string
          applicableVersions = versionsValue.split(',').map(v => v.trim()).filter(v => v);
        } else if (Array.isArray(versionsValue)) {
          applicableVersions = versionsValue;
        }
      }

      // Extract tags as array
      let tags = [];
      const tagsValue = getValue(['Tags', 'tags']);
      if (tagsValue) {
        if (typeof tagsValue === 'string') {
          // Split by commas if it's a string
          tags = tagsValue.split(',').map(tag => tag.trim()).filter(tag => tag);
        } else if (Array.isArray(tagsValue)) {
          tags = tagsValue;
        }
      }

      // Extract values with flexible column name matching
      const testCase = {
        id: getValue(['id', 'ID', 'TC ID', 'Test Case ID', 'TestCase ID', 'Case ID']) || `TC-${index + 1}`,
        name: getValue(['name', 'Name', 'title', 'Title', 'Test Case', 'test_name']) || '',
        description: getValue(['description', 'Description', 'details', 'Details']) || '',
        steps: steps,
        expectedResult: getValue(['Expected Result', 'Expected', 'expected_result']) || '',
        priority: mapPriority(getValue(['priority', 'Priority'])),
        status: getValue(['status', 'Status']) || 'Not Run',
        automationStatus: mapAutomationStatus(getValue(['Automation Candidate', 'Is Automated', 'Automation Type', 'automation_status'])),
        category: getValue(['category', 'Category', 'section', 'Section', 'module', 'Module', 'suite', 'Suite']) || '',
        preconditions: getValue(['preconditions', 'Preconditions', 'Pre-requisites', 'Precondition']) || '',
        estimatedDuration: parseEstimatedDuration(getValue(['Estimate', 'Duration', 'estimated_duration', 'Time'])),
        assignee: getValue(['assignee', 'Assigned To', 'Created By', 'assigned_to']) || '',
        requirementIds: requirementIds,
        applicableVersions: applicableVersions,
        tags: tags,
        testType: getValue(['Type', 'Test Type', 'Test Level', 'Environment']) || 'Functional'
      };

      console.log(`Created test case ${index}:`, testCase); // Debug logging

      return testCase;
    }).filter(tc => tc.id && tc.name); // Filter out any rows without ID or name
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

  // Helper to map automation status values
  const mapAutomationStatus = (status) => {
    if (!status) return 'Manual';

    const val = String(status).toLowerCase();
    if (['yes', 'true', 'automated', 'automation'].includes(val)) return 'Automated';
    if (['planned', 'in progress', 'candidate', 'automating'].includes(val)) return 'Candidate';
    if (['no', 'false', 'manual', 'none'].includes(val)) return 'Manual';

    return 'Manual';
  };

  // Helper to parse estimated duration
  const parseEstimatedDuration = (value) => {
    if (!value) return 5; // Default 5 minutes

    if (typeof value === 'number') return value;

    // Try to parse string like "2m", "30s", "1h"
    const str = String(value).toLowerCase();
    if (str.endsWith('s')) return parseInt(str) / 60 || 1; // seconds to minutes
    if (str.endsWith('m')) return parseInt(str) || 5; // minutes
    if (str.endsWith('h')) return parseInt(str) * 60 || 60; // hours to minutes

    return parseInt(str) || 5; // Just try to parse as number, default 5 minutes
  };

  // Validate test cases data
  const validateTestCases = (testCases) => {
    const errors = [];

    if (!testCases || testCases.length === 0) {
      errors.push('No test cases found in the file');
      return errors;
    }

    console.log(`Validating ${testCases.length} test cases`); // Debug logging

    // Check for required fields and format validation
    testCases.forEach((tc, index) => {
      // If this is an empty object or missing crucial fields, skip detailed validation
      if (!tc || Object.keys(tc).length === 0) {
        errors.push(`Empty test case object at index ${index}`);
        return;
      }

      console.log(`Validating test case ${index}:`, tc.id); // Debug logging

      // Validate ID is present
      if (!tc.id) {
        errors.push(`Missing ID for test case at index ${index}`);
      }

      // Validate name is present
      if (!tc.name || (typeof tc.name === 'string' && tc.name.trim() === '')) {
        errors.push(`Missing Name/Title for test case with ID ${tc.id || `at index ${index}`}`);
      }

      // Validate steps is an array
      if (tc.steps && !Array.isArray(tc.steps)) {
        errors.push(`Steps for ${tc.id || `test case at index ${index}`} should be an array of strings`);
      }

      // Validate requirementIds is an array
      if (tc.requirementIds && !Array.isArray(tc.requirementIds)) {
        errors.push(`Requirement IDs for ${tc.id || `test case at index ${index}`} should be an array of strings`);
      }

      // Validate applicableVersions is an array
      if (tc.applicableVersions && !Array.isArray(tc.applicableVersions)) {
        errors.push(`Applicable Versions for ${tc.id || `test case at index ${index}`} should be an array of strings`);
      }

      // Validate tags is an array
      if (tc.tags && !Array.isArray(tc.tags)) {
        errors.push(`Tags for ${tc.id || `test case at index ${index}`} should be an array of strings`);
      }
    });

    return errors;
  };

  // Extract requirement mappings from test cases
  const extractMappings = (testCases) => {
    const mappings = {};

    testCases.forEach(tc => {
      if (tc.requirementIds && Array.isArray(tc.requirementIds) && tc.requirementIds.length > 0) {
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

  // Process the import
  const handleImport = async () => {  // ✅ Make it async
    if (!processedData || processedData.length === 0) {
      return;
    }

    onImportStart?.();

    try {
      // Get existing test cases to check for duplicates
      const existingTestCases = dataStore.getTestCases();
      const existingIds = new Set(existingTestCases.map(tc => tc.id));

      // Filter out duplicates
      const newTestCases = processedData.filter(tc => !existingIds.has(tc.id));

      // Show warning if there are duplicates being skipped
      const duplicateCount = processedData.length - newTestCases.length;
      if (duplicateCount > 0) {
        const proceed = window.confirm(
          `${duplicateCount} test case(s) with duplicate IDs will be skipped.\n` +
          `Continue importing ${newTestCases.length} new test cases?`
        );
        if (!proceed) return;
      }

      console.log(`📥 Importing ${newTestCases.length} test cases...`);

      // ✅ CHANGED: Loop through and add each test case individually
      const importedTestCases = [];
      const errors = [];

      for (const testCase of newTestCases) {
        try {
          await dataStore.addTestCase(testCase);
          importedTestCases.push(testCase);
          console.log(`✅ Imported test case: ${testCase.id}`);
        } catch (error) {
          console.error(`❌ Failed to import ${testCase.id}:`, error.message);
          errors.push(`${testCase.id}: ${error.message}`);
        }
      }

      // Show results
      if (errors.length > 0) {
        console.warn(`⚠️ ${errors.length} test cases failed to import:`, errors);
        alert(`Imported ${importedTestCases.length} test cases, ${errors.length} failed:\n${errors.join('\n')}`);
      } else {
        console.log(`🎉 Successfully imported all ${importedTestCases.length} test cases`);
      }

      // Process requirement mappings if option is selected
      if (importOption === 'withMapping') {
        const mappings = extractMappings(importedTestCases);
        if (Object.keys(mappings).length > 0) {
          dataStore.updateMappings(mappings);
          console.log('✅ Updated requirement mappings:', mappings);
        }
      }

      // Call success handler with imported test cases
      if (onImportSuccess) {
        onImportSuccess(importedTestCases);
      }

      // Reset the form
      setFile(null);
      setProcessedData(null);
      setValidationSuccess(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Import error:', error);
      alert('Import failed: ' + error.message);
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
    if (onImportSuccess) {
      onImportSuccess(importedTestCases);
    }
    // Switch back to file import view after successful GitHub import
    setShowGitHubImport(false);
  };

  // Handle GitHub button click
  const handleGitHubButtonClick = () => {
    setShowGitHubImport(true);
  };

  // Handle back button click
  const handleBackButtonClick = () => {
    setShowGitHubImport(false);
  };

  // Generate simple CSV template with sample test cases
  const generateCSVTemplate = () => {
    const csvData = [
      {
        'ID': 'SAMPLE-TC-001',
        'Title': '[SAMPLE] Login with valid credentials',
        'Description': '[DEMO] Verify that a user can successfully log in using valid credentials',
        'Section': 'Authentication',
        'Priority': 'High',
        'Status': 'Not Run',
        'Automation Candidate': 'Automated',
        'Test steps': 'Navigate to the login page\nEnter valid username in the username field\nEnter valid password in the password field\nClick the Login button',
        'Expected Result': 'User should be successfully logged in and redirected to the dashboard with a welcome message',
        'Type': 'Functional',
        'Preconditions': 'User account must exist in the system with valid credentials',
        'Applicable Versions': 'sample-v1.0',
        'Requirement IDs': 'SAMPLE-REQ-001,SAMPLE-REQ-002',
        'Tags': 'Sample,Authentication,Login,Smoke Test',
        'Estimate': '2m'
      },
      {
        'ID': 'SAMPLE-TC-002',
        'Title': '[SAMPLE] Login with invalid credentials',
        'Description': '[DEMO] Verify appropriate error message when using invalid credentials',
        'Section': 'Authentication',
        'Priority': 'Medium',
        'Status': 'Not Run',
        'Automation Candidate': 'Automated',
        'Test steps': 'Navigate to the login page\nEnter invalid username in the username field\nEnter invalid password in the password field\nClick the Login button\nVerify error message is displayed',
        'Expected Result': 'Error message should be displayed: Invalid username or password. Please try again.',
        'Type': 'Negative',
        'Preconditions': 'Login page must be accessible',
        'Applicable Versions': 'sample-v1.0',
        'Requirement IDs': 'SAMPLE-REQ-001',
        'Tags': 'Sample,Authentication,Login,Negative Testing',
        'Estimate': '1m'
      },
      {
        'ID': 'SAMPLE-TC-003',
        'Title': '[SAMPLE] Dashboard Elements Display',
        'Description': '[DEMO] Verify that all dashboard elements display correctly',
        'Section': 'User Interface',
        'Priority': 'High',
        'Status': 'Not Run',
        'Automation Candidate': 'Manual',
        'Test steps': 'Navigate to the dashboard\nVerify header elements are displayed\nVerify main content area is formatted correctly\nVerify sidebar navigation works\nVerify footer links are accessible',
        'Expected Result': 'All dashboard elements should be properly displayed and formatted according to design specifications',
        'Type': 'UI',
        'Preconditions': 'User must be logged in',
        'Applicable Versions': 'sample-v1.0',
        'Requirement IDs': 'SAMPLE-REQ-002',
        'Tags': 'Sample,Dashboard,UI,Display',
        'Estimate': '3m'
      }
    ];

    // Add instructional row
    const instructionRows = [
      {
        'ID': '# DELETE THIS ROW BEFORE IMPORTING',
        'Title': 'Sample test cases for import - Delete this instruction row',
        'Description': 'This template shows the common fields used for test cases',
        'Section': 'Use > for hierarchical sections',
        'Priority': 'High/Medium/Low',
        'Status': 'Not Run/Passed/Failed',
        'Automation Candidate': 'Manual/Automated/Candidate',
        'Test steps': 'Use new lines to separate steps',
        'Expected Result': 'What should happen when test runs',
        'Type': 'Functional/UI/API/etc.',
        'Preconditions': 'What must be set up first',
        'Applicable Versions': 'Comma-separated versions',
        'Requirement IDs': 'Comma-separated requirement IDs',
        'Tags': 'Comma-separated tags',
        'Estimate': 'Time estimates like 30s, 2m, 1h'
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
    link.setAttribute('download', 'testcases-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate comprehensive CSV template with all possible column variations
  const generateFullCSVTemplate = () => {
    const comprehensiveTemplate = [
      {
        // ID variations (system tries these in order)
        'ID': 'SAMPLE-TC-001',
        'TC ID': '',  // Alternative ID column name
        'Test Case ID': '',  // Alternative ID column name
        'TestCase ID': '',   // Alternative ID column name  
        'Case ID': '',       // Alternative ID column name

        // Name/Title variations
        'Title': '[SAMPLE] Comprehensive Test Case Example',
        'Test Case': '',     // Alternative name column

        // Description
        'Description': '[DEMO] This is a comprehensive example showing all possible fields',

        // Steps variations  
        'Test steps': 'Step 1: Do something\nStep 2: Do something else\nStep 3: Verify result',
        'Steps': '',         // Alternative steps column
        'Steps (Text)': '',  // Alternative steps column

        // Expected Result variations
        'Expected Result': 'The expected outcome after executing all steps',
        'Expected': '',      // Alternative expected result column

        // Section/Category variations
        'Section': 'Main Module > Sub Module > Feature',
        'Module': '',        // Alternative section column
        'Suite': '',         // Alternative section column
        'Category': '',      // Alternative section column

        // Priority
        'Priority': 'High',  // High/Medium/Low or 1/2/3 or Critical/Major/Minor

        // Status
        'Status': 'Not Run', // Not Run, Passed, Failed, Blocked, etc.

        // Automation variations
        'Automation Candidate': 'Yes',
        'Is Automated': '',  // Alternative automation column
        'Automation Type': '',// Alternative automation column

        // Versions
        'Applicable Versions': 'v1.0,v1.1,v2.0',
        'Version': '',       // Alternative version column (single)

        // Tags and Type
        'Type': 'Functional',
        'Tags': 'Sample,Comprehensive,Template',

        // Other common fields
        'Preconditions': 'System must be in a specific state before test execution',
        'Test Level': 'System',     // Test level classification
        'Environment': 'Production',// Test environment
        'Estimate': '5m',           // Time estimate
        'Created By': 'QA Team',    // Test case author
        'Assigned To': 'Tester',    // Test case assignee

        // Requirement Mapping columns
        'Requirement IDs': 'REQ-001,REQ-002,REQ-003',  // Comma-separated requirement IDs
        'RequirementIDs': '',                          // Alternative column name
        'Requirements': '',                            // Alternative column name  
        'Req IDs': ''                                  // Alternative column name
      }
    ];

    // Add explanatory comments as additional rows (will be ignored during import)
    const instructionRows = [
      {
        'ID': '# INSTRUCTIONS - DELETE THESE ROWS BEFORE IMPORTING',
        'Title': 'Only fill the columns you need - empty columns will be ignored',
        'Description': 'The system supports multiple column name variations for flexibility',
        'Test steps': 'Multi-line steps are supported using newlines within quotes',
        'Expected Result': 'This is a comprehensive template - delete instruction rows before importing',
        'Section': 'Use > for hierarchical sections like "Module > Sub-module"',
        'Priority': 'High/Medium/Low or 1/2/3 or Critical/Major/Minor',
        'Status': 'Not Run/Passed/Failed/Blocked',
        'Automation Candidate': 'Yes/No or Automated/Manual/Candidate',
        'Applicable Versions': 'Comma-separated: v1.0,v1.1,v2.0 (empty = all versions)',
        'Type': 'Functional/Regression/Acceptance/Negative/etc',
        'Estimate': 'Time estimates like 30s, 2m, 1h',
        'Preconditions': 'Prerequisites needed before running this test',
        'Requirement IDs': 'Comma-separated: REQ-001,REQ-002 (for traceability)',
      },
      {
        'ID': '# COLUMN ALTERNATIVES - DELETE THIS ROW',
        'Title': 'Alternative names: Test Case',
        'Description': 'Alternative names: Details',
        'Test steps': 'Alternative names: Steps, Steps (Text)',
        'Expected Result': 'Alternative names: Expected',
        'Section': 'Alternative names: Module, Suite, Category',
        'Priority': 'Same values work for all priority columns',
        'Status': 'Standard test execution statuses',
        'Automation Candidate': 'Alternative names: Is Automated, Automation Type',
        'Applicable Versions': 'Alternative names: Version (for single version)',
        'Type': 'Test Level, Environment also become tags',
        'Estimate': 'Duration estimates in human readable format',
        'Preconditions': 'Alternative names: Precondition, Pre-requisites',
        'Requirement IDs': 'Alternative names: RequirementIDs, Requirements, Req IDs',
      }
    ];

    const allData = [...instructionRows, ...comprehensiveTemplate];

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
    link.setAttribute('download', 'comprehensive-testcases-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If showing GitHub import, render that component
  if (showGitHubImport) {
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

  return (
    <div className="bg-white p-6 rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Import Test Cases</h2>
        <button
          onClick={handleGitHubButtonClick}
          className="flex items-center text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded transition-colors"
        >
          <GitBranch className="h-4 w-4 mr-2" />
          Import from GitHub
        </button>
      </div>

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
          id="test-case-file-input"
        />

        {!file && (
          <div>
            <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            <p className="mt-4 text-gray-700">
              Drag and drop your JSON, JSONC, or CSV file here or{' '}
              <label htmlFor="test-case-file-input" className="text-blue-600 hover:text-blue-800 cursor-pointer">
                browse
              </label>
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Supported file types: .json, .jsonc, .csv
            </p>

            {/* Add download template links */}
            <div className="mt-4 flex justify-center space-x-4">
              <a
                href="/sample-testcases.jsonc"
                download
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Download JSON Template
              </a>
              <span className="text-gray-400">|</span>
              <div className="relative inline-block">
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-800"
                  id="csv-dropdown-button"
                  onClick={() => {
                    const menu = document.getElementById('csv-dropdown-menu');
                    if (menu) menu.classList.toggle('hidden');
                  }}
                >
                  Download CSV Template
                </button>
                <div
                  id="csv-dropdown-menu"
                  className="hidden origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
                >
                  <div className="py-1">
                    <button
                      onClick={() => {
                        generateCSVTemplate();
                        document.getElementById('csv-dropdown-menu').classList.add('hidden');
                      }}
                      className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    >
                      Simple Template
                    </button>
                    <button
                      onClick={() => {
                        generateFullCSVTemplate();
                        document.getElementById('csv-dropdown-menu').classList.add('hidden');
                      }}
                      className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 border-t border-gray-100"
                    >
                      Complete Template
                    </button>
                  </div>
                </div>
              </div>
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



      {/* Import Options */}
      <div className="mb-4 bg-blue-50 p-3 rounded border border-blue-100">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Import Options:</h3>
        <div className="flex items-center space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio text-blue-600"
              name="importOption"
              value="withMapping"
              checked={importOption === 'withMapping'}
              onChange={() => setImportOption('withMapping')}
            />
            <span className="ml-2 text-sm text-blue-800">Import with requirement mappings</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio text-blue-600"
              name="importOption"
              value="noMapping"
              checked={importOption === 'noMapping'}
              onChange={() => setImportOption('noMapping')}
            />
            <span className="ml-2 text-sm text-blue-800">Import test cases only</span>
          </label>
        </div>
        <p className="text-xs text-blue-700 mt-1">
          When importing with mappings, test cases that include requirement IDs will be automatically linked to those requirements.
        </p>
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

          {/* Show Reset button when validation fails */}
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
            <div className="mb-3 text-sm text-green-700">
              <p>Found {processedData.length} test cases</p>
              {importOption === 'withMapping' && (
                <p className="mt-1">
                  {Object.keys(extractMappings(processedData)).length} requirements will be mapped
                  {Object.keys(extractMappings(processedData)).length === 0 &&
                    <span className="text-yellow-600"> (No requirement IDs found in test cases)</span>
                  }
                </p>
              )}
              <details className="mt-2">
                <summary className="cursor-pointer hover:underline">View Data Summary</summary>
                <div className="mt-2 p-2 bg-white rounded text-xs font-mono overflow-auto max-h-32">
                  {processedData.map((tc, i) => (
                    <div key={i} className="mb-1">
                      {tc.id}: {tc.name} ({tc.status}, {tc.automationStatus})
                      {tc.applicableVersions && tc.applicableVersions.length > 0 && (
                        <span> [Versions: {tc.applicableVersions.join(', ')}]</span>
                      )}
                      {tc.requirementIds && importOption === 'withMapping' && tc.requirementIds.length > 0 && (
                        <span> → {tc.requirementIds.join(', ')}</span>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}

          {/* Action buttons */}
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
    </div>
  );
};

export default ImportTestCases;
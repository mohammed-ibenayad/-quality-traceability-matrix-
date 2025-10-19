import React, { useState, useEffect } from 'react';
import { GitBranch, RefreshCw, AlertCircle, CheckCircle, FileText, Search, RotateCcw } from 'lucide-react';
import dataStore from '../../services/DataStore';
import BranchSelector from '../Common/BranchSelector';

const GitHubImportTestCases = ({ onImportSuccess }) => {
  // Connection state
  const [config, setConfig] = useState({
    repoUrl: '',
    branch: 'main',
    ghToken: '',
    testPaths: ['tests/', 'test/', '__tests__/', 'src/test/', 'spec/']
  });

  // UI state
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [repoData, setRepoData] = useState(null);

  // Test discovery state
  const [discoveredTests, setDiscoveredTests] = useState([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [selectedTests, setSelectedTests] = useState(new Set());

  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState(null);

  // Sync configuration
  const [syncConfig, setSyncConfig] = useState({
    enabled: false,
    frequency: 'daily',
    autoImport: false
  });

  // Load saved configuration
  useEffect(() => {
    const savedConfig = localStorage.getItem('githubImportConfig');
    if (savedConfig) {
      setConfig(prev => ({ ...prev, ...JSON.parse(savedConfig) }));
    }
  }, []);

  // Save configuration
  const saveConfiguration = () => {
    localStorage.setItem('githubImportConfig', JSON.stringify(config));
  };

  // Test file patterns for different frameworks
  const testPatterns = {
    javascript: [/\.test\.(js|jsx|ts|tsx)$/, /\.spec\.(js|jsx|ts|tsx)$/, /__tests__\/.*\.(js|jsx|ts|tsx)$/],
    python: [/test_.*\.py$/, /.*_test\.py$/, /tests\/.*\.py$/],
    java: [/.*Test\.java$/, /.*Tests\.java$/, /.*IT\.java$/],
    csharp: [/.*Test\.cs$/, /.*Tests\.cs$/],
    go: [/.*_test\.go$/],
    ruby: [/.*_test\.rb$/, /.*_spec\.rb$/]
  };

  // Connect to GitHub repository
  const connectToRepository = async () => {
    if (!config.repoUrl || !config.ghToken) {
      setConnectionError('Repository URL and GitHub token are required');
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);

    try {
      // Parse GitHub URL
      const urlParts = config.repoUrl.replace('https://github.com/', '').split('/');
      if (urlParts.length < 2) {
        throw new Error('Invalid GitHub repository URL format');
      }

      const [owner, repo] = urlParts;

      // Test GitHub connection and get repository info
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `token ${config.ghToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid GitHub token or insufficient permissions');
        } else if (response.status === 404) {
          throw new Error('Repository not found or not accessible');
        }
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const repoInfo = await response.json();
      setRepoData({
        owner,
        repo: repo.replace('.git', ''),
        name: repoInfo.name,
        description: repoInfo.description,
        language: repoInfo.language,
        updatedAt: repoInfo.updated_at
      });

      setIsConnected(true);
      saveConfiguration();

      // Auto-discover tests after connection
      await discoverTests(owner, repo.replace('.git', ''));

    } catch (error) {
      setConnectionError(error.message);
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  // Discover test files in the repository
  const discoverTests = async (owner, repo) => {
    setIsDiscovering(true);
    setDiscoveredTests([]); // Clear existing tests first
    const foundTests = [];

    console.log(`🔍 Starting test discovery for ${owner}/${repo} on branch ${config.branch}`);

    try {
      // Check each configured test path
      for (const testPath of config.testPaths) {
        try {
          console.log(`📂 Checking test path: ${testPath}`);
          const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${testPath}?ref=${config.branch}`,
            {
              headers: {
                'Authorization': `token ${config.ghToken}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            }
          );

          if (response.ok) {
            const contents = await response.json();
            console.log(`✅ Found ${contents.length} items in ${testPath}`);
            await processDirectoryContents(contents, owner, repo, testPath, foundTests);
          } else {
            console.log(`❌ Path ${testPath} not found (${response.status})`);
          }
        } catch (error) {
          console.log(`❌ Error accessing ${testPath}:`, error.message);
        }
      }

      // Also search root directory for test files
      console.log(`📂 Checking root directory for test files`);
      try {
        const rootResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents?ref=${config.branch}`,
          {
            headers: {
              'Authorization': `token ${config.ghToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        );

        if (rootResponse.ok) {
          const rootContents = await rootResponse.json();
          await processDirectoryContents(rootContents, owner, repo, '', foundTests);
        }
      } catch (error) {
        console.log(`❌ Error accessing root directory:`, error.message);
      }

      // Remove duplicates by ID (just in case)
      const uniqueTests = [];
      const seenIds = new Set();

      foundTests.forEach(test => {
        if (!seenIds.has(test.id)) {
          seenIds.add(test.id);
          uniqueTests.push(test);
        } else {
          console.warn(`⚠️ Duplicate test ID found and removed: ${test.id}`);
        }
      });

      console.log(`🎯 Discovery complete: ${uniqueTests.length} unique tests found`);
      setDiscoveredTests(uniqueTests);

    } catch (error) {
      console.error('❌ Error discovering tests:', error);
      setConnectionError(`Failed to discover tests: ${error.message}`);
    } finally {
      setIsDiscovering(false);
    }
  };

  // Process directory contents to find test files
  const processDirectoryContents = async (contents, owner, repo, basePath, foundTests) => {
    for (const item of contents) {
      if (item.type === 'file' && isTestFile(item.name)) {
        // Get file content to extract test cases
        try {
          const fileResponse = await fetch(item.download_url);
          const fileContent = await fileResponse.text();
          const extractedTests = extractTestCases(fileContent, item.path, item.name);
          foundTests.push(...extractedTests);
        } catch (error) {
          console.error(`Error processing file ${item.path}:`, error);
        }
      } else if (item.type === 'dir' && item.name.includes('test')) {
        // Recursively process test directories (limit depth to avoid rate limits)
        if (basePath.split('/').length < 3) {
          try {
            const dirResponse = await fetch(item.url, {
              headers: {
                'Authorization': `token ${config.ghToken}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            });

            if (dirResponse.ok) {
              const dirContents = await dirResponse.json();
              await processDirectoryContents(dirContents, owner, repo, item.path, foundTests);
            }
          } catch (error) {
            console.error(`Error processing directory ${item.path}:`, error);
          }
        }
      }
    }
  };

  // Check if a file is a test file based on patterns
  const isTestFile = (filename) => {
    const allPatterns = Object.values(testPatterns).flat();
    return allPatterns.some(pattern => pattern.test(filename));
  };

  // Extract test cases from file content
  const extractTestCases = (content, filePath, filename) => {
    const tests = [];
    const lines = content.split('\n');

    // Generate unique IDs across all files by using file path in hash
    const fileHash = filePath.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    const baseId = Math.abs(fileHash) % 9000 + 1000; // Generate base between 1000-9999
    let currentTestId = baseId;

    console.log(`🔍 Processing ${filename}: Base ID = ${baseId}`);

    // Different patterns for different test frameworks
    const testPatterns = [
      // JavaScript/TypeScript (Jest, Mocha, etc.)
      /(?:it|test|describe)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      // Python (pytest, unittest)
      /def\s+(test_[a-zA-Z0-9_]+)/g,
      // Java (JUnit)
      /@Test\s*\n\s*(?:public\s+)?(?:void\s+)?([a-zA-Z0-9_]+)/g,
      // C# (MSTest, NUnit)
      /\[Test(?:Method)?\]\s*\n\s*(?:public\s+)?(?:void\s+)?([a-zA-Z0-9_]+)/g,
      // Go
      /func\s+(Test[a-zA-Z0-9_]+)/g,
      // Ruby (RSpec)
      /(?:it|describe|context)\s+['"`]([^'"`]+)['"`]/g
    ];

    const processedTests = new Set(); // Track processed test names per file

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      for (const pattern of testPatterns) {
        let match;
        const globalPattern = new RegExp(pattern.source, 'g');

        while ((match = globalPattern.exec(line)) !== null) {
          const testName = match[1];
          if (testName && testName.length > 0) {

            // Skip if we already processed this test name in this file
            const testKey = `${testName}_${i}`;
            if (processedTests.has(testKey)) {
              continue;
            }
            processedTests.add(testKey);

            // Extract description from comments or test name
            let description = testName;
            if (i > 0) {
              const prevLine = lines[i - 1].trim();
              if (prevLine.startsWith('//') || prevLine.startsWith('#') || prevLine.startsWith('/*')) {
                description = prevLine.replace(/^\/\/|^#|^\/\*|\*\/$/g, '').trim();
              }
            }

            // CHANGED: Use the test name as both ID and name
            const uniqueTestName = `${testName} (${filename})`; // Keep for reference

            tests.push({
              id: testName, // CHANGED: Use test name as the ID
              name: testName, // Use clean test name without filename
              originalName: testName, // Keep original name for reference
              uniqueDisplayName: uniqueTestName, // Add this for display if needed
              description: description || testName,
              filePath: filePath,
              fileName: filename,
              lineNumber: i + 1,
              automationStatus: 'Automated',
              status: 'Not Run',
              framework: detectTestFramework(content, filename),
              lastSyncDate: new Date().toISOString()
            });

            console.log(`📝 Extracted: ${testName} from ${filename}:${i + 1}`);
          }
        }
      }
    }

    console.log(`✅ Extracted ${tests.length} tests from ${filename}`);
    return tests;
  };
  // Detect test framework based on file content and name
  const detectTestFramework = (content, filename) => {
    if (filename.includes('.test.js') || filename.includes('.spec.js')) {
      if (content.includes('jest') || content.includes('describe(') || content.includes('it(')) return 'Jest';
      if (content.includes('mocha') || content.includes('chai')) return 'Mocha';
    }
    if (filename.includes('.py')) {
      if (content.includes('pytest')) return 'Pytest';
      if (content.includes('unittest')) return 'unittest';
    }
    if (filename.includes('.java')) {
      if (content.includes('@Test')) return 'JUnit';
    }
    if (filename.includes('.cs')) {
      if (content.includes('[Test')) return 'NUnit/MSTest';
    }
    if (filename.includes('.go')) {
      return 'Go Testing';
    }
    if (filename.includes('.rb')) {
      if (content.includes('RSpec')) return 'RSpec';
    }

    return 'Unknown';
  };

  // Handle test selection
  const toggleTestSelection = (testId) => {
    console.log(`🔘 Toggling test selection for: ${testId}`);
    setSelectedTests(prevSelected => {
      const newSelection = new Set(prevSelected);
      if (newSelection.has(testId)) {
        newSelection.delete(testId);
        console.log(`❌ Deselected: ${testId}. New count: ${newSelection.size}`);
      } else {
        newSelection.add(testId);
        console.log(`✅ Selected: ${testId}. New count: ${newSelection.size}`);
      }
      return newSelection;
    });
  };

  const selectAllTests = () => {
    console.log(`🔄 Select All clicked. Available tests: ${discoveredTests.length}`);
    const allTestIds = discoveredTests.map(test => test.id);
    console.log(`📋 All test IDs:`, allTestIds);
    setSelectedTests(new Set(allTestIds));
    console.log(`✅ Selected all ${allTestIds.length} tests`);
  };

  const deselectAllTests = () => {
    console.log(`🔄 Deselect All clicked. Current selection: ${selectedTests.size}`);
    setSelectedTests(new Set());
    console.log(`❌ Deselected all tests`);
  };

  // Debug logging for selection changes
  useEffect(() => {
    console.log(`🎯 Selection state updated: ${selectedTests.size} of ${discoveredTests.length} tests selected`);
    console.log(`Selected test IDs:`, Array.from(selectedTests));
  }, [selectedTests, discoveredTests.length]);

  // Import selected test cases
  const importSelectedTests = async () => {
    if (selectedTests.size === 0) {
      alert('Please select at least one test case to import');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const testsToImport = discoveredTests.filter(test => selectedTests.has(test.id));
      const total = testsToImport.length;

      // Get existing test cases to check for duplicates
      const existingTestCases = dataStore.getTestCases();
      const existingIds = new Set(existingTestCases.map(tc => tc.id));
      const existingNames = new Set(existingTestCases.map(tc => tc.name.toLowerCase()));

      console.log('🔍 Checking for duplicates in existing test cases:', existingIds.size);

      // Process and check for duplicates
      const duplicates = [];
      const formattedTests = [];
      let idCounter = 1;

      for (let index = 0; index < testsToImport.length; index++) {
        const test = testsToImport[index];
        setImportProgress(Math.round(((index + 1) / total) * 100));

        // Generate unique ID if duplicate exists
        let testId = test.id;
        let originalId = test.id;

        // Check for ID duplicates
        while (existingIds.has(testId) || formattedTests.some(ft => ft.id === testId)) {
          // Find the highest existing TC number and increment
          const maxId = Math.max(
            ...Array.from(existingIds)
              .filter(id => id.startsWith('TC_'))
              .map(id => parseInt(id.replace('TC_', '')) || 0),
            ...formattedTests
              .filter(ft => ft.id.startsWith('TC_'))
              .map(ft => parseInt(ft.id.replace('TC_', '')) || 0),
            999 // Start from TC_1000 if no existing tests
          );

          testId = `TC_${String(maxId + idCounter).padStart(3, '0')}`;
          idCounter++;

          duplicates.push({
            type: 'id',
            original: originalId,
            new: testId,
            reason: 'ID already exists'
          });
        }

        // Check for name duplicates (less strict - just warn)
        const testNameLower = test.name.toLowerCase();
        const nameExists = existingNames.has(testNameLower) ||
          formattedTests.some(ft => ft.name.toLowerCase() === testNameLower);

        if (nameExists && testId === originalId) {
          duplicates.push({
            type: 'name',
            original: test.name,
            new: test.name,
            reason: 'Similar test name already exists'
          });
        }

        // Add to tracking sets
        existingIds.add(testId);
        existingNames.add(testNameLower);

        const formattedTest = {
          id: testId,
          name: test.name,
          description: test.description,
          automationStatus: test.automationStatus,
          status: test.status,
          lastExecuted: '',
          priority: 'Medium',
          // Add GitHub-specific metadata
          github: {
            filePath: test.filePath,
            fileName: test.fileName,
            lineNumber: test.lineNumber,
            framework: test.framework,
            repository: `${repoData.owner}/${repoData.repo}`,
            branch: config.branch,
            lastSyncDate: test.lastSyncDate,
            originalId: originalId !== testId ? originalId : undefined
          }
        };

        formattedTests.push(formattedTest);
      }

      // Show duplicate warning if any found
      if (duplicates.length > 0) {
        const idDuplicates = duplicates.filter(d => d.type === 'id');
        const nameDuplicates = duplicates.filter(d => d.type === 'name');

        let message = 'Duplicate detection results:\n\n';

        if (idDuplicates.length > 0) {
          message += `📝 ${idDuplicates.length} test case ID(s) were automatically renamed:\n`;
          idDuplicates.forEach(d => {
            message += `  • ${d.original} → ${d.new}\n`;
          });
          message += '\n';
        }

        if (nameDuplicates.length > 0) {
          message += `⚠️ ${nameDuplicates.length} test case(s) have similar names to existing tests:\n`;
          nameDuplicates.slice(0, 5).forEach(d => {
            message += `  • "${d.original}"\n`;
          });
          if (nameDuplicates.length > 5) {
            message += `  • ... and ${nameDuplicates.length - 5} more\n`;
          }
          message += '\n';
        }

        message += 'Continue with import?';

        const confirmed = window.confirm(message);
        if (!confirmed) {
          setIsImporting(false);
          setImportProgress(0);
          return;
        }
      }

      // Simple validation
      const errors = [];
      formattedTests.forEach((tc, index) => {
        if (!tc.id || !tc.name) {
          errors.push(`Test case at index ${index} is missing required fields`);
        }
        if (!/^TC_\d+$/.test(tc.id)) {
          //errors.push(`Invalid ID format for test case: ${tc.id}`);
        }
      });

      if (errors.length > 0) {
        throw new Error(`Validation failed: ${errors.join(', ')}`);
      }

      // Import through the existing system - use addTestCase for each one
      console.log(`📥 Importing ${formattedTests.length} test cases from GitHub...`);

      const importedTestCases = [];
      const importErrors = [];

      for (const testCase of formattedTests) {
        try {
          await dataStore.addTestCase(testCase);
          importedTestCases.push(testCase);
          console.log(`✅ Imported test case from GitHub: ${testCase.id}`);

          // Update progress
          setImportProgress(Math.round((importedTestCases.length / formattedTests.length) * 100));
        } catch (error) {
          console.error(`❌ Failed to import ${testCase.id}:`, error.message);
          importErrors.push(`${testCase.id}: ${error.message}`);
        }
      }

      // Show results
      if (importErrors.length > 0) {
        console.warn(`⚠️ ${importErrors.length} test cases from GitHub failed to import:`, importErrors);
        setImportResults({
          success: false,
          imported: importedTestCases.length,
          total: total,
          failed: importErrors.length,
          errors: importErrors,
          duplicatesHandled: duplicates.length,
          duplicateDetails: duplicates,
          timestamp: new Date().toISOString()
        });

        alert(`Imported ${importedTestCases.length} test cases from GitHub, ${importErrors.length} failed:\n${importErrors.slice(0, 5).join('\n')}${importErrors.length > 5 ? `\n... and ${importErrors.length - 5} more` : ''}`);
      } else {
        console.log(`🎉 Successfully imported all ${importedTestCases.length} test cases from GitHub`);
        setImportResults({
          success: true,
          imported: importedTestCases.length,
          total: total,
          duplicatesHandled: duplicates.length,
          duplicateDetails: duplicates,
          timestamp: new Date().toISOString()
        });
      }

      // Notify parent component
      if (onImportSuccess) {
        onImportSuccess(importedTestCases);
      }

      // Reset selections
      setSelectedTests(new Set());

    } catch (error) {
      setImportResults({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <GitBranch className="h-6 w-6 text-blue-600 mr-2" />
        <h2 className="text-xl font-semibold">Import Test Cases from GitHub Repository</h2>
      </div>

      {/* Connection Configuration */}
      {!isConnected && (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GitHub Repository URL
            </label>
            <input
              type="text"
              value={config.repoUrl}
              onChange={(e) => setConfig(prev => ({ ...prev, repoUrl: e.target.value }))}
              placeholder="https://github.com/username/repository"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isConnecting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <BranchSelector
                repoUrl={config.repoUrl}
                ghToken={config.ghToken}
                selectedBranch={config.branch}
                onBranchChange={(branch) => setConfig(prev => ({ ...prev, branch }))}
                disabled={isConnecting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GitHub Token
              </label>
              <input
                type="password"
                value={config.ghToken}
                onChange={(e) => setConfig(prev => ({ ...prev, ghToken: e.target.value }))}
                placeholder="ghp_..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isConnecting}
              />
            </div>
          </div>

          {connectionError && (
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{connectionError}</span>
            </div>
          )}

          <button
            onClick={connectToRepository}
            disabled={isConnecting || !config.repoUrl || !config.ghToken}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Connecting to Repository...
              </>
            ) : (
              <>
                <GitBranch className="h-4 w-4 mr-2" />
                Connect to Repository
              </>
            )}
          </button>
        </div>
      )}

      {/* Connected Repository Info */}
      {isConnected && repoData && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
          <div className="flex items-center mb-2">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <span className="font-medium text-green-800">Connected to Repository</span>
          </div>
          <div className="text-sm text-green-700">
            <p><strong>Repository:</strong> {repoData.owner}/{repoData.repo}</p>
            <p><strong>Branch:</strong> {config.branch}</p>
            <p><strong>Language:</strong> {repoData.language || 'Multiple'}</p>
            <p><strong>Last Updated:</strong> {new Date(repoData.updatedAt).toLocaleDateString()}</p>
          </div>
          <button
            onClick={() => {
              setIsConnected(false);
              setRepoData(null);
              setDiscoveredTests([]);
              setSelectedTests(new Set());
            }}
            className="mt-3 text-sm text-green-600 hover:text-green-800 underline"
          >
            Disconnect
          </button>
        </div>
      )}

      {/* Test Discovery */}
      {isConnected && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Discovered Test Cases</h3>
            <button
              onClick={() => discoverTests(repoData.owner, repoData.repo)}
              disabled={isDiscovering}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
            >
              {isDiscovering ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Discovering...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Re-scan Repository
                </>
              )}
            </button>
          </div>

          {discoveredTests.length > 0 ? (
            <>
              {/* Selection Controls */}
              <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">
                    {selectedTests.size} of {discoveredTests.length} tests selected
                  </span>
                  <button
                    onClick={selectAllTests}
                    disabled={selectedTests.size === discoveredTests.length}
                    className={`text-sm underline ${selectedTests.size === discoveredTests.length
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-blue-600 hover:text-blue-800'
                      }`}
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAllTests}
                    disabled={selectedTests.size === 0}
                    className={`text-sm underline ${selectedTests.size === 0
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-blue-600 hover:text-blue-800'
                      }`}
                  >
                    Deselect All
                  </button>
                  {/* Debug info - remove this in production */}
                  <span className="text-xs text-gray-500">
                    (IDs: {Array.from(selectedTests).slice(0, 3).join(', ')}{selectedTests.size > 3 ? '...' : ''})
                  </span>
                </div>
                <button
                  onClick={importSelectedTests}
                  disabled={selectedTests.size === 0 || isImporting}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 transition-colors"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Importing... ({importProgress}%)
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Import Selected ({selectedTests.size})
                    </>
                  )}
                </button>
              </div>

              {/* Test Cases List */}
              <div className="border border-gray-200 rounded-md max-h-96 overflow-y-auto">
                {discoveredTests.map((test, index) => (
                  <div
                    key={`${test.id}-${test.filePath}-${index}`} // Unique key combining ID, file path, and index
                    className={`p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${selectedTests.has(test.id) ? 'bg-blue-50' : ''
                      }`}
                  >
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        checked={selectedTests.has(test.id)}
                        onChange={() => toggleTestSelection(test.id)}
                        className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {test.id}: {test.name}
                          </h4>
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            {test.framework}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                        <div className="flex items-center text-xs text-gray-500 mt-2 space-x-4">
                          <span>📁 {test.fileName}</span>
                          <span>📍 Line {test.lineNumber}</span>
                          <span>🔧 {test.automationStatus}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {isDiscovering ? (
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Scanning repository for test cases...
                </div>
              ) : (
                <div>
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No test cases found in the repository.</p>
                  <p className="text-sm mt-1">
                    Make sure your test files follow standard naming conventions.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Import Results */}
      {importResults && (
        <div className={`p-4 rounded-md mb-4 ${importResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
          <div className="flex items-center">
            {importResults.success ? (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            )}
            <span className={`font-medium ${importResults.success ? 'text-green-800' : 'text-red-800'
              }`}>
              {importResults.success ? 'Import Successful!' : 'Import Failed'}
            </span>
          </div>
          <div className={`text-sm mt-1 ${importResults.success ? 'text-green-700' : 'text-red-700'
            }`}>
            {importResults.success ? (
              <div>
                <p>Successfully imported {importResults.imported} test cases from GitHub repository.</p>
                {importResults.duplicatesHandled > 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-800 font-medium text-xs">
                      🔄 Handled {importResults.duplicatesHandled} duplicate(s):
                    </p>
                    <ul className="text-yellow-700 text-xs mt-1">
                      {importResults.duplicateDetails?.filter(d => d.type === 'id').map((dup, idx) => (
                        <li key={idx}>• ID renamed: {dup.original} → {dup.new}</li>
                      ))}
                      {importResults.duplicateDetails?.filter(d => d.type === 'name').length > 0 && (
                        <li>• {importResults.duplicateDetails.filter(d => d.type === 'name').length} similar name(s) detected</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p>Error: {importResults.error}</p>
            )}
          </div>
        </div>
      )}

      {/* Sync Configuration */}
      {isConnected && (
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <div className="flex items-center mb-3">
            <RotateCcw className="h-5 w-5 text-gray-600 mr-2" />
            <h4 className="font-medium text-gray-900">Sync Configuration</h4>
          </div>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={syncConfig.enabled}
                onChange={(e) => setSyncConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Enable automatic sync</span>
            </label>

            {syncConfig.enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sync Frequency
                  </label>
                  <select
                    value={syncConfig.frequency}
                    onChange={(e) => setSyncConfig(prev => ({ ...prev, frequency: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="hourly">Every Hour</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={syncConfig.autoImport}
                    onChange={(e) => setSyncConfig(prev => ({ ...prev, autoImport: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Automatically import new test cases
                  </span>
                </label>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GitHubImportTestCases;
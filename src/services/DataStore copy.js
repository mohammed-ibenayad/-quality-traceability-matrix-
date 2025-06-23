// src/services/DataStore.js - Enhanced with full test case management

import defaultRequirements from '../data/requirements';
import defaultTestCases from '../data/testcases';
import defaultMapping from '../data/mapping';
import defaultVersions from '../data/versions';

/**
 * Enhanced DataStore service with full test case management capabilities
 */
class DataStoreService {
  constructor() {
    // Initialize with empty data instead of default data
    this._requirements = [];
    this._testCases = [];
    this._mapping = {};
    this._versions = [];
    this._listeners = [];
    
    // Check if we should load default data
    this._hasInitializedData = false;
  }
  
  /**
   * Check if there is any data in the system
   * @returns {boolean} True if there is data, false otherwise
   */
  hasData() {
    return this._requirements.length > 0;
  }
  
  /**
   * Initialize with default data if needed
   * This can be called explicitly when wanting to load sample data
   */
  initWithDefaultData() {
    this._requirements = [...defaultRequirements];
    this._testCases = [...defaultTestCases];
    this._mapping = { ...defaultMapping };
    this._versions = [...defaultVersions];
    this._hasInitializedData = true;
    this._notifyListeners();
    return true;
  }

  /**
   * Get all requirements
   * @returns {Array} Array of requirement objects
   */
  getRequirements() {
    return [...this._requirements];
  }

  /**
   * Get a single requirement by ID
   * @param {string} id - Requirement ID
   * @returns {Object|null} Requirement object or null if not found
   */
  getRequirement(id) {
    return this._requirements.find(req => req.id === id) || null;
  }

  /**
   * Get all test cases
   * @returns {Array} Array of test case objects
   */
  getTestCases() {
    return [...this._testCases];
  }

  /**
   * Get a single test case by ID
   * @param {string} id - Test case ID
   * @returns {Object|null} Test case object or null if not found
   */
  getTestCase(id) {
    return this._testCases.find(tc => tc.id === id) || null;
  }

  /**
   * Add a new test case
   * @param {Object} testCaseData - Test case data
   * @returns {Object} Created test case
   */
  addTestCase(testCaseData) {
    if (!testCaseData || typeof testCaseData !== 'object') {
      throw new Error('Test case data must be an object');
    }

    // Validate required fields
    if (!testCaseData.name) {
      throw new Error('Test case name is required');
    }

    // Generate ID if not provided
    let testCaseId = testCaseData.id;
    if (!testCaseId) {
      const maxNum = this._testCases
        .map(tc => tc.id.match(/TC_(\d+)/))
        .filter(match => match)
        .map(match => parseInt(match[1]))
        .reduce((max, num) => Math.max(max, num), 0);
      testCaseId = `TC_${String(maxNum + 1).padStart(3, '0')}`;
    }

    // Check for duplicate ID
    if (this._testCases.find(tc => tc.id === testCaseId)) {
      throw new Error(`Test case with ID ${testCaseId} already exists`);
    }

    // Create the test case with defaults
    const newTestCase = {
      id: testCaseId,
      name: testCaseData.name,
      description: testCaseData.description || '',
      status: testCaseData.status || 'Not Run',
      automationStatus: testCaseData.automationStatus || 'Manual',
      priority: testCaseData.priority || 'Medium',
      requirementIds: testCaseData.requirementIds || [],
      version: testCaseData.version || '',
      tags: testCaseData.tags || [],
      assignee: testCaseData.assignee || '',
      lastExecuted: testCaseData.lastExecuted || null,
      executionTime: testCaseData.executionTime || null,
      ...testCaseData // Allow additional fields
    };

    // Add to test cases
    this._testCases.push(newTestCase);

    // Update mappings if requirements are linked
    if (newTestCase.requirementIds && newTestCase.requirementIds.length > 0) {
      newTestCase.requirementIds.forEach(reqId => {
        if (!this._mapping[reqId]) {
          this._mapping[reqId] = [];
        }
        if (!this._mapping[reqId].includes(newTestCase.id)) {
          this._mapping[reqId].push(newTestCase.id);
        }
      });
    }

    // Mark data as initialized
    this._hasInitializedData = true;

    // Notify listeners of data change
    this._notifyListeners();

    return newTestCase;
  }

  /**
   * Update an existing test case
   * @param {string} testCaseId - ID of the test case to update
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated test case
   */
  updateTestCase(testCaseId, updateData) {
    const index = this._testCases.findIndex(tc => tc.id === testCaseId);
    
    if (index === -1) {
      throw new Error(`Test case with ID ${testCaseId} not found`);
    }

    const existingTestCase = this._testCases[index];
    const oldRequirementIds = existingTestCase.requirementIds || [];

    // Update the test case
    const updatedTestCase = {
      ...existingTestCase,
      ...updateData,
      id: testCaseId // Ensure ID doesn't change
    };

    this._testCases[index] = updatedTestCase;

    // Update mappings if requirement links changed
    const newRequirementIds = updatedTestCase.requirementIds || [];
    
    // Remove old mappings
    oldRequirementIds.forEach(reqId => {
      if (this._mapping[reqId]) {
        this._mapping[reqId] = this._mapping[reqId].filter(tcId => tcId !== testCaseId);
        if (this._mapping[reqId].length === 0) {
          delete this._mapping[reqId];
        }
      }
    });

    // Add new mappings
    newRequirementIds.forEach(reqId => {
      if (!this._mapping[reqId]) {
        this._mapping[reqId] = [];
      }
      if (!this._mapping[reqId].includes(testCaseId)) {
        this._mapping[reqId].push(testCaseId);
      }
    });

    // Notify listeners of data change
    this._notifyListeners();

    return updatedTestCase;
  }

  /**
   * Delete a test case
   * @param {string} testCaseId - ID of the test case to delete
   * @returns {boolean} True if successful
   */
  deleteTestCase(testCaseId) {
    const index = this._testCases.findIndex(tc => tc.id === testCaseId);
    
    if (index === -1) {
      throw new Error(`Test case with ID ${testCaseId} not found`);
    }

    const testCase = this._testCases[index];

    // Remove the test case
    this._testCases.splice(index, 1);

    // Remove related mappings
    Object.keys(this._mapping).forEach(reqId => {
      this._mapping[reqId] = this._mapping[reqId].filter(tcId => tcId !== testCaseId);
      if (this._mapping[reqId].length === 0) {
        delete this._mapping[reqId];
      }
    });

    // Notify listeners of data change
    this._notifyListeners();

    return true;
  }

  /**
   * Update test case execution results
   * @param {Array} results - Array of execution results [{testCaseId, status, executionTime}]
   * @returns {Array} Updated test cases
   */
  updateTestExecutionResults(results) {
    if (!Array.isArray(results)) {
      throw new Error('Results must be an array');
    }

    const updatedTestCases = [];

    results.forEach(result => {
      const { testCaseId, status, executionTime } = result;
      const index = this._testCases.findIndex(tc => tc.id === testCaseId);

      if (index !== -1) {
        this._testCases[index] = {
          ...this._testCases[index],
          status: status || this._testCases[index].status,
          executionTime: executionTime || this._testCases[index].executionTime,
          lastExecuted: new Date().toISOString()
        };
        updatedTestCases.push(this._testCases[index]);
      }
    });

    // Notify listeners of data change
    this._notifyListeners();

    return updatedTestCases;
  }

  /**
   * Bulk update test case statuses
   * @param {Array} testCaseIds - Array of test case IDs
   * @param {string} status - New status to set
   * @returns {Array} Updated test cases
   */
  bulkUpdateTestCaseStatus(testCaseIds, status) {
    if (!Array.isArray(testCaseIds)) {
      throw new Error('Test case IDs must be an array');
    }

    const validStatuses = ['Passed', 'Failed', 'Not Run', 'Blocked'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    const updatedTestCases = [];

    testCaseIds.forEach(testCaseId => {
      const index = this._testCases.findIndex(tc => tc.id === testCaseId);
      if (index !== -1) {
        this._testCases[index] = {
          ...this._testCases[index],
          status,
          lastExecuted: new Date().toISOString()
        };
        updatedTestCases.push(this._testCases[index]);
      }
    });

    // Notify listeners of data change
    this._notifyListeners();

    return updatedTestCases;
  }

  /**
   * Get test cases by requirement ID
   * @param {string} requirementId - Requirement ID
   * @returns {Array} Test cases linked to the requirement
   */
  getTestCasesByRequirement(requirementId) {
    const testCaseIds = this._mapping[requirementId] || [];
    return testCaseIds
      .map(tcId => this._testCases.find(tc => tc.id === tcId))
      .filter(Boolean);
  }

  /**
   * Get requirements linked to a test case
   * @param {string} testCaseId - Test case ID
   * @returns {Array} Requirements linked to the test case
   */
  getRequirementsByTestCase(testCaseId) {
    const testCase = this.getTestCase(testCaseId);
    if (!testCase || !testCase.requirementIds) {
      return [];
    }

    return testCase.requirementIds
      .map(reqId => this._requirements.find(req => req.id === reqId))
      .filter(Boolean);
  }

  /**
   * Link test case to requirements
   * @param {string} testCaseId - Test case ID
   * @param {Array} requirementIds - Array of requirement IDs to link
   * @returns {Object} Updated test case
   */
  linkTestCaseToRequirements(testCaseId, requirementIds) {
    const testCase = this.getTestCase(testCaseId);
    if (!testCase) {
      throw new Error(`Test case with ID ${testCaseId} not found`);
    }

    // Validate requirement IDs exist
    const validRequirementIds = requirementIds.filter(reqId => 
      this._requirements.find(req => req.id === reqId)
    );

    if (validRequirementIds.length !== requirementIds.length) {
      const invalidIds = requirementIds.filter(reqId => !validRequirementIds.includes(reqId));
      console.warn(`Some requirement IDs not found: ${invalidIds.join(', ')}`);
    }

    // Update test case
    return this.updateTestCase(testCaseId, {
      requirementIds: validRequirementIds
    });
  }

  /**
   * Add a new requirement
   * @param {Object} requirementData - Requirement data
   * @returns {Object} Created requirement
   */
  addRequirement(requirementData) {
    if (!requirementData || typeof requirementData !== 'object') {
      throw new Error('Requirement data must be an object');
    }

    // Validate required fields
    if (!requirementData.name) {
      throw new Error('Requirement name is required');
    }

    // Generate ID if not provided
    let requirementId = requirementData.id;
    if (!requirementId) {
      const maxNum = this._requirements
        .map(req => req.id.match(/REQ-(\d+)/))
        .filter(match => match)
        .map(match => parseInt(match[1]))
        .reduce((max, num) => Math.max(max, num), 0);
      requirementId = `REQ-${String(maxNum + 1).padStart(3, '0')}`;
    }

    // Check for duplicate ID
    if (this._requirements.find(req => req.id === requirementId)) {
      throw new Error(`Requirement with ID ${requirementId} already exists`);
    }

    // Process the requirement data to add calculated fields
    const processed = this.processRequirements([{
      ...requirementData,
      id: requirementId
    }])[0];
    
    // Add the requirement
    this._requirements.push(processed);
    
    // Mark data as initialized
    this._hasInitializedData = true;
    
    // Notify listeners of data change
    this._notifyListeners();
    
    return processed;
  }
  
  /**
   * Update an existing requirement
   * @param {string} requirementId - ID of the requirement to update
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated requirement
   */
  updateRequirement(requirementId, updateData) {
    const index = this._requirements.findIndex(req => req.id === requirementId);
    
    if (index === -1) {
      throw new Error(`Requirement with ID ${requirementId} not found`);
    }

    // Update the requirement
    const updatedRequirement = {
      ...this._requirements[index],
      ...updateData,
      id: requirementId // Ensure ID doesn't change
    };

    // Process to recalculate fields if needed
    const processed = this.processRequirements([updatedRequirement])[0];
    this._requirements[index] = processed;
    
    // Notify listeners of data change
    this._notifyListeners();
    
    return processed;
  }
  
  /**
   * Delete a requirement
   * @param {string} reqId - ID of the requirement to delete
   * @returns {boolean} True if successful
   */
  deleteRequirement(reqId) {
    const index = this._requirements.findIndex(req => req.id === reqId);
    
    if (index === -1) {
      throw new Error(`Requirement with ID ${reqId} not found`);
    }
    
    // Remove the requirement
    this._requirements.splice(index, 1);
    
    // Remove related mappings
    if (this._mapping[reqId]) {
      delete this._mapping[reqId];
    }
    
    // Remove requirement from test cases
    this._testCases.forEach(tc => {
      if (tc.requirementIds && tc.requirementIds.includes(reqId)) {
        tc.requirementIds = tc.requirementIds.filter(id => id !== reqId);
      }
    });
    
    // Notify listeners of data change
    this._notifyListeners();
    
    return true;
  }

  /**
   * Get requirement-test mapping
   * @returns {Object} Mapping between requirements and test cases
   */
  getMapping() {
    return { ...this._mapping };
  }
  
  /**
   * Get all versions
   * @returns {Array} Array of version objects
   */
  getVersions() {
    return [...this._versions];
  }

  /**
   * Add a new version
   * @param {Object} versionData - Version data
   * @returns {Object} Created version
   */
  addVersion(versionData) {
    if (!versionData || typeof versionData !== 'object') {
      throw new Error('Version data must be an object');
    }

    if (!versionData.id) {
      throw new Error('Version ID is required');
    }

    // Check for duplicate ID
    if (this._versions.find(v => v.id === versionData.id)) {
      throw new Error(`Version with ID ${versionData.id} already exists`);
    }

    const newVersion = {
      id: versionData.id,
      name: versionData.name || versionData.id,
      description: versionData.description || '',
      status: versionData.status || 'Planned',
      createdAt: versionData.createdAt || new Date().toISOString(),
      ...versionData
    };

    this._versions.push(newVersion);
    this._notifyListeners();
    
    return newVersion;
  }

  /**
   * Update a version
   * @param {string} versionId - Version ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated version
   */
  updateVersion(versionId, updateData) {
    const index = this._versions.findIndex(v => v.id === versionId);
    
    if (index === -1) {
      throw new Error(`Version with ID ${versionId} not found`);
    }

    this._versions[index] = {
      ...this._versions[index],
      ...updateData,
      id: versionId // Ensure ID doesn't change
    };
    
    this._notifyListeners();
    return this._versions[index];
  }

  /**
   * Delete a version
   * @param {string} versionId - Version ID
   * @returns {boolean} True if successful
   */
  deleteVersion(versionId) {
    const index = this._versions.findIndex(v => v.id === versionId);
    
    if (index === -1) {
      throw new Error(`Version with ID ${versionId} not found`);
    }
    
    this._versions.splice(index, 1);
    this._notifyListeners();
    
    return true;
  }

  /**
   * Set requirements data
   * @param {Array} requirementsData - New requirements data to set
   * @returns {Array} Updated requirements
   */
  setRequirements(requirementsData) {
    if (!Array.isArray(requirementsData)) {
      throw new Error('Requirements data must be an array');
    }
    
    // Process the data to add calculated fields
    const processed = this.processRequirements(requirementsData);
    
    // Update requirements
    this._requirements = [...processed];
    
    // Clean up mappings for requirements that no longer exist
    const existingReqIds = new Set(processed.map(req => req.id));
    
    Object.keys(this._mapping).forEach(reqId => {
      if (!existingReqIds.has(reqId)) {
        delete this._mapping[reqId];
      }
    });
    
    // Mark data as initialized
    this._hasInitializedData = true;
    
    // Notify listeners of data change
    this._notifyListeners();
    
    return this._requirements;
  }

  /**
   * Set test cases data
   * @param {Array} testCasesData - New test cases data to set
   * @returns {Array} Updated test cases
   */
  setTestCases(testCasesData) {
    if (!Array.isArray(testCasesData)) {
      throw new Error('Test cases data must be an array');
    }
    
    // Update test cases
    this._testCases = [...testCasesData];
    
    // Clean up mappings for test cases that no longer exist
    const existingTestCaseIds = new Set(testCasesData.map(tc => tc.id));
    
    // For each requirement mapping
    Object.keys(this._mapping).forEach(reqId => {
      // Filter out non-existent test cases
      this._mapping[reqId] = this._mapping[reqId].filter(tcId => 
        existingTestCaseIds.has(tcId)
      );
      
      // Remove empty mappings
      if (this._mapping[reqId].length === 0) {
        delete this._mapping[reqId];
      }
    });
    
    // Mark data as initialized
    this._hasInitializedData = true;
    
    // Notify listeners of data change
    this._notifyListeners();
    
    return this._testCases;
  }

  /**
   * Update requirement-test mappings
   * @param {Object} mappings - Mappings to update ({reqId: [testCaseIds]})
   * @returns {Object} Updated mappings
   */
  updateMappings(mappings) {
    if (!mappings || typeof mappings !== 'object') {
      throw new Error('Mappings must be an object');
    }
    
    // Get existing test cases and requirements
    const existingTestCaseIds = new Set(this._testCases.map(tc => tc.id));
    const existingReqIds = new Set(this._requirements.map(req => req.id));
    
    // Update each mapping
    Object.keys(mappings).forEach(reqId => {
      // Verify requirement exists
      if (!existingReqIds.has(reqId)) {
        console.warn(`Requirement ${reqId} not found, skipping mapping`);
        return;
      }
      
      // Filter test case IDs to only existing ones
      const validTestCaseIds = mappings[reqId].filter(tcId => 
        existingTestCaseIds.has(tcId)
      );
      
      // If this is a new mapping or has valid test cases
      if (!this._mapping[reqId]) {
        this._mapping[reqId] = [...validTestCaseIds];
      } else {
        // Merge with existing, avoiding duplicates
        const existingMappings = new Set(this._mapping[reqId]);
        validTestCaseIds.forEach(tcId => {
          if (!existingMappings.has(tcId)) {
            this._mapping[reqId].push(tcId);
          }
        });
      }
    });
    
    // Notify listeners of data change
    this._notifyListeners();
    
    return this.getMapping();
  }

  /**
   * Calculate Test Depth Factor for a requirement
   * @param {Object} requirement - Requirement object with rating factors
   * @returns {number} Calculated TDF
   */
  calculateTDF(requirement) {
    return (
      (requirement.businessImpact * 0.4) +
      (requirement.technicalComplexity * 0.3) +
      (requirement.regulatoryFactor * 0.2) +
      (requirement.usageFrequency * 0.1)
    );
  }

  /**
   * Determine minimum number of test cases based on TDF
   * @param {number} tdf - Test Depth Factor
   * @returns {number} Minimum required test cases
   */
  getMinTestCases(tdf) {
    if (tdf >= 4.1) return 8;  // Exhaustive testing
    if (tdf >= 3.1) return 5;  // Strong coverage
    if (tdf >= 2.1) return 3;  // Standard coverage
    return 1;                  // Basic validation
  }

  /**
   * Process requirements to add calculated fields
   * @param {Array} requirementsData - Raw requirements data
   * @returns {Array} Processed requirements with calculated fields
   */
  processRequirements(requirementsData) {
    return requirementsData.map(req => {
      // Calculate TDF if not provided
      const tdf = req.testDepthFactor || this.calculateTDF(req);
      
      // Calculate minimum test cases if not provided
      const minCases = req.minTestCases || this.getMinTestCases(tdf);
      
      return {
        ...req,
        testDepthFactor: parseFloat(tdf.toFixed(1)),
        minTestCases: minCases
      };
    });
  }

  /**
   * Extract mappings from test cases with requirementIds
   * @param {Array} testCases - Test cases with requirementIds arrays
   * @returns {Object} Extracted mappings
   */
  extractMappingsFromTestCases(testCases) {
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
  }

  /**
   * Import data from multiple sources
   * @param {Object} data - Object containing requirements, testCases, mappings, etc.
   * @returns {Object} Status of import operation
   */
  importData(data) {
    const results = {
      requirements: 0,
      testCases: 0,
      mappings: 0,
      errors: []
    };

    try {
      // Import requirements
      if (data.requirements && Array.isArray(data.requirements)) {
        this.setRequirements(data.requirements);
        results.requirements = data.requirements.length;
      }

      // Import test cases
      if (data.testCases && Array.isArray(data.testCases)) {
        this.setTestCases(data.testCases);
        results.testCases = data.testCases.length;
        
        // Extract mappings from test cases if no explicit mapping provided
        if (!data.mappings && data.testCases.some(tc => tc.requirementIds)) {
          const extractedMappings = this.extractMappingsFromTestCases(data.testCases);
          this.updateMappings(extractedMappings);
          results.mappings = Object.keys(extractedMappings).length;
        }
      }

      // Import explicit mappings
      if (data.mappings && typeof data.mappings === 'object') {
        this.updateMappings(data.mappings);
        results.mappings = Object.keys(data.mappings).length;
      }

      // Import versions
      if (data.versions && Array.isArray(data.versions)) {
        this._versions = [...data.versions];
      }

    } catch (error) {
      results.errors.push(error.message);
    }

    return results;
  }

  /**
   * Export all data
   * @returns {Object} All data in the store
   */
  exportData() {
    return {
      requirements: this.getRequirements(),
      testCases: this.getTestCases(),
      mappings: this.getMapping(),
      versions: this.getVersions(),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Subscribe to data changes
   * @param {Function} listener - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this._listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of data change
   * @private
   */
  _notifyListeners() {
    this._listeners.forEach(listener => {
      try {
        listener();
      } catch (e) {
        console.error('Error in data store listener:', e);
      }
    });
  }
  
  /**
   * Reset all data
   * Useful for testing or clearing the application
   */
  resetAll() {
    this._requirements = [];
    this._testCases = [];
    this._mapping = {};
    this._versions = [];
    this._hasInitializedData = false;
    this._notifyListeners();
  }

  /**
   * Get statistics about the current data
   * @returns {Object} Statistics object
   */
  getStatistics() {
    const requirements = this.getRequirements();
    const testCases = this.getTestCases();
    const mapping = this.getMapping();

    const linkedTestCases = testCases.filter(tc => 
      tc.requirementIds && tc.requirementIds.length > 0
    ).length;

    const coveredRequirements = requirements.filter(req =>
      mapping[req.id] && mapping[req.id].length > 0
    ).length;

    const automatedTestCases = testCases.filter(tc => 
      tc.automationStatus === 'Automated'
    ).length;

    const passedTestCases = testCases.filter(tc => 
      tc.status === 'Passed'
    ).length;

    return {
      totalRequirements: requirements.length,
      totalTestCases: testCases.length,
      coveredRequirements,
      linkedTestCases,
      automatedTestCases,
      passedTestCases,
      coveragePercentage: requirements.length > 0 
        ? Math.round((coveredRequirements / requirements.length) * 100) 
        : 0,
      linkagePercentage: testCases.length > 0 
        ? Math.round((linkedTestCases / testCases.length) * 100) 
        : 0,
      automationPercentage: testCases.length > 0 
        ? Math.round((automatedTestCases / testCases.length) * 100) 
        : 0,
      passPercentage: testCases.length > 0 
        ? Math.round((passedTestCases / testCases.length) * 100) 
        : 0
    };
  }
}

// Create singleton instance
const dataStore = new DataStoreService();

export default dataStore;
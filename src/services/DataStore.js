// src/services/DataStore.js - Complete Enhanced Version with localStorage Persistence

import defaultRequirements from '../data/requirements';
import defaultTestCases from '../data/testcases';
import defaultMapping from '../data/mapping';
import defaultVersions from '../data/versions';

/**
 * Enhanced DataStore service with full test case management and localStorage persistence
 */
class DataStoreService {
  constructor() {
    // Initialize with empty data
    this._requirements = [];
    this._testCases = [];
    this._mapping = {};
    this._versions = [];
    this._listeners = [];
    this._hasInitializedData = false;

    // Load persisted data from localStorage
    this._loadPersistedData();
  }

  /**
   * Load persisted data from localStorage
   * @private
   */
  _loadPersistedData() {
    console.log(`🚀 DataStore initializing - loading persisted data from localStorage...`);
    
    try {
      // Load test cases
      console.log(`📂 Checking for saved test cases...`);
      const savedTestCases = localStorage.getItem('qualityTracker_testCases');
      if (savedTestCases) {
        console.log(`📁 Found saved test cases data (${savedTestCases.length} characters)`);
        const parsedTestCases = JSON.parse(savedTestCases);
        if (Array.isArray(parsedTestCases)) {
          this._testCases = parsedTestCases;
          console.log(`✅ Successfully loaded ${this._testCases.length} test cases from localStorage`);
          console.log(`📋 Sample test case IDs: [${this._testCases.slice(0, 3).map(tc => tc.id).join(', ')}${this._testCases.length > 3 ? ', ...' : ''}]`);
        } else {
          console.warn(`⚠️ Saved test cases data is not an array:`, typeof parsedTestCases);
        }
      } else {
        console.log(`📭 No saved test cases found in localStorage`);
      }

      // Load requirements
      console.log(`📂 Checking for saved requirements...`);
      const savedRequirements = localStorage.getItem('qualityTracker_requirements');
      if (savedRequirements) {
        console.log(`📁 Found saved requirements data`);
        const parsedRequirements = JSON.parse(savedRequirements);
        if (Array.isArray(parsedRequirements)) {
          this._requirements = parsedRequirements;
          console.log(`✅ Successfully loaded ${this._requirements.length} requirements from localStorage`);
        } else {
          console.warn(`⚠️ Saved requirements data is not an array`);
        }
      } else {
        console.log(`📭 No saved requirements found in localStorage`);
      }

      // Load mapping
      console.log(`📂 Checking for saved mapping...`);
      const savedMapping = localStorage.getItem('qualityTracker_mapping');
      if (savedMapping) {
        console.log(`📁 Found saved mapping data`);
        const parsedMapping = JSON.parse(savedMapping);
        if (typeof parsedMapping === 'object') {
          this._mapping = parsedMapping;
          console.log(`✅ Successfully loaded mapping from localStorage (${Object.keys(this._mapping).length} requirement mappings)`);
        } else {
          console.warn(`⚠️ Saved mapping data is not an object`);
        }
      } else {
        console.log(`📭 No saved mapping found in localStorage`);
      }

      // Load versions
      console.log(`📂 Checking for saved versions...`);
      const savedVersions = localStorage.getItem('qualityTracker_versions');
      if (savedVersions) {
        console.log(`📁 Found saved versions data`);
        const parsedVersions = JSON.parse(savedVersions);
        if (Array.isArray(parsedVersions)) {
          this._versions = parsedVersions;
          console.log(`✅ Successfully loaded ${this._versions.length} versions from localStorage`);
        } else {
          console.warn(`⚠️ Saved versions data is not an array`);
        }
      } else {
        console.log(`📭 No saved versions found in localStorage`);
      }

      // Mark as initialized if we have any data
      if (this._requirements.length > 0 || this._testCases.length > 0) {
        this._hasInitializedData = true;
        console.log(`🎯 DataStore marked as initialized (has data)`);
      } else {
        console.log(`🎯 DataStore not marked as initialized (no data found)`);
      }

      console.log(`🎉 DataStore initialization complete!`);
      console.log(`📊 Final state: ${this._requirements.length} requirements, ${this._testCases.length} test cases, ${Object.keys(this._mapping).length} mappings, ${this._versions.length} versions`);

    } catch (error) {
      console.error('❌ Failed to load persisted data from localStorage:', error);
      console.log(`🔄 Continuing with empty data due to load error`);
      // Continue with empty data if loading fails
    }
  }

  /**
   * Save data to localStorage
   * @private
   */
  _saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(`qualityTracker_${key}`, JSON.stringify(data));
    } catch (error) {
      console.warn(`Failed to save ${key} to localStorage:`, error);
    }
  }
  
  /**
   * Check if there is any data in the system
   * @returns {boolean} True if there is data, false otherwise
   */
  hasData() {
    const reqCount = this._requirements.length;
    const tcCount = this._testCases.length;
    const result = reqCount > 0 || tcCount > 0;
    
    console.log(`🔍 hasData() check: ${reqCount} requirements, ${tcCount} test cases → ${result}`);
    return result;
  }

  /**
   * Check if there are test cases specifically
   * @returns {boolean} True if there are test cases
   */
  hasTestCases() {
    const result = this._testCases.length > 0;
    console.log(`🔍 hasTestCases() check: ${this._testCases.length} test cases → ${result}`);
    return result;
  }

  /**
   * Check if there are requirements specifically
   * @returns {boolean} True if there are requirements
   */
  hasRequirements() {
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

    // Save to localStorage
    this._saveToLocalStorage('requirements', this._requirements);
    this._saveToLocalStorage('testCases', this._testCases);
    this._saveToLocalStorage('mapping', this._mapping);
    this._saveToLocalStorage('versions', this._versions);

    this._notifyListeners();
    return true;
  }

  /**
   * Clear all persisted data (useful for testing/debugging)
   */
  clearPersistedData() {
    try {
      localStorage.removeItem('qualityTracker_testCases');
      localStorage.removeItem('qualityTracker_requirements');
      localStorage.removeItem('qualityTracker_mapping');
      localStorage.removeItem('qualityTracker_versions');
      console.log('🗑️ Cleared all persisted data from localStorage');
      
      // Reset in-memory data
      this._requirements = [];
      this._testCases = [];
      this._mapping = {};
      this._versions = [];
      this._hasInitializedData = false;
      
      this._notifyListeners();
    } catch (error) {
      console.warn('Failed to clear persisted data:', error);
    }
  }

  // ===== REQUIREMENTS METHODS =====

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
   * Set requirements data with persistence
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
    
    // Save to localStorage
    this._saveToLocalStorage('requirements', this._requirements);
    this._saveToLocalStorage('mapping', this._mapping);
    
    // Notify listeners of data change
    this._notifyListeners();
    
    return this._requirements;
  }

  /**
 * Delete a requirement
 * @param {string} requirementId - ID of the requirement to delete
 * @returns {boolean} True if successful
 */
deleteRequirement(requirementId) {
  const index = this._requirements.findIndex(req => req.id === requirementId);
  
  if (index === -1) {
    throw new Error(`Requirement with ID ${requirementId} not found`);
  }

  const requirement = this._requirements[index];

  // Remove from requirements array
  this._requirements.splice(index, 1);

  // Clean up mappings - remove any test case mappings to this requirement
  if (this._mapping[requirementId]) {
    // For each test case that was mapped to this requirement,
    // remove this requirement from their requirementIds array
    const mappedTestCaseIds = this._mapping[requirementId];
    
    mappedTestCaseIds.forEach(testCaseId => {
      const testCase = this._testCases.find(tc => tc.id === testCaseId);
      if (testCase && testCase.requirementIds) {
        testCase.requirementIds = testCase.requirementIds.filter(reqId => reqId !== requirementId);
      }
    });
    
    // Remove the mapping entry
    delete this._mapping[requirementId];
  }

  // Also check for any test cases that have this requirement in their requirementIds array
  // and remove it (defensive cleanup)
  this._testCases.forEach(testCase => {
    if (testCase.requirementIds && testCase.requirementIds.includes(requirementId)) {
      testCase.requirementIds = testCase.requirementIds.filter(reqId => reqId !== requirementId);
    }
  });

  // Save to localStorage
  this._saveToLocalStorage('requirements', this._requirements);
  this._saveToLocalStorage('testCases', this._testCases);
  this._saveToLocalStorage('mapping', this._mapping);

  // Notify listeners of data change
  this._notifyListeners();

  return true;
}

  /**
   * Process requirements to add calculated fields
   * @param {Array} requirements - Raw requirements data
   * @returns {Array} Processed requirements
   */
  processRequirements(requirements) {
    return requirements.map(req => ({
      ...req,
      // Add any calculated fields here if needed
      calculatedTDF: this.calculateTDF(req)
    }));
  }

  /**
   * Calculate TDF (Test Density Factor) for a requirement
   * @param {Object} requirement - Requirement object
   * @returns {number} Calculated TDF
   */
  calculateTDF(requirement) {
    if (!requirement.businessImpact || !requirement.priority) {
      return 1; // Default TDF
    }
    
    const impactMultiplier = {
      'High': 3,
      'Medium': 2,
      'Low': 1
    };
    
    const priorityMultiplier = {
      'High': 2,
      'Medium': 1.5,
      'Low': 1
    };
    
    const impact = impactMultiplier[requirement.businessImpact] || 1;
    const priority = priorityMultiplier[requirement.priority] || 1;
    
    return Math.round(impact * priority);
  }

  // ===== TEST CASES METHODS =====

  /**
   * Get all test cases
   * @returns {Array} Array of test case objects
   */
  getTestCases() {
    console.log(`📋 getTestCases() called - returning ${this._testCases.length} test cases`);
    
    // If no test cases in memory, try to reload from localStorage (defensive programming)
    if (this._testCases.length === 0) {
      console.log(`🔍 No test cases in memory, checking localStorage...`);
      try {
        const savedTestCases = localStorage.getItem('qualityTracker_testCases');
        if (savedTestCases) {
          const parsedTestCases = JSON.parse(savedTestCases);
          if (Array.isArray(parsedTestCases) && parsedTestCases.length > 0) {
            this._testCases = parsedTestCases;
            console.log(`🔄 Reloaded ${this._testCases.length} test cases from localStorage`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to reload test cases from localStorage:', error);
      }
    }
    
    console.log(`📤 Returning ${this._testCases.length} test cases`);
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
   * Set all test cases (with localStorage persistence)
   * @param {Array} testCases - Array of test case objects
   * @returns {Array} Updated test cases array
   */
  setTestCases(testCases) {
    console.log(`🔄 DataStore.setTestCases() called with ${Array.isArray(testCases) ? testCases.length : 'invalid'} test cases`);
    
    // Validate input
    if (!Array.isArray(testCases)) {
      console.error('❌ setTestCases: Input is not an array:', typeof testCases);
      throw new Error('Test cases must be an array');
    }

    console.log(`📝 Processing ${testCases.length} test cases for validation...`);

    // Validate each test case has required fields
    const validatedTestCases = testCases.map((tc, index) => {
      if (!tc || typeof tc !== 'object') {
        console.error(`❌ Test case at index ${index} is not an object:`, tc);
        throw new Error(`Test case at index ${index} must be an object`);
      }
      if (!tc.id) {
        console.error(`❌ Test case at index ${index} is missing ID:`, tc);
        throw new Error(`Test case at index ${index} is missing required 'id' field`);
      }
      if (!tc.name) {
        console.error(`❌ Test case at index ${index} is missing name:`, tc);
        throw new Error(`Test case at index ${index} is missing required 'name' field`);
      }
      
      // Log each test case being processed
      console.log(`✅ Validated test case ${index + 1}/${testCases.length}: ${tc.id} - ${tc.name}`);
      
      // Ensure all required fields exist with defaults
      return {
        id: tc.id,
        name: tc.name,
        description: tc.description || '',
        status: tc.status || 'Not Run',
        automationStatus: tc.automationStatus || 'Manual',
        priority: tc.priority || 'Medium',
        requirementIds: tc.requirementIds || [],
        version: tc.version || '',
        tags: tc.tags || [],
        assignee: tc.assignee || '',
        lastExecuted: tc.lastExecuted || null,
        executionTime: tc.executionTime || null,
        ...tc // Allow additional fields
      };
    });

    console.log(`✅ All ${validatedTestCases.length} test cases validated successfully`);

    // Check for duplicate IDs
    const ids = validatedTestCases.map(tc => tc.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      console.error('❌ Duplicate test case IDs found:', duplicateIds);
      throw new Error(`Duplicate test case IDs found: ${duplicateIds.join(', ')}`);
    }

    console.log(`🔍 No duplicate IDs found in ${ids.length} test cases`);

    // Store previous count for comparison
    const previousCount = this._testCases.length;
    console.log(`📊 Previous test case count: ${previousCount}, New count: ${validatedTestCases.length}`);

    // Update in-memory storage
    this._testCases = [...validatedTestCases];
    console.log(`💾 Updated in-memory storage with ${this._testCases.length} test cases`);

    // Update mappings based on test case requirements
    console.log(`🔗 Updating mappings from test case requirements...`);
    this._updateMappingsFromTestCases();
    console.log(`🔗 Mappings updated. Current mapping keys: ${Object.keys(this._mapping).length}`);

    // Mark data as initialized
    this._hasInitializedData = true;
    console.log(`📋 Data marked as initialized`);

    // Persist to localStorage
    console.log(`💿 Saving to localStorage...`);
    
    try {
      this._saveToLocalStorage('testCases', this._testCases);
      console.log(`✅ Successfully saved ${this._testCases.length} test cases to localStorage`);
      
      this._saveToLocalStorage('mapping', this._mapping);
      console.log(`✅ Successfully saved mappings to localStorage`);
      
      // Verify the save worked
      const savedData = localStorage.getItem('qualityTracker_testCases');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log(`🔍 Verification: localStorage contains ${parsedData.length} test cases`);
        console.log(`🔍 Sample saved test case IDs: [${parsedData.slice(0, 3).map(tc => tc.id).join(', ')}${parsedData.length > 3 ? ', ...' : ''}]`);
      } else {
        console.warn('⚠️ localStorage verification failed - no data found');
      }
      
    } catch (error) {
      console.error('❌ Failed to save to localStorage:', error);
      // Don't throw here - we want the operation to continue even if persistence fails
    }

    // Notify all listeners of the change
    console.log(`📢 Notifying ${this._listeners.length} listeners of data change...`);
    this._notifyListeners();
    console.log(`📢 All listeners notified`);

    console.log(`🎉 setTestCases() completed successfully! Final count: ${this._testCases.length}`);
    return [...this._testCases];
  }

  /**
   * Update mappings based on test case requirement links
   * @private
   */
  _updateMappingsFromTestCases() {
    // Clear existing mappings from test cases
    const newMapping = { ...this._mapping };
    
    // Rebuild mappings from test cases
    this._testCases.forEach(tc => {
      if (tc.requirementIds && Array.isArray(tc.requirementIds)) {
        tc.requirementIds.forEach(reqId => {
          if (!newMapping[reqId]) {
            newMapping[reqId] = [];
          }
          if (!newMapping[reqId].includes(tc.id)) {
            newMapping[reqId].push(tc.id);
          }
        });
      }
    });

    this._mapping = newMapping;
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

    // Save to localStorage
    this._saveToLocalStorage('testCases', this._testCases);
    this._saveToLocalStorage('mapping', this._mapping);

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

    // Save to localStorage
    this._saveToLocalStorage('testCases', this._testCases);
    this._saveToLocalStorage('mapping', this._mapping);

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

    // Remove from test cases array
    this._testCases.splice(index, 1);

    // Remove from mappings
    if (testCase.requirementIds) {
      testCase.requirementIds.forEach(reqId => {
        if (this._mapping[reqId]) {
          this._mapping[reqId] = this._mapping[reqId].filter(tcId => tcId !== testCaseId);
          if (this._mapping[reqId].length === 0) {
            delete this._mapping[reqId];
          }
        }
      });
    }

    // Save to localStorage
    this._saveToLocalStorage('testCases', this._testCases);
    this._saveToLocalStorage('mapping', this._mapping);

    // Notify listeners of data change
    this._notifyListeners();

    return true;
  }

  /**
   * Update test case statuses
   * @param {Array} testCaseIds - Array of test case IDs
   * @param {string} status - New status
   * @returns {Array} Updated test cases
   */
  updateTestCaseStatuses(testCaseIds, status) {
    const validStatuses = ['Passed', 'Failed', 'Not Run', 'Blocked', 'Not Found'];
if (!validStatuses.includes(status)) {
  throw new Error(`Invalid status. Valid statuses are: ${validStatuses.join(', ')}`);
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

    // Save to localStorage
    this._saveToLocalStorage('testCases', this._testCases);

    // Notify listeners of data change
    this._notifyListeners();

    return updatedTestCases;
  }

  // ===== MAPPING METHODS =====

  /**
   * Get requirement-test mapping
   * @returns {Object} Mapping between requirements and test cases
   */
  getMapping() {
    return { ...this._mapping };
  }

  /**
   * Update mappings
   * @param {Object} newMappings - New mapping data
   */
  updateMappings(newMappings) {
    this._mapping = { ...this._mapping, ...newMappings };
    
    // Save to localStorage
    this._saveToLocalStorage('mapping', this._mapping);
    
    this._notifyListeners();
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

  // ===== VERSIONS METHODS =====

  /**
   * Get all versions
   * @returns {Array} Array of version objects
   */
  getVersions() {
    return [...this._versions];
  }

  /**
   * Set versions data with persistence
   * @param {Array} versionsData - New versions data to set
   * @returns {Array} Updated versions
   */
  setVersions(versionsData) {
    if (!Array.isArray(versionsData)) {
      throw new Error('Versions data must be an array');
    }
    
    this._versions = [...versionsData];
    
    // Save to localStorage
    this._saveToLocalStorage('versions', this._versions);
    
    this._notifyListeners();
    return this._versions;
  }

  // ===== UTILITY METHODS =====

  /**
   * Import data from various sources
   * @param {Object} data - Import data object
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
        this.setVersions(data.versions);
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
   * Extract mappings from test cases
   * @param {Array} testCases - Array of test cases
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
    console.log(`📢 _notifyListeners() called - notifying ${this._listeners.length} listeners`);
    
    let successCount = 0;
    let errorCount = 0;
    
    this._listeners.forEach((listener, index) => {
      try {
        listener();
        successCount++;
        console.log(`✅ Listener ${index + 1} notified successfully`);
      } catch (e) {
        errorCount++;
        console.error(`❌ Error in listener ${index + 1}:`, e);
      }
    });
    
    console.log(`📢 Notification complete: ${successCount} successful, ${errorCount} errors`);
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
    
    // Clear localStorage
    this.clearPersistedData();
    
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
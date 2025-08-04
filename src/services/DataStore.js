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
          // Change 2: Update Data Loading with Migration
          const rawTestCases = parsedTestCases;
          this._testCases = rawTestCases.map(tc => this._migrateTestCaseVersionFormat(tc));
          console.log(`✅ Successfully loaded and migrated ${this._testCases.length} test cases from localStorage`);
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
    // Change 3: Update Default Data Initialization
    this._testCases = defaultTestCases.map(tc => this._migrateTestCaseVersionFormat(tc));
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
    delete this._mapping[reqId]; // Corrected: use reqId here
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
            this._testCases = parsedTestCases.map(tc => this._migrateTestCaseVersionFormat(tc)); // Apply migration here too
            console.log(`🔄 Reloaded and migrated ${this._testCases.length} test cases from localStorage`);
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
      
      // === NEW: Validate field types ===
      this._validateTestCaseFieldTypes(tc, index);

      // Change 4: Add Validation for New Format (for applicableVersions)
      if (tc.applicableVersions !== undefined) {
        if (!Array.isArray(tc.applicableVersions)) {
          throw new Error(`applicableVersions must be an array for test case at index ${index} (${tc.id || 'unknown'})`);
        }
        if (!tc.applicableVersions.every(v => typeof v === 'string')) {
          throw new Error(`All versions in applicableVersions must be strings for test case at index ${index} (${tc.id || 'unknown'})`);
        }
      }
      // Existing version validation (if any)
      if (tc.version !== undefined && typeof tc.version !== 'string') {
        throw new Error(`Version must be a string for test case at index ${index} (${tc.id || 'unknown'})`);
      }


      // Log each test case being processed
      console.log(`✅ Validated test case ${index + 1}/${testCases.length}: ${tc.id} - ${tc.name}`);
      
      // Ensure all required fields exist with defaults
      return {
        id: tc.id,
        name: tc.name,
        description: tc.description || '',
        // === NEW TESTAIL FIELDS ===
        category: tc.category || '',
        preconditions: tc.preconditions || '',
        testData: tc.testData || '',
        status: tc.status || 'Not Run',
        automationStatus: tc.automationStatus || 'Manual',
        priority: tc.priority || 'Medium',
        requirementIds: tc.requirementIds || [],
        version: tc.version || '', // Keep legacy 'version' for now for backward compatibility during transition
        applicableVersions: Array.isArray(tc.applicableVersions) ? tc.applicableVersions : [], // New field
        tags: Array.isArray(tc.tags) ? tc.tags : (tc.tags ? [tc.tags] : []), // Enhanced tags handling
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

    // Change 4: Add Validation for New Format (for applicableVersions)
    if (testCaseData.applicableVersions !== undefined) {
      if (!Array.isArray(testCaseData.applicableVersions)) {
        throw new Error('applicableVersions must be an array');
      }
      if (!testCaseData.applicableVersions.every(v => typeof v === 'string')) {
        throw new Error('All versions in applicableVersions must be strings');
      }
    }
    // Existing version validation (if any)
    if (testCaseData.version !== undefined && typeof testCaseData.version !== 'string') {
      throw new Error('Version must be a string');
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
      // === NEW TESTAIL FIELDS ===
      category: testCaseData.category || '',
      preconditions: testCaseData.preconditions || '',
      testData: testCaseData.testData || '',
      status: testCaseData.status || 'Not Run',
      automationStatus: testCaseData.automationStatus || 'Manual',
      priority: testCaseData.priority || 'Medium',
      requirementIds: testCaseData.requirementIds || [],
      version: testCaseData.version || '', // Keep legacy 'version' for now for backward compatibility during transition
      applicableVersions: Array.isArray(testCaseData.applicableVersions) ? testCaseData.applicableVersions : [], // New field
      tags: Array.isArray(testCaseData.tags) ? testCaseData.tags : (testCaseData.tags ? [testCaseData.tags] : []),
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

    // Change 4: Add Validation for New Format (for applicableVersions)
    if (updateData.applicableVersions !== undefined) {
      if (!Array.isArray(updateData.applicableVersions)) {
        throw new Error('applicableVersions must be an array');
      }
      if (!updateData.applicableVersions.every(v => typeof v === 'string')) {
        throw new Error('All versions in applicableVersions must be strings');
      }
    }
    // Existing version validation (if any)
    if (updateData.version !== undefined && typeof updateData.version !== 'string') {
      throw new Error('Version must be a string');
    }

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
 * Update versions for multiple test cases (bulk assignment)
 * @param {string[]} testCaseIds - Array of test case IDs to update
 * @param {string} versionId - Version ID to add or remove
 * @param {string} action - 'add' or 'remove'
 * @returns {Object} Summary of the operation
 */
updateTestCaseVersions(testCaseIds, versionId, action) {
  if (!Array.isArray(testCaseIds) || testCaseIds.length === 0) {
    throw new Error('testCaseIds must be a non-empty array');
  }
  
  if (!versionId || typeof versionId !== 'string') {
    throw new Error('versionId must be a non-empty string');
  }
  
  if (!['add', 'remove'].includes(action)) {
    throw new Error('action must be either "add" or "remove"');
  }

  const results = {
    successful: [],
    failed: [],
    skipped: [],
    action,
    versionId
  };

  console.log(`🔄 Bulk ${action} version "${versionId}" for ${testCaseIds.length} test cases`);

  testCaseIds.forEach(testCaseId => {
    try {
      const index = this._testCases.findIndex(tc => tc.id === testCaseId);
      
      if (index === -1) {
        results.failed.push({ testCaseId, error: 'Test case not found' });
        return;
      }

      const testCase = this._testCases[index];
      const currentVersions = Array.isArray(testCase.applicableVersions) 
        ? [...testCase.applicableVersions]
        : (testCase.version ? [testCase.version] : []);

      let newVersions;
      let changed = false;

      if (action === 'add') {
        if (!currentVersions.includes(versionId)) {
          newVersions = [...currentVersions, versionId];
          changed = true;
        } else {
          results.skipped.push({ testCaseId, reason: 'Already assigned to version' });
          return;
        }
      } else { // remove
        if (currentVersions.includes(versionId)) {
          newVersions = currentVersions.filter(v => v !== versionId);
          changed = true;
        } else {
          results.skipped.push({ testCaseId, reason: 'Not assigned to version' });
          return;
        }
      }

      if (changed) {
        // Update the test case
        this._testCases[index] = {
          ...testCase,
          applicableVersions: newVersions,
          // Remove legacy version field to prevent confusion
          version: undefined
        };

        results.successful.push({ 
          testCaseId, 
          previousVersions: currentVersions,
          newVersions 
        });
      }

    } catch (error) {
      results.failed.push({ testCaseId, error: error.message });
    }
  });

  // Save to localStorage if any changes were made
  if (results.successful.length > 0) {
    this._saveToLocalStorage('testCases', this._testCases);
    this._notifyListeners();
    
    console.log(`✅ Bulk version assignment completed: ${results.successful.length} successful, ${results.failed.length} failed, ${results.skipped.length} skipped`);
  }

  return results;
}
/**
 * Validate version assignment before execution
 * @param {string[]} testCaseIds - Test case IDs to validate
 * @param {string} versionId - Version ID to validate
 * @param {string} action - 'add' or 'remove'  
 * @returns {Object} Validation result with warnings and errors
 */
validateVersionAssignment(testCaseIds, versionId, action) {
  const validation = {
    valid: true,
    errors: [],
    warnings: [],
    summary: {
      total: testCaseIds.length,
      found: 0,
      alreadyAssigned: 0,
      notAssigned: 0,
      wouldChange: 0
    }
  };

  // Validate inputs
  if (!Array.isArray(testCaseIds) || testCaseIds.length === 0) {
    validation.errors.push('No test cases selected');
    validation.valid = false;
    return validation;
  }

  if (!versionId) {
    validation.errors.push('No version selected');
    validation.valid = false;
    return validation;
  }

  // Check each test case
  testCaseIds.forEach(testCaseId => {
    const testCase = this._testCases.find(tc => tc.id === testCaseId);
    
    if (!testCase) {
      validation.errors.push(`Test case ${testCaseId} not found`);
      return;
    }

    validation.summary.found++;

    const currentVersions = Array.isArray(testCase.applicableVersions) 
      ? testCase.applicableVersions
      : (testCase.version ? [testCase.version] : []);

    const isAssigned = currentVersions.includes(versionId);

    if (action === 'add') {
      if (isAssigned) {
        validation.summary.alreadyAssigned++;
      } else {
        validation.summary.wouldChange++;
      }
    } else { // remove
      if (isAssigned) {
        validation.summary.wouldChange++;
      } else {
        validation.summary.notAssigned++;
      }
    }
  });

  // Generate warnings
  if (action === 'add' && validation.summary.alreadyAssigned > 0) {
    validation.warnings.push(`${validation.summary.alreadyAssigned} test cases already assigned to this version`);
  }
  
  if (action === 'remove' && validation.summary.notAssigned > 0) {
    validation.warnings.push(`${validation.summary.notAssigned} test cases not assigned to this version`);
  }

  if (validation.summary.wouldChange === 0) {
    validation.warnings.push('No test cases will be changed by this operation');
  }

  validation.valid = validation.errors.length === 0;
  return validation;
}
/**
 * Get summary of version assignments across test cases
 * @param {string[]} testCaseIds - Optional filter by test case IDs
 * @returns {Object} Version assignment statistics
 */
getVersionAssignmentSummary(testCaseIds = null) {
  const testCasesToAnalyze = testCaseIds 
    ? this._testCases.filter(tc => testCaseIds.includes(tc.id))
    : this._testCases;

  const versionCounts = {};
  const unassignedCount = testCasesToAnalyze.filter(tc => {
    const versions = Array.isArray(tc.applicableVersions) 
      ? tc.applicableVersions
      : (tc.version ? [tc.version] : []);
    
    if (versions.length === 0) return true;
    
    versions.forEach(versionId => {
      versionCounts[versionId] = (versionCounts[versionId] || 0) + 1;
    });
    
    return false;
  }).length;

  return {
    totalTestCases: testCasesToAnalyze.length,
    unassignedCount,
    versionCounts,
    mostUsedVersion: Object.keys(versionCounts).reduce((a, b) => 
      versionCounts[a] > versionCounts[b] ? a : b, null),
    assignmentCoverage: testCasesToAnalyze.length > 0 
      ? Math.round(((testCasesToAnalyze.length - unassignedCount) / testCasesToAnalyze.length) * 100)
      : 0
  };
}

/**
 * Get detailed version assignment statistics for reporting
 * @returns {Object} Comprehensive version statistics
 */
getVersionAssignmentStatistics() {
  const stats = {
    overview: {
      totalTestCases: this._testCases.length,
      assignedTestCases: 0,
      unassignedTestCases: 0,
      averageVersionsPerTestCase: 0
    },
    byVersion: {},
    legacyFormatCount: 0,
    newFormatCount: 0
  };

  let totalVersionAssignments = 0;

  this._testCases.forEach(tc => {
    // Track format usage
    if (tc.applicableVersions) {
      stats.newFormatCount++;
      
      if (tc.applicableVersions.length > 0) {
        stats.overview.assignedTestCases++;
        totalVersionAssignments += tc.applicableVersions.length;
        
        tc.applicableVersions.forEach(versionId => {
          if (!stats.byVersion[versionId]) {
            stats.byVersion[versionId] = {
              testCaseCount: 0,
              testCaseIds: []
            };
          }
          stats.byVersion[versionId].testCaseCount++;
          stats.byVersion[versionId].testCaseIds.push(tc.id);
        });
      } else {
        stats.overview.unassignedTestCases++;
      }
    } else if (tc.version) {
      stats.legacyFormatCount++;
      
      if (tc.version) {
        stats.overview.assignedTestCases++;
        totalVersionAssignments++;
        
        if (!stats.byVersion[tc.version]) {
          stats.byVersion[tc.version] = {
            testCaseCount: 0,
            testCaseIds: []
          };
        }
        stats.byVersion[tc.version].testCaseCount++;
        stats.byVersion[tc.version].testCaseIds.push(tc.id);
      } else {
        stats.overview.unassignedTestCases++;
      }
    } else {
      stats.overview.unassignedTestCases++;
    }
  });

  stats.overview.averageVersionsPerTestCase = stats.overview.assignedTestCases > 0
    ? Math.round((totalVersionAssignments / stats.overview.assignedTestCases) * 100) / 100
    : 0;

  return stats;
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

/**
 * Add a new version
 * @param {Object} versionData - Version data to add
 * @returns {Object} Added version
 */
addVersion(versionData) {
  // Validate required fields
  if (!versionData.id || !versionData.name) {
    throw new Error('Version ID and name are required');
  }

  // Check if version ID already exists
  if (this._versions.find(v => v.id === versionData.id)) {
    throw new Error(`Version with ID ${versionData.id} already exists`);
  }

  // Create the new version with defaults
  const newVersion = {
    id: versionData.id,
    name: versionData.name,
    releaseDate: versionData.releaseDate,
    status: versionData.status || 'Planned',
    qualityGates: versionData.qualityGates || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...versionData
  };

  // Add to versions array
  this._versions.push(newVersion);

  // Save to localStorage
  this._saveToLocalStorage('versions', this._versions);

  // Notify listeners of data change
  this._notifyListeners();

  return newVersion;
}

/**
 * Update an existing version
 * @param {string} versionId - ID of the version to update
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated version
 */
updateVersion(versionId, updateData) {
  const index = this._versions.findIndex(v => v.id === versionId);
  
  if (index === -1) {
    throw new Error(`Version with ID ${versionId} not found`);
  }

  // Don't allow changing the ID
  if (updateData.id && updateData.id !== versionId) {
    throw new Error('Cannot change version ID');
  }

  // Update the version
  const updatedVersion = {
    ...this._versions[index],
    ...updateData,
    updatedAt: new Date().toISOString()
  };

  this._versions[index] = updatedVersion;

  // Save to localStorage
  this._saveToLocalStorage('versions', this._versions);

  // Notify listeners of data change
  this._notifyListeners();

  return updatedVersion;
}

/**
 * Delete a version
 * @param {string} versionId - ID of the version to delete
 * @returns {boolean} True if successful
 */
deleteVersion(versionId) {
  // Add this at the start of the existing deleteVersion method
console.log(`🗑️ Deleting version "${versionId}" - checking test case assignments`);

const affectedTestCases = this._testCases.filter(tc => {
  const versions = Array.isArray(tc.applicableVersions) 
    ? tc.applicableVersions
    : (tc.version === versionId ? [tc.version] : []);
  return versions.includes(versionId);
});

console.log(`📊 Found ${affectedTestCases.length} test cases assigned to version "${versionId}"`);
  const index = this._versions.findIndex(v => v.id === versionId);
  
  if (index === -1) {
    throw new Error(`Version with ID ${versionId} not found`);
  }

  const version = this._versions[index];

  // Remove from versions array
  this._versions.splice(index, 1);

  // Clean up any references to this version in requirements
  this._requirements.forEach(req => {
    if (req.versions && Array.isArray(req.versions)) {
      req.versions = req.versions.filter(v => v !== versionId);
    }
  });

  // Change 5: Update Version Cleanup Logic
  this._testCases.forEach(tc => {
    // Handle new format
    if (tc.applicableVersions && Array.isArray(tc.applicableVersions)) {
      tc.applicableVersions = tc.applicableVersions.filter(v => v !== versionId);
    }
    
    // Handle legacy format during transition
    if (tc.version === versionId) {
      tc.version = '';
    }
  });

  // Save to localStorage
  this._saveToLocalStorage('versions', this._versions);
  this._saveToLocalStorage('requirements', this._requirements);
  this._saveToLocalStorage('testCases', this._testCases);

  // Notify listeners of data change
  this._notifyListeners();

  return true;
}

/**
 * Get a specific version by ID
 * @param {string} versionId - ID of the version to get
 * @returns {Object|null} Version object or null if not found
 */
getVersion(versionId) {
  return this._versions.find(v => v.id === versionId) || null;
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

  /**
   * Validate field types for TestRail integration
   * @private
   * @param {Object} tc - Test case object
   * @param {number} index - Index for error reporting
   */
  _validateTestCaseFieldTypes(tc, index) {
    const errors = [];

    // Validate new TestRail fields
    if (tc.category !== undefined && typeof tc.category !== 'string') {
      errors.push(`Category must be string for test case at index ${index} (${tc.id || 'unknown'})`);
    }

    if (tc.preconditions !== undefined && typeof tc.preconditions !== 'string') {
      errors.push(`Preconditions must be string for test case at index ${index} (${tc.id || 'unknown'})`);
    }

    if (tc.testData !== undefined && typeof tc.testData !== 'string') {
      errors.push(`Test data must be string for test case at index ${index} (${tc.id || 'unknown'})`);
    }

    // Validate tags is array
    if (tc.tags !== undefined && !Array.isArray(tc.tags)) {
      errors.push(`Tags must be array for test case at index ${index} (${tc.id || 'unknown'})`);
    }

    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }
  }

  /**
   * Migrate test case from legacy version format to applicableVersions format
   * @param {Object} testCase - Test case object to migrate
   * @returns {Object} Migrated test case object
   */
  _migrateTestCaseVersionFormat(testCase) {
    // If already using new format, return as-is
    if (testCase.applicableVersions) {
      return testCase;
    }

    // Migrate from legacy format
    const migrated = { ...testCase };
    
    if (migrated.version && migrated.version !== '') { // Use migrated.version
      // Convert single version to array
      migrated.applicableVersions = [migrated.version];
    } else {
      // Empty version means applies to all versions
      migrated.applicableVersions = [];
    }

    // Remove the old 'version' field after migration to avoid redundancy,
    // but only if it was successfully migrated to applicableVersions.
    // This makes the transition cleaner over time.
    if (migrated.hasOwnProperty('version')) {
      delete migrated.version;
    }

    return migrated;
  }

  /**
   * Check if a test case applies to a specific version
   * @param {Object} testCase - Test case object
   * @param {string} versionId - Version ID to check
   * @returns {boolean} True if test case applies to the version
   */
  testCaseAppliesTo(testCase, versionId) {
    // Handle new format
    if (testCase.applicableVersions) {
      // Empty array means applies to all versions
      if (testCase.applicableVersions.length === 0) return true;
      return testCase.applicableVersions.includes(versionId);
    }
    
    // Handle legacy format
    if (testCase.version) {
      return testCase.version === versionId || testCase.version === '';
    }
    
    // Default: applies to all versions if no versioning specified
    return true;
  }

  /**
   * Get test cases that apply to a specific version
   * @param {string} versionId - Version ID to filter by
   * @returns {Array} Test cases applicable to the version
   */
  getTestCasesForVersion(versionId) {
    if (versionId === 'unassigned') {
      // 'unassigned' should typically show all test cases, or test cases with no specific version assigned.
      // Based on the migration, an empty applicableVersions array means "applies to all versions".
      // If 'unassigned' specifically means test cases that have *no* applicableVersions defined (or empty),
      // then we'd filter for that. For now, assuming 'unassigned' means show all.
      return this._testCases; 
    }
    
    return this._testCases.filter(tc => this.testCaseAppliesTo(tc, versionId));
  }
}

// Create singleton instance
const dataStore = new DataStoreService();

export default dataStore;

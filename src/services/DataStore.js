
import apiClient from '../utils/apiClient';

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
    this._currentWorkspaceId = null;
    this._isInitializing = false;

    this._setupWorkspaceListener();
  }

  /**
   * Setup listener for workspace changes from localStorage
   * @private
   */
  _setupWorkspaceListener() {
    // Check localStorage immediately on construction
    const savedWorkspace = localStorage.getItem('currentWorkspace');
    if (savedWorkspace) {
      try {
        const workspace = JSON.parse(savedWorkspace);
        this._currentWorkspaceId = workspace.id;
        console.log('📍 DataStore found saved workspace:', workspace.name);

        // Initialize with this workspace
        this._initializeData();
      } catch (error) {
        console.error('Error parsing saved workspace:', error);
        // Fallback to default initialization
        this._initializeData();
      }
    } else {
      console.log('📍 No saved workspace found, will initialize when workspace is set');
    }

    // Listen for workspace changes (from other tabs/windows)
    window.addEventListener('storage', (e) => {
      if (e.key === 'currentWorkspace' && e.newValue) {
        try {
          const workspace = JSON.parse(e.newValue);
          if (workspace.id !== this._currentWorkspaceId) {
            console.log('🔄 Workspace changed in another tab, reloading data...');
            this.setCurrentWorkspace(workspace.id);
          }
        } catch (error) {
          console.error('Error handling workspace change:', error);
        }
      }
    });
  }

  /**
   * Set current workspace and reload data
   * @param {string} workspaceId - Workspace ID to switch to
   * @returns {Promise<boolean>} Success status
   */
  async setCurrentWorkspace(workspaceId) {
    if (this._currentWorkspaceId === workspaceId) {
      console.log('⏭️ Already in workspace:', workspaceId);
      return true;
    }

    console.log('🔄 Switching to workspace:', workspaceId);
    this._currentWorkspaceId = workspaceId;

    // Reload data for new workspace
    return await this.loadFromDatabase(workspaceId);
  }


  /**
     * Initialize data from database or localStorage
     * @private
     */
  async _initializeData() {
    if (this._isInitializing) {
      console.log('⏸️ Already initializing, skipping...');
      return;
    }

    this._isInitializing = true;
    console.log('🚀 Initializing DataStore...');

    // Try loading from database first
    const dbLoaded = await this.loadFromDatabase(this._currentWorkspaceId);

    // If database load failed or returned no data, fallback to localStorage
    if (!dbLoaded || !this._hasInitializedData) {
      console.log('📂 Falling back to localStorage...');
      this._loadPersistedData();
    }

    this._isInitializing = false;
    console.log('✅ DataStore initialization complete');
  }

  /**
   * ✅ CENTRALIZED: Convert snake_case object to camelCase
   * Use this when receiving data FROM the API
   * @param {Object} snakeObj - Object with snake_case keys
   * @returns {Object} Object with camelCase keys
   */
  _toCamelCase(snakeObj) {
    if (!snakeObj || typeof snakeObj !== 'object') return snakeObj;

    const mapping = {
      // Test Case fields
      requirement_ids: 'requirementIds',
      applicable_versions: 'applicableVersions',
      expected_result: 'expectedResult',
      automation_status: 'automationStatus',
      custom_fields: 'customFields',
      test_data: 'testData',
      automation_path: 'automationPath',
      estimated_duration: 'estimatedDuration',
      last_executed: 'lastExecuted',
      last_executed_by: 'lastExecutedBy',
      execution_count: 'executionCount',
      pass_count: 'passCount',
      fail_count: 'failCount',
      external_id: 'externalId',
      external_url: 'externalUrl',
      created_at: 'createdAt',
      updated_at: 'updatedAt',
      created_by: 'createdBy',
      updated_by: 'updatedBy',

      // Requirement fields
      business_impact: 'businessImpact',
      technical_complexity: 'technicalComplexity',
      regulatory_factor: 'regulatoryFactor',
      usage_frequency: 'usageFrequency',
      test_depth_factor: 'testDepthFactor',
      min_test_cases: 'minTestCases',

      // Test Suite fields
      suite_type: 'suiteType',
      recommended_environment: 'recommendedEnvironment',
      is_active: 'isActive',
      test_count: 'testCount',
      automated_count: 'automatedCount',

      // Workspace fields
      workspace_id: 'workspaceId'
    };

    const result = {};
    for (const [key, value] of Object.entries(snakeObj)) {
      const camelKey = mapping[key] || key;
      result[camelKey] = value;
    }
    return result;
  }

  /**
   * ✅ CENTRALIZED: Convert camelCase object to snake_case
   * Use this when sending data TO the API
   * @param {Object} camelObj - Object with camelCase keys
   * @returns {Object} Object with snake_case keys
   */
  _toSnakeCase(camelObj) {
    if (!camelObj || typeof camelObj !== 'object') return camelObj;

    const mapping = {
      // Test Case fields
      requirementIds: 'requirement_ids',
      applicableVersions: 'applicable_versions',
      expectedResult: 'expected_result',
      automationStatus: 'automation_status',
      customFields: 'custom_fields',
      testData: 'test_data',
      automationPath: 'automation_path',
      estimatedDuration: 'estimated_duration',
      lastExecuted: 'last_executed',
      lastExecutedBy: 'last_executed_by',
      executionCount: 'execution_count',
      passCount: 'pass_count',
      failCount: 'fail_count',
      externalId: 'external_id',
      externalUrl: 'external_url',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      createdBy: 'created_by',
      updatedBy: 'updated_by',

      // Requirement fields
      businessImpact: 'business_impact',
      technicalComplexity: 'technical_complexity',
      regulatoryFactor: 'regulatory_factor',
      usageFrequency: 'usage_frequency',
      testDepthFactor: 'test_depth_factor',
      minTestCases: 'min_test_cases',

      // Test Suite fields
      suiteType: 'suite_type',
      recommendedEnvironment: 'recommended_environment',
      isActive: 'is_active',
      testCount: 'test_count',
      automatedCount: 'automated_count',

      // Workspace fields
      workspaceId: 'workspace_id'
    };

    const result = {};
    for (const [key, value] of Object.entries(camelObj)) {
      const snakeKey = mapping[key] || key;
      result[snakeKey] = value;
    }
    return result;
  }

  /**
   * ✅ BONUS: Convert arrays of objects
   * Useful for bulk operations
   */
  _arrayToSnakeCase(camelArray) {
    if (!Array.isArray(camelArray)) return camelArray;
    return camelArray.map(item => this._toSnakeCase(item));
  }

  _arrayToCamelCase(snakeArray) {
    if (!Array.isArray(snakeArray)) return snakeArray;
    return snakeArray.map(item => this._toCamelCase(item));
  }

  /**
 * Get current workspace ID - throws error if not set
 * @returns {string} Current workspace ID
 */

  getCurrentWorkspaceId() {
    if (this._currentWorkspaceId) {
      return this._currentWorkspaceId;
    }

    // Try to get from localStorage
    const savedWorkspace = localStorage.getItem('currentWorkspace');
    if (savedWorkspace) {
      try {
        const workspace = JSON.parse(savedWorkspace);
        this._currentWorkspaceId = workspace.id;
        return workspace.id;
      } catch (error) {
        console.error('Error parsing saved workspace:', error);
      }
    }

    throw new Error('No workspace selected. Please select a workspace first.');
  }

  /**
    * Load data from database API
    * @param {string} workspaceId - Optional workspace ID (uses current if not provided)
    * @returns {Promise<boolean>} True if successful
    */
  async loadFromDatabase(workspaceId = null) {
    try {
      // Get workspace ID - REQUIRED
      const targetWorkspaceId = workspaceId || this.getCurrentWorkspaceId();

      console.log('🔄 Loading data from database API...');
      console.log('🏢 Target workspace:', targetWorkspaceId);

      // ✅ ALWAYS include workspace_id - never make it optional
      if (!targetWorkspaceId) {
        throw new Error('workspace_id is required');
      }
      const workspaceParam = `?workspace_id=${targetWorkspaceId}`;
      // Fetch requirements with workspace_id
      try {
        const reqResponse = await apiClient.get(`/api/requirements${workspaceParam}`);
        if (reqResponse.data.success && Array.isArray(reqResponse.data.data)) {
          this._requirements = reqResponse.data.data.map(req => this._toCamelCase(req));
          console.log(`✅ Loaded ${this._requirements.length} requirements`);
        }
      } catch (error) {
        console.error('❌ Failed to fetch requirements:', error.message);
        if (error.response?.status === 400) {
          throw new Error('workspace_id is required. Please select a workspace.');
        }
      }

      // Fetch test cases with workspace_id
      // Fetch test cases with workspace_id
      try {
        const tcResponse = await apiClient.get(`/api/test-cases${workspaceParam}`);
        if (tcResponse.data.success && Array.isArray(tcResponse.data.data)) {
          // ✅ FIX: Convert ALL test cases from snake_case to camelCase
          this._testCases = tcResponse.data.data.map(tc => this._toCamelCase(tc));
          console.log(`✅ Loaded and converted ${this._testCases.length} test cases`);
        }
      } catch (error) {
        console.error('❌ Failed to fetch test cases:', error.message);
        if (error.response?.status === 400) {
          throw new Error('workspace_id is required. Please select a workspace.');
        }
      }
      // Fetch versions with workspace_id
      try {
        const versionResponse = await apiClient.get(`/api/versions${workspaceParam}`);
        if (versionResponse.data.success && Array.isArray(versionResponse.data.data)) {
          this._versions = versionResponse.data.data;
          console.log(`✅ Loaded ${this._versions.length} versions`);
        }
      } catch (error) {
        console.error('❌ Failed to fetch versions:', error.message);
      }

      // Fetch mappings with workspace_id
      try {
        const mappingResponse = await apiClient.get(`/api/mappings${workspaceParam}`);
        if (mappingResponse.data.success && mappingResponse.data.data) {
          this._mapping = mappingResponse.data.data;
          console.log(`✅ Loaded mappings`);
        }
      } catch (error) {
        console.error('❌ Failed to fetch mappings:', error.message);
      }

      this._hasInitializedData = true;
      this._notifyListeners();

      return true;
    } catch (error) {
      console.error('❌ Failed to load from database:', error);
      throw error;
    }
  }


  /**
   * Get API base URL
   * @private
   * @returns {string} API base URL
   */
  _getApiBaseUrl() {
    // Check if we're in production
    const isProduction = window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1';

    if (isProduction) {
      // In production, use nginx proxy (same as apiService.js does)
      // NO PORT - nginx handles the routing to port 3002 internally
      return `http://${window.location.hostname}`;
    }

    // For local development - direct to API server port
    if (import.meta.env && import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }

    if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }

    return 'http://localhost:3002';
  }

  /**
   * Load persisted data from localStorage
   * @private
   */
  _loadPersistedData() {
    console.log(`⏭️ Skipping localStorage load - using backend database only`);
    return;
    /** 
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
    */
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
    // Return a normalized copy of all requirements
    return this._normalizeRequirements([...this._requirements]);
  }

  /**
   * Get a single requirement by ID
   * @param {string} id - Requirement ID
   * @returns {Object|null} Requirement object or null if not found
   */
  getRequirement(id) {
    const req = this._requirements.find(req => req.id === id);
    return req ? this._normalizeRequirement(req) : null;
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

    // Normalize the requirements data first
    const normalizedData = this._normalizeRequirements(requirementsData);

    // Process the data to add calculated fields
    const processed = this.processRequirements(normalizedData);

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
  async deleteRequirement(id) {
    const workspaceId = this.getCurrentWorkspaceId();

    try {
      const response = await apiClient.delete(`/api/requirements/${id}?workspace_id=${workspaceId}`);

      if (response.data.success) {
        this._requirements = this._requirements.filter(r => r.id !== id);
        this._notifyListeners();
      }
    } catch (error) {
      console.error('Error deleting requirement:', error);
      throw error;
    }
  }

  /**
   * Process requirements to add calculated fields
   * @param {Array} requirements - Raw requirements data
   * @returns {Array} Processed requirements
   */
  processRequirements(requirementsData) {
    return requirementsData.map(req => {
      // First normalize to ensure versions and tags are arrays
      const normalized = this._normalizeRequirement(req);

      // Now continue with your normal processing
      const processedReq = { ...normalized };

      // Calculate business impact if not already set
      if (!processedReq.businessImpact) {
        processedReq.businessImpact = 3; // Default medium impact
      }

      // Calculate technical complexity if not already set
      if (!processedReq.technicalComplexity) {
        processedReq.technicalComplexity = 2; // Default medium complexity
      }

      // Add additional processing as needed...

      return processedReq;
    });
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
      console.log(`⏭️ No test cases in memory - backend should be loaded via loadFromDatabase()`);

      /** 

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
      */
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
    /**
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

    */

    console.log(`⏭️ Skipping localStorage save - using backend database only`);


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
 * Create or add a new test case
 * @param {Object} testCase - Test case object to add
 * @returns {Promise<Object>} Created test case
 */

  async addTestCase(testCase) {
    // Validate required fields
    if (!testCase.id || !testCase.name) {
      throw new Error('Test case must have id and name');
    }

    // Check if already exists
    if (this._testCases.find(tc => tc.id === testCase.id)) {
      throw new Error(`Test case with ID ${testCase.id} already exists`);
    }

    // ✅ NEW: Get workspace ID (will throw if not set)
    const workspaceId = this.getCurrentWorkspaceId();

    try {
      console.log(`📤 Creating test case ${testCase.id} in workspace:`, workspaceId);

      // ✅ NEW: Use the workspaceId we just got
      const response = await apiClient.post('/api/test-cases', {
        ...testCase,
        workspace_id: workspaceId
      });

      if (response.data.success) {
        this._testCases.push(response.data.data);
        this._notifyListeners();
        return response.data.data;
      }
    } catch (error) {
      console.error('Error creating test case:', error);
      throw error;
    }
  }

  // ========================================================================
  // TEST SUITES METHODS - Add these to your DataStore.js class
  // ========================================================================
  // Add these methods after your existing test case methods in DataStore.js
  // Follow the same pattern as getTestCases(), createTestCase(), etc.

  /**
   * Get all test suites for current workspace
   * @returns {Promise<Array>} Array of test suite objects
   */
  async getTestSuites() {
    const workspaceId = this.getCurrentWorkspaceId();

    try {
      console.log(`📦 Fetching test suites for workspace: ${workspaceId}`);

      const response = await apiClient.get(`/api/test-suites?workspace_id=${workspaceId}`);

      if (response.data.success) {
        console.log(`✅ Loaded ${response.data.count} test suites`);
        return response.data.data;
      }

      return [];
    } catch (error) {
      console.error('❌ Failed to fetch test suites:', error);
      throw error;
    }
  }

  /**
   * Get a single test suite by ID
   * @param {string} suiteId - Test suite ID (UUID)
   * @returns {Promise<Object>} Test suite object
   */
  async getTestSuite(suiteId) {
    const workspaceId = this.getCurrentWorkspaceId();

    try {
      console.log(`📦 Fetching test suite: ${suiteId}`);

      const response = await apiClient.get(
        `/api/test-suites/${suiteId}?workspace_id=${workspaceId}`
      );

      if (response.data.success) {
        console.log(`✅ Loaded test suite: ${response.data.data.name}`);
        return response.data.data;
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to fetch test suite:', error);
      throw error;
    }
  }

  /**
   * Get test cases in a suite (suite members)
   * @param {string} suiteId - Test suite ID (UUID)
   * @returns {Promise<Array>} Array of test case objects with membership data
   */
  async getTestSuiteMembers(suiteId) {
    const workspaceId = this.getCurrentWorkspaceId();

    try {
      console.log(`📦 Fetching members for suite: ${suiteId}`);

      const response = await apiClient.get(
        `/api/test-suites/${suiteId}/members?workspace_id=${workspaceId}`
      );

      if (response.data.success) {
        console.log(`✅ Loaded ${response.data.count} test cases in suite`);
        return response.data.data;
      }

      return [];
    } catch (error) {
      console.error('❌ Failed to fetch test suite members:', error);
      throw error;
    }
  }

  /**
   * Create a new test suite
   * @param {Object} suiteData - Test suite data
   * @param {string} suiteData.name - Suite name (required)
   * @param {string} suiteData.description - Suite description
   * @param {string} suiteData.version - Suite version
   * @param {string} suiteData.suite_type - Type: 'smoke', 'regression', 'sanity', 'integration', 'custom'
   * @param {number} suiteData.estimated_duration - Estimated duration in minutes
   * @param {string} suiteData.recommended_environment - Recommended environment
   * @param {string[]} suiteData.test_case_ids - Optional array of test case IDs to add initially
   * @returns {Promise<Object>} Created test suite object
   */
  async createTestSuite(suiteData) {
    const workspaceId = this.getCurrentWorkspaceId();

    // Validate required fields
    if (!suiteData.name) {
      throw new Error('Suite name is required');
    }

    try {
      console.log(`📤 Creating test suite: ${suiteData.name}`);

      const response = await apiClient.post('/api/test-suites', {
        ...suiteData,
        workspace_id: workspaceId
      });

      if (response.data.success) {
        console.log(`✅ Created test suite: ${response.data.data.name} (${response.data.data.id})`);
        this._notifyListeners(); // Notify UI to refresh
        return response.data.data;
      }
    } catch (error) {
      console.error('❌ Error creating test suite:', error);
      throw error;
    }
  }

  /**
   * Update an existing test suite
   * @param {string} suiteId - Test suite ID (UUID)
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated test suite object
   */
  async updateTestSuite(suiteId, updates) {
    const workspaceId = this.getCurrentWorkspaceId();

    try {
      // ✅ Convert camelCase to snake_case before sending to API
      const apiPayload = {
        ...this._toSnakeCase(updates),
        workspace_id: workspaceId
      };

      console.log('📤 Sending test suite update to API:', apiPayload);

      const response = await apiClient.put(`/api/test-suites/${suiteId}`, apiPayload);

      if (response.data.success) {
        console.log(`✅ Updated test suite: ${response.data.data.name}`);
        this._notifyListeners(); // Notify UI to refresh
        return response.data.data;
      }
    } catch (error) {
      console.error('❌ Error updating test suite:', error);
      throw error;
    }
  }

  /**
   * Add test cases to a suite
   * @param {string} suiteId - Test suite ID (UUID)
   * @param {string[]} testCaseIds - Array of test case IDs to add
   * @returns {Promise<Object>} Result with added/skipped counts
   */
  async addTestCasesToSuite(suiteId, testCaseIds) {
    const workspaceId = this.getCurrentWorkspaceId();

    if (!Array.isArray(testCaseIds) || testCaseIds.length === 0) {
      throw new Error('test_case_ids must be a non-empty array');
    }

    try {
      console.log(`📤 Adding ${testCaseIds.length} test cases to suite: ${suiteId}`);

      const response = await apiClient.post(`/api/test-suites/${suiteId}/members`, {
        test_case_ids: testCaseIds,
        workspace_id: workspaceId
      });

      if (response.data.success) {
        console.log(`✅ Added ${response.data.added} test cases to suite (${response.data.skipped} skipped)`);
        this._notifyListeners(); // Notify UI to refresh
        return response.data;
      }
    } catch (error) {
      console.error('❌ Error adding test cases to suite:', error);
      throw error;
    }
  }

  /**
   * Remove a test case from a suite
   * @param {string} suiteId - Test suite ID (UUID)
   * @param {string} testCaseId - Test case ID to remove
   * @returns {Promise<boolean>} True if successful
   */
  async removeTestCaseFromSuite(suiteId, testCaseId) {
    const workspaceId = this.getCurrentWorkspaceId();

    try {
      console.log(`📤 Removing test case ${testCaseId} from suite: ${suiteId}`);

      const response = await apiClient.delete(
        `/api/test-suites/${suiteId}/members/${testCaseId}?workspace_id=${workspaceId}`
      );

      if (response.data.success) {
        console.log(`✅ Removed test case from suite`);
        this._notifyListeners(); // Notify UI to refresh
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error removing test case from suite:', error);
      throw error;
    }
  }

  /**
   * Delete a test suite
   * @param {string} suiteId - Test suite ID (UUID)
   * @returns {Promise<boolean>} True if successful
   */
  async deleteTestSuite(suiteId) {
    const workspaceId = this.getCurrentWorkspaceId();

    try {
      console.log(`🗑️ Deleting test suite: ${suiteId}`);

      const response = await apiClient.delete(
        `/api/test-suites/${suiteId}?workspace_id=${workspaceId}`
      );

      if (response.data.success) {
        console.log(`✅ Deleted test suite`);
        this._notifyListeners(); // Notify UI to refresh
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error deleting test suite:', error);
      throw error;
    }
  }

  // ========================================================================
  // HELPER METHODS (Optional but useful)
  // ========================================================================

  /**
   * Check if a test case is in a suite
   * @param {string} suiteId - Test suite ID (UUID)
   * @param {string} testCaseId - Test case ID
   * @returns {Promise<boolean>} True if test case is in suite
   */
  async isTestCaseInSuite(suiteId, testCaseId) {
    try {
      const members = await this.getTestSuiteMembers(suiteId);
      return members.some(tc => tc.id === testCaseId);
    } catch (error) {
      console.error('Error checking suite membership:', error);
      return false;
    }
  }

  /**
   * Get all suites that contain a specific test case
   * @param {string} testCaseId - Test case ID
   * @returns {Promise<Array>} Array of test suites containing this test case
   */
  async getSuitesContainingTestCase(testCaseId) {
    try {
      const allSuites = await this.getTestSuites();
      const suitesWithTestCase = [];

      // Check each suite to see if it contains the test case
      for (const suite of allSuites) {
        const members = await this.getTestSuiteMembers(suite.id);
        if (members.some(tc => tc.id === testCaseId)) {
          suitesWithTestCase.push(suite);
        }
      }

      return suitesWithTestCase;
    } catch (error) {
      console.error('Error getting suites for test case:', error);
      return [];
    }
  }

  /**
   * Get suite statistics
   * @param {string} suiteId - Test suite ID (UUID)
   * @returns {Promise<Object>} Suite statistics
   */
  async getTestSuiteStats(suiteId) {
    try {
      const suite = await this.getTestSuite(suiteId);
      const members = await this.getTestSuiteMembers(suiteId);

      return {
        id: suite.id,
        name: suite.name,
        totalTests: members.length,
        automatedTests: members.filter(tc => tc.automation_status === 'Automated').length,
        manualTests: members.filter(tc => tc.automation_status === 'Manual').length,
        passedTests: members.filter(tc => tc.status === 'Passed').length,
        failedTests: members.filter(tc => tc.status === 'Failed').length,
        notRunTests: members.filter(tc => tc.status === 'Not Run').length,
        estimatedDuration: suite.estimated_duration,
        suiteType: suite.suite_type,
        version: suite.version
      };
    } catch (error) {
      console.error('Error getting suite stats:', error);
      return null;
    }
  }

  /**
 * Centralized validation for version-requirement compatibility
 * @param {string} testCaseId - Test case ID
 * @param {string[]} newVersions - New versions to assign to test case
 * @param {string[]} requirementIds - Requirement IDs linked to test case
 * @returns {Object} Validation result
 */
  validateVersionRequirementCompatibility(testCaseId, newVersions, requirementIds = null) {
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      mismatches: []
    };

    // Get the test case to find current requirement links if not provided
    const testCase = this.getTestCase(testCaseId);
    if (!testCase) {
      validation.errors.push(`Test case ${testCaseId} not found`);
      validation.valid = false;
      return validation;
    }

    // Use provided requirementIds or get from test case
    const reqIds = requirementIds || testCase.requirementIds || [];

    if (reqIds.length === 0) {
      return validation; // No requirements to validate against
    }

    console.log(`🔍 Validating versions [${newVersions.join(', ')}] for test case ${testCaseId} against requirements [${reqIds.join(', ')}]`);

    reqIds.forEach(reqId => {
      const requirement = this.getRequirement(reqId);

      if (!requirement) {
        validation.errors.push(`Requirement ${reqId} not found`);
        validation.valid = false;
        return;
      }

      const reqVersions = requirement.versions || [];

      // Check version compatibility
      const testHasNoVersions = newVersions.length === 0;
      const reqHasNoVersions = reqVersions.length === 0;
      const hasVersionOverlap = newVersions.some(v => reqVersions.includes(v));

      // Compatibility rules:
      // 1. If test case has no versions = applies to all versions (compatible)
      // 2. If requirement has no versions = applies to all versions (compatible)  
      // 3. If there's at least one version overlap = compatible
      const isCompatible = testHasNoVersions || reqHasNoVersions || hasVersionOverlap;

      console.log(`🔍 Compatibility check: TC versions [${newVersions.join(', ') || 'all'}] vs REQ ${reqId} versions [${reqVersions.join(', ') || 'all'}] = ${isCompatible ? '✅' : '❌'}`);

      if (!isCompatible) {
        const mismatch = {
          testCaseId,
          requirementId: reqId,
          testVersions: [...newVersions],
          reqVersions: [...reqVersions]
        };

        validation.mismatches.push(mismatch);
        validation.errors.push(
          `❌ Version Conflict: Test case ${testCaseId} is assigned to "${newVersions.join(', ') || 'all versions'}" but requirement ${reqId} is assigned to "${reqVersions.join(', ') || 'all versions'}". ` +
          `They must share at least one common version.\n\n` +
          `💡 To fix: Either add "${reqVersions.join(', ')}" to test case versions, or add "${newVersions.join(', ')}" to requirement versions, or set one to "all versions".`
        );
        validation.valid = false;
      }
    });

    return validation;
  }

  /**
   * Update an existing test case
   * @param {string} testCaseId - ID of test case to update
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated test case
   */

  async updateTestCase(id, updates) {
    const workspaceId = this.getCurrentWorkspaceId();

    try {
      const apiPayload = {
        ...this._toSnakeCase(updates),
        workspace_id: workspaceId
      };

      console.log('📤 Sending test case update to API:', apiPayload);

      const response = await apiClient.put(`/api/test-cases/${id}`, apiPayload);

      if (response.data.success) {
        const getResponse = await apiClient.get(
          `/api/test-cases/${id}?workspace_id=${workspaceId}`
        );

        if (getResponse.data.success) {
          const index = this._testCases.findIndex(tc => tc.id === id);
          if (index !== -1) {
            // ✅ FIX: Convert snake_case from API to camelCase
            const freshData = getResponse.data.data;
            const camelCaseData = this._toCamelCase(freshData);

            this._testCases[index] = camelCaseData;

            // ✅ FIX: Update mappings from test case requirements
            this._updateMappingsFromTestCases();

            // ✅ Notify listeners AFTER mappings are updated
            this._notifyListeners();

            console.log('✅ Test case updated, converted, mappings refreshed:', id);
          }
        }
      }
    } catch (error) {
      console.error('Error updating test case:', error);
      throw error;
    }
  }
  /**
   * Update versions for multiple test cases (bulk assignment) with validation
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
      validationErrors: [],
      action,
      versionId
    };

    console.log(`🔄 Bulk ${action} version "${versionId}" for ${testCaseIds.length} test cases with validation`);

    // First pass: validate all changes before making any
    const validationResults = new Map();

    testCaseIds.forEach(testCaseId => {
      try {
        const testCase = this._testCases.find(tc => tc.id === testCaseId);

        if (!testCase) {
          results.failed.push({ testCaseId, error: 'Test case not found' });
          return;
        }

        const currentVersions = Array.isArray(testCase.applicableVersions)
          ? [...testCase.applicableVersions]
          : (testCase.version ? [testCase.version] : []);

        let newVersions;

        if (action === 'add') {
          if (!currentVersions.includes(versionId)) {
            newVersions = [...currentVersions, versionId];
          } else {
            results.skipped.push({ testCaseId, reason: 'Already assigned to version' });
            return;
          }
        } else { // remove
          if (currentVersions.includes(versionId)) {
            newVersions = currentVersions.filter(v => v !== versionId);
          } else {
            results.skipped.push({ testCaseId, reason: 'Not assigned to version' });
            return;
          }
        }

        // NEW: Validate version compatibility
        const validation = this.validateVersionRequirementCompatibility(testCaseId, newVersions);

        if (!validation.valid) {
          results.validationErrors.push({
            testCaseId,
            errors: validation.errors,
            mismatches: validation.mismatches
          });
          console.log(`❌ Validation failed for ${testCaseId}:`, validation.errors);
          return;
        }

        // Store successful validation for second pass
        validationResults.set(testCaseId, {
          currentVersions,
          newVersions,
          testCase
        });

      } catch (error) {
        results.failed.push({ testCaseId, error: error.message });
      }
    });

    // Check if there were any validation errors
    if (results.validationErrors.length > 0) {
      const allErrors = results.validationErrors.flatMap(ve => ve.errors);
      console.log(`❌ Bulk operation cancelled due to ${results.validationErrors.length} validation errors`);
      throw new Error(`Version compatibility errors:\n${allErrors.join('\n')}`);
    }

    // Second pass: apply all validated changes
    validationResults.forEach((changeData, testCaseId) => {
      try {
        const index = this._testCases.findIndex(tc => tc.id === testCaseId);

        // Update the test case
        this._testCases[index] = {
          ...changeData.testCase,
          applicableVersions: changeData.newVersions,
          // Remove legacy version field to prevent confusion
          version: undefined
        };

        results.successful.push({
          testCaseId,
          previousVersions: changeData.currentVersions,
          newVersions: changeData.newVersions
        });

      } catch (error) {
        results.failed.push({ testCaseId, error: error.message });
      }
    });

    // Save to localStorage if any changes were made
    if (results.successful.length > 0) {
      this._saveToLocalStorage('testCases', this._testCases);
      this._notifyListeners();

      console.log(`✅ Bulk version assignment completed: ${results.successful.length} successful, ${results.failed.length} failed, ${results.skipped.length} skipped, ${results.validationErrors.length} validation errors`);
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

  async deleteTestCase(id) {
    const workspaceId = this.getCurrentWorkspaceId();  // ✅ Add this

    try {
      // ✅ Add workspace_id to URL
      const response = await apiClient.delete(
        `/api/test-cases/${id}?workspace_id=${workspaceId}`
      );

      if (response.data.success) {
        this._testCases = this._testCases.filter(tc => tc.id !== id);
        this._notifyListeners();
      }
    } catch (error) {
      console.error('Error deleting test case:', error);
      throw error;
    }
  }

  /**
 * Validate that test case and requirement versions are compatible
 * @param {string} testCaseId - Test case ID
 * @param {string[]} requirementIds - Array of requirement IDs
 * @returns {Object} Validation result with errors and warnings
 */
  validateRequirementTestCaseVersions(testCaseId, requirementIds) {
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      mismatches: []
    };

    if (!requirementIds || requirementIds.length === 0) {
      return validation; // No requirements to validate
    }

    const testCase = this.getTestCase(testCaseId);
    if (!testCase) {
      validation.errors.push(`Test case ${testCaseId} not found`);
      validation.valid = false;
      return validation;
    }

    // Get test case versions (handle both new and legacy format)
    const testVersions = Array.isArray(testCase.applicableVersions)
      ? testCase.applicableVersions
      : (testCase.version ? [testCase.version] : []);

    requirementIds.forEach(reqId => {
      const requirement = this.getRequirement(reqId);

      if (!requirement) {
        validation.errors.push(`Requirement ${reqId} not found`);
        validation.valid = false;
        return;
      }

      const reqVersions = requirement.versions || [];

      // Check version compatibility
      const testHasNoVersions = testVersions.length === 0;
      const reqHasNoVersions = reqVersions.length === 0;
      const hasVersionOverlap = testVersions.some(v => reqVersions.includes(v));

      // Compatibility rules:
      // 1. If test case has no versions = applies to all versions (compatible)
      // 2. If requirement has no versions = applies to all versions (compatible)  
      // 3. If there's at least one version overlap = compatible
      const isCompatible = testHasNoVersions || reqHasNoVersions || hasVersionOverlap;

      if (!isCompatible) {
        const mismatch = {
          testCaseId,
          requirementId: reqId,
          testVersions: [...testVersions],
          reqVersions: [...reqVersions]
        };

        validation.mismatches.push(mismatch);
        validation.errors.push(
          `Version mismatch: Test case ${testCaseId} (versions: ${testVersions.join(', ') || 'all'}) ` +
          `cannot be linked to requirement ${reqId} (versions: ${reqVersions.join(', ') || 'all'})`
        );
        validation.valid = false;
      }
    });

    return validation;
  }



  /**
   * Get version mismatch warnings for a test case
   * @param {string} testCaseId - Test case ID
   * @returns {Array} Array of warning objects
   */
  getVersionMismatchWarnings(testCaseId) {
    const warnings = [];
    const testCase = this.getTestCase(testCaseId);

    if (!testCase || !testCase.requirementIds || testCase.requirementIds.length === 0) {
      return warnings;
    }

    const testVersions = Array.isArray(testCase.applicableVersions)
      ? testCase.applicableVersions
      : (testCase.version ? [testCase.version] : []);

    testCase.requirementIds.forEach(reqId => {
      const requirement = this.getRequirement(reqId);
      if (!requirement) return;

      const reqVersions = requirement.versions || [];

      const testHasNoVersions = testVersions.length === 0;
      const reqHasNoVersions = reqVersions.length === 0;
      const hasVersionOverlap = testVersions.some(v => reqVersions.includes(v));

      if (!testHasNoVersions && !reqHasNoVersions && !hasVersionOverlap) {
        warnings.push({
          type: 'version-mismatch',
          severity: 'warning',
          testCaseId,
          requirementId: reqId,
          message: `Version mismatch: Test case assigned to ${testVersions.join(', ')} but requirement ${reqId} is assigned to ${reqVersions.join(', ')}`,
          testVersions: [...testVersions],
          reqVersions: [...reqVersions],
          suggestion: `Consider updating versions to have at least one common version`
        });
      }
    });

    return warnings;
  }

  /**
   * Get all version mismatches in the system
   * @returns {Array} Array of all version mismatches
   */
  getAllVersionMismatches() {
    const allMismatches = [];

    this._testCases.forEach(testCase => {
      const warnings = this.getVersionMismatchWarnings(testCase.id);
      allMismatches.push(...warnings);
    });

    return allMismatches;
  }
  /**
   * Update test case statuses
   * @param {Array} testCaseIds - Array of test case IDs
   * @param {string} status - New status
   * @returns {Array} Updated test cases
   */


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
  * Create or add a new version
  * @param {Object} version - Version object to add
  * @returns {Promise<Object>} Created version
  */
  async addVersion(version) {
    // Validate required fields
    if (!version.id || !version.name) {
      throw new Error('Version must have id and name');
    }

    // Check if already exists
    if (this._versions.find(v => v.id === version.id)) {
      throw new Error(`Version with ID ${version.id} already exists`);
    }

    // ✅ NEW: Ensure workspace is set
    if (!this._currentWorkspaceId) {
      console.warn('⚠️ No workspace selected, attempting to get from localStorage...');
      const savedWorkspace = localStorage.getItem('currentWorkspace');
      if (savedWorkspace) {
        const workspace = JSON.parse(savedWorkspace);
        this._currentWorkspaceId = workspace.id;
        console.log('✅ Set workspace from localStorage:', workspace.name);
      } else {
        console.error('❌ No workspace available!');
        throw new Error('No workspace selected. Please select a workspace before creating versions.');
      }
    }

    try {
      // Create in database first
      const API_BASE_URL = this._getApiBaseUrl();

      const versionWithWorkspace = {
        ...version,
        workspace_id: this._currentWorkspaceId
      };

      console.log(`📤 Creating version ${version.id} in workspace:`, this._currentWorkspaceId);

      const response = await apiClient.post('/api/versions', versionWithWorkspace);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create version: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Created version ${version.id} in database`, result);
    } catch (error) {
      console.error('❌ Failed to create in database:', error);
      console.warn('⚠️ Continuing with local create only');
    }

    // Add to local array
    this._versions.push(version);

    // Save to localStorage
    this._saveToLocalStorage('versions', this._versions);

    // Notify listeners
    this._notifyListeners();

    return version;
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
  async deleteVersion(versionId) {
    console.log(`🗑️ Deleting version "${versionId}" - checking test case assignments`);

    const index = this._versions.findIndex(v => v.id === versionId);

    if (index === -1) {
      throw new Error(`Version with ID ${versionId} not found`);
    }

    const workspaceId = this.getCurrentWorkspaceId();

    try {
      // Delete from database first
      const response = await apiClient.delete(`/api/versions/${versionId}?workspace_id=${workspaceId}`);
      console.log(`✅ Deleted version ${versionId} from database`, response.data);


    } catch (error) {
      console.error('❌ Failed to delete from database:', error);
      console.warn('⚠️ Continuing with local delete only');
    }

    // Remove from versions array
    const version = this._versions[index];
    this._versions.splice(index, 1);

    // Clean up any references in requirements
    this._requirements.forEach(req => {
      if (req.versions && Array.isArray(req.versions)) {
        req.versions = req.versions.filter(v => v !== versionId);
      }
    });

    // Clean up references in test cases
    this._testCases.forEach(tc => {
      if (tc.applicableVersions && Array.isArray(tc.applicableVersions)) {
        tc.applicableVersions = tc.applicableVersions.filter(v => v !== versionId);
      }
      if (tc.version === versionId) {
        tc.version = '';
      }
    });

    // Save to localStorage
    this._saveToLocalStorage('versions', this._versions);
    this._saveToLocalStorage('requirements', this._requirements);
    this._saveToLocalStorage('testCases', this._testCases);

    // Notify listeners
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
   * Normalizes a requirement object to ensure all properties have proper types
   * @private
   * @param {Object} requirement - The requirement object to normalize
   * @returns {Object} Normalized requirement object
   */
  _normalizeRequirement(requirement) {
    if (!requirement) return null;

    // Clone to avoid modifying the original
    const normalized = { ...requirement };

    // Ensure versions is always an array
    if (normalized.versions !== undefined) {
      if (!Array.isArray(normalized.versions)) {
        // If it's a string, convert to array (unless empty)
        if (typeof normalized.versions === 'string') {
          if (normalized.versions.trim() === '') {
            normalized.versions = [];
          } else {
            // Handle comma-separated values
            if (normalized.versions.includes(',')) {
              normalized.versions = normalized.versions
                .split(',')
                .map(v => v.trim())
                .filter(v => v !== '');
            } else {
              normalized.versions = [normalized.versions];
            }
          }
        } else {
          // If it's neither an array nor a string, set to empty array
          normalized.versions = [];
        }
      }
    } else {
      // If undefined, initialize as empty array
      normalized.versions = [];
    }

    // Normalize tags if present
    if (normalized.tags !== undefined) {
      if (!Array.isArray(normalized.tags)) {
        if (typeof normalized.tags === 'string') {
          if (normalized.tags.trim() === '') {
            normalized.tags = [];
          } else {
            // Handle comma-separated tags
            if (normalized.tags.includes(',')) {
              normalized.tags = normalized.tags
                .split(',')
                .map(t => t.trim())
                .filter(t => t !== '');
            } else {
              normalized.tags = [normalized.tags];
            }
          }
        } else {
          normalized.tags = [];
        }
      }
    } else {
      normalized.tags = [];
    }

    return normalized;
  }

  /**
   * Normalizes an array of requirements
   * @private
   * @param {Array} requirements - Array of requirement objects
   * @returns {Array} Array of normalized requirement objects
   */
  _normalizeRequirements(requirements) {
    if (!Array.isArray(requirements)) return [];
    return requirements.map(req => this._normalizeRequirement(req));
  }
  /**
 * Create or add a new requirement
 * @param {Object} requirement - Requirement object to add
 * @returns {Promise<Object>} Created requirement
 */
  async addRequirement(requirement) {
    if (!requirement.id || !requirement.name) {
      throw new Error('Requirement must have id and name');
    }

    // Get current workspace ID
    const workspaceId = this.getCurrentWorkspaceId();

    try {
      // ✅ Send workspace_id in the body
      const response = await apiClient.post('/api/requirements', {
        ...requirement,
        workspace_id: workspaceId
      });

      if (response.data.success) {
        this._requirements.push(response.data.data);
        this._notifyListeners();
        return response.data.data;
      }
    } catch (error) {
      console.error('Error creating requirement:', error);
      throw error;
    }
  }

  // Optional: You might want to also modify initWithDefaultData to use the normalization
  initWithDefaultData() {
    // Normalize default requirements before setting
    this._requirements = this._normalizeRequirements([...defaultRequirements]);

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
  * Update an existing requirement
  * @param {string} requirementId - ID of requirement to update
  * @param {Object} updates - Fields to update
  * @returns {Promise<Object>} Updated requirement
  */

  async updateRequirement(id, updates) {
    const workspaceId = this.getCurrentWorkspaceId();

    try {
      // ✅ Convert camelCase to snake_case before sending to API
      const apiPayload = {
        ...this._toSnakeCase(updates),
        workspace_id: workspaceId
      };

      console.log('📤 Sending requirement update to API:', apiPayload);

      const response = await apiClient.put(`/api/requirements/${id}`, apiPayload);

      if (response.data.success) {
        // ✅ Fetch fresh data from API
        const getResponse = await apiClient.get(
          `/api/requirements/${id}?workspace_id=${workspaceId}`
        );

        if (getResponse.data.success) {
          const index = this._requirements.findIndex(r => r.id === id);
          if (index !== -1) {
            // ✅ Store the API response
            this._requirements[index] = getResponse.data.data;
            this._notifyListeners();
            console.log('✅ Requirement updated and refreshed from API:', id);
          }
        }
      }
    } catch (error) {
      console.error('Error updating requirement:', error);
      throw error;
    }
  }

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


  // Add these methods to your DataStore.js class
  // Copy and paste each method into your existing DataStore class

  /**
   * Update tags for multiple test cases
   * @param {string[]} testCaseIds - Array of test case IDs to update
   * @param {string[]} tags - Array of tags to add or remove
   * @param {string} action - 'add' or 'remove'
   * @returns {Object} Operation result with success/failure counts
   */
  updateTestCaseTags(testCaseIds, tags, action = 'add') {
    const results = {
      successful: [],
      failed: [],
      skipped: [],
      summary: {
        total: testCaseIds.length,
        tagsAffected: tags.length,
        action: action
      }
    };

    // Validate inputs
    if (!Array.isArray(testCaseIds) || testCaseIds.length === 0) {
      throw new Error('No test cases selected for tag update');
    }

    if (!Array.isArray(tags) || tags.length === 0) {
      throw new Error('No tags specified for update');
    }

    if (!['add', 'remove'].includes(action)) {
      throw new Error('Action must be either "add" or "remove"');
    }

    // Process each test case
    testCaseIds.forEach(testCaseId => {
      try {
        const testCaseIndex = this._testCases.findIndex(tc => tc.id === testCaseId);

        if (testCaseIndex === -1) {
          results.failed.push({
            testCaseId,
            error: 'Test case not found',
            tags: tags
          });
          return;
        }

        const testCase = { ...this._testCases[testCaseIndex] };
        const currentTags = Array.isArray(testCase.tags) ? [...testCase.tags] : [];
        let updatedTags = [...currentTags];
        let hasChanges = false;

        if (action === 'add') {
          // Add tags that don't already exist
          tags.forEach(tag => {
            if (!updatedTags.includes(tag)) {
              updatedTags.push(tag);
              hasChanges = true;
            }
          });
        } else if (action === 'remove') {
          // Remove specified tags
          const initialLength = updatedTags.length;
          updatedTags = updatedTags.filter(tag => !tags.includes(tag));
          hasChanges = updatedTags.length !== initialLength;
        }

        // Skip if no changes needed
        if (!hasChanges) {
          results.skipped.push({
            testCaseId,
            reason: action === 'add' ? 'Tags already exist' : 'Tags not found',
            currentTags,
            requestedTags: tags
          });
          return;
        }

        // Update the test case
        this._testCases[testCaseIndex] = {
          ...testCase,
          tags: updatedTags.sort(), // Keep tags sorted for consistency
          lastModified: new Date().toISOString()
        };

        results.successful.push({
          testCaseId,
          previousTags: currentTags,
          newTags: updatedTags,
          addedTags: action === 'add' ? tags.filter(tag => !currentTags.includes(tag)) : [],
          removedTags: action === 'remove' ? tags.filter(tag => currentTags.includes(tag)) : []
        });

      } catch (error) {
        results.failed.push({
          testCaseId,
          error: error.message,
          tags: tags
        });
      }
    });

    // Save to localStorage if any changes were made
    if (results.successful.length > 0) {
      this._saveToLocalStorage('testCases', this._testCases);
      this._notifyListeners();

      console.log(`✅ Bulk tag ${action} completed: ${results.successful.length} successful, ${results.failed.length} failed, ${results.skipped.length} skipped`);
    }

    return results;
  }

  /**
   * Get all unique tags from test cases
   * @returns {string[]} Array of unique tags sorted alphabetically
   */
  getAllTags() {
    const tags = new Set();
    this._testCases.forEach(tc => {
      if (tc.tags && Array.isArray(tc.tags)) {
        tc.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }

  /**
   * Get tag usage statistics
   * @returns {Array} Array of objects with tag name and usage count
   */
  getTagStats() {
    const tagCounts = {};
    this._testCases.forEach(tc => {
      if (tc.tags && Array.isArray(tc.tags)) {
        tc.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count, percentage: Math.round((count / this._testCases.length) * 100) }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Validate tag operations before execution
   * @param {string[]} testCaseIds - Test case IDs to validate
   * @param {string[]} tags - Tags to validate
   * @param {string} action - 'add' or 'remove'
   * @returns {Object} Validation result with warnings and errors
   */
  validateTagOperation(testCaseIds, tags, action) {
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      summary: {
        total: testCaseIds.length,
        found: 0,
        wouldChange: 0,
        alreadyHaveTags: 0,
        missingTags: 0
      }
    };

    // Validate inputs
    if (!Array.isArray(testCaseIds) || testCaseIds.length === 0) {
      validation.errors.push('No test cases selected');
      validation.valid = false;
      return validation;
    }

    if (!Array.isArray(tags) || tags.length === 0) {
      validation.errors.push('No tags specified');
      validation.valid = false;
      return validation;
    }

    // Validate tag names
    const invalidTags = tags.filter(tag => !tag.trim() || tag.length > 50);
    if (invalidTags.length > 0) {
      validation.errors.push(`Invalid tag names: ${invalidTags.join(', ')}`);
      validation.valid = false;
    }

    // Check each test case
    testCaseIds.forEach(testCaseId => {
      const testCase = this._testCases.find(tc => tc.id === testCaseId);

      if (!testCase) {
        validation.errors.push(`Test case ${testCaseId} not found`);
        return;
      }

      validation.summary.found++;

      const currentTags = Array.isArray(testCase.tags) ? testCase.tags : [];

      if (action === 'add') {
        const newTags = tags.filter(tag => !currentTags.includes(tag));
        if (newTags.length > 0) {
          validation.summary.wouldChange++;
        } else {
          validation.summary.alreadyHaveTags++;
        }
      } else if (action === 'remove') {
        const existingTags = tags.filter(tag => currentTags.includes(tag));
        if (existingTags.length > 0) {
          validation.summary.wouldChange++;
        } else {
          validation.summary.missingTags++;
        }
      }
    });

    // Generate warnings
    if (action === 'add' && validation.summary.alreadyHaveTags > 0) {
      validation.warnings.push(`${validation.summary.alreadyHaveTags} test case(s) already have some of these tags`);
    }

    if (action === 'remove' && validation.summary.missingTags > 0) {
      validation.warnings.push(`${validation.summary.missingTags} test case(s) don't have some of these tags`);
    }

    if (validation.summary.wouldChange === 0) {
      validation.warnings.push('No test cases will be modified by this operation');
    }

    return validation;
  }

  /**
   * Clean up unused tags (remove tags not used by any test case)
   * @returns {Object} Cleanup result with removed tags
   */
  cleanupUnusedTags() {
    const usedTags = new Set();
    const allDefinedTags = new Set();

    // Collect all tags currently in use
    this._testCases.forEach(tc => {
      if (tc.tags && Array.isArray(tc.tags)) {
        tc.tags.forEach(tag => {
          usedTags.add(tag);
          allDefinedTags.add(tag);
        });
      }
    });

    // For this implementation, we don't store tags separately from test cases,
    // so this method primarily serves to validate tag consistency
    const result = {
      totalTags: allDefinedTags.size,
      usedTags: usedTags.size,
      removedTags: [],
      message: `All ${usedTags.size} tags are currently in use`
    };

    console.log('Tag cleanup completed:', result);
    return result;
  }
}

// Create singleton instance
const dataStore = new DataStoreService();

export default dataStore;

import defaultRequirements from '../data/requirements';
import defaultTestCases from '../data/testcases';
import defaultMapping from '../data/mapping';

/**
 * Simple in-memory data store service
 * In a real application, this would be replaced with API calls to a backend
 */
class DataStoreService {
  constructor() {
    // Initialize with empty data instead of default data
    this._requirements = [];
    this._testCases = [];
    this._mapping = {};
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
   * Get requirement-test mapping
   * @returns {Object} Mapping between requirements and test cases
   */
  getMapping() {
    return { ...this._mapping };
  }

  /**
   * Set requirements data
   * @param {Array} requirementsData - New requirements data to set
   * @returns {Array} Processed requirements data
   */
  setRequirements(requirementsData) {
    if (!Array.isArray(requirementsData)) {
      throw new Error('Requirements data must be an array');
    }
    
    // Process requirements to ensure calculated fields
    const processedRequirements = this.processRequirements(requirementsData);
    
    // Update requirements
    this._requirements = [...processedRequirements];
    
    // Clean up mappings for requirements that no longer exist
    const existingReqIds = new Set(processedRequirements.map(req => req.id));
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
   * Update a single requirement
   * @param {string} reqId - ID of the requirement to update
   * @param {Object} updatedData - Updated requirement data
   * @returns {Object} Updated requirement
   */
  updateRequirement(reqId, updatedData) {
    const index = this._requirements.findIndex(req => req.id === reqId);
    
    if (index === -1) {
      throw new Error(`Requirement with ID ${reqId} not found`);
    }
    
    // Process the updated requirement to ensure calculated fields
    const processed = this.processRequirements([updatedData])[0];
    
    // Update the requirement
    this._requirements[index] = processed;
    
    // Notify listeners of data change
    this._notifyListeners();
    
    return this._requirements[index];
  }
  
  /**
   * Add a new requirement
   * @param {Object} requirementData - New requirement data
   * @returns {Object} Added requirement
   */
  addRequirement(requirementData) {
    // Validate required fields
    if (!requirementData.id || !requirementData.name) {
      throw new Error('Requirement must include id and name');
    }
    
    // Check for duplicate ID
    if (this._requirements.some(req => req.id === requirementData.id)) {
      throw new Error(`Requirement with ID ${requirementData.id} already exists`);
    }
    
    // Process the new requirement to ensure calculated fields
    const processed = this.processRequirements([requirementData])[0];
    
    // Add the requirement
    this._requirements.push(processed);
    
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
    
    // Notify listeners of data change
    this._notifyListeners();
    
    return true;
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
    this._hasInitializedData = false;
    this._notifyListeners();
  }
}

// Create singleton instance
const dataStore = new DataStoreService();

export default dataStore;
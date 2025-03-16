import defaultRequirements from '../data/requirements';

/**
 * Simple in-memory data store service
 * In a real application, this would be replaced with API calls to a backend
 */
class DataStoreService {
  constructor() {
    // Initialize with default data
    this._requirements = [...defaultRequirements];
    this._listeners = [];
  }

  /**
   * Get all requirements
   * @returns {Array} Array of requirement objects
   */
  getRequirements() {
    return [...this._requirements];
  }

  /**
   * Set requirements data
   * @param {Array} requirementsData - New requirements data to set
   */
  setRequirements(requirementsData) {
    if (!Array.isArray(requirementsData)) {
      throw new Error('Requirements data must be an array');
    }
    
    this._requirements = [...requirementsData];
    
    // Notify listeners of data change
    this._notifyListeners();
    
    return this._requirements;
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
}

// Create singleton instance
const dataStore = new DataStoreService();

export default dataStore;
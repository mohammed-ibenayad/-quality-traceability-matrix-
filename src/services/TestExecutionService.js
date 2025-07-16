// src/services/TestExecutionService.js
// Clean, focused service for processing test results with frontend parsing

import errorParserService from './ErrorParserService';

class TestExecutionService {
  constructor() {
    this.executions = new Map(); // Track active executions
    this.callbacks = new Map(); // Progress callbacks
    this.stats = new Map(); // Parsing statistics
  }

  /**
   * Process test results from simplified workflow
   * @param {Object} webhookData - Webhook data with raw output
   * @returns {Object} Enhanced results with parsed failures
   */
  async processResults(webhookData) {
    if (!webhookData?.results?.length) {
      throw new Error('Invalid webhook data');
    }

    const results = [];
    let parsed = 0;
    let attempted = 0;

    for (const test of webhookData.results) {
      const enhanced = await this.enhanceResult(test);
      results.push(enhanced);

      if (test.status === 'Failed') {
        attempted++;
        if (enhanced.failure?.parsingConfidence !== 'none') {
          parsed++;
        }
      }
    }

    // Track parsing stats
    const stats = {
      attempted,
      parsed,
      successRate: attempted > 0 ? (parsed / attempted) * 100 : 0
    };

    this.stats.set(webhookData.requestId, stats);

    return {
      ...webhookData,
      results,
      parsingStats: stats,
      processedAt: new Date().toISOString()
    };
  }

  /**
   * Enhance single test result with error parsing
   * @param {Object} test - Test result
   * @returns {Object} Enhanced test result
   */
  async enhanceResult(test) {
    const enhanced = {
      id: test.id,
      name: test.name || `Test ${test.id}`,
      status: test.status,
      duration: test.duration || 0,
      logs: test.logs || '',
      rawOutput: test.rawOutput || '',
      processedAt: new Date().toISOString()
    };

    // Parse failures for failed tests with raw output
    if (test.status === 'Failed' && test.rawOutput) {
      try {
        const failure = errorParserService.parseError(test.rawOutput, test.id);
        
        if (failure && failure.parsingConfidence !== 'low') {
          enhanced.failure = failure;
        } else {
          enhanced.failure = this.createSimpleFailure(test);
        }
      } catch (error) {
        console.error(`Parse error for ${test.id}:`, error.message);
        enhanced.failure = this.createSimpleFailure(test);
      }
    } else if (test.status === 'Failed') {
      enhanced.failure = this.createSimpleFailure(test);
    }

    return enhanced;
  }

  /**
   * Create simple failure object when parsing fails
   * @param {Object} test - Test result
   * @returns {Object} Simple failure object
   */
  createSimpleFailure(test) {
    return {
      type: 'TestFailure',
      file: '',
      line: 0,
      method: '',
      class: '',
      rawError: (test.rawOutput || test.logs || '').substring(0, 500),
      assertion: { available: false, expected: '', actual: '', operator: '' },
      parsingConfidence: 'none'
    };
  }

  /**
   * Process progressive update (single test)
   * @param {Object} webhookData - Single test webhook
   * @param {string} executionId - Execution ID
   * @returns {Object} Processed result
   */
  async processUpdate(webhookData, executionId) {
    if (!webhookData.results || webhookData.results.length !== 1) {
      throw new Error('Update should contain exactly one test');
    }

    const test = webhookData.results[0];
    
    // Get or create execution
    if (!this.executions.has(executionId)) {
      this.executions.set(executionId, {
        startTime: Date.now(),
        tests: new Map(),
        completed: 0
      });
    }

    const execution = this.executions.get(executionId);
    
    // For final statuses, enhance with parsing
    if (['Passed', 'Failed', 'Not Found'].includes(test.status)) {
      const enhanced = await this.enhanceResult(test);
      execution.tests.set(test.id, enhanced);
      execution.completed++;

      // Notify callbacks
      this.notifyCallbacks(executionId, enhanced);
      
      return enhanced;
    } else {
      // For intermediate statuses, store as-is
      execution.tests.set(test.id, test);
      return test;
    }
  }

  /**
   * Register progress callback
   * @param {string} executionId - Execution ID
   * @param {Function} callback - Callback function
   */
  onProgress(executionId, callback) {
    if (!this.callbacks.has(executionId)) {
      this.callbacks.set(executionId, []);
    }
    this.callbacks.get(executionId).push(callback);
  }

  /**
   * Notify progress callbacks
   * @param {string} executionId - Execution ID
   * @param {Object} result - Test result
   */
  notifyCallbacks(executionId, result) {
    const callbacks = this.callbacks.get(executionId) || [];
    callbacks.forEach(callback => {
      try {
        callback(result);
      } catch (error) {
        console.error('Callback error:', error);
      }
    });
  }

  /**
   * Get execution summary
   * @param {string} executionId - Execution ID
   * @returns {Object} Summary
   */
  getSummary(executionId) {
    const execution = this.executions.get(executionId);
    if (!execution) return null;

    const tests = Array.from(execution.tests.values());
    const statusCounts = {
      'Not Started': 0,
      'Running': 0,
      'Passed': 0,
      'Failed': 0,
      'Not Found': 0
    };

    tests.forEach(test => {
      statusCounts[test.status]++;
    });

    return {
      executionId,
      duration: Date.now() - execution.startTime,
      totalTests: tests.length,
      completed: execution.completed,
      statusCounts,
      failedTests: tests.filter(t => t.status === 'Failed').length,
      parsedFailures: tests.filter(t => t.failure?.parsingConfidence !== 'none').length
    };
  }

  /**
   * Get parsing statistics
   * @returns {Object} Global parsing stats
   */
  getParsingStats() {
    const stats = Array.from(this.stats.values());
    if (stats.length === 0) {
      return { executions: 0, totalAttempted: 0, totalParsed: 0, averageRate: 0 };
    }

    const totalAttempted = stats.reduce((sum, s) => sum + s.attempted, 0);
    const totalParsed = stats.reduce((sum, s) => sum + s.parsed, 0);
    const averageRate = stats.reduce((sum, s) => sum + s.successRate, 0) / stats.length;

    return {
      executions: stats.length,
      totalAttempted,
      totalParsed,
      overallRate: totalAttempted > 0 ? (totalParsed / totalAttempted) * 100 : 0,
      averageRate
    };
  }

  /**
   * Clean up old executions
   * @param {number} maxAge - Max age in milliseconds
   */
  cleanup(maxAge = 3600000) { // 1 hour default
    const now = Date.now();
    
    for (const [id, execution] of this.executions.entries()) {
      if (now - execution.startTime > maxAge) {
        this.executions.delete(id);
        this.callbacks.delete(id);
      }
    }
  }

  /**
   * Test the service with sample data
   * @param {Array} samples - Sample webhook data
   */
  async test(samples) {
    console.log('🧪 Testing TestExecutionService...');
    
    for (const [index, sample] of samples.entries()) {
      try {
        const result = await this.processResults(sample);
        console.log(`✅ Sample ${index + 1}:`, {
          results: result.results.length,
          parsed: result.results.filter(r => r.failure).length,
          rate: `${result.parsingStats.successRate.toFixed(1)}%`
        });
      } catch (error) {
        console.log(`❌ Sample ${index + 1} failed:`, error.message);
      }
    }
  }
}

// Export singleton instance
export default new TestExecutionService();
// src/services/ErrorParserService.js
// Phase 1: Generic, deterministic error parsing - framework agnostic

class ErrorParserService {
  constructor() {
    // Generic patterns that work across frameworks/languages
    this.patterns = {
      // File location patterns (language agnostic)
      filePath: [
        // Standard format: /path/to/file.ext:line:column
        /([^\s:]+\.(py|js|java|cs|rb|php|go|ts|jsx|tsx)):(\d+)(?::(\d+))?/g,
        // Windows format: C:\path\to\file.ext:line
        /([A-Z]:\\[^\s:]+\.(py|js|java|cs|rb|php|go|ts|jsx|tsx)):(\d+)/g,
        // Quoted format: "path/to/file.ext", line number
        /"([^\s"]+\.(py|js|java|cs|rb|php|go|ts|jsx|tsx))",?\s*line\s*(\d+)/gi
      ],

      // Generic exception patterns (don't assume framework)
      exception: [
        // ClassName.ExceptionName or just ExceptionName
        /([A-Z][a-zA-Z0-9]*\.)?([A-Z][a-zA-Z0-9]*(?:Exception|Error))/g,
        // Error: message format
        /^([A-Z][a-zA-Z0-9]*(?:Exception|Error)):\s*(.+)$/gm
      ],

      // Method/function patterns (language agnostic)
      method: [
        // function_name() or method_name()
        /(?:function|def|public|private|static)?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
        // in function_name format
        /\bin\s+([a-zA-Z_][a-zA-Z0-9_]*)\b/g
      ],

      // Class patterns (language agnostic)
      class: [
        // class ClassName format
        /class\s+([A-Z][a-zA-Z0-9_]*)/g,
        // ClassName.method format
        /([A-Z][a-zA-Z0-9_]*)\.[a-zA-Z_][a-zA-Z0-9_]*/g
      ],

      // Generic assertion patterns (framework agnostic)
      assertion: [
        // expected/actual patterns
        /(?:expected|Expected):\s*(.+?)(?:\n|$)/gi,
        /(?:actual|Actual):\s*(.+?)(?:\n|$)/gi,
        /(?:got|received):\s*(.+?)(?:\n|but|$)/gi,
        // comparison operators
        /(.*?)\s*(==|!=|<=|>=|<|>|\bis\b|\bin\b)\s*(.*?)(?:\n|$)/g
      ]
    };
  }

  /**
   * Main parsing function - only extracts what can be determined reliably
   * @param {string} rawError - Raw error output from test execution
   * @param {string} testId - Test case ID for context
   * @returns {Object|null} Structured failure object or null if parsing not reliable
   */
  parseError(rawError, testId = '') {
    if (!rawError || rawError.trim() === '') {
      return null;
    }

    console.log(`🔍 Attempting generic parsing for test ${testId}`);

    // Try to extract reliable information
    const extractedInfo = {
      locations: this.extractFileLocations(rawError),
      exceptions: this.extractExceptions(rawError),
      methods: this.extractMethods(rawError),
      classes: this.extractClasses(rawError),
      assertions: this.extractAssertions(rawError)
    };

    // Only create failure object if we found something reliable
    if (this.hasReliableInformation(extractedInfo)) {
      const failure = this.buildFailureObject(extractedInfo, rawError);
      console.log('✅ Successfully extracted reliable information:', failure);
      return failure;
    }

    console.log('⚠️ No reliable information could be extracted deterministically');
    return null;
  }

  /**
   * Extract file locations using deterministic patterns
   */
  extractFileLocations(rawError) {
    const locations = [];
    
    for (const pattern of this.patterns.filePath) {
      let match;
      pattern.lastIndex = 0; // Reset regex state
      
      while ((match = pattern.exec(rawError)) !== null) {
        locations.push({
          file: match[1],
          extension: match[2],
          line: parseInt(match[3]),
          column: match[4] ? parseInt(match[4]) : null,
          confidence: 'high' // These patterns are very reliable
        });
      }
    }

    // Remove duplicates and sort by confidence
    return this.deduplicateLocations(locations);
  }

  /**
   * Extract exception types using deterministic patterns
   */
  extractExceptions(rawError) {
    const exceptions = [];
    
    for (const pattern of this.patterns.exception) {
      let match;
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(rawError)) !== null) {
        const fullName = match[0];
        const namespace = match[1];
        const exceptionName = match[2] || match[1]; // Handle both formats
        
        exceptions.push({
          name: exceptionName,
          fullName: fullName,
          namespace: namespace ? namespace.replace('.', '') : null,
          message: match[3] || null,
          confidence: this.assessExceptionConfidence(exceptionName)
        });
      }
    }

    return this.deduplicateExceptions(exceptions);
  }

  /**
   * Extract method names using deterministic patterns
   */
  extractMethods(rawError) {
    const methods = [];
    
    for (const pattern of this.patterns.method) {
      let match;
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(rawError)) !== null) {
        const methodName = match[1];
        
        // Only include if it looks like a reasonable method name
        if (this.isValidMethodName(methodName)) {
          methods.push({
            name: methodName,
            confidence: this.assessMethodConfidence(methodName, rawError)
          });
        }
      }
    }

    return this.deduplicateMethods(methods);
  }

  /**
   * Extract class names using deterministic patterns
   */
  extractClasses(rawError) {
    const classes = [];
    
    for (const pattern of this.patterns.class) {
      let match;
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(rawError)) !== null) {
        const className = match[1];
        
        // Only include if it looks like a reasonable class name
        if (this.isValidClassName(className)) {
          classes.push({
            name: className,
            confidence: this.assessClassConfidence(className, rawError)
          });
        }
      }
    }

    return this.deduplicateClasses(classes);
  }

  /**
   * Extract assertion information using deterministic patterns
   */
  extractAssertions(rawError) {
    const assertions = {
      expected: [],
      actual: [],
      comparisons: []
    };

    // Extract expected/actual values
    for (const pattern of this.patterns.assertion) {
      let match;
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(rawError)) !== null) {
        const fullMatch = match[0].toLowerCase();
        
        if (fullMatch.includes('expected')) {
          assertions.expected.push({
            value: match[1]?.trim(),
            confidence: 'medium'
          });
        } else if (fullMatch.includes('actual') || fullMatch.includes('got') || fullMatch.includes('received')) {
          assertions.actual.push({
            value: match[1]?.trim(),
            confidence: 'medium'
          });
        } else if (match[2]) { // Comparison operator found
          assertions.comparisons.push({
            left: match[1]?.trim(),
            operator: match[2]?.trim(),
            right: match[3]?.trim(),
            confidence: 'medium'
          });
        }
      }
    }

    return assertions;
  }

  /**
   * Check if extracted information is reliable enough for parsing
   */
  hasReliableInformation(extractedInfo) {
    // At minimum, we need high-confidence file location OR high-confidence exception
    const hasReliableLocation = extractedInfo.locations.some(loc => loc.confidence === 'high');
    const hasReliableException = extractedInfo.exceptions.some(exc => exc.confidence === 'high');
    
    return hasReliableLocation || hasReliableException;
  }

  /**
   * Build failure object from extracted information
   */
  buildFailureObject(extractedInfo, rawError) {
    // Use most confident/first found information
    const bestLocation = extractedInfo.locations[0];
    const bestException = extractedInfo.exceptions[0];
    const bestMethod = extractedInfo.methods.find(m => m.confidence === 'high') || extractedInfo.methods[0];
    const bestClass = extractedInfo.classes.find(c => c.confidence === 'high') || extractedInfo.classes[0];

    const failure = {
      type: bestException?.name || 'UnknownError',
      file: bestLocation?.file || '',
      line: bestLocation?.line || 0,
      column: bestLocation?.column || null,
      method: bestMethod?.name || '',
      class: bestClass?.name || '',
      rawError: this.sanitizeRawError(rawError),
      extracted: {
        locations: extractedInfo.locations,
        exceptions: extractedInfo.exceptions,
        methods: extractedInfo.methods,
        classes: extractedInfo.classes,
        assertions: extractedInfo.assertions
      },
      parsingConfidence: this.calculateOverallConfidence(extractedInfo)
    };

    // Only include assertion details if we have both expected and actual
    if (extractedInfo.assertions.expected.length > 0 && extractedInfo.assertions.actual.length > 0) {
      failure.assertion = {
        available: true,
        expected: extractedInfo.assertions.expected[0]?.value || '',
        actual: extractedInfo.assertions.actual[0]?.value || '',
        operator: extractedInfo.assertions.comparisons[0]?.operator || '=='
      };
    } else if (extractedInfo.assertions.comparisons.length > 0) {
      const comparison = extractedInfo.assertions.comparisons[0];
      failure.assertion = {
        available: true,
        expected: comparison.right,
        actual: comparison.left,
        operator: comparison.operator
      };
    } else {
      failure.assertion = {
        available: false,
        expected: '',
        actual: '',
        operator: ''
      };
    }

    return failure;
  }

  /**
   * Assess confidence levels for different extractions
   */
  assessExceptionConfidence(exceptionName) {
    // Common, well-known exception names get high confidence
    const wellKnownExceptions = [
      'Exception', 'Error', 'RuntimeException', 'RuntimeError',
      'AssertionError', 'ValueError', 'TypeError', 'KeyError',
      'IndexError', 'AttributeError', 'NameError', 'SyntaxError',
      'ImportError', 'ModuleNotFoundError', 'FileNotFoundError',
      'PermissionError', 'TimeoutError', 'ConnectionError',
      'HttpError', 'NetworkError', 'DatabaseError'
    ];
    
    if (wellKnownExceptions.includes(exceptionName)) {
      return 'high';
    }
    
    // Ends with Exception or Error
    if (exceptionName.endsWith('Exception') || exceptionName.endsWith('Error')) {
      return 'medium';
    }
    
    return 'low';
  }

  assessMethodConfidence(methodName, rawError) {
    // Test methods are high confidence
    if (methodName.startsWith('test_') || methodName.startsWith('Test')) {
      return 'high';
    }
    
    // If method appears multiple times, higher confidence
    const occurrences = (rawError.match(new RegExp(methodName, 'g')) || []).length;
    if (occurrences >= 2) {
      return 'medium';
    }
    
    return 'low';
  }

  assessClassConfidence(className, rawError) {
    // Test classes are high confidence
    if (className.startsWith('Test') || className.includes('Test')) {
      return 'high';
    }
    
    // If class appears in context of test or error, medium confidence
    if (rawError.includes(`class ${className}`) || rawError.includes(`${className}.`)) {
      return 'medium';
    }
    
    return 'low';
  }

  calculateOverallConfidence(extractedInfo) {
    let score = 0;
    let maxScore = 0;

    // Location confidence (max 3 points)
    maxScore += 3;
    const highConfidenceLocations = extractedInfo.locations.filter(l => l.confidence === 'high').length;
    score += Math.min(highConfidenceLocations * 3, 3);

    // Exception confidence (max 2 points)
    maxScore += 2;
    const highConfidenceExceptions = extractedInfo.exceptions.filter(e => e.confidence === 'high').length;
    score += Math.min(highConfidenceExceptions * 2, 2);

    // Method confidence (max 1 point)
    maxScore += 1;
    const highConfidenceMethods = extractedInfo.methods.filter(m => m.confidence === 'high').length;
    score += Math.min(highConfidenceMethods * 1, 1);

    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    
    if (percentage >= 80) return 'high';
    if (percentage >= 50) return 'medium';
    return 'low';
  }

  /**
   * Validation methods
   */
  isValidMethodName(name) {
    // Basic validation - starts with letter/underscore, contains only alphanumeric/underscore
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name) && name.length > 1 && name.length < 100;
  }

  isValidClassName(name) {
    // Class names typically start with uppercase
    return /^[A-Z][a-zA-Z0-9_]*$/.test(name) && name.length > 1 && name.length < 100;
  }

  /**
   * Deduplication methods
   */
  deduplicateLocations(locations) {
    const seen = new Set();
    return locations.filter(loc => {
      const key = `${loc.file}:${loc.line}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => {
      // Sort by confidence, then by line number
      if (a.confidence !== b.confidence) {
        return a.confidence === 'high' ? -1 : 1;
      }
      return a.line - b.line;
    });
  }

  deduplicateExceptions(exceptions) {
    const seen = new Set();
    return exceptions.filter(exc => {
      if (seen.has(exc.name)) return false;
      seen.add(exc.name);
      return true;
    }).sort((a, b) => {
      // Sort by confidence
      if (a.confidence !== b.confidence) {
        return a.confidence === 'high' ? -1 : 1;
      }
      return 0;
    });
  }

  deduplicateMethods(methods) {
    const seen = new Set();
    return methods.filter(method => {
      if (seen.has(method.name)) return false;
      seen.add(method.name);
      return true;
    }).sort((a, b) => {
      if (a.confidence !== b.confidence) {
        return a.confidence === 'high' ? -1 : 1;
      }
      return 0;
    });
  }

  deduplicateClasses(classes) {
    const seen = new Set();
    return classes.filter(cls => {
      if (seen.has(cls.name)) return false;
      seen.add(cls.name);
      return true;
    }).sort((a, b) => {
      if (a.confidence !== b.confidence) {
        return a.confidence === 'high' ? -1 : 1;
      }
      return 0;
    });
  }

  /**
   * Sanitize raw error for safe display and transmission
   */
  sanitizeRawError(rawError) {
    if (!rawError) return '';

    return rawError
      .split('\n')
      .slice(0, 20) // Limit to first 20 lines
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n')
      .substring(0, 2000) // Limit to 2000 characters
      .replace(/"/g, '\\"'); // Escape quotes for JSON safety
  }

  /**
   * Simple failure object for cases where parsing isn't reliable
   */
  createSimpleFailure(testId, status, rawError = '') {
    if (status === 'Passed' || status === 'Not Found' || status === 'Not Started' || status === 'Running') {
      return null;
    }

    return {
      type: 'TestFailure',
      file: '',
      line: 0,
      column: null,
      method: '',
      class: '',
      rawError: this.sanitizeRawError(rawError),
      assertion: {
        available: false,
        expected: '',
        actual: '',
        operator: ''
      },
      parsingConfidence: 'none',
      extracted: {
        locations: [],
        exceptions: [],
        methods: [],
        classes: [],
        assertions: { expected: [], actual: [], comparisons: [] }
      }
    };
  }

  /**
   * Test the parser with sample data (for development/debugging)
   */
  testParser(sampleErrors) {
    console.log('🧪 Testing generic error parser...');
    
    sampleErrors.forEach((errorText, index) => {
      console.log(`\n--- Test ${index + 1} ---`);
      console.log('Input:', errorText.substring(0, 100) + '...');
      
      const result = this.parseError(errorText, `test_${index + 1}`);
      
      if (result) {
        console.log('✅ Parsed successfully');
        console.log('- Type:', result.type);
        console.log('- File:', result.file);
        console.log('- Line:', result.line);
        console.log('- Confidence:', result.parsingConfidence);
      } else {
        console.log('❌ No reliable parsing possible');
      }
    });
  }
}

// Export as singleton
const errorParserService = new ErrorParserService();
export default errorParserService;
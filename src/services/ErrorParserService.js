// src/services/ErrorParserService.js
// Enhanced error parsing service with JUnit XML integration and improved fallback parsing

class ErrorParserService {
  constructor() {
    // Enhanced patterns for better detection across frameworks
    this.patterns = {
      // File location patterns (improved for more frameworks)
      filePath: [
        // Standard format: /path/to/file.ext:line:column
        /([^\s:]+\.(py|js|java|cs|rb|php|go|ts|jsx|tsx|spec\.js|test\.js)):(\d+)(?::(\d+))?/g,
        // Windows format: C:\path\to\file.ext:line
        /([A-Z]:\\[^\s:]+\.(py|js|java|cs|rb|php|go|ts|jsx|tsx)):(\d+)/g,
        // Quoted format: "path/to/file.ext", line number
        /"([^\s"]+\.(py|js|java|cs|rb|php|go|ts|jsx|tsx))",?\s*line\s*(\d+)/gi,
        // pytest format: path/to/file.py::test_function FAILED
        /([^\s:]+\.py)::([^\s:]+)\s+(?:FAILED|ERROR)/g,
        // at format (JavaScript/Node.js): at method (file:line:column)
        /at\s+[^\(]*\(([^\:]+):(\d+):(\d+)\)/g
      ],

      // Enhanced exception patterns for more frameworks
      exception: [
        // Python exceptions: ExceptionType or module.ExceptionType
        /([a-zA-Z0-9_.]*\.)?([A-Z][a-zA-Z0-9]*(?:Exception|Error))\b/g,
        // JavaScript/Node.js errors
        /(Reference|Type|Syntax|Range|URI|Eval|Internal|Aggregate)Error\b/g,
        // Java exceptions
        /([a-zA-Z0-9_.]*\.)?([A-Z][a-zA-Z0-9]*(?:Exception|Error))/g,
        // Generic Error: message format
        /^([A-Z][a-zA-Z0-9]*(?:Exception|Error)):\s*(.+)$/gm,
        // Selenium/WebDriver specific
        /(ElementNotInteractableException|NoSuchElementException|TimeoutException|WebDriverException|StaleElementReferenceException)/g
      ],

      // Enhanced method/function patterns
      method: [
        // Python: def method_name or async def method_name
        /(?:def|async\s+def)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
        // JavaScript: function methodName or methodName = function
        /(?:function\s+([a-zA-Z_][a-zA-Z0-9_]*)|([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*function)/g,
        // Method calls: object.method() or just method()
        /([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
        // in method_name format (from stack traces)
        /\bin\s+([a-zA-Z_][a-zA-Z0-9_]*)\b/g,
        // test method patterns: test_something or testSomething
        /(test_[a-zA-Z_][a-zA-Z0-9_]*|test[A-Z][a-zA-Z0-9]*)/g
      ],

      // Enhanced class patterns
      class: [
        // Python class definitions
        /class\s+([A-Z][a-zA-Z0-9_]*)/g,
        // Java/C# class references
        /([A-Z][a-zA-Z0-9_]*)\.[a-zA-Z_][a-zA-Z0-9_]*/g,
        // Test class patterns
        /(Test[A-Z][a-zA-Z0-9]*|[A-Z][a-zA-Z0-9]*Test)/g
      ],

      // Enhanced assertion patterns for different frameworks
      assertion: [
        // Python assert patterns
        /assert\s+(.+?)\s*(==|!=|<=|>=|<|>|is|is\s+not|in|not\s+in)\s*(.+?)(?:\n|$)/gi,
        // Expected/actual patterns (pytest, unittest)
        /(?:expected|Expected):\s*(.+?)(?:\n|$)/gi,
        /(?:actual|Actual|but\s+(?:was|got)):\s*(.+?)(?:\n|$)/gi,
        // AssertionError messages
        /AssertionError:\s*(.+?)(?:\n|$)/gi,
        // Comparison failures: "X != Y" or "X == Y"
        /['"]([^'"]*)['"]\s*(==|!=|<=|>=|<|>)\s*['"]([^'"]*)['"]/g,
        // Number comparisons: 5 != 10
        /(\d+(?:\.\d+)?)\s*(==|!=|<=|>=|<|>)\s*(\d+(?:\.\d+)?)/g,
        // Boolean assertions: True != False
        /(True|False|true|false|null|None|undefined)\s*(==|!=|is|is\s+not)\s*(True|False|true|false|null|None|undefined)/gi
      ],

      // Framework-specific patterns
      pytest: [
        // pytest assertion introspection
        />?\s*assert\s+(.+)$/gm,
        // pytest where clause
        /where\s+(.+?)\s*=/g,
        // pytest comparison output
        /E\s+assert\s+(.+?)$/gm
      ],

      selenium: [
        // Selenium element locators
        /(?:By\.(?:ID|CLASS_NAME|TAG_NAME|NAME|LINK_TEXT|PARTIAL_LINK_TEXT|CSS_SELECTOR|XPATH))\(['"](.*?)['"]\)/g,
        // Element not found messages
        /(?:Unable to locate element|no such element).*?['"]([^'"]*)['"]/gi,
        // Timeout messages
        /(?:timeout|timed out).*?(\d+)\s*(?:second|sec|ms)/gi
      ]
    };
  }

  /**
   * ✅ ENHANCED: Main parsing function with JUnit XML priority
   * @param {string} rawError - Raw error output from test execution
   * @param {string} testId - Test case ID for context
   * @param {Object} options - Additional parsing options
   * @returns {Object|null} Structured failure object or null if parsing not reliable
   */
  parseError(rawError, testId = '', options = {}) {
    if (!rawError || rawError.trim() === '') {
      return null;
    }

    console.log(`🔍 Enhanced parsing for test ${testId} (${rawError.length} chars)`);

    // Detect framework for specialized parsing
    const framework = this.detectFramework(rawError);
    console.log(`🔧 Detected framework: ${framework}`);

    // Extract comprehensive information
    const extractedInfo = {
      framework,
      locations: this.extractFileLocations(rawError),
      exceptions: this.extractExceptions(rawError),
      methods: this.extractMethods(rawError),
      classes: this.extractClasses(rawError),
      assertions: this.extractAssertions(rawError, framework),
      selenium: framework === 'selenium' ? this.extractSeleniumInfo(rawError) : null
    };

    // ✅ Enhanced reliability check - more permissive for better coverage
    if (this.hasUsefulInformation(extractedInfo)) {
      const failure = this.buildEnhancedFailureObject(extractedInfo, rawError, testId);
      console.log(`✅ Enhanced parsing successful for ${testId}: ${failure.parsingConfidence} confidence`);
      return failure;
    }

    console.log(`⚠️ Insufficient information for reliable parsing of ${testId}`);
    return null;
  }

  /**
   * ✅ ENHANCED: Detect test framework from error output
   */
  detectFramework(rawError) {
    const frameworks = {
      pytest: [
        /===+\s*FAILURES\s*===+/,
        /===+\s*ERROR/,
        /_.*\.py:\d+: AssertionError/,
        /pytest/i,
        /conftest\.py/,
        /@pytest\./
      ],
      selenium: [
        /selenium/i,
        /webdriver/i,
        /ElementNotInteractableException/,
        /NoSuchElementException/,
        /TimeoutException/,
        /StaleElementReferenceException/,
        /By\./
      ],
      javascript: [
        /Error: /,
        /at .*\.js:\d+:\d+/,
        /node_modules/,
        /TypeError:/,
        /ReferenceError:/
      ],
      java: [
        /java\./,
        /Exception in thread/,
        /at .*\.java:\d+/,
        /junit/i,
        /testng/i
      ]
    };

    for (const [name, patterns] of Object.entries(frameworks)) {
      if (patterns.some(pattern => pattern.test(rawError))) {
        return name;
      }
    }

    return 'generic';
  }

  /**
   * ✅ ENHANCED: Extract file locations with improved patterns
   */
  extractFileLocations(rawError) {
    const locations = [];
    
    for (const pattern of this.patterns.filePath) {
      let match;
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(rawError)) !== null) {
        // Determine confidence based on pattern specificity
        let confidence = 'medium';
        if (match[3] && parseInt(match[3]) > 0) { // Has line number
          confidence = 'high';
        }
        if (match[4] && parseInt(match[4]) > 0) { // Has column number
          confidence = 'high';
        }

        locations.push({
          file: match[1],
          extension: match[2] || this.getFileExtension(match[1]),
          line: parseInt(match[3]) || 0,
          column: match[4] ? parseInt(match[4]) : null,
          confidence
        });
      }
    }

    return this.deduplicateLocations(locations);
  }

  /**
   * ✅ ENHANCED: Extract assertions with framework-specific handling
   */
  extractAssertions(rawError, framework = 'generic') {
    const assertions = {
      expected: [],
      actual: [],
      comparisons: [],
      expressions: []
    };

    // Framework-specific assertion extraction
    if (framework === 'pytest') {
      this.extractPytestAssertions(rawError, assertions);
    }

    // Generic assertion patterns
    for (const pattern of this.patterns.assertion) {
      let match;
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(rawError)) !== null) {
        const fullMatch = match[0].toLowerCase();
        
        if (fullMatch.includes('expected')) {
          assertions.expected.push({
            value: this.cleanAssertionValue(match[1]),
            confidence: 'high'
          });
        } else if (fullMatch.includes('actual') || fullMatch.includes('got') || fullMatch.includes('but was')) {
          assertions.actual.push({
            value: this.cleanAssertionValue(match[1]),
            confidence: 'high'
          });
        } else if (match[2]) { // Comparison operator found
          assertions.comparisons.push({
            left: this.cleanAssertionValue(match[1]),
            operator: match[2].trim(),
            right: this.cleanAssertionValue(match[3]),
            confidence: 'high',
            expression: match[0].trim()
          });
        } else if (fullMatch.includes('assert')) {
          assertions.expressions.push({
            expression: match[1] || match[0],
            confidence: 'medium'
          });
        }
      }
    }

    return assertions;
  }

  /**
   * ✅ NEW: Extract pytest-specific assertion information
   */
  extractPytestAssertions(rawError, assertions) {
    // pytest introspection patterns
    const pytestPatterns = [
      // assert statement with comparison
      /assert\s+(.+?)\s*(==|!=|<=|>=|<|>|is|is\s+not|in|not\s+in)\s*(.+)/gi,
      // pytest where clause (shows variable values)
      /where\s+(.+?)\s*=\s*(.+)/g,
      // E assert lines (pytest error output)
      /E\s+assert\s+(.+)/g
    ];

    for (const pattern of pytestPatterns) {
      let match;
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(rawError)) !== null) {
        if (match[2]) { // Has operator
          assertions.comparisons.push({
            left: this.cleanAssertionValue(match[1]),
            operator: match[2].trim(),
            right: this.cleanAssertionValue(match[3]),
            confidence: 'high',
            expression: match[0].trim(),
            framework: 'pytest'
          });
        } else {
          assertions.expressions.push({
            expression: match[1] || match[0],
            confidence: 'high',
            framework: 'pytest'
          });
        }
      }
    }
  }

  /**
   * ✅ NEW: Extract Selenium-specific information
   */
  extractSeleniumInfo(rawError) {
    const seleniumInfo = {
      locators: [],
      timeouts: [],
      elements: []
    };

    // Extract locators
    for (const pattern of this.patterns.selenium) {
      let match;
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(rawError)) !== null) {
        if (match[1]) { // Locator value
          seleniumInfo.locators.push({
            type: this.extractLocatorType(match[0]),
            value: match[1],
            confidence: 'high'
          });
        }
      }
    }

    return seleniumInfo;
  }

  /**
   * ✅ ENHANCED: More permissive check for useful information
   */
  hasUsefulInformation(extractedInfo) {
    // High confidence requirements
    const hasHighConfidenceLocation = extractedInfo.locations.some(loc => loc.confidence === 'high');
    const hasHighConfidenceException = extractedInfo.exceptions.some(exc => exc.confidence === 'high');
    const hasHighConfidenceAssertion = extractedInfo.assertions.comparisons.some(comp => comp.confidence === 'high');

    // Medium confidence fallbacks
    const hasReasonableLocation = extractedInfo.locations.length > 0;
    const hasReasonableException = extractedInfo.exceptions.length > 0;
    const hasAnyAssertion = extractedInfo.assertions.expressions.length > 0 || 
                           extractedInfo.assertions.comparisons.length > 0;

    // Priority: High confidence items
    if (hasHighConfidenceLocation || hasHighConfidenceException || hasHighConfidenceAssertion) {
      return true;
    }

    // Fallback: At least 2 medium confidence items
    const mediumConfidenceCount = [
      hasReasonableLocation,
      hasReasonableException,
      hasAnyAssertion
    ].filter(Boolean).length;

    return mediumConfidenceCount >= 2;
  }

  /**
   * ✅ ENHANCED: Build comprehensive failure object
   */
  buildEnhancedFailureObject(extractedInfo, rawError, testId) {
    // Select best information from extracted data
    const bestLocation = extractedInfo.locations.find(loc => loc.confidence === 'high') || 
                         extractedInfo.locations[0];
    const bestException = extractedInfo.exceptions.find(exc => exc.confidence === 'high') || 
                         extractedInfo.exceptions[0];
    const bestMethod = extractedInfo.methods.find(m => m.confidence === 'high') || 
                      extractedInfo.methods[0];
    const bestClass = extractedInfo.classes.find(c => c.confidence === 'high') || 
                     extractedInfo.classes[0];

    // Build base failure object
    const failure = {
      type: bestException?.name || this.inferFailureType(rawError, extractedInfo.framework),
      file: bestLocation?.file || '',
      line: bestLocation?.line || 0,
      column: bestLocation?.column || null,
      method: bestMethod?.name || this.inferMethodName(testId),
      class: bestClass?.name || this.inferClassName(testId),
      rawError: this.sanitizeRawError(rawError),
      parsingSource: 'raw-output-fallback', // Mark as fallback parsing
      parsingConfidence: this.calculateOverallConfidence(extractedInfo),
      framework: extractedInfo.framework,
      category: this.categorizeFailure(bestException, extractedInfo),
      extracted: {
        locations: extractedInfo.locations,
        exceptions: extractedInfo.exceptions,
        methods: extractedInfo.methods,
        classes: extractedInfo.classes,
        assertions: extractedInfo.assertions
      }
    };

    // ✅ ENHANCED: Build assertion object with better logic
    failure.assertion = this.buildAssertionObject(extractedInfo.assertions);

    // ✅ NEW: Add framework-specific information
    if (extractedInfo.framework === 'selenium' && extractedInfo.selenium) {
      failure.selenium = extractedInfo.selenium;
    }

    // ✅ NEW: Add enhanced message
    failure.message = this.generateEnhancedMessage(failure, extractedInfo);

    return failure;
  }

  /**
   * ✅ ENHANCED: Build assertion object with multiple fallbacks
   */
  buildAssertionObject(assertions) {
    // Priority 1: High-confidence comparisons
    const bestComparison = assertions.comparisons.find(comp => comp.confidence === 'high') ||
                          assertions.comparisons[0];

    if (bestComparison) {
      return {
        available: true,
        expected: bestComparison.right || '',
        actual: bestComparison.left || '',
        operator: bestComparison.operator || '==',
        expression: bestComparison.expression || '',
        framework: bestComparison.framework
      };
    }

    // Priority 2: Separate expected/actual values
    if (assertions.expected.length > 0 && assertions.actual.length > 0) {
      return {
        available: true,
        expected: assertions.expected[0].value || '',
        actual: assertions.actual[0].value || '',
        operator: '==',
        expression: `${assertions.actual[0].value} == ${assertions.expected[0].value}`
      };
    }

    // Priority 3: Expression-based assertions
    if (assertions.expressions.length > 0) {
      const expr = assertions.expressions[0];
      return {
        available: true,
        expected: '',
        actual: '',
        operator: '',
        expression: expr.expression || '',
        framework: expr.framework
      };
    }

    // No assertion information found
    return {
      available: false,
      expected: '',
      actual: '',
      operator: '',
      expression: ''
    };
  }

  /**
   * ✅ ENHANCED: Calculate more nuanced confidence levels
   */
  calculateOverallConfidence(extractedInfo) {
    let confidenceScore = 0;
    let maxScore = 0;

    // File location scoring (30 points max)
    maxScore += 30;
    const highConfidenceLocations = extractedInfo.locations.filter(loc => loc.confidence === 'high').length;
    confidenceScore += Math.min(highConfidenceLocations * 15, 30);

    // Exception scoring (25 points max)
    maxScore += 25;
    const highConfidenceExceptions = extractedInfo.exceptions.filter(exc => exc.confidence === 'high').length;
    confidenceScore += Math.min(highConfidenceExceptions * 25, 25);

    // Assertion scoring (30 points max)
    maxScore += 30;
    const highConfidenceAssertions = extractedInfo.assertions.comparisons.filter(comp => comp.confidence === 'high').length;
    confidenceScore += Math.min(highConfidenceAssertions * 20, 30);

    // Method/Class scoring (15 points max)
    maxScore += 15;
    const highConfidenceMethods = extractedInfo.methods.filter(m => m.confidence === 'high').length;
    const highConfidenceClasses = extractedInfo.classes.filter(c => c.confidence === 'high').length;
    confidenceScore += Math.min((highConfidenceMethods + highConfidenceClasses) * 5, 15);

    const percentage = maxScore > 0 ? (confidenceScore / maxScore) * 100 : 0;

    if (percentage >= 80) return 'high';
    if (percentage >= 50) return 'medium';
    if (percentage >= 20) return 'low';
    return 'none';
  }

  /**
   * ✅ NEW: Categorize failure types for better insights
   */
  categorizeFailure(exception, extractedInfo) {
    if (!exception) return 'general';

    const exceptionName = exception.name.toLowerCase();

    if (exceptionName.includes('assertion')) return 'assertion';
    if (exceptionName.includes('timeout')) return 'timeout';
    if (exceptionName.includes('element')) return 'element';
    if (exceptionName.includes('network') || exceptionName.includes('connection') || exceptionName.includes('http')) return 'network';
    if (exceptionName.includes('permission') || exceptionName.includes('access')) return 'permission';
    if (exceptionName.includes('not found') || exceptionName.includes('missing')) return 'missing';

    return 'general';
  }

  /**
   * ✅ NEW: Generate enhanced error message
   */
  generateEnhancedMessage(failure, extractedInfo) {
    // Priority 1: Use assertion details if available
    if (failure.assertion?.available) {
      if (failure.assertion.expected && failure.assertion.actual) {
        return `Expected ${failure.assertion.expected}, got ${failure.assertion.actual}`;
      }
      if (failure.assertion.expression) {
        return `Assertion failed: ${failure.assertion.expression}`;
      }
    }

    // Priority 2: Use exception-based message
    if (failure.type && failure.category) {
      const categoryMessages = {
        assertion: 'Assertion failed - value mismatch detected',
        timeout: 'Operation timed out',
        element: 'Element interaction failed',
        network: 'Network or API connection failed',
        permission: 'Permission or access denied',
        missing: 'Required resource not found'
      };
      
      if (categoryMessages[failure.category]) {
        return categoryMessages[failure.category];
      }
    }

    // Priority 3: Generic message
    return `${failure.type || 'Test execution failed'}`;
  }

  /**
   * ✅ NEW: Utility methods for enhanced parsing
   */
  cleanAssertionValue(value) {
    if (!value) return '';
    return value.trim().replace(/^['"]|['"]$/g, ''); // Remove surrounding quotes
  }

  getFileExtension(filePath) {
    const match = filePath.match(/\.([^.]+)$/);
    return match ? match[1] : '';
  }

  extractLocatorType(locatorString) {
    const types = ['ID', 'CLASS_NAME', 'TAG_NAME', 'NAME', 'LINK_TEXT', 'PARTIAL_LINK_TEXT', 'CSS_SELECTOR', 'XPATH'];
    for (const type of types) {
      if (locatorString.includes(type)) return type;
    }
    return 'UNKNOWN';
  }

  inferFailureType(rawError, framework) {
    if (framework === 'selenium') return 'WebDriverException';
    if (framework === 'pytest') return 'AssertionError';
    if (framework === 'javascript') return 'Error';
    if (rawError.toLowerCase().includes('timeout')) return 'TimeoutException';
    return 'TestFailure';
  }

  inferMethodName(testId) {
    // Try to extract method name from test ID
    if (testId.includes('_')) {
      return `test_${testId.toLowerCase()}`;
    }
    return testId ? `test${testId}` : '';
  }

  inferClassName(testId) {
    // Try to extract class name from test ID
    if (testId.match(/^[A-Z]/)) {
      return `Test${testId}`;
    }
    return testId ? `Test${testId.charAt(0).toUpperCase()}${testId.slice(1)}` : '';
  }

  // ✅ Keep existing utility methods with enhancements
  assessExceptionConfidence(exceptionName) {
    const wellKnownExceptions = [
      'Exception', 'Error', 'RuntimeException', 'RuntimeError',
      'AssertionError', 'ValueError', 'TypeError', 'KeyError',
      'IndexError', 'AttributeError', 'NameError', 'SyntaxError',
      'ImportError', 'ModuleNotFoundError', 'FileNotFoundError',
      'PermissionError', 'TimeoutError', 'ConnectionError',
      'HttpError', 'NetworkError', 'ElementNotInteractableException',
      'NoSuchElementException', 'StaleElementReferenceException',
      'WebDriverException', 'SeleniumException'
    ];

    if (wellKnownExceptions.includes(exceptionName)) {
      return 'high';
    }

    // Check for common patterns
    if (exceptionName.endsWith('Exception') || exceptionName.endsWith('Error')) {
      return 'medium';
    }

    return 'low';
  }

  assessMethodConfidence(methodName, rawError) {
    // Test methods get higher confidence
    if (methodName.startsWith('test_') || methodName.startsWith('test')) {
      return 'high';
    }
    
    // Methods that appear in stack traces
    if (rawError.includes(`${methodName}(`)) {
      return 'medium';
    }

    return 'low';
  }

  assessClassConfidence(className, rawError) {
    // Test classes get higher confidence
    if (className.startsWith('Test') || className.endsWith('Test')) {
      return 'high';
    }
    
    // Classes that appear multiple times
    const occurrences = (rawError.match(new RegExp(className, 'g')) || []).length;
    if (occurrences > 1) {
      return 'medium';
    }

    return 'low';
  }

  isValidMethodName(methodName) {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(methodName) && methodName.length > 1;
  }

  isValidClassName(className) {
    return /^[A-Z][a-zA-Z0-9_]*$/.test(className) && className.length > 1;
  }

  // ✅ Keep existing deduplication methods
  deduplicateLocations(locations) {
    const seen = new Map();
    return locations.filter(loc => {
      const key = `${loc.file}:${loc.line}`;
      if (seen.has(key)) return false;
      seen.set(key, true);
      return true;
    }).sort((a, b) => {
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

  extractExceptions(rawError) {
    const exceptions = [];
    
    for (const pattern of this.patterns.exception) {
      let match;
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(rawError)) !== null) {
        const fullName = match[0];
        const namespace = match[1];
        const exceptionName = match[2] || match[1];
        
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

  extractMethods(rawError) {
    const methods = [];
    
    for (const pattern of this.patterns.method) {
      let match;
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(rawError)) !== null) {
        const methodName = match[1] || match[2];
        
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

  extractClasses(rawError) {
    const classes = [];
    
    for (const pattern of this.patterns.class) {
      let match;
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(rawError)) !== null) {
        const className = match[1];
        
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
   * ✅ Enhanced sanitization with better formatting
   */
  sanitizeRawError(rawError) {
    if (!rawError) return '';

    return rawError
      .split('\n')
      .slice(0, 25) // Increased from 20 to 25 lines
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n')
      .substring(0, 3000) // Increased from 2000 to 3000 characters
      .replace(/"/g, '\\"') // Escape quotes for JSON safety
      .replace(/\r/g, ''); // Remove carriage returns
  }

  /**
   * ✅ Enhanced simple failure creation for backward compatibility
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
      method: this.inferMethodName(testId),
      class: this.inferClassName(testId),
      rawError: this.sanitizeRawError(rawError),
      parsingSource: 'simple-fallback',
      parsingConfidence: 'none',
      category: 'general',
      message: 'Test execution failed',
      assertion: {
        available: false,
        expected: '',
        actual: '',
        operator: '',
        expression: ''
      },
      extracted: {
        locations: [],
        exceptions: [],
        methods: [],
        classes: [],
        assertions: { expected: [], actual: [], comparisons: [], expressions: [] }
      }
    };
  }

  /**
   * ✅ NEW: Validate and enhance pre-parsed failure data
   * This method helps integrate JUnit XML data with raw parsing fallbacks
   */
  validateAndEnhanceFailure(existingFailure, rawError = '', testId = '') {
    if (!existingFailure) return null;

    console.log(`🔍 Validating existing failure data for ${testId}`);

    // If existing failure has high confidence JUnit XML data, use it as-is
    if (existingFailure.parsingSource === 'junit-xml' && existingFailure.parsingConfidence === 'high') {
      console.log(`✅ High-confidence JUnit XML data found for ${testId}`);
      return existingFailure;
    }

    // If we have raw error output, try to enhance the existing failure
    if (rawError && rawError.trim()) {
      try {
        const enhancedFailure = this.parseError(rawError, testId);
        
        if (enhancedFailure && enhancedFailure.parsingConfidence !== 'none') {
          console.log(`🔄 Enhancing failure data for ${testId} with raw parsing`);
          
          // Merge existing data with enhanced parsing
          return {
            ...existingFailure, // Keep original data
            ...enhancedFailure, // Add enhanced parsing results
            
            // Preserve important original fields if they exist
            parsingSource: existingFailure.parsingSource || enhancedFailure.parsingSource,
            type: existingFailure.type || enhancedFailure.type,
            message: existingFailure.message || enhancedFailure.message,
            
            // Merge assertion data intelligently
            assertion: {
              ...enhancedFailure.assertion,
              ...existingFailure.assertion, // Original takes precedence
              available: existingFailure.assertion?.available || enhancedFailure.assertion?.available || false
            },
            
            // Note the enhancement in metadata
            enhanced: true,
            enhancedAt: new Date().toISOString()
          };
        }
      } catch (error) {
        console.warn(`❌ Failed to enhance failure data for ${testId}:`, error.message);
      }
    }

    // Return original failure if no enhancement possible
    console.log(`📋 Using original failure data for ${testId}`);
    return existingFailure;
  }

  /**
   * ✅ NEW: Test the enhanced parser with sample data
   */
  testEnhancedParser(sampleErrors = []) {
    console.log('🧪 Testing enhanced error parser...');
    
    const defaultSamples = [
      // Pytest assertion error
      `============================= FAILURES =============================
___________________ TestLogin.test_login_success ___________________

self = <test_login.TestLogin testMethod=test_login_success>

    def test_login_success(self):
        driver.get("https://app.example.com/login")
        username_field = driver.find_element(By.ID, "username")
        username_field.send_keys("testuser")
        password_field = driver.find_element(By.ID, "password")
        password_field.send_keys("password123")
        login_btn = driver.find_element(By.ID, "login-btn")
        login_btn.click()
        
        welcome_text = driver.find_element(By.CLASS_NAME, "welcome-message").text
>       assert welcome_text == "Welcome Dashboard"
E       AssertionError: assert 'Error: Invalid credentials' == 'Welcome Dashboard'
E       - Welcome Dashboard
E       + Error: Invalid credentials

test_login.py:45: AssertionError`,

      // Selenium timeout error
      `selenium.common.exceptions.TimeoutException: Message: 
Timed out waiting 10 seconds for element to be clickable
Element locator: By.ID, "submit-button"
  (Session info: chrome=91.0.4472.124)
  
  at test_checkout.py:67 in test_checkout_process
  at TestCheckout.test_checkout_flow`,

      // JavaScript/Node.js error
      `TypeError: Cannot read property 'click' of null
    at Object.test (/Users/dev/project/tests/ui.test.js:23:15)
    at Promise.then.completed (/Users/dev/project/node_modules/jest/index.js:11:495)
    at new Promise (<anonymous>)
    at mapper (/Users/dev/project/node_modules/jest/index.js:11:395)`
    ];

    const samples = sampleErrors.length > 0 ? sampleErrors : defaultSamples;
    
    samples.forEach((errorText, index) => {
      console.log(`\n--- Enhanced Test ${index + 1} ---`);
      console.log('Input:', errorText.substring(0, 100) + '...');
      
      const result = this.parseError(errorText, `test_${index + 1}`);
      
      if (result) {
        console.log('✅ Enhanced parsing successful');
        console.log('- Type:', result.type);
        console.log('- File:', result.file);
        console.log('- Line:', result.line);
        console.log('- Category:', result.category);
        console.log('- Framework:', result.framework);
        console.log('- Confidence:', result.parsingConfidence);
        console.log('- Assertion available:', result.assertion?.available);
        if (result.assertion?.available) {
          console.log('  - Expected:', result.assertion.expected);
          console.log('  - Actual:', result.assertion.actual);
          console.log('  - Operator:', result.assertion.operator);
        }
      } else {
        console.log('❌ Enhanced parsing failed - insufficient reliable information');
      }
    });
    
    console.log('\n🏁 Enhanced parser testing complete');
  }

  /**
   * ✅ NEW: Get parsing statistics for monitoring
   */
  getParsingStats(results = []) {
    const stats = {
      total: results.length,
      parsed: 0,
      highConfidence: 0,
      mediumConfidence: 0,
      lowConfidence: 0,
      junitXml: 0,
      rawParsing: 0,
      frameworkBreakdown: {},
      categoryBreakdown: {}
    };

    results.forEach(result => {
      if (result.failure) {
        stats.parsed++;
        
        // Confidence breakdown
        switch (result.failure.parsingConfidence) {
          case 'high': stats.highConfidence++; break;
          case 'medium': stats.mediumConfidence++; break;
          case 'low': stats.lowConfidence++; break;
        }
        
        // Source breakdown
        if (result.failure.parsingSource?.includes('junit-xml')) {
          stats.junitXml++;
        } else if (result.failure.parsingSource?.includes('raw-output')) {
          stats.rawParsing++;
        }
        
        // Framework breakdown
        const framework = result.failure.framework || 'unknown';
        stats.frameworkBreakdown[framework] = (stats.frameworkBreakdown[framework] || 0) + 1;
        
        // Category breakdown
        const category = result.failure.category || 'unknown';
        stats.categoryBreakdown[category] = (stats.categoryBreakdown[category] || 0) + 1;
      }
    });

    stats.successRate = stats.total > 0 ? (stats.parsed / stats.total) * 100 : 0;
    stats.highConfidenceRate = stats.parsed > 0 ? (stats.highConfidence / stats.parsed) * 100 : 0;

    return stats;
  }
}

// Export as singleton
const errorParserService = new ErrorParserService();
export default errorParserService;
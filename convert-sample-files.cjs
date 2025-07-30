// convert-sample-files.js
// Script to convert public folder sample files to src/data format

const fs = require('fs');
const path = require('path');

// Function to remove JSONC comments
function removeComments(jsonString) {
  return jsonString.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
}

// Function to calculate Test Depth Factor
function calculateTDF(requirement) {
  const businessImpact = requirement.businessImpact || 3;
  const technicalComplexity = requirement.technicalComplexity || 2;
  const regulatoryFactor = requirement.regulatoryFactor || 1;
  const usageFrequency = requirement.usageFrequency || 3;
  
  return (
    (businessImpact * 0.4) +
    (technicalComplexity * 0.3) +
    (regulatoryFactor * 0.2) +
    (usageFrequency * 0.1)
  );
}

// Function to determine minimum test cases based on TDF
function getMinTestCases(tdf) {
  if (tdf >= 4.1) return 8;  // Exhaustive testing
  if (tdf >= 3.1) return 5;  // Strong coverage
  if (tdf >= 2.1) return 3;  // Standard coverage
  return 1;                  // Basic validation
}

// Convert requirements file
function convertRequirements() {
  try {
    // Read the public sample requirements file
    const publicFile = fs.readFileSync('public/sample-requirements.jsonc', 'utf8');
    const cleanedJson = removeComments(publicFile);
    const requirements = JSON.parse(cleanedJson);
    
    // Transform requirements to match src/data format
    const convertedRequirements = requirements.map(req => {
      const tdf = calculateTDF(req);
      const minTestCases = getMinTestCases(tdf);
      
      return {
        id: req.id,
        name: req.name,
        description: req.description,
        priority: req.priority,
        type: req.type || 'Functional',
        businessImpact: req.businessImpact || 3,
        technicalComplexity: req.technicalComplexity || 2,
        regulatoryFactor: req.regulatoryFactor || 1,
        usageFrequency: req.usageFrequency || 3,
        testDepthFactor: parseFloat(tdf.toFixed(1)),
        minTestCases: minTestCases,
        versions: req.versions || ['v1.0'],
        status: req.status || 'Active',
        owner: req.owner,
        tags: req.tags || []
      };
    });
    
    // Generate the JS module file
    const output = `// src/data/requirements.js
// Generated from public/sample-requirements.jsonc
const requirements = ${JSON.stringify(convertedRequirements, null, 2)};

export default requirements;`;
    
    // Write to src/data/requirements.js
    fs.writeFileSync('src/data/requirements.js', output);
    console.log('✅ Successfully converted requirements to src/data/requirements.js');
    
    return convertedRequirements;
  } catch (error) {
    console.error('❌ Error converting requirements:', error.message);
    throw error;
  }
}

// Convert test cases file
function convertTestCases() {
  try {
    // Read the public sample test cases file
    const publicFile = fs.readFileSync('public/sample-testcases.jsonc', 'utf8');
    const cleanedJson = removeComments(publicFile);
    const testCases = JSON.parse(cleanedJson);
    
    // Change 1: Update Test Case Conversion Function
    const convertedTestCases = testCases.map(tc => {
      const converted = { ...tc };
      
      // Convert version field to applicableVersions
      if (tc.version !== undefined) {
        if (tc.version && tc.version !== '') {
          // Single version becomes array
          converted.applicableVersions = [tc.version];
        } else {
          // Empty/null version becomes empty array (applies to all)
          converted.applicableVersions = [];
        }
        // Remove old version field
        delete converted.version;
      } else if (!tc.applicableVersions) {
        // No version info means applies to all versions
        converted.applicableVersions = [];
      }
      
      // Ensure applicableVersions is always an array
      if (!Array.isArray(converted.applicableVersions)) {
        converted.applicableVersions = converted.applicableVersions ? [converted.applicableVersions] : [];
      }
      
      return converted;
    });

    // Change 2: Add Strategic Version Assignment Logic
    const enhancedTestCases = convertedTestCases.map(tc => {
      const enhanced = { ...tc };
      
      // Strategic version assignment based on test case characteristics
      if (tc.id) {
        // Core login/authentication tests - apply to multiple versions
        if (tc.name && (tc.name.toLowerCase().includes('login') || 
                       tc.name.toLowerCase().includes('auth') ||
                       tc.name.toLowerCase().includes('user login') ||
                       tc.name.toLowerCase().includes('customer registration'))) {
          enhanced.applicableVersions = ['v1.0', 'v1.1', 'v2.0'];
        }
        
        // Performance tests - apply to all versions (empty array)
        else if (tc.name && tc.name.toLowerCase().includes('performance')) {
          enhanced.applicableVersions = [];
        }
        
        // New feature tests - apply to newer versions only
        else if (tc.name && (tc.name.toLowerCase().includes('two-factor') ||
                           tc.name.toLowerCase().includes('2fa') ||
                           tc.name.toLowerCase().includes('advanced'))) {
          enhanced.applicableVersions = ['v1.1', 'v2.0'];
        }
        
        // API tests - version specific (example, adjust based on actual data)
        else if (tc.name && tc.name.toLowerCase().includes('api')) {
          // API v1 tests
          if (tc.name.toLowerCase().includes('v1')) {
            enhanced.applicableVersions = ['v1.0', 'v1.1'];
          }
          // API v2 tests
          else if (tc.name.toLowerCase().includes('v2')) {
            enhanced.applicableVersions = ['v2.0'];
          }
          // General API tests
          else {
            enhanced.applicableVersions = ['v1.0', 'v1.1', 'v2.0'];
          }
        }
        
        // Legacy feature tests - older versions only
        else if (tc.name && tc.name.toLowerCase().includes('legacy')) {
          enhanced.applicableVersions = ['v1.0'];
        }
        
        // If no specific assignment and it had a version, keep that version
        else if (enhanced.applicableVersions.length === 0 && tc.hasOwnProperty('version')) {
          if (tc.version && tc.version !== '') {
            enhanced.applicableVersions = [tc.version];
          } else {
            enhanced.applicableVersions = []; // Explicitly set to empty array if legacy was empty
          }
        }
      }
      
      // Ensure applicableVersions is always an array, even if not explicitly assigned above
      if (!Array.isArray(enhanced.applicableVersions)) {
          enhanced.applicableVersions = [];
      }

      return enhanced;
    });
    
    // Change 5: Add Validation Function and use it
    const validationResult = validatePhase1Conversion(enhancedTestCases);

    if (!validationResult.valid) {
      console.error('❌ Validation failed:');
      validationResult.errors.forEach(error => console.error(`   ${error}`));
      throw new Error('Test case conversion validation failed');
    }

    if (validationResult.warnings.length > 0) {
      console.warn('⚠️ Validation warnings:');
      validationResult.warnings.forEach(warning => console.warn(`   ${warning}`));
    }

    console.log('✅ Phase 1 conversion validation passed:');
    console.log(`   📊 ${validationResult.stats.hasApplicableVersions}/${validationResult.stats.totalTests} test cases use new format`);
    console.log(`   🌐 ${validationResult.stats.universalTests} universal test cases (all versions)`);
    console.log(`   🔄 ${validationResult.stats.multiVersionTests} multi-version test cases`);

    // Generate the JS module file
    const output = `// src/data/testcases.js
// Generated from public/sample-testcases.jsonc with applicableVersions format
const testCases = ${JSON.stringify(enhancedTestCases, null, 2)};

export default testCases;`;
    
    // Write to src/data/testcases.js
    fs.writeFileSync('src/data/testcases.js', output);
    console.log('✅ Successfully converted test cases to src/data/testcases.js with applicableVersions format');
    console.log(`📊 Processed ${enhancedTestCases.length} test cases`);
    
    // Log version distribution for verification
    const versionStats = {};
    enhancedTestCases.forEach(tc => {
      if (tc.applicableVersions.length === 0) {
        versionStats['All Versions'] = (versionStats['All Versions'] || 0) + 1;
      } else {
        tc.applicableVersions.forEach(version => {
          versionStats[version] = (versionStats[version] || 0) + 1;
        });
      }
    });
    
    console.log('📈 Version distribution:');
    Object.entries(versionStats).forEach(([version, count]) => {
      console.log(`   ${version}: ${count} test cases`);
    });
    
    return enhancedTestCases;
  } catch (error) {
    console.error('❌ Error converting test cases:', error.message);
    throw error;
  }
}

// Change 3: Update generateMapping Function
// Generate mapping from test cases with requirementIds and version validation
function generateMapping(testCases) {
  const mapping = {};
  const mappingStats = {
    totalMappings: 0,
    versionCoverage: {}
  };
  
  testCases.forEach(tc => {
    if (tc.requirementIds && Array.isArray(tc.requirementIds)) {
      tc.requirementIds.forEach(reqId => {
        if (!mapping[reqId]) {
          mapping[reqId] = [];
        }
        if (!mapping[reqId].includes(tc.id)) {
          mapping[reqId].push(tc.id);
          mappingStats.totalMappings++;
          
          // Track version coverage for this mapping
          const versions = tc.applicableVersions && tc.applicableVersions.length > 0 
            ? tc.applicableVersions 
            : ['All Versions']; // If applicableVersions is empty, it applies to 'All Versions'
          
          versions.forEach(version => {
            if (!mappingStats.versionCoverage[version]) {
              mappingStats.versionCoverage[version] = new Set();
            }
            mappingStats.versionCoverage[version].add(reqId);
          });
        }
      });
    }
  });
  
  // Generate the JS module file
  const output = `// src/data/mapping.js
// Generated from test case requirementIds in public/sample-testcases.jsonc
const mapping = ${JSON.stringify(mapping, null, 2)};

export default mapping;`;
  
  // Write to src/data/mapping.js
  fs.writeFileSync('src/data/mapping.js', output);
  console.log('✅ Successfully generated mapping to src/data/mapping.js');
  console.log(`🔗 Generated ${mappingStats.totalMappings} requirement-test mappings`);
  
  // Log version coverage
  console.log('📋 Requirements coverage by version:');
  Object.entries(mappingStats.versionCoverage).forEach(([version, reqSet]) => {
    console.log(`   ${version}: ${reqSet.size} requirements covered`);
  });
  
  return mapping;
}

// Generate enhanced versions data
function generateVersions() {
  const versions = [
    { 
      id: 'v1.0', 
      name: 'Version 1.0', 
      releaseDate: '2024-08-15', 
      status: 'Released',
      qualityGates: [
        { id: 'critical_req_coverage', name: 'Critical Requirements Test Coverage', target: 60, actual: 0, status: 'passed' },
        { id: 'test_pass_rate', name: 'Test Pass Rate', target: 75, actual: 0, status: 'passed' },
        { id: 'overall_req_coverage', name: 'Overall Requirements Coverage', target: 50, actual: 0, status: 'passed' }
      ]
    },
    { 
      id: 'v1.1', 
      name: 'Version 1.1', 
      releaseDate: '2024-12-01', 
      status: 'Planned',
      qualityGates: [
        { id: 'critical_req_coverage', name: 'Critical Requirements Test Coverage', target: 80, actual: 0, status: 'failed' },
        { id: 'test_pass_rate', name: 'Test Pass Rate', target: 85, actual: 0, status: 'failed' },
        { id: 'overall_req_coverage', name: 'Overall Requirements Coverage', target: 70, actual: 0, status: 'failed' }
      ]
    },
    { 
      id: 'v2.0', 
      name: 'Version 2.0', 
      releaseDate: '2025-03-15', 
      status: 'Planned',
      qualityGates: [
        { id: 'critical_req_coverage', name: 'Critical Requirements Test Coverage', target: 90, actual: 0, status: 'failed' },
        { id: 'test_pass_rate', name: 'Test Pass Rate', target: 90, actual: 0, status: 'failed' },
        { id: 'overall_req_coverage', name: 'Overall Requirements Coverage', target: 80, actual: 0, status: 'failed' }
      ]
    }
  ];
  
  // Generate the JS module file
  const output = `// src/data/versions.js
// Enhanced version data for converted sample files
const versions = ${JSON.stringify(versions, null, 2)};

export default versions;`;
  
  // Write to src/data/versions.js
  fs.writeFileSync('src/data/versions.js', output);
  console.log('✅ Successfully generated versions to src/data/versions.js');
  
  return versions;
}

// Change 5: Add Validation Function
/**
 * Validate the converted test cases for Phase 1 requirements
 * @param {Array} testCases - Converted test cases
 * @returns {Object} Validation results
 */
function validatePhase1Conversion(testCases) {
  const validation = {
    valid: true,
    warnings: [],
    errors: [],
    stats: {
      totalTests: testCases.length,
      hasApplicableVersions: 0,
      hasLegacyVersion: 0,
      universalTests: 0,
      multiVersionTests: 0
    }
  };
  
  testCases.forEach((tc, index) => {
    // Check for new format
    if (tc.applicableVersions !== undefined) {
      validation.stats.hasApplicableVersions++;
      
      if (!Array.isArray(tc.applicableVersions)) {
        validation.errors.push(`Test case ${tc.id || index}: applicableVersions must be an array`);
        validation.valid = false;
      } else {
        if (tc.applicableVersions.length === 0) {
          validation.stats.universalTests++;
        } else if (tc.applicableVersions.length > 1) {
          validation.stats.multiVersionTests++;
        }
      }
    }
    
    // Check for legacy format (should ideally be removed after conversion)
    if (tc.version !== undefined) {
      validation.stats.hasLegacyVersion++;
      validation.warnings.push(`Test case ${tc.id || index}: still has legacy 'version' field`);
    }
    
    // Validation rules: must have applicableVersions defined
    if (tc.applicableVersions === undefined) {
      validation.errors.push(`Test case ${tc.id || index}: missing applicableVersions field`);
      validation.valid = false;
    }
  });
  
  return validation;
}

// Main conversion function
function convertSampleFiles() {
  console.log('🚀 Starting conversion of public sample files to src/data format...\n');
  console.log('🔄 Phase 1: Converting to applicableVersions[] format...\n');
  
  try {
    // Ensure src/data directory exists
    if (!fs.existsSync('src/data')) {
      fs.mkdirSync('src/data', { recursive: true });
    }
    
    // Convert files
    const requirements = convertRequirements();
    const testCases = convertTestCases(); // This now returns enhancedTestCases
    const mapping = generateMapping(testCases); // Use the result from convertTestCases
    const versions = generateVersions();
    
    console.log('\n🎉 Phase 1 conversion completed successfully!');
    console.log(`📊 Converted ${requirements.length} requirements`);
    console.log(`🧪 Converted ${testCases.length} test cases with applicableVersions format`);
    console.log(`🔗 Generated ${Object.keys(mapping).length} requirement mappings`);
    console.log(`📦 Generated ${versions.length} versions`);
    
    console.log('\n📝 Next steps:');
    console.log('1. Review the generated files in src/data/');
    console.log('2. Test the application with "Load Sample Data"');
    console.log('3. Verify multi-version test case functionality');
    console.log('4. Check traceability matrix with version filtering');
    
    console.log('\n🆕 Phase 1 Features Enabled:');
    console.log('• Test cases can now apply to multiple versions');
    console.log('• Enhanced version filtering in dashboard and matrix');
    console.log('• Backward compatibility with legacy single-version format');
    console.log('• Strategic version assignments for better demonstration');
    
  } catch (error) {
    console.error('\n💥 Conversion failed:', error.message);
    process.exit(1);
  }
}

// Run the conversion if this script is executed directly
if (require.main === module) {
  convertSampleFiles();
}

module.exports = {
  convertSampleFiles,
  convertRequirements,
  convertTestCases,
  generateMapping,
  generateVersions
};

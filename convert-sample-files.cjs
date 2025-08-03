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
        versions: req.versions || ['sample-v1.0'],
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
    
    // Convert test cases - they already have the new applicableVersions format
    const convertedTestCases = testCases.map(tc => {
      const converted = { ...tc };
      
      // Ensure applicableVersions is always an array
      if (!Array.isArray(converted.applicableVersions)) {
        converted.applicableVersions = converted.applicableVersions ? [converted.applicableVersions] : ['sample-v1.0'];
      }
      
      // If applicableVersions is empty, set to sample version
      if (converted.applicableVersions.length === 0) {
        converted.applicableVersions = ['sample-v1.0'];
      }
      
      return converted;
    });

    // Validate the conversion
    const validationResult = validateSampleConversion(convertedTestCases);

    if (!validationResult.valid) {
      console.error('❌ Validation failed:');
      validationResult.errors.forEach(error => console.error(`   ${error}`));
      throw new Error('Test case conversion validation failed');
    }

    if (validationResult.warnings.length > 0) {
      console.warn('⚠️ Validation warnings:');
      validationResult.warnings.forEach(warning => console.warn(`   ${warning}`));
    }

    console.log('✅ Sample data conversion validation passed:');
    console.log(`   📊 ${validationResult.stats.totalTests} test cases processed`);
    console.log(`   🏷️ ${validationResult.stats.sampleIdentified} clearly marked as sample data`);

    // Generate the JS module file
    const output = `// src/data/testcases.js
// Generated from public/sample-testcases.jsonc - SAMPLE DATA
const testCases = ${JSON.stringify(convertedTestCases, null, 2)};

export default testCases;`;
    
    // Write to src/data/testcases.js
    fs.writeFileSync('src/data/testcases.js', output);
    console.log('✅ Successfully converted test cases to src/data/testcases.js');
    
    return convertedTestCases;
  } catch (error) {
    console.error('❌ Error converting test cases:', error.message);
    throw error;
  }
}

// Generate mapping from test cases with requirementIds
function generateMapping(testCases) {
  const mapping = {};
  const mappingStats = {
    totalMappings: 0,
    sampleMappings: 0
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
          
          // Count sample mappings
          if (reqId.includes('SAMPLE') || tc.id.includes('SAMPLE')) {
            mappingStats.sampleMappings++;
          }
        }
      });
    }
  });
  
  // Generate the JS module file
  const output = `// src/data/mapping.js
// Generated from test case requirementIds - SAMPLE DATA
const mapping = ${JSON.stringify(mapping, null, 2)};

export default mapping;`;
  
  // Write to src/data/mapping.js
  fs.writeFileSync('src/data/mapping.js', output);
  console.log('✅ Successfully generated mapping to src/data/mapping.js');
  console.log(`🔗 Generated ${mappingStats.totalMappings} requirement-test mappings`);
  console.log(`🏷️ ${mappingStats.sampleMappings} sample data mappings identified`);
  
  return mapping;
}

// Generate single sample version
function generateVersions() {
  const versions = [
    { 
      id: 'sample-v1.0', 
      name: '[SAMPLE] Demo Version 1.0', 
      releaseDate: '2024-08-15', 
      status: 'Released',
      qualityGates: [
        { id: 'critical_req_coverage', name: 'Critical Requirements Test Coverage', target: 60, actual: 0, status: 'passed' },
        { id: 'test_pass_rate', name: 'Test Pass Rate', target: 75, actual: 0, status: 'passed' },
        { id: 'overall_req_coverage', name: 'Overall Requirements Coverage', target: 50, actual: 0, status: 'passed' }
      ]
    }
  ];
  
  // Generate the JS module file
  const output = `// src/data/versions.js
// SAMPLE DATA - Single demo version for testing
const versions = ${JSON.stringify(versions, null, 2)};

export default versions;`;
  
  // Write to src/data/versions.js
  fs.writeFileSync('src/data/versions.js', output);
  console.log('✅ Successfully generated single sample version to src/data/versions.js');
  
  return versions;
}

// Validation function for sample data conversion
function validateSampleConversion(testCases) {
  const validation = {
    valid: true,
    warnings: [],
    errors: [],
    stats: {
      totalTests: testCases.length,
      sampleIdentified: 0,
      hasApplicableVersions: 0
    }
  };
  
  testCases.forEach((tc, index) => {
    // Check for sample identification
    if (tc.id && tc.id.includes('SAMPLE') && tc.name && tc.name.includes('[SAMPLE]')) {
      validation.stats.sampleIdentified++;
    }
    
    // Check for applicableVersions
    if (tc.applicableVersions !== undefined) {
      validation.stats.hasApplicableVersions++;
      
      if (!Array.isArray(tc.applicableVersions)) {
        validation.errors.push(`Test case ${tc.id || index}: applicableVersions must be an array`);
        validation.valid = false;
      }
    } else {
      validation.errors.push(`Test case ${tc.id || index}: missing applicableVersions field`);
      validation.valid = false;
    }
    
    // Warning for non-sample data (in case user mixed real data)
    if (tc.id && !tc.id.includes('SAMPLE')) {
      validation.warnings.push(`Test case ${tc.id}: does not appear to be sample data (missing SAMPLE identifier)`);
    }
  });
  
  return validation;
}

// Main conversion function
function convertSampleFiles() {
  console.log('🚀 Starting conversion of sample files to src/data format...\n');
  console.log('🏷️ Converting to clearly identified sample data format...\n');
  
  try {
    // Ensure src/data directory exists
    if (!fs.existsSync('src/data')) {
      fs.mkdirSync('src/data', { recursive: true });
    }
    
    // Convert files
    const requirements = convertRequirements();
    const testCases = convertTestCases();
    const mapping = generateMapping(testCases);
    const versions = generateVersions();
    
    console.log('\n🎉 Sample data conversion completed successfully!');
    console.log(`📊 Converted ${requirements.length} sample requirements`);
    console.log(`🧪 Converted ${testCases.length} sample test cases`);
    console.log(`🔗 Generated ${Object.keys(mapping).length} sample requirement mappings`);
    console.log(`📦 Generated ${versions.length} sample version (single release)`);
    
    console.log('\n📝 Sample Data Features:');
    console.log('• All items clearly marked with [SAMPLE] prefix in names');
    console.log('• IDs prefixed with SAMPLE- for easy identification');
    console.log('• Single version (sample-v1.0) to simplify demo');
    console.log('• Easy to identify and delete sample data');
    console.log('• Tags include "Sample" for filtering');
    
    console.log('\n🗑️ To remove sample data:');
    console.log('• Filter by "Sample" tag to select all sample items');
    console.log('• Search for "SAMPLE" or "[SAMPLE]" to find all sample data');
    console.log('• Look for items with owners containing "[SAMPLE]"');
    
    console.log('\n✅ Next steps:');
    console.log('1. Review the generated files in src/data/');
    console.log('2. Test the application with "Load Sample Data"');
    console.log('3. Verify sample data is clearly identifiable');
    console.log('4. Test deletion of sample data when ready');
    
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
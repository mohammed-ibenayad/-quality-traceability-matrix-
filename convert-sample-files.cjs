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
    
    // Transform test cases to match src/data format (minimal changes needed)
    const convertedTestCases = testCases.map(tc => ({
      id: tc.id,
      name: tc.name,
      description: tc.description,
      steps: tc.steps || [],
      expectedResult: tc.expectedResult,
      status: tc.status || 'Not Run',
      automationStatus: tc.automationStatus || 'Manual',
      automationPath: tc.automationPath || '',
      lastExecuted: tc.lastExecuted || '',
      version: tc.version || 'v1.0',
      executedBy: tc.executedBy || '',
      tags: tc.tags || [],
      priority: tc.priority || 'Medium',
      estimatedDuration: tc.estimatedDuration || 0,
      requirementIds: tc.requirementIds || [] // Important for mapping generation
    }));
    
    // Generate the JS module file
    const output = `// src/data/testcases.js
// Generated from public/sample-testcases.jsonc
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
  
  testCases.forEach(tc => {
    if (tc.requirementIds && Array.isArray(tc.requirementIds)) {
      tc.requirementIds.forEach(reqId => {
        if (!mapping[reqId]) {
          mapping[reqId] = [];
        }
        if (!mapping[reqId].includes(tc.id)) {
          mapping[reqId].push(tc.id);
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

// Main conversion function
function convertSampleFiles() {
  console.log('🚀 Starting conversion of public sample files to src/data format...\n');
  
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
    
    console.log('\n🎉 Conversion completed successfully!');
    console.log(`📊 Converted ${requirements.length} requirements`);
    console.log(`🧪 Converted ${testCases.length} test cases`);
    console.log(`🔗 Generated ${Object.keys(mapping).length} requirement mappings`);
    console.log(`📦 Generated ${versions.length} versions`);
    
    console.log('\n📝 Next steps:');
    console.log('1. Review the generated files in src/data/');
    console.log('2. Test the application with "Load Sample Data"');
    console.log('3. Make any necessary adjustments to the data');
    
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
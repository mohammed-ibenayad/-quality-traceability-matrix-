// src/data/versions.js
const versions = [
  { 
    id: 'v1.0', 
    name: 'Version 1.0', 
    releaseDate: '2024-08-15', 
    status: 'Released',
    qualityGates: [
      // Basic gates for the initial release - low targets but still passing
      { id: 'critical_req_coverage', name: 'Critical Requirements Test Coverage', target: 60, actual: 0, status: 'passed' },
      { id: 'test_pass_rate', name: 'Test Pass Rate', target: 75, actual: 0, status: 'passed' },
      { id: 'overall_req_coverage', name: 'Overall Requirements Coverage', target: 50, actual: 0, status: 'passed' }
    ]
  }
];

export default versions;
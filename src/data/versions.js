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
  },
  { 
    id: 'v1.1', 
    name: 'Version 1.1', 
    releaseDate: '2024-12-10', 
    status: 'Released',
    qualityGates: [
      // Increased targets, still showing progress
      { id: 'critical_req_coverage', name: 'Critical Requirements Test Coverage', target: 80, actual: 0, status: 'passed' },
      { id: 'test_pass_rate', name: 'Test Pass Rate', target: 85, actual: 0, status: 'passed' },
      { id: 'automation_coverage', name: 'Automation Coverage', target: 50, actual: 0, status: 'passed' }
    ]
  },
  { 
    id: 'v1.3', 
    name: 'Version 1.3', 
    releaseDate: '2025-05-15', 
    status: 'In Progress',
    qualityGates: [
      // Highest targets for the latest release, currently in progress (will be calculated by the app)
      { id: 'critical_req_coverage', name: 'Critical Requirements Test Coverage', target: 90, actual: 0, status: 'failed' },
      { id: 'test_pass_rate', name: 'Test Pass Rate', target: 93, actual: 0, status: 'failed' },
      { id: 'automation_coverage', name: 'Automation Coverage', target: 80, actual: 0, status: 'failed' }
    ]
  }
];

export default versions;
const versions = [
  { 
    id: 'v2.0', 
    name: 'Version 2.0', 
    releaseDate: '2024-10-15', 
    status: 'Released',
    qualityGates: [
      { name: 'Critical requirements tested', target: 100, actual: 100, status: 'passed' },
      { name: 'Overall test pass rate', target: 95, actual: 97, status: 'passed' },
      { name: 'Automation coverage', target: 75, actual: 70, status: 'failed' }
    ]
  },
  { 
    id: 'v2.1', 
    name: 'Version 2.1', 
    releaseDate: '2025-01-20', 
    status: 'Released',
    qualityGates: [
      { name: 'Critical requirements tested', target: 100, actual: 100, status: 'passed' },
      { name: 'Overall test pass rate', target: 95, actual: 96, status: 'passed' },
      { name: 'Automation coverage', target: 75, actual: 78, status: 'passed' }
    ]
  },
  { 
    id: 'v2.2', 
    name: 'Version 2.2', 
    releaseDate: '2025-04-15', 
    status: 'In Progress',
    qualityGates: [
      { name: 'Critical requirements tested', target: 100, actual: 83, status: 'failed' },
      { name: 'Overall test pass rate', target: 95, actual: 80, status: 'failed' },
      { name: 'Automation coverage', target: 80, actual: 75, status: 'failed' },
      { name: 'Security requirements passed', target: 100, actual: 75, status: 'failed' }
    ]
  }
];

export default versions;
const requirements = [
  { 
    id: 'REQ-001', 
    name: 'User Login', 
    description: 'Users must be able to login with email and password', 
    priority: 'High',
    businessImpact: 5,
    technicalComplexity: 3,
    regulatoryFactor: 4,
    usageFrequency: 5,
    testDepthFactor: 4.3,
    minTestCases: 8,
    versions: ['v2.0', 'v2.1', 'v2.2', 'v2.3']
  },
  { 
    id: 'REQ-002', 
    name: 'Password Reset', 
    description: 'Users must be able to reset their password', 
    priority: 'Medium',
    businessImpact: 4,
    technicalComplexity: 2,
    regulatoryFactor: 3,
    usageFrequency: 3,
    testDepthFactor: 3.2,
    minTestCases: 5,
    versions: ['v2.0', 'v2.1', 'v2.2', 'v2.3']
  },
  { 
    id: 'REQ-003', 
    name: 'Account Lockout', 
    description: 'Account should lock after 3 failed attempts', 
    priority: 'High',
    businessImpact: 5,
    technicalComplexity: 2,
    regulatoryFactor: 5,
    usageFrequency: 3,
    testDepthFactor: 4.0,
    minTestCases: 7,
    versions: ['v2.1', 'v2.2', 'v2.3']
  },
  { 
    id: 'REQ-004', 
    name: 'Password Complexity', 
    description: 'Passwords must meet complexity requirements', 
    priority: 'Medium',
    businessImpact: 3,
    technicalComplexity: 2,
    regulatoryFactor: 4,
    usageFrequency: 2,
    testDepthFactor: 2.9,
    minTestCases: 4,
    versions: ['v2.0', 'v2.1', 'v2.2', 'v2.3']
  },
  { 
    id: 'REQ-005', 
    name: 'Session Timeout', 
    description: 'User sessions must timeout after 30 minutes of inactivity', 
    priority: 'Low',
    businessImpact: 2,
    technicalComplexity: 1,
    regulatoryFactor: 3,
    usageFrequency: 5,
    testDepthFactor: 2.4,
    minTestCases: 3,
    versions: ['v2.2', 'v2.3']
  },
  { 
    id: 'REQ-006', 
    name: 'Two-Factor Authentication', 
    description: 'Users must be able to enable 2FA for their accounts', 
    priority: 'High',
    businessImpact: 5,
    technicalComplexity: 4,
    regulatoryFactor: 5,
    usageFrequency: 4,
    testDepthFactor: 4.6,
    minTestCases: 10,
    versions: ['v2.3']
  },
];

export default requirements;
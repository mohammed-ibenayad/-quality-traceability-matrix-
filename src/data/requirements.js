// src/data/requirements.js
const requirements = [
  // Core Authentication Requirements (v1.0)
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
    versions: ['v1.0', 'v1.1', 'v1.3']
  },
  { 
    id: 'REQ-002', 
    name: 'Password Reset', 
    description: 'Users must be able to reset their password via email', 
    priority: 'Medium',
    businessImpact: 4,
    technicalComplexity: 2,
    regulatoryFactor: 3,
    usageFrequency: 3,
    testDepthFactor: 3.2,
    minTestCases: 5,
    versions: ['v1.0', 'v1.1', 'v1.3']
  },
  { 
    id: 'REQ-003', 
    name: 'User Registration', 
    description: 'New users must be able to create an account', 
    priority: 'High',
    businessImpact: 5,
    technicalComplexity: 3,
    regulatoryFactor: 3,
    usageFrequency: 4,
    testDepthFactor: 3.9,
    minTestCases: 5,
    versions: ['v1.0', 'v1.1', 'v1.3']
  },
  { 
    id: 'REQ-004', 
    name: 'Form Validations', 
    description: 'All user input forms must have proper validations', 
    priority: 'Medium',
    businessImpact: 3,
    technicalComplexity: 2,
    regulatoryFactor: 2,
    usageFrequency: 5,
    testDepthFactor: 2.9,
    minTestCases: 3,
    versions: ['v1.0', 'v1.1', 'v1.3']
  },
  { 
    id: 'REQ-005', 
    name: 'User Profile', 
    description: 'Users must be able to view and edit their profile information', 
    priority: 'Medium',
    businessImpact: 3,
    technicalComplexity: 2,
    regulatoryFactor: 2,
    usageFrequency: 4,
    testDepthFactor: 2.7,
    minTestCases: 3,
    versions: ['v1.0', 'v1.1', 'v1.3']
  },
  
  // Security Enhancements (v1.1)
  { 
    id: 'REQ-006', 
    name: 'Account Lockout', 
    description: 'Account should lock after 3 failed attempts', 
    priority: 'High',
    businessImpact: 5,
    technicalComplexity: 2,
    regulatoryFactor: 5,
    usageFrequency: 3,
    testDepthFactor: 4.0,
    minTestCases: 5,
    versions: ['v1.1', 'v1.3']
  },
  { 
    id: 'REQ-007', 
    name: 'Password Complexity', 
    description: 'Passwords must meet complexity requirements', 
    priority: 'Medium',
    businessImpact: 3,
    technicalComplexity: 2,
    regulatoryFactor: 4,
    usageFrequency: 2,
    testDepthFactor: 2.9,
    minTestCases: 3,
    versions: ['v1.1', 'v1.3']
  },
  { 
    id: 'REQ-008', 
    name: 'Session Timeout', 
    description: 'User sessions must timeout after 30 minutes of inactivity', 
    priority: 'Low',
    businessImpact: 2,
    technicalComplexity: 1,
    regulatoryFactor: 3,
    usageFrequency: 5,
    testDepthFactor: 2.4,
    minTestCases: 3,
    versions: ['v1.1', 'v1.3']
  },
  { 
    id: 'REQ-009', 
    name: 'GDPR Compliance', 
    description: 'System must comply with GDPR data protection requirements', 
    priority: 'High',
    businessImpact: 5,
    technicalComplexity: 4,
    regulatoryFactor: 5,
    usageFrequency: 3,
    testDepthFactor: 4.4,
    minTestCases: 8,
    versions: ['v1.1', 'v1.3']
  },
  { 
    id: 'REQ-010', 
    name: 'Data Encryption', 
    description: 'All sensitive data must be encrypted at rest and in transit', 
    priority: 'High',
    businessImpact: 5,
    technicalComplexity: 4,
    regulatoryFactor: 5,
    usageFrequency: 5,
    testDepthFactor: 4.7,
    minTestCases: 8,
    versions: ['v1.1', 'v1.3']
  },
  
  // Advanced Features (v1.3)
  { 
    id: 'REQ-011', 
    name: 'Multi-factor Authentication', 
    description: 'Users must be able to enable 2FA for their accounts', 
    priority: 'High',
    businessImpact: 4,
    technicalComplexity: 4,
    regulatoryFactor: 4,
    usageFrequency: 3,
    testDepthFactor: 3.9,
    minTestCases: 5,
    versions: ['v1.3']
  },
  { 
    id: 'REQ-012', 
    name: 'Social Media Integration', 
    description: 'Users must be able to login with social media accounts', 
    priority: 'Medium',
    businessImpact: 3,
    technicalComplexity: 3,
    regulatoryFactor: 2,
    usageFrequency: 4,
    testDepthFactor: 3.0,
    minTestCases: 3,
    versions: ['v1.3']
  },
  { 
    id: 'REQ-013', 
    name: 'Account Deletion', 
    description: 'Users must be able to delete their account and all associated data', 
    priority: 'Medium',
    businessImpact: 3,
    technicalComplexity: 3,
    regulatoryFactor: 5,
    usageFrequency: 1,
    testDepthFactor: 3.2,
    minTestCases: 5,
    versions: ['v1.3']
  },
  { 
    id: 'REQ-014', 
    name: 'Activity Logging', 
    description: 'System must log all user activities for audit purposes', 
    priority: 'Medium',
    businessImpact: 3,
    technicalComplexity: 3,
    regulatoryFactor: 5,
    usageFrequency: 5,
    testDepthFactor: 3.6,
    minTestCases: 5,
    versions: ['v1.3']
  },
  { 
    id: 'REQ-015', 
    name: 'User Roles & Permissions', 
    description: 'System must support different user roles with appropriate permissions', 
    priority: 'High',
    businessImpact: 4,
    technicalComplexity: 4,
    regulatoryFactor: 4,
    usageFrequency: 5,
    testDepthFactor: 4.1,
    minTestCases: 8,
    versions: ['v1.3']
  }
];

export default requirements;
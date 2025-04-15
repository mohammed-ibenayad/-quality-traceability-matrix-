// src/data/testcases.js
const testCases = [
  // Version 1.0 - Initial Tests (Good basic coverage, most tests passing)
  { id: 'TC-001', name: 'Valid Login', status: 'Passed', automationStatus: 'Manual', lastExecuted: '2024-08-10', version: 'v1.0' },
  { id: 'TC-002', name: 'Invalid Password', status: 'Passed', automationStatus: 'Manual', lastExecuted: '2024-08-10', version: 'v1.0' },
  { id: 'TC-003', name: 'Password Reset Request', status: 'Passed', automationStatus: 'Manual', lastExecuted: '2024-08-10', version: 'v1.0' },
  { id: 'TC-004', name: 'New User Registration', status: 'Passed', automationStatus: 'Manual', lastExecuted: '2024-08-11', version: 'v1.0' },
  { id: 'TC-005', name: 'Update User Profile', status: 'Passed', automationStatus: 'Manual', lastExecuted: '2024-08-11', version: 'v1.0' },
  { id: 'TC-006', name: 'Email Validation', status: 'Passed', automationStatus: 'Manual', lastExecuted: '2024-08-11', version: 'v1.0' },
  { id: 'TC-007', name: 'Required Form Fields', status: 'Passed', automationStatus: 'Manual', lastExecuted: '2024-08-11', version: 'v1.0' },
  { id: 'TC-008', name: 'Password Reset Completion', status: 'Failed', automationStatus: 'Manual', lastExecuted: '2024-08-10', version: 'v1.0' }, // One failing test
  { id: 'TC-009', name: 'Login with Remember Me', status: 'Passed', automationStatus: 'Manual', lastExecuted: '2024-08-12', version: 'v1.0' },
  { id: 'TC-010', name: 'Registration Form Validation', status: 'Passed', automationStatus: 'Manual', lastExecuted: '2024-08-11', version: 'v1.0' },
  
  // Version 1.1 - Security Enhancements (Higher pass rate, increased automation)
  { id: 'TC-011', name: 'Account Locks After 3 Attempts', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2024-12-05', version: 'v1.1' },
  { id: 'TC-012', name: 'Password Strength Validation', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2024-12-05', version: 'v1.1' },
  { id: 'TC-013', name: 'Session Expires After Timeout', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2024-12-06', version: 'v1.1' },
  { id: 'TC-014', name: 'GDPR Data Access Request', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2024-12-07', version: 'v1.1' },
  { id: 'TC-015', name: 'GDPR Data Export', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2024-12-07', version: 'v1.1' },
  { id: 'TC-016', name: 'Data Encryption Verification', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2024-12-08', version: 'v1.1' },
  { id: 'TC-017', name: 'Password Reset Link Expiration', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2024-12-05', version: 'v1.1' },
  { id: 'TC-018', name: 'Unsuccessful Login Attempts Counter', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2024-12-05', version: 'v1.1' },
  { id: 'TC-019', name: 'Account Unlock After Timeout', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2024-12-05', version: 'v1.1' },
  { id: 'TC-020', name: 'SSL/TLS Connection Verification', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2024-12-08', version: 'v1.1' },
  { id: 'TC-021', name: 'Database Encryption Verification', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2024-12-08', version: 'v1.1' },
  { id: 'TC-022', name: 'Cookie Security Settings', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2024-12-09', version: 'v1.1' },
  { id: 'TC-023', name: 'Concurrent Session Handling', status: 'Failed', automationStatus: 'Automated', lastExecuted: '2024-12-09', version: 'v1.1' }, // One failing test
  { id: 'TC-024', name: 'Password Reset Brute Force Prevention', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2024-12-05', version: 'v1.1' },
  { id: 'TC-025', name: 'GDPR Consent Management', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2024-12-07', version: 'v1.1' },
  
  // Version 1.3 - Advanced Features (Still in progress, high automation but some failures)
  { id: 'TC-026', name: 'SMS 2FA Verification', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2025-04-10', version: 'v1.3' },
  { id: 'TC-027', name: 'Email 2FA Verification', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2025-04-10', version: 'v1.3' },
  { id: 'TC-028', name: 'Authenticator App Integration', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2025-04-10', version: 'v1.3' },
  { id: 'TC-029', name: 'Google OAuth Login', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2025-04-11', version: 'v1.3' },
  { id: 'TC-030', name: 'Facebook OAuth Login', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2025-04-11', version: 'v1.3' },
  { id: 'TC-031', name: 'Account Deletion Request', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2025-04-12', version: 'v1.3' },
  { id: 'TC-032', name: 'Account Data Purge Verification', status: 'Failed', automationStatus: 'Automated', lastExecuted: '2025-04-12', version: 'v1.3' }, // Failing test
  { id: 'TC-033', name: 'Admin User Role Permissions', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2025-04-13', version: 'v1.3' },
  { id: 'TC-034', name: 'Standard User Role Permissions', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2025-04-13', version: 'v1.3' },
  { id: 'TC-035', name: 'Guest User Role Permissions', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2025-04-13', version: 'v1.3' },
  { id: 'TC-036', name: 'Activity Log Generation', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2025-04-14', version: 'v1.3' },
  { id: 'TC-037', name: 'Activity Log Export', status: 'Failed', automationStatus: 'Automated', lastExecuted: '2025-04-14', version: 'v1.3' }, // Failing test
  { id: 'TC-038', name: 'Audit Trail Completeness', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2025-04-14', version: 'v1.3' },
  { id: 'TC-039', name: '2FA Backup Codes', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2025-04-10', version: 'v1.3' },
  { id: 'TC-040', name: '2FA Device Management', status: 'Failed', automationStatus: 'Automated', lastExecuted: '2025-04-10', version: 'v1.3' }, // Failing test
  { id: 'TC-041', name: 'App-specific Password Generation', status: 'Not Run', automationStatus: 'Planned', lastExecuted: '', version: 'v1.3' }, // Not yet run
  { id: 'TC-042', name: 'Permission Assignment by Admin', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2025-04-13', version: 'v1.3' },
  { id: 'TC-043', name: 'Role-based Access Control', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2025-04-13', version: 'v1.3' },
  { id: 'TC-044', name: 'Apple OAuth Login', status: 'Not Run', automationStatus: 'Planned', lastExecuted: '', version: 'v1.3' }, // Not yet run
  { id: 'TC-045', name: 'GDPR Right to be Forgotten', status: 'Not Run', automationStatus: 'Planned', lastExecuted: '', version: 'v1.3' } // Not yet run
];

export default testCases;
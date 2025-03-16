const testCases = [
  { id: 'TC-001', name: 'Valid Login', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2025-03-12', version: 'v2.2' },
  { id: 'TC-002', name: 'Invalid Password', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2025-03-12', version: 'v2.2' },
  { id: 'TC-003', name: 'Invalid Username', status: 'Failed', automationStatus: 'Automated', lastExecuted: '2025-03-12', version: 'v2.2' },
  { id: 'TC-004', name: 'Password Reset Link', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2025-03-11', version: 'v2.2' },
  { id: 'TC-005', name: 'Password Reset Validation', status: 'Not Run', automationStatus: 'Manual', lastExecuted: '2025-03-01', version: 'v2.1' },
  { id: 'TC-006', name: 'Account Locks After 3 Attempts', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2025-03-12', version: 'v2.2' },
  { id: 'TC-007', name: 'Verify Password Requirements', status: 'Not Run', automationStatus: 'Planned', lastExecuted: '', version: '' },
  { id: 'TC-008', name: 'Session Expires After Timeout', status: 'Not Run', automationStatus: 'Planned', lastExecuted: '', version: '' },
  { id: 'TC-009', name: 'Remember Me Functionality', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2025-03-12', version: 'v2.2' },
  { id: 'TC-010', name: 'Brute Force Prevention', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2025-03-12', version: 'v2.3' },
  { id: 'TC-011', name: 'SMS 2FA Verification', status: 'Failed', automationStatus: 'Automated', lastExecuted: '2025-03-10', version: 'v2.3' },
  { id: 'TC-012', name: 'Email 2FA Verification', status: 'Passed', automationStatus: 'Automated', lastExecuted: '2025-03-10', version: 'v2.3' },
  { id: 'TC-013', name: 'Authenticator App Integration', status: 'Not Run', automationStatus: 'Planned', lastExecuted: '', version: '' },
];

export default testCases;
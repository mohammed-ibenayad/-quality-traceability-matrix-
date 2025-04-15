// src/data/mapping.js
// Mapping between requirements and test cases
const mapping = {
  // v1.0 Requirements - Good Basic Coverage (meeting the lower targets for v1.0)
  'REQ-001': ['TC-001', 'TC-002', 'TC-009'], // Login - 3/8 tests (but enough to pass the v1.0 targets)
  'REQ-002': ['TC-003', 'TC-008'], // Password Reset - 2/5 tests
  'REQ-003': ['TC-004', 'TC-010'], // Registration - 2/5 tests
  'REQ-004': ['TC-006', 'TC-007', 'TC-010'], // Form Validations - 3/3 tests (fully covered)
  'REQ-005': ['TC-005'], // User Profile - 1/3 tests
  
  // v1.1 Requirements - Better Coverage (enough to pass the v1.1 targets)
  'REQ-001': ['TC-001', 'TC-002', 'TC-009', 'TC-011', 'TC-018'], // Login - 5/8 tests
  'REQ-002': ['TC-003', 'TC-008', 'TC-017', 'TC-024'], // Password Reset - 4/5 tests
  'REQ-003': ['TC-004', 'TC-010', 'TC-006'], // Registration - 3/5 tests
  'REQ-004': ['TC-006', 'TC-007', 'TC-010'], // Form Validations - 3/3 tests (unchanged)
  'REQ-005': ['TC-005'], // User Profile - 1/3 tests (unchanged)
  'REQ-006': ['TC-011', 'TC-018', 'TC-019'], // Account Lockout - 3/5 tests
  'REQ-007': ['TC-012'], // Password Complexity - 1/3 tests
  'REQ-008': ['TC-013', 'TC-023'], // Session Timeout - 2/3 tests
  'REQ-009': ['TC-014', 'TC-015', 'TC-025'], // GDPR Compliance - 3/8 tests
  'REQ-010': ['TC-016', 'TC-020', 'TC-021', 'TC-022'], // Data Encryption - 4/8 tests
  
  // v1.3 Requirements - Comprehensive Coverage (working toward high v1.3 targets)
  'REQ-001': ['TC-001', 'TC-002', 'TC-009', 'TC-011', 'TC-018', 'TC-029', 'TC-030', 'TC-044'], // Login - 8/8 tests
  'REQ-002': ['TC-003', 'TC-008', 'TC-017', 'TC-024', 'TC-039'], // Password Reset - 5/5 tests
  'REQ-003': ['TC-004', 'TC-010', 'TC-006', 'TC-012', 'TC-016'], // Registration - 5/5 tests
  'REQ-004': ['TC-006', 'TC-007', 'TC-010'], // Form Validations - 3/3 tests
  'REQ-005': ['TC-005', 'TC-032', 'TC-036'], // User Profile - 3/3 tests
  'REQ-006': ['TC-011', 'TC-018', 'TC-019', 'TC-041', 'TC-040'], // Account Lockout - 5/5 tests
  'REQ-007': ['TC-012', 'TC-017', 'TC-024'], // Password Complexity - 3/3 tests
  'REQ-008': ['TC-013', 'TC-023', 'TC-036'], // Session Timeout - 3/3 tests
  'REQ-009': ['TC-014', 'TC-015', 'TC-025', 'TC-031', 'TC-032', 'TC-045', 'TC-038', 'TC-037'], // GDPR Compliance - 8/8 tests
  'REQ-010': ['TC-016', 'TC-020', 'TC-021', 'TC-022', 'TC-036', 'TC-037', 'TC-038', 'TC-043'], // Data Encryption - 8/8 tests
  'REQ-011': ['TC-026', 'TC-027', 'TC-028', 'TC-039', 'TC-040'], // Multi-factor Auth - 5/5 tests
  'REQ-012': ['TC-029', 'TC-030', 'TC-044'], // Social Media Integration - 3/3 tests
  'REQ-013': ['TC-031', 'TC-032', 'TC-045'], // Account Deletion - 3/5 tests
  'REQ-014': ['TC-036', 'TC-037', 'TC-038'], // Activity Logging - 3/5 tests
  'REQ-015': ['TC-033', 'TC-034', 'TC-035', 'TC-042', 'TC-043'], // User Roles & Permissions - 5/8 tests
};

export default mapping;
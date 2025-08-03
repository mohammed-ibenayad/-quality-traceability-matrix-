// src/data/testcases.js
// Generated from public/sample-testcases.jsonc - SAMPLE DATA
const testCases = [
  {
    "id": "SAMPLE-TC-001",
    "name": "[SAMPLE] Login with valid credentials",
    "description": "[DEMO] Verify that a user can successfully log in using valid credentials and is redirected to the dashboard",
    "steps": [
      "Navigate to the login page",
      "Enter valid username in the username field",
      "Enter valid password in the password field",
      "Click the Login button"
    ],
    "expectedResult": "User should be successfully logged in and redirected to the dashboard with a welcome message",
    "priority": "High",
    "status": "Not Run",
    "automationStatus": "Automated",
    "applicableVersions": [
      "sample-v1.0"
    ],
    "requirementIds": [
      "SAMPLE-REQ-001",
      "SAMPLE-REQ-002"
    ],
    "tags": [
      "Sample",
      "Authentication",
      "Login",
      "Smoke Test"
    ],
    "category": "Authentication",
    "preconditions": "User account must exist in the system with valid credentials",
    "testData": "Valid username: testuser@example.com, Valid password: TestPass123!",
    "assignee": "[SAMPLE] QA Team",
    "estimatedDuration": 2,
    "automationPath": "tests/authentication/test_valid_login.py",
    "lastExecuted": null,
    "executedBy": ""
  },
  {
    "id": "SAMPLE-TC-002",
    "name": "[SAMPLE] Login with invalid credentials",
    "description": "[DEMO] Verify that appropriate error message is displayed when user attempts to login with invalid credentials",
    "steps": [
      "Navigate to the login page",
      "Enter invalid username in the username field",
      "Enter invalid password in the password field",
      "Click the Login button",
      "Verify error message is displayed"
    ],
    "expectedResult": "Error message should be displayed: 'Invalid username or password. Please try again.'",
    "priority": "Medium",
    "status": "Not Run",
    "automationStatus": "Automated",
    "applicableVersions": [
      "sample-v1.0"
    ],
    "requirementIds": [
      "SAMPLE-REQ-001"
    ],
    "tags": [
      "Sample",
      "Authentication",
      "Login",
      "Negative Testing",
      "Security"
    ],
    "category": "Authentication",
    "preconditions": "Login page must be accessible",
    "testData": "Invalid username: invalid@test.com, Invalid password: wrongpass",
    "assignee": "[SAMPLE] Security Team",
    "estimatedDuration": 1,
    "automationPath": "tests/authentication/test_invalid_login.py",
    "lastExecuted": null,
    "executedBy": ""
  },
  {
    "id": "SAMPLE-TC-003",
    "name": "[SAMPLE] Dashboard Elements Display",
    "description": "[DEMO] Verify that all essential dashboard elements are properly displayed on the homepage",
    "steps": [
      "Navigate to the homepage/dashboard",
      "Verify top bar with currency switcher is displayed",
      "Verify header with logo and navigation is visible",
      "Verify main navigation categories are present",
      "Verify featured product cards display complete information",
      "Verify brand logos section is visible",
      "Verify footer is displayed with all required links"
    ],
    "expectedResult": "All dashboard elements should be properly displayed and formatted according to design specifications",
    "priority": "High",
    "status": "Not Run",
    "automationStatus": "Manual",
    "applicableVersions": [
      "sample-v1.0"
    ],
    "requirementIds": [
      "SAMPLE-REQ-002"
    ],
    "tags": [
      "Sample",
      "Dashboard",
      "UI",
      "Display",
      "Homepage"
    ],
    "category": "User Interface",
    "preconditions": "Application must be accessible and homepage must load successfully",
    "testData": "N/A - Visual verification test",
    "assignee": "[SAMPLE] QA Team",
    "estimatedDuration": 3,
    "automationPath": "",
    "lastExecuted": null,
    "executedBy": ""
  },
  {
    "id": "SAMPLE-TC-004",
    "name": "[SAMPLE] Dashboard Interaction Functionality",
    "description": "[DEMO] Verify that users can interact with all dashboard elements and navigation works correctly",
    "steps": [
      "Navigate to the homepage/dashboard",
      "Click on different navigation categories",
      "Test currency switcher functionality",
      "Click on product cards to view details",
      "Test wishlist and cart addition features",
      "Verify account navigation works",
      "Test all clickable elements for proper redirection"
    ],
    "expectedResult": "All interactive elements should respond correctly and redirect to appropriate pages/functions",
    "priority": "High",
    "status": "Not Run",
    "automationStatus": "Automated",
    "applicableVersions": [
      "sample-v1.0"
    ],
    "requirementIds": [
      "SAMPLE-REQ-003"
    ],
    "tags": [
      "Sample",
      "Interactions",
      "Navigation",
      "User Experience"
    ],
    "category": "Functionality",
    "preconditions": "Dashboard must be accessible and all elements must be loaded",
    "testData": "Various product IDs and navigation paths for testing",
    "assignee": "[SAMPLE] Frontend Team",
    "estimatedDuration": 4,
    "automationPath": "tests/frontend/test_dashboard_interactions.py",
    "lastExecuted": null,
    "executedBy": ""
  }
];

export default testCases;
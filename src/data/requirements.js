// src/data/requirements.js
// Generated from public/sample-requirements.jsonc
const requirements = [
  {
    "id": "SAMPLE-REQ-001",
    "name": "[SAMPLE] User Authentication",
    "description": "[DEMO] Users should be able to log in to their account using valid credentials.",
    "priority": "High",
    "type": "Functional",
    "businessImpact": 5,
    "technicalComplexity": 3,
    "regulatoryFactor": 3,
    "usageFrequency": 4,
    "testDepthFactor": 3.9,
    "minTestCases": 5,
    "versions": [
      "sample-v1.0"
    ],
    "status": "Active",
    "owner": "[SAMPLE] Authentication Team",
    "tags": [
      "Sample",
      "Authentication",
      "Account",
      "Security"
    ]
  },
  {
    "id": "SAMPLE-REQ-002",
    "name": "[SAMPLE] Dashboard Content and Display",
    "description": "[DEMO] The homepage dashboard should display all essential e-commerce elements including top bar with currency switcher and account options, header with logo and navigation, main navigation categories, featured product cards with complete information, brand logos section, and footer.",
    "priority": "High",
    "type": "Functional",
    "businessImpact": 5,
    "technicalComplexity": 3,
    "regulatoryFactor": 2,
    "usageFrequency": 5,
    "testDepthFactor": 3.8,
    "minTestCases": 5,
    "versions": [
      "sample-v1.0"
    ],
    "status": "Active",
    "owner": "[SAMPLE] Frontend Team",
    "tags": [
      "Sample",
      "Dashboard",
      "Homepage",
      "UI",
      "Display",
      "E-commerce"
    ]
  },
  {
    "id": "SAMPLE-REQ-003",
    "name": "[SAMPLE] Interactions with Dashboard Elements",
    "description": "[DEMO] Users should be able to interact with all dashboard elements including navigation between categories, adding products to wishlist and cart, accessing cart summary, product comparison, currency switching, account navigation, and all clickable elements with proper redirection functionality.",
    "priority": "High",
    "type": "Functional",
    "businessImpact": 5,
    "technicalComplexity": 4,
    "regulatoryFactor": 2,
    "usageFrequency": 5,
    "testDepthFactor": 4.1,
    "minTestCases": 8,
    "versions": [
      "sample-v1.0"
    ],
    "status": "Active",
    "owner": "[SAMPLE] Frontend Team",
    "tags": [
      "Sample",
      "Interactions",
      "Navigation",
      "User Experience",
      "Functionality"
    ]
  }
];

export default requirements;
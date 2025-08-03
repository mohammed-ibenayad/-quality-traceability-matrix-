// src/data/versions.js
// SAMPLE DATA - Single demo version for testing
const versions = [
  {
    "id": "sample-v1.0",
    "name": "[SAMPLE] Demo Version 1.0",
    "releaseDate": "2024-08-15",
    "status": "Released",
    "qualityGates": [
      {
        "id": "critical_req_coverage",
        "name": "Critical Requirements Test Coverage",
        "target": 60,
        "actual": 0,
        "status": "passed"
      },
      {
        "id": "test_pass_rate",
        "name": "Test Pass Rate",
        "target": 75,
        "actual": 0,
        "status": "passed"
      },
      {
        "id": "overall_req_coverage",
        "name": "Overall Requirements Coverage",
        "target": 50,
        "actual": 0,
        "status": "passed"
      }
    ]
  }
];

export default versions;
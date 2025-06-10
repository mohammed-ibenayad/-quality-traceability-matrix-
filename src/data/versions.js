// src/data/versions.js
// Enhanced version data for converted sample files
const versions = [
  {
    "id": "v1.0",
    "name": "Version 1.0",
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
  },
  {
    "id": "v1.1",
    "name": "Version 1.1",
    "releaseDate": "2024-12-01",
    "status": "Planned",
    "qualityGates": [
      {
        "id": "critical_req_coverage",
        "name": "Critical Requirements Test Coverage",
        "target": 80,
        "actual": 0,
        "status": "failed"
      },
      {
        "id": "test_pass_rate",
        "name": "Test Pass Rate",
        "target": 85,
        "actual": 0,
        "status": "failed"
      },
      {
        "id": "overall_req_coverage",
        "name": "Overall Requirements Coverage",
        "target": 70,
        "actual": 0,
        "status": "failed"
      }
    ]
  }
];

export default versions;
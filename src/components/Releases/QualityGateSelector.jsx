import React from 'react';

/**
 * Predefined quality gates that can be selected for a release
 */
export const PREDEFINED_QUALITY_GATES = [
  // Core Test Coverage Gates
  {
    id: 'critical_req_coverage',
    name: 'Critical Requirements Test Coverage',
    description: 'Percentage of high-priority requirements that have sufficient test coverage',
    category: 'Coverage',
    defaultTarget: 100,
    calculateActual: (requirements, testCases, mapping, coverage) => {
      const highPriorityReqs = requirements.filter(req => req.priority === 'High');
      if (highPriorityReqs.length === 0) return 0;
      
      const highPriorityWithCoverage = highPriorityReqs.filter(req => {
        const reqCoverage = coverage.find(c => c.reqId === req.id);
        return reqCoverage && reqCoverage.meetsMinimum;
      });
      
      return Math.round((highPriorityWithCoverage.length / highPriorityReqs.length) * 100);
    }
  },
  {
    id: 'overall_req_coverage',
    name: 'Overall Requirements Coverage',
    description: 'Percentage of all requirements that meet their minimum test case threshold',
    category: 'Coverage',
    defaultTarget: 90,
    calculateActual: (requirements, testCases, mapping, coverage) => {
      if (requirements.length === 0) return 0;
      
      const reqsWithSufficientCoverage = coverage.filter(c => c.meetsMinimum);
      return Math.round((reqsWithSufficientCoverage.length / requirements.length) * 100);
    }
  },  
  // Test Execution Gates
  {
    id: 'test_pass_rate',
    name: 'Test Pass Rate',
    description: 'Percentage of test cases that are passing',
    category: 'Execution',
    defaultTarget: 95,
    calculateActual: (requirements, testCases, mapping, coverage) => {
      if (testCases.length === 0) return 0;
      
      const passingTests = testCases.filter(tc => tc.status === 'Passed');
      return Math.round((passingTests.length / testCases.length) * 100);
    }
  },   
  
  // Automation Gates
  {
    id: 'automation_coverage',
    name: 'Automation Coverage',
    description: 'Percentage of test cases that are automated',
    category: 'Automation',
    defaultTarget: 80,
    calculateActual: (requirements, testCases, mapping, coverage) => {
      if (testCases.length === 0) return 0;
      
      const automatedTests = testCases.filter(tc => tc.automationStatus === 'Automated');
      return Math.round((automatedTests.length / testCases.length) * 100);
    }
  },
  {
    id: 'high_priority_automation',
    name: 'High-Priority Automation',
    description: 'Percentage of high-priority requirement tests that are automated',
    category: 'Automation',
    defaultTarget: 90,
    calculateActual: (requirements, testCases, mapping, coverage) => {
      const highPriorityReqIds = requirements
        .filter(req => req.priority === 'High')
        .map(req => req.id);
      
      let highPriorityTests = [];
      highPriorityReqIds.forEach(reqId => {
        const testIds = mapping[reqId] || [];
        highPriorityTests = [...highPriorityTests, ...testIds];
      });
      
      // Remove duplicates
      highPriorityTests = [...new Set(highPriorityTests)];
      
      if (highPriorityTests.length === 0) return 0;
      
      const automatedHighPriorityTests = highPriorityTests.filter(tcId => {
        const tc = testCases.find(t => t.id === tcId);
        return tc && tc.automationStatus === 'Automated';
      });
      
      return Math.round((automatedHighPriorityTests.length / highPriorityTests.length) * 100);
    }
  },
  
  // Quality Risk Gates
  {
    id: 'business_impact_coverage',
    name: 'High Business Impact Coverage',
    description: 'Test coverage for requirements with high business impact rating (4-5)',
    category: 'Risk',
    defaultTarget: 95,
    calculateActual: (requirements, testCases, mapping, coverage) => {
      const highImpactReqs = requirements.filter(req => req.businessImpact >= 4);
      
      if (highImpactReqs.length === 0) return 0;
      
      const highImpactWithCoverage = highImpactReqs.filter(req => {
        const reqCoverage = coverage.find(c => c.reqId === req.id);
        return reqCoverage && reqCoverage.meetsMinimum;
      });
      
      return Math.round((highImpactWithCoverage.length / highImpactReqs.length) * 100);
    }
  },  
  {
    id: 'risk_area_mitigation',
    name: 'Risk Area Mitigation',
    description: 'Percentage of identified risk areas with passing tests',
    category: 'Risk',
    defaultTarget: 90,
    calculateActual: (requirements, testCases, mapping, coverage) => {
      // Define risk areas as requirements with high priority and high business impact
      const riskAreas = requirements.filter(req => 
        req.priority === 'High' && req.businessImpact >= 4
      );
      
      if (riskAreas.length === 0) return 0;
      
      const riskAreaIds = riskAreas.map(req => req.id);
      
      const mitigatedRiskAreas = riskAreaIds.filter(reqId => {
        const testIds = mapping[reqId] || [];
        if (testIds.length === 0) return false;
        
        // Check if at least 80% of tests are passing for this requirement
        const passingTests = testIds.filter(tcId => {
          const tc = testCases.find(t => t.id === tcId);
          return tc && tc.status === 'Passed';
        });
        
        return (passingTests.length / testIds.length) >= 0.8;
      });
      
      return Math.round((mitigatedRiskAreas.length / riskAreaIds.length) * 100);
    }
  },
  
  // Technical Quality Gates
  {
    id: 'test_depth_compliance',
    name: 'Test Depth Factor Compliance',
    description: 'Percentage of requirements meeting their test depth factor targets',
    category: 'Technical',
    defaultTarget: 85,
    calculateActual: (requirements, testCases, mapping, coverage) => {
      if (requirements.length === 0) return 0;
      
      const compliantReqs = requirements.filter(req => {
        const reqCoverage = coverage.find(c => c.reqId === req.id);
        return reqCoverage && reqCoverage.meetsMinimum;
      });
      
      return Math.round((compliantReqs.length / requirements.length) * 100);
    }
  },  
];

/**
 * Component for selecting predefined quality gates
 */
const QualityGateSelector = ({ 
  selectedGates, 
  onAddGate, 
  onRemoveGate, 
  onUpdateGate 
}) => {
  // Group gates by category for the dropdown
  const gatesByCategory = PREDEFINED_QUALITY_GATES.reduce((acc, gate) => {
    if (!acc[gate.category]) {
      acc[gate.category] = [];
    }
    acc[gate.category].push(gate);
    return acc;
  }, {});
  
  // Check if a gate is already selected
  const isGateSelected = (gateId) => {
    return selectedGates.some(g => g.id === gateId);
  };
  
  // Handle adding a new gate
  const handleAddGate = (e) => {
    const gateId = e.target.value;
    if (gateId && !isGateSelected(gateId)) {
      const gateDefinition = PREDEFINED_QUALITY_GATES.find(g => g.id === gateId);
      
      const newGate = {
        id: gateId,
        name: gateDefinition.name,
        target: gateDefinition.defaultTarget,
        actual: 0, // This will be calculated elsewhere
        status: 'failed',
        isInverted: gateDefinition.isInverted || false
      };
      
      onAddGate(newGate);
      
      // Reset dropdown
      e.target.value = '';
    }
  };
  
  // Handle changing a gate's target
  const handleTargetChange = (gateId, newTarget) => {
    onUpdateGate(gateId, { target: Number(newTarget) });
  };

  return (
    <div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Add Quality Gate
        </label>
        <select
          value=""
          onChange={handleAddGate}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="">Select a quality gate...</option>
          
          {Object.entries(gatesByCategory).map(([category, gates]) => (
            <optgroup key={category} label={category}>
              {gates.map(gate => (
                <option 
                  key={gate.id} 
                  value={gate.id}
                  disabled={isGateSelected(gate.id)}
                >
                  {gate.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      
      {selectedGates.length > 0 && (
        <div>
          <div className="grid grid-cols-12 gap-2 mb-2 text-xs text-gray-500">
            <div className="col-span-6">Gate</div>
            <div className="col-span-2">Target</div>
            <div className="col-span-2">Actual</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1"></div>
          </div>
          
          {selectedGates.map((gate, index) => {
            // Find the gate definition for additional info
            const gateDefinition = PREDEFINED_QUALITY_GATES.find(g => g.id === gate.id);
            
            return (
              <div key={gate.id} className="grid grid-cols-12 gap-2 mb-2 items-center">
                <div className="col-span-6">
                  <div className="text-sm font-medium">{gate.name}</div>
                  {gateDefinition && (
                    <div className="text-xs text-gray-500">{gateDefinition.description}</div>
                  )}
                </div>
                
                <div className="col-span-2">
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={gate.target}
                      onChange={(e) => handleTargetChange(gate.id, e.target.value)}
                      min="0"
                      max={gate.isInverted ? "10" : "100"}
                      step={gate.isInverted ? "0.1" : "1"}
                      className="w-16 p-1 border border-gray-300 rounded text-sm"
                    />
                    {!gate.isInverted && <span className="ml-1">%</span>}
                  </div>
                </div>
                
                <div className="col-span-2">
                  <div className="text-sm">
                    {gate.actual}{!gate.isInverted && '%'}
                  </div>
                </div>
                
                <div className="col-span-1">
                  <span className={`inline-block w-3 h-3 rounded-full ${
                    gate.status === 'passed' ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                </div>
                
                <div className="col-span-1">
                  <button
                    type="button"
                    onClick={() => onRemoveGate(gate.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    &times;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QualityGateSelector;
import React from 'react';
import { PREDEFINED_QUALITY_GATES } from '../Releases/QualityGateSelector';

const QualityGatesTable = ({ qualityGates }) => {
  // If no quality gates data, show a placeholder message
  if (!qualityGates || qualityGates.length === 0) {
    return (
      <div className="bg-white rounded shadow overflow-hidden mb-6">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Release Quality Gates</h2>
        </div>
        <div className="p-8 text-center text-gray-500">
          <p>No quality gates defined for this version</p>
        </div>
      </div>
    );
  }
  
  const passedGates = qualityGates.filter(gate => gate.status === 'passed').length;
  const totalGates = qualityGates.length;
  
  // Group gates by category for better organization
  const groupedGates = qualityGates.reduce((acc, gate) => {
    // Find the gate definition to get its category
    const gateDefinition = PREDEFINED_QUALITY_GATES.find(g => g.id === gate.id);
    const category = gateDefinition?.category || 'Other';
    
    if (!acc[category]) {
      acc[category] = [];
    }
    
    acc[category].push({
      ...gate,
      description: gateDefinition?.description || '',
      isInverted: gateDefinition?.isInverted || false
    });
    
    return acc;
  }, {});
  
  // Order categories for consistent display
  const orderedCategories = ['Coverage', 'Execution', 'Automation', 'Risk', 'Technical'];
  
  return (
    <div className="bg-white rounded shadow overflow-hidden mb-6">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">Release Quality Gates</h2>
        <div className="text-sm">
          <span className="font-medium">{passedGates}/{totalGates}</span> gates passed
        </div>
      </div>
      
      {Object.entries(groupedGates).sort(([a], [b]) => {
        // Sort categories in predefined order
        const indexA = orderedCategories.indexOf(a);
        const indexB = orderedCategories.indexOf(b);
        
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      }).map(([category, gates]) => (
        <div key={category} className="border-b last:border-b-0">
          <div className="px-6 py-2 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700">{category}</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quality Gate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {gates.map((gate, index) => (
                <tr key={gate.id || index}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{gate.name}</div>
                    {gate.description && (
                      <div className="text-xs text-gray-500">{gate.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {gate.target}{!gate.isInverted && '%'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {gate.actual}{!gate.isInverted && '%'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      gate.status === 'passed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {gate.status === 'passed' ? 'Passed' : 'Failed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default QualityGatesTable;
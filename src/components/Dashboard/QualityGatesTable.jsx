import React from 'react';

const QualityGatesTable = ({ qualityGates }) => {
  if (!qualityGates || qualityGates.length === 0) return null;
  
  const passedGates = qualityGates.filter(gate => gate.status === 'passed').length;
  const totalGates = qualityGates.length;
  
  return (
    <div className="bg-white rounded shadow overflow-hidden mb-6">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">Release Quality Gates</h2>
        <div className="text-sm">
          <span className="font-medium">{passedGates}/{totalGates}</span> gates passed
        </div>
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
          {qualityGates.map((gate, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {gate.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {gate.target}%
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {gate.actual}%
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
  );
};

export default QualityGatesTable;
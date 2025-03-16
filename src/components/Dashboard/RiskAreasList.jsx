import React from 'react';
import { Link } from 'react-router-dom';

const RiskAreasList = ({ riskAreas }) => {
  // Handle both null/undefined and empty array cases
  if (!riskAreas || riskAreas.length === 0) {
    return (
      <div className="bg-white rounded shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Risk Areas</h2>
        <div className="text-center py-4 text-gray-500">
          No risk areas detected for this version
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded shadow overflow-hidden mb-6">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">High-Risk Areas</h2>
      </div>
      <ul className="divide-y divide-gray-200">
        {riskAreas.map(area => (
          <li key={area.id} className="p-4 hover:bg-gray-50">
            <div className="flex items-start">
              <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                area.impact >= 5 ? 'bg-red-500' : 
                area.impact >= 4 ? 'bg-orange-500' : 'bg-yellow-500'
              }`}></div>
              <div className="ml-3 flex-1">
                <div className="flex justify-between">
                  <Link to={`/matrix?req=${area.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                    {area.id}: {area.name}
                  </Link>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    area.reason === 'Failing Tests' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {area.reason}
                  </span>
                </div>
                <div className="mt-1 flex items-center text-xs text-gray-500">
                  <span className="mr-2">Coverage: {area.coverage}%</span>
                  <span className="mr-2">|</span>
                  <span>Pass Rate: {area.passRate}%</span>
                </div>
                <div className="mt-2 flex space-x-1">
                  <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                    Business Impact: {area.impact}/5
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RiskAreasList;
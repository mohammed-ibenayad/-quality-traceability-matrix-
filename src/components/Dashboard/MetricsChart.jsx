import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MetricsChart = ({ data }) => {
  // If no data provided, show a placeholder message
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Test Metrics by Requirement</h2>
        <div className="h-72 flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-500">
            <p>No test metrics data available</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-lg font-semibold mb-4">Test Metrics by Requirement</h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="reqId" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="totalTests" name="Total Tests" fill="#8884d8" />
            <Bar dataKey="automatedTests" name="Automated Tests" fill="#82ca9d" />
            <Bar dataKey="passedTests" name="Passed Tests" fill="#4CAF50" />
            <Bar dataKey="minTestCases" name="Min Required" fill="#ff8042" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MetricsChart;
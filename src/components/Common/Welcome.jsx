import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Welcome component for new users
 */
const Welcome = () => {
  return (
    <div className="bg-white p-8 rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Quality Tracker</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          This tool helps you manage the quality of your software releases by tracking the relationship 
          between requirements and test cases.
        </p>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-blue-800 mb-3">Getting Started</h2>
        <p className="text-blue-700 mb-4">
          There is no data in the system yet. To get started:
        </p>
        <ol className="list-decimal pl-6 text-blue-700 space-y-2">
          <li>Import your requirements using the Requirements tab below</li>
          <li>Import your test cases using the Test Cases tab</li>
          <li>View the Traceability Matrix to see the relationship between requirements and tests</li>
          <li>Check the Dashboard for quality metrics and release health</li>
        </ol>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            What are Requirements?
          </h3>
          <p className="text-gray-600 mb-4">
            Requirements define what your software should do. Each requirement has attributes like priority and
            business impact that determine how thoroughly it should be tested.
          </p>
          <div className="bg-white p-3 rounded border text-sm">
            <div><strong>Example:</strong> REQ-001: User Login</div>
            <div className="text-gray-500">Priority: High, Business Impact: 5/5</div>
          </div>
        </div>
        
        <div className="border rounded-lg p-6 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            What are Test Cases?
          </h3>
          <p className="text-gray-600 mb-4">
            Test cases verify that your requirements work correctly. Each test case can be automated or manual,
            and tracks its execution status (Passed, Failed, Not Run).
          </p>
          <div className="bg-white p-3 rounded border text-sm">
            <div><strong>Example:</strong> TC-001: Valid Login</div>
            <div className="text-gray-500">Status: Passed, Automation: Automated</div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-center">
        <div className="inline-flex shadow-sm rounded-md">
          <Link
            to="#requirements-tab"
            className="px-5 py-3 bg-blue-600 text-white font-medium rounded-l-md hover:bg-blue-700"
          >
            Import Requirements
          </Link>
          <Link
            to="#testcases-tab"
            className="px-5 py-3 bg-green-600 text-white font-medium rounded-r-md hover:bg-green-700"
          >
            Import Test Cases
          </Link>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <button
          className="text-blue-600 hover:underline text-sm"
          onClick={() => {
            // This would load sample data via the DataStore
            window.loadSampleData && window.loadSampleData();
          }}
        >
          Or load sample data to explore the application
        </button>
      </div>
    </div>
  );
};

export default Welcome;
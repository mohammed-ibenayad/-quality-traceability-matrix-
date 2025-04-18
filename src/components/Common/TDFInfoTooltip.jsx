import React from 'react';
import Tooltip from './Tooltip';

// src/components/Common/TDFInfoTooltip.jsx
const TDFInfoTooltip = () => {
  return (
    <Tooltip
      content={
        <div className="w-96">
          <h4 className="font-medium mb-2">Test Depth Factor (TDF)</h4>
          
          <p className="mb-3">
            A measure of how thoroughly a requirement needs to be tested based on its importance, complexity, and risk profile.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-xs font-medium mb-1">Factor Weights:</p>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Business Impact:</span>
                  <span className="font-medium">40%</span>
                </div>
                <div className="flex justify-between">
                  <span>Technical Complexity:</span>
                  <span className="font-medium">30%</span>
                </div>
                <div className="flex justify-between">
                  <span>Regulatory Factor:</span>
                  <span className="font-medium">20%</span>
                </div>
                <div className="flex justify-between">
                  <span>Usage Frequency:</span>
                  <span className="font-medium">10%</span>
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-xs font-medium mb-1">Required Tests:</p>
              <div className="text-xs space-y-1">
                <div><span className="font-medium">TDF 4.1-5.0:</span> 8+ tests</div>
                <div><span className="font-medium">TDF 3.1-4.0:</span> 5-7 tests</div>
                <div><span className="font-medium">TDF 2.1-3.0:</span> 3-5 tests</div>
                <div><span className="font-medium">TDF 1.0-2.0:</span> 1-2 tests</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-700 p-2 rounded mb-3">
            <p className="text-xs font-medium mb-1">Example Calculation:</p>
            <div className="text-xs mb-1">For a requirement with ratings:</div>
            <div className="grid grid-cols-4 gap-1 text-xs mb-1">
              <div>Business: <strong>4</strong></div>
              <div>Technical: <strong>3</strong></div>
              <div>Regulatory: <strong>5</strong></div>
              <div>Usage: <strong>4</strong></div>
            </div>
            <div className="text-xs mb-1">TDF = (4 × 0.4) + (3 × 0.3) + (5 × 0.2) + (4 × 0.1)</div>
            <div className="text-xs mb-1">TDF = 1.6 + 0.9 + 1.0 + 0.4 = <strong>3.9</strong></div>
            <div className="text-xs font-medium">Result: This requirement requires 5-7 test cases</div>
          </div>
          
          <div className="border-t border-gray-600 pt-2">
            <p className="text-xs font-medium mb-1">Coverage Metrics Explained:</p>
            <div className="text-xs space-y-1">
              <div className="mb-1"><span className="font-medium">Test Depth Coverage:</span> Percentage of requirements that have enough test cases to meet their minimum threshold (based on TDF).</div>
              <div className="mb-1"><span className="font-medium">Overall Test Coverage:</span> Total test cases defined divided by total minimum test cases required across all requirements.</div>
              <div><span className="font-medium">Health Score:</span> Weighted assessment combining test pass rate, coverage metrics, and automation rate.</div>
            </div>
          </div>
        </div>
      }
      position="bottom"
      width="w-96"
    >
      <svg className="w-4 h-4 ml-1 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
      </svg>
    </Tooltip>
  );
};

export default TDFInfoTooltip;
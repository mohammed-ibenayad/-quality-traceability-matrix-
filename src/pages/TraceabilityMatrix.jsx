import React, { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import MatrixTable from '../components/TraceabilityMatrix/MatrixTable';
import EmptyState from '../components/Common/EmptyState';
import { useVersionContext } from '../context/VersionContext';
import { calculateCoverage } from '../utils/coverage';
import dataStore from '../services/DataStore';

/**
 * Helper function to check if a test case applies to a version
 * @param {Object} testCase - Test case object
 * @param {string} selectedVersion - Currently selected version
 * @returns {boolean} True if test case applies to the version
 */
const testCaseAppliesTo = (testCase, selectedVersion) => {
  if (selectedVersion === 'unassigned') return true;

  // Handle new format
  if (testCase.applicableVersions) {
    // Empty array means applies to all versions
    if (testCase.applicableVersions.length === 0) return true;
    return testCase.applicableVersions.includes(selectedVersion);
  }

  // Handle legacy format during transition
  return !testCase.version || testCase.version === selectedVersion || testCase.version === '';
};

/**
 * Helper function to get display text for test case versions
 * @param {Object} testCase - Test case object
 * @returns {string} Display text for versions
 */
const getVersionDisplayText = (testCase) => {
  // Handle new format
  if (testCase.applicableVersions) {
    if (testCase.applicableVersions.length === 0) {
      return 'All';
    }
    return testCase.applicableVersions.length > 2
      ? `${testCase.applicableVersions.length} versions`
      : testCase.applicableVersions.join(', ');
  }

  // Handle legacy format
  return testCase.version || 'All';
};

const TraceabilityMatrix = () => {
  // State for collapsed test case view
  const [collapseTestCases, setCollapseTestCases] = useState(true);
  const [expandedRequirement, setExpandedRequirement] = useState(null);

  // State to hold the data from DataStore
  const [requirements, setRequirements] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [mapping, setMapping] = useState({});
  const [hasData, setHasData] = useState(false);

  // Get the version context
  const { selectedVersion } = useVersionContext();

  // Load data from DataStore
  useEffect(() => {
    // Get data from DataStore
    setRequirements(dataStore.getRequirements());
    setTestCases(dataStore.getTestCases());
    setMapping(dataStore.getMapping());
    setHasData(dataStore.hasData());

    // Subscribe to DataStore changes
    const unsubscribe = dataStore.subscribe(() => {
      setRequirements(dataStore.getRequirements());
      setTestCases(dataStore.getTestCases());
      setMapping(dataStore.getMapping());
      setHasData(dataStore.hasData());
    });

    // Clean up subscription
    return () => unsubscribe();
  }, []);

  // Calculate coverage based on current data and selected version
  const coverage = React.useMemo(() => {
    return calculateCoverage(requirements, mapping, testCases);
  }, [requirements, mapping, testCases]);

  // Version-specific coverage
  const versionCoverage = React.useMemo(() => {
    if (selectedVersion === 'unassigned') {
      return coverage;
    }
    // Pass filtered test cases to calculateCoverage
    const filteredTests = testCases.filter(tc => testCaseAppliesTo(tc, selectedVersion));
    return calculateCoverage(requirements, mapping, filteredTests);
  }, [requirements, mapping, testCases, selectedVersion, coverage]);

  // Filter requirements and test cases by selected version
  const filteredRequirements = selectedVersion === 'unassigned'
    ? requirements // Show all requirements for "unassigned"
    : requirements.filter(req => req.versions && req.versions.includes(selectedVersion));

  // Change 1 & 5: Update Test Case Filtering in Matrix Logic and Simplify
  const filteredTestCases = selectedVersion === 'unassigned'
    ? testCases
    : testCases.filter(tc => testCaseAppliesTo(tc, selectedVersion));

  // Toggle test case view
  const toggleTestCaseView = () => {
    setCollapseTestCases(!collapseTestCases);
    setExpandedRequirement(null);
  };

  // Toggle specific requirement expansion
  const toggleRequirementExpansion = (reqId) => {
    setExpandedRequirement(expandedRequirement === reqId ? null : reqId);
  };

  // Calculate summary statistics
  const summary = React.useMemo(() => {
    if (!hasData) {
      console.log("TraceabilityMatrix: No data, returning default summary.");
      return {
        totalRequirements: 0,
        reqWithTests: 0,
        reqFullyAutomated: 0,
        reqFullyPassed: 0,
        totalTestCases: 0, // Ensure this is initialized
        multiVersionTests: 0,
        universalTests: 0
      };
    }

    const totalRequirements = filteredRequirements.length;

    // Count requirements with tests - Change 2 & 5: Update Coverage Calculation Logic and Simplify
    const reqWithTests = filteredRequirements.filter(req =>
      (mapping[req.id] || []).some(tcId => {
        const tc = testCases.find(t => t.id === tcId);
        return tc && testCaseAppliesTo(tc, selectedVersion);
      })
    ).length;

    // Count fully automated requirements
    const reqFullyAutomated = versionCoverage.filter(stat =>
      stat.automationPercentage === 100 && stat.totalTests > 0
    ).length;

    // Count fully passed requirements
    const reqFullyPassed = versionCoverage.filter(stat =>
      stat.passPercentage === 100 && stat.totalTests > 0
    ).length;

    // Change 7: Calculate matrix statistics using new format
    const totalTests = testCases.filter(tc => testCaseAppliesTo(tc, selectedVersion)).length;

    // Additional statistics for multi-version support
    const multiVersionTests = testCases.filter(tc =>
      tc.applicableVersions && tc.applicableVersions.length > 1
    ).length;

    const universalTests = testCases.filter(tc =>
      (tc.applicableVersions && tc.applicableVersions.length === 0) ||
      (!tc.applicableVersions && !tc.version) // Also consider legacy empty version as universal
    ).length;

    console.log("TraceabilityMatrix: Calculated summary with data.");
    return {
      totalRequirements,
      reqWithTests,
      reqFullyAutomated,
      reqFullyPassed,
      totalTestCases: totalTests, // Ensure this uses the calculated totalTests
      multiVersionTests,
      universalTests
    };
  }, [filteredRequirements, filteredTestCases, mapping, testCases, versionCoverage, selectedVersion, hasData]);

  return (
    <MainLayout
      title="Requirements-Test Case Traceability Matrix"
      hasData={hasData}
    >
      {!hasData ? (
        <EmptyState
          title="No Requirements or Test Cases Found"
          message="To build your traceability matrix, you need to import requirements and test cases first."
          actionText="Import Data"
          actionPath="/import"
          icon="requirements"
        />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded shadow">
              <div className="text-xl font-semibold">{summary.reqWithTests} / {summary.totalRequirements}</div>
              <div className="text-sm text-gray-500">Requirements With Tests</div>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <div className="text-xl font-semibold">{summary.reqFullyAutomated} / {summary.totalRequirements}</div>
              <div className="text-sm text-gray-500">Fully Automated Requirements</div>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <div className="text-xl font-semibold">{summary.reqFullyPassed} / {summary.totalRequirements}</div>
              <div className="text-sm text-gray-500">Fully Verified Requirements</div>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <div className="text-xl font-semibold">{summary.totalTestCases}</div>
              <div className="text-sm text-gray-500">Total Test Cases (for selected version)</div>
            </div>
          </div>

          {/* Version indicator for unassigned view */}
          {selectedVersion === 'unassigned' && (
            <div className="mb-4 bg-blue-50 p-3 rounded border border-blue-100">
    <h3 className="text-sm font-medium text-blue-800 mb-2">Showing All Items (Unassigned View)</h3>
    <p className="text-xs text-blue-700 mt-1">
                This view shows all requirements and test cases, including those that may be assigned to versions that haven't been created yet.
              </p>
            </div>
          )}

          {/* Matrix Table - Now passing selectedVersion to MatrixTable */}
          <MatrixTable
            requirements={filteredRequirements}
            testCases={filteredTestCases} // Pass filtered test cases
            mapping={mapping}
            coverage={versionCoverage}
            collapseTestCases={collapseTestCases}
            expandedRequirement={expandedRequirement}
            toggleRequirementExpansion={toggleRequirementExpansion}
            toggleTestCaseView={toggleTestCaseView}
            selectedVersion={selectedVersion}
            getVersionDisplayText={getVersionDisplayText} // Pass helper for display
            testCaseAppliesTo={testCaseAppliesTo} // Pass helper for internal filtering if needed
          />

          {/* Information Panel */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold mb-2">Test Depth Factor (TDF) Scale</h3>
              <div className="text-sm">
                <p className="mb-2">The Test Depth Factor is calculated based on:</p>
                <div className="ml-4 mb-2">
                  <div>• Business Impact (40%)</div>
                  <div>• Technical Complexity (30%)</div>
                  <div>• Regulatory Factor (20%)</div>
                  <div>• Usage Frequency (10%)</div>
                </div>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-1">TDF Range</th>
                      <th className="border p-1">Min Test Cases</th>
                      <th className="border p-1">Coverage Approach</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-1">4.1 - 5.0</td>
                      <td className="border p-1">8+</td>
                      <td className="border p-1">Exhaustive testing</td>
                    </tr>
                    <tr>
                      <td className="border p-1">3.1 - 4.0</td>
                      <td className="border p-1">5-7</td>
                      <td className="border p-1">Strong coverage</td>
                    </tr>
                    <tr>
                      <td className="border p-1">2.1 - 3.0</td>
                      <td className="border p-1">3-5</td>
                      <td className="border p-1">Standard coverage</td>
                    </tr>
                    <tr>
                      <td className="border p-1">1.0 - 2.0</td>
                      <td className="border p-1">1-2</td>
                      <td className="border p-1">Basic validation</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold mb-2">Legend</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                  <span>Passing Tests</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                  <span>Failing Tests</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-300 rounded-full mr-1"></div>
                  <span>Not Run Tests</span>
                </div>
                <div className="flex items-center">
                  <span className="text-blue-600 mr-1">A</span>
                  <span>Automated</span>
                </div>
                <div className="flex items-center">
                  <span className="text-orange-600 mr-1">P</span>
                  <span>Planned</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 mr-1">M</span>
                  <span>Manual</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center mr-1">✓</div>
                  <span>Meets Min Test Cases</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center mr-1">!</div>
                  <span>Below Min Test Cases</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </MainLayout>
  );
};

export default TraceabilityMatrix;

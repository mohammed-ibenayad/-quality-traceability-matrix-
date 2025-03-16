import React from 'react';
import MainLayout from '../components/Layout/MainLayout';
import DashboardCards from '../components/Dashboard/DashboardCards';
import QualityGatesTable from '../components/Dashboard/QualityGatesTable';
import RiskAreasList from '../components/Dashboard/RiskAreasList';
import MetricsChart from '../components/Dashboard/MetricsChart';
import HealthScoreGauge from '../components/Dashboard/HealthScoreGauge';
import EmptyState from '../components/common/EmptyState';
import { useRelease } from '../hooks/useRelease';

// Import data
import requirements from '../data/requirements';
import testCases from '../data/testcases';
import mapping from '../data/mapping';
import versionsData from '../data/versions';  // Renamed to versionsData to avoid conflict

const Dashboard = () => {
  // Use the custom hook to get release data
  const { 
    selectedVersion, 
    setSelectedVersion, 
    metrics,
    versions,
    hasData  // Added this to check if we have data
  } = useRelease(requirements, testCases, mapping, versionsData, 'v2.2');

  return (
    <MainLayout 
      title="Quality Dashboard" 
      selectedVersion={selectedVersion}
      setSelectedVersion={setSelectedVersion}
      versions={versions}
      hasData={hasData}
    >
      {!hasData ? (
        // Show empty state when no data is available
        <EmptyState 
          title="Welcome to Quality Tracker" 
          message="Get started by importing your requirements and test cases to begin tracking your quality metrics."
          actionText="Import Data"
          actionPath="/import"
          icon="metrics"
        />
      ) : (
        // Show dashboard content when data is available
        <>
          <h2 className="text-2xl font-bold mb-6">Release Quality Overview</h2>
          
          {/* Dashboard Cards */}
          <DashboardCards metrics={metrics} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Health Score Gauge */}
            <div className="bg-white rounded shadow">
              <HealthScoreGauge score={metrics?.healthScore} />
            </div>
            
            {/* Quality Gates */}
            <div className="lg:col-span-2">
              <QualityGatesTable qualityGates={metrics?.qualityGates} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Areas */}
            <div>
              <RiskAreasList riskAreas={metrics?.riskAreas} />
            </div>
            
            {/* Metrics Chart */}
            <div>
              <MetricsChart data={metrics ? metrics.versionCoverage : []} />
            </div>
          </div>
        </>
      )}
    </MainLayout>
  );
};

export default Dashboard;
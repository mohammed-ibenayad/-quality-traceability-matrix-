// src/pages/Roadmap.jsx
import React, { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';

const Roadmap = () => {
  const [activeTab, setActiveTab] = useState('about');
  const [roadmapData, setRoadmapData] = useState({
    about: null,
    features: null,
    roadmap: null,
    issues: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data from JSON files
  useEffect(() => {
    const loadRoadmapData = async () => {
      try {
        setLoading(true);
        
        // Load all JSON files in parallel
        const [aboutResponse, featuresResponse, roadmapResponse, issuesResponse] = await Promise.all([
          fetch('/roadmap-data/about.json'),
          fetch('/roadmap-data/features.json'),
          fetch('/roadmap-data/roadmap.json'), 
          fetch('/roadmap-data/issues.json')
        ]);

        // Check if all requests were successful
        if (!aboutResponse.ok || !featuresResponse.ok || !roadmapResponse.ok || !issuesResponse.ok) {
          throw new Error('Failed to load roadmap data');
        }

        // Parse JSON data
        const [aboutData, featuresData, roadmapInfo, issuesData] = await Promise.all([
          aboutResponse.json(),
          featuresResponse.json(),
          roadmapResponse.json(),
          issuesResponse.json()
        ]);

        setRoadmapData({
          about: aboutData,
          features: featuresData,
          roadmap: roadmapInfo,
          issues: issuesData
        });({
          features: featuresData,
          roadmap: roadmapInfo,
          issues: issuesData
        });
        
        setError(null);
      } catch (err) {
        console.error('Error loading roadmap data:', err);
        setError('Failed to load roadmap data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadRoadmapData();
  }, []);

  const tabs = [
    { id: 'about', name: 'About', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'features', name: 'Features', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'roadmap', name: 'Roadmap', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9m0 0H9' },
    { id: 'issues', name: 'Known Issues', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.888-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z' }
  ];

  const TabButton = ({ tab, isActive, onClick }) => (
    <button
      onClick={() => onClick(tab.id)}
      className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-100 text-blue-700 border border-blue-200'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
      }`}
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
      </svg>
      {tab.name}
    </button>
  );

  const FeatureCard = ({ feature, showStatus = true }) => (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
          <p className="text-gray-600 text-sm mb-3">{feature.description}</p>
          {showStatus && (
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                feature.status === 'completed' 
                  ? 'bg-green-100 text-green-800' 
                  : feature.status === 'planned'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {feature.status === 'completed' ? 'Completed' : 
                 feature.status === 'planned' ? 'Planned' : 'In Progress'}
              </span>
              {feature.priority && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  feature.priority === 'high' 
                    ? 'bg-red-100 text-red-800' 
                    : feature.priority === 'medium'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {feature.priority} priority
                </span>
              )}
              {feature.deliveryQ && (
                <span className="text-xs text-gray-500">{feature.deliveryQ}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const IssueCard = ({ issue }) => (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{issue.title}</h3>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          issue.severity === 'high' 
            ? 'bg-red-100 text-red-800' 
            : issue.severity === 'medium'
            ? 'bg-orange-100 text-orange-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {issue.severity} severity
        </span>
      </div>
      <p className="text-gray-600 text-sm mb-3">{issue.description}</p>
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium text-gray-700">Impact:</span>
          <span className="text-gray-600 ml-1">{issue.impact}</span>
        </div>
        <div>
          <span className="font-medium text-gray-700">Workaround:</span>
          <span className="text-gray-600 ml-1">{issue.workaround}</span>
        </div>
        <div>
          <span className="font-medium text-blue-700">Planned Fix:</span>
          <span className="text-blue-600 ml-1">{issue.plannedFix}</span>
        </div>
      </div>
    </div>
  );

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">Loading roadmap data...</span>
    </div>
  );

  const ErrorMessage = () => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{error}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (loading) {
      return <LoadingSpinner />;
    }

    if (error) {
      return <ErrorMessage />;
    }

    switch (activeTab) {
      case 'about':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{roadmapData.about?.title || 'About Quality Tracker'}</h2>
              <div className="prose max-w-none">
                <p className="text-gray-600 mb-4">
                  {roadmapData.about?.description || 'Loading description...'}
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">{roadmapData.about?.mission?.title || 'Our Mission'}</h3>
                <p className="text-gray-600 mb-4">
                  {roadmapData.about?.mission?.content || 'Loading mission statement...'}
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">{roadmapData.about?.benefits?.title || 'Key Benefits'}</h3>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  {roadmapData.about?.benefits?.items?.map((benefit, index) => (
                    <li key={index}><strong>{benefit.title}:</strong> {benefit.description}</li>
                  )) || (
                    <>
                      <li><strong>Traceability:</strong> Complete visibility from requirements to test execution</li>
                      <li><strong>Quality Gates:</strong> Automated quality thresholds to prevent low-quality releases</li>
                      <li><strong>Real-time Metrics:</strong> Live dashboards showing quality health and progress</li>
                      <li><strong>Release Confidence:</strong> Data-driven insights for go/no-go decisions</li>
                      <li><strong>Team Collaboration:</strong> Centralized quality information for all stakeholders</li>
                    </>
                  )}
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">{roadmapData.about?.targetUsers?.title || 'Target Users'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  {roadmapData.about?.targetUsers?.users?.map((user, index) => (
                    <div key={index} className={`bg-${user.color}-50 p-4 rounded-lg`}>
                      <h4 className={`font-semibold text-${user.color}-900`}>{user.title}</h4>
                      <p className={`text-${user.color}-700 text-sm`}>{user.description}</p>
                    </div>
                  )) || (
                    <>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900">QA Teams</h4>
                        <p className="text-blue-700 text-sm">Comprehensive test management and execution tracking</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-900">Development Teams</h4>
                        <p className="text-green-700 text-sm">Quality visibility integrated into development workflows</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-purple-900">Project Managers</h4>
                        <p className="text-purple-700 text-sm">Release readiness insights and quality reporting</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roadmapData.features?.currentFeatures?.map((feature, index) => (
                  <FeatureCard key={index} feature={feature} />
                )) || <p className="text-gray-500">No features data available</p>}
              </div>
            </div>
          </div>
        );

      case 'roadmap':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h2 className="text-2xl font-bold text-blue-900 mb-2">{roadmapData.roadmap?.theme?.title || 'Roadmap'}</h2>
              <p className="text-blue-700 mb-4">
                {roadmapData.roadmap?.theme?.description || 'Loading roadmap information...'}
              </p>
              <div className="bg-white rounded p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Theme: {roadmapData.roadmap?.theme?.subtitle || 'Development Focus'}</h3>
                <p className="text-gray-600 text-sm">
                  {roadmapData.roadmap?.theme?.summary || 'Loading theme information...'}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Planned Features - Q3 2025</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roadmapData.features?.q3Features?.map((feature, index) => (
                  <FeatureCard key={index} feature={feature} />
                )) || <p className="text-gray-500">No Q3 features data available</p>}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Beyond Q3 2025</h3>
              <div className="space-y-3 text-gray-600">
                {roadmapData.roadmap?.futureRoadmap?.map((item, index) => (
                  <p key={index}><strong>{item.period}:</strong> {item.description}</p>
                )) || <p className="text-gray-500">No future roadmap data available</p>}
              </div>
            </div>
          </div>
        );

      case 'issues':
        return (
          <div className="space-y-6">
            <div className="bg-amber-50 rounded-lg border border-amber-200 p-6">
              <h2 className="text-2xl font-bold text-amber-900 mb-2">Known Issues & Limitations</h2>
              <p className="text-amber-700">
                We're transparent about current limitations and actively working to address them. 
                All issues listed below have planned solutions in our Q3 2025 roadmap.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Current Known Issues</h3>
              <div className="space-y-4">
                {roadmapData.issues?.knownIssues?.map((issue, index) => (
                  <IssueCard key={index} issue={issue} />
                )) || <p className="text-gray-500">No issues data available</p>}
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Reporting Issues</h3>
              <p className="text-blue-700 mb-3">
                Found a bug or have a feature request? We'd love to hear from you!
              </p>
              <div className="flex space-x-4">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Report an Issue
                </button>
                <button className="bg-white text-blue-600 border border-blue-300 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                  Request a Feature
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <MainLayout title="Product Roadmap">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Roadmap</h1>
          <p className="text-gray-600">
            Learn about Quality Tracker's current capabilities, upcoming features, and development roadmap
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-2 bg-gray-50 p-1 rounded-lg">
            {tabs.map(tab => (
              <TabButton
                key={tab.id}
                tab={tab}
                isActive={activeTab === tab.id}
                onClick={setActiveTab}
              />
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </MainLayout>
  );
};

export default Roadmap;
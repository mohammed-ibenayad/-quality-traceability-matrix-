import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit3, 
  Play, 
  Copy, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  Timer,
  Tag,
  Link,
  Target,
  Settings,
  FileText,
  ListOrdered,
  Database
} from 'lucide-react';

/**
 * Enhanced View-Only Modal for Test Cases
 * Optimized for reading and information consumption
 */
const ViewTestCaseModal = ({ testCase, isOpen, onClose, onEdit, onExecute, onDuplicate, onDelete, linkedRequirements = [] }) => {
  const [expandedSections, setExpandedSections] = useState({
    description: true,
    steps: true,
    traceability: false,
    history: false
  });

  // Reset expanded sections when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setExpandedSections({
        description: true,
        steps: true,
        traceability: false,
        history: false
      });
    }
  }, [isOpen, testCase?.id]);

  if (!isOpen || !testCase) return null;

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Status configuration for visual indicators
  const statusConfig = {
    'Passed': { color: 'green', icon: CheckCircle, bgColor: 'bg-green-50', textColor: 'text-green-800', borderColor: 'border-green-200' },
    'Failed': { color: 'red', icon: XCircle, bgColor: 'bg-red-50', textColor: 'text-red-800', borderColor: 'border-red-200' },
    'Not Run': { color: 'gray', icon: Clock, bgColor: 'bg-gray-50', textColor: 'text-gray-800', borderColor: 'border-gray-200' },
    'Blocked': { color: 'yellow', icon: AlertTriangle, bgColor: 'bg-yellow-50', textColor: 'text-yellow-800', borderColor: 'border-yellow-200' }
  };

  const priorityConfig = {
    'High': { color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
    'Medium': { color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
    'Low': { color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' }
  };

  const automationConfig = {
    'Automated': { color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
    'Manual': { color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
    'Planned': { color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-800' }
  };

  const StatusBadge = ({ status }) => {
    const config = statusConfig[status] || statusConfig['Not Run'];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
        <Icon className="w-4 h-4 mr-2" />
        {status}
      </span>
    );
  };

  const PriorityBadge = ({ priority }) => {
    const config = priorityConfig[priority] || priorityConfig['Medium'];
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${config.bgColor} ${config.textColor}`}>
        {priority}
      </span>
    );
  };

  const AutomationBadge = ({ status }) => {
    const config = automationConfig[status] || automationConfig['Manual'];
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${config.bgColor} ${config.textColor}`}>
        {status}
      </span>
    );
  };

  const ExpandableCard = ({ title, children, section, icon: Icon, defaultExpanded = false }) => {
    const isExpanded = expandedSections[section];
    
    return (
      <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
        <button
          onClick={() => toggleSection(section)}
          className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center">
            {Icon && <Icon className="w-5 h-5 mr-2 text-gray-600" />}
            <h3 className="font-medium text-gray-900">{title}</h3>
          </div>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="pt-4">
              {children}
            </div>
          </div>
        )}
      </div>
    );
  };

  const TestStepsView = ({ steps }) => {
    if (!steps || steps.length === 0) {
      return <p className="text-gray-500 italic">No test steps defined</p>;
    }

    return (
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="flex">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-800 mr-4">
              {index + 1}
            </div>
            <div className="flex-1 pt-1">
              <p className="text-gray-900 leading-relaxed">{step}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="flex items-center mb-2">
                <span className="text-blue-100 text-sm font-medium mr-3">{testCase.id}</span>
                <StatusBadge status={testCase.status} />
              </div>
              <h2 className="text-2xl font-bold mb-2">{testCase.name}</h2>
              <div className="flex items-center space-x-4 text-blue-100">
                {testCase.category && (
                  <span className="flex items-center">
                    <Tag className="w-4 h-4 mr-1" />
                    {testCase.category}
                  </span>
                )}
                {testCase.assignee && (
                  <span className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {testCase.assignee}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-blue-100 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Quick Actions */}
<div className="flex space-x-3 mt-4">
  <button
    onClick={() => onEdit(testCase)}
    className="flex items-center px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-md text-sm font-medium transition-colors"
  >
    <Edit3 className="w-4 h-4 mr-2" />
    Edit
  </button>
  
  {/* Only show Execute button for Automated or Semi-Automated tests */}
  {(testCase.automationStatus === 'Automated' || testCase.automationStatus === 'Semi-Automated') && (
    <button
      onClick={() => onExecute(testCase)}
      className="flex items-center px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-md text-sm font-medium transition-colors"
    >
      <Play className="w-4 h-4 mr-2" />
      Execute
    </button>
  )}
  
  <button
    onClick={() => onDuplicate(testCase)}
    className="flex items-center px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-md text-sm font-medium transition-colors"
  >
    <Copy className="w-4 h-4 mr-2" />
    Duplicate
  </button>
  
  <button
    onClick={() => {
      if (window.confirm(`Are you sure you want to delete test case "${testCase.id}"?`)) {
        onDelete(testCase.id);
      }
    }}
    className="flex items-center px-4 py-2 bg-red-500 bg-opacity-20 hover:bg-opacity-30 rounded-md text-sm font-medium transition-colors"
  >
    <Trash2 className="w-4 h-4 mr-2" />
    Delete
  </button>
</div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Overview Card */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Overview
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Priority:</span>
                  <PriorityBadge priority={testCase.priority} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Automation:</span>
                  <AutomationBadge status={testCase.automationStatus} />
                </div>
                {testCase.version && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Version:</span>
                    <span className="text-sm font-medium">{testCase.version}</span>
                  </div>
                )}
                {testCase.estimatedDuration > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Est. Duration:</span>
                    <span className="text-sm font-medium">{testCase.estimatedDuration} min</span>
                  </div>
                )}
              </div>
            </div>

            {/* Execution Card */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Execution Info
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status:</span>
                  <StatusBadge status={testCase.status} />
                </div>
                {testCase.lastExecuted && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Last Executed:</span>
                    <span className="text-sm font-medium flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(testCase.lastExecuted).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {testCase.executedBy && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Executed By:</span>
                    <span className="text-sm font-medium">{testCase.executedBy}</span>
                  </div>
                )}
                {testCase.automationPath && (
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-gray-600">Automation Path:</span>
                    <span className="text-sm font-mono text-right max-w-48 truncate" title={testCase.automationPath}>
                      {testCase.automationPath}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Expandable Sections */}
          <div className="space-y-4">
            {/* Description */}
            {testCase.description && (
              <ExpandableCard 
                title="Description" 
                section="description" 
                icon={FileText}
                defaultExpanded={true}
              >
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {testCase.description}
                </p>
              </ExpandableCard>
            )}

            {/* Preconditions */}
            {testCase.preconditions && (
              <ExpandableCard 
                title="Preconditions" 
                section="preconditions" 
                icon={AlertTriangle}
              >
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {testCase.preconditions}
                </p>
              </ExpandableCard>
            )}

            {/* Test Data */}
            {testCase.testData && (
              <ExpandableCard 
                title="Test Data" 
                section="testData" 
                icon={Database}
              >
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {testCase.testData}
                </p>
              </ExpandableCard>
            )}

            {/* Test Steps */}
            <ExpandableCard 
              title="Test Steps" 
              section="steps" 
              icon={ListOrdered}
              defaultExpanded={true}
            >
              <TestStepsView steps={testCase.steps} />
            </ExpandableCard>

            {/* Expected Results */}
            {testCase.expectedResult && (
              <ExpandableCard 
                title="Expected Results" 
                section="expectedResult" 
                icon={CheckCircle}
              >
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {testCase.expectedResult}
                </p>
              </ExpandableCard>
            )}

            {/* Requirements Traceability */}
            {(testCase.requirementIds?.length > 0 || linkedRequirements?.length > 0) && (
              <ExpandableCard 
                title="Requirements Traceability" 
                section="traceability" 
                icon={Link}
              >
                <div className="space-y-2">
                  {testCase.requirementIds?.length > 0 ? (
                    testCase.requirementIds.map(reqId => {
                      const linkedReq = linkedRequirements.find(req => req.id === reqId);
                      return (
                        <div key={reqId} className="flex items-center p-2 bg-blue-50 rounded-md">
                          <Link className="w-4 h-4 mr-2 text-blue-600" />
                          <span className="font-medium text-blue-800 mr-2">{reqId}</span>
                          {linkedReq && (
                            <span className="text-gray-700">{linkedReq.name}</span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 italic">No requirements linked</p>
                  )}
                </div>
              </ExpandableCard>
            )}

            {/* Tags */}
            {testCase.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-700">Tags:</span>
                {testCase.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewTestCaseModal;
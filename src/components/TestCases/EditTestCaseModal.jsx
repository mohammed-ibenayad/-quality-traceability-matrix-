// src/components/TestCases/EditTestCaseModal.jsx - Design Consistent Version

import React, { useState } from 'react';
import { X, Plus, Trash2, FileText, Settings, Link, Tag, ChevronDown, ChevronRight } from 'lucide-react';
import { useVersionContext } from '../../context/VersionContext';
import dataStore from '../../services/DataStore';

const EditTestCaseModal = ({ testCase, onSave, onCancel }) => {
  // Get available versions and requirements from context/datastore
  const { versions } = useVersionContext();
  const availableRequirements = dataStore.getRequirements();

  // Tab state
  const [activeTab, setActiveTab] = useState('details');

  // Section expansion state (consistent with ViewTestCaseModal)
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    setupData: true,
    testSteps: true,
    expectedResult: true,
    testProperties: true,
    versions: true,
    requirements: false,
    tags: false
  });

  // Ensure testCase object has all necessary properties with defaults
  const testCaseWithDefaults = {
    id: '',
    name: '',
    description: '',
    category: '',
    preconditions: '',
    testData: '',
    status: 'Not Run',
    automationStatus: 'Manual',
    priority: 'Medium',
    applicableVersions: [], // NEW: Default to empty array
    requirementIds: [],
    steps: [],
    expectedResult: '',
    tags: [],
    assignee: '',
    estimatedDuration: 0,
    // Handle migration from legacy format
    ...(testCase?.version && !testCase?.applicableVersions && {
      applicableVersions: [testCase.version] // Convert legacy version to array
    }),
    ...testCase
  };

  const [formData, setFormData] = useState({
    id: testCaseWithDefaults.id,
    name: testCaseWithDefaults.name,
    description: testCaseWithDefaults.description,
    category: testCaseWithDefaults.category,
    preconditions: testCaseWithDefaults.preconditions,
    testData: testCaseWithDefaults.testData,
    status: testCaseWithDefaults.status,
    automationStatus: testCaseWithDefaults.automationStatus,
    priority: testCaseWithDefaults.priority,
    applicableVersions: testCaseWithDefaults.applicableVersions || [],
    requirementIds: testCaseWithDefaults.requirementIds || [],
    steps: testCaseWithDefaults.steps || [],
    expectedResult: testCaseWithDefaults.expectedResult,
    tags: testCaseWithDefaults.tags || [],
    assignee: testCaseWithDefaults.assignee,
    estimatedDuration: testCaseWithDefaults.estimatedDuration || 0
  });

  // For tags input
  const [tagInput, setTagInput] = useState('');

  // Tab configuration
  const tabs = [
    { id: 'details', name: 'Test Details', icon: FileText },
    { id: 'metadata', name: 'Metadata & Links', icon: Settings },
  ];

  // Toggle section expansion (consistent with ViewTestCaseModal)
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Expandable Card Component (consistent with ViewTestCaseModal)
  const ExpandableCard = ({ title, children, section, icon: Icon, defaultExpanded = false }) => {
    const isExpanded = expandedSections[section] !== undefined ? expandedSections[section] : defaultExpanded;
    
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
          {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
        </button>
        {isExpanded && (
          <div className="px-4 pb-4">
            {children}
          </div>
        )}
      </div>
    );
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'estimatedDuration' ? (parseInt(value) || 0) : value
    }));
  };

  // Version handlers
  const handleAddVersion = (versionId) => {
    if (versionId && !(formData.applicableVersions || []).includes(versionId)) {
      setFormData(prev => ({
        ...prev,
        applicableVersions: [...(prev.applicableVersions || []), versionId]
      }));
    }
  };

  const handleRemoveVersion = (versionToRemove) => {
    setFormData(prev => ({
      ...prev,
      applicableVersions: (prev.applicableVersions || []).filter(version => version !== versionToRemove)
    }));
  };

  // Tag handlers
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Requirement handlers
  const handleAddRequirement = (reqId) => {
    if (reqId && !formData.requirementIds.includes(reqId)) {
      setFormData(prev => ({
        ...prev,
        requirementIds: [...prev.requirementIds, reqId]
      }));
    }
  };

  const handleRemoveRequirement = (reqToRemove) => {
    setFormData(prev => ({
      ...prev,
      requirementIds: prev.requirementIds.filter(req => req !== reqToRemove)
    }));
  };

  // Step handlers
  const handleStepChange = (index, value) => {
    const newSteps = [...formData.steps];
    newSteps[index] = value;
    setFormData(prev => ({ ...prev, steps: newSteps }));
  };

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, '']
    }));
  };

  const removeStep = (index) => {
    const newSteps = formData.steps.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, steps: newSteps }));
  };

  // Handle save
  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Test case name is required');
      return;
    }

    const finalData = {
      ...formData,
      id: formData.id || `TC_${Date.now()}`
    };

    console.log('Saving test case:', finalData);
    onSave(finalData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col">
        
        {/* Fixed Header - consistent with ViewTestCaseModal */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {testCaseWithDefaults.id ? 'Edit Test Case' : 'Create Test Case'}
              </h2>
              {testCaseWithDefaults.id && (
                <p className="text-sm text-gray-500 mt-1">ID: {testCaseWithDefaults.id}</p>
              )}
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Tab Navigation - consistent styling */}
          <div className="mt-4">
            <nav className="flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
        
        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          
          {/* Tab 1: Test Details */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              
              {/* Basic Information Card */}
              <ExpandableCard 
                title="Basic Information" 
                section="basicInfo" 
                icon={FileText}
                defaultExpanded={true}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      placeholder="Enter test case name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                      placeholder="Enter test case description"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Authentication, UI, API"
                    />
                  </div>
                </div>
              </ExpandableCard>

              {/* Setup & Data Card */}
              <ExpandableCard 
                title="Setup & Data" 
                section="setupData" 
                icon={Settings}
                defaultExpanded={true}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preconditions</label>
                    <textarea
                      name="preconditions"
                      value={formData.preconditions}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                      placeholder="Enter any preconditions..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Test Data</label>
                    <textarea
                      name="testData"
                      value={formData.testData}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                      placeholder="Enter test data..."
                    />
                  </div>
                </div>
              </ExpandableCard>

              {/* Test Steps Card */}
              <ExpandableCard 
                title="Test Steps" 
                section="testSteps" 
                icon={Plus}
                defaultExpanded={true}
              >
                <div className="space-y-3">
                  {formData.steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium mt-1">
                        {index + 1}
                      </div>
                      <textarea
                        value={step}
                        onChange={(e) => handleStepChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        rows="2"
                        placeholder={`Enter step ${index + 1}...`}
                      />
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="flex-shrink-0 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md mt-1 transition-colors"
                        title="Remove step"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addStep}
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <Plus size={16} />
                    Add Step
                  </button>
                </div>
              </ExpandableCard>

              {/* Expected Result Card */}
              <ExpandableCard 
                title="Expected Result" 
                section="expectedResult" 
                icon={FileText}
                defaultExpanded={true}
              >
                <textarea
                  name="expectedResult"
                  value={formData.expectedResult}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Enter expected result..."
                />
              </ExpandableCard>
            </div>
          )}

          {/* Tab 2: Metadata & Links */}
          {activeTab === 'metadata' && (
            <div className="space-y-4">
              
              {/* Test Properties Card */}
              <ExpandableCard 
                title="Test Properties" 
                section="testProperties" 
                icon={Settings}
                defaultExpanded={true}
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Not Run">Not Run</option>
                      <option value="Passed">Passed</option>
                      <option value="Failed">Failed</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Automation</label>
                    <select
                      name="automationStatus"
                      value={formData.automationStatus}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Manual">Manual</option>
                      <option value="Automated">Automated</option>
                      <option value="Semi-Automated">Semi-Automated</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                    <input
                      type="number"
                      name="estimatedDuration"
                      value={formData.estimatedDuration}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      placeholder="0"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                  <input
                    type="text"
                    name="assignee"
                    value={formData.assignee}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter assignee name"
                  />
                </div>
              </ExpandableCard>

              {/* Version Selection Card */}
              <ExpandableCard 
                title="Applicable Versions" 
                section="versions" 
                icon={Tag}
                defaultExpanded={true}
              >
                {/* Show selected versions as tags */}
                {formData.applicableVersions && formData.applicableVersions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {formData.applicableVersions.map((versionId, index) => {
                      const version = versions.find(v => v.id === versionId);
                      return (
                        <span key={index} className="inline-flex items-center bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                          {version ? version.name : versionId}
                          <button
                            type="button"
                            onClick={() => handleRemoveVersion(versionId)}
                            className="ml-2 text-blue-600 hover:text-blue-800 font-bold transition-colors"
                            title="Remove version"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
                
                {/* Dropdown to add versions */}
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddVersion(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue=""
                >
                  <option value="" disabled>Select versions to add...</option>
                  {versions
                    .filter(version => !(formData.applicableVersions || []).includes(version.id))
                    .map(version => (
                      <option key={version.id} value={version.id}>
                        {version.name} ({version.id})
                      </option>
                    ))
                  }
                </select>
                
                {(!formData.applicableVersions || formData.applicableVersions.length === 0) && (
                  <p className="text-sm text-gray-500 mt-2">
                    💡 No versions selected = test case applies to all versions
                  </p>
                )}
              </ExpandableCard>

              {/* Linked Requirements Card */}
              <ExpandableCard 
                title="Linked Requirements" 
                section="requirements" 
                icon={Link}
                defaultExpanded={false}
              >
                {formData.requirementIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {formData.requirementIds.map((reqId, index) => {
                      const requirement = availableRequirements.find(req => req.id === reqId);
                      return (
                        <span key={index} className="inline-flex items-center bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full">
                          {reqId}
                          {requirement && (
                            <span className="ml-1 text-purple-600" title={requirement.name}>
                              ({requirement.name.substring(0, 20)}...)
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveRequirement(reqId)}
                            className="ml-2 text-purple-600 hover:text-purple-800 font-bold transition-colors"
                            title="Remove requirement"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
                
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddRequirement(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue=""
                >
                  <option value="" disabled>Select a requirement to link...</option>
                  {availableRequirements
                    .filter(req => !formData.requirementIds.includes(req.id))
                    .map(req => (
                      <option key={req.id} value={req.id}>
                        {req.id} - {req.name}
                      </option>
                    ))
                  }
                </select>
              </ExpandableCard>

              {/* Tags Card */}
              <ExpandableCard 
                title="Tags" 
                section="tags" 
                icon={Tag}
                defaultExpanded={false}
              >
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {formData.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-green-600 hover:text-green-800 font-bold transition-colors"
                          title="Remove tag"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Add a tag..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Add
                  </button>
                </div>
              </ExpandableCard>
            </div>
          )}
        </div>
        
        {/* Fixed Footer with Action Buttons - consistent styling */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              {testCaseWithDefaults.id ? 'Save Changes' : 'Create Test Case'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTestCaseModal;
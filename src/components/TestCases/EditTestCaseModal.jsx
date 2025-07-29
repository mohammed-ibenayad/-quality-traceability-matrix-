// src/components/TestCases/EditTestCaseModal.jsx - Redesigned Version

import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useVersionContext } from '../../context/VersionContext';
import dataStore from '../../services/DataStore';

const EditTestCaseModal = ({ testCase, onSave, onCancel }) => {
  // Get available versions and requirements from context/datastore
  const { versions } = useVersionContext();
  const availableRequirements = dataStore.getRequirements();

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
    version: '',
    requirementIds: [],
    steps: [],
    expectedResult: '',
    tags: [],
    assignee: '',
    estimatedDuration: 0,
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
    version: testCaseWithDefaults.version,
    requirementIds: testCaseWithDefaults.requirementIds || [],
    steps: testCaseWithDefaults.steps || [],
    expectedResult: testCaseWithDefaults.expectedResult,
    tags: testCaseWithDefaults.tags || [],
    assignee: testCaseWithDefaults.assignee,
    estimatedDuration: testCaseWithDefaults.estimatedDuration || 0
  });

  // For tags input
  const [tagInput, setTagInput] = useState('');

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'estimatedDuration' ? (parseInt(value) || 0) : value
    }));
  };

  // Handle adding a new tag
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Handle adding a requirement
  const handleAddRequirement = (reqId) => {
    if (reqId && !formData.requirementIds.includes(reqId)) {
      setFormData(prev => ({
        ...prev,
        requirementIds: [...prev.requirementIds, reqId]
      }));
    }
  };

  // Handle removing a requirement
  const handleRemoveRequirement = (reqToRemove) => {
    setFormData(prev => ({
      ...prev,
      requirementIds: prev.requirementIds.filter(req => req !== reqToRemove)
    }));
  };

  // Handle step changes
  const handleStepChange = (index, value) => {
    const newSteps = [...formData.steps];
    newSteps[index] = value;
    setFormData(prev => ({ ...prev, steps: newSteps }));
  };

  // Add step
  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, '']
    }));
  };

  // Remove step
  const removeStep = (index) => {
    const newSteps = formData.steps.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, steps: newSteps }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      alert('Test case name is required');
      return;
    }

    // Generate ID if creating new test case
    const finalData = {
      ...formData,
      id: formData.id || `TC_${Date.now()}`
    };

    console.log('Saving test case:', finalData);
    onSave(finalData);
  };

  // Handle save button click
  const handleSave = () => {
    // Validate required fields
    if (!formData.name.trim()) {
      alert('Test case name is required');
      return;
    }

    // Generate ID if creating new test case
    const finalData = {
      ...formData,
      id: formData.id || `TC_${Date.now()}`
    };

    console.log('Saving test case:', finalData);
    onSave(finalData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Fixed Header */}
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
              className="text-gray-400 hover:text-gray-600 p-2 rounded-md hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form onSubmit={handleSubmit} id="testcase-form" className="space-y-4">
            
            {/* Name & Description */}
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="2"
                  placeholder="Enter test case description"
                />
              </div>
            </div>
            
            {/* Basic Info Row */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Category, Version, Assignee */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Authentication, UI, API"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                <select
                  name="version"
                  value={formData.version}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Version</option>
                  {versions.map(version => (
                    <option key={version.id} value={version.id}>
                      {version.name} ({version.id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                <input
                  type="text"
                  name="assignee"
                  value={formData.assignee}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter assignee name"
                />
              </div>
            </div>
            
            {/* Preconditions & Test Data */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preconditions</label>
                <textarea
                  name="preconditions"
                  value={formData.preconditions}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="2"
                  placeholder="Enter any preconditions..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Data</label>
                <textarea
                  name="testData"
                  value={formData.testData}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="2"
                  placeholder="Enter test data..."
                />
              </div>
            </div>
            
            {/* Test Steps */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Test Steps</label>
              <div className="space-y-2">
                {formData.steps.map((step, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => handleStepChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Enter step ${index + 1}...`}
                    />
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="flex-shrink-0 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                      title="Remove step"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addStep}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                >
                  <Plus size={16} />
                  Add Step
                </button>
              </div>
            </div>
            
            {/* Expected Result */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Result</label>
              <textarea
                name="expectedResult"
                value={formData.expectedResult}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="2"
                placeholder="Enter expected result..."
              />
            </div>
            
            {/* Linked Requirements */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Linked Requirements</label>
              {formData.requirementIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {formData.requirementIds.map((reqId, index) => {
                    const requirement = availableRequirements.find(req => req.id === reqId);
                    return (
                      <span key={index} className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {reqId}
                        {requirement && (
                          <span className="ml-1 text-blue-600" title={requirement.name}>
                            ({requirement.name.substring(0, 20)}...)
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveRequirement(reqId)}
                          className="ml-1 text-blue-600 hover:text-blue-800 font-bold text-sm"
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
                    e.target.value = ''; // Reset select
                  }
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                {availableRequirements.filter(req => !formData.requirementIds.includes(req.id)).length === 0 && (
                  <option value="" disabled>All requirements already linked</option>
                )}
              </select>
            </div>
            
            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {formData.tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-green-600 hover:text-green-800 font-bold text-sm"
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
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                  className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
            </div>
          </form>
        </div>
        
        {/* Fixed Footer with Action Buttons */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
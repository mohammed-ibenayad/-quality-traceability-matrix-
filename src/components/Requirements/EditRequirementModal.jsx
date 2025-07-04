// src/components/Requirements/EditRequirementModal.jsx - Complete Fixed Version

import React, { useState } from 'react';

const EditRequirementModal = ({ requirement, onSave, onCancel }) => {
  // Ensure requirement object has all the necessary properties with defaults
  const requirementWithDefaults = {
    id: '',
    name: '',
    description: '',
    priority: 'Medium',
    type: 'Functional',
    status: 'Active',
    businessImpact: 3,
    technicalComplexity: 3,
    regulatoryFactor: 3,
    usageFrequency: 3,
    versions: [],
    tags: [],
    ...requirement  // This spreads the actual requirement properties over the defaults
  };

  const [formData, setFormData] = useState({
    name: requirementWithDefaults.name,
    description: requirementWithDefaults.description,
    priority: requirementWithDefaults.priority,
    type: requirementWithDefaults.type,
    status: requirementWithDefaults.status,
    businessImpact: requirementWithDefaults.businessImpact,
    technicalComplexity: requirementWithDefaults.technicalComplexity,
    regulatoryFactor: requirementWithDefaults.regulatoryFactor,
    usageFrequency: requirementWithDefaults.usageFrequency,
    versions: requirementWithDefaults.versions,
    tags: requirementWithDefaults.tags || []
  });
  
  // For tags input
  const [tagInput, setTagInput] = useState('');

  // Calculate TDF based on current values
  const calculateTDF = () => {
    return (
      (formData.businessImpact * 0.4) +
      (formData.technicalComplexity * 0.3) +
      (formData.regulatoryFactor * 0.2) +
      (formData.usageFrequency * 0.1)
    ).toFixed(1);
  };

  // Calculate minimum test cases based on TDF
  const calculateMinTestCases = () => {
    const tdf = parseFloat(calculateTDF());
    if (tdf >= 4.1) return 8;
    if (tdf >= 3.1) return 5;
    if (tdf >= 2.1) return 3;
    return 1;
  };

  // Handle form field changes - FIXED VERSION
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Define which fields should be treated as numbers
    const numericFields = ['businessImpact', 'technicalComplexity', 'regulatoryFactor', 'usageFrequency'];
    
    setFormData(prev => ({
      ...prev,
      [name]: numericFields.includes(name) ? Number(value) : value
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

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...requirementWithDefaults, // Keep any fields we didn't modify
      ...formData,
      testDepthFactor: parseFloat(calculateTDF()),
      minTestCases: calculateMinTestCases()
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-screen flex flex-col">
        {/* Fixed Header */}
        <div className="p-6 pb-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {requirementWithDefaults.id ? 'Edit Requirement' : 'Create New Requirement'}
          </h2>
        </div>
        
        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-4">
          <form onSubmit={handleSubmit} id="requirement-form">
          {/* ID Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
            <input
              type="text"
              value={requirementWithDefaults.id}
              className="w-full p-2 border rounded bg-gray-100"
              disabled
              placeholder={!requirementWithDefaults.id ? "Auto-generated" : ""}
            />
          </div>
          
          {/* Name Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              placeholder="Enter requirement name"
            />
          </div>
          
          {/* Description Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
              required
              placeholder="Enter requirement description"
            />
          </div>
          
          {/* Priority and Type Fields */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="Functional">Functional</option>
                <option value="Security">Security</option>
                <option value="Performance">Performance</option>
                <option value="Usability">Usability</option>
                <option value="Compatibility">Compatibility</option>
              </select>
            </div>
          </div>
          
          {/* Status Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="Active">Active</option>
              <option value="Proposed">Proposed</option>
              <option value="Deprecated">Deprecated</option>
              <option value="Implemented">Implemented</option>
            </select>
          </div>
          
          {/* Test Depth Factors */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Depth Factors
              <span className="text-gray-500 font-normal ml-1">(Scale 1-5)</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Business Impact</label>
                <input
                  type="number"
                  name="businessImpact"
                  value={formData.businessImpact}
                  onChange={handleChange}
                  min="1"
                  max="5"
                  step="1"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Technical Complexity</label>
                <input
                  type="number"
                  name="technicalComplexity"
                  value={formData.technicalComplexity}
                  onChange={handleChange}
                  min="1"
                  max="5"
                  step="1"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Regulatory Factor</label>
                <input
                  type="number"
                  name="regulatoryFactor"
                  value={formData.regulatoryFactor}
                  onChange={handleChange}
                  min="1"
                  max="5"
                  step="1"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Usage Frequency</label>
                <input
                  type="number"
                  name="usageFrequency"
                  value={formData.usageFrequency}
                  onChange={handleChange}
                  min="1"
                  max="5"
                  step="1"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              <p><strong>Business Impact:</strong> How critical is this to business operations</p>
              <p><strong>Technical Complexity:</strong> How complex is the implementation</p>
              <p><strong>Regulatory Factor:</strong> Compliance and regulatory requirements</p>
              <p><strong>Usage Frequency:</strong> How often this feature will be used</p>
            </div>
          </div>
          
          {/* Calculated Values Display */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Calculated Values</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Test Depth Factor:</span>
                <span className="text-sm font-bold text-blue-600">{calculateTDF()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Min Required Tests:</span>
                <span className="text-sm font-bold text-green-600">{calculateMinTestCases()}</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              TDF is calculated automatically based on the factors above. Higher TDF requires more test cases.
            </div>
          </div>
          
          {/* Tags Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2 min-h-[2rem]">
              {formData.tags.length > 0 ? (
                formData.tags.map((tag, index) => (
                  <div key={index} className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800 font-bold"
                      title="Remove tag"
                    >
                      ×
                    </button>
                  </div>
                ))
              ) : (
                <span className="text-xs text-gray-400 italic">No tags added</span>
              )}
            </div>
            <div className="flex">
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
                className="flex-1 p-2 border border-r-0 rounded-l focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Press Enter or click Add to add a tag</p>
          </div>
          </form>
        </div>
        
        {/* Fixed Footer with Action Buttons */}
        <div className="flex-shrink-0 p-6 pt-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="requirement-form"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              {requirementWithDefaults.id ? 'Save Changes' : 'Create Requirement'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRequirementModal;
import React, { useState } from 'react';
import { useVersionContext } from '../../context/VersionContext';

const EditRequirementModal = ({ requirement, onSave, onCancel }) => {
  // Get available versions from context
  const { versions } = useVersionContext();

  // ✅ FIXED: Properly map snake_case to camelCase
  const requirementWithDefaults = {
    id: requirement?.id || '',
    name: requirement?.name || '',
    description: requirement?.description || '',
    priority: requirement?.priority || 'Medium',
    type: requirement?.type || 'Functional',
    status: requirement?.status || 'Active',
    // ✅ Map TDF fields: check snake_case first, then camelCase, then default
    businessImpact: requirement?.business_impact ?? requirement?.businessImpact ?? 3,
    technicalComplexity: requirement?.technical_complexity ?? requirement?.technicalComplexity ?? 3,
    regulatoryFactor: requirement?.regulatory_factor ?? requirement?.regulatoryFactor ?? 3,
    usageFrequency: requirement?.usage_frequency ?? requirement?.usageFrequency ?? 3,
    testDepthFactor: requirement?.test_depth_factor ?? requirement?.testDepthFactor ?? null,
    minTestCases: requirement?.min_test_cases ?? requirement?.minTestCases ?? null,
    versions: requirement?.versions || [],
    tags: requirement?.tags || [],
    workspace_id: requirement?.workspace_id || null
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

  // Handle form field changes
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

  // Handle adding a version
  const handleAddVersion = (versionId) => {
    if (versionId && !formData.versions.includes(versionId)) {
      setFormData(prev => ({
        ...prev,
        versions: [...prev.versions, versionId]
      }));
    }
  };

  // Handle removing a version
  const handleRemoveVersion = (versionToRemove) => {
    setFormData(prev => ({
      ...prev,
      versions: prev.versions.filter(v => v !== versionToRemove)
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData); // Debug log
    onSave({
      ...requirementWithDefaults, // Keep any fields we didn't modified
      ...formData,
      testDepthFactor: parseFloat(calculateTDF()),
      minTestCases: calculateMinTestCases()
    });
  };

  // Handle save button click (alternative method)
  const handleSave = () => {
    console.log('Save button clicked with data:', formData); // Debug log
    onSave({
      ...requirementWithDefaults,
      ...formData,
      testDepthFactor: parseFloat(calculateTDF()),
      minTestCases: calculateMinTestCases()
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[85vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white rounded-t-lg">
          <h2 className="text-xl font-semibold text-gray-900">
            {requirementWithDefaults.id ? 'Edit Requirement' : 'Create New Requirement'}
          </h2>
          {requirementWithDefaults.id && (
            <p className="text-sm text-gray-500 mt-1">ID: {requirementWithDefaults.id}</p>
          )}
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form onSubmit={handleSubmit} id="requirement-form" className="space-y-4">

            {/* Name & Description Row */}
            <div className="grid grid-cols-1 gap-4">
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
                  placeholder="Enter requirement name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="2"
                  required
                  placeholder="Enter requirement description"
                />
              </div>
            </div>

            {/* Basic Info Row */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="Functional">Functional</option>
                  <option value="Non-Functional">Non-Functional</option>
                  <option value="Security">Security</option>
                  <option value="Performance">Performance</option>
                  <option value="Usability">Usability</option>
                  <option value="Compliance">Compliance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                  <option value="In Review">In Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Deprecated">Deprecated</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Test Depth Factors - Compact Grid */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Depth Factors <span className="text-gray-500 text-xs">(Scale 1-5)</span>
              </label>
              <div className="grid grid-cols-4 gap-3">
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
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Calculated Values - Compact Display */}
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{calculateTDF()}</div>
                  <div className="text-xs text-blue-700">Test Depth Factor</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{calculateMinTestCases()}</div>
                  <div className="text-xs text-green-700">Required Tests</div>
                </div>
              </div>
            </div>

            {/* Versions Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Versions</label>
              {formData.versions.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {formData.versions.map((versionId, index) => {
                    const versionExists = versions.some(v => v.id === versionId);
                    const versionName = versions.find(v => v.id === versionId)?.name || versionId;
                    return (
                      <span
                        key={index}
                        className={`inline-flex items-center text-xs px-2 py-1 rounded-full ${versionExists
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                          }`}
                      >
                        {versionName}
                        {!versionExists && <span className="ml-1" title="Version not created yet">⚠️</span>}
                        <button
                          type="button"
                          onClick={() => handleRemoveVersion(versionId)}
                          className={`ml-1 font-bold text-sm ${versionExists ? 'text-blue-600 hover:text-blue-800' : 'text-yellow-600 hover:text-yellow-800'
                            }`}
                          title="Remove version"
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
                    handleAddVersion(e.target.value);
                    e.target.value = ''; // Reset select
                  }
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                defaultValue=""
              >
                <option value="" disabled>Select a version to add...</option>
                {versions
                  .filter(version => !formData.versions.includes(version.id))
                  .map(version => (
                    <option key={version.id} value={version.id}>
                      {version.name} ({version.id})
                    </option>
                  ))
                }
                {versions.filter(version => !formData.versions.includes(version.id)).length === 0 && (
                  <option value="" disabled>All versions already assigned</option>
                )}
              </select>
            </div>

            {/* Tags Section - Compact */}
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

            {/* Helper Text - Compact */}
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div><strong>Business Impact:</strong> Critical to operations</div>
                <div><strong>Technical Complexity:</strong> Implementation difficulty</div>
                <div><strong>Regulatory Factor:</strong> Compliance requirements</div>
                <div><strong>Usage Frequency:</strong> Feature usage rate</div>
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
              {requirementWithDefaults.id ? 'Save Changes' : 'Create Requirement'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRequirementModal;
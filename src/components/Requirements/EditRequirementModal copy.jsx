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
    const tdf = calculateTDF();
    if (tdf >= 4.1) return 8;
    if (tdf >= 3.1) return 5;
    if (tdf >= 2.1) return 3;
    return 1;
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['priority', 'type', 'status'].includes(name) ? value : Number(value)
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
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg max-h-screen overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Edit Requirement</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
            <input
              type="text"
              value={requirementWithDefaults.id}
              className="w-full p-2 border rounded bg-gray-100"
              disabled
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              rows="3"
              required
            ></textarea>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full p-2 border rounded"
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
                className="w-full p-2 border rounded"
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
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="Active">Active</option>
              <option value="Proposed">Proposed</option>
              <option value="Deprecated">Deprecated</option>
              <option value="Implemented">Implemented</option>
            </select>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Test Depth Factors</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Business Impact (1-5)</label>
                <input
                  type="number"
                  name="businessImpact"
                  value={formData.businessImpact}
                  onChange={handleChange}
                  min="1"
                  max="5"
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Technical Complexity (1-5)</label>
                <input
                  type="number"
                  name="technicalComplexity"
                  value={formData.technicalComplexity}
                  onChange={handleChange}
                  min="1"
                  max="5"
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Regulatory Factor (1-5)</label>
                <input
                  type="number"
                  name="regulatoryFactor"
                  value={formData.regulatoryFactor}
                  onChange={handleChange}
                  min="1"
                  max="5"
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Usage Frequency (1-5)</label>
                <input
                  type="number"
                  name="usageFrequency"
                  value={formData.usageFrequency}
                  onChange={handleChange}
                  min="1"
                  max="5"
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="bg-gray-100 p-3 rounded mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Calculated Test Depth Factor:</span>
              <span className="text-sm font-bold">{calculateTDF()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Minimum Required Test Cases:</span>
              <span className="text-sm font-bold">{calculateMinTestCases()}</span>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <div key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
            <div className="flex">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag..."
                className="w-full p-2 border rounded-l"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Press Enter to add a tag</p>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRequirementModal;
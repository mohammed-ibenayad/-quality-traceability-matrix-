import React, { useState } from 'react';

const EditRequirementModal = ({ requirement, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: requirement.name,
    description: requirement.description || '',
    priority: requirement.priority,
    businessImpact: requirement.businessImpact,
    technicalComplexity: requirement.technicalComplexity,
    regulatoryFactor: requirement.regulatoryFactor,
    usageFrequency: requirement.usageFrequency,
    versions: requirement.versions || []
  });

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
      [name]: name === 'priority' ? value : Number(value)
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...requirement,
      ...formData,
      testDepthFactor: parseFloat(calculateTDF()),
      minTestCases: calculateMinTestCases()
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-semibold mb-4">Edit Requirement</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
            <input
              type="text"
              value={requirement.id}
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
          
          <div className="mb-4">
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
import React, { useState } from 'react';

/**
 * Component for creating a new release version
 */
const NewReleaseForm = ({ onSave, onCancel, existingVersions }) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Initial form state
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    releaseDate: '',
    status: 'Planned',
    qualityGates: [
      { name: 'Critical requirements tested', target: 100, actual: 0, status: 'failed' },
      { name: 'Overall test pass rate', target: 95, actual: 0, status: 'failed' },
      { name: 'Automation coverage', target: 80, actual: 0, status: 'failed' }
    ]
  });
  
  // Form validation state
  const [errors, setErrors] = useState({});
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when field is updated
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  // Handle quality gate changes
  const handleGateChange = (index, field, value) => {
    const updatedGates = [...formData.qualityGates];
    updatedGates[index] = { ...updatedGates[index], [field]: field === 'target' || field === 'actual' ? Number(value) : value };
    
    setFormData(prev => ({
      ...prev,
      qualityGates: updatedGates
    }));
  };
  
  // Add a new quality gate
  const handleAddGate = () => {
    setFormData(prev => ({
      ...prev,
      qualityGates: [
        ...prev.qualityGates,
        { name: '', target: 90, actual: 0, status: 'failed' }
      ]
    }));
  };
  
  // Remove a quality gate
  const handleRemoveGate = (index) => {
    const updatedGates = [...formData.qualityGates];
    updatedGates.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      qualityGates: updatedGates
    }));
  };
  
  // Validate the form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.id.trim()) {
      newErrors.id = 'Version ID is required';
    } else if (!/^v\d+\.\d+$/.test(formData.id)) {
      newErrors.id = 'ID format should be v#.# (e.g., v2.3)';
    } else if (existingVersions.some(v => v.id === formData.id)) {
      newErrors.id = 'This version ID already exists';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Version name is required';
    }
    
    if (!formData.releaseDate.trim()) {
      newErrors.releaseDate = 'Release date is required';
    }
    
    // Validate each quality gate
    const gateErrors = formData.qualityGates.map(gate => {
      const errors = {};
      if (!gate.name.trim()) errors.name = true;
      if (gate.target <= 0 || gate.target > 100) errors.target = true;
      return Object.keys(errors).length > 0 ? errors : null;
    });
    
    if (gateErrors.some(error => error !== null)) {
      newErrors.qualityGates = gateErrors;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Create New Release</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Version ID
            </label>
            <input
              type="text"
              name="id"
              value={formData.id}
              onChange={handleChange}
              placeholder="e.g., v2.3"
              className={`w-full p-2 border rounded ${errors.id ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.id && (
              <p className="mt-1 text-xs text-red-600">{errors.id}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Use format: v#.# (e.g., v2.3)
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Version Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Version 2.3"
              className={`w-full p-2 border rounded ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Release Date
            </label>
            <input
              type="date"
              name="releaseDate"
              value={formData.releaseDate}
              onChange={handleChange}
              min={today}
              className={`w-full p-2 border rounded ${errors.releaseDate ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.releaseDate && (
              <p className="mt-1 text-xs text-red-600">{errors.releaseDate}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="Planned">Planned</option>
              <option value="In Progress">In Progress</option>
              <option value="Released">Released</option>
              <option value="Deprecated">Deprecated</option>
            </select>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">
              Quality Gates
            </label>
            <button
              type="button"
              onClick={handleAddGate}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Add Quality Gate
            </button>
          </div>
          
          {formData.qualityGates.map((gate, index) => (
            <div key={index} className="bg-gray-50 p-3 rounded mb-2">
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-5">
                  <input
                    type="text"
                    value={gate.name}
                    onChange={(e) => handleGateChange(index, 'name', e.target.value)}
                    placeholder="Gate name"
                    className={`w-full p-2 border rounded text-sm ${
                      errors.qualityGates && errors.qualityGates[index]?.name 
                        ? 'border-red-500' 
                        : 'border-gray-300'
                    }`}
                  />
                </div>
                <div className="col-span-2">
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={gate.target}
                      onChange={(e) => handleGateChange(index, 'target', e.target.value)}
                      min="0"
                      max="100"
                      className={`w-full p-2 border rounded text-sm ${
                        errors.qualityGates && errors.qualityGates[index]?.target 
                          ? 'border-red-500' 
                          : 'border-gray-300'
                      }`}
                    />
                    <span className="ml-1">%</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={gate.actual}
                      onChange={(e) => handleGateChange(index, 'actual', e.target.value)}
                      min="0"
                      max="100"
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                    />
                    <span className="ml-1">%</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <select
                    value={gate.status}
                    onChange={(e) => handleGateChange(index, 'status', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  {formData.qualityGates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveGate(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>
              {index === 0 && (
                <div className="grid grid-cols-12 gap-2 mt-1 text-xs text-gray-500">
                  <div className="col-span-5">Gate name</div>
                  <div className="col-span-2">Target</div>
                  <div className="col-span-2">Actual</div>
                  <div className="col-span-2">Status</div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded shadow-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700"
          >
            Create Release
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewReleaseForm;
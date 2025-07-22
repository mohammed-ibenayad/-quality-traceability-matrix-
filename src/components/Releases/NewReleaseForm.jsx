import React, { useState } from 'react';
import QualityGateSelector, { PREDEFINED_QUALITY_GATES } from './QualityGateSelector';

/**
 * Component for creating a new release version - Updated layout to match EditVersionModal
 */
const NewReleaseForm = ({ onSave, onCancel, existingVersions, requirements, testCases, mapping, coverage }) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Initial form state
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    releaseDate: '',
    status: 'Planned',
    description: '',
    qualityGates: []
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
  
  // Handle adding a quality gate
  const handleAddGate = (newGate) => {
    setFormData(prev => ({
      ...prev,
      qualityGates: [...prev.qualityGates, newGate]
    }));
  };
  
  // Handle removing a quality gate
  const handleRemoveGate = (gateId) => {
    setFormData(prev => ({
      ...prev,
      qualityGates: prev.qualityGates.filter(gate => gate.id !== gateId)
    }));
  };
  
  // Handle updating a quality gate
  const handleUpdateGate = (gateId, updates) => {
    setFormData(prev => ({
      ...prev,
      qualityGates: prev.qualityGates.map(gate => 
        gate.id === gateId ? { ...gate, ...updates } : gate
      )
    }));
  };
  
  // Calculate actual metrics for all gates based on current data
  const calculateActualMetrics = () => {
    if (!requirements || !testCases || !mapping || !coverage) {
      return;
    }
    
    const updatedGates = formData.qualityGates.map(gate => {
      // Find the corresponding gate definition
      const gateDefinition = PREDEFINED_QUALITY_GATES.find(g => g.id === gate.id);
      if (!gateDefinition) return gate;
      
      // Calculate the actual value
      const actual = gateDefinition.calculateActual(requirements, testCases, mapping, coverage);
      
      // Determine if the gate is passed based on target and actual
      // For inverted metrics (like defect density), lower is better
      let status = 'failed';
      if (gateDefinition.isInverted) {
        status = actual <= gate.target ? 'passed' : 'failed';
      } else {
        status = actual >= gate.target ? 'passed' : 'failed';
      }
      
      return {
        ...gate,
        actual,
        status
      };
    });
    
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Recalculate metrics before saving
    calculateActualMetrics();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Version ID *
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
            Version Name *
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
            Release Date *
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          placeholder="Optional description of this release version..."
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">
            Quality Gates
          </label>
          <button
            type="button"
            onClick={calculateActualMetrics}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Recalculate Metrics
          </button>
        </div>
        
        {/* Only show QualityGateSelector if it exists, otherwise show a placeholder */}
        {typeof QualityGateSelector !== 'undefined' ? (
          <QualityGateSelector
            selectedGates={formData.qualityGates}
            onAddGate={handleAddGate}
            onRemoveGate={handleRemoveGate}
            onUpdateGate={handleUpdateGate}
          />
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500">
            <p className="text-sm">Quality Gate configuration will be available when QualityGateSelector component is implemented.</p>
            <p className="text-xs mt-1">Current gates: {formData.qualityGates.length}</p>
          </div>
        )}
      </div>

      {/* Modal Footer */}
      <div className="flex justify-end gap-3 pt-6 border-t">
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
  );
};

export default NewReleaseForm;
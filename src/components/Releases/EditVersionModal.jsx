import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import QualityGateSelector from './QualityGateSelector';

/**
 * Modal for editing an existing release version
 */
const EditVersionModal = ({ version, isOpen, onClose, onSave, existingVersions }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    releaseDate: '',
    status: 'Planned',
    description: '',
    qualityGates: []
  });
  
  const [errors, setErrors] = useState({});

  // Populate form when version prop changes
  useEffect(() => {
    if (version && isOpen) {
      setFormData({
        id: version.id || '',
        name: version.name || '',
        releaseDate: version.releaseDate ? version.releaseDate.split('T')[0] : '', // Format for date input
        status: version.status || 'Planned',
        description: version.description || '',
        qualityGates: version.qualityGates || []
      });
      setErrors({});
    }
  }, [version, isOpen]);

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
  const handleAddGate = (newGate) => {
    setFormData(prev => ({
      ...prev,
      qualityGates: [...prev.qualityGates, newGate]
    }));
  };

  const handleRemoveGate = (gateId) => {
    setFormData(prev => ({
      ...prev,
      qualityGates: prev.qualityGates.filter(gate => gate.id !== gateId)
    }));
  };

  const handleUpdateGate = (gateId, updates) => {
    setFormData(prev => ({
      ...prev,
      qualityGates: prev.qualityGates.map(gate => 
        gate.id === gateId ? { ...gate, ...updates } : gate
      )
    }));
  };

  // Validate the form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Version name is required';
    }
    
    if (!formData.releaseDate.trim()) {
      newErrors.releaseDate = 'Release date is required';
    }
    
    // Check if ID was changed and conflicts with existing versions
    if (formData.id !== version?.id && existingVersions.some(v => v.id === formData.id)) {
      newErrors.id = 'This version ID already exists';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave({
        ...formData,
        // Keep original ID if not changed, don't allow ID changes for existing versions
        id: version?.id || formData.id,
        updatedAt: new Date().toISOString()
      });
      
      // Close modal after successful save
      handleClose();
    }
  };

  // Handle modal close
  const handleClose = () => {
    setFormData({
      id: '',
      name: '',
      releaseDate: '',
      status: 'Planned',
      description: '',
      qualityGates: []
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto border w-11/12 max-w-4xl shadow-lg rounded-lg bg-white flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex-shrink-0 flex justify-between items-center p-6 border-b bg-white rounded-t-lg">
          <h2 className="text-xl font-semibold">Edit Release Version</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Version ID
                </label>
                <input
                  type="text"
                  name="id"
                  value={formData.id}
                  disabled // Don't allow changing ID for existing versions
                  className="w-full p-2 border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Version ID cannot be changed
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
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Quality Gates
              </label>
              
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
          </form>
        </div>

        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditVersionModal;
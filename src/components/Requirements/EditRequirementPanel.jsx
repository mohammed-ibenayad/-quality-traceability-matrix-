import React, { useState, useEffect } from 'react';
import SlideOutPanel from '../Common/SlideOutPanel';
import { AlertCircle } from 'lucide-react';

/**
 * EditRequirementPanel - Example implementation of SlideOutPanel for editing requirements
 * 
 * @param {boolean} isOpen - Panel open state
 * @param {function} onClose - Close callback
 * @param {object} requirement - Requirement object to edit (null for new requirement)
 * @param {function} onSave - Save callback
 * @param {array} versions - Available versions
 */
const EditRequirementPanel = ({
  isOpen,
  onClose,
  requirement = null,
  onSave,
  versions = []
}) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    priority: 'Medium',
    type: 'Functional',
    businessImpact: 3,
    technicalComplexity: 3,
    regulatoryFactor: 1,
    usageFrequency: 3,
    status: 'Active',
    owner: '',
    tags: [],
    versions: []
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when requirement changes
  useEffect(() => {
    if (requirement) {
      setFormData({
        id: requirement.id || '',
        name: requirement.name || '',
        description: requirement.description || '',
        priority: requirement.priority || 'Medium',
        type: requirement.type || 'Functional',
        businessImpact: requirement.businessImpact || 3,
        technicalComplexity: requirement.technicalComplexity || 3,
        regulatoryFactor: requirement.regulatoryFactor || 1,
        usageFrequency: requirement.usageFrequency || 3,
        status: requirement.status || 'Active',
        owner: requirement.owner || '',
        tags: requirement.tags || [],
        versions: requirement.versions || []
      });
    } else {
      // Reset form for new requirement
      setFormData({
        id: '',
        name: '',
        description: '',
        priority: 'Medium',
        type: 'Functional',
        businessImpact: 3,
        technicalComplexity: 3,
        regulatoryFactor: 1,
        usageFrequency: 3,
        status: 'Active',
        owner: '',
        tags: [],
        versions: []
      });
    }
    setErrors({});
  }, [requirement, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.id.trim()) {
      newErrors.id = 'Requirement ID is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Requirement name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving requirement:', error);
      setErrors({ submit: 'Failed to save requirement. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (JSON.stringify(formData) !== JSON.stringify(requirement || {})) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const footer = (
    <div className="flex space-x-3">
      <button
        onClick={handleCancel}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        disabled={isSaving}
      >
        Cancel
      </button>
      <button
        onClick={handleSave}
        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isSaving}
      >
        {isSaving ? 'Saving...' : requirement ? 'Update Requirement' : 'Create Requirement'}
      </button>
    </div>
  );

  return (
    <SlideOutPanel
      isOpen={isOpen}
      onClose={handleCancel}
      title={requirement ? 'Edit Requirement' : 'New Requirement'}
      width="lg"
      footer={footer}
    >
      <div className="space-y-6">
        {/* Error message */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="text-sm font-medium text-red-800">Error</h4>
              <p className="text-sm text-red-700 mt-1">{errors.submit}</p>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>

          {/* Requirement ID */}
          <div className="mb-4">
            <label htmlFor="req-id" className="block text-sm font-medium text-gray-700 mb-1">
              Requirement ID <span className="text-red-500">*</span>
            </label>
            <input
              id="req-id"
              type="text"
              value={formData.id}
              onChange={(e) => handleInputChange('id', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.id ? 'border-red-300' : 'border-gray-300'
                }`}
              placeholder="e.g., REQ-001"
              disabled={!!requirement} // Can't change ID when editing
            />
            {errors.id && <p className="mt-1 text-sm text-red-600">{errors.id}</p>}
          </div>

          {/* Requirement Name */}
          <div className="mb-4">
            <label htmlFor="req-name" className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="req-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
              placeholder="Enter requirement name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="mb-4">
            <label htmlFor="req-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="req-description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
              placeholder="Describe the requirement in detail"
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>
        </div>

        {/* Classification */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Classification</h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label htmlFor="req-priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                id="req-priority"
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Type */}
            <div>
              <label htmlFor="req-type" className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                id="req-type"
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Functional">Functional</option>
                <option value="Non-Functional">Non-Functional</option>
                <option value="Security">Security</option>
                <option value="Performance">Performance</option>
                <option value="Usability">Usability</option>
                <option value="Compliance">Compliance</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="req-status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="req-status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Deprecated">Deprecated</option>
              </select>
            </div>

            {/* Owner */}
            <div>
              <label htmlFor="req-owner" className="block text-sm font-medium text-gray-700 mb-1">
                Owner
              </label>
              <input
                id="req-owner"
                type="text"
                value={formData.owner}
                onChange={(e) => handleInputChange('owner', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Team or person name"
              />
            </div>
          </div>
        </div>

        {/* Test Depth Factors */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Depth Factors</h3>

          {/* Business Impact */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Impact: {formData.businessImpact}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={formData.businessImpact}
              onChange={(e) => handleInputChange('businessImpact', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Low (1)</span>
              <span>High (5)</span>
            </div>
          </div>

          {/* Technical Complexity */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Technical Complexity: {formData.technicalComplexity}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={formData.technicalComplexity}
              onChange={(e) => handleInputChange('technicalComplexity', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Simple (1)</span>
              <span>Complex (5)</span>
            </div>
          </div>

          {/* Regulatory Factor */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Regulatory Factor: {formData.regulatoryFactor}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={formData.regulatoryFactor}
              onChange={(e) => handleInputChange('regulatoryFactor', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>None (1)</span>
              <span>Critical (5)</span>
            </div>
          </div>

          {/* Usage Frequency */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usage Frequency: {formData.usageFrequency}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={formData.usageFrequency}
              onChange={(e) => handleInputChange('usageFrequency', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Rare (1)</span>
              <span>Very Frequent (5)</span>
            </div>
          </div>
        </div>

        {/* Versions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Applicable Versions</h3>
          <div className="space-y-2">
            {versions.length > 0 ? (
              versions.map((version) => (
                <label key={version.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.versions.includes(version.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleInputChange('versions', [...formData.versions, version.id]);
                      } else {
                        handleInputChange('versions', formData.versions.filter(v => v !== version.id));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{version.name}</span>
                </label>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">No versions available. Create a version first.</p>
            )}
          </div>
        </div>

        {/* Tags */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
          <input
            type="text"
            value={formData.tags.join(', ')}
            onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter tags separated by commas"
          />
          <p className="mt-1 text-xs text-gray-500">
            Separate multiple tags with commas (e.g., Authentication, Security, Login)
          </p>
        </div>
      </div>
    </SlideOutPanel>
  );
};

export default EditRequirementPanel;
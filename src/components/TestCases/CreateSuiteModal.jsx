// Location: src/components/TestCases/CreateSuiteModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Layers, Edit } from 'lucide-react';

/**
 * CreateSuiteModal - Handles both CREATE and EDIT modes
 * 
 * Props:
 * - isOpen: boolean - Modal visibility
 * - onClose: function - Close handler
 * - onCreate: function(suiteData) - Submit handler (works for both create and edit)
 * - initialData: object - Pre-filled data for edit mode (optional)
 * - isEditMode: boolean - If true, shows "Edit" instead of "Create" (optional)
 */
const CreateSuiteModal = ({ 
  isOpen, 
  onClose, 
  onCreate,
  initialData = null,  // NEW: For edit mode
  isEditMode = false   // NEW: To distinguish create vs edit
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    version: '',
    suite_type: 'custom',
    estimated_duration: '',
    recommended_environment: ''
  });

  // NEW: Pre-fill form when editing
  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        version: initialData.version || '',
        suite_type: initialData.suite_type || 'custom',
        estimated_duration: initialData.estimated_duration || '',
        recommended_environment: initialData.recommended_environment || ''
      });
    } else if (!isEditMode) {
      // Reset form when creating new suite
      setFormData({
        name: '',
        description: '',
        version: '',
        suite_type: 'custom',
        estimated_duration: '',
        recommended_environment: ''
      });
    }
  }, [isEditMode, initialData, isOpen]); // Re-run when modal opens or mode changes

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onCreate(formData);
    
    // Reset form after submission (only for create mode)
    if (!isEditMode) {
      setFormData({
        name: '',
        description: '',
        version: '',
        suite_type: 'custom',
        estimated_duration: '',
        recommended_environment: ''
      });
    }
    
    onClose();
  };

  // NEW: Handle close with form reset
  const handleClose = () => {
    if (!isEditMode) {
      setFormData({
        name: '',
        description: '',
        version: '',
        suite_type: 'custom',
        estimated_duration: '',
        recommended_environment: ''
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {/* NEW: Different icon for edit mode */}
              {isEditMode ? (
                <Edit size={24} className="text-blue-600" />
              ) : (
                <Layers size={24} className="text-blue-600" />
              )}
              {/* NEW: Different title for edit mode */}
              <h2 className="text-xl font-semibold">
                {isEditMode ? 'Edit Test Suite' : 'Create Test Suite'}
              </h2>
            </div>
            <button 
              onClick={handleClose} 
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Suite Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suite Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Smoke Test Suite"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the purpose of this test suite..."
              />
            </div>

            {/* Suite Type and Version */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Suite Type
                </label>
                <select
                  value={formData.suite_type}
                  onChange={(e) => setFormData({ ...formData, suite_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="smoke">Smoke</option>
                  <option value="regression">Regression</option>
                  <option value="sanity">Sanity</option>
                  <option value="integration">Integration</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Version
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., v1.0"
                />
              </div>
            </div>

            {/* Estimated Duration and Environment */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.estimated_duration}
                  onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 30"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recommended Environment
                </label>
                <input
                  type="text"
                  value={formData.recommended_environment}
                  onChange={(e) => setFormData({ ...formData, recommended_environment: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Staging"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                {/* NEW: Different button text for edit mode */}
                {isEditMode ? 'Save Changes' : 'Create Suite'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateSuiteModal;
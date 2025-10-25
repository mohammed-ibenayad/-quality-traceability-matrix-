// Location: src/components/TestCases/EditSuiteModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Layers } from 'lucide-react';

const EditSuiteModal = ({ isOpen, onClose, onUpdate, suite }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    version: '',
    suite_type: 'custom',
    estimated_duration: '',
    recommended_environment: ''
  });

  // Pre-populate form when suite changes
  useEffect(() => {
    if (suite) {
      setFormData({
        name: suite.name || '',
        description: suite.description || '',
        version: suite.version || '',
        suite_type: suite.suite_type || 'custom',
        estimated_duration: suite.estimated_duration || '',
        recommended_environment: suite.recommended_environment || ''
      });
    }
  }, [suite]);

  if (!isOpen || !suite) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onUpdate(suite.id, formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Layers size={24} className="text-blue-600" />
              <h2 className="text-xl font-semibold">Edit Test Suite</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suite Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., Smoke Test Suite"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Describe the purpose of this test suite..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Suite Type
                </label>
                <select
                  value={formData.suite_type}
                  onChange={(e) => setFormData({ ...formData, suite_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., v1.0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Duration
                </label>
                <input
                  type="text"
                  value={formData.estimated_duration}
                  onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., 2 hours"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Staging"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Update Suite
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditSuiteModal;
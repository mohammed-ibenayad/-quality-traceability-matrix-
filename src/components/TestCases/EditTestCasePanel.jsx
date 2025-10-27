// src/components/TestCases/EditTestCasePanel.jsx
import React, { useState, useEffect } from 'react';
import SlideOutPanel from '../Common/SlideOutPanel';
import { AlertCircle } from 'lucide-react';

/**
 * EditTestCasePanel - Slide-out panel for editing test cases
 * Similar to EditRequirementPanel
 * 
 * @param {boolean} isOpen - Panel open state
 * @param {function} onClose - Close callback
 * @param {object} testCase - Test case object to edit (null for new test case)
 * @param {function} onSave - Save callback
 * @param {array} versions - Available versions
 * @param {array} requirements - Available requirements for linking
 */
const EditTestCasePanel = ({
  isOpen,
  onClose,
  testCase = null,
  onSave,
  versions = [],
  requirements = []
}) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    category: '',
    priority: 'Medium',
    automationStatus: 'Manual',
    status: 'Not Run',
    steps: [],
    expectedResult: '',
    preconditions: '',
    testData: '',
    tags: [],
    requirementIds: [],
    applicableVersions: [],
    assignee: '',
    estimatedDuration: null
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when test case changes
  useEffect(() => {
    if (testCase) {
      setFormData({
        id: testCase.id || '',
        name: testCase.name || '',
        description: testCase.description || '',
        category: testCase.category || '',
        priority: testCase.priority || 'Medium',
        automationStatus: testCase.automationStatus || 'Manual',
        status: testCase.status || 'Not Run',
        steps: testCase.steps || [],
        expectedResult: testCase.expectedResult || '',
        preconditions: testCase.preconditions || '',
        testData: testCase.testData || '',
        tags: testCase.tags || [],
        requirementIds: testCase.requirementIds || [],
        applicableVersions: testCase.applicableVersions || [],
        assignee: testCase.assignee || '',
        estimatedDuration: testCase.estimatedDuration || null
      });
    } else {
      // Reset form for new test case
      setFormData({
        id: '',
        name: '',
        description: '',
        category: '',
        priority: 'Medium',
        automationStatus: 'Manual',
        status: 'Not Run',
        steps: [],
        expectedResult: '',
        preconditions: '',
        testData: '',
        tags: [],
        requirementIds: [],
        applicableVersions: [],
        assignee: '',
        estimatedDuration: null
      });
    }
    setErrors({});
  }, [testCase]);

  // Handle input changes
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

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.id.trim()) {
      newErrors.id = 'Test Case ID is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Test Case Name is required';
    }

    return newErrors;
  };

  // Handle save
  const handleSave = async () => {
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to save test case' });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (Object.keys(formData).some(key => formData[key] !== (testCase?.[key] || ''))) {
      if (window.confirm('You have unsaved changes. Discard them?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Handle version toggle
  const handleVersionToggle = (versionId) => {
    setFormData(prev => {
      const versions = prev.applicableVersions || [];
      if (versions.includes(versionId)) {
        return {
          ...prev,
          applicableVersions: versions.filter(v => v !== versionId)
        };
      } else {
        return {
          ...prev,
          applicableVersions: [...versions, versionId]
        };
      }
    });
  };

  // Handle requirement toggle
  const handleRequirementToggle = (reqId) => {
    setFormData(prev => {
      const reqs = prev.requirementIds || [];
      if (reqs.includes(reqId)) {
        return {
          ...prev,
          requirementIds: reqs.filter(r => r !== reqId)
        };
      } else {
        return {
          ...prev,
          requirementIds: [...reqs, reqId]
        };
      }
    });
  };

  // Footer with action buttons
  const footer = (
    <div className="flex space-x-3">
      <button
        type="button"
        onClick={handleCancel}
        disabled={isSaving}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : testCase ? 'Update Test Case' : 'Create Test Case'}
      </button>
    </div>
  );

  return (
    <SlideOutPanel
      isOpen={isOpen}
      onClose={handleCancel}
      title={testCase ? 'Edit Test Case' : 'New Test Case'}
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

          {/* Test Case ID */}
          <div className="mb-4">
            <label htmlFor="tc-id" className="block text-sm font-medium text-gray-700 mb-1">
              Test Case ID <span className="text-red-500">*</span>
            </label>
            <input
              id="tc-id"
              type="text"
              value={formData.id}
              onChange={(e) => handleInputChange('id', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.id ? 'border-red-300' : 'border-gray-300'
                }`}
              placeholder="e.g., TC-001"
              disabled={!!testCase} // Can't change ID when editing
            />
            {errors.id && <p className="mt-1 text-sm text-red-600">{errors.id}</p>}
          </div>

          {/* Test Case Name */}
          <div className="mb-4">
            <label htmlFor="tc-name" className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="tc-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
              placeholder="Enter test case name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="mb-4">
            <label htmlFor="tc-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="tc-description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe the test case"
            />
          </div>

          {/* Category */}
          <div className="mb-4">
            <label htmlFor="tc-category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              id="tc-category"
              type="text"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Authentication, UI, API"
            />
          </div>
        </div>

        {/* Classification */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Classification</h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label htmlFor="tc-priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                id="tc-priority"
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Automation Status */}
            <div>
              <label htmlFor="tc-automation" className="block text-sm font-medium text-gray-700 mb-1">
                Automation Status
              </label>
              <select
                id="tc-automation"
                value={formData.automationStatus}
                onChange={(e) => handleInputChange('automationStatus', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Automated">Automated</option>
                <option value="Semi-Automated">Semi-Automated</option>
                <option value="Manual">Manual</option>
                <option value="Planned">Planned</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="tc-status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="tc-status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Not Run">Not Run</option>
                <option value="Passed">Passed</option>
                <option value="Failed">Failed</option>
                <option value="Blocked">Blocked</option>
                <option value="Skipped">Skipped</option>
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label htmlFor="tc-assignee" className="block text-sm font-medium text-gray-700 mb-1">
                Assignee
              </label>
              <input
                id="tc-assignee"
                type="text"
                value={formData.assignee}
                onChange={(e) => handleInputChange('assignee', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter assignee name"
              />
            </div>
          </div>
        </div>

        {/* Test Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Details</h3>

          {/* Preconditions */}
          <div className="mb-4">
            <label htmlFor="tc-preconditions" className="block text-sm font-medium text-gray-700 mb-1">
              Preconditions
            </label>
            <textarea
              id="tc-preconditions"
              value={formData.preconditions}
              onChange={(e) => handleInputChange('preconditions', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Prerequisites before running the test"
            />
          </div>

          {/* Test Steps */}
          <div className="mb-4">
            <label htmlFor="tc-steps" className="block text-sm font-medium text-gray-700 mb-1">
              Test Steps
            </label>
            <textarea
              id="tc-steps"
              value={Array.isArray(formData.steps) ? formData.steps.join('\n') : formData.steps}
              onChange={(e) => handleInputChange('steps', e.target.value.split('\n'))}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter each step on a new line"
            />
            <p className="mt-1 text-xs text-gray-500">Enter each step on a new line</p>
          </div>

          {/* Expected Result */}
          <div className="mb-4">
            <label htmlFor="tc-expected" className="block text-sm font-medium text-gray-700 mb-1">
              Expected Result
            </label>
            <textarea
              id="tc-expected"
              value={formData.expectedResult}
              onChange={(e) => handleInputChange('expectedResult', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="What should happen when the test passes"
            />
          </div>

          {/* Test Data */}
          <div className="mb-4">
            <label htmlFor="tc-testdata" className="block text-sm font-medium text-gray-700 mb-1">
              Test Data
            </label>
            <textarea
              id="tc-testdata"
              value={formData.testData}
              onChange={(e) => handleInputChange('testData', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Test data needed for this test"
            />
          </div>

          {/* Estimated Duration */}
          <div className="mb-4">
            <label htmlFor="tc-duration" className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Duration (minutes)
            </label>
            <input
              id="tc-duration"
              type="number"
              value={formData.estimatedDuration || ''}
              onChange={(e) => handleInputChange('estimatedDuration', e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 5"
              min="0"
            />
          </div>
        </div>

        {/* Linked Requirements */}
        {requirements.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Linked Requirements</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {requirements.map(req => (
                <label
                  key={req.id}
                  className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.requirementIds.includes(req.id)}
                    onChange={() => handleRequirementToggle(req.id)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{req.id}</div>
                    <div className="text-xs text-gray-600">{req.name}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Applicable Versions */}
        {versions.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Applicable Versions</h3>
            <p className="text-sm text-gray-600 mb-3">
              Select versions this test case applies to (leave empty for all versions)
            </p>
            <div className="space-y-2">
              {versions.map(version => (
                <label
                  key={version.id}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.applicableVersions.includes(version.id)}
                    onChange={() => handleVersionToggle(version.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-900">{version.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
          <input
            type="text"
            value={Array.isArray(formData.tags) ? formData.tags.join(', ') : ''}
            onChange={(e) => {
              // Let user type freely - don't process yet
              e.target.dataset.rawValue = e.target.value;
            }}
            onBlur={(e) => {
              // Process tags when user finishes typing
              const tagsArray = (e.target.dataset.rawValue || e.target.value)
                .split(',')
                .map(t => t.trim())
                .filter(t => t);
              handleInputChange('tags', tagsArray);
              delete e.target.dataset.rawValue;
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter tags separated by commas (e.g., UI, Authentication, Security)"
          />
          <p className="mt-1 text-xs text-gray-500">Separate tags with commas</p>
        </div>
      </div>
    </SlideOutPanel>
  );
};

export default EditTestCasePanel;
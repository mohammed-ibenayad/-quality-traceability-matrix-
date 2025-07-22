import React from 'react';
import { X } from 'lucide-react';
import NewReleaseForm from './NewReleaseForm';
import dataStore from '../../services/DataStore';
import { calculateCoverage } from '../../utils/coverage';

/**
 * Modal component for the new release form - Updated to exactly match EditVersionModal size
 */
const NewReleaseModal = ({ isOpen, onClose, onSave, existingVersions }) => {
  if (!isOpen) return null;

  // Get the required data for calculating metrics
  const requirements = dataStore.getRequirements();
  const testCases = dataStore.getTestCases();
  const mapping = dataStore.getMapping();
  
  // Calculate coverage metrics using the existing utility
  const coverage = calculateCoverage(requirements, mapping, testCases);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-0 border w-11/12 max-w-4xl shadow-lg rounded-lg bg-white">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Create New Release</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <NewReleaseForm 
            onSave={(formData) => {
              onSave(formData);
            }}
            onCancel={onClose}
            existingVersions={existingVersions}
            requirements={requirements}
            testCases={testCases}
            mapping={mapping}
            coverage={coverage}
          />
        </div>
      </div>
    </div>
  );
};

export default NewReleaseModal;
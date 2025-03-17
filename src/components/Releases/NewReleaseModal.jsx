import React from 'react';
import NewReleaseForm from './NewReleaseForm';

/**
 * Modal component for the new release form
 */
const NewReleaseModal = ({ isOpen, onClose, onSave, existingVersions }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="absolute top-0 right-0 pt-4 pr-4">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <NewReleaseForm 
            onSave={(formData) => {
              onSave(formData);
              onClose();
            }}
            onCancel={onClose}
            existingVersions={existingVersions}
          />
        </div>
      </div>
    </div>
  );
};

export default NewReleaseModal;
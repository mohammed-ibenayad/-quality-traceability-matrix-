import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';

const DeleteWorkspaceDialog = ({ workspace, onClose, onConfirm }) => {
  const [confirmText, setConfirmText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const expectedText = workspace?.name;
  const isConfirmEnabled = confirmText === expectedText;
  
  const handleConfirm = async () => {
    if (!isConfirmEnabled) return;
    
    try {
      setIsLoading(true);
      setError('');
      
      await onConfirm();
    } catch (error) {
      console.error('Error deleting workspace:', error);
      setError(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Failed to delete workspace'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Modal isOpen onClose={onClose}>
      <div className="p-6 max-w-md mx-auto">
        <div className="flex items-center justify-center mb-6 text-red-600">
          <AlertTriangle size={48} strokeWidth={1.5} />
        </div>
        
        <h2 className="text-xl font-bold text-center text-red-600 mb-4">
          Delete Workspace
        </h2>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            You are about to delete the workspace <strong>{workspace?.name}</strong>. 
            This action cannot be undone and will:
          </p>
          
          <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
            <li>Delete all requirements, test cases, and test results</li>
            <li>Remove all team members from the workspace</li>
            <li>Delete all workspace settings and configurations</li>
          </ul>
          
          <p className="text-gray-700">
            To confirm, please type <strong>{expectedText}</strong> below.
          </p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <div className="mb-6">
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={`Type "${expectedText}" to confirm`}
          />
        </div>
        
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirm}
            disabled={!isConfirmEnabled || isLoading}
            loading={isLoading}
          >
            Delete Workspace
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteWorkspaceDialog;
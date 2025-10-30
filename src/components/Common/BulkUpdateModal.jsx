// BulkUpdateModal.jsx
// A unified, reusable modal for bulk updates (versions, tags) across requirements and test cases

import React from 'react';

/**
 * Unified Bulk Update Modal Component
 * 
 * @param {Object} props
 * @param {boolean} props.show - Whether the modal is visible
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Function} props.onConfirm - Callback when confirm is clicked
 * @param {string} props.type - Type of update: 'version' or 'tag'
 * @param {string} props.action - Action: 'add' or 'remove'
 * @param {string} props.itemType - Type of items being updated: 'requirement' or 'test case'
 * @param {number} props.selectedCount - Number of items selected
 * @param {Array|string} props.items - Items being added/removed (versions array or tags array)
 * @param {Array} props.allItems - All available items (for looking up names)
 * @param {boolean} props.isProcessing - Whether update is in progress
 * @param {Object} props.processProgress - Progress object { current: number, total: number }
 */
const BulkUpdateModal = ({
  show,
  onClose,
  onConfirm,
  type = 'version',           // 'version' or 'tag'
  action = 'add',             // 'add' or 'remove'
  itemType = 'requirement',   // 'requirement' or 'test case'
  selectedCount = 0,
  items = [],                 // version ID (string) or tags array
  allItems = [],              // all versions or all available tags
  isProcessing = false,
  processProgress = { current: 0, total: 0 }
}) => {
  if (!show) return null;

  // Determine singular/plural for item type
  const itemTypePlural = selectedCount === 1 ? itemType : `${itemType}s`;
  
  // Get display name(s) for the items being added/removed
  const getDisplayName = () => {
    if (type === 'version') {
      // For versions, items is a single version ID
      const version = allItems.find(v => v.id === items);
      return version?.name || items;
    } else {
      // For tags, items is an array
      const tagArray = Array.isArray(items) ? items : [items];
      if (tagArray.length === 1) {
        return `"${tagArray[0]}"`;
      }
      return `${tagArray.length} tags`;
    }
  };

  // Get title text
  const getTitleText = () => {
    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
    const actionLabel = action === 'add' ? 'Addition' : 'Removal';
    return `Confirm ${typeLabel} ${actionLabel}`;
  };

  // Get action color
  const getActionColor = () => {
    return action === 'add' ? 'blue' : 'red';
  };

  const color = getActionColor();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <h3 className="text-lg font-semibold mb-4">
          {getTitleText()}
        </h3>
        
        {isProcessing ? (
          // Progress View
          <div className="mb-4">
            <div className={`bg-${color}-50 border border-${color}-200 rounded-lg p-4 mb-3`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700 font-medium">
                  Processing {itemTypePlural}...
                </span>
                <span className={`text-sm font-semibold text-${color}-600`}>
                  {processProgress.current} / {processProgress.total}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`bg-${color}-600 h-2.5 rounded-full transition-all duration-300`}
                  style={{ 
                    width: `${processProgress.total > 0 ? (processProgress.current / processProgress.total) * 100 : 0}%` 
                  }}
                />
              </div>

              {/* Percentage */}
              <div className="text-xs text-gray-500 mt-1 text-right">
                {processProgress.total > 0 
                  ? Math.round((processProgress.current / processProgress.total) * 100)
                  : 0}% complete
              </div>
            </div>
          </div>
        ) : (
          // Normal Confirmation View
          <div className={`bg-${color}-50 border border-${color}-200 rounded-lg p-4 mb-4`}>
            <p className="text-sm mb-2">
              You are about to <strong>{action}</strong> the following {type}
              {action === 'add' ? ' to' : ' from'} <strong>{selectedCount}</strong> {itemTypePlural}:
            </p>
            <div className={`font-medium text-${color}-800 mt-2`}>
              {getDisplayName()}
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className={`flex-1 py-2 px-4 rounded font-medium flex items-center justify-center gap-2 transition-colors ${
              isProcessing
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : action === 'add'
                  ? `bg-${color}-600 text-white hover:bg-${color}-700`
                  : `bg-${color}-600 text-white hover:bg-${color}-700`
            }`}
          >
            {isProcessing ? (
              <>
                {/* Spinning loader icon */}
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    fill="none"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Processing...</span>
              </>
            ) : (
              `Confirm ${action === 'add' ? 'Addition' : 'Removal'}`
            )}
          </button>
          
          <button
            onClick={onClose}
            disabled={isProcessing}
            className={`flex-1 py-2 px-4 border border-gray-300 rounded font-medium text-gray-700 transition-colors ${
              isProcessing
                ? 'bg-gray-100 cursor-not-allowed opacity-50'
                : 'hover:bg-gray-50'
            }`}
          >
            {isProcessing ? 'Processing...' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUpdateModal;
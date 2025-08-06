// src/components/TestCases/TestCaseRowActions.jsx
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Play, 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  Copy,
  History,
  Link,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const TestCaseRowActions = ({ 
  testCase, 
  onView, 
  onEdit, 
  onDelete, 
  onExecute, 
  onDuplicate = null
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (showDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 200; // Approximate dropdown height
      const viewportHeight = window.innerHeight;
      
      // Position above if near bottom, otherwise below
      const shouldPositionAbove = rect.bottom + dropdownHeight > viewportHeight - 50;
      
      setDropdownPosition({
        top: shouldPositionAbove ? rect.top - dropdownHeight : rect.bottom + 4,
        left: rect.right - 192 // 192px = w-48 (48 * 4px = 192px)
      });
    }
  }, [showDropdown]);

  // Always show Run/Execute as primary action - simplified
  const primaryAction = {
    action: () => onExecute(testCase),
    icon: Play,
    className: 'text-green-600 hover:text-green-800 hover:bg-green-50',
    title: 'Execute test case'
  };

  const PrimaryIcon = primaryAction.icon;

  // Dropdown component
  const DropdownMenu = () => (
    <div 
      className="fixed w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`
      }}
    >
      {/* View Details - always available */}
      <button
        onClick={() => {
          onView(testCase);
          setShowDropdown(false);
        }}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
      >
        <Eye size={14} className="mr-3 text-gray-400" />
        View Details
      </button>

      {/* Separator */}
      <div className="border-t border-gray-100 my-1"></div>

      {/* Copy/Duplicate - useful for test creation */}
      {onDuplicate && (
        <button
          onClick={() => {
            onDuplicate(testCase);
            setShowDropdown(false);
          }}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
        >
          <Copy size={14} className="mr-3 text-gray-400" />
          Duplicate
        </button>
      )}

      {/* View Linked Requirements - if has requirements */}
      {testCase.requirementIds && testCase.requirementIds.length > 0 && (
        <button
          onClick={() => {
            // Navigate to requirements with filter
            window.location.href = `/requirements?filter=${testCase.requirementIds[0]}`;
            setShowDropdown(false);
          }}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
        >
          <Link size={14} className="mr-3 text-gray-400" />
          View Requirements ({testCase.requirementIds.length})
        </button>
      )}

      {/* Separator before destructive action */}
      <div className="border-t border-gray-100 my-1"></div>

      {/* Delete - least used, potentially destructive */}
      <button
        onClick={() => {
          setShowDropdown(false);
          // Add confirmation dialog
          if (window.confirm(`Are you sure you want to delete test case "${testCase.id}"?`)) {
            onDelete(testCase.id);
          }
        }}
        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
      >
        <Trash2 size={14} className="mr-3 text-red-400" />
        Delete
      </button>
    </div>
  );

  return (
    <div className="flex items-center justify-end space-x-1">
      {/* Primary Action - Always Run/Execute with icon only */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          primaryAction.action();
        }}
        className="p-2 rounded-md transition-all duration-200 text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 border border-green-200"
        title={primaryAction.title}
      >
        <PrimaryIcon size={14} />
      </button>

      {/* Secondary Quick Action - Edit (always useful) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit(testCase);
        }}
        className="p-1.5 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors"
        title="Edit test case"
      >
        <Edit size={14} />
      </button>

      {/* More Actions Dropdown */}
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.stopPropagation();
            setShowDropdown(!showDropdown);
          }}
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          title="More actions"
        >
          <MoreHorizontal size={14} />
        </button>

        {/* Click outside handler and Portal dropdown */}
        {showDropdown && (
          <>
            {/* Click outside handler */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowDropdown(false)}
            />
            
            {/* Portal the dropdown to document body */}
            {createPortal(<DropdownMenu />, document.body)}
          </>
        )}
      </div>
    </div>
  );
};

export default TestCaseRowActions;
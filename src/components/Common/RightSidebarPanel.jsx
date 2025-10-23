import React, { useState } from 'react';
import { X, ChevronDown, ChevronRight } from 'lucide-react';

/**
 * RightSidebarPanel - Fixed sidebar panel for displaying item details and metadata
 * 
 * @param {string} title - Panel title
 * @param {function} onClose - Callback when panel should close
 * @param {ReactNode} children - Panel content (can use SidebarSection components)
 * @param {string} className - Additional CSS classes
 */
const RightSidebarPanel = ({
  title,
  onClose,
  children,
  className = ''
}) => {
  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

/**
 * SidebarSection - Collapsible section within the sidebar
 * 
 * @param {string} title - Section title
 * @param {ReactNode} children - Section content
 * @param {boolean} defaultOpen - Whether section is open by default
 * @param {ReactNode} icon - Optional icon to display next to title
 * @param {string} className - Additional CSS classes
 */
export const SidebarSection = ({
  title,
  children,
  defaultOpen = true,
  icon = null,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border-b border-gray-200 ${className}`}>
      {/* Section Header - Clickable to toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          {icon && <span className="text-gray-500">{icon}</span>}
          <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
        </div>
        {isOpen ? (
          <ChevronDown size={16} className="text-gray-400" />
        ) : (
          <ChevronRight size={16} className="text-gray-400" />
        )}
      </button>

      {/* Section Content */}
      {isOpen && (
        <div className="px-4 py-3 bg-gray-50">
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * SidebarField - Individual field display in sidebar
 * 
 * @param {string} label - Field label
 * @param {ReactNode} value - Field value (can be text, component, etc.)
 * @param {string} className - Additional CSS classes
 */
export const SidebarField = ({
  label,
  value,
  className = ''
}) => {
  return (
    <div className={`mb-3 last:mb-0 ${className}`}>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </dt>
      <dd className="text-sm text-gray-900">
        {value || <span className="text-gray-400 italic">Not set</span>}
      </dd>
    </div>
  );
};

/**
 * SidebarActionButton - Action button for sidebar
 * 
 * @param {ReactNode} icon - Button icon
 * @param {string} label - Button label
 * @param {function} onClick - Click handler
 * @param {string} variant - Button style: 'primary', 'secondary', 'danger'
 * @param {string} className - Additional CSS classes
 */
export const SidebarActionButton = ({
  icon,
  label,
  onClick,
  variant = 'secondary',
  className = ''
}) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${variants[variant]} ${className}`}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </button>
  );
};

/**
 * SidebarBadge - Badge component for tags, status, etc.
 * 
 * @param {string} label - Badge text
 * @param {string} color - Badge color: 'blue', 'green', 'red', 'yellow', 'gray'
 * @param {string} className - Additional CSS classes
 */
export const SidebarBadge = ({
  label,
  color = 'gray',
  className = ''
}) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    gray: 'bg-gray-100 text-gray-800',
    purple: 'bg-purple-100 text-purple-800'
  };

  return (
    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${colors[color]} ${className}`}>
      {label}
    </span>
  );
};

/**
 * SidebarDivider - Visual divider
 */
export const SidebarDivider = ({ className = '' }) => {
  return <div className={`border-t border-gray-200 my-4 ${className}`} />;
};

export default RightSidebarPanel;
// This file contains simplified versions of common UI components
// In a real application, you would use a UI library or more sophisticated components

import React, { useState, useEffect, useRef } from 'react';
import { X, Check, AlertCircle, Loader2 } from 'lucide-react';

// Button Component
export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon = null,
  loading = false, 
  disabled = false,
  className = '',
  ...props 
}) => {
  // Button styles based on variant
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-transparent',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-700 border-transparent',
    outline: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-600 border-transparent',
  };
  
  // Button sizes
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };
  
  const baseStyles = 'inline-flex items-center justify-center rounded-md border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500';
  const disabledStyles = 'opacity-50 cursor-not-allowed';
  
  const buttonClasses = `
    ${baseStyles}
    ${variantStyles[variant]} 
    ${sizeStyles[size]} 
    ${disabled || loading ? disabledStyles : ''}
    ${className}
  `;
  
  return (
    <button 
      className={buttonClasses} 
      disabled={disabled || loading} 
      {...props}
    >
      {loading ? (
        <Loader2 size={16} className="mr-2 animate-spin" />
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

// Input Component
export const Input = ({ 
  type = 'text', 
  error, 
  className = '',
  ...props 
}) => {
  const baseStyles = 'w-full px-3 py-2 border rounded-md text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
  const errorStyles = error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300';
  
  return (
    <div className="w-full">
      <input 
        type={type} 
        className={`${baseStyles} ${errorStyles} ${className}`}
        {...props} 
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

// Textarea Component
export const Textarea = ({ 
  rows = 3, 
  error, 
  className = '', 
  ...props 
}) => {
  const baseStyles = 'w-full px-3 py-2 border rounded-md text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
  const errorStyles = error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300';
  
  return (
    <div className="w-full">
      <textarea 
        rows={rows}
        className={`${baseStyles} ${errorStyles} ${className}`}
        {...props} 
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

// Select Component
export const Select = ({
  options = [],
  error,
  className = '',
  ...props
}) => {
  const baseStyles = 'w-full px-3 py-2 border rounded-md text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
  const errorStyles = error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300';
  
  return (
    <div className="w-full">
      <select 
        className={`${baseStyles} ${errorStyles} ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

// Alert Component
export const Alert = ({
  variant = 'info',
  title,
  message,
  onClose,
  className = '',
}) => {
  const variantStyles = {
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    error: 'bg-red-50 text-red-800 border-red-200',
  };
  
  return (
    <div className={`rounded-md border p-4 ${variantStyles[variant]} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle size={20} />
        </div>
        <div className="ml-3 flex-1">
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          {message && <div className="text-sm mt-1">{message}</div>}
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              onClick={onClose}
              className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Modal Component
export const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div
          className="fixed inset-0 bg-black bg-opacity-25 transition-opacity"
          onClick={onClose}
        ></div>
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:w-full sm:max-w-lg">
          {children}
        </div>
      </div>
    </div>
  );
};

// ConfirmDialog Component
export const ConfirmDialog = ({ 
  title, 
  message, 
  confirmLabel = 'Confirm', 
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  onConfirm, 
  onCancel 
}) => {
  return (
    <Modal isOpen={true} onClose={onCancel}>
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Popover Component
export const Popover = ({ trigger, content, isOpen, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(isOpen || false);
  const popoverRef = useRef(null);
  
  // Allow controlled or uncontrolled usage
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  
  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, setOpen]);
  
  return (
    <div className="relative" ref={popoverRef}>
      <div onClick={() => setOpen(!open)}>
        {trigger}
      </div>
      
      {open && (
        <div className="absolute right-0 z-10 mt-2 min-w-[10rem] rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {content}
        </div>
      )}
    </div>
  );
};

// Tabs Components
export const Tabs = ({ children, value, onValueChange, className = '' }) => {
  return (
    <div className={className}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return null;
        
        return React.cloneElement(child, {
          value,
          onValueChange,
        });
      })}
    </div>
  );
};

export const TabsList = ({ children, value, onValueChange, className = '' }) => {
  return (
    <div className={`inline-flex items-center space-x-1 rounded-md bg-gray-100 p-1 ${className}`}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return null;
        
        return React.cloneElement(child, {
          currentValue: value,
          onValueChange,
        });
      })}
    </div>
  );
};

export const TabsTrigger = ({ children, value, currentValue, onValueChange, className = '' }) => {
  const isActive = currentValue === value;
  
  return (
    <button
      className={`px-3 py-1.5 text-sm font-medium transition-all ${
        isActive 
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
      } rounded-md ${className}`}
      onClick={() => onValueChange?.(value)}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ children, value, currentValue }) => {
  if (value !== currentValue) return null;
  
  return <>{children}</>;
};

// Dropdown Components
export const Dropdown = ({ children }) => {
  return <div className="relative inline-block text-left">{children}</div>;
};

export const DropdownTrigger = ({ children, onClick }) => {
  return (
    <div onClick={onClick} className="cursor-pointer">
      {children}
    </div>
  );
};

export const DropdownMenu = ({ children, isOpen }) => {
  if (!isOpen) return null;
  
  return (
    <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
      <div className="py-1">{children}</div>
    </div>
  );
};

export const DropdownItem = ({ children, onClick, className = '' }) => {
  return (
    <button
      className={`block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
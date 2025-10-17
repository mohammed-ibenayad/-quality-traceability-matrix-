import React from 'react';
import { AlertCircle, X } from 'lucide-react';

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

export default Alert;
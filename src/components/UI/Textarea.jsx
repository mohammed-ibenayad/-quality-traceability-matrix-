import React from 'react';

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

export default Textarea;
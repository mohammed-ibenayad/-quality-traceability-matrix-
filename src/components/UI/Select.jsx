import React from 'react';

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

export default Select;
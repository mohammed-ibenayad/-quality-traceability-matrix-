import React from 'react';

export const Tabs = ({ children, value, onValueChange, className = '' }) => {
  return (
    <div className={className}>
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

export default { Tabs, TabsList, TabsTrigger, TabsContent };
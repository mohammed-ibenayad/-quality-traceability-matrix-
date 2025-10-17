import React from 'react';

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

export default { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem };
import React, { useState, useEffect, useRef } from 'react';

export const Popover = ({ trigger, content, isOpen: controlledIsOpen, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(controlledIsOpen || false);
  const popoverRef = useRef(null);
  
  // Allow controlled or uncontrolled usage
  const open = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;
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

export default Popover;
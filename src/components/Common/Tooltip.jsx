import React, { useState, useRef, useEffect } from 'react';

// src/components/Common/Tooltip.jsx
const Tooltip = ({ children, content, position = 'top', width = 'w-64' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef(null);
  
  // Close the tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setIsVisible(false);
      }
    };
    
    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible]);
  
  // Determine position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full mb-2';
      case 'bottom':
        return 'top-full mt-2';
      case 'left':
        return 'right-full mr-2';
      case 'right':
        return 'left-full ml-2';
      default:
        return 'bottom-full mb-2';
    }
  };
  
  return (
    <div className="relative inline-block" ref={tooltipRef}>
      <div 
        className="inline-flex items-center cursor-help"
        onClick={() => setIsVisible(!isVisible)}
      >
        {children}
      </div>
      
      {isVisible && (
        <div className={`absolute z-10 ${getPositionClasses()} ${width}`}>
          <div className="bg-gray-800 text-white text-sm rounded-lg shadow-lg p-3">
            {content}
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * SlideOutPanel - A reusable drawer component that slides in from the right
 * 
 * @param {boolean} isOpen - Controls panel visibility
 * @param {function} onClose - Callback when panel should close
 * @param {string} title - Panel header title
 * @param {string} width - Panel width: 'sm' (30%), 'md' (40%), 'lg' (50%), 'xl' (60%), 'full' (90%)
 * @param {ReactNode} children - Panel content
 * @param {ReactNode} footer - Optional footer content (action buttons)
 * @param {boolean} showBackdrop - Show overlay backdrop (default: true)
 * @param {boolean} closeOnBackdropClick - Close when clicking backdrop (default: true)
 * @param {boolean} closeOnEscape - Close when pressing Escape key (default: true)
 * @param {string} className - Additional CSS classes for panel
 */
const SlideOutPanel = ({
  isOpen = false,
  onClose,
  title,
  width = 'lg',
  children,
  footer = null,
  showBackdrop = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = ''
}) => {
  const panelRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Width mappings
  const widthClasses = {
    'sm': 'w-full sm:w-[90%] md:w-[40%] lg:w-[30%]',
    'md': 'w-full sm:w-[90%] md:w-[50%] lg:w-[40%]',
    'lg': 'w-full sm:w-[90%] md:w-[60%] lg:w-[50%]',
    'xl': 'w-full sm:w-[90%] md:w-[70%] lg:w-[60%]',
    'full': 'w-full sm:w-[95%]'
  };

  // Handle Escape key press
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement;
      
      // Focus the panel
      if (panelRef.current) {
        panelRef.current.focus();
      }

      // Prevent body scroll when panel is open
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
      
      // Restore focus to previous element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus trap - keep focus within panel
  useEffect(() => {
    if (!isOpen) return;

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      const focusableElements = panelRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      {showBackdrop && (
        <div
          className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
            isOpen ? 'bg-opacity-50' : 'bg-opacity-0'
          }`}
          onClick={closeOnBackdropClick ? onClose : undefined}
          aria-hidden="true"
        />
      )}

      {/* Slide-out panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
        tabIndex={-1}
        className={`fixed inset-y-0 right-0 flex flex-col bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          widthClasses[width]
        } ${isOpen ? 'translate-x-0' : 'translate-x-full'} ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
          <h2 id="panel-title" className="text-xl font-semibold text-gray-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close panel"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>

        {/* Footer - Action buttons */}
        {footer && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </>
  );
};

export default SlideOutPanel;
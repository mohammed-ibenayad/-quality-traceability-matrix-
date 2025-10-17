import React from 'react';
import { Loader2 } from 'lucide-react';

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

export default Button;
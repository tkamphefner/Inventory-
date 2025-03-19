import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  isLoading = false,
  disabled = false,
  icon = null,
  onClick,
  className = '',
  fullWidth = false,
}) {
  // Variant styles
  const variantClasses = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    outline: 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    success: 'bg-green-500 hover:bg-green-600 text-white',
    link: 'bg-transparent hover:underline text-primary-500 p-0',
  };

  // Size styles
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  // Disabled styles
  const disabledClasses = (disabled || isLoading) 
    ? 'opacity-50 cursor-not-allowed' 
    : 'cursor-pointer';

  // Width styles
  const widthClasses = fullWidth ? 'w-full' : '';

  // Combine all classes
  const buttonClasses = `
    ${variantClasses[variant] || variantClasses.primary}
    ${variant !== 'link' ? (sizeClasses[size] || sizeClasses.md) : ''}
    ${disabledClasses}
    ${widthClasses}
    font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
    transition-colors duration-200
    flex items-center justify-center
    ${className}
  `;

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      )}
      {!isLoading && icon && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
    </button>
  );
}

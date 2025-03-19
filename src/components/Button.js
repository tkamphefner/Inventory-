"use client";

import React from 'react';

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  form,
  ...props
}) {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    primary: "bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 border border-transparent",
    secondary: "bg-white hover:bg-gray-50 text-gray-700 focus:ring-primary-500 border border-gray-300",
    outline: "bg-white hover:bg-gray-50 text-gray-700 focus:ring-primary-500 border border-gray-300",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 border border-transparent",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 border border-transparent",
    link: "bg-transparent hover:underline text-primary-600 hover:text-primary-700 border-none shadow-none"
  };
  
  const sizeClasses = {
    xs: "px-2.5 py-1.5 text-xs",
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-4 py-2 text-base",
    xl: "px-6 py-3 text-base"
  };
  
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";
  
  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`;
  
  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled}
      onClick={onClick}
      form={form}
      {...props}
    >
      {children}
    </button>
  );
}

"use client";

import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export default function Alert({
  variant = 'info',
  title,
  message,
  onClose,
  autoClose = false,
  autoCloseTime = 5000,
  className = ''
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, autoCloseTime);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseTime, onClose]);

  if (!isVisible) return null;

  const variantConfig = {
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-400',
      iconColor: 'text-blue-400'
    },
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-400',
      iconColor: 'text-green-400'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-400',
      iconColor: 'text-yellow-400'
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-400',
      iconColor: 'text-red-400'
    }
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div className={`rounded-md ${config.bgColor} p-4 border ${config.borderColor} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${config.iconColor}`} aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex justify-between items-start">
            <div>
              {title && (
                <h3 className={`text-sm font-medium ${config.textColor}`}>{title}</h3>
              )}
              {message && (
                <div className={`text-sm ${config.textColor} mt-1`}>
                  {message}
                </div>
              )}
            </div>
            {onClose && (
              <button
                type="button"
                className={`ml-3 inline-flex ${config.textColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                onClick={() => {
                  setIsVisible(false);
                  onClose();
                }}
              >
                <span className="sr-only">Dismiss</span>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

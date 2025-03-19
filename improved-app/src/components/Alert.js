import { useState } from 'react';
import { X, Check, AlertTriangle } from 'lucide-react';

const variants = {
  success: {
    icon: <Check className="w-5 h-5" />,
    bgColor: 'bg-green-100',
    borderColor: 'border-green-400',
    textColor: 'text-green-800',
    iconColor: 'text-green-500'
  },
  error: {
    icon: <X className="w-5 h-5" />,
    bgColor: 'bg-red-100',
    borderColor: 'border-red-400',
    textColor: 'text-red-800',
    iconColor: 'text-red-500'
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5" />,
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-400',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-500'
  },
  info: {
    icon: <AlertTriangle className="w-5 h-5" />,
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-400',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-500'
  }
};

export default function Alert({ 
  title, 
  message, 
  variant = 'info', 
  onClose,
  autoClose = false,
  autoCloseTime = 5000
}) {
  const [isVisible, setIsVisible] = useState(true);
  const { icon, bgColor, borderColor, textColor, iconColor } = variants[variant] || variants.info;
  
  // Handle auto-close
  useState(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, autoCloseTime);
      
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseTime, onClose]);
  
  if (!isVisible) return null;
  
  return (
    <div className={`rounded-md ${bgColor} p-4 border ${borderColor}`}>
      <div className="flex">
        <div className={`flex-shrink-0 ${iconColor}`}>
          {icon}
        </div>
        <div className="ml-3">
          {title && (
            <h3 className={`text-sm font-medium ${textColor}`}>{title}</h3>
          )}
          {message && (
            <div className={`text-sm ${textColor} mt-1`}>{message}</div>
          )}
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={() => {
                  setIsVisible(false);
                  onClose();
                }}
                className={`inline-flex rounded-md p-1.5 ${textColor} hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-${variant}-50 focus:ring-${variant}-600`}
              >
                <span className="sr-only">Dismiss</span>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

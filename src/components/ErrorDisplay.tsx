import React from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff, AlertCircle, Info } from 'lucide-react';
import { ApiError } from '../utils/errorHandling';

interface ErrorDisplayProps {
  error: ApiError | string | null;
  onRetry?: () => void;
  className?: string;
  variant?: 'inline' | 'card' | 'banner';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  retryText?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  className = '',
  variant = 'inline',
  size = 'md',
  showIcon = true,
  retryText = 'Try Again'
}) => {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorCode = typeof error === 'object' ? error.code : undefined;
  const isNetworkError = errorCode === 'NETWORK_ERROR';

  const getIcon = () => {
    if (!showIcon) return null;
    
    if (isNetworkError) {
      return <WifiOff className={`${getSizeClasses().icon} text-red-500`} />;
    }
    
    return <AlertTriangle className={`${getSizeClasses().icon} text-red-500`} />;
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          icon: 'w-4 h-4',
          text: 'text-sm',
          button: 'px-2 py-1 text-xs'
        };
      case 'lg':
        return {
          icon: 'w-6 h-6',
          text: 'text-base',
          button: 'px-4 py-2 text-sm'
        };
      default:
        return {
          icon: 'w-5 h-5',
          text: 'text-sm',
          button: 'px-3 py-1.5 text-sm'
        };
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'card':
        return 'bg-red-50 border border-red-200 rounded-lg p-4';
      case 'banner':
        return 'bg-red-50 border-l-4 border-red-400 p-4';
      default:
        return 'bg-red-50 border border-red-200 rounded-md p-3';
    }
  };

  const sizeClasses = getSizeClasses();
  const variantClasses = getVariantClasses();

  return (
    <div className={`${variantClasses} ${className}`}>
      <div className="flex items-start">
        {getIcon()}
        <div className={`${showIcon ? 'ml-3' : ''} flex-1`}>
          <div className={`${sizeClasses.text} text-red-800 font-medium`}>
            {isNetworkError ? 'Connection Error' : 'Error'}
          </div>
          <div className={`${sizeClasses.text} text-red-700 mt-1`}>
            {errorMessage}
          </div>
          {errorCode && errorCode !== 'NETWORK_ERROR' && (
            <div className="text-xs text-red-600 mt-1 font-mono">
              Code: {errorCode}
            </div>
          )}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className={`${sizeClasses.button} bg-red-100 text-red-800 border border-red-300 rounded-md hover:bg-red-200 transition-colors flex items-center space-x-1`}
          >
            <RefreshCw className="w-3 h-3" />
            <span>{retryText}</span>
          </button>
        )}
      </div>
    </div>
  );
};

// Specialized components for different error types
export const NetworkErrorDisplay: React.FC<Omit<ErrorDisplayProps, 'error'>> = (props) => (
  <ErrorDisplay
    error={{
      message: 'Unable to connect to the server. Please check your internet connection.',
      code: 'NETWORK_ERROR'
    }}
    {...props}
  />
);

export const ValidationErrorDisplay: React.FC<{ errors: string[]; className?: string }> = ({
  errors,
  className = ''
}) => {
  if (errors.length === 0) return null;

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-md p-3 ${className}`}>
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-yellow-500" />
        <div className="ml-3">
          <div className="text-sm text-yellow-800 font-medium">
            Please fix the following issues:
          </div>
          <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export const InfoDisplay: React.FC<{ message: string; className?: string }> = ({
  message,
  className = ''
}) => (
  <div className={`bg-blue-50 border border-blue-200 rounded-md p-3 ${className}`}>
    <div className="flex items-start">
      <Info className="w-5 h-5 text-blue-500" />
      <div className="ml-3">
        <div className="text-sm text-blue-800">{message}</div>
      </div>
    </div>
  </div>
);

export const SuccessDisplay: React.FC<{ message: string; className?: string }> = ({
  message,
  className = ''
}) => (
  <div className={`bg-green-50 border border-green-200 rounded-md p-3 ${className}`}>
    <div className="flex items-start">
      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="ml-3">
        <div className="text-sm text-green-800 font-medium">{message}</div>
      </div>
    </div>
  </div>
);

export default ErrorDisplay;
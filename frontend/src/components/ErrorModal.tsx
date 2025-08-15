import React from 'react';
import { X, AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  showRetry?: boolean;
  onRetry?: () => void;
  showHome?: boolean;
  onHome?: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  title = 'Error',
  message,
  type = 'error',
  showRetry = false,
  onRetry,
  showHome = false,
  onHome,
}) => {
  if (!isOpen) return null;

  const getIconColor = () => {
    switch (type) {
      case 'warning':
        return 'text-yellow-400';
      case 'info':
        return 'text-cyan-400';
      default:
        return 'text-red-400';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'warning':
        return 'border-yellow-600/30';
      case 'info':
        return 'border-cyan-600/30';
      default:
        return 'border-red-600/30';
    }
  };

  const getGradientColor = () => {
    switch (type) {
      case 'warning':
        return 'from-yellow-600/10 to-orange-600/10';
      case 'info':
        return 'from-cyan-600/10 to-blue-600/10';
      default:
        return 'from-red-600/10 to-pink-600/10';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className={`bg-slate-800 rounded-xl shadow-2xl border ${getBorderColor()} max-w-md w-full transform transition-all duration-300 scale-100`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`bg-gradient-to-r ${getGradientColor()} p-6 rounded-t-xl border-b border-slate-700`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center ${getIconColor()}`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-slate-300 leading-relaxed mb-6">
              {message}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {showRetry && onRetry && (
                <button
                  onClick={onRetry}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </button>
              )}
              
              {showHome && onHome && (
                <button
                  onClick={onHome}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-slate-700 text-slate-300 font-medium rounded-lg border border-slate-600 hover:bg-slate-600 hover:text-white transition-all duration-200 hover:border-slate-500"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </button>
              )}
              
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 font-medium rounded-lg border border-slate-600 hover:bg-slate-600 hover:text-white transition-all duration-200 hover:border-slate-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ErrorModal;
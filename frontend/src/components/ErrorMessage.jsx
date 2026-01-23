/**
 * Error Message Components
 * Clean error states with retry options
 */

import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ErrorMessage = ({ message, onRetry, className = '' }) => {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-red-800 text-sm">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm text-red-700 hover:text-red-900 font-medium flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const ErrorPage = ({ 
  title = 'Something went wrong',
  message = 'We encountered an error loading this page. Please try again.',
  onRetry 
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="btn-primary"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            className="btn-outline"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

export const EmptyState = ({ 
  icon: Icon = AlertCircle,
  title = 'Nothing here yet',
  message,
  action
}) => {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {message && <p className="text-gray-600 mb-4">{message}</p>}
      {action}
    </div>
  );
};

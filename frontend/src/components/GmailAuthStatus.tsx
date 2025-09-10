import React from 'react';
import { useGmailAuth } from '../hooks/useGmailAuth';

interface GmailAuthStatusProps {
  onAuthRequired?: () => void;
  showDetails?: boolean;
  className?: string;
}

const GmailAuthStatus: React.FC<GmailAuthStatusProps> = ({ 
  onAuthRequired, 
  showDetails = false,
  className = ''
}) => {
  const { authStatus, checkAuth, refreshTokens } = useGmailAuth();

  const handleRefresh = async () => {
    await refreshTokens();
  };

  const handleReauth = () => {
    if (onAuthRequired) {
      onAuthRequired();
    }
  };

  if (authStatus.isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">Checking Gmail authentication...</span>
      </div>
    );
  }

  if (authStatus.error) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
        <span className="text-sm text-red-600">Gmail auth error</span>
        <button
          onClick={handleReauth}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Re-authenticate
        </button>
      </div>
    );
  }

  if (!authStatus.isAuthenticated) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
        <span className="text-sm text-yellow-600">Gmail not connected</span>
        <button
          onClick={handleReauth}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Connect
        </button>
      </div>
    );
  }

  if (authStatus.needsRefresh) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
        <span className="text-sm text-orange-600">Gmail needs refresh</span>
        <button
          onClick={handleRefresh}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
      <span className="text-sm text-green-600">
        Gmail connected{showDetails && authStatus.email && ` (${authStatus.email})`}
      </span>
      {showDetails && authStatus.expiresAt && (
        <span className="text-xs text-gray-500">
          Expires: {new Date(authStatus.expiresAt).toLocaleString()}
        </span>
      )}
    </div>
  );
};

export default GmailAuthStatus;

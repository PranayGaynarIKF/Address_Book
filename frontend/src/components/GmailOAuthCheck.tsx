import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';

interface GmailOAuthCheckProps {
  onAuthSuccess: () => void;
  onAuthError: (error: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const GmailOAuthCheck: React.FC<GmailOAuthCheckProps> = ({
  onAuthSuccess,
  onAuthError,
  isOpen,
  onClose
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'not_authenticated' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState('');
  const [oauthUrl, setOauthUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      checkGmailAuth();
    }
  }, [isOpen]);

  const checkGmailAuth = async () => {
    setIsChecking(true);
    setAuthStatus('checking');
    setErrorMessage('');

    try {
      // Check if Gmail is already authenticated
      const response = await fetch('http://localhost:4002/api/mail-accounts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        const gmailAccounts = data.data?.filter((account: any) => 
          account.serviceType === 'GMAIL' && account.isActive
        ) || [];

        if (gmailAccounts.length > 0) {
          setAuthStatus('authenticated');
          onAuthSuccess();
          return;
        }
      }

      // If no Gmail account found, initiate OAuth flow
      await initiateGmailOAuth();
    } catch (error) {
      console.error('Error checking Gmail auth:', error);
      setAuthStatus('error');
      setErrorMessage('Failed to check Gmail authentication status');
      onAuthError('Failed to check Gmail authentication status');
    } finally {
      setIsChecking(false);
    }
  };

  const initiateGmailOAuth = async () => {
    try {
      const response = await fetch('http://localhost:4002/api/mail-accounts/google-oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOauthUrl(data.data.oauthUrl);
        setAuthStatus('not_authenticated');
      } else {
        throw new Error('Failed to generate OAuth URL');
      }
    } catch (error) {
      console.error('Error initiating Gmail OAuth:', error);
      setAuthStatus('error');
      setErrorMessage('Failed to initiate Gmail OAuth');
      onAuthError('Failed to initiate Gmail OAuth');
    }
  };

  const handleOAuthRedirect = () => {
    if (oauthUrl) {
      window.open(oauthUrl, '_blank');
    }
  };

  const handleOAuthCallback = async () => {
    // This would be called when the user returns from OAuth
    // In a real implementation, you'd handle the callback URL
    await checkGmailAuth();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Gmail Authentication Required
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {authStatus === 'checking' && (
            <div className="flex items-center gap-3">
              <RefreshCw className="animate-spin text-blue-600" size={20} />
              <span className="text-gray-700">Checking Gmail authentication...</span>
            </div>
          )}

          {authStatus === 'authenticated' && (
            <div className="flex items-center gap-3 text-green-600">
              <CheckCircle size={20} />
              <span>Gmail is authenticated and ready to send emails!</span>
            </div>
          )}

          {authStatus === 'not_authenticated' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-amber-600">
                <AlertCircle size={20} />
                <span>Gmail authentication required to send emails</span>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-sm text-amber-800 mb-3">
                  You need to authenticate with Gmail before sending emails. Click the button below to authorize access.
                </p>
                
                <button
                  onClick={handleOAuthRedirect}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink size={16} />
                  Authorize Gmail Access
                </button>
              </div>

              <div className="text-xs text-gray-500 text-center">
                After authorization, click "I've Authorized" below
              </div>

              <button
                onClick={handleOAuthCallback}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
              >
                I've Authorized Gmail Access
              </button>
            </div>
          )}

          {authStatus === 'error' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <AlertCircle size={20} />
                <span>Authentication Error</span>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">{errorMessage}</p>
              </div>

              <button
                onClick={checkGmailAuth}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default GmailOAuthCheck;

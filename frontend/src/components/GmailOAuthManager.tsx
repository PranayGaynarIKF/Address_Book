import React, { useState } from 'react';
import { Mail, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import GmailOAuthCallback from './GmailOAuthCallback';

interface GmailOAuthManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
  onAuthError: (error: string) => void;
}

const GmailOAuthManager: React.FC<GmailOAuthManagerProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  onAuthError
}) => {
  const [isStartingOAuth, setIsStartingOAuth] = useState(false);
  const [showCallback, setShowCallback] = useState(false);

  const handleStartOAuth = async () => {
    setIsStartingOAuth(true);
    
    try {
      // Start the OAuth flow
      const response = await fetch('http://localhost:4002/api/mail-accounts/oauth-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'gmail',
          redirectUri: 'http://localhost:4002/api/mail-accounts/oauth-callback'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get OAuth URL');
      }

      const { authUrl, state } = await response.json();
      
      // Open OAuth in a popup window
      const popup = window.open(
        authUrl,
        'gmail-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Listen for the popup to close or receive message
      const checkClosed = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(checkClosed);
            setIsStartingOAuth(false);
            // Check if authentication was successful
            checkAuthStatus();
          }
        } catch (error) {
          // Handle CORS policy errors
          console.warn('Popup check blocked by CORS policy, using fallback method');
          clearInterval(checkClosed);
          setIsStartingOAuth(false);
          // Check if authentication was successful
          checkAuthStatus();
        }
      }, 1000);

      // Set a timeout to check auth status even if popup doesn't close properly
      setTimeout(() => {
        clearInterval(checkClosed);
        setIsStartingOAuth(false);
        checkAuthStatus();
      }, 10000); // 10 seconds timeout

      // Listen for messages from popup
      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'OAUTH_SUCCESS') {
          clearInterval(checkClosed);
          popup.close();
          window.removeEventListener('message', messageHandler);
          setIsStartingOAuth(false);
          onAuthSuccess();
        } else if (event.data.type === 'OAUTH_ERROR') {
          clearInterval(checkClosed);
          popup.close();
          window.removeEventListener('message', messageHandler);
          setIsStartingOAuth(false);
          onAuthError(event.data.error);
        }
      };

      window.addEventListener('message', messageHandler);
      
    } catch (error) {
      console.error('OAuth start error:', error);
      onAuthError(error instanceof Error ? error.message : 'Failed to start OAuth');
      setIsStartingOAuth(false);
    }
  };

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 GmailOAuthManager: Checking auth status...');
      
      // Check if we have valid tokens by calling the auth status endpoint
      const response = await fetch('http://localhost:4002/email/auth/GMAIL/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'my-secret-api-key-123'
        }
      });

      console.log('🔍 GmailOAuthManager: Auth status response:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 GmailOAuthManager: Auth status data:', data);
        
        if (data.isAuthenticated) {
          console.log('🔍 GmailOAuthManager: User is authenticated, calling onAuthSuccess');
          onAuthSuccess();
        } else {
          console.log('🔍 GmailOAuthManager: User is not authenticated, calling onAuthError');
          onAuthError('Gmail authentication required');
        }
      } else {
        console.log('🔍 GmailOAuthManager: Auth status check failed:', response.status);
        onAuthError('Authentication check failed');
      }
    } catch (error) {
      console.error('🔍 GmailOAuthManager: Auth status check error:', error);
      onAuthError('Failed to check authentication status');
    }
  };

  const handleCallbackSuccess = () => {
    setShowCallback(false);
    onAuthSuccess();
  };

  const handleCallbackError = (error: string) => {
    setShowCallback(false);
    onAuthError(error);
  };

  if (showCallback) {
    return (
      <GmailOAuthCallback
        isOpen={true}
        onClose={() => setShowCallback(false)}
        onAuthSuccess={handleCallbackSuccess}
        onAuthError={handleCallbackError}
      />
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="text-center">
          <Mail className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Gmail Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            You need to authenticate with Gmail before sending emails. This will redirect you to Google's OAuth page.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={handleStartOAuth}
              disabled={isStartingOAuth}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isStartingOAuth ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Starting OAuth...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  Authenticate with Gmail
                </>
              )}
            </button>
            
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm text-blue-800 font-medium">What happens next?</p>
                <ul className="text-xs text-blue-700 mt-1 space-y-1">
                  <li>• You'll be redirected to Google's OAuth page</li>
                  <li>• Sign in with your Gmail account</li>
                  <li>• Grant permissions for email sending</li>
                  <li>• You'll be redirected back to this app</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GmailOAuthManager;

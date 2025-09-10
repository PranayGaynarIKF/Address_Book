import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface GmailOAuthCallbackProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
  onAuthError: (error: string) => void;
}

const GmailOAuthCallback: React.FC<GmailOAuthCallbackProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  onAuthError
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      handleOAuthCallback();
    }
  }, [isOpen]);

  const handleOAuthCallback = async () => {
    setIsProcessing(true);
    setStatus('processing');
    setMessage('Processing Gmail OAuth callback...');

    try {
      // Get the current URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }

      if (!code) {
        throw new Error('No authorization code received');
      }

      // Send the OAuth callback to your backend
      const response = await fetch('http://localhost:4002/api/mail-accounts/oauth-callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          state,
          provider: 'gmail'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'OAuth callback failed');
      }

      const result = await response.json();
      
      setStatus('success');
      setMessage('Gmail authentication successful!');
      
      // Call success callback after a short delay
      setTimeout(() => {
        onAuthSuccess();
        onClose();
      }, 1500);

    } catch (error) {
      console.error('OAuth callback error:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Authentication failed');
      
      // Call error callback after a short delay
      setTimeout(() => {
        onAuthError(message);
        onClose();
      }, 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setStatus('idle');
    setMessage('');
    handleOAuthCallback();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="text-center">
          {status === 'processing' && (
            <>
              <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Authenticating with Gmail
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Authentication Successful!
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Authentication Failed
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
                <button
                  onClick={() => {
                    onAuthError(message);
                    onClose();
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GmailOAuthCallback;

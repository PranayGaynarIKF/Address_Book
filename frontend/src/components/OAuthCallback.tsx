import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, RefreshCw, X } from 'lucide-react';

const OAuthCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing OAuth callback...');
  const [details, setDetails] = useState<string>('');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        console.log('🔄 OAuth Callback Started');
        console.log('📍 Current URL:', window.location.href);
        
        // Get the authorization code from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const state = urlParams.get('state');

        console.log('🔍 URL Parameters:');
        console.log('  - code:', code ? '✅ Present' : '❌ Missing');
        console.log('  - error:', error || 'None');
        console.log('  - state:', state || 'None');

        if (error) {
          setStatus('error');
          setMessage(`OAuth Error: ${error}`);
          setDetails('Google returned an error during the authentication process. Please try again.');
          console.error('❌ OAuth Error:', error);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('No Authorization Code Received');
          setDetails('Google did not return an authorization code. This usually means the OAuth flow was interrupted or cancelled.');
          console.error('❌ No authorization code received');
          return;
        }

        console.log('🔄 Exchanging code for tokens...');
        
        // Exchange the code for tokens by calling the backend with the code
        const response = await fetch(`http://localhost:4002/api/mail-accounts/oauth-callback?code=${encodeURIComponent(code)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('📡 Backend Response Status:', response.status);
        console.log('📡 Backend Response Headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Backend Error:', errorData);
          setStatus('error');
          setMessage('Backend Authentication Failed');
          setDetails(errorData.message || 'The server failed to complete the OAuth process. Please check your backend configuration.');
          return;
        }

        const result = await response.json();
        console.log('✅ Backend Success Result:', result);
        
        if (result.success) {
          setStatus('success');
          setMessage('OAuth Authentication Successful!');
          setDetails('Your Google account has been successfully authenticated. You can now close this window and return to the main application.');
          
          // Store tokens in localStorage for later use
          localStorage.setItem('googleOAuthTokens', JSON.stringify(result.data));
          console.log('💾 Tokens stored in localStorage');
          
          // Auto-close window after 5 seconds
          setTimeout(() => {
            console.log('🔄 Auto-closing window...');
            window.close();
          }, 5000);
        } else {
          throw new Error(result.message || 'OAuth completion failed');
        }
      } catch (err) {
        console.error('❌ OAuth Callback Error:', err);
        setStatus('error');
        setMessage('Authentication Failed');
        setDetails(err instanceof Error ? err.message : 'An unexpected error occurred during the OAuth process.');
      }
    };

    handleOAuthCallback();
  }, []);

  const handleClose = () => {
    window.close();
  };

  const handleRetry = () => {
    window.location.href = '/mail-accounts';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <RefreshCw className="mx-auto h-12 w-12 text-blue-600 animate-spin mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing OAuth</h2>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500 mt-2">Please wait while we complete your authentication...</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Successful!</h2>
              <p className="text-gray-600 mb-2">{message}</p>
              <p className="text-sm text-gray-700 mb-4">{details}</p>
              <p className="text-sm text-gray-500 mb-4">This window will close automatically in 5 seconds...</p>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Close Now
              </button>
            </>
          )}
          
          {status === 'error' && (
            <>
              <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Failed</h2>
              <p className="text-gray-600 mb-2">{message}</p>
              <p className="text-sm text-gray-700 mb-4">{details}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Close Window
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;

import React, { useState } from 'react';
import { X, Mail, Settings, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

interface EmailServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceType?: 'GMAIL' | 'OUTLOOK' | 'YAHOO' | 'ZOHO';
}

interface EmailServiceConfig {
  serviceType: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

const EmailServiceModal: React.FC<EmailServiceModalProps> = ({ 
  isOpen, 
  onClose, 
  serviceType = 'GMAIL' 
}) => {
  const [step, setStep] = useState<'config' | 'oauth' | 'success'>('config');
  const [config, setConfig] = useState<EmailServiceConfig>({
    serviceType,
    clientId: '',
    clientSecret: '',
    redirectUri: 'http://localhost:4002/auth/google/callback', // Use the URI configured in Google Cloud Console
    scopes: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const serviceInfo = {
    GMAIL: {
      name: 'Gmail',
      icon: '📧',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Connect your Gmail account using OAuth 2.0',
      setupUrl: 'https://console.developers.google.com/',
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify'
      ]
    },
    OUTLOOK: {
      name: 'Outlook',
      icon: '📨',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Connect your Outlook account using Microsoft Graph API',
      setupUrl: 'https://portal.azure.com/',
      scopes: [
        'Mail.Read',
        'Mail.Send',
        'Mail.ReadWrite',
        'User.Read'
      ]
    },
    YAHOO: {
      name: 'Yahoo Mail',
      icon: '📬',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Connect your Yahoo Mail account',
      setupUrl: 'https://developer.yahoo.com/',
      scopes: [
        'mail-r',
        'mail-w'
      ]
    },
    ZOHO: {
      name: 'Zoho Mail',
      icon: '📭',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Connect your Zoho Mail account',
      setupUrl: 'https://api-console.zoho.com/',
      scopes: [
        'ZohoMail.messages.READ',
        'ZohoMail.messages.WRITE'
      ]
    }
  };

  const currentService = serviceInfo[serviceType];

  const handleInputChange = (field: keyof EmailServiceConfig, value: string | string[]) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!config.clientId || !config.clientSecret || !config.redirectUri) {
        throw new Error('Please fill in all required fields');
      }

      // Save configuration to database
      const response = await fetch('http://localhost:4002/email/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...config,
          userId: 'current-user-id', // This would come from auth context
          isActive: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Email config save failed:', response.status, errorData);
        throw new Error(`Failed to save email service configuration: ${response.status} ${errorData}`);
      }

      // Move to OAuth step
      setStep('oauth');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthStart = async () => {
    try {
      // Get OAuth URL from backend with userId
      const response = await fetch(`http://localhost:4002/email/auth/${serviceType}/url?userId=current-user-id`);
      const data = await response.json();
      
      // Open OAuth URL in new window
      window.open(data.authUrl, '_blank', 'width=600,height=700');
      
      // For demo purposes, move to success step
      setTimeout(() => setStep('success'), 2000);
    } catch (error) {
      console.error('OAuth start failed:', error);
      setError(`Failed to start OAuth process: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleComplete = () => {
    onClose();
    // Reset modal state
    setStep('config');
    setConfig({
      serviceType,
      clientId: '',
      clientSecret: '',
      redirectUri: 'http://localhost:4002/auth/google/callback', // Reset to correct redirect URI
      scopes: []
    });
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${currentService.bgColor}`}>
              <span className="text-2xl">{currentService.icon}</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Connect {currentService.name}
              </h2>
              <p className="text-sm text-gray-600">{currentService.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'config' && (
            <div>
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-900 mb-1">Setup Required</h3>
                    <p className="text-sm text-blue-700 mb-3">
                      You need to create an OAuth application in your {currentService.name} developer console first.
                    </p>
                    <a
                      href={currentService.setupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Go to {currentService.name} Developer Console
                    </a>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Type
                  </label>
                  <input
                    type="text"
                    value={config.serviceType}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={config.clientId}
                    onChange={(e) => handleInputChange('clientId', e.target.value)}
                    placeholder="Enter your OAuth Client ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Secret <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={config.clientSecret}
                    onChange={(e) => handleInputChange('clientSecret', e.target.value)}
                    placeholder="Enter your OAuth Client Secret"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Redirect URI <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={config.redirectUri}
                    onChange={(e) => handleInputChange('redirectUri', e.target.value)}
                    placeholder="http://localhost:3000/auth/callback"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This should match the redirect URI configured in your OAuth app
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scopes
                  </label>
                  <div className="space-y-2">
                    {currentService.scopes.map((scope) => (
                      <label key={scope} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={config.scopes.includes(scope)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleInputChange('scopes', [...config.scopes, scope]);
                            } else {
                              handleInputChange('scopes', config.scopes.filter(s => s !== scope));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{scope}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{error}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Saving...' : 'Save & Continue'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 'oauth' && (
            <div className="text-center py-8">
              <div className="mb-6">
                <div className={`inline-flex p-3 rounded-full ${currentService.bgColor} mb-4`}>
                  <span className="text-3xl">{currentService.icon}</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Connect Your {currentService.name} Account
                </h3>
                <p className="text-gray-600">
                  Click the button below to authorize access to your {currentService.name} account.
                </p>
              </div>

              <button
                onClick={handleOAuthStart}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Mail className="h-5 w-5" />
                Connect {currentService.name}
              </button>

              <p className="text-sm text-gray-500 mt-4">
                You'll be redirected to {currentService.name} to complete the authorization.
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="inline-flex p-3 rounded-full bg-green-100 mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {currentService.name} Connected Successfully!
                </h3>
                <p className="text-gray-600">
                  Your {currentService.name} account is now connected and ready to use.
                </p>
              </div>

              <button
                onClick={handleComplete}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailServiceModal;

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Plus, 
  Settings, 
  Eye, 
  EyeOff, 
  Edit, 
  Trash2, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Lock,
  Unlock
} from 'lucide-react';

interface MailAccount {
  id: string;
  name: string;
  email: string;
  serviceType: 'GMAIL' | 'OUTLOOK' | 'YAHOO' | 'ZOHO';
  isActive: boolean;
  isEncrypted: boolean;
  lastSync?: string;
  syncStatus: 'success' | 'error' | 'pending';
  createdAt: string;
}

interface MailAccountForm {
  name: string;
  email: string;
  serviceType: 'GMAIL' | 'OUTLOOK' | 'YAHOO' | 'ZOHO';
  password: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
}

const MailAccountsManager: React.FC = () => {
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<MailAccount | null>(null);
  const [formData, setFormData] = useState<MailAccountForm>({
    name: '',
    email: '',
    serviceType: 'GMAIL',
    password: '',
    clientId: '',
    clientSecret: '',
    redirectUri: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Fetch mail accounts from API
  useEffect(() => {
    fetchMailAccounts();
  }, []);

  const fetchMailAccounts = async () => {
    try {
      const response = await fetch('http://localhost:4002/api/mail-accounts');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAccounts(result.data);
        } else {
          setError('Failed to fetch mail accounts');
        }
      } else {
        setError('Failed to fetch mail accounts');
      }
    } catch (err) {
      setError('Failed to fetch mail accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof MailAccountForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!formData.name || !formData.email || !formData.password) {
        throw new Error('Please fill in all required fields');
      }

      if (editingAccount) {
        // Update existing account
        const response = await fetch(`http://localhost:4002/api/mail-accounts/${editingAccount.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Failed to update account');
        
        setSuccess('Account updated successfully!');
        setEditingAccount(null);
      } else {
        // Create new account
        const response = await fetch('http://localhost:4002/api/mail-accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Failed to create account');
        
        setSuccess('Account created successfully!');
      }

      // Reset form
      setFormData({
        name: '',
        email: '',
        serviceType: 'GMAIL',
        password: '',
        clientId: '',
        clientSecret: '',
        redirectUri: ''
      });
      setShowAddForm(false);

      // Refresh accounts list
      fetchMailAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (account: MailAccount) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      email: account.email,
      serviceType: account.serviceType,
      password: '', // Don't show existing password
      clientId: '',
      clientSecret: '',
      redirectUri: ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (accountId: string) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;

    try {
      const response = await fetch(`http://localhost:4002/api/mail-accounts/${accountId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete account');

      setAccounts(prev => prev.filter(acc => acc.id !== accountId));
      setSuccess('Account deleted successfully!');
    } catch (err) {
      setError('Failed to delete account');
    }
  };

  const handleToggleActive = async (accountId: string) => {
    try {
      const response = await fetch(`http://localhost:4002/api/mail-accounts/${accountId}/toggle-status`, {
        method: 'PATCH'
      });

      if (!response.ok) throw new Error('Failed to toggle account status');

      setAccounts(prev => prev.map(acc => 
        acc.id === accountId ? { ...acc, isActive: !acc.isActive } : acc
      ));
    } catch (err) {
      setError('Failed to toggle account status');
    }
  };

  const handleTestConnection = async (accountId: string) => {
    try {
      const response = await fetch(`http://localhost:4002/api/mail-accounts/${accountId}/test-connection`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Connection test failed');

      setSuccess('Connection test successful!');
    } catch (err) {
      setError('Connection test failed');
    }
  };

  const handleGoogleOAuth = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🔄 Initiating Google OAuth...');
      
      const response = await fetch('http://localhost:4002/api/mail-accounts/google-oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Google OAuth Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Google OAuth Error:', errorData);
        throw new Error(errorData.message || 'Failed to initiate Google OAuth');
      }

      const result = await response.json();
      console.log('✅ Google OAuth Success:', result);
      
      if (result.success) {
        setSuccess('Opening Google OAuth in new window...');
        console.log('🔗 Opening OAuth URL:', result.data.oauthUrl);
        
        // Open OAuth URL in new window
        const oauthWindow = window.open(
          result.data.oauthUrl,
          'googleOAuth',
          'width=500,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes'
        );

        if (!oauthWindow) {
          throw new Error('Popup blocked! Please allow popups for this site and try again.');
        }

        // Listen for OAuth completion
        const checkOAuthCompletion = setInterval(() => {
          if (oauthWindow && oauthWindow.closed) {
            clearInterval(checkOAuthCompletion);
            console.log('✅ OAuth window closed - checking for tokens...');
            
            // Check if we have tokens in localStorage
            const tokens = localStorage.getItem('googleOAuthTokens');
            if (tokens) {
              setSuccess('Google OAuth completed successfully! You can now create your mail account.');
              console.log('💾 OAuth tokens found in localStorage');
              
              // Auto-populate the form with OAuth credentials
              try {
                const tokenData = JSON.parse(tokens);
                if (tokenData.accessToken) {
                  handleInputChange('clientId', 'OAuth_Authenticated');
                  handleInputChange('clientSecret', 'OAuth_Authenticated');
                  handleInputChange('redirectUri', result.data.redirectUri);
                  setSuccess('OAuth credentials automatically populated! You can now create your mail account.');
                }
              } catch (parseError) {
                console.warn('Could not parse OAuth tokens:', parseError);
              }
            } else {
              setSuccess('Google OAuth completed! You can now create your mail account.');
            }
          }
        }, 1000);

        // Auto-close the popup after 10 minutes if not closed manually
        setTimeout(() => {
          if (oauthWindow && !oauthWindow.closed) {
            oauthWindow.close();
            setError('OAuth window timed out after 10 minutes. Please try again.');
            clearInterval(checkOAuthCompletion);
          }
        }, 600000); // 10 minutes
      } else {
        throw new Error(result.message || 'Failed to initiate Google OAuth');
      }
    } catch (err) {
      console.error('❌ Google OAuth Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during Google OAuth');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOutlookOAuth = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:4002/api/mail-accounts/outlook-oauth', {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to initiate Outlook OAuth');
      }

      const result = await response.json();
      if (result.success) {
        setSuccess('Opening Outlook OAuth in new window...');
        
        // Open OAuth URL in new window
        const oauthWindow = window.open(
          result.data.oauthUrl,
          'outlookOAuth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Listen for OAuth completion
        const checkOAuthCompletion = setInterval(() => {
          if (oauthWindow && oauthWindow.closed) {
            clearInterval(checkOAuthCompletion);
            setSuccess('Outlook OAuth completed! You can now create your mail account.');
            // Optionally refresh the page or update the form
          }
        }, 1000);

        // Auto-close the popup after 5 minutes if not closed manually
        setTimeout(() => {
          if (oauthWindow && !oauthWindow.closed) {
            oauthWindow.close();
            setError('OAuth window timed out. Please try again.');
          }
        }, 300000); // 5 minutes
      } else {
        throw new Error(result.message || 'Failed to initiate Outlook OAuth');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during Outlook OAuth');
    } finally {
      setIsLoading(false);
    }
  };

  const handleYahooOAuth = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:4002/api/mail-accounts/yahoo-oauth', {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to initiate Yahoo OAuth');
      }

      const result = await response.json();
      if (result.success) {
        setSuccess('Opening Yahoo OAuth in new window...');
        
        // Open OAuth URL in new window
        const oauthWindow = window.open(
          result.data.oauthUrl,
          'yahooOAuth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Listen for OAuth completion
        const checkOAuthCompletion = setInterval(() => {
          if (oauthWindow && oauthWindow.closed) {
            clearInterval(checkOAuthCompletion);
            setSuccess('Yahoo OAuth completed! You can now create your mail account.');
            // Optionally refresh the page or update the form
          }
        }, 1000);

        // Auto-close the popup after 5 minutes if not closed manually
        setTimeout(() => {
          if (oauthWindow && !oauthWindow.closed) {
            oauthWindow.close();
            setError('OAuth window timed out. Please try again.');
          }
        }, 300000); // 5 minutes
      } else {
        throw new Error(result.message || 'Failed to initiate Yahoo OAuth');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during Yahoo OAuth');
    } finally {
      setIsLoading(false);
    }
  };

  const handleZohoOAuth = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:4002/api/mail-accounts/zoho-oauth', {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to initiate Zoho OAuth');
      }

      const result = await response.json();
      if (result.success) {
        setSuccess('Opening Zoho OAuth in new window...');
        
        // Open OAuth URL in new window
        const oauthWindow = window.open(
          result.data.oauthUrl,
          'zohoOAuth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Listen for OAuth completion
        const checkOAuthCompletion = setInterval(() => {
          if (oauthWindow && oauthWindow.closed) {
            clearInterval(checkOAuthCompletion);
            setSuccess('Zoho OAuth completed! You can now create your mail account.');
            // Optionally refresh the page or update the form
          }
        }, 1000);

        // Auto-close the popup after 5 minutes if not closed manually
        setTimeout(() => {
          if (oauthWindow && !oauthWindow.closed) {
            oauthWindow.close();
            setError('OAuth window timed out. Please try again.');
          }
        }, 300000); // 5 minutes
      } else {
        throw new Error(result.message || 'Failed to initiate Zoho OAuth');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during Zoho OAuth');
    } finally {
      setIsLoading(false);
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType.toUpperCase()) {
      case 'GMAIL': return '📧';
      case 'OUTLOOK': return '📨';
      case 'YAHOO': return '📬';
      case 'ZOHO': return '📭';
      default: return '📬';
    }
  };

  const getServiceColor = (serviceType: string) => {
    switch (serviceType.toUpperCase()) {
      case 'GMAIL': return 'bg-red-100 text-red-800 border-red-200';
      case 'OUTLOOK': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'YAHOO': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ZOHO': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Mail className="h-8 w-8 text-blue-600" />
            Mail Accounts Management
          </h1>
          <p className="text-gray-600 mt-2">Securely manage your email accounts for data ingestion</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Mail Account
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span>{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="mb-8 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingAccount ? 'Edit Mail Account' : 'Add New Mail Account'}
            </h2>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingAccount(null);
                setFormData({
                  name: '',
                  email: '',
                  serviceType: 'GMAIL',
                  password: '',
                  clientId: '',
                  clientSecret: '',
                  redirectUri: ''
                });
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Personal Gmail, Work Outlook"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.serviceType}
                  onChange={(e) => handleInputChange('serviceType', e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="GMAIL">Gmail</option>
                  <option value="OUTLOOK">Outlook</option>
                  <option value="YAHOO">Yahoo Mail</option>
                  <option value="ZOHO">Zoho Mail</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* OAuth fields for Gmail/Outlook */}
            {formData.serviceType === 'GMAIL' && (
              <div className="space-y-4">
                {/* OAuth Authentication Button */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">Google OAuth 2.0 Authentication</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Click below to automatically authenticate with Google and get OAuth credentials
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGoogleOAuth}
                      disabled={isLoading}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Authenticating...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Authenticate with Google
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Manual OAuth Fields (as fallback) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client ID
                    </label>
                    <input
                      type="text"
                      value={formData.clientId}
                      onChange={(e) => handleInputChange('clientId', e.target.value)}
                      placeholder="OAuth Client ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client Secret
                    </label>
                    <input
                      type="password"
                      value={formData.clientSecret}
                      onChange={(e) => handleInputChange('clientSecret', e.target.value)}
                      placeholder="OAuth Client Secret"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Redirect URI
                    </label>
                    <input
                      type="text"
                      value={formData.redirectUri}
                      onChange={(e) => handleInputChange('redirectUri', e.target.value)}
                      placeholder="http://localhost:3000/callback"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* OAuth fields for Outlook */}
            {formData.serviceType === 'OUTLOOK' && (
              <div className="space-y-4">
                {/* OAuth Authentication Button */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">Microsoft OAuth 2.0 Authentication</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Click below to automatically authenticate with Microsoft and get OAuth credentials
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOutlookOAuth}
                      disabled={isLoading}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Authenticating...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Authenticate with Microsoft
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Manual OAuth Fields (as fallback) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client ID
                    </label>
                    <input
                      type="text"
                      value={formData.clientId}
                      onChange={(e) => handleInputChange('clientId', e.target.value)}
                      placeholder="Azure App Client ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client Secret
                    </label>
                    <input
                      type="password"
                      value={formData.clientSecret}
                      onChange={(e) => handleInputChange('clientSecret', e.target.value)}
                      placeholder="Azure App Client Secret"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Redirect URI
                    </label>
                    <input
                      type="text"
                      value={formData.redirectUri}
                      onChange={(e) => handleInputChange('redirectUri', e.target.value)}
                      placeholder="http://localhost:3000/oauth-callback"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* OAuth fields for Yahoo */}
            {formData.serviceType === 'YAHOO' && (
              <div className="space-y-4">
                {/* OAuth Authentication Button */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-purple-900">Yahoo OAuth 2.0 Authentication</h4>
                      <p className="text-sm text-purple-700 mt-1">
                        Click below to automatically authenticate with Yahoo and get OAuth credentials
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleYahooOAuth}
                      disabled={isLoading}
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Authenticating...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Authenticate with Yahoo
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Manual OAuth Fields (as fallback) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client ID
                    </label>
                    <input
                      type="text"
                      value={formData.clientId}
                      onChange={(e) => handleInputChange('clientId', e.target.value)}
                      placeholder="Yahoo App Client ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client Secret
                    </label>
                    <input
                      type="password"
                      value={formData.clientSecret}
                      onChange={(e) => handleInputChange('clientSecret', e.target.value)}
                      placeholder="Yahoo App Client Secret"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Redirect URI
                    </label>
                    <input
                      type="text"
                      value={formData.redirectUri}
                      onChange={(e) => handleInputChange('redirectUri', e.target.value)}
                      placeholder="http://localhost:3000/oauth-callback"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* OAuth fields for Zoho */}
            {formData.serviceType === 'ZOHO' && (
              <div className="space-y-4">
                {/* OAuth Authentication Button */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-orange-900">Zoho OAuth 2.0 Authentication</h4>
                      <p className="text-sm text-orange-700 mt-1">
                        Click below to automatically authenticate with Zoho and get OAuth credentials
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleZohoOAuth}
                      disabled={isLoading}
                      className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Authenticating...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Authenticate with Zoho
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Manual OAuth Fields (as fallback) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client ID
                    </label>
                    <input
                      type="text"
                      value={formData.clientId}
                      onChange={(e) => handleInputChange('clientId', e.target.value)}
                      placeholder="Zoho App Client ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client Secret
                    </label>
                    <input
                      type="password"
                      value={formData.clientSecret}
                      onChange={(e) => handleInputChange('clientSecret', e.target.value)}
                      placeholder="Zoho App Client Secret"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Redirect URI
                    </label>
                    <input
                      type="text"
                      value={formData.redirectUri}
                      onChange={(e) => handleInputChange('redirectUri', e.target.value)}
                      placeholder="http://localhost:3000/oauth-callback"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingAccount(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Saving...' : (editingAccount ? 'Update Account' : 'Add Account')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Accounts List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Configured Mail Accounts</h3>
          <p className="text-sm text-gray-600 mt-1">Manage your email accounts for data ingestion</p>
        </div>
        
        <div className="p-6">
          {accounts.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No mail accounts configured</h3>
              <p className="text-gray-600 mb-4">Add your first mail account to start data ingestion</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Mail Account
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${
                    !account.isActive ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getServiceIcon(account.serviceType)}</span>
                        <div>
                          <h4 className="font-medium text-gray-900">{account.name}</h4>
                          <p className="text-sm text-gray-600">{account.email}</p>
                        </div>
                      </div>
                      
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getServiceColor(account.serviceType)}`}>
                        {account.serviceType}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Sync Status */}
                      <div className="flex items-center gap-2">
                        {getSyncStatusIcon(account.syncStatus)}
                        <span className="text-xs text-gray-500">
                          {account.lastSync ? new Date(account.lastSync).toLocaleDateString() : 'Never'}
                        </span>
                      </div>

                      {/* Encryption Status */}
                      <div className="flex items-center gap-1">
                        {account.isEncrypted ? (
                          <Lock className="h-4 w-4 text-green-600" />
                        ) : (
                          <Unlock className="h-4 w-4 text-red-600" />
                        )}
                      </div>

                      {/* Active Status */}
                      <button
                        onClick={() => handleToggleActive(account.id)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          account.isActive
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}
                      >
                        {account.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTestConnection(account.id)}
                        className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Test Connection
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(account)}
                        className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="flex items-center gap-2 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-1">Security & Encryption</h3>
            <p className="text-sm text-blue-700">
              All sensitive data (passwords, tokens) are encrypted using industry-standard encryption 
              before being stored in the database. Your credentials are secure and never stored in plain text.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MailAccountsManager;

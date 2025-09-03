import React, { useState } from 'react';
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const GmailIntegrationTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testGmailConnection = async () => {
    setIsLoading(true);
    setError(null);
    setTestResults(null);

    try {
      // Test 1: Check if backend is running
      const healthResponse = await fetch('http://localhost:4002/health');
      if (!healthResponse.ok) {
        throw new Error('Backend is not running');
      }

      // Test 2: Check mail accounts endpoint
      const accountsResponse = await fetch('http://localhost:4002/api/mail-accounts', {
        headers: { 'accept': '*/*' }
      });
      
      if (!accountsResponse.ok) {
        throw new Error('Failed to fetch mail accounts');
      }

      const accountsData = await accountsResponse.json();
      const gmailAccounts = accountsData.data?.filter((account: any) => account.serviceType === 'GMAIL') || [];

      // Test 3: Check OAuth endpoints
      const oauthTestResponse = await fetch('http://localhost:4002/auth/current-user-id/gmail/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName: 'test@gmail.com',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret'
        })
      });

      setTestResults({
        backendRunning: true,
        mailAccountsEndpoint: true,
        gmailAccountsCount: gmailAccounts.length,
        oauthEndpoint: oauthTestResponse.ok,
        accounts: gmailAccounts
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="text-blue-600" size={24} />
          <div>
            <h2 className="text-xl font-semibold">Gmail Integration Test</h2>
            <p className="text-gray-600">Test the Gmail integration functionality</p>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={testGmailConnection}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Testing...' : 'Run Gmail Integration Test'}
          </button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Test Failed</span>
              </div>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
          )}

          {testResults && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 mb-3">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Test Results</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Backend Running: {testResults.backendRunning ? '✅' : '❌'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Mail Accounts API: {testResults.mailAccountsEndpoint ? '✅' : '❌'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Gmail Accounts: {testResults.gmailAccountsCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>OAuth Endpoint: {testResults.oauthEndpoint ? '✅' : '❌'}</span>
                  </div>
                </div>
              </div>

              {testResults.accounts.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Connected Gmail Accounts</h4>
                  <div className="space-y-2">
                    {testResults.accounts.map((account: any) => (
                      <div key={account.id} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div>
                          <span className="font-medium">{account.email}</span>
                          <span className="text-sm text-gray-600 ml-2">({account.serviceType})</span>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${
                          account.isActive ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Test Instructions</h4>
            <ol className="text-sm text-gray-700 space-y-1">
              <li>1. Make sure the backend server is running on port 4002</li>
              <li>2. Click "Run Gmail Integration Test" to test all endpoints</li>
              <li>3. Check the results to see which components are working</li>
              <li>4. If tests pass, you can proceed to connect Gmail accounts</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GmailIntegrationTest;

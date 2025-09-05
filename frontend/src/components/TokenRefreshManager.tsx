import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Clock, Database, Mail } from 'lucide-react';

interface TokenStatus {
  service_type: string;
  total_tokens: number;
  valid_tokens: number;
  active_tokens: number;
  expiring_tokens: number;
}

const TokenRefreshManager: React.FC = () => {
  const [tokenStatus, setTokenStatus] = useState<TokenStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTokenStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:4002/email/auth/token-status', {
        headers: {
          'X-API-Key': '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch token status');
      }

      const data = await response.json();
      if (data.success) {
        setTokenStatus(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch token status');
      }
    } catch (error) {
      console.error('Error fetching token status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessage({ type: 'error', text: `Error: ${errorMessage}` });
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async (serviceType: string, userId: string = 'default-user') => {
    try {
      setRefreshing(serviceType);
      const response = await fetch(`http://localhost:4002/email/auth/${serviceType}/refresh-manual`, {
        method: 'POST',
        headers: {
          'X-API-Key': '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Token refreshed successfully for ${serviceType}` });
        // Refresh the status after successful refresh
        await fetchTokenStatus();
      } else {
        throw new Error(data.message || 'Failed to refresh token');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessage({ type: 'error', text: `Error refreshing ${serviceType}: ${errorMessage}` });
    } finally {
      setRefreshing(null);
    }
  };

  useEffect(() => {
    fetchTokenStatus();
    // Refresh status every 5 minutes
    const interval = setInterval(fetchTokenStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType.toLowerCase()) {
      case 'gmail':
        return <Mail className="h-5 w-5 text-red-500" />;
      case 'outlook':
        return <Mail className="h-5 w-5 text-blue-500" />;
      case 'yahoo':
        return <Mail className="h-5 w-5 text-purple-500" />;
      case 'zoho':
        return <Mail className="h-5 w-5 text-orange-500" />;
      default:
        return <Database className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: TokenStatus) => {
    if (status.expiring_tokens > 0) return 'text-yellow-600';
    if (status.active_tokens > 0) return 'text-green-600';
    if (status.valid_tokens > 0) return 'text-blue-600';
    return 'text-gray-600';
  };

  const getStatusText = (status: TokenStatus) => {
    if (status.expiring_tokens > 0) return `${status.expiring_tokens} expiring soon`;
    if (status.active_tokens > 0) return `${status.active_tokens} active`;
    if (status.valid_tokens > 0) return `${status.valid_tokens} valid`;
    return 'No tokens';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <RefreshCw className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Token Refresh Manager</h2>
        </div>
        <button
          onClick={fetchTokenStatus}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading token status...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {tokenStatus.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No token data available</p>
            </div>
          ) : (
            tokenStatus.map((status) => (
              <div key={status.service_type} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getServiceIcon(status.service_type)}
                    <div>
                      <h3 className="font-medium text-gray-900 capitalize">
                        {status.service_type} Service
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Total: {status.total_tokens}</span>
                        <span>Valid: {status.valid_tokens}</span>
                        <span>Active: {status.active_tokens}</span>
                        <span className={`font-medium ${getStatusColor(status)}`}>
                          {getStatusText(status)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {status.expiring_tokens > 0 && (
                      <div className="flex items-center space-x-1 text-yellow-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">Expiring Soon</span>
                      </div>
                    )}
                    
                    <button
                      onClick={() => refreshToken(status.service_type)}
                      disabled={refreshing === status.service_type || status.valid_tokens === 0}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                    >
                      {refreshing === status.service_type ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Automatic Token Refresh</h4>
        <p className="text-sm text-blue-800">
          Tokens are automatically refreshed every 30 minutes. Tokens that will expire within 2 hours 
          are automatically refreshed to ensure continuous service availability.
        </p>
      </div>
    </div>
  );
};

export default TokenRefreshManager;

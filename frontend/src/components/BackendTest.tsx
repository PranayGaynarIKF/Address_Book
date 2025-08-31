import React, { useState } from 'react';
import { healthAPI } from '../services/api';

const BackendTest: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const testConnection = async () => {
    setLoading(true);
    setError('');
    setStatus('');
    
    try {
      const response = await healthAPI.check();
      setStatus(`✅ Backend connected! Status: ${response.status}`);
      console.log('Backend response:', response.data);
    } catch (err: any) {
      setError(`❌ Connection failed: ${err.message}`);
      console.error('Backend connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Backend Connection Test</h2>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">
            Backend URL: <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:4002</code>
          </p>
        </div>
        
        <button
          onClick={testConnection}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Backend Connection'}
        </button>
        
        {status && (
          <div className="p-3 bg-green-100 text-green-800 rounded">
            {status}
          </div>
        )}
        
        {error && (
          <div className="p-3 bg-red-100 text-red-800 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default BackendTest;

// @ts-nocheck - Frontend React component - not for backend compilation
// This file contains React JSX code and should only be compiled in a frontend context
// It is excluded from backend TypeScript compilation via tsconfig.json

import React, { useState, useEffect } from 'react';
import TagManagement from './TagManagement';

// =============================================================================
// JWT TOKEN MANAGEMENT
// =============================================================================

const JWT_TOKEN_KEY = 'jwt_token';

const setJWTToken = (token: string) => {
  localStorage.setItem(JWT_TOKEN_KEY, token);
};

const getJWTToken = () => {
  return localStorage.getItem(JWT_TOKEN_KEY);
};

const removeJWTToken = () => {
  localStorage.removeItem(JWT_TOKEN_KEY);
};

// =============================================================================
// DEMO COMPONENT
// =============================================================================

export const TagDemo: React.FC = () => {
  const [jwtToken, setJwtToken] = useState(getJWTToken());
  const [inputToken, setInputToken] = useState('');

  const handleLogin = () => {
    if (inputToken.trim()) {
      setJWTToken(inputToken);
      setJwtToken(inputToken);
      setInputToken('');
    }
  };

  const handleLogout = () => {
    removeJWTToken();
    setJwtToken(null);
  };

  if (!jwtToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 w-96">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Tag Management System
          </h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                JWT Token
              </label>
              <input
                type="text"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder="Enter your JWT token"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              onClick={handleLogin}
              disabled={!inputToken.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Login
            </button>
            
            <div className="text-sm text-gray-600 text-center">
              <p>You can generate a JWT token using the script:</p>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                node generate-jwt.js
              </code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Logout */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            Contact Tag Management System
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Token: {jwtToken.substring(0, 20)}...
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Tag Management Component */}
      <TagManagement />
    </div>
  );
};

export default TagDemo;

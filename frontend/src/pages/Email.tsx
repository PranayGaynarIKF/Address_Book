import React, { useState } from 'react';
import EmailDashboard from '../components/EmailDashboard';
import GmailCampaignManager from '../components/GmailCampaignManager';
import TokenRefreshManager from '../components/TokenRefreshManager';

const Email: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'gmail-campaigns' | 'token-manager'>('overview');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === 'overview'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Email Overview
          </button>
          <button
            onClick={() => setActiveTab('gmail-campaigns')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === 'gmail-campaigns'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Gmail Campaigns
          </button>
          <button
            onClick={() => setActiveTab('token-manager')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === 'token-manager'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Token Manager
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overview' && <EmailDashboard />}
      {activeTab === 'gmail-campaigns' && <GmailCampaignManager />}
      {activeTab === 'token-manager' && <TokenRefreshManager />}
    </div>
  );
};

export default Email;

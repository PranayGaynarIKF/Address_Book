import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Plus, 
  Settings, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Users,
  FolderOpen,
  Search,
  Send,
  Inbox,
  Archive,
  Trash2,
  Star,
  Filter
} from 'lucide-react';
import EmailServiceModal from './EmailServiceModal';
import EmailMessages from './EmailMessages';
import EmailCompose from './EmailCompose';

interface EmailService {
  serviceType: string;
  isHealthy: boolean;
  email?: string;
  lastSync?: string;
}

interface EmailStats {
  totalMessages: number;
  unreadCount: number;
  sentCount: number;
  draftCount: number;
}

const EmailDashboard: React.FC = () => {
  const [emailServices, setEmailServices] = useState<EmailService[]>([]);
  const [emailStats, setEmailStats] = useState<EmailStats>({
    totalMessages: 0,
    unreadCount: 0,
    sentCount: 0,
    draftCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEmailServiceModalOpen, setIsEmailServiceModalOpen] = useState(false);
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<'GMAIL' | 'OUTLOOK' | 'YAHOO' | 'ZOHO'>('GMAIL');

  useEffect(() => {
    fetchEmailServices();
    fetchEmailStats();
  }, []);

  const fetchEmailServices = async () => {
    try {
      // Use the configs endpoint to get actual connected services
      const response = await fetch('http://localhost:4002/email/configs?userId=current-user-id');
      const data = await response.json();
      
      if (data.configs && Array.isArray(data.configs)) {
        const services = data.configs.map((config: any) => ({
          serviceType: config.serviceType,
          isHealthy: config.isActive, // Use isActive as health status
          email: 'Connected', // Show as connected since we have a config
          lastSync: new Date(config.updatedAt).toLocaleString(),
          configId: config.id
        }));
        
        setEmailServices(services);
      } else {
        // Fallback to empty array if no configs
        setEmailServices([]);
      }
    } catch (error) {
      console.error('Failed to fetch email services:', error);
      // Fallback to empty array on error
      setEmailServices([]);
    }
  };

  const fetchEmailStats = async () => {
    try {
      const response = await fetch('/api/email/stats');
      const data = await response.json();
      
      // Mock stats for now - would come from actual API
      setEmailStats({
        totalMessages: 1247,
        unreadCount: 23,
        sentCount: 156,
        draftCount: 3
      });
    } catch (error) {
      console.error('Failed to fetch email stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEmailService = (serviceType: 'GMAIL' | 'OUTLOOK' | 'YAHOO' | 'ZOHO') => {
    setSelectedServiceType(serviceType);
    setIsEmailServiceModalOpen(true);
  };

  const handleRefreshServices = () => {
    setIsLoading(true);
    fetchEmailServices();
    fetchEmailStats();
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType.toUpperCase()) {
      case 'GMAIL':
        return '📧';
      case 'OUTLOOK':
        return '📨';
      default:
        return '📬';
    }
  };

  const getServiceColor = (serviceType: string) => {
    switch (serviceType.toUpperCase()) {
      case 'GMAIL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'OUTLOOK':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
            Email Management
          </h1>
          <p className="text-gray-600 mt-2">Manage all your email services in one place</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefreshServices}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => handleAddEmailService('GMAIL')}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Gmail
            </button>
            <button
              onClick={() => handleAddEmailService('OUTLOOK')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Outlook
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Inbox },
            { id: 'messages', label: 'Messages', icon: Mail },
            { id: 'compose', label: 'Compose', icon: Send },
            { id: 'folders', label: 'Folders', icon: FolderOpen },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Messages</p>
                  <p className="text-2xl font-bold text-gray-900">{emailStats.totalMessages.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unread</p>
                  <p className="text-2xl font-bold text-gray-900">{emailStats.unreadCount}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sent</p>
                  <p className="text-2xl font-bold text-gray-900">{emailStats.sentCount}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Send className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Drafts</p>
                  <p className="text-2xl font-bold text-gray-900">{emailStats.draftCount}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-full">
                  <Archive className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Email Services */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Connected Email Services</h3>
              <p className="text-sm text-gray-600 mt-1">Manage your email service connections</p>
            </div>
            <div className="p-6">
              {emailServices.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No email services connected</h3>
                  <p className="text-gray-600 mb-4">Connect your first email service to get started</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddEmailService('GMAIL')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Connect Gmail
                    </button>
                    <button
                      onClick={() => handleAddEmailService('OUTLOOK')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Connect Outlook
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {emailServices.map((service) => (
                    <div
                      key={service.serviceType}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getServiceIcon(service.serviceType)}</span>
                          <div>
                            <h4 className="font-medium text-gray-900">{service.serviceType}</h4>
                            <p className="text-sm text-gray-600">{service.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {service.isHealthy ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Last sync: {service.lastSync}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getServiceColor(service.serviceType)}`}>
                          {service.isHealthy ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <button className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                          Settings
                        </button>
                        <button className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button 
                  onClick={() => setIsComposeModalOpen(true)}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Send className="h-5 w-5 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Compose Email</p>
                    <p className="text-sm text-gray-600">Send a new message</p>
                  </div>
                </button>
                
                <button 
                  onClick={() => {
                    setIsComposeModalOpen(true);
                    // TODO: Set initial state to tag selection mode
                  }}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Users className="h-5 w-5 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Send to Tag</p>
                    <p className="text-sm text-gray-600">Email all contacts in a tag</p>
                  </div>
                </button>
                
                <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Search className="h-5 w-5 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Search Messages</p>
                    <p className="text-sm text-gray-600">Find specific emails</p>
                  </div>
                </button>
                
                <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Filter className="h-5 w-5 text-purple-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Manage Filters</p>
                    <p className="text-sm text-gray-600">Set up email rules</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages Tab Content */}
      {activeTab === 'messages' && (
        <EmailMessages />
      )}

      {/* Other tabs would be implemented here */}
      {activeTab !== 'overview' && activeTab !== 'messages' && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Mail className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Coming Soon
          </h3>
          <p className="text-gray-600">This feature is under development</p>
        </div>
      )}

      {/* Modals */}
      <EmailServiceModal
        isOpen={isEmailServiceModalOpen}
        onClose={() => setIsEmailServiceModalOpen(false)}
        serviceType={selectedServiceType}
      />

      <EmailCompose
        isOpen={isComposeModalOpen}
        onClose={() => setIsComposeModalOpen(false)}
      />
    </div>
  );
};

export default EmailDashboard;

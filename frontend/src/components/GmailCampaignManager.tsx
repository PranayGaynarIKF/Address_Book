import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Mail, 
  Users, 
  Tag, 
  Send, 
  Plus, 
  Search, 
  Filter,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  Copy,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  FileText,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
  contactCount: number;
}

interface Contact {
  id: string;
  name: string;
  email?: string;
  companyName?: string;
  sourceSystem: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'email';
}

interface Campaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  tags: string[];
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduledAt?: string;
  sentAt?: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
}

const GmailCampaignManager: React.FC = () => {
  const queryClient = useQueryClient();
  
  // State management
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [campaignName, setCampaignName] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // API Configuration
  const API_BASE = 'http://localhost:4002';

  // Fetch tags
  const { data: tags, isLoading: tagsLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/tags`, {
        headers: { 'accept': '*/*' }
      });
      if (!response.ok) throw new Error('Failed to fetch tags');
      const data = await response.json();
      return data.map((tag: any) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        description: tag.description,
        contactCount: tag._count?.contactTags || 0
      }));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch email templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/templates?type=email`, {
        headers: { 'accept': '*/*' }
      });
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      return data.data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch contacts for selected tags
  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: ['tagContacts', Array.from(selectedTags)],
    queryFn: async () => {
      if (selectedTags.size === 0) return { contacts: [], total: 0 };
      
      const allContacts: Contact[] = [];
      let totalContacts = 0;
      
      for (const tagId of selectedTags) {
        try {
          const response = await fetch(`${API_BASE}/tags/${tagId}/contacts`, {
            headers: { 'accept': '*/*' }
          });
          if (response.ok) {
            const data = await response.json();
            allContacts.push(...data);
            totalContacts += data.length;
          }
        } catch (error) {
          console.error(`Error fetching contacts for tag ${tagId}:`, error);
        }
      }
      
      // Remove duplicates based on contact ID
      const uniqueContacts = allContacts.filter((contact, index, self) => 
        index === self.findIndex(c => c.id === contact.id)
      );
      
      return { contacts: uniqueContacts, total: uniqueContacts.length };
    },
    enabled: selectedTags.size > 0,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Mock campaigns data (in real app, this would come from API)
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'Welcome Campaign',
      subject: 'Welcome to Our Service!',
      content: 'Thank you for joining us...',
      tags: ['new-users', 'welcome'],
      status: 'sent',
      totalRecipients: 150,
      sentCount: 148,
      failedCount: 2,
      sentAt: '2024-01-15T10:00:00Z',
      createdAt: '2024-01-15T09:00:00Z'
    },
    {
      id: '2',
      name: 'Product Update',
      subject: 'New Features Available',
      content: 'We\'ve added exciting new features...',
      tags: ['active-users', 'product'],
      status: 'scheduled',
      scheduledAt: '2024-01-20T14:00:00Z',
      totalRecipients: 75,
      sentCount: 0,
      failedCount: 0,
      createdAt: '2024-01-16T11:00:00Z'
    }
  ]);

  // Computed values
  const filteredTags = useMemo(() => {
    if (!tags) return [];
    if (!searchTerm) return tags;
    return tags.filter((tag: Tag) => 
      tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tag.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tags, searchTerm]);

  const selectedContacts = contactsData?.contacts || [];
  const totalRecipients = contactsData?.total || 0;

  // Handlers
  const handleTagToggle = (tagId: string) => {
    const newSelectedTags = new Set(selectedTags);
    if (newSelectedTags.has(tagId)) {
      newSelectedTags.delete(tagId);
    } else {
      newSelectedTags.add(tagId);
    }
    setSelectedTags(newSelectedTags);
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates?.find((t: EmailTemplate) => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setEmailSubject(template.subject);
      setEmailContent(template.content);
    }
  };

  const handleSendCampaign = async () => {
    if (selectedTags.size === 0 || !emailSubject || !emailContent) {
      alert('Please select tags and fill in subject and content');
      return;
    }

    try {
      // In real app, this would send to your backend API
      const campaignData = {
        name: campaignName || `Campaign ${Date.now()}`,
        subject: emailSubject,
        content: emailContent,
        tags: Array.from(selectedTags),
        scheduledAt: scheduledDate && scheduledTime ? `${scheduledDate}T${scheduledTime}:00Z` : undefined,
        recipients: selectedContacts.map(c => c.email).filter(Boolean)
      };

      console.log('Sending campaign:', campaignData);
      
      // Mock success - in real app, this would be an API call
      const newCampaign: Campaign = {
        id: Date.now().toString(),
        name: campaignData.name,
        subject: campaignData.subject,
        content: campaignData.content,
        tags: campaignData.tags,
        status: campaignData.scheduledAt ? 'scheduled' : 'sending',
        scheduledAt: campaignData.scheduledAt,
        totalRecipients: totalRecipients,
        sentCount: 0,
        failedCount: 0,
        createdAt: new Date().toISOString()
      };

      setCampaigns(prev => [newCampaign, ...prev]);
      setShowComposeModal(false);
      resetForm();
      
      alert('Campaign created successfully!');
    } catch (error) {
      console.error('Error sending campaign:', error);
      alert('Failed to send campaign. Please try again.');
    }
  };

  const resetForm = () => {
    setSelectedTags(new Set());
    setSelectedTemplate('');
    setCampaignName('');
    setEmailSubject('');
    setEmailContent('');
    setScheduledDate('');
    setScheduledTime('');
    setEditingCampaign(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'sending': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4" />;
      case 'sending': return <Clock className="h-4 w-4" />;
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Mail className="h-7 w-7 mr-3 text-primary-600" />
              Gmail Campaign Manager
            </h1>
            <p className="text-gray-600 mt-2">
              Send targeted email campaigns to contacts based on tags
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowComposeModal(true)}
              className="btn-primary flex items-center justify-center space-x-2 px-6 py-3"
            >
              <Plus className="h-5 w-5" />
              <span>Create Campaign</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tag Selection */}
        <div className="lg:col-span-1 space-y-6">
          {/* Tag Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Tag className="h-5 w-5 mr-2 text-primary-600" />
              Select Tags
            </h3>
            
            {/* Search Tags */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Tags List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tagsLoading ? (
                <div className="animate-pulse space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : filteredTags.length > 0 ? (
                filteredTags.map((tag: Tag) => (
                  <div
                    key={tag.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedTags.has(tag.id)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleTagToggle(tag.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        ></div>
                        <div>
                          <div className="font-medium text-gray-900">{tag.name}</div>
                          <div className="text-sm text-gray-500">
                            {tag.contactCount} contacts
                          </div>
                        </div>
                      </div>
                      {selectedTags.has(tag.id) && (
                        <CheckCircle className="h-5 w-5 text-primary-600" />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Tag className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No tags found</p>
                </div>
              )}
            </div>

            {/* Selected Tags Summary */}
            {selectedTags.size > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Selected Tags ({selectedTags.size})
                  </span>
                  <button
                    onClick={() => setSelectedTags(new Set())}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedTags).map((tagId: string) => {
                    const tag = tags?.find((t: Tag) => t.id === tagId);
                    if (!tag) return null;
                    return (
                      <span
                        key={tagId}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800"
                      >
                        {tag.name}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTagToggle(tagId);
                          }}
                          className="ml-1 hover:text-primary-900"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Recipients Preview */}
          {selectedTags.size > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary-600" />
                Recipients Preview
              </h3>
              
              {contactsLoading ? (
                <div className="animate-pulse space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-8 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      Total Recipients: {totalRecipients}
                    </span>
                  </div>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedContacts.slice(0, 10).map((contact) => (
                      <div key={contact.id} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-800">
                            {contact.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {contact.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {contact.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    ))}
                    {selectedContacts.length > 10 && (
                      <div className="text-center py-2 text-sm text-gray-500">
                        +{selectedContacts.length - 10} more contacts
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Campaigns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Campaigns */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-primary-600" />
              Campaigns
            </h3>
            
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                          {getStatusIcon(campaign.status)}
                          <span className="ml-1">{campaign.status}</span>
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        Subject: {campaign.subject}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Recipients: {campaign.totalRecipients}</span>
                        <span>Sent: {campaign.sentCount}</span>
                        <span>Failed: {campaign.failedCount}</span>
                        {campaign.scheduledAt && (
                          <span>Scheduled: {new Date(campaign.scheduledAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {campaigns.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No campaigns yet</p>
                  <p className="text-sm">Create your first campaign to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Compose Campaign Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Create Email Campaign</h2>
                <button
                  onClick={() => setShowComposeModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Campaign Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="Enter campaign name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Template
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select a template</option>
                    {templates?.map((template: EmailTemplate) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Email Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Enter email subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Content
                </label>
                <textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder="Enter email content..."
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              {/* Scheduling */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule Date
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule Time
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Campaign Summary */}
              {selectedTags.size > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Campaign Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Selected Tags:</span>
                      <span className="ml-2 font-medium">{selectedTags.size}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Recipients:</span>
                      <span className="ml-2 font-medium">{totalRecipients}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className="ml-2 font-medium">
                        {scheduledDate && scheduledTime ? 'Scheduled' : 'Ready to Send'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowComposeModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendCampaign}
                disabled={selectedTags.size === 0 || !emailSubject || !emailContent}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {scheduledDate && scheduledTime ? 'Schedule Campaign' : 'Send Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GmailCampaignManager;

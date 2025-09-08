import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MessageSquare, 
  Users, 
  Send, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Phone,
  Mail,
  User,
  Tag,
  FileText,
  ArrowRight,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  tags: string[];
}

interface Tag {
  id: string;
  name: string;
  contactCount: number;
  color: string;
}

interface Template {
  id: string;
  name: string;
  content: string;
  variables: string[];
}

interface WhatsAppBulkMessagingProps {
  onClose: () => void;
}

const WhatsAppBulkMessaging: React.FC<WhatsAppBulkMessagingProps> = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [messagePreview, setMessagePreview] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ sent: 0, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  // Fetch tags
  const { data: tags, isLoading: tagsLoading, error: tagsError } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      console.log('🔍 Fetching tags for WhatsApp bulk messaging...');
      const response = await fetch('http://localhost:4002/tags');
      console.log('🔍 Tags response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Tags API error:', response.status, errorText);
        throw new Error(`Failed to fetch tags: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Tags data received:', data);
      // The API returns an array directly, not wrapped in a data property
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch contacts
  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const response = await fetch('http://localhost:4002/api/contacts');
      if (!response.ok) throw new Error('Failed to fetch contacts');
      const data = await response.json();
      return data.data || [];
    },
  });

  // Mock templates - in real implementation, fetch from your template API
  const templates: Template[] = [
    {
      id: '1',
      name: 'basic',
      content: 'Hello {{name}}, this is a message from IKF. Your mobile: {{mobile}}',
      variables: ['name', 'mobile']
    },
    {
      id: '2',
      name: 'welcome',
      content: 'Welcome {{name}}! We are excited to have you. Contact us at {{mobile}}',
      variables: ['name', 'mobile']
    },
    {
      id: '3',
      name: 'reminder',
      content: 'Hi {{name}}, this is a reminder about your upcoming appointment. Call us: {{mobile}}',
      variables: ['name', 'mobile']
    }
  ];

  // Fetch contacts for selected tags
  useEffect(() => {
    if (selectedTags.length === 0) {
      setSelectedContacts([]);
      return;
    }

    const fetchContactsForTags = async () => {
      try {
        setIsLoadingContacts(true);
        const allContacts: Contact[] = [];
        
        for (const tagId of selectedTags) {
          const response = await fetch(`http://localhost:4002/tags/${tagId}/contacts`, {
            headers: {
              'X-API-Key': '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            const tagContacts = data.contacts || data.data || data || [];
            allContacts.push(...tagContacts);
          } else {
            console.error(`Failed to fetch contacts for tag ${tagId}:`, response.status);
          }
        }

        // Remove duplicates based on contact ID
        const uniqueContacts = allContacts.filter((contact, index, self) => 
          index === self.findIndex(c => c.id === contact.id)
        );

        setSelectedContacts(uniqueContacts);
      } catch (error) {
        console.error('Error fetching contacts for tags:', error);
        setSelectedContacts([]);
      } finally {
        setIsLoadingContacts(false);
      }
    };

    fetchContactsForTags();
  }, [selectedTags]);

  // Generate message preview
  useEffect(() => {
    if (selectedTemplate && selectedContacts.length > 0) {
      const sampleContact = selectedContacts[0];
      let preview = selectedTemplate.content;
      
      // Replace variables with sample data
      preview = preview.replace(/\{\{name\}\}/g, sampleContact.name || 'John Doe');
      preview = preview.replace(/\{\{mobile\}\}/g, sampleContact.mobile || '1234567890');
      preview = preview.replace(/\{\{email\}\}/g, sampleContact.email || 'john@example.com');
      
      setMessagePreview(preview);
    } else {
      setMessagePreview('');
    }
  }, [selectedTemplate, selectedContacts]);

  // WhatsApp send mutation
  const sendWhatsAppMutation = useMutation({
    mutationFn: async (data: { contacts: Contact[], template: Template }) => {
      const response = await fetch('http://localhost:4002/whatsapp-bulk/send-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'my-secret-api-key-123'
        },
        body: JSON.stringify({
          contacts: data.contacts,
          template: data.template,
          phone_number_id: '690875100784871',
          company_id: '689044bc84f5e822'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send WhatsApp messages');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-history'] });
      alert('✅ WhatsApp messages sent successfully!');
      setIsSending(false);
      setSendProgress({ sent: 0, total: 0 });
    },
    onError: (error: any) => {
      alert(`❌ Failed to send WhatsApp messages: ${error.message}`);
      setIsSending(false);
      setSendProgress({ sent: 0, total: 0 });
    },
  });

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSendMessages = async () => {
    if (!selectedTemplate || selectedContacts.length === 0) {
      alert('Please select a template and at least one tag');
      return;
    }

    setIsSending(true);
    setSendProgress({ sent: 0, total: selectedContacts.length });

    try {
      await sendWhatsAppMutation.mutateAsync({
        contacts: selectedContacts,
        template: selectedTemplate
      });
    } catch (error) {
      console.error('Error sending messages:', error);
    }
  };

  const filteredTags = tags?.filter((tag: Tag) => 
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-green-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare size={24} />
              <div>
                <h2 className="text-xl font-semibold">WhatsApp Bulk Messaging</h2>
                <p className="text-green-100 text-sm">Send messages to contacts by tags</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-green-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Template & Tag Selection */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            {/* Template Selection */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText size={20} className="text-blue-600" />
                Select Template
              </h3>
              <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{template.content}</p>
                      </div>
                      {selectedTemplate?.id === template.id && (
                        <CheckCircle className="text-green-500" size={20} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tag Selection */}
            <div className="p-6 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Tag size={20} className="text-purple-600" />
                  Select Tags
                </h3>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {tagsLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                    <p>Loading tags...</p>
                  </div>
                ) : tagsError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto mb-2 text-red-500" size={24} />
                    <p className="text-red-500">Failed to load tags</p>
                    <p className="text-sm text-gray-500 mt-1">Check console for details</p>
                  </div>
                ) : filteredTags.length === 0 ? (
                  <div className="text-center py-8">
                    <Tag className="mx-auto mb-2 text-gray-400" size={24} />
                    <p className="text-gray-500">No tags available</p>
                    <p className="text-sm text-gray-400 mt-1">Create tags in the Contacts section first</p>
                  </div>
                ) : (
                  filteredTags.map((tag: Tag) => (
                    <div
                      key={tag.id}
                      onClick={() => handleTagToggle(tag.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedTags.includes(tag.id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: tag.color || '#6366f1' }}
                          />
                          <div>
                            <h4 className="font-medium">{tag.name}</h4>
                            <p className="text-sm text-gray-600">{tag.contactCount} contacts</p>
                          </div>
                        </div>
                        {selectedTags.includes(tag.id) && (
                          <CheckCircle className="text-green-500" size={20} />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Preview & Send */}
          <div className="w-1/2 flex flex-col">
            {/* Contact Preview */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users size={20} className="text-orange-600" />
                Selected Contacts ({selectedContacts.length})
              </h3>
              
              <div className="max-h-40 overflow-y-auto space-y-2">
                {isLoadingContacts ? (
                  <div className="text-center py-4">
                    <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                    <p className="text-sm text-gray-500">Loading contacts...</p>
                  </div>
                ) : selectedContacts.length === 0 ? (
                  <div className="text-center py-4">
                    <Users size={24} className="mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">No contacts found for selected tags</p>
                  </div>
                ) : (
                  selectedContacts.map((contact) => (
                    <div key={contact.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {contact.name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{contact.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-600">{contact.mobile}</p>
                      </div>
                      <Phone className="text-green-500" size={16} />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Message Preview */}
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare size={20} className="text-blue-600" />
                Message Preview
              </h3>
              
              <div className="flex-1 bg-gray-50 rounded-lg p-4 mb-4">
                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      W
                    </div>
                    <div>
                      <p className="font-medium">WhatsApp</p>
                      <p className="text-xs text-gray-500">now</p>
                    </div>
                  </div>
                  <div className="bg-green-100 rounded-lg p-3 max-w-xs">
                    <p className="text-sm">{messagePreview || 'Select a template and tags to see preview'}</p>
                  </div>
                </div>
              </div>

              {/* Send Button */}
              <div className="space-y-4">
                {isSending && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <RefreshCw className="animate-spin text-blue-600" size={16} />
                      <span className="text-sm font-medium text-blue-800">Sending messages...</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(sendProgress.sent / sendProgress.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      {sendProgress.sent} of {sendProgress.total} messages sent
                    </p>
                  </div>
                )}

                <button
                  onClick={handleSendMessages}
                  disabled={!selectedTemplate || selectedContacts.length === 0 || isSending}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Send size={20} />
                  {isSending ? 'Sending...' : `Send to ${selectedContacts.length} contacts`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppBulkMessaging;

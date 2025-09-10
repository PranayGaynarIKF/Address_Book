import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Mail, 
  Users, 
  Send, 
  CheckCircle, 
  AlertCircle,
  Tag,
  FileText,
  Search,
  RefreshCw,
  Eye,
  Trash2
} from 'lucide-react';
import TemplateCreationModal from './TemplateCreationModal';
import GmailOAuthCheck from './GmailOAuthCheck';

interface Contact {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  tags: string[];
}

interface EmailTag {
  id: string;
  name: string;
  contactCount: number;
  color: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
}

interface GmailBulkMessagingProps {
  onClose: () => void;
}

const GmailBulkMessaging: React.FC<GmailBulkMessagingProps> = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailContent, setEmailContent] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [sendProgress, setSendProgress] = useState({ sent: 0, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  // Fetch tags
  const { data: tags, isLoading: tagsLoading, error: tagsError } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      console.log('🔍 Fetching tags for Gmail bulk messaging...');
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

  // Fetch email templates from API
  const { data: emailTemplates = [] } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: async () => {
      const response = await fetch('http://localhost:4002/simple-templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      const templates = await response.json();
      return templates
        .filter((template: any) => template.channel === 'EMAIL' && template.isActive)
        .map((template: any) => ({
          id: template.id,
          name: template.name,
          subject: '', // Templates don't have subjects in our current structure
          content: template.body,
          variables: []
        }));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

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

  // Update email content when template changes
  useEffect(() => {
    if (selectedTemplate) {
      setEmailSubject(selectedTemplate.subject);
      setEmailContent(selectedTemplate.content.replace(/\\n/g, '\n'));
    }
  }, [selectedTemplate]);

  // Gmail send mutation
  const sendGmailMutation = useMutation({
    mutationFn: async (data: { contacts: Contact[], subject: string, content: string }) => {
      const response = await fetch('http://localhost:4002/email-bulk/bulk-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'my-secret-api-key-123'
        },
        body: JSON.stringify({
          contacts: data.contacts,
          subject: data.subject,
          content: data.content,
          fromEmail: 'pranay.gaynar@ikf.co.in' // Use connected Gmail account
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send emails');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-messages'] });
      alert('✅ Emails sent successfully!');
      setIsSending(false);
      setSendProgress({ sent: 0, total: 0 });
    },
    onError: (error: any) => {
      alert(`❌ Failed to send emails: ${error.message}`);
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

  const handleCreateTemplate = () => {
    setShowTemplateModal(true);
  };

  const handleTemplateCreated = (newTemplate: any) => {
    // Refresh templates query
    queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
    
    // Apply the new template
    setSelectedTemplate({
      id: newTemplate.id,
      name: newTemplate.name,
      subject: '', // Templates don't have subjects in our current structure
      content: newTemplate.body,
      variables: []
    });
    
    setEmailContent(newTemplate.body.replace(/\\n/g, '\n'));
  };

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    if (!window.confirm(`Are you sure you want to delete the template "${templateName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:4002/simple-templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      // Refresh templates query
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
      
      // Clear selected template if it was the deleted one
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null);
        setEmailContent('');
      }

      alert('Template deleted successfully!');
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template. Please try again.');
    }
  };

  const handleSendEmails = async () => {
    if (!emailSubject || !emailContent || selectedContacts.length === 0) {
      alert('Please fill in subject, content and select at least one tag');
      return;
    }

    // Check Gmail OAuth before sending
    setShowOAuthModal(true);
  };

  const handleOAuthSuccess = async () => {
    setShowOAuthModal(false);
    
    // Proceed with sending emails
    setIsSending(true);
    setSendProgress({ sent: 0, total: selectedContacts.length });

    try {
      await sendGmailMutation.mutateAsync({
        contacts: selectedContacts,
        subject: emailSubject,
        content: emailContent
      });
    } catch (error) {
      console.error('Error sending emails:', error);
    }
  };

  const handleOAuthError = (error: string) => {
    console.error('Gmail OAuth error:', error);
    alert(`Gmail authentication failed: ${error}`);
  };

  const generatePreview = (contact: Contact) => {
    let preview = emailContent;
    preview = preview.replace(/\{\{name\}\}/g, contact.name || 'John Doe');
    preview = preview.replace(/\{\{mobile\}\}/g, contact.mobile || '1234567890');
    preview = preview.replace(/\{\{email\}\}/g, contact.email || 'john@example.com');
    
    // Convert plain text to HTML for preview (same logic as backend)
    if (!preview.includes('<') && !preview.includes('>')) {
      preview = convertPlainTextToHtml(preview);
    }
    
    return preview;
  };

  const convertPlainTextToHtml = (plainText: string): string => {
    // Convert plain text to beautiful HTML email
    const lines = plainText.split('\n');
    let html = '';
    let inParagraph = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === '') {
        if (inParagraph) {
          html += '</p>';
          inParagraph = false;
        }
        html += '<br>';
      } else if (line.length > 0 && line.length < 50 && !line.includes(' ') && i < lines.length - 1) {
        // Likely a title/header
        if (inParagraph) {
          html += '</p>';
          inParagraph = false;
        }
        html += `<h2 style="color: #2563eb; margin-bottom: 20px; font-size: 24px; font-weight: bold;">${line}</h2>`;
      } else {
        if (!inParagraph) {
          html += '<p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">';
          inParagraph = true;
        } else {
          html += '<br>';
        }
        html += line;
      }
    }

    if (inParagraph) {
      html += '</p>';
    }

    // Wrap in professional email container
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          ${html}
        </div>
      </div>
    `;
  };

  const filteredTags = tags?.filter((tag: EmailTag) => 
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="w-full h-screen bg-gray-50 p-4">
      <div className="bg-white rounded-xl w-full h-full flex flex-col shadow-lg max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail size={28} />
              <div>
                <h2 className="text-2xl font-bold">Gmail Bulk Messaging</h2>
                <p className="text-blue-100 text-sm">Send emails to contacts by tags</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors p-2 hover:bg-blue-500 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden min-h-0 flex-col lg:flex-row">
          {/* Left Panel - Template & Tag Selection */}
          <div className="w-full lg:w-1/3 border-r border-gray-200 flex flex-col min-h-0">
            {/* Template Selection */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText size={20} className="text-blue-600" />
                  Select Template
                </h3>
                <button
                  onClick={handleCreateTemplate}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  + Create New
                </button>
              </div>
              <div className="space-y-2">
                {emailTemplates.map((template: EmailTemplate) => (
                  <div
                    key={template.id}
                    className={`p-3 border rounded-lg transition-all hover:shadow-sm ${
                      selectedTemplate?.id === template.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <h4 className="font-medium text-sm">{template.name}</h4>
                        <p className="text-xs text-gray-600 mt-1 truncate">{template.subject}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedTemplate?.id === template.id && (
                          <CheckCircle className="text-blue-500 flex-shrink-0" size={16} />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(template.id, template.name);
                          }}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Delete template"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tag Selection */}
            <div className="p-4 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-3">
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
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
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
                  filteredTags.map((tag: EmailTag) => (
                    <div
                      key={tag.id}
                      onClick={() => handleTagToggle(tag.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                        selectedTags.includes(tag.id)
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: tag.color || '#6366f1' }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{tag.name}</h4>
                            <p className="text-xs text-gray-600">{tag.contactCount} contacts</p>
                          </div>
                        </div>
                        {selectedTags.includes(tag.id) && (
                          <CheckCircle className="text-blue-500 flex-shrink-0" size={16} />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Middle Panel - Email Composition */}
          <div className="w-full lg:w-1/3 border-r border-gray-200 flex flex-col min-h-0">
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Mail size={20} className="text-green-600" />
                Compose Email
              </h3>

              {/* Subject */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Enter email subject..."
                />
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden">
                  <textarea
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    className="w-full h-full px-3 py-2 border-0 rounded-lg focus:outline-none resize-none text-sm"
                    placeholder="Enter email content... Use {{name}}, {{mobile}}, {{email}} for dynamic content. Write your message in plain text - it will be automatically formatted as HTML when sent."
                    style={{ minHeight: '200px' }}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  💡 Tip: Write your message in plain text. The system will automatically convert it to beautiful HTML format when sending.
                </div>
              </div>

              {/* Preview Button */}
              <div className="mt-4">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Eye size={16} />
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Contacts & Send */}
          <div className="w-full lg:w-1/3 flex flex-col min-h-0">
            {/* Contact Preview */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Users size={20} className="text-orange-600" />
                Selected Contacts ({selectedContacts.length})
              </h3>
              
              <div className="max-h-32 overflow-y-auto space-y-2">
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
                    <div key={contact.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                        {contact.name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{contact.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-600 truncate">{contact.email || contact.mobile}</p>
                      </div>
                      <Mail className="text-blue-500 flex-shrink-0" size={14} />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Email Preview */}
            {showPreview && selectedContacts.length > 0 && (
              <div className="p-6 border-b border-gray-200 flex-1 overflow-hidden flex flex-col">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Eye size={20} className="text-purple-600" />
                  Email Preview
                </h3>
                
                <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm border">
                    <div className="border-b border-gray-200 pb-3 mb-3">
                      <p className="font-medium text-sm">To: {selectedContacts[0]?.email || selectedContacts[0]?.mobile}</p>
                      <p className="text-sm text-gray-600">Subject: {emailSubject}</p>
                    </div>
                    <div 
                      className="max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: generatePreview(selectedContacts[0]) 
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Send Button */}
            <div className="p-4">
              {isSending && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="animate-spin text-blue-600" size={16} />
                    <span className="text-sm font-medium text-blue-800">Sending emails...</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(sendProgress.sent / sendProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    {sendProgress.sent} of {sendProgress.total} emails sent
                  </p>
                </div>
              )}

              <button
                onClick={handleSendEmails}
                disabled={!emailSubject || !emailContent || selectedContacts.length === 0 || isSending}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Send size={18} />
                {isSending ? 'Sending...' : `Send to ${selectedContacts.length} contacts`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Template Creation Modal */}
      <TemplateCreationModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onTemplateCreated={handleTemplateCreated}
        channel="EMAIL"
      />

      {/* Gmail OAuth Check Modal */}
      <GmailOAuthCheck
        isOpen={showOAuthModal}
        onClose={() => setShowOAuthModal(false)}
        onAuthSuccess={handleOAuthSuccess}
        onAuthError={handleOAuthError}
      />
    </div>
  );
};

export default GmailBulkMessaging;

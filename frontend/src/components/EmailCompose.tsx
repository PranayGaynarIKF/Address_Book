import React, { useState, useEffect, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { 
  Send, 
  Paperclip, 
  X, 
  Plus, 
  Trash2, 
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Users,
  Tag,
  Maximize2,
  Minimize2
} from 'lucide-react';
import TemplateSelector from './TemplateSelector';
import TemplateCreationModal from './TemplateCreationModal';
import GmailOAuthManager from './GmailOAuthManager';
import GmailAuthStatus from './GmailAuthStatus';
import { useGmailAuth } from '../hooks/useGmailAuth';
import { formatPlainTextToMailFormat, formatLiteralNewlinesToHtml } from '../utils/htmlUtils';

interface EmailComposeProps {
  isOpen: boolean;
  onClose: () => void;
  replyTo?: {
    subject: string;
    to: string;
    content: string;
  };
}

interface EmailDraft {
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  content: string;
  attachments: File[];
  serviceType: string;
  selectedTagId?: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
  contactCount: number;
}

const EmailCompose: React.FC<EmailComposeProps> = ({ isOpen, onClose, replyTo }) => {
  // API Configuration
  const API_BASE = 'http://localhost:4002';
  const API_KEY = '0149f6cf158a88461d1fca0d6da773ac'; // Email API key (not WhatsApp)
  
  const [draft, setDraft] = useState<EmailDraft>({
    to: replyTo ? [replyTo.to] : [],
    cc: [],
    bcc: [],
    subject: replyTo ? `Re: ${replyTo.subject}` : '',
    content: replyTo ? `\n\n${replyTo.content}` : '',
    attachments: [],
    serviceType: 'GMAIL'
  });
  
  // Gmail authentication hook
  const { authStatus, checkAuth, getOAuthUrl, clearCache } = useGmailAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [selectedTagContacts, setSelectedTagContacts] = useState<any[]>([]);
  const [showTagContacts, setShowTagContacts] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedTemplateData, setSelectedTemplateData] = useState<any>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Quill editor configuration
  const quillModules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  }), []);

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet', 'indent',
    'align', 'link', 'image'
  ];

  useEffect(() => {
    if (isOpen) {
      fetchTags();
    }
  }, [isOpen]);

  const fetchTags = async () => {
    setIsLoadingTags(true);
    try {
      // Use the full backend URL
      const response = await fetch(`${API_BASE}/tags`, {
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json',
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Tags fetched:', data);
        
        // Filter tags that have contacts (contactCount > 0)
        const tagsWithContacts = data.filter((tag: any) => tag.contactCount > 0);
        console.log('Tags with contacts:', tagsWithContacts);
        
        setTags(tagsWithContacts);
      } else {
        console.error('Failed to fetch tags:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setIsLoadingTags(false);
    }
  };

  const handleTagSelection = async (tagId: string) => {
    if (!tagId) {
      setDraft(prev => ({ ...prev, selectedTagId: undefined }));
      setSelectedTagContacts([]);
      return;
    }

    setDraft(prev => ({ ...prev, selectedTagId: tagId }));
    
    try {
      console.log('🔍 Fetching contacts for tag:', tagId);
      // Use the email-specific endpoint for getting contacts by tag
      const response = await fetch(`${API_BASE}/email/tags/${tagId}/contacts`, {
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json',
        }
      });
      
      console.log('📧 Tag contacts response status:', response.status);
      console.log('📧 Tag contacts response headers:', response.headers);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📧 Tag contacts fetched:', data);
        console.log('📧 Data structure:', Object.keys(data));
        console.log('📧 Contacts array:', data.contacts || data.data || data);
        
        const contacts = data.contacts || data.data || data || [];
        setSelectedTagContacts(contacts);
        
        // Log contact details
        if (contacts.length > 0) {
          console.log('📧 First contact:', contacts[0]);
          console.log('📧 Contact emails:', contacts.map((c: any) => c.email).filter(Boolean));
        }
        
        console.log(`✅ Selected tag: ${tagId} with ${contacts.length} contacts`);
      } else {
        console.error('❌ Failed to fetch tag contacts:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error details:', errorData);
        
        // Fallback: try the general tags endpoint
        console.log('🔄 Trying fallback to general tags endpoint...');
        const fallbackResponse = await fetch(`${API_BASE}/tags/${tagId}/contacts`, {
          headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json',
          }
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          console.log('📧 Fallback contacts fetched:', fallbackData);
          const fallbackContacts = fallbackData.data || fallbackData || [];
          setSelectedTagContacts(fallbackContacts);
          console.log(`✅ Fallback: Selected tag: ${tagId} with ${fallbackContacts.length} contacts`);
        } else {
          console.error('❌ Fallback also failed:', fallbackResponse.status);
          setSelectedTagContacts([]);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching tag contacts:', error);
      setSelectedTagContacts([]);
    }
  };

  const handleInputChange = (field: keyof EmailDraft, value: string | string[] | File[]) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };

  const handleAddRecipient = (field: 'to' | 'cc' | 'bcc') => {
    const newEmail = prompt(`Enter ${field.toUpperCase()} email address:`);
    if (newEmail && newEmail.trim()) {
      setDraft(prev => ({
        ...prev,
        [field]: [...prev[field], newEmail.trim()]
      }));
    }
  };

  const handleRemoveRecipient = (field: 'to' | 'cc' | 'bcc', index: number) => {
    setDraft(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleTemplateChange = (template: any) => {
    setSelectedTemplateData(template);
    if (template) {
      // Convert literal \n characters to HTML for ReactQuill
      let formattedContent = template.body;
      if (formattedContent.includes('\\n')) {
        formattedContent = formattedContent.replace(/\\n/g, '\n');
      }
      // Convert newlines to HTML <br> tags for ReactQuill
      if (formattedContent.includes('\n')) {
        formattedContent = formattedContent.replace(/\n/g, '<br>');
      }
      
      setDraft(prev => ({
        ...prev,
        content: formattedContent
      }));
    }
  };

  const handleCreateTemplate = () => {
    setShowTemplateModal(true);
  };

  const handleTemplateCreated = (newTemplate: any) => {
    // Refresh template list or add to current list
    setSelectedTemplate(newTemplate.id);
    setSelectedTemplateData(newTemplate);
    setDraft(prev => ({
      ...prev,
      content: newTemplate.body.replace(/\\n/g, '\n')
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setDraft(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const handleRemoveAttachment = (index: number) => {
    setDraft(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const validateDraft = (): boolean => {
    // If tag is selected, we don't need recipients in the 'to' field
    if (draft.selectedTagId) {
      // Tag-based sending: only need subject and content
      if (!draft.subject.trim()) {
        setError('Subject is required');
        return false;
      }
      if (!draft.content.trim()) {
        setError('Message content is required');
        return false;
      }
      return true;
    } else {
      // Regular email sending: need recipients, subject, and content
      if (draft.to.length === 0) {
        setError('At least one recipient is required');
        return false;
      }
      if (!draft.subject.trim()) {
        setError('Subject is required');
        return false;
      }
      if (!draft.content.trim()) {
        setError('Message content is required');
        return false;
      }
      return true;
    }
  };

  const handleSend = async () => {
    if (!validateDraft()) return;

    console.log('🔍 EmailCompose: Starting authentication check...');
    console.log('🔍 EmailCompose: Current authStatus before check:', authStatus);
    
    // Clear cache to ensure fresh authentication check
    console.log('🔍 EmailCompose: Clearing cache...');
    clearCache();
    
    // Check Gmail authentication status first (force refresh to bypass cache)
    console.log('🔍 EmailCompose: Calling checkAuth(true)...');
    const isAuthenticated = await checkAuth(true);
    
    console.log('🔍 EmailCompose: Authentication result:', isAuthenticated);
    console.log('🔍 EmailCompose: Current authStatus after check:', authStatus);
    
    if (!isAuthenticated) {
      console.log('🔍 EmailCompose: Not authenticated, showing OAuth modal');
      // If not authenticated, show OAuth modal
      setShowOAuthModal(true);
      return;
    }

    console.log('🔍 EmailCompose: Authenticated, proceeding with sending');
    // If authenticated, proceed with sending
    await proceedWithSending();
  };

  const proceedWithSending = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (draft.selectedTagId) {
        // Send bulk email to tag
        await sendBulkEmailToTag();
      } else {
        // Send regular email
        await sendRegularEmail();
      }
    } catch (err) {
      setError('Failed to send email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSuccess = async () => {
    setShowOAuthModal(false);
    
    // Refresh auth status after successful OAuth
    await checkAuth(true);
    
    // Proceed with sending
    await proceedWithSending();
  };

  const handleOAuthError = (error: string) => {
    console.error('Gmail OAuth error:', error);
    setError(`Gmail authentication failed: ${error}`);
  };

  const sendRegularEmail = async () => {
    // Simulate API call for regular email
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setSuccess('Email sent successfully!');
    setTimeout(() => {
      onClose();
      setSuccess('');
    }, 1500);
  };

  const sendBulkEmailToTag = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Validate that we have contacts with email addresses
      if (!selectedTagContacts || selectedTagContacts.length === 0) {
        setError('No contacts found for the selected tag. Please select a different tag or add contacts to this tag.');
        return;
      }

      const validEmails = selectedTagContacts.map(contact => contact.email).filter(Boolean);
      if (validEmails.length === 0) {
        setError('No contacts with valid email addresses found for the selected tag. Please ensure contacts have email addresses.');
        return;
      }

      console.log('📧 Sending bulk email to tag contacts:');
      console.log('📧 Total contacts:', selectedTagContacts.length);
      console.log('📧 Valid emails:', validEmails.length);
      console.log('📧 Email addresses:', validEmails);

      if (!draft.subject || !draft.content) {
        setError('Subject and message content are required');
        return;
      }

      // Send data in the format the backend expects
      const emailData = {
        subject: draft.subject,
        body: draft.content,
        serviceType: draft.serviceType || 'GMAIL'
      };

      console.log('Sending bulk email data:', emailData);
      console.log('Selected tag ID:', draft.selectedTagId);
      console.log('API URL:', `${API_BASE}/email/tags/${draft.selectedTagId}/send-bulk`);

      // Use the correct email endpoint for bulk sending to tags
      let response = await fetch(`${API_BASE}/email/tags/${draft.selectedTagId}/send-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify(emailData)
      });

      console.log('Response status:', response.status);
      console.log('Response status text:', response.statusText);
      console.log('Response headers:', response.headers);

      // If the first endpoint fails, try alternative endpoint structure
      if (!response.ok) {
        console.log('First endpoint failed, trying alternative...');
        const alternativeEmailData = {
          message: {
            to: selectedTagContacts.map(contact => contact.email).filter(Boolean),
            subject: emailData.subject,
            body: emailData.body
          },
          serviceTypes: [emailData.serviceType]
        };
        
        response = await fetch(`${API_BASE}/email/messages/bulk-send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
          },
          body: JSON.stringify(alternativeEmailData)
        });
        
        console.log('Alternative endpoint response status:', response.status);
      }

      // If both endpoints fail, try sending individual emails as fallback
      if (!response.ok) {
        console.log('Both bulk endpoints failed, trying individual email fallback...');
        
        const emails = selectedTagContacts.map(contact => contact.email).filter(Boolean);
        if (emails.length === 0) {
          setError('No valid email addresses found for the selected tag');
          return;
        }
        
        // Try individual email endpoint
        const endpoint = `${API_BASE}/email/messages/send`;
        console.log('Trying endpoint 3 (individual):', endpoint);
        
        const individualEmailData = {
          to: emails,
          subject: emailData.subject,
          body: emailData.body,
          serviceType: emailData.serviceType
        };
        
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
          },
          body: JSON.stringify(individualEmailData)
        });
        
        console.log('Individual endpoint response status:', response.status);
      }

      if (response.ok) {
        const result = await response.json();
        console.log('Bulk email result:', result);
        console.log('Result structure:', Object.keys(result));
        console.log('Success count:', result.successCount);
        console.log('Failure count:', result.failureCount);
        console.log('Message:', result.message);
        
        // Handle different response structures
        let successCount = result.successCount || result.count || result.results?.length || 'unknown';
        let failureCount = result.failureCount || 0;
        
        // Validate that we actually got a valid response
        if (successCount === 'unknown' || successCount === undefined) {
          console.error('Invalid response structure - successCount is unknown');
          setError('Email response format error. Please check backend configuration.');
          return;
        }
        
        setSuccess(
          `Bulk email sent successfully! Sent to ${successCount} contacts. ` +
          (failureCount > 0 ? `${failureCount} failed.` : '')
        );
        setTimeout(() => {
          onClose();
          setSuccess('');
        }, 3000);
      } else {
        let errorMessage = 'Unknown error';
        try {
          const errorData = await response.json();
          console.error('Bulk email error response:', errorData);
          errorMessage = errorData.message || errorData.error || 'Unknown error';
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        setError(`Failed to send bulk email: ${errorMessage}`);
      }
    } catch (err) {
      console.error('Bulk email exception:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to send bulk email: ${errorMessage}`);
    }
  };

  const handleSaveDraft = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Simulate API call to save draft
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Draft saved successfully!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Failed to save draft. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (draft.to.length > 0 || draft.subject || draft.content) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-blue-600 text-white">
          <h2 className="text-lg font-semibold">New Message</h2>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="text-white hover:text-blue-200 transition-colors"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">{success}</span>
              </div>
            </div>
          )}

          <form className="space-y-4">
            {/* Service Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Service
              </label>
              <select
                value={draft.serviceType}
                onChange={(e) => handleInputChange('serviceType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="GMAIL">Gmail</option>
                <option value="OUTLOOK">Outlook</option>
                <option value="YAHOO">Yahoo Mail</option>
                <option value="ZOHO">Zoho Mail</option>
              </select>
            </div>

            {/* Tag Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send to Tag (Optional)
              </label>
              <div className="space-y-3">
                {/* Debug Info */}
                <div className="text-xs text-gray-500">
                  Debug: {tags.length} tags loaded, {isLoadingTags ? 'loading...' : 'ready'}
                </div>
                
                <select
                  value={draft.selectedTagId || ''}
                  onChange={(e) => handleTagSelection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a tag to send to all contacts</option>
                  {isLoadingTags ? (
                    <option disabled>Loading tags...</option>
                  ) : tags.length === 0 ? (
                    <option disabled>No tags with contacts found</option>
                  ) : (
                    tags.map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name} ({tag.contactCount} contacts)
                      </option>
                    ))
                  )}
                </select>
                
                {draft.selectedTagId && selectedTagContacts.length > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        {tags.find(t => t.id === draft.selectedTagId)?.name}
                      </span>
                      <span className="text-xs text-blue-600">
                        ({selectedTagContacts.length} contacts)
                      </span>
                    </div>
                    
                    {/* Email validation warning */}
                    {(() => {
                      const validEmails = selectedTagContacts.map(contact => contact.email).filter(Boolean);
                      if (validEmails.length === 0) {
                        return (
                          <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                            ⚠️ No contacts with valid email addresses found. Emails cannot be sent.
                          </div>
                        );
                      } else if (validEmails.length < selectedTagContacts.length) {
                        return (
                          <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                            ℹ️ {validEmails.length} of {selectedTagContacts.length} contacts have valid emails.
                          </div>
                        );
                      }
                      return null;
                    })()}
                    
                    <button
                      type="button"
                      onClick={() => setShowTagContacts(!showTagContacts)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      {showTagContacts ? 'Hide' : 'Show'} contact details
                    </button>
                    
                    {showTagContacts && (
                      <div className="mt-2 max-h-32 overflow-y-auto">
                        {selectedTagContacts.map((contact, index) => (
                          <div key={index} className="text-xs text-blue-700 py-1 border-b border-blue-100 last:border-b-0">
                            <div className="font-medium">{contact.name || 'Unnamed'}</div>
                            <div className="text-blue-600">{contact.email}</div>
                            {contact.companyName && (
                              <div className="text-blue-500">{contact.companyName}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To <span className="text-red-500">*</span>
              </label>
              
              {draft.selectedTagId && (
                <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      <strong>Tag Selected:</strong> When a tag is selected, emails will be sent to ALL contacts in that tag. 
                      The "To" field below will be ignored for tag-based sending.
                    </span>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                {draft.to.map((email, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        const newTo = [...draft.to];
                        newTo[index] = e.target.value;
                        handleInputChange('to', newTo);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="recipient@example.com"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveRecipient('to', index)}
                      className="p-2 text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddRecipient('to')}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Recipient
                </button>
              </div>
            </div>

            {/* CC */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  CC
                </label>
                <button
                  type="button"
                  onClick={() => setShowCc(!showCc)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {showCc ? 'Hide' : 'Show'} CC
                </button>
              </div>
              {showCc && (
                <div className="space-y-2">
                  {draft.cc.map((email, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          const newCc = [...draft.cc];
                          newCc[index] = e.target.value;
                          handleInputChange('cc', newCc);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="cc@example.com"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveRecipient('cc', index)}
                        className="p-2 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddRecipient('cc')}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add CC
                  </button>
                </div>
              )}
            </div>

            {/* BCC */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  BCC
                </label>
                <button
                  type="button"
                  onClick={() => setShowBcc(!showBcc)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {showBcc ? 'Hide' : 'Show'} BCC
                </button>
              </div>
              {showBcc && (
                <div className="space-y-2">
                  {draft.bcc.map((email, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          const newBcc = [...draft.bcc];
                          newBcc[index] = e.target.value;
                          handleInputChange('bcc', newBcc);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="bcc@example.com"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveRecipient('bcc', index)}
                        className="p-2 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddRecipient('bcc')}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add BCC
                  </button>
                </div>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={draft.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter subject..."
              />
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments
              </label>
              <div className="space-y-2">
                {draft.attachments.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <Paperclip className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(index)}
                      className="ml-auto p-1 text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm cursor-pointer">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Paperclip className="h-4 w-4" />
                  Add Attachment
                </label>
              </div>
            </div>

            {/* Template Selection */}
            <TemplateSelector
              channel="EMAIL"
              selectedTemplate={selectedTemplate}
              onTemplateSelect={handleTemplateSelect}
              onTemplateChange={handleTemplateChange}
              onCreateTemplate={handleCreateTemplate}
              className="mb-4"
            />

            {/* Message Content */}
            <div className={`flex-1 flex flex-col ${isMaximized ? 'fixed inset-0 z-50 bg-white p-4' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Message <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  title={isMaximized ? 'Minimize editor' : 'Maximize editor'}
                >
                  {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              </div>
              <div className={`flex-1 ${isMaximized ? 'h-full' : 'border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500'}`}>
                <div className="react-quill-wrapper h-full">
                  <ReactQuill
                    value={draft.content}
                    onChange={(content) => handleInputChange('content', content)}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Type your message here..."
                    style={{ 
                      height: isMaximized ? 'calc(100vh - 120px)' : '300px',
                      border: 'none'
                    }}
                    theme="snow"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4" />
              Save Draft
            </button>
          </div>
          
          {/* Gmail Authentication Status */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <GmailAuthStatus 
              onAuthRequired={() => setShowOAuthModal(true)}
              showDetails={true}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={isLoading || authStatus.isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4" />
              {isLoading 
                ? 'Sending...' 
                : authStatus.isLoading
                  ? 'Checking auth...'
                  : draft.selectedTagId 
                    ? `Send to ${selectedTagContacts.length} Contacts` 
                    : 'Send'
              }
            </button>
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

      {/* Gmail OAuth Manager */}
      <GmailOAuthManager
        isOpen={showOAuthModal}
        onClose={() => setShowOAuthModal(false)}
        onAuthSuccess={handleOAuthSuccess}
        onAuthError={handleOAuthError}
      />
    </div>
  );
};

export default EmailCompose;

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Users, 
  Tag, 
  Phone, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  X,
  Search,
  Filter,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import whatsappService from '../../services/whatsappService';

interface Contact {
  id: string;
  name: string;
  phone?: string;
  mobile?: string;
  email?: string;
  companyName?: string;
  sourceSystem?: string;
}

interface TagType {
  id: string;
  name: string;
  color: string;
  description?: string;
  isActive: boolean;
  contactCount?: number;
}

interface Template {
  id: string;
  name: string;
  content: string;
  fields: string[];
  status: 'active' | 'pending' | 'rejected';
}

interface SendProgress {
  sent: number;
  total: number;
  failed: number;
  pending: number;
}

const WhatsAppBulkMessaging: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  // State management
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [templateFields, setTemplateFields] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState<SendProgress>({ sent: 0, total: 0, failed: 0, pending: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending'>('all');

  // Data states
  const [templates, setTemplates] = useState<Template[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // MyOperator API configuration is now handled by the service

  // Load templates from MyOperator
  useEffect(() => {
    loadTemplates();
  }, []);

  // Load tags
  useEffect(() => {
    loadTags();
  }, []);

  // Load contacts when tags are selected
  useEffect(() => {
    if (selectedTags.size > 0) {
      loadContactsForTags();
    } else {
      setSelectedContacts([]);
    }
  }, [selectedTags]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const templates = await whatsappService.getTemplates();
      setTemplates(templates);
    } catch (error) {
      setError('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const response = await fetch('http://localhost:4002/tags', {
        headers: {
          'x-api-key': 'my-secret-api-key-123'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTags(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const loadContactsForTags = async () => {
    try {
      setIsLoading(true);
      const tagIds = Array.from(selectedTags);
      const response = await fetch(`http://localhost:4002/contacts/by-tags?tagIds=${tagIds.join(',')}`, {
        headers: {
          'x-api-key': 'my-secret-api-key-123'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedContacts(data.data || []);
      }
    } catch (error) {
      setError('Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setTemplateFields({});
    // Initialize template fields
    const initialFields: Record<string, string> = {};
    template.fields.forEach(field => {
      initialFields[field] = '';
    });
    setTemplateFields(initialFields);
  };

  const handleTagToggle = (tagId: string) => {
    const newSelectedTags = new Set(selectedTags);
    if (newSelectedTags.has(tagId)) {
      newSelectedTags.delete(tagId);
    } else {
      newSelectedTags.add(tagId);
    }
    setSelectedTags(newSelectedTags);
  };

  const handleFieldChange = (field: string, value: string) => {
    setTemplateFields(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateMessage = () => {
    if (!selectedTemplate) return '';
    
    let message = selectedTemplate.content;
    Object.entries(templateFields).forEach(([field, value]) => {
      const placeholder = `{{${field}}}`;
      message = message.replace(new RegExp(placeholder, 'g'), value || `[${field}]`);
    });
    return message;
  };

  const sendWhatsAppMessage = async (contact: Contact, message: string) => {
    if (!selectedTemplate) {
      return { success: false, error: 'No template selected' };
    }

    return await whatsappService.sendMessage(
      contact,
      selectedTemplate.name,
      templateFields
    );
  };

  const handleSendMessages = async () => {
    if (!selectedTemplate || selectedContacts.length === 0) {
      setError('Please select a template and contacts');
      return;
    }

    setIsSending(true);
    setIsPaused(false);
    setSendProgress({ sent: 0, total: selectedContacts.length, failed: 0, pending: selectedContacts.length });
    setError('');

    const message = generateMessage();
    setMessage(message);

    try {
      const result = await whatsappService.sendBulkMessages(
        selectedContacts,
        selectedTemplate.name,
        templateFields,
        (progress) => {
          setSendProgress({
            sent: progress.sent,
            failed: progress.failed,
            total: progress.total,
            pending: progress.total - progress.sent - progress.failed
          });
        }
      );

      if (!result.success) {
        setError(result.error || 'Failed to send messages');
      }
    } catch (error) {
      setError('Failed to send messages');
    } finally {
      setIsSending(false);
    }
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleReset = () => {
    setSelectedTemplate(null);
    setSelectedTags(new Set());
    setSelectedContacts([]);
    setTemplateFields({});
    setMessage('');
    setSendProgress({ sent: 0, total: 0, failed: 0, pending: 0 });
    setIsSending(false);
    setIsPaused(false);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageSquare className="h-6 w-6" />
            <h2 className="text-xl font-semibold">WhatsApp Bulk Messaging</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-green-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Template & Tag Selection */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            {/* Template Selection */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Select Template</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {templates.map(template => (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{template.name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        template.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {template.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{template.content}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tag Selection */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Select Tags</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {tags.map(tag => (
                  <div
                    key={tag.id}
                    onClick={() => handleTagToggle(tag.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTags.has(tag.id)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="font-medium text-gray-900">{tag.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">{tag.contactCount || 0} contacts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Template Fields */}
            {selectedTemplate && (
              <div className="p-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Template Fields</h3>
                <div className="space-y-3">
                  {selectedTemplate.fields.map(field => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                      </label>
                      <input
                        type="text"
                        value={templateFields[field] || ''}
                        onChange={(e) => handleFieldChange(field, e.target.value)}
                        placeholder={`Enter ${field}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Message Preview & Sending */}
          <div className="flex-1 flex flex-col">
            {/* Message Preview */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Message Preview</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {generateMessage() || 'Select a template and fill fields to see preview...'}
                  </p>
                </div>
              </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Recipients ({selectedContacts.length})
                </h3>
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedContacts
                  .filter(contact => 
                    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    contact.phone?.includes(searchTerm) ||
                    contact.mobile?.includes(searchTerm)
                  )
                  .map(contact => (
                    <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{contact.name}</p>
                          <p className="text-sm text-gray-500">
                            {contact.phone || contact.mobile || 'No phone number'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {contact.companyName || 'No company'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Progress & Controls */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              {isSending && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Sending Progress</span>
                    <span className="text-sm text-gray-500">
                      {sendProgress.sent + sendProgress.failed} / {sendProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${sendProgress.total > 0 ? ((sendProgress.sent + sendProgress.failed) / sendProgress.total) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-green-600">✓ {sendProgress.sent} sent</span>
                    <span className="text-red-600">✗ {sendProgress.failed} failed</span>
                    <span className="text-yellow-600">⏳ {sendProgress.pending} pending</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  {isSending && (
                    <button
                      onClick={isPaused ? handleResume : handlePause}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        isPaused
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-yellow-600 text-white hover:bg-yellow-700'
                      }`}
                    >
                      {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    </button>
                  )}

                  <button
                    onClick={handleSendMessages}
                    disabled={!selectedTemplate || selectedContacts.length === 0 || isLoading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>
                      {isSending ? 'Sending...' : `Send to ${selectedContacts.length} contacts`}
                    </span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-800">{error}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppBulkMessaging;

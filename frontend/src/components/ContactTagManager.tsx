import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Tag, Plus, X, Search, Users, Check, AlertCircle, UserCheck, UserX } from 'lucide-react';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
  isActive: boolean;
  contactCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Contact {
  id: string;
  name: string;
  companyName?: string;
  email?: string;
  mobileE164?: string;
  relationshipType?: string;
  sourceSystem?: string;
}

// =============================================================================
// CONTACT TAG MANAGER COMPONENT
// =============================================================================

const ContactTagManager: React.FC = () => {
  // State management
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [newTag, setNewTag] = useState({ name: '', color: '#3B82F6', description: '' });

  // API configuration
  const API_BASE = 'http://localhost:4002';
  const api = axios.create({
    baseURL: API_BASE,
    headers: {
      'X-API-Key': 'my-secret-api-key-123',
      'Content-Type': 'application/json'
    }
  });

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    console.log('🔄 ContactTagManager: useEffect triggered');
    fetchContacts();
    fetchTags();
  }, []);

  // =============================================================================
  // API FUNCTIONS
  // =============================================================================

  const fetchContacts = async () => {
    try {
      setLoading(true);
      // Fetch contacts in batches since backend has a limit of 100
      let allContacts: Contact[] = [];
      let page = 1;
      const limit = 100;
      
      while (true) {
        const response = await api.get(`/contacts?page=${page}&limit=${limit}`);
        const contactsData = response.data?.data || [];
        
        if (!Array.isArray(contactsData) || contactsData.length === 0) {
          break; // No more contacts
        }
        
        allContacts = [...allContacts, ...contactsData];
        
        // If we got less than the limit, we've reached the end
        if (contactsData.length < limit) {
          break;
        }
        
        page++;
      }
      
      setContacts(allContacts);
      console.log(`✅ Fetched ${allContacts.length} contacts`);
      console.log('📱 Sample contact:', allContacts[0]);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setMessage({ type: 'error', text: 'Failed to fetch contacts' });
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await api.get('/tags');
      setTags(response.data || []);
    } catch (err) {
      console.error('Error fetching tags:', err);
      setMessage({ type: 'error', text: 'Failed to fetch tags' });
    }
  };

  const createTag = async () => {
    try {
      setLoading(true);
      const response = await api.post('/tags', newTag);
      const createdTag = response.data;
      setTags(prev => [...prev, createdTag]);
      setNewTag({ name: '', color: '#3B82F6', description: '' });
      setShowCreateTag(false);
      setMessage({ type: 'success', text: `Tag "${createdTag.name}" created successfully!` });
      
      // Auto-select the new tag
      setSelectedTag(createdTag);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to create tag';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const applyTagToContacts = async () => {
    if (!selectedTag || selectedContacts.length === 0) {
      setMessage({ type: 'error', text: 'Please select a tag and contacts first' });
      return;
    }

    try {
      setLoading(true);
      let successCount = 0;
      let errorCount = 0;

      for (const contactId of Array.from(selectedContacts)) {
        try {
          await api.post(`/tags/contacts/${contactId}/tags/${selectedTag.id}`);
          successCount++;
        } catch (err: any) {
          if (err.response?.status === 409) {
            // Tag already applied
            successCount++;
          } else {
            errorCount++;
          }
        }
      }

      if (successCount > 0) {
        setMessage({ 
          type: 'success', 
          text: `Tag "${selectedTag.name}" applied to ${successCount} contact(s) successfully!` 
        });
        // Refresh tags to update contact counts
        fetchTags();
        // Clear selection
        setSelectedContacts([]);
      }

      if (errorCount > 0) {
        setMessage({ 
          type: 'error', 
          text: `Failed to apply tag to ${errorCount} contact(s)` 
        });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to apply tags' });
    } finally {
      setLoading(false);
    }
  };

  const removeTagFromContacts = async () => {
    if (!selectedTag || selectedContacts.length === 0) {
      setMessage({ type: 'error', text: 'Please select a tag and contacts first' });
      return;
    }

    try {
      setLoading(true);
      let successCount = 0;

      for (const contactId of Array.from(selectedContacts)) {
        try {
          await api.delete(`/tags/contacts/${contactId}/tags/${selectedTag.id}`);
          successCount++;
        } catch (err) {
          // Ignore errors for tag removal
        }
      }

      if (successCount > 0) {
        setMessage({ 
          type: 'success', 
          text: `Tag "${selectedTag.name}" removed from ${successCount} contact(s) successfully!` 
        });
        // Refresh tags to update contact counts
        fetchTags();
        // Clear selection
        setSelectedContacts([]);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to remove tags' });
    } finally {
      setLoading(false);
    }
  };

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  const selectAllContacts = () => {
    if (Array.isArray(contacts)) {
      setSelectedContacts(contacts.map(c => c.id));
    }
  };

  const clearSelection = () => {
    setSelectedContacts([]);
  };

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (contact.mobileE164 && contact.mobileE164.includes(searchTerm))
  );

  // Debug logging
  console.log('🔄 ContactTagManager render:', {
    contactsCount: contacts.length,
    filteredCount: filteredContacts.length,
    selectedCount: selectedContacts.length,
    tagsCount: tags.length,
    selectedTag: selectedTag?.name
  });

  // =============================================================================
  // RENDER FUNCTIONS
  // =============================================================================

  const renderMessage = () => {
    if (!message) return null;
    
    const Icon = message.type === 'success' ? Check : AlertCircle;
    const bgColor = message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
    const textColor = message.type === 'success' ? 'text-green-800' : 'text-red-800';
    const iconColor = message.type === 'success' ? 'text-green-500' : 'text-red-500';

    return (
      <div className={`p-4 rounded-lg border ${bgColor} mb-6 flex items-center gap-3`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <span className={textColor}>{message.text}</span>
        <button
          onClick={() => setMessage(null)}
          className="ml-auto text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const renderCreateTagModal = () => {
    if (!showCreateTag) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">Create New Tag</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tag Name *
              </label>
              <input
                type="text"
                value={newTag.name}
                onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter tag name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                type="color"
                value={newTag.color}
                onChange={(e) => setNewTag(prev => ({ ...prev, color: e.target.value }))}
                className="w-full h-10 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newTag.description}
                onChange={(e) => setNewTag(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter description (optional)"
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowCreateTag(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={createTag}
              disabled={!newTag.name.trim() || loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Tag'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      {/* Debug Section */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">🐛 Debug Info</h3>
        <div className="text-sm text-yellow-700 space-y-1">
          <div>📱 Contacts loaded: {contacts.length}</div>
          <div>🏷️ Tags loaded: {tags.length}</div>
          <div>🔍 Filtered contacts: {filteredContacts.length}</div>
          <div>✅ Selected contacts: {selectedContacts.length}</div>
          <div>🏷️ Selected tag: {selectedTag?.name || 'None'}</div>
          <div>⏳ Loading: {loading ? 'Yes' : 'No'}</div>
        </div>
        <div className="mt-2 text-xs text-yellow-600">
          Check browser console for detailed logs
        </div>
        <div className="mt-2">
          <button
            onClick={() => {
              console.log('🧪 Test button clicked');
              console.log('Current state:', { contacts, tags, selectedContacts, selectedTag, loading });
            }}
            className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
          >
            Test Component
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            🏷️ Contact Tag Manager
          </h2>
          <p className="text-gray-600 mt-1">
            Select contacts and apply tags to organize them efficiently
          </p>
        </div>
        <button
          onClick={() => setShowCreateTag(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create New Tag
        </button>
      </div>

      {/* Message Display */}
      {renderMessage()}

      {/* Tags Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Available Tags</h3>
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <button
              key={tag.id}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                selectedTag?.id === tag.id
                  ? 'ring-2 ring-offset-2 ring-blue-500 shadow-lg'
                  : 'hover:shadow-md'
              }`}
              style={{ backgroundColor: tag.color, color: '#fff' }}
            >
              {tag.name} ({tag.contactCount})
            </button>
          ))}
        </div>
      </div>

      {/* Selected Tag Info */}
      {selectedTag && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedTag.color }}
              />
              <span className="font-semibold text-blue-800">
                Selected Tag: {selectedTag.name}
              </span>
              <span className="text-blue-600">
                ({selectedTag.contactCount} contacts)
              </span>
            </div>
            <button
              onClick={() => setSelectedTag(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Contacts Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Contacts</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={selectAllContacts}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Select All
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Contacts List */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                {selectedContacts.length} of {filteredContacts.length} contacts selected
              </span>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Loading contacts...
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                No contacts found
              </div>
            ) : (
              filteredContacts.map(contact => (
                <div
                  key={contact.id}
                  className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
                    selectedContacts.includes(contact.id) ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{contact.name}</div>
                      <div className="text-sm text-gray-500">
                        {contact.email && `${contact.email} • `}
                        {contact.mobileE164 && `${contact.mobileE164} • `}
                        {contact.sourceSystem || 'Unknown source'}
                      </div>
                    </div>
                    
                    {/* Selection Button - Much more visible than checkboxes */}
                    <button
                      onClick={() => toggleContactSelection(contact.id)}
                      className={`ml-4 px-3 py-1 rounded-md text-sm font-medium transition-all ${
                        selectedContacts.includes(contact.id)
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {selectedContacts.includes(contact.id) ? (
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-4 h-4" />
                          Selected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <UserX className="w-4 h-4" />
                          Select
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {selectedTag && selectedContacts.length > 0 && (
        <div className="flex gap-3">
          <button
            onClick={applyTagToContacts}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Tag className="w-4 h-4" />
            {loading ? 'Applying...' : `Apply "${selectedTag.name}" to ${selectedContacts.length} contact(s)`}
          </button>
          <button
            onClick={removeTagFromContacts}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            {loading ? 'Removing...' : `Remove "${selectedTag.name}" from ${selectedContacts.length} contact(s)`}
          </button>
        </div>
      )}

      {/* Create Tag Modal */}
      {renderCreateTagModal()}
    </div>
  );
};

export default ContactTagManager;

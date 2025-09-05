// @ts-nocheck - Frontend React component - not for backend compilation
// This file contains React JSX code and should only be compiled in a frontend context
// It is excluded from backend TypeScript compilation via tsconfig.json

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { TagDeleteConfirmationModal } from './TagDeleteConfirmationModal';

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
  companyName: string;
  email?: string;
  mobileE164?: string;
  relationshipType?: string;
}

interface CreateTagData {
  name: string;
  color: string;
  description?: string;
}

interface UpdateTagData {
  name?: string;
  color?: string;
  description?: string;
  isActive?: boolean;
}

// =============================================================================
// TAG MANAGEMENT COMPONENT
// =============================================================================

export const TagManagement: React.FC = () => {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  const [tags, setTags] = useState<Tag[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Tag creation/editing
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newTag, setNewTag] = useState<CreateTagData>({
    name: '',
    color: '#3B82F6',
    description: ''
  });
  
  // Search and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [contactsWithTag, setContactsWithTag] = useState<Contact[]>([]);
  
  // Bulk operations
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showBulkTagModal, setShowBulkTagModal] = useState(false);
  const [bulkTagId, setBulkTagId] = useState<string>('');
  
  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // =============================================================================
  // API CONFIGURATION
  // =============================================================================
  const API_BASE = 'http://localhost:4002';
  const JWT_TOKEN = localStorage.getItem('jwt_token'); // You'll need to set this

  const api = axios.create({
    baseURL: API_BASE,
    headers: {
      'X-API-Key': 'my-secret-api-key-123',
      'Content-Type': 'application/json'
    }
  });

  // =============================================================================
  // DATA FETCHING
  // =============================================================================
  
  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tags');
      setTags(response.data);
    } catch (err) {
      setError('Failed to fetch tags');
      console.error('Error fetching tags:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await api.get('/contacts?page=1&limit=1000');
      // Handle the API response structure
      const contactsData = response.data?.data || response.data || [];
      setContacts(Array.isArray(contactsData) ? contactsData : []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setContacts([]);
    }
  };

  const fetchContactsByTag = async (tagId: string) => {
    try {
      const response = await api.get(`/tags/${tagId}/contacts`);
      setContactsWithTag(response.data);
    } catch (err) {
      console.error('Error fetching contacts by tag:', err);
    }
  };

  useEffect(() => {
    fetchTags();
    fetchContacts();
  }, []);

  // =============================================================================
  // TAG OPERATIONS
  // =============================================================================

  const createTag = async () => {
    try {
      setLoading(true);
      await api.post('/tags', newTag);
      setShowCreateModal(false);
      setNewTag({ name: '', color: '#3B82F6', description: '' });
      fetchTags();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create tag');
    } finally {
      setLoading(false);
    }
  };

  const updateTag = async () => {
    if (!editingTag) return;
    
    try {
      setLoading(true);
      await api.put(`/tags/${editingTag.id}`, editingTag);
      setShowEditModal(false);
      setEditingTag(null);
      fetchTags();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update tag');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (tag: Tag) => {
    setTagToDelete(tag);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!tagToDelete) return;
    
    try {
      setDeleteLoading(true);
      await api.delete(`/tags/${tagToDelete.id}`);
      fetchTags();
      setError(null);
      setShowDeleteModal(false);
      setTagToDelete(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete tag';
      
      // Extract contact count from error message
      const contactCountMatch = errorMessage.match(/(\d+)\s+contact\(s\)/);
      const contactCount = contactCountMatch ? parseInt(contactCountMatch[1]) : 0;
      
      // Update the tag with the correct contact count
      setTagToDelete(prev => prev ? { ...prev, contactCount } : null);
      
      setError(errorMessage);
      // Don't close the modal, let it show the updated count
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setTagToDelete(null);
  };

  const toggleTagStatus = async (tag: Tag) => {
    try {
      await api.put(`/tags/${tag.id}`, { isActive: !tag.isActive });
      fetchTags();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update tag status');
    }
  };

  // =============================================================================
  // BULK OPERATIONS
  // =============================================================================

  const addTagToMultipleContacts = async () => {
    if (!bulkTagId || selectedContacts.length === 0) return;
    
    try {
      setLoading(true);
      await api.post(`/tags/${bulkTagId}/contacts`, {
        contactIds: selectedContacts
      });
      setShowBulkTagModal(false);
      setSelectedContacts([]);
      setBulkTagId('');
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add tag to contacts');
    } finally {
      setLoading(false);
    }
  };

  const removeTagFromMultipleContacts = async (tagId: string) => {
    if (selectedContacts.length === 0) return;
    
    try {
      setLoading(true);
      await api.delete(`/tags/${tagId}/contacts`, {
        data: { contactIds: selectedContacts }
      });
      setSelectedContacts([]);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove tag from contacts');
    } finally {
      setLoading(false);
    }
  };

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContactSelection = (contactId: string) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const selectAllContacts = () => {
    if (Array.isArray(contacts)) {
      setSelectedContacts(contacts.map(c => c.id));
    }
  };

  const clearSelection = () => {
    setSelectedContacts([]);
  };

  // =============================================================================
  // RENDER FUNCTIONS
  // =============================================================================

  const renderTagCard = (tag: Tag) => (
    <div
      key={tag.id}
      className="bg-white rounded-lg shadow-md p-4 border-l-4"
      style={{ borderLeftColor: tag.color }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: tag.color }}
          />
          <h3 className="font-semibold text-gray-800">{tag.name}</h3>
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
            {tag.contactCount} contacts
          </span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => toggleTagStatus(tag)}
            className={`px-3 py-1 rounded text-xs font-medium ${
              tag.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {tag.isActive ? 'Active' : 'Inactive'}
          </button>
          <button
            onClick={() => {
              setEditingTag(tag);
              setShowEditModal(true);
            }}
            className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-xs font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => handleDeleteClick(tag)}
            className="bg-red-100 text-red-800 px-3 py-1 rounded text-xs font-medium"
          >
            Delete
          </button>
        </div>
      </div>
      
      {tag.description && (
        <p className="text-gray-600 text-sm mb-3">{tag.description}</p>
      )}
      
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>Created: {new Date(tag.createdAt).toLocaleDateString()}</span>
        <button
          onClick={() => {
            setSelectedTag(tag);
            fetchContactsByTag(tag.id);
          }}
          className="text-blue-600 hover:text-blue-800"
        >
          View Contacts
        </button>
      </div>
    </div>
  );

  const renderCreateTagModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-bold mb-4">Create New Tag</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tag Name *
            </label>
            <input
              type="text"
              value={newTag.name}
              onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
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
              onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
              className="w-full h-10 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={newTag.description}
              onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter tag description"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => setShowCreateModal(false)}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={createTag}
            disabled={!newTag.name.trim() || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Tag'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderEditTagModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-bold mb-4">Edit Tag</h2>
        
        {editingTag && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tag Name *
              </label>
              <input
                type="text"
                value={editingTag.name}
                onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                type="color"
                value={editingTag.color}
                onChange={(e) => setEditingTag({ ...editingTag, color: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={editingTag.description || ''}
                onChange={(e) => setEditingTag({ ...editingTag, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
          </div>
        )}
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => {
              setShowEditModal(false);
              setEditingTag(null);
            }}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={updateTag}
            disabled={!editingTag?.name.trim() || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Tag'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderBulkTagModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-bold mb-4">Add Tag to Multiple Contacts</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Tag
            </label>
            <select
              value={bulkTagId}
              onChange={(e) => setBulkTagId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a tag...</option>
              {tags.map(tag => (
                <option key={tag.id} value={tag.id}>
                  {tag.name} ({tag.contactCount} contacts)
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selected Contacts: {selectedContacts.length}
            </label>
            <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
              {contacts
                .filter(c => selectedContacts.includes(c.id))
                .map(contact => (
                  <div key={contact.id} className="text-sm text-gray-600 py-1">
                    {contact.name} - {contact.companyName}
                  </div>
                ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => setShowBulkTagModal(false)}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={addTagToMultipleContacts}
            disabled={!bulkTagId || selectedContacts.length === 0 || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Tag'}
          </button>
        </div>
      </div>
    </div>
  );

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tag History</h1>
              <p className="text-gray-600 mt-2">
                Organize your contacts with custom tags for better categorization and management
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Create New Tag
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Search and Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={selectAllContacts}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Select All Contacts
              </button>
              <button
                onClick={clearSelection}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear Selection
              </button>
              <button
                onClick={() => setShowBulkTagModal(true)}
                disabled={selectedContacts.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Add Tag to Selected ({selectedContacts.length})
              </button>
            </div>
          </div>
          
          {selectedContacts.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800 text-sm">
                {selectedContacts.length} contacts selected. 
                {selectedTag && (
                  <span>
                    {' '}Click "Remove Tag" below to remove "{selectedTag.name}" from selected contacts.
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Tags Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading tags...</p>
            </div>
          ) : filteredTags.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600">No tags found. Create your first tag to get started!</p>
            </div>
          ) : (
            filteredTags.map(renderTagCard)
          )}
        </div>

        {/* Contacts with Selected Tag */}
        {selectedTag && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Contacts with Tag: {selectedTag.name}
              </h2>
              <button
                onClick={() => setSelectedTag(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            {contactsWithTag.length === 0 ? (
              <p className="text-gray-600">No contacts have this tag yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedContacts.length === contactsWithTag.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedContacts(contactsWithTag.map(c => c.id));
                            } else {
                              setSelectedContacts([]);
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contactsWithTag.map(contact => (
                      <tr key={contact.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedContacts.includes(contact.id)}
                            onChange={() => handleContactSelection(contact.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {contact.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {contact.companyName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {contact.email || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {contact.mobileE164 || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {selectedContacts.length > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => removeTagFromMultipleContacts(selectedTag.id)}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Removing...' : `Remove "${selectedTag.name}" from Selected (${selectedContacts.length})`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && renderCreateTagModal()}
      {showEditModal && renderEditTagModal()}
      {showBulkTagModal && renderBulkTagModal()}
      
      {/* Delete Confirmation Modal */}
      <TagDeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        tagName={tagToDelete?.name || ''}
        contactCount={tagToDelete?.contactCount || 0}
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default TagManagement;

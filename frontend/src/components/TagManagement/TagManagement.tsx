import React, { useState, useEffect } from 'react';
import { Plus, Tag, Edit, Trash2, Users, Search, Phone, Mail, Building2, Calendar } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  mobileE164?: string;
  sourceSystem?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt?: string;
  contactCount?: number;
}

const TagManagement: React.FC = () => {
  // Tag management state
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [newTagDescription, setNewTagDescription] = useState('');
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [isDeletingTag, setIsDeletingTag] = useState(false);

  // Contact viewing state
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [tagContacts, setTagContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const API_BASE = 'http://localhost:4002';
  const API_KEY = '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN';

  // Load tags on component mount
  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const response = await fetch(`${API_BASE}/tags`, {
        headers: {
          'X-API-Key': API_KEY,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const tagsData = await response.json();
        setTags(tagsData);
      } else {
        console.error('Failed to load tags:', response.status);
      }
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const createNewTag = async () => {
    if (!newTagName.trim()) {
      alert('❌ Please enter a tag name');
      return;
    }

    try {
      setIsCreatingTag(true);
      
      const newTag = {
        name: newTagName.trim(),
        color: newTagColor,
        description: newTagDescription.trim()
      };

      const response = await fetch(`${API_BASE}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify(newTag)
      });

      if (response.ok) {
        const createdTag = await response.json();
        setTags([...tags, createdTag]);
        setNewTagName('');
        setNewTagColor('#3B82F6');
        setNewTagDescription('');
        alert('✅ Tag created successfully!');
      } else {
        const error = await response.text();
        alert(`❌ Failed to create tag: ${error}`);
      }
    } catch (error) {
      console.error('❌ Error creating tag:', error);
      alert(`❌ Error creating tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingTag(false);
    }
  };

  const editTag = (tag: Tag) => {
    setEditingTag(tag);
    setNewTagName(tag.name);
    setNewTagColor(tag.color);
    setNewTagDescription(tag.description || '');
  };

  const updateTag = async () => {
    if (!editingTag || !newTagName.trim()) {
      alert('❌ Please enter a tag name');
      return;
    }

    try {
      setIsCreatingTag(true);
      
      const updatedTag = {
        name: newTagName.trim(),
        color: newTagColor,
        description: newTagDescription.trim()
      };

      const response = await fetch(`${API_BASE}/tags/${editingTag.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify(updatedTag)
      });

      if (response.ok) {
        const updatedTagData = await response.json();
        setTags(tags.map(t => t.id === editingTag.id ? updatedTagData : t));
        setEditingTag(null);
        setNewTagName('');
        setNewTagColor('#3B82F6');
        setNewTagDescription('');
        alert('✅ Tag updated successfully!');
      } else {
        const error = await response.text();
        alert(`❌ Failed to update tag: ${error}`);
      }
    } catch (error) {
      console.error('❌ Error updating tag:', error);
      alert(`❌ Error updating tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingTag(false);
    }
  };

  const deleteTag = async (tagId: string) => {
    if (!window.confirm('❌ Are you sure you want to delete this tag? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeletingTag(true);
      
      const response = await fetch(`${API_BASE}/tags/${tagId}`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': API_KEY
        }
      });

      if (response.ok) {
        setTags(tags.filter(t => t.id !== tagId));
        if (selectedTag?.id === tagId) {
          setSelectedTag(null);
          setTagContacts([]);
        }
        alert('✅ Tag deleted successfully!');
      } else {
        const error = await response.text();
        alert(`❌ Failed to delete tag: ${error}`);
      }
    } catch (error) {
      console.error('❌ Error deleting tag:', error);
      alert(`❌ Error deleting tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeletingTag(false);
    }
  };

  const cancelEdit = () => {
    setEditingTag(null);
    setNewTagName('');
    setNewTagColor('#3B82F6');
    setNewTagDescription('');
  };

  const viewTagContacts = async (tag: Tag) => {
    try {
      setSelectedTag(tag);
      setIsLoadingContacts(true);
      
      const response = await fetch(`${API_BASE}/tags/${tag.id}/contacts`, {
        headers: {
          'X-API-Key': API_KEY,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const contacts = await response.json();
        setTagContacts(contacts);
      } else {
        const error = await response.text();
        console.error('Error fetching tag contacts:', response.status, error);
        alert(`Failed to fetch contacts for tag ${tag.name}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error in viewTagContacts:', error);
      alert(`Error viewing tag contacts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const filteredContacts = tagContacts.filter(contact =>
    contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone?.includes(searchTerm) ||
    contact.mobileE164?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Tag className="h-8 w-8 mr-3 text-blue-600" />
            Tag Management
          </h1>
          <p className="mt-2 text-gray-600">
            Create, organize, and manage tags for your contacts. View all clients within each tag.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Tag Management */}
          <div className="lg:col-span-1 space-y-6">
            {/* Create/Edit Tag Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {editingTag ? 'Edit Tag' : 'Create New Tag'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tag Name *
                  </label>
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="e.g., VIP Customers, New Leads"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tag Color *
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                    <span className="text-sm text-gray-500">{newTagColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={newTagDescription}
                    onChange={(e) => setNewTagDescription(e.target.value)}
                    placeholder="Brief description for the tag"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={editingTag ? updateTag : createNewTag}
                    disabled={!newTagName || isCreatingTag}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isCreatingTag ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    <span>{editingTag ? 'Update Tag' : 'Create Tag'}</span>
                  </button>
                  
                  {editingTag && (
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Existing Tags */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Tags</h2>
              
              <div className="space-y-3">
                {tags.length === 0 ? (
                  <div className="text-center py-8">
                    <Tag className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No tags created yet</p>
                    <p className="text-sm text-gray-400">Create your first tag to get started</p>
                  </div>
                ) : (
                  tags.map((tag) => (
                    <div
                      key={tag.id}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        selectedTag?.id === tag.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => viewTagContacts(tag)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full shadow-sm" 
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="font-medium text-gray-900">{tag.name}</span>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              editTag(tag);
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 p-1 rounded transition-colors"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTag(tag.id);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-100 p-1 rounded transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      {tag.description && (
                        <p className="text-sm text-gray-500 mt-1">{tag.description}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Contact Display */}
          <div className="lg:col-span-2">
            {selectedTag ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* Tag Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-full shadow-sm" 
                      style={{ backgroundColor: selectedTag.color }}
                    />
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedTag.name}</h2>
                      {selectedTag.description && (
                        <p className="text-sm text-gray-600">{selectedTag.description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTag(null);
                      setTagContacts([]);
                    }}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-md transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search contacts by name, company, phone, or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Contacts List */}
                <div className="space-y-3">
                  {isLoadingContacts ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Loading contacts...</p>
                    </div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">
                        {searchTerm ? 'No contacts match your search' : 'No contacts in this tag'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm text-gray-600 mb-3">
                        {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''} found
                      </div>
                      {filteredContacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-medium text-gray-900">{contact.name}</h3>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  contact.sourceSystem === 'GMAIL' ? 'bg-blue-100 text-blue-800' :
                                  contact.sourceSystem === 'ZOHO' ? 'bg-purple-100 text-purple-800' :
                                  contact.sourceSystem === 'INVOICE' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {contact.sourceSystem || 'MANUAL'}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                {contact.companyName && (
                                  <div className="flex items-center space-x-2">
                                    <Building2 className="h-4 w-4" />
                                    <span>{contact.companyName}</span>
                                  </div>
                                )}
                                
                                {contact.email && (
                                  <div className="flex items-center space-x-2">
                                    <Mail className="h-4 w-4" />
                                    <span>{contact.email}</span>
                                  </div>
                                )}
                                
                                {(contact.phone || contact.mobileE164) && (
                                  <div className="flex items-center space-x-2">
                                    <Phone className="h-4 w-4" />
                                    <span>{contact.phone || contact.mobileE164}</span>
                                  </div>
                                )}
                                
                                {contact.createdAt && (
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>{new Date(contact.createdAt).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center py-12">
                  <Tag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Tag</h3>
                  <p className="text-gray-500">
                    Click on any tag from the left panel to view its contacts
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagManagement;

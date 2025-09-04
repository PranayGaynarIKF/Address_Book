import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { 
  Plus, 
  Search, 
  Filter, 
  X, 
  Edit, 
  Trash2, 
  Tag,
  ChevronDown,
  Users,
  FileText,
  Eye,
  MoreVertical,
  Mail,
  Phone,
  Building,
  MessageSquare,
  List,
  Grid3X3
} from 'lucide-react';
import { contactsAPI } from '../services/api';
import { ContactResponseDto, CreateContactDto } from '../types';
import ContactModal from '../components/ContactModal';
import { TagDemo } from '../components/TagDemo';
import WhatsAppButton from '../components/WhatsApp/WhatsAppButton';
import ContactList from '../components/ContactList/ContactList';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

// Add custom styles for WhatsApp button
const whatsappButtonStyles = `
  .whatsapp-button-container {
    pointer-events: auto !important;
    cursor: pointer !important;
    position: relative !important;
    z-index: 10 !important;
  }
  
  .whatsapp-button-container:hover {
    transform: scale(1.05) !important;
  }
  
  .whatsapp-button-container button {
    pointer-events: auto !important;
    cursor: pointer !important;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = whatsappButtonStyles;
  document.head.appendChild(styleElement);
}

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

// =============================================================================
// CONTACTS COMPONENT
// =============================================================================

const Contacts: React.FC = () => {
  // API Configuration
  const API_BASE = 'http://localhost:4002';
  const API_KEY = '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN';
  
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactResponseDto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSourceSystem, setSelectedSourceSystem] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // Tag management state
  const [tags, setTags] = useState<Tag[]>([]);
  const [contactTags, setContactTags] = useState<Record<string, Tag[]>>({});
  const [tagDropdownOpen, setTagDropdownOpen] = useState<Record<string, boolean>>({});
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [bulkTagDropdownOpen, setBulkTagDropdownOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [bulkTagSearchTerm, setBulkTagSearchTerm] = useState('');
  const [contactTagSearchTerm, setContactTagSearchTerm] = useState('');
  const [isRemovingAllTags, setIsRemovingAllTags] = useState(false);

  const [loadingContactTags, setLoadingContactTags] = useState<Record<string, boolean>>({});
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagsError, setTagsError] = useState<Error | null>(null);
  
  // View mode state - grid (default) or list
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Manual search function
  const handleSearch = () => {
    setDebouncedSearchTerm(searchTerm);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Clear search function
  const handleClearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setCurrentPage(1);
  };

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedFilter, selectedSourceSystem]);

  // Load tags on component mount
  useEffect(() => {
    loadTags();
    // Test backend connectivity
    testBackendConnectivity();
  }, []);

  const testBackendConnectivity = async () => {
    try {
      console.log('🔍 Testing backend connectivity...');
      const response = await fetch(`${API_BASE}/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('🔍 Backend connectivity test:', {
        status: response.status,
        ok: response.ok,
        url: response.url
      });
    } catch (error) {
      console.error('🔍 Backend connectivity test failed:', error);
    }
  };

  const loadTags = async () => {
    try {
      setTagsLoading(true);
      setTagsError(null);
      console.log('🔄 Loading tags...');
      
      const response = await fetch(`${API_BASE}/tags`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const tagsData = await response.json();
      console.log('✅ Tags loaded:', tagsData.length);
      setTags(tagsData);
    } catch (error) {
      console.error('❌ Error loading tags:', error);
      setTagsError(error as Error);
    } finally {
      setTagsLoading(false);
    }
  };

  const fetchContactTags = async (contactId: string): Promise<Tag[]> => {
    try {
      const response = await fetch(`${API_BASE}/tags/contacts/${contactId}/tags`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`Error fetching tags for contact ${contactId}:`, error);
      return [];
    }
  };

  const applyTagToContact = async (contactId: string, tagId: string) => {
    try {
      console.log('🔍 Applying individual tag:', { contactId, tagId, API_BASE });
      
      const response = await fetch(`${API_BASE}/tags/contacts/${contactId}/tags/${tagId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('🔍 Individual tag API response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 Individual tag API error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}: ${errorText}`);
      }
      
      const contactTagsForContact = await fetchContactTags(contactId);
      setContactTags(prev => ({
        ...prev,
        [contactId]: contactTagsForContact
      }));
      
      console.log(`✅ Tag applied to contact ${contactId}`);
    } catch (error) {
      console.error(`❌ Error applying tag to contact ${contactId}:`, error);
      throw error;
    }
  };

  const removeTagFromContact = async (contactId: string, tagId: string) => {
    try {
      const response = await fetch(`${API_BASE}/tags/contacts/${contactId}/tags/${tagId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contactTagsForContact = await fetchContactTags(contactId);
      setContactTags(prev => ({
        ...prev,
        [contactId]: contactTagsForContact
      }));
      
      console.log(`✅ Tag removed from contact ${contactId}`);
    } catch (error) {
      console.error(`❌ Error removing tag from contact ${contactId}:`, error);
      throw error;
    }
  };

  const createNewTag = async () => {
    if (!newTagName.trim()) return;
    
    try {
      setIsCreatingTag(true);
      console.log('🔄 Creating new tag:', newTagName);
      
      const response = await fetch(`${API_BASE}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: newTagColor,
          description: `Tag created for ${newTagName.trim()}`,
          isActive: true
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const newTag = await response.json();
      setTags(prev => [...prev, newTag]);
      setNewTagName('');
      console.log('✅ New tag created:', newTag);
    } catch (error) {
      console.error('❌ Error creating tag:', error);
    } finally {
      setIsCreatingTag(false);
    }
  };

  const applyTagToMultipleContacts = async (tagId: string) => {
    console.log('🚀 ===== STARTING TAG APPLICATION =====');
    console.log('🚀 applyTagToMultipleContacts function called with tagId:', tagId);
    console.log('🚀 selectedContacts.size at function start:', selectedContacts.size);
    console.log('🚀 selectedContacts at function start:', Array.from(selectedContacts));
    console.log('🚀 API_BASE:', API_BASE);
    console.log('🚀 Current contactTags state:', contactTags);
    
    if (selectedContacts.size === 0) {
      console.log('🚀 No contacts selected, showing alert');
      alert('Please select at least one contact to apply tags.');
      return;
    }
    
    console.log('🚀 Proceeding with tag application...');
    
    try {
      // Use the bulk endpoint instead of individual calls
      const requestBody = { contactIds: Array.from(selectedContacts) };
      const requestUrl = `${API_BASE}/tags/${tagId}/contacts`;
      
      console.log('🚀 Applying tag to multiple contacts:', {
        tagId,
        selectedContacts: Array.from(selectedContacts),
        requestUrl,
        requestBody,
        API_BASE
      });
      
      console.log('🚀 Making API call to:', requestUrl);
      console.log('🚀 Request body:', JSON.stringify(requestBody));
      
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': '*/*'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('🚀 API Response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url
      });
      
      // Log the response body before parsing
      const responseText = await response.text();
      console.log('🚀 Raw API Response Body:', responseText);
      
      if (!response.ok) {
        console.error('🚀 API Error Response:', responseText);
        console.error('🚀 Full error details:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          body: responseText
        });
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }
      
      const result = JSON.parse(responseText);
      console.log('🚀 ===== API RESPONSE RECEIVED =====');
      console.log('🚀 API Success Response:', result);
      console.log('🚀 Response success:', result.success);
      console.log('🚀 Response count:', result.count);
      
      // Find the tag that was applied
      const appliedTag = tags.find(tag => tag.id === tagId);
      console.log('🚀 Applied tag found:', appliedTag);
      console.log('🚀 Available tags:', tags);
      
      if (appliedTag) {
        console.log('🚀 ===== UPDATING LOCAL STATE =====');
        // Update local state for all selected contacts
        setContactTags(prev => {
          const updated = { ...prev };
          console.log('🚀 Before update - contactTags state:', prev);
          console.log('🚀 Selected contacts to update:', Array.from(selectedContacts));
          console.log('🚀 Applied tag to add:', appliedTag);
          
          selectedContacts.forEach(contactId => {
            console.log(`🚀 Processing contact ${contactId}:`);
            if (!updated[contactId]) {
              updated[contactId] = [];
              console.log(`🚀 Initialized empty tags array for contact ${contactId}`);
            }
            // Check if tag is already applied to avoid duplicates
            if (!updated[contactId].some(tag => tag.id === tagId)) {
              updated[contactId] = [...updated[contactId], appliedTag];
              console.log(`🚀 ✅ Added tag ${appliedTag.name} to contact ${contactId}. New tags:`, updated[contactId]);
            } else {
              console.log(`🚀 ⚠️ Tag ${appliedTag.name} already exists for contact ${contactId}`);
            }
          });
          console.log('🚀 After update - contactTags state:', updated);
          return updated;
        });
      } else {
        console.log('🚀 ❌ Applied tag not found in tags array!');
      }
      
      // Show success message
      if (result.count > 0) {
        alert(`✅ Successfully applied tag to ${result.count} contacts!`);
      } else {
        alert(`ℹ️ All selected contacts already have this tag applied.`);
      }
      
      // Close the dropdown
      setBulkTagDropdownOpen(false);
      
      // Refresh the contacts data to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      
      // Refresh contact tags for all selected contacts
      console.log('🚀 ===== REFRESHING CONTACT TAGS =====');
      console.log('🔄 Refreshing contact tags for selected contacts...');
      console.log('🔄 Selected contacts to refresh:', Array.from(selectedContacts));
      const refreshPromises = Array.from(selectedContacts).map(async (contactId) => {
        try {
          console.log(`🔄 Fetching tags for contact ${contactId}...`);
          const tags = await fetchContactTags(contactId);
          console.log(`🔄 Fetched tags for contact ${contactId}:`, tags);
          setContactTags(prev => {
            const updated = {
              ...prev,
              [contactId]: tags
            };
            console.log(`🔄 Updated contactTags state for ${contactId}:`, updated[contactId]);
            return updated;
          });
          console.log(`✅ Refreshed tags for contact ${contactId}:`, tags);
        } catch (error) {
          console.error(`❌ Error refreshing tags for contact ${contactId}:`, error);
        }
      });
      
      await Promise.allSettled(refreshPromises);
      console.log('✅ Contact tags refresh completed');
      
    } catch (error: any) {
      console.log('🚀 ===== ERROR OCCURRED =====');
      console.error('❌ Error applying tag to multiple contacts:', error);
      console.error('❌ Full error object:', error);
      console.error('❌ Error stack:', error?.stack);
      console.error('❌ Error name:', error?.name);
      alert(`Failed to apply tag: ${error?.message || 'Unknown error occurred'}`);
    }
    
    console.log('🚀 ===== TAG APPLICATION COMPLETED =====');
  };

  const removeTagFromMultipleContacts = async (tagId: string, skipConfirmation = false) => {
    if (selectedContacts.size === 0) return;
    
    if (!skipConfirmation) {
      const confirmed = window.confirm(`Are you sure you want to remove this tag from ${selectedContacts.size} selected contacts?`);
      if (!confirmed) return;
    }
    
    try {
      // Use the bulk endpoint instead of individual calls
      const response = await fetch(`${API_BASE}/tags/${tagId}/contacts`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'accept': '*/*'
        },
        body: JSON.stringify({ contactIds: Array.from(selectedContacts) })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      
      // Update local state for all selected contacts
      setContactTags(prev => {
        const updated = { ...prev };
        selectedContacts.forEach(contactId => {
          if (updated[contactId]) {
            updated[contactId] = updated[contactId].filter(tag => tag.id !== tagId);
          }
        });
        return updated;
      });
      
      // Show success message
      if (result.count > 0) {
        alert(`✅ Successfully removed tag from ${result.count} contacts!`);
      } else {
        alert(`ℹ️ None of the selected contacts had this tag applied.`);
      }
      
      // Refresh the contacts data to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      
    } catch (error: any) {
      console.error('Error removing tag from multiple contacts:', error);
      alert(`Failed to remove tag: ${error?.message || 'Unknown error occurred'}`);
    }
  };

  const removeAllTagsFromSelectedContacts = async () => {
    if (selectedContacts.size === 0 || isRemovingAllTags) return;
    
    const confirmed = window.confirm(`Are you sure you want to remove ALL tags from ${selectedContacts.size} selected contacts? This action cannot be undone.`);
    if (!confirmed) return;
    
    try {
      setIsRemovingAllTags(true);
      
      // Update local state immediately for better UX
      setContactTags(prev => {
        const updated = { ...prev };
        selectedContacts.forEach(contactId => {
          updated[contactId] = [];
        });
        return updated;
      });
      
      // Remove tags from backend for each contact
      for (const contactId of Array.from(selectedContacts)) {
        const contactTagsForContact = contactTags[contactId] || [];
        for (const tag of contactTagsForContact) {
          await removeTagFromContact(contactId, tag.id);
        }
      }
      
      alert(`✅ All tags removed from ${selectedContacts.size} contacts`);
    } catch (error) {
      console.error('Error removing all tags from contacts:', error);
      alert('Failed to remove all tags. Please try again.');
    } finally {
      setIsRemovingAllTags(false);
    }
  };

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
        console.log('🔍 Contact deselected:', contactId, 'Total selected:', newSet.size);
      } else {
        newSet.add(contactId);
        console.log('🔍 Contact selected:', contactId, 'Total selected:', newSet.size);
      }
      console.log('🔍 Updated selectedContacts:', Array.from(newSet));
      return newSet;
    });
  };

  const selectAllContacts = () => {
    if (!filteredContacts || filteredContacts.length === 0) {
      console.log('🔄 No filtered contacts available for selectAllContacts');
      return;
    }
    setSelectedContacts(new Set(filteredContacts.map(contact => contact.id)));
  };

  const clearContactSelection = () => {
    setSelectedContacts(new Set());
  };

  // Listen for contacts updated event from clean and merge
  useEffect(() => {
    const handleContactsUpdated = () => {
      console.log('🔄 Contacts updated event received, refreshing data...');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    };

    window.addEventListener('contactsUpdated', handleContactsUpdated);
    return () => window.removeEventListener('contactsUpdated', handleContactsUpdated);
  }, [queryClient]);

  // Optimized contacts query with better caching
  const { data: contacts, isLoading, error, isFetching } = useQuery({
    queryKey: ['contacts', currentPage, pageSize, debouncedSearchTerm, selectedFilter, selectedSourceSystem],
    queryFn: () => {
      const params: any = { page: currentPage, limit: pageSize };
      
      if (selectedSourceSystem !== 'all') {
        params.sourceSystem = selectedSourceSystem;
      }
      
      if (debouncedSearchTerm) {
        params.q = debouncedSearchTerm;
      }
      
      return contactsAPI.getAll(params);
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Memoize filtered contacts for better performance
  const filteredContacts = useMemo(() => {
    if (!contacts?.data?.data) {
      return [];
    }
    
    let filtered = contacts.data.data;
    console.log('🔄 filteredContacts recalculated:', { totalContacts: filtered.length });
    
    // Apply search filter
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(contact => 
        contact.name?.toLowerCase().includes(searchLower) ||
        contact.email?.toLowerCase().includes(searchLower) ||
        contact.mobileE164?.includes(searchLower) ||
        contact.companyName?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply source system filter
    if (selectedSourceSystem !== 'all') {
      filtered = filtered.filter(contact => contact.sourceSystem === selectedSourceSystem);
    }
    
    // Apply relationship type filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(contact => contact.relationshipType === selectedFilter);
    }

    return filtered;
  }, [contacts?.data?.data, debouncedSearchTerm, selectedSourceSystem, selectedFilter, contactTags]);

  const loadTagsForContact = useCallback(async (contactId: string) => {
    if (contactTags[contactId]) {
      return contactTags[contactId];
    }
    
    try {
      setLoadingContactTags(prev => ({ ...prev, [contactId]: true }));
      console.log(`🔄 Loading tags for contact: ${contactId}`);
      
      const tags = await fetchContactTags(contactId);
      
      setContactTags(prev => ({
        ...prev,
        [contactId]: tags
      }));
      
      console.log(`✅ Tags loaded for contact: ${contactId} (${tags.length} tags)`);
      return tags;
    } catch (error) {
      console.error(`❌ Error loading tags for contact ${contactId}:`, error);
      return [];
    } finally {
      setLoadingContactTags(prev => ({ ...prev, [contactId]: false }));
    }
  }, [contactTags]);

  // Debug dropdown state
  useEffect(() => {
    if (bulkTagDropdownOpen) {
      console.log('🔍 Dropdown opened, tags available:', tags.length);
      console.log('🔍 Filtered tags:', tags.filter(tag => 
        tag.name.toLowerCase().includes(bulkTagSearchTerm.toLowerCase())
      ));
    }
  }, [bulkTagDropdownOpen, tags, bulkTagSearchTerm]);

  // Auto-load tags for all contacts when contacts data changes
  useEffect(() => {
    console.log('🔄 useEffect triggered for auto-loading tags:', { 
      filteredContactsLength: filteredContacts.length, 
      tagsLength: tags.length 
    });
    if (filteredContacts.length > 0 && tags.length > 0) {
      console.log('🔄 Auto-loading tags for all contacts...');
      
      const loadAllContactTags = async () => {
        const promises = filteredContacts.map(async (contact) => {
          try {
            const tags = await fetchContactTags(contact.id);
            return { contactId: contact.id, tags };
          } catch (error) {
            console.error(`❌ Error loading tags for contact ${contact.id}:`, error);
            return { contactId: contact.id, tags: [] };
          }
        });
        
        const results = await Promise.allSettled(promises);
        
        const newContactTags: Record<string, Tag[]> = {};
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            newContactTags[result.value.contactId] = result.value.tags;
          }
        });
        
        setContactTags((prev: Record<string, Tag[]>) => ({
          ...prev,
          ...newContactTags
        }));
        
        console.log(`✅ Tags loaded for ${Object.keys(newContactTags).length} contacts`);
      };
      
      loadAllContactTags();
    }
  }, [filteredContacts, tags]);

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.tag-dropdown-container')) {
        setTagDropdownOpen({});
        setBulkTagDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const createMutation = useMutation({
    mutationFn: contactsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setIsModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateContactDto }) =>
      contactsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setIsModalOpen(false);
      setEditingContact(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: contactsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  const handleEdit = (contact: ContactResponseDto) => {
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      deleteMutation.mutate(id);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (contact: ContactResponseDto) => {
    if (contact.companyName) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-2">
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && (
        <>
          {/* Header Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Users className="h-7 w-7 mr-3 text-primary-600" />
                  Contact Management
                </h1>
                <p className="text-gray-600 mt-2">
                  Manage your contacts, organize them with tags, and communicate efficiently
                </p>
              </div>
              
                            <div className="flex flex-col sm:flex-row gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                      viewMode === 'grid'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                    <span className="text-sm font-medium">Grid View</span>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                      viewMode === 'list'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <List className="h-4 w-4" />
                    <span className="text-sm font-medium">List View</span>
                  </button>
                </div>
                
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="btn-primary flex items-center justify-center space-x-2 px-6 py-3"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add New Contact</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filters Section - Only show in Grid View */}
          {viewMode === 'grid' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Contacts
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or company..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 flex items-center gap-2"
                  >
                    <Search className="h-4 w-4" />
                    Search
                  </button>
                  {searchTerm && (
                    <button
                      onClick={handleClearSearch}
                      className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>           
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source System
                </label>
                <select
                  value={selectedSourceSystem}
                  onChange={(e) => setSelectedSourceSystem(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="all">All Sources</option>
                  <option value="MOBILE">Mobile</option>
                  <option value="GMAIL">Gmail</option>
                  <option value="ZOHO">Zoho</option>
                  <option value="INVOICE">Invoice</option>
                  <option value="ASHISH">Ashish</option>
                </select>
              </div>
            </div>
          </div>)}

          {/* Bulk Tag Management Section */}
          {selectedContacts.size > 0 && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl shadow-lg p-6 mb-6 sticky top-4 z-10" style={{ overflow: 'visible' }}>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-blue-800 flex items-center">
                  <Tag className="h-5 w-5 mr-2" />
                  Bulk Tag Operations
                </h3>
                <p className="text-sm text-blue-600 mt-1">
                  Apply or remove tags from all selected contacts at once
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">
                      {selectedContacts.size} contact{selectedContacts.size !== 1 ? 's' : ''} selected
                    </span>
                    <button
                      onClick={clearContactSelection}
                      className="text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🔍 Apply Tags button clicked');
                      console.log('🔍 Current selectedContacts:', Array.from(selectedContacts));
                      console.log('🔍 selectedContacts.size:', selectedContacts.size);
                      console.log('🔍 Current bulkTagDropdownOpen:', bulkTagDropdownOpen);
                      console.log('🔍 Setting bulkTagDropdownOpen to:', !bulkTagDropdownOpen);
                      setBulkTagDropdownOpen(!bulkTagDropdownOpen);
                    }}
                    className="btn-primary text-sm"
                  >
                    Apply Tags
                  </button>
                  <button
                    onClick={removeAllTagsFromSelectedContacts}
                    disabled={isRemovingAllTags}
                    className="btn-secondary text-sm disabled:opacity-50"
                  >
                    {isRemovingAllTags ? 'Removing...' : 'Remove All Tags'}
                  </button>
                </div>
              </div>
              
              {/* Bulk Tag Dropdown */}
              {bulkTagDropdownOpen && (
                <div 
                  className="bg-white border-2 border-blue-300 rounded-lg p-4 mt-4 shadow-xl"
                  style={{ 
                    position: 'relative',
                    zIndex: 50,
                    pointerEvents: 'auto',
                    maxHeight: '400px',
                    overflow: 'visible'
                  }}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-lg font-semibold text-gray-800">Select Tag to Apply</h4>
                    <button
                      onClick={() => setBulkTagDropdownOpen(false)}
                      className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                    >
                      ×
                    </button>
                  </div>

                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Search tags..."
                      value={bulkTagSearchTerm}
                      onChange={(e) => setBulkTagSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm"
                    />
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto space-y-2 mb-3">
                    <div className="text-sm text-gray-600 mb-2 font-medium">
                      Available Tags ({tags.filter(tag => 
                        tag.name.toLowerCase().includes(bulkTagSearchTerm.toLowerCase())
                      ).length}):
                    </div>
                    {tags.filter(tag => 
                      tag.name.toLowerCase().includes(bulkTagSearchTerm.toLowerCase())
                    ).map((tag) => (
                      <div key={tag.id} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="text-sm text-gray-700">{tag.name}</span>
                        </div>
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🚀 ===== TAG BUTTON CLICKED =====');
                            console.log('🚀 Apply to All button clicked for tag:', tag.id, tag.name);
                            console.log('🚀 Current selectedContacts:', Array.from(selectedContacts));
                            console.log('🚀 selectedContacts.size:', selectedContacts.size);
                            console.log('🚀 About to call applyTagToMultipleContacts with tagId:', tag.id);
                            console.log('🚀 Current contactTags state before call:', contactTags);
                            
                            // Show loading state
                            console.log('🚀 Starting tag application...');
                            
                            try {
                              console.log('🚀 Calling applyTagToMultipleContacts...');
                              await applyTagToMultipleContacts(tag.id);
                              console.log('🚀 applyTagToMultipleContacts call completed successfully');
                              console.log('🚀 Final contactTags state after call:', contactTags);
                            } catch (error) {
                              console.log('🚀 ===== ERROR IN BUTTON CLICK =====');
                              console.error('🚀 Error calling applyTagToMultipleContacts:', error);
                              console.error('🚀 Error details:', error);
                            }
                          }}
                          className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded transition-colors cursor-pointer relative z-10"
                          style={{ 
                            pointerEvents: 'auto',
                            position: 'relative',
                            zIndex: 10,
                            border: '2px solid red' // Temporary visual debugging
                          }}
                        >
                          Apply to All
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contacts Selection Controls - Only show in Grid View */}
          {viewMode === 'grid' && filteredContacts.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {selectedContacts.size} of {filteredContacts?.length || 0} contacts selected
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🔄 Select All button clicked');
                        console.log('🔄 Current selectedContacts.size:', selectedContacts.size);
                        console.log('🔄 filteredContacts:', filteredContacts);
                        console.log('🔄 filteredContacts.length:', filteredContacts?.length || 0);
                        
                        if (!filteredContacts || filteredContacts.length === 0) {
                          console.log('🔄 No filtered contacts available');
                          return;
                        }
                        
                        if (selectedContacts.size === filteredContacts.length) {
                          // If all are selected, deselect all
                          console.log('🔄 Deselecting all contacts');
                          setSelectedContacts(new Set());
                        } else {
                          // If not all are selected, select all
                          console.log('🔄 Selecting all contacts');
                          const allContactIds = new Set(filteredContacts.map(c => c.id));
                          console.log('🔄 All contact IDs:', Array.from(allContactIds));
                          setSelectedContacts(allContactIds);
                        }
                      }}
                      className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded-md transition-colors font-medium"
                    >
                      {selectedContacts.size === (filteredContacts?.length || 0) ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                </div>
                
                {selectedContacts.size > 0 && (
                  <button
                    onClick={() => setSelectedContacts(new Set())}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded transition-colors"
                  >
                    Clear Selection
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Contacts Content - Grid or List View */}
          {viewMode === 'grid' ? (
            <>
              {/* Contacts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContacts.map((contact, index) => (
              <div 
                key={contact.id}
                data-contact-id={contact.id}
                className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200 group relative ${
                  contactTags[contact.id] && contactTags[contact.id].length > 0 ? 'ring-2 ring-primary-200' : ''
                }`}
              >
                {/* Tag Indicator Badge */}
                {contactTags[contact.id] && contactTags[contact.id].length > 0 && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded-full flex items-center space-x-1">
                      <Tag className="h-3 w-3" />
                      <span>{contactTags[contact.id].length}</span>
                    </div>
                  </div>
                )}
                  <div className="p-6">
                  {/* Contact Selection and Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative z-50">
                        <input
                          type="checkbox"
                          checked={selectedContacts.has(contact.id)}
                          onChange={(e) => {
                            console.log('🔍 Checkbox clicked for contact:', contact.id, contact.name);
                            console.log('🔍 Checkbox event:', e);
                            console.log('🔍 Checkbox checked state:', e.target.checked);
                            toggleContactSelection(contact.id);
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                      
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-lg group-hover:scale-110 transition-transform duration-200">
                        {getInitials(contact.name)}
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors duration-200">
                          {contact.name}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            contact.sourceSystem === 'MOBILE' ? 'bg-green-100 text-green-800' :
                            contact.sourceSystem === 'GMAIL' ? 'bg-blue-100 text-blue-800' :
                            contact.sourceSystem === 'ZOHO' ? 'bg-purple-100 text-purple-800' :
                            contact.sourceSystem === 'INVOICE' ? 'bg-orange-100 text-orange-800' :
                            contact.sourceSystem === 'ASHISH' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {contact.sourceSystem}
                          </span>
                          
                          {selectedContacts.has(contact.id) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Selected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 opacity-0 group-hover:opacity-100">
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-3 mb-4">
                    {contact.email && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="truncate">{contact.email}</span>
                      </div>
                    )}
                    
                    {contact.mobileE164 && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{contact.mobileE164}</span>
                      </div>
                    )}
                    
                    {contact.companyName && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="truncate">{contact.companyName}</span>
                      </div>
                    )}
                  </div>

                  {/* Tag Management */}
                  <div className="mb-4 relative tag-dropdown-container">
                    {/* Display Applied Tags */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-700">Applied Tags</h4>
                        <button
                          onClick={async () => {
                            const isOpen = tagDropdownOpen[contact.id];
                            if (!isOpen) {
                              // Load tags when opening dropdown
                              await loadTagsForContact(contact.id);
                            }
                            setTagDropdownOpen(prev => ({ ...prev, [contact.id]: !isOpen }));
                          }}
                          disabled={loadingContactTags[contact.id]}
                          className="text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loadingContactTags[contact.id] ? 'Loading...' : (tagDropdownOpen[contact.id] ? 'Close' : 'Manage')}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const contactTagsForThisContact = contactTags[contact.id];
                          console.log(`🔍 Rendering tags for contact ${contact.id}:`, contactTagsForThisContact);
                          console.log(`🔍 Contact ${contact.id} has ${contactTagsForThisContact?.length || 0} tags`);
                          return contactTagsForThisContact && contactTagsForThisContact.length > 0 ? (
                            contactTagsForThisContact.map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full"
                              style={{ 
                                backgroundColor: `${tag.color}20`, 
                                color: tag.color,
                                border: `1px solid ${tag.color}40`
                              }}
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              {tag.name}
                              <button
                                onClick={() => removeTagFromContact(contact.id, tag.id)}
                                className="ml-1 hover:bg-black hover:bg-opacity-20 rounded-full w-4 h-4 flex items-center justify-center transition-all duration-200 text-xs font-bold hover:scale-110"
                                title="Remove tag"
                              >
                                ×
                              </button>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500 italic">No tags applied - Click "Manage" to add tags</span>
                        );
                        })()}
                      </div>
                    </div>
                    
                    {/* Tag Dropdown */}
                    {tagDropdownOpen[contact.id] && (
                      <div 
                        className="absolute z-[9999] w-80 bg-white border border-gray-200 rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 transform opacity-100 scale-100 transition-all duration-200 ease-out overflow-hidden" 
                        style={{ 
                          minWidth: '320px',
                          marginTop: '8px',
                          maxHeight: '80vh',
                          overflowY: 'auto'
                        }}
                      >
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="font-semibold text-gray-900 text-base">Apply Tags</h5>
                            <button
                              onClick={() => setTagDropdownOpen(prev => ({ ...prev, [contact.id]: false }))}
                              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <div className="mb-4">
                            <input
                              type="text"
                              placeholder="Search tags..."
                              value={contactTagSearchTerm}
                              onChange={(e) => setContactTagSearchTerm(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm"
                            />
                          </div>
                          
                          <div className="max-h-48 overflow-y-auto space-y-2 mb-4 border border-gray-100 rounded-lg p-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                            {/* Loading and Error States */}
                            {tagsLoading && (
                              <div className="text-sm text-blue-600 text-center py-2">
                                Loading tags...
                              </div>
                            )}
                            
                            {loadingContactTags[contact.id] && (
                              <div className="text-sm text-blue-600 text-center py-2">
                                Loading contact tags...
                              </div>
                            )}
                            
                            {tagsError && (
                              <div className="text-sm text-red-600 text-center py-2">
                                Error loading tags: {tagsError.message}
                              </div>
                            )}
                              
                            {tags.length === 0 ? (
                              <div className="text-sm text-gray-500 italic text-center py-4">
                                No tags available. Please create some tags first.
                                <br />
                                <button 
                                  onClick={() => {
                                    // Create sample tags for testing
                                    const sampleTags = [
                                      {
                                        id: 'sample-1',
                                        name: 'VIP',
                                        color: '#3B82F6',
                                        description: 'Very Important Person',
                                        isActive: true,
                                        contactCount: 0,
                                        createdAt: new Date(),
                                        updatedAt: new Date()
                                      },
                                      {
                                        id: 'sample-2',
                                        name: 'Regular',
                                        color: '#10B981',
                                        description: 'Regular customer',
                                        isActive: true,
                                        contactCount: 0,
                                        createdAt: new Date(),
                                        updatedAt: new Date()
                                      },
                                      {
                                        id: 'sample-3',
                                        name: 'New',
                                        color: '#F59E0B',
                                        description: 'New contact',
                                        isActive: true,
                                        contactCount: 0,
                                        createdAt: new Date(),
                                        updatedAt: new Date()
                                      }
                                    ];
                                    setTags(sampleTags);
                                    console.log('✅ Sample tags created:', sampleTags.length);
                                  }}
                                  className="mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                                >
                                  Create Sample Tags
                                </button>
                              </div>
                            ) : tags.filter(tag => 
                              tag.name.toLowerCase().includes(contactTagSearchTerm.toLowerCase())
                            ).length === 0 ? (
                              <div className="text-sm text-gray-500 italic text-center py-4">
                                No tags match your search
                              </div>
                            ) : (
                              tags.filter(tag => 
                                tag.name.toLowerCase().includes(contactTagSearchTerm.toLowerCase())
                              ).map((tag) => {
                                const isApplied = contactTags[contact.id]?.some(ct => ct.id === tag.id);
                                return (
                                  <div key={tag.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                    <div className="flex items-center space-x-3">
                                      <div
                                        className="w-4 h-4 rounded-full border border-gray-200"
                                        style={{ backgroundColor: tag.color }}
                                      />
                                      <span className="text-sm font-medium text-gray-700">{tag.name}</span>
                                      {isApplied && (
                                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full font-medium">
                                          Applied
                                        </span>
                                      )}
                                    </div>
                                    {!isApplied ? (
                                      <button
                                        onClick={async () => {
                                          try {
                                            await applyTagToContact(contact.id, tag.id);
                                            console.log(`✅ Tag "${tag.name}" applied successfully to ${contact.name}`);
                                          } catch (error) {
                                            console.error('❌ Error applying tag:', error);
                                          }
                                          setTagDropdownOpen(prev => ({ ...prev, [contact.id]: false }));
                                        }}
                                        className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded-md transition-colors font-medium"
                                      >
                                        Apply
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => removeTagFromContact(contact.id, tag.id)}
                                        className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-md transition-colors font-medium"
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Create New Tag */}
                          <div className="pt-4 border-t border-gray-200">
                            <div className="text-sm font-medium text-gray-700 mb-3">Create New Tag:</div>
                            <div className="space-y-3">
                              <input
                                type="text"
                                placeholder="New tag name"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm"
                              />
                              <div className="flex items-center space-x-3">
                                <input
                                  type="color"
                                  value={newTagColor}
                                  onChange={(e) => setNewTagColor(e.target.value)}
                                  className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                                />
                                <button
                                  onClick={() => {
                                    createNewTag();
                                    setTagDropdownOpen(prev => ({ ...prev, [contact.id]: false }));
                                  }}
                                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={!newTagName.trim() || isCreatingTag}
                                >
                                  {isCreatingTag ? 'Creating...' : 'Create & Apply'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(contact)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 hover:scale-110"
                        title="Edit Contact"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                        title="Delete Contact"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                  </div>
                </div>
              </div>
            ))}
              </div>

              {/* Pagination Controls */}
          {contacts?.data?.total && contacts.data.total > pageSize && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Show:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-gray-600">per page</span>
                  
                  {/* Quick Page Jump */}
                  <div className="flex items-center space-x-2 ml-4">
                    <span className="text-sm text-gray-600">Go to:</span>
                    <input
                      type="number"
                      min={1}
                      max={contacts?.data?.total ? Math.ceil(contacts.data.total / pageSize) : 1}
                      value={currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= (contacts?.data?.total ? Math.ceil(contacts.data.total / pageSize) : 1)) {
                          setCurrentPage(page);
                        }
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const page = parseInt((e.target as HTMLInputElement).value);
                          if (page >= 1 && page <= (contacts?.data?.total ? Math.ceil(contacts.data.total / pageSize) : 1)) {
                            setCurrentPage(page);
                          }
                        }
                      }}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-600">
                      of {contacts?.data?.total ? Math.ceil(contacts.data.total / pageSize) : 1}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1}
                    className="btn-secondary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {(() => {
                      const totalPages = Math.ceil(contacts.data.total / pageSize);
                      const currentPageNum = currentPage;
                      const pages = [];
                      
                      // Always show first page
                      if (totalPages > 1) {
                        pages.push(
                          <button
                            key={1}
                            onClick={() => setCurrentPage(1)}
                            className={`px-3 py-2 text-sm rounded-md transition-colors ${
                              currentPageNum === 1
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            1
                          </button>
                        );
                      }
                      
                      // Show ellipsis if there's a gap
                      if (currentPageNum > 3 && totalPages > 4) {
                        pages.push(
                          <span key="ellipsis1" className="px-2 text-gray-500">
                            ...
                          </span>
                        );
                      }
                      
                      // Show pages around current page
                      for (let i = Math.max(2, currentPageNum - 1); i <= Math.min(totalPages - 1, currentPageNum + 1); i++) {
                        if (i > 1 && i < totalPages) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => setCurrentPage(i)}
                              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                                currentPageNum === i
                                  ? 'bg-primary-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {i}
                            </button>
                          );
                        }
                      }
                      
                      // Show ellipsis if there's a gap
                      if (currentPageNum < totalPages - 2 && totalPages > 4) {
                        pages.push(
                          <span key="ellipsis2" className="px-2 text-gray-500">
                            ...
                          </span>
                        );
                      }
                      
                      // Always show last page if there are multiple pages
                      if (totalPages > 1) {
                        pages.push(
                          <button
                            key={totalPages}
                            onClick={() => setCurrentPage(totalPages)}
                            className={`px-3 py-2 text-sm rounded-md transition-colors ${
                              currentPageNum === totalPages
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {totalPages}
                          </button>
                        );
                      }
                      
                      return pages;
                    })()}
                  </div>
                  
                  <button
                    onClick={() => {
                      if (contacts?.data?.total) {
                        const totalPages = Math.ceil(contacts.data.total / pageSize);
                        setCurrentPage(prev => Math.min(totalPages, prev + 1));
                      }
                    }}
                    disabled={!contacts?.data?.total || currentPage >= Math.ceil(contacts.data.total / pageSize)}
                    className="btn-secondary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results Summary */}
          {contacts?.data && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-primary-600" />
                    <strong className="text-gray-900">{contacts.data.total}</strong>
                    <span>total contacts</span>
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-blue-600" />
                    <strong className="text-gray-900">{filteredContacts.length}</strong>
                    <span>showing</span>
                    {selectedSourceSystem !== 'all' && (
                      <span className="text-blue-600">from {selectedSourceSystem}</span>
                    )}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <strong className="text-gray-900">{contacts.data.page}</strong>
                    <span>of {Math.ceil(contacts.data.total / contacts.data.limit)}</span>
                  </span>
                </div>

                {debouncedSearchTerm && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Search className="h-4 w-4 text-orange-600" />
                    <span className="text-gray-600">Search results for:</span>
                    <span className="font-medium text-gray-900">"{debouncedSearchTerm}"</span>
                  </div>
                )}
              </div>
              
              {/* Active Filters Summary */}
              {(selectedSourceSystem !== 'all' || selectedFilter !== 'all') && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="font-medium">Active Filters:</span>
                    {selectedSourceSystem !== 'all' && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        Source: {selectedSourceSystem}
                      </span>
                    )}
                    {selectedFilter !== 'all' && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Type: {selectedFilter}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {filteredContacts.length === 0 && (
            <div className="text-center py-12 animate-fade-in-up">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
              <p className="text-gray-500 mb-6">
                {debouncedSearchTerm || selectedFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first contact'
                }
              </p>
              {!debouncedSearchTerm && selectedFilter === 'all' && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="btn-primary"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Contact
                </button>
              )}
            </div>
          )}
            </>
          ) : (
            /* List View - ContactList Component */
            <ContactList hideHeading={true} />
          )}
        </>
      )}

      {/* Contact Modal */}
      <ContactModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingContact(null);
        }}
        contact={editingContact}
        onSubmit={(data) => {
          if (editingContact) {
            updateMutation.mutate({ id: editingContact.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};

export default Contacts;

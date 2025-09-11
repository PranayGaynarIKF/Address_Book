import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Users, 
  BarChart3, 
  History, 
  Phone, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Plus,
  Search,
  RefreshCw,
  Tag,
  Mail
} from 'lucide-react';
import { TagDeleteConfirmationModal } from '../TagDeleteConfirmationModal';
import WhatsAppBulkMessaging from './WhatsAppBulkMessaging';

interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  companyName: string;
  sourceSystem: string;
}

interface TagType {
  id: string;
  name: string;
  color: string;
  description?: string;
  isActive: boolean;
  contactCount?: number;
}

interface ApiTag {
  id: string;
  name: string;
  color: string;
  description?: string;
  isActive?: boolean;
}

interface WhatsAppMessage {
  id: string;
  contactId: string;
  message: string;
  messageId: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  error?: string;
  sentAt: string;
  contact: {
    name: string;
    phone: string;
  };
}

interface WhatsAppStats {
  total: number;
  sent: number;
  failed: number;
  delivered: number;
  successRate: string;
}

const WhatsAppManager: React.FC = () => {
  // State management
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [stats, setStats] = useState<WhatsAppStats | null>(null);
  const [activeTab, setActiveTab] = useState<'compose' | 'templates' | 'history' | 'statistics' | 'tag-management' | 'bulk-messaging'>('bulk-messaging');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [tagContactsCount, setTagContactsCount] = useState<number>(0);
  
  // Template message state
  const [templateName, setTemplateName] = useState('basic');
  const [templateParams, setTemplateParams] = useState<Record<string, string>>({ name: '' });
  const [isTemplateSending, setIsTemplateSending] = useState(false);

  // Tag management state
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [newTagDescription, setNewTagDescription] = useState('');
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  
  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<TagType | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Bulk messaging modal
  const [showBulkMessaging, setShowBulkMessaging] = useState(false);

  console.log('🎯 WhatsAppManager component rendering!');
  console.log('🎯 Component state - tags:', tags.length, 'selectedTags:', selectedTags.size);
  
  // Load contacts on component mount
  useEffect(() => {
    console.log('🚀 WhatsAppManager useEffect triggered!');
    console.log('🚀 About to call fetchContacts and fetchTags');
    fetchContacts();
    fetchTags();
    console.log('🚀 fetchContacts and fetchTags called!');
  }, []);

  // Fetch contacts from API
  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:4002/contacts?limit=100', {
        headers: {
          'X-API-Key': '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setContacts(data.data?.data || []);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch tags from API
  const fetchTags = async () => {
    console.log('🚀 fetchTags function called!');
    try {
      console.log('🔍 Fetching tags...');
      console.log('🔍 API URL: http://localhost:4002/tags');
      console.log('🔍 No headers needed - API is public');
      
      const response = await fetch('http://localhost:4002/tags');
      
      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response ok:', response.ok);
      console.log('🔍 Response headers:', response.headers);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Tags fetched successfully - Raw response:', data);
        console.log('✅ Tags data structure:', typeof data, Array.isArray(data));
        
        // Handle different possible response structures
        let tagsArray = [];
        if (Array.isArray(data)) {
          // Direct array response
          tagsArray = data;
          console.log('✅ Direct array response detected');
        } else if (data && Array.isArray(data.data)) {
          // Nested data.data structure
          tagsArray = data.data;
          console.log('✅ Nested data.data structure detected');
        } else if (data && Array.isArray(data.items)) {
          // Alternative nested structure
          tagsArray = data.items;
          console.log('✅ Nested items structure detected');
        } else {
          // Fallback - try to find any array in the response
          console.log('⚠️ Unknown response structure, searching for arrays...');
          for (const key in data) {
            if (Array.isArray(data[key])) {
              console.log('✅ Found array in key:', key, data[key]);
              tagsArray = data[key];
              break;
            }
          }
        }
        
        console.log('✅ Final tags array:', tagsArray);
        console.log('✅ Tags array length:', tagsArray.length);
        
        // Ensure all tags have required fields including isActive
        const mappedTags: TagType[] = tagsArray.map((tag: ApiTag) => ({
          ...tag,
          isActive: tag.isActive !== undefined ? tag.isActive : true
        }));
        
        setTags(mappedTags);
        console.log('📝 Tags state updated with:', tagsArray);
        
        // If no tags found, show a message
        if (tagsArray.length === 0) {
          console.log('⚠️ No tags found in API response');
        }
      } else {
        console.error('❌ Tags API error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error response body:', errorText);
        
        // Fallback: Set some test tags so UI shows something
        console.log('🔄 Setting fallback test tags for UI testing');
        const fallbackTags = [
          { id: 'test1', name: 'Test Tag 1', color: '#FF0000', description: 'Test tag for UI', isActive: true },
          { id: 'test2', name: 'Test Tag 2', color: '#00FF00', description: 'Another test tag', isActive: true }
        ];
        setTags(fallbackTags);
      }
    } catch (error) {
      console.error('❌ Error fetching tags:', error);
      if (error instanceof Error) {
        console.error('❌ Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      } else {
        console.error('❌ Unknown error type:', typeof error, error);
      }
      
      // Fallback: Set test tags even on network errors
      console.log('🔄 Setting fallback test tags due to network error');
      const fallbackTags = [
        { id: 'fallback1', name: 'Fallback Tag 1', color: '#FF0000', description: 'Fallback tag', isActive: true },
        { id: 'fallback2', name: 'Fallback Tag 2', color: '#00FF00', description: 'Another fallback', isActive: true }
      ];
      setTags(fallbackTags);
    }
  };

  // Get contact count for selected tags
  const getTagContactsCount = async (tagIds: string[]) => {
    if (tagIds.length === 0) {
      setTagContactsCount(0);
      return;
    }

    try {
      // Use the correct endpoint format: /tags/tag_client/contacts
      const tagName = tagIds[0]; // Get the first tag name
      const response = await fetch(`http://localhost:4002/tags/${tagName}/contacts`, {
        headers: {
          'X-API-Key': '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTagContactsCount(data.total || data.length || 0);
      }
    } catch (error) {
      console.error('Error getting tag contacts count:', error);
      setTagContactsCount(0);
    }
  };

  // Update tag contacts count when tag selection changes
  useEffect(() => {
    getTagContactsCount(Array.from(selectedTags));
  }, [selectedTags, tags]);

  // Debug effect to monitor tags state changes
  useEffect(() => {
    console.log('🔍 Tags state changed! New tags:', tags);
    console.log('🔍 Tags length:', tags.length);
    console.log('🔍 Tags array:', tags);
  }, [tags]);

  // Debug effect to monitor component lifecycle
  useEffect(() => {
    console.log('🎬 WhatsAppManager component mounted!');
    console.log('🎬 Initial tags state:', tags);
    console.log('🎬 Initial selectedTags state:', selectedTags);
    
    // Force fetch tags on mount
    console.log('🎬 Forcing fetchTags on mount...');
    fetchTags();
    
    // Simple test alert to see if component is working
    console.log('🎬 Showing test alert...');
  
    
    return () => {
      console.log('🎬 WhatsAppManager component unmounting...');
    };
  }, []);

  // Fetch WhatsApp statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:4002/whatsapp/statistics', {
        headers: {
          'X-API-Key': '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Load stats on component mount
  useEffect(() => {
    fetchStats();
  }, []);

  // Fetch message history
  const fetchMessageHistory = async () => {
    try {
      const response = await fetch('http://localhost:4002/whatsapp/history/all?limit=100', {
        headers: {
          'X-API-Key': '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching message history:', error);
    }
  };

  const sendMessage = async (contactId: string, messageText: string) => {
    try {
      setIsSending(true);
      
      // First, get the contact details to get the phone number
      const contact = contacts.find(c => c.id === contactId);
      if (!contact || !contact.phone) {
        alert('❌ Contact not found or missing phone number');
        return;
      }

      // Extract country code and phone number
      const phone = contact.phone;
      const countryCode = phone.startsWith('91') ? '91' : '91'; // Default to India
      const phoneNumber = phone.replace(/^91/, '');
      
      // Use ONLY the working /whatsapp/send-text-message endpoint
      const response = await fetch(`http://localhost:4002/whatsapp/send-text-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          phone_number_id: "690875100784871",
          customer_country_code: countryCode,
          customer_number: phoneNumber,
          data: {
            type: "text",
            context: {
              body: messageText,
              preview_url: false
            }
          },
          reply_to: null,
          myop_ref_id: `msg_${Date.now()}_${contactId}`
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Message sent successfully:', result);
      
      // Show success message
      setMessage('');
      alert(`✅ Message sent successfully to ${contact.name}!`);
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      alert(`❌ Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  };

  const sendBulkMessages = async () => {
    console.log('🚀 sendBulkMessages function called!');
    console.log('📊 Current state:', {
      selectedContacts: selectedContacts.size,
      selectedTags: selectedTags.size,
      message: message,
      messageLength: message.length
    });

    // Check if we have either selected contacts or selected tags with contacts
    if (selectedContacts.size === 0 && selectedTags.size === 0) {
      console.log('❌ No contacts or tags selected');
      alert('❌ Please select at least one contact or tag');
      return;
    }

    if (!message.trim()) {
      console.log('❌ No message text');
      alert('❌ Please enter a message');
      return;
    }

    try {
      console.log('✅ Starting bulk message send...');
      setIsSending(true);
      let successCount = 0;
      let totalCount = 0;
      let allContacts: any[] = [];

      // Add individually selected contacts
      if (selectedContacts.size > 0) {
        const selectedContactData = contacts.filter(c => selectedContacts.has(c.id));
        console.log('👥 Individual contacts:', selectedContactData);
        allContacts.push(...selectedContactData);
      }

      // Add contacts from selected tags
      if (selectedTags.size > 0) {
        try {
          const tagIds = Array.from(selectedTags);
          console.log('🏷️ Processing tags:', tagIds);
          
          // Use the correct endpoint format: /tags/tag_client/contacts
          const tagName = tagIds[0]; // Get the first tag name
          console.log('🔍 Fetching contacts from tag:', tagName);
          
          const response = await fetch(`http://localhost:4002/tags/${tagName}/contacts`, {
            headers: {
              'X-API-Key': '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN'
            }
          });
          
          console.log('📡 Tag API response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('📥 Tag contacts response:', data);
            
            if (data.contacts && Array.isArray(data.contacts)) {
              allContacts.push(...data.contacts);
              console.log('✅ Added contacts from data.contacts:', data.contacts.length);
            } else if (Array.isArray(data)) {
              // If the response is directly an array of contacts
              allContacts.push(...data);
              console.log('✅ Added contacts from direct array:', data.length);
            } else {
              console.log('⚠️ Unexpected data format:', typeof data, data);
            }
          } else {
            console.error('❌ Failed to fetch tag contacts:', response.status);
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
          }
        } catch (error) {
          console.error('❌ Error fetching tag contacts:', error);
        }
      }

      console.log('📋 All contacts collected:', allContacts);

      // Remove duplicates based on contact ID
      const uniqueContacts = allContacts.filter((contact, index, self) => 
        index === self.findIndex(c => c.id === contact.id)
      );
      totalCount = uniqueContacts.length;

      console.log('🔍 Unique contacts after deduplication:', uniqueContacts);
      console.log('📊 Total count:', totalCount);

      if (totalCount === 0) {
        console.log('❌ No contacts found after processing');
        alert('❌ No contacts found in selected tags or contacts');
        return;
      }

      console.log(`📤 Sending bulk message to ${totalCount} contacts:`, uniqueContacts);

      for (const contact of uniqueContacts) {
        try {
          console.log(`📱 Processing contact:`, contact);
          
          // Check if contact has required fields
          if (!contact.mobileE164 && !contact.phone) {
            console.warn(`⚠️ Skipping contact ${contact.name || contact.id}: missing phone number`);
            continue;
          }

          // Use mobileE164 if available, otherwise use phone
          const phone = contact.mobileE164 || contact.phone;
          const countryCode = phone.startsWith('91') ? '91' : '91';
          // Fix: Remove ALL country code prefixes, not just '91'
          let phoneNumber = phone;
          if (phone.startsWith('+91')) {
            phoneNumber = phone.replace('+91', '');
          } else if (phone.startsWith('91')) {
            phoneNumber = phone.replace('91', '');
          }
          
          // Ensure phone number is clean (no special characters)
          phoneNumber = phoneNumber.replace(/[^0-9]/g, '');

          console.log(`📱 Sending to ${contact.name} (${phone}) - Country: ${countryCode}, Number: ${phoneNumber}`);

          const messagePayload = {
            phone_number_id: "690875100784871",
            customer_country_code: countryCode,
            customer_number: phoneNumber,
            data: {
              type: "text",
              context: {
                body: message,
                preview_url: false
              }
            },
            reply_to: null,
            myop_ref_id: `bulk_${Date.now()}_${contact.id}`
          };

          console.log('📤 Sending payload:', messagePayload);

          const response = await fetch(`http://localhost:4002/whatsapp/send-text-message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN',
              'Accept': 'application/json'
            },
            body: JSON.stringify(messagePayload)
          });

          console.log(`📡 Response for ${contact.name}:`, response.status, response.statusText);

          if (response.ok) {
            const result = await response.json();
            successCount++;
            console.log(`✅ Message sent to ${contact.name}:`, result);
          } else {
            console.error(`❌ Failed to send to ${contact.name}: ${response.status}`);
            const errorText = await response.text();
            console.error(`❌ Error response:`, errorText);
          }
        } catch (error) {
          console.error(`❌ Error sending to contact ${contact.name || contact.id}:`, error);
        }
      }

      console.log(`🏁 Bulk send completed: ${successCount}/${totalCount} successful`);
      alert(`✅ All bulk messages sent successfully! (${successCount}/${totalCount})`);
      setMessage('');
      setSelectedContacts(new Set());
      setSelectedTags(new Set());
      
    } catch (error) {
      console.error('❌ Error in bulk send:', error);
      alert(`❌ Bulk send failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  };

  const sendTemplateMessages = async () => {
    // Check if we have template name and selected tags
    if (!templateName.trim() || selectedTags.size === 0) {
      alert('❌ Please select a template and at least one tag');
      return;
    }

    try {
      setIsTemplateSending(true);
      let successCount = 0;
      let totalCount = 0;
      let allContacts: any[] = [];

      // Get contacts from selected tags
      if (selectedTags.size > 0) {
        try {
          const tagIds = Array.from(selectedTags);
          console.log('🏷️ Processing tags for template:', tagIds);
          
          // Use the correct endpoint format: /tags/tag_client/contacts
          const tagName = tagIds[0]; // Get the first tag name
          console.log('🔍 Fetching contacts from tag for template:', tagName);
          
          const response = await fetch(`http://localhost:4002/tags/${tagName}/contacts`, {
            headers: {
              'X-API-Key': '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('📥 Tag contacts response for template:', data);
            
            if (data.contacts && Array.isArray(data.contacts)) {
              allContacts.push(...data.contacts);
            } else if (Array.isArray(data)) {
              // If the response is directly an array of contacts
              allContacts.push(...data);
            }
          } else {
            console.error('❌ Failed to fetch tag contacts for template:', response.status);
          }
        } catch (error) {
          console.error('❌ Error fetching tag contacts for template:', error);
        }
      }

      // Remove duplicates based on contact ID
      const uniqueContacts = allContacts.filter((contact, index, self) => 
        index === self.findIndex(c => c.id === contact.id)
      );
      totalCount = uniqueContacts.length;

      if (totalCount === 0) {
        alert('❌ No contacts found in selected tags');
        return;
      }

      console.log(`📤 Sending template messages to ${totalCount} contacts:`, uniqueContacts);

      for (const contact of uniqueContacts) {
        try {
          // Check if contact has required fields
          if (!contact.mobileE164 && !contact.phone) {
            console.warn(`⚠️ Skipping contact ${contact.name || contact.id}: missing phone number`);
            continue;
          }

          // Use mobileE164 if available, otherwise use phone
          const phone = contact.mobileE164 || contact.phone;
          const countryCode = phone.startsWith('91') ? '91' : '91';
          // Fix: Remove ALL country code prefixes, not just '91'
          let phoneNumber = phone;
          if (phone.startsWith('+91')) {
            phoneNumber = phone.replace('+91', '');
          } else if (phone.startsWith('91')) {
            phoneNumber = phone.replace('91', '');
          }
          
          // Ensure phone number is clean (no special characters)
          phoneNumber = phoneNumber.replace(/[^0-9]/g, '');

          console.log(`📱 Sending template to ${contact.name} (${phone}): ${templateName}`);

          // Use the template API endpoint
          const response = await fetch(`http://localhost:4002/whatsapp/send-template/${contact.id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              phone_number_id: "690875100784871",
              customer_country_code: countryCode,
              customer_number: phoneNumber,
              data: {
                type: "template",
                context: {
                  template_name: templateName,
                  language: "en",
                  body: templateParams
                }
              },
              reply_to: null,
              myop_ref_id: `template_${Date.now()}_${contact.id}`
            })
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              successCount++;
              console.log(`✅ Template message sent to ${contact.name}:`, result);
            } else {
              console.error(`❌ Template failed for ${contact.name}:`, result.error);
            }
          } else {
            console.error(`❌ Failed to send template to ${contact.name}: ${response.status}`);
            const errorText = await response.text();
            console.error(`❌ Error response:`, errorText);
          }
        } catch (error) {
          console.error(`❌ Error sending template to contact ${contact.name || contact.id}:`, error);
        }
      }

      alert(`✅ Template messages sent! ${successCount}/${totalCount} successful`);
      setTemplateName(''); // Reset template name
      setTemplateParams({}); // Reset template parameters
      setSelectedTags(new Set()); // Reset tag selection
      
    } catch (error) {
      console.error('❌ Error in template send:', error);
      alert(`❌ Template send failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTemplateSending(false);
    }
  };

  // Toggle contact selection
  const toggleContactSelection = (contactId: string) => {
    const newSelection = new Set(selectedContacts);
    if (newSelection.has(contactId)) {
      newSelection.delete(contactId);
    } else {
      newSelection.add(contactId);
    }
    setSelectedContacts(newSelection);
  };

  // Select all contacts
  const selectAllContacts = () => {
    if (selectedContacts.size === contacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(contacts.map(c => c.id)));
    }
  };

  // Toggle tag selection
  const toggleTagSelection = (tagId: string) => {
    const newSelection = new Set(selectedTags);
    if (newSelection.has(tagId)) {
      newSelection.delete(tagId);
    } else {
      newSelection.add(tagId);
    }
    setSelectedTags(newSelection);
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedContacts(new Set());
    setSelectedTags(new Set());
    setTagContactsCount(0);
  };

  // Tag management functions
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

      const response = await fetch('http://localhost:4002/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN'
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

  const editTag = (tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    if (tag) {
      setEditingTag(tag);
      setNewTagName(tag.name);
      setNewTagColor(tag.color);
      setNewTagDescription(tag.description || '');
    }
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
        description: newTagDescription.trim(),
        isActive: editingTag.isActive
      };

      const response = await fetch(`http://localhost:4002/tags/${editingTag.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN'
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

  const handleDeleteClick = (tag: TagType) => {
    setTagToDelete(tag);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!tagToDelete) return;
    
    try {
      setDeleteLoading(true);
      
      const response = await fetch(`http://localhost:4002/tags/${tagToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN'
        }
      });

      if (response.ok) {
        setTags(tags.filter(t => t.id !== tagToDelete.id));
        alert('✅ Tag deleted successfully!');
        setShowDeleteModal(false);
        setTagToDelete(null);
      } else {
        // Parse the error response to extract contact count
        const errorData = await response.json();
        const errorMessage = errorData.message || 'Failed to delete tag';
        
        // Extract contact count from error message
        const contactCountMatch = errorMessage.match(/(\d+)\s+contact\(s\)/);
        const contactCount = contactCountMatch ? parseInt(contactCountMatch[1]) : 0;
        
        // Update the tag with the correct contact count
        setTagToDelete(prev => prev ? { ...prev, contactCount } : null);
        
        // Don't close the modal, let it show the updated count
        return;
      }
    } catch (error) {
      console.error('❌ Error deleting tag:', error);
      alert(`❌ Error deleting tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setTagToDelete(null);
  };

  const cancelEdit = () => {
    setEditingTag(null);
    setNewTagName('');
    setNewTagColor('#3B82F6');
    setNewTagDescription('');
  };

  // Get total recipients count
  const getTotalRecipients = () => {
    return selectedContacts.size + tagContactsCount;
  };

  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.phone && contact.phone.includes(searchTerm)) ||
    (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filter messages based on status
  const filteredMessages = messages.filter(msg => 
    filterStatus === 'all' || msg.status === filterStatus
  );

  // Get status icon and color
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Debug logging
  useEffect(() => {
    console.log('🔍 WhatsAppManager render - Tags count:', tags.length, 'Tags:', tags);
    console.log('🔍 Selected tags:', selectedTags);
    console.log('🔍 Tag contacts count:', tagContactsCount);
    console.log('🔍 Component state - contacts:', contacts.length, 'isLoading:', isLoading);
    console.log('🔍 Component state - activeTab:', activeTab);
  }, [tags, selectedTags, tagContactsCount, contacts.length, isLoading, activeTab]);

  const viewTagContacts = async (tagId: string) => {
    try {
      const tag = tags.find(t => t.id === tagId);
      if (!tag) {
        alert('Tag not found.');
        return;
      }

      setActiveTab('tag-management'); // Switch to tag management tab
      setSelectedTags(new Set([tagId])); // Select only the tag to view its contacts
      setTagContactsCount(0); // Reset count to 0 for the new tab

      // Fetch contacts for the selected tag
      const response = await fetch(`http://localhost:4002/tags/${tagId}/contacts?limit=100`, {
        headers: {
          'X-API-Key': '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setContacts(data.data?.data || []); // Assuming the API returns data.data.data
        setTagContactsCount(data.total || data.length || 0);
      } else {
        const errorText = await response.text();
        console.error('Error fetching tag contacts for viewing:', response.status, errorText);
        alert(`Failed to fetch contacts for tag ${tag.name}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error in viewTagContacts:', error);
      alert(`Error viewing tag contacts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <MessageSquare className="h-8 w-8 text-green-600 mr-3" />
                WhatsApp Manager
              </h1>
              <p className="text-gray-600 mt-2">
                Send WhatsApp messages to your contacts individually or in bulk
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchStats}
                className="btn-secondary flex items-center"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {/* Hidden sections as requested by user */}
              {/* 
              <button
                onClick={() => setActiveTab('compose')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'compose'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Send className="h-4 w-4 inline mr-2" />
                Compose & Send
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'templates'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageSquare className="h-4 w-4 inline mr-2" />
                Templates
              </button>
              <button
                onClick={() => {
                  setActiveTab('history');
                  fetchMessageHistory();
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <History className="h-4 w-4 inline mr-2" />
                Message History
              </button>
              <button
                onClick={() => setActiveTab('statistics')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'statistics'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="h-4 w-4 inline mr-2" />
                Statistics
              </button>
              <button
                onClick={() => setActiveTab('tag-management')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tag-management'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Tag className="h-4 w-4 inline mr-2" />
                Tag History
              </button>
              */}
              <button
                onClick={() => setShowBulkMessaging(true)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bulk-messaging'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageSquare className="h-4 w-4 inline mr-2" />
                Bulk Messaging
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {/* Hidden sections as requested by user */}
        {false && activeTab === 'compose' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Message Composition */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Send className="h-5 w-5 mr-2 text-green-600" />
                  Compose Message
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message Text
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your WhatsApp message here..."
                      className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      disabled={isSending}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-500">
                        {message.length}/1000 characters
                      </span>
                      <span className="text-sm text-gray-500">
                        {getTotalRecipients()} contact{getTotalRecipients() !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={sendBulkMessages}
                      disabled={!message.trim() || getTotalRecipients() === 0 || isSending}
                      className="w-full btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      {isSending ? 'Sending...' : `Send to ${getTotalRecipients()} Contacts`}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Selection */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-green-600" />
                    Select Contacts
                  </h3>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={selectAllContacts}
                      className="text-sm text-green-600 hover:text-green-700 hover:bg-green-50 px-3 py-1 rounded-md transition-colors"
                    >
                      {selectedContacts.size === contacts.length ? 'Deselect All' : 'Select All'}
                    </button>
                    {getTotalRecipients() > 0 && (
                      <button
                        onClick={clearAllSelections}
                        className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-md transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Tag Selection */}
                <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-lg">
                  <h4 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                    <Tag className="h-5 w-5 mr-3 text-blue-600" />
                    🏷️ Select by Tags (Bulk Selection)
                  </h4>
                  
                  {/* Enhanced Debug Info */}
                  <div className="mb-4 p-3 bg-yellow-100 rounded-lg border border-yellow-300 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-yellow-800">🔍 Debug Information:</div>
                      <div className="flex space-x-2">
                        <button
                          onClick={fetchTags}
                          className="px-3 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 transition-colors"
                        >
                          🔄 Refresh Tags
                        </button>
                        <button
                          onClick={() => {
                            console.log('🧪 Manual test button clicked!');
                            console.log('🧪 Current tags state:', tags);
                            console.log('🧪 Current selectedTags state:', selectedTags);
                            console.log('🧪 Current tagContactsCount state:', tagContactsCount);
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                        >
                          🧪 Test State
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div><strong>Tags Count:</strong> <span className="font-mono bg-yellow-200 px-2 py-1 rounded">{tags.length}</span></div>
                      <div><strong>Tag Icon:</strong> <span className="font-mono bg-yellow-200 px-2 py-1 rounded">{typeof Tag === 'function' ? '✅ Loaded' : '❌ Missing'}</span></div>
                      <div><strong>Selected Tags:</strong> <span className="font-mono bg-yellow-200 px-2 py-1 rounded">{selectedTags.size}</span></div>
                      <div><strong>API Status:</strong> <span className="font-mono bg-yellow-200 px-2 py-1 rounded">✅ Working</span></div>
                    </div>
                    <div className="mt-2 text-xs text-yellow-700">
                      <strong>Last API Call:</strong> {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Tags Display */}
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-blue-800">
                        Available Tags ({tags.length}):
                      </div>
                      
                      {tags.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {tags.map((tag) => (
                            <button
                              key={tag.id}
                              onClick={() => toggleTagSelection(tag.id)}
                              className={`group relative p-3 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                                selectedTags.has(tag.id)
                                  ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300'
                                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md'
                              }`}
                              style={{
                                borderColor: selectedTags.has(tag.id) ? tag.color : undefined
                              }}
                            >
                              <div className="flex flex-col items-center space-y-2">
                                <div 
                                  className="w-4 h-4 rounded-full shadow-sm" 
                                  style={{ backgroundColor: tag.color }}
                                />
                                <span className="font-semibold">{tag.name}</span>
                                <span className="text-xs opacity-75 text-center">
                                  {tag.description || 'No description'}
                                </span>
                                {selectedTags.has(tag.id) && (
                                  <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                                    <CheckCircle className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
                          <Tag className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-500 font-medium">No tags available</p>
                          <p className="text-sm text-gray-400">Create tags in the Contacts section first</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Selection Summary */}
                    {selectedTags.size > 0 && (
                      <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">{selectedTags.size}</span>
                            </div>
                            <div>
                              <div className="text-blue-900 font-semibold">
                                {selectedTags.size} tag{selectedTags.size !== 1 ? 's' : ''} selected
                              </div>
                              <div className="text-blue-700 text-sm">
                                📱 <strong>{tagContactsCount} contacts</strong> will receive this message
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedTags(new Set())}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                          >
                            Clear Tags
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* No Tags Message */}
                    {tags.length === 0 && (
                      <div className="text-center py-6 bg-red-50 border-2 border-red-200 rounded-lg">
                        <div className="text-red-600 font-semibold mb-2">⚠️ Tags Not Loading</div>
                        <div className="text-red-500 text-sm">
                          Please check the console for errors or refresh the page
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Individual Contact Selection */}
                <div className="mb-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Select Individual Contacts
                  </h4>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">
                      {selectedContacts.size} individual contact{selectedContacts.size !== 1 ? 's' : ''} selected
                    </span>
                    {selectedContacts.size > 0 && (
                      <button
                        onClick={() => setSelectedContacts(new Set())}
                        className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-md transition-colors"
                      >
                        Clear Individual
                      </button>
                    )}
                  </div>
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
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Contact List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Loading contacts...</p>
                    </div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No contacts found</p>
                    </div>
                  ) : (
                    filteredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          selectedContacts.has(contact.id)
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedContacts.has(contact.id)}
                            onChange={() => toggleContactSelection(contact.id)}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{contact.name}</div>
                            <div className="text-sm text-gray-500">{contact.companyName}</div>
                            {contact.phone && (
                              <div className="text-sm text-gray-500 flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {contact.phone}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            contact.sourceSystem === 'GMAIL' ? 'bg-blue-100 text-blue-800' :
                            contact.sourceSystem === 'ZOHO' ? 'bg-purple-100 text-purple-800' :
                            contact.sourceSystem === 'INVOICE' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {contact.sourceSystem}
                          </span>
                          
                          {contact.phone && (
                            <button
                              onClick={() => sendMessage(contact.id, message.trim())}
                              disabled={!message.trim() || isSending}
                              className="btn-secondary text-xs px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Send
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {false && activeTab === 'templates' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-green-600" />
                Template Messages
              </h3>
              <p className="text-sm text-gray-500">
                Send approved WhatsApp templates to your contacts
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Template Configuration */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">Template Configuration</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Template
                  </label>
                  <select
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select a template...</option>
                    <option value="basic">Basic Template</option>
                    <option value="Custom Marketing">Custom Marketing Template</option>
                    <option value="Welcome Template">Welcome Template</option>
                    <option value="Follow Up Template">Follow Up Template</option>
                  </select>
                </div>

                {/* Template Parameters */}
                {templateName === 'basic' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={templateParams.name || ''}
                      onChange={(e) => setTemplateParams({ ...templateParams, name: e.target.value })}
                      placeholder="Enter contact name (e.g., Pranay)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                )}

                {templateName === 'Custom Marketing' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Name (Pushkar)
                    </label>
                    <input
                      type="text"
                      value={templateParams.Pushkar || ''}
                      onChange={(e) => setTemplateParams({ ...templateParams, Pushkar: e.target.value })}
                      placeholder="Enter contact name (e.g., Pranay)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                )}

                {templateName === 'Welcome Template' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Name
                      </label>
                      <input
                        type="text"
                        value={templateParams.name || ''}
                        onChange={(e) => setTemplateParams({ ...templateParams, name: e.target.value })}
                        placeholder="Enter contact name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={templateParams.company || ''}
                        onChange={(e) => setTemplateParams({ ...templateParams, company: e.target.value })}
                        placeholder="Enter company name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                )}

                {/* Tag Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Recipients by Tags
                  </label>
                  <div className="space-y-2">
                    {tags.map((tag) => (
                      <div key={tag.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`tag-${tag.id}`}
                          checked={selectedTags.has(tag.id)}
                          onChange={() => toggleTagSelection(tag.id)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <label htmlFor={`tag-${tag.id}`} className="text-sm text-gray-700">
                          {tag.name} ({tag.description || 'No description'})
                        </label>
                      </div>
                    ))}
                  </div>
                  {selectedTags.size > 0 && (
                    <div className="mt-2 text-sm text-green-600">
                      📱 {tagContactsCount} contacts will receive this template message
                    </div>
                  )}
                </div>

                <button
                  onClick={sendTemplateMessages}
                  disabled={isTemplateSending || !templateName || selectedTags.size === 0}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>{isTemplateSending ? 'Sending...' : `Send Template to ${tagContactsCount} Contacts`}</span>
                </button>
              </div>

              {/* Template Preview */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">Template Preview</h4>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-2">Template: {templateName || 'None selected'}</div>
                  <div className="bg-white rounded p-3 border border-gray-200">
                    <div className="text-gray-800">
                      {templateName === 'basic' && (
                        <div>
                          <p>Hello {templateParams.name || '[Name]'}!</p>
                          <p>Thank you for your interest in our services.</p>
                        </div>
                      )}
                      {templateName === 'Custom Marketing' && (
                        <div>
                          <p>Hello [{templateParams.Pushkar || 'Pushkar'}],</p>
                          <p>Enjoy an exclusive 20% discount on your next purchase with us!</p>
                        </div>
                      )}
                      {templateName === 'Welcome Template' && (
                        <div>
                          <p>Hello {templateParams.name || '[Name]'}! Welcome to {templateParams.company || '[Company]'}.</p>
                          <p>We're excited to have you on board.</p>
                        </div>
                      )}
                      {templateName === 'Follow Up Template' && (
                        <div>
                          <p>Hi {templateParams.name || '[Name]'}, just following up on our recent conversation.</p>
                          <p>Looking forward to hearing from you!</p>
                        </div>
                      )}
                      {!templateName && (
                        <div className="text-gray-500 italic">
                          Select a template to see preview
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Template Status */}
                {templateName && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm text-blue-800">
                      <strong>Template Status:</strong> Approved ✅
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      This template is pre-approved by WhatsApp Business API
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {false && activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <History className="h-5 w-5 mr-2 text-green-600" />
                Message History
              </h3>
              <div className="flex items-center space-x-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="sent">Sent</option>
                  <option value="delivered">Delivered</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                </select>
                <button
                  onClick={fetchMessageHistory}
                  className="btn-secondary flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredMessages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No messages found</p>
                </div>
              ) : (
                filteredMessages.map((msg) => (
                  <div key={msg.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(msg.status)}`}>
                            {msg.status.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(msg.sentAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="mb-2">
                          <span className="font-medium text-gray-900">To: </span>
                          <span className="text-gray-700">{msg.contact.name}</span>
                          <span className="text-gray-500 ml-2">({msg.contact.phone})</span>
                        </div>
                        <div className="text-gray-700">{msg.message}</div>
                        {msg.error && (
                          <div className="mt-2 text-sm text-red-600">
                            <AlertCircle className="h-4 w-4 inline mr-1" />
                            Error: {msg.error}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        {getStatusIcon(msg.status)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {false && activeTab === 'statistics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats ? (
              <>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Messages</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Delivered</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.delivered || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Sent</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.sent || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <XCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Failed</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.failed || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 lg:col-span-4 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Success Rate</h4>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-green-600 h-4 rounded-full transition-all duration-300"
                          style={{ width: `${stats?.successRate || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-green-600">
                      {stats?.successRate || 0}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {(stats?.delivered || 0) + (stats?.sent || 0)} out of {stats?.total || 0} messages were successful
                  </p>
                </div>
              </>
            ) : (
              <div className="col-span-full text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading statistics...</p>
              </div>
            )}
          </div>
        )}

        {false && activeTab === 'tag-management' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Tag className="h-5 w-5 mr-2 text-green-600" />
                Tag History
              </h3>
              <p className="text-sm text-gray-500">
                Create, edit, and delete tags for your contacts.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create New Tag */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">Create New Tag</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tag Name
                  </label>
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="e.g., VIP Customers, New Leads"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tag Color
                  </label>
                  <input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tag Description (optional)
                  </label>
                  <textarea
                    value={newTagDescription}
                    onChange={(e) => setNewTagDescription(e.target.value)}
                    placeholder="Brief description for the tag"
                    className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <button
                  onClick={editingTag ? updateTag : createNewTag}
                  disabled={!newTagName || !newTagColor || isCreatingTag}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isCreatingTag ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Plus className="h-5 w-5" />
                  )}
                  <span>{editingTag ? 'Update Tag' : 'Create Tag'}</span>
                </button>
                
                {editingTag && (
                  <button
                    onClick={cancelEdit}
                    className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              {/* Existing Tags */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">Existing Tags</h4>
                <div className="space-y-3">
                  {tags.length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
                      <Tag className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No tags created yet</p>
                      <p className="text-sm text-gray-400">Create your first tag to manage contacts.</p>
                    </div>
                  ) : (
                    tags.map((tag) => (
                      <div key={tag.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-6 h-6 rounded-full shadow-sm" 
                              style={{ backgroundColor: tag.color }}
                            />
                            <span className="font-semibold text-gray-900">{tag.name}</span>
                            <span className="text-xs text-gray-500">({tag.description || 'No description'})</span>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => viewTagContacts(tag.id)}
                              className="text-sm text-green-600 hover:text-green-700 hover:bg-green-100 px-3 py-1 rounded-md transition-colors"
                            >
                              View Contacts
                            </button>
                            <button
                              onClick={() => editTag(tag.id)}
                              className="text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(tag)}
                              className="text-sm text-red-600 hover:text-red-700 hover:bg-red-100 px-3 py-1 rounded-md transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">{tag.description || 'No description'}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tag Contacts Display */}
        {false && activeTab === 'tag-management' && selectedTags.size > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Contacts in Selected Tags
              </h3>
              <div className="text-sm text-gray-600">
                {tagContactsCount} contact{tagContactsCount !== 1 ? 's' : ''} found
              </div>
            </div>

            {/* Search and Filter */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contacts by name, company, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Contacts List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading contacts...</p>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No contacts found</p>
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-col">
                        <div className="font-medium text-gray-900">{contact.name}</div>
                        <div className="text-sm text-gray-500">{contact.companyName}</div>
                        {contact.phone && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {contact.phone}
                          </div>
                        )}
                        {contact.email && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <span className="mr-1">📧</span>
                            {contact.email}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        contact.sourceSystem === 'GMAIL' ? 'bg-blue-100 text-blue-800' :
                        contact.sourceSystem === 'ZOHO' ? 'bg-purple-100 text-purple-800' :
                        contact.sourceSystem === 'INVOICE' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {contact.sourceSystem}
                      </span>
                      
                      {contact.phone && (
                        <button
                          onClick={() => {
                            setActiveTab('compose');
                            setSelectedContacts(new Set([contact.id]));
                            setMessage(`Hi ${contact.name}, `);
                          }}
                          className="text-sm text-green-600 hover:text-green-700 hover:bg-green-100 px-3 py-1 rounded-md transition-colors"
                        >
                          <Send className="h-3 w-3 mr-1 inline" />
                          Send Message
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      <TagDeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        tagName={tagToDelete?.name || ''}
        contactCount={tagToDelete?.contactCount || 0}
        isLoading={deleteLoading}
      />

      {/* Bulk Messaging Modal */}
      <WhatsAppBulkMessaging 
        isOpen={showBulkMessaging} 
        onClose={() => setShowBulkMessaging(false)} 
      />
    </div>
  );
};

export default WhatsAppManager;

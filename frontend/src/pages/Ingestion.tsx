import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Database, Play, CheckCircle, AlertCircle, Clock, RefreshCw, X, Mail, ChevronDown, ChevronRight } from 'lucide-react';
import { ingestionAPI } from '../services/api';

interface MailAccount {
  id: string;
  name: string;
  email: string;
  serviceType: string;
  isActive: boolean;
  isEncrypted: boolean;
  lastSync: string;
  syncStatus: string;
  createdAt: string;
  updatedAt: string;
}

const Ingestion: React.FC = () => {
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedMailAccount, setSelectedMailAccount] = useState<string>('');
  const [mailAccounts, setMailAccounts] = useState<MailAccount[]>([]);
  const [expandedMailContacts, setExpandedMailContacts] = useState<boolean>(false);
  const [gmailSyncType, setGmailSyncType] = useState<'gmail-contacts-only' | 'all-contacts'>('gmail-contacts-only');

  const { data: latestImport, refetch } = useQuery({
    queryKey: ['latestImport'],
    queryFn: () => ingestionAPI.getLatestImport(),
  });

  // Fetch mail accounts for Gmail integration
  const fetchMailAccounts = async () => {
    try {
      console.log('Fetching mail accounts...');
      
      // Add cache-busting timestamp to force fresh request
      const timestamp = Date.now();
      const url = `http://localhost:4002/api/mail-accounts?t=${timestamp}`;
      console.log('Calling API URL:', url);
      
      const response = await fetch(url);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Response URL:', response.url);
      
      // Log the raw response text first
      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      if (response.ok) {
        try {
          const result = JSON.parse(responseText);
          console.log('Mail accounts API response:', result);
          if (result.success) {
            // Filter for active mail accounts (Gmail, Outlook, Yahoo, Zoho)
            const mailServiceAccounts = result.data.filter((acc: MailAccount) => 
              ['GMAIL', 'OUTLOOK', 'YAHOO', 'ZOHO'].includes(acc.serviceType) && acc.isActive
            );
            console.log('Filtered mail service accounts:', mailServiceAccounts);
            setMailAccounts(mailServiceAccounts);
          } else {
            console.error('API returned success: false');
            setMailAccounts([]);
          }
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError);
          console.error('Response text was:', responseText);
          setMailAccounts([]);
        }
      } else {
        console.error('Response not ok:', response.status, response.statusText);
        console.error('Error response body:', responseText);
        setMailAccounts([]);
      }
    } catch (err) {
      console.error('Failed to fetch mail accounts:', err);
      setMailAccounts([]);
    }
  };

  useEffect(() => {
    // Add a small delay to ensure backend is ready
    const timer = setTimeout(() => {
      fetchMailAccounts();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setErrorMessage(null);
    // Auto-hide after 5 seconds
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const showErrorMessage = (message: string) => {
    setErrorMessage(message);
    setSuccessMessage(null);
    // Auto-hide after 5 seconds
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const runGmailMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMailAccount) {
        throw new Error('Please select a Gmail account first');
      }
      
      // Log the selected account for debugging
      console.log('Using Gmail account:', selectedMailAccount);
      
      // Get the selected account details
      const selectedAcc = mailAccounts.find(acc => acc.id === selectedMailAccount);
      if (!selectedAcc) {
        throw new Error('Selected account not found');
      }
      
      // Call the backend ingestion API for Gmail
      const timestamp = Date.now();
      const response = await fetch(`http://localhost:4002/ingestion/gmail/run?t=${timestamp}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'my-secret-api-key-123',
        },
        body: JSON.stringify({
          accountId: selectedMailAccount,
          accountEmail: selectedAcc.email,
          syncType: gmailSyncType
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start Gmail ingestion');
      }

      const result = await response.json();
      return result;
    },
    onSuccess: (response) => {
      setIsRunning(null);
      refetch();
      const total = response.total || 0;
      const syncTypeText = gmailSyncType === 'gmail-contacts-only' ? 'Gmail contacts' : 'contacts';
      showSuccessMessage(`✅ Gmail contacts synced to staging successfully! ${total} ${syncTypeText} ready for processing.`);
    },
    onError: (error: any) => {
      setIsRunning(null);
      showErrorMessage(`❌ Gmail contacts import failed: ${error.message}`);
    },
  });

  const runOutlookMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMailAccount) {
        throw new Error('Please select an Outlook account first');
      }
      
      const selectedAcc = mailAccounts.find(acc => acc.id === selectedMailAccount);
      if (!selectedAcc) {
        throw new Error('Selected account not found');
      }
      
      // Call the backend ingestion API for Outlook
      const timestamp = Date.now();
      const response = await fetch(`http://localhost:4002/ingestion/outlook/run?t=${timestamp}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'my-secret-api-key-123',
        },
        body: JSON.stringify({
          accountId: selectedMailAccount,
          accountEmail: selectedAcc.email
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start Outlook ingestion');
      }

      const result = await response.json();
      return result;
    },
    onSuccess: (response) => {
      setIsRunning(null);
      refetch();
      const total = response.total || 0;
      showSuccessMessage(`✅ Outlook contacts synced to staging successfully! ${total} contacts ready for processing.`);
    },
    onError: (error: any) => {
      setIsRunning(null);
      showErrorMessage(`❌ Outlook contacts import failed: ${error.message}`);
    },
  });

  const runYahooMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMailAccount) {
        throw new Error('Please select a Yahoo account first');
      }
      
      const selectedAcc = mailAccounts.find(acc => acc.id === selectedMailAccount);
      if (!selectedAcc) {
        throw new Error('Selected account not found');
      }
      
      // Call the backend ingestion API for Yahoo
      const timestamp = Date.now();
      const response = await fetch(`http://localhost:4002/ingestion/yahoo/run?t=${timestamp}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'my-secret-api-key-123',
        },
        body: JSON.stringify({
          accountId: selectedMailAccount,
          accountEmail: selectedAcc.email
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start Yahoo ingestion');
      }

      const result = await response.json();
      return result;
    },
    onSuccess: (response) => {
      setIsRunning(null);
      refetch();
      const total = response.total || 0;
      showSuccessMessage(`✅ Yahoo contacts synced to staging successfully! ${total} contacts ready for processing.`);
    },
    onError: (error: any) => {
      setIsRunning(null);
      showErrorMessage(`❌ Yahoo contacts import failed: ${error.message}`);
    },
  });

  const runZohoMailMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMailAccount) {
        throw new Error('Please select a Zoho account first');
      }
      
      const selectedAcc = mailAccounts.find(acc => acc.id === selectedMailAccount);
      if (!selectedAcc) {
        throw new Error('Selected account not found');
      }
      
      // Call the backend ingestion API for Zoho
      const timestamp = Date.now();
      const response = await fetch(`http://localhost:4002/ingestion/zoho/run?t=${timestamp}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'my-secret-api-key-123',
        },
        body: JSON.stringify({
          accountId: selectedMailAccount,
          accountEmail: selectedAcc.email
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start Zoho ingestion');
      }

      const result = await response.json();
      return result;
    },
    onSuccess: (response) => {
      setIsRunning(null);
      refetch();
      const total = response.total || 0;
      showSuccessMessage(`✅ Zoho contacts synced to staging successfully! ${total} contacts ready for processing.`);
    },
    onError: (error: any) => {
      setIsRunning(null);
      showErrorMessage(`❌ Zoho contacts import failed: ${error.message}`);
    },
  });

  const runZohoCRMMutation = useMutation({
    mutationFn: () => ingestionAPI.runZoho(),
    onSuccess: (response) => {
      setIsRunning(null);
      refetch();
      const total = response.data?.total || 0;
      showSuccessMessage(`✅ Zoho CRM synced to staging successfully! ${total} contacts ready for processing.`);
    },
    onError: (error: any) => {
      setIsRunning(null);
      showErrorMessage(`❌ Zoho CRM import failed: ${error.message}`);
    },
  });

  const runInvoiceMutation = useMutation({
    mutationFn: () => ingestionAPI.runInvoice(),
    onSuccess: (response) => {
      setIsRunning(null);
      refetch();
      const total = response.data?.total || 0;
      showSuccessMessage(`✅ Invoice system synced to staging successfully! ${total} contacts ready for processing.`);
    },
    onError: (error: any) => {
      setIsRunning(null);
      showErrorMessage(`❌ Invoice system import failed: ${error.message}`);
    },
  });

  const runMobileMutation = useMutation({
    mutationFn: () => ingestionAPI.runMobile(),
    onSuccess: (response) => {
      setIsRunning(null);
      refetch();
      const total = response.data?.total || 0;
      showSuccessMessage(`✅ Mobile contacts synced to staging successfully! ${total} contacts ready for processing.`);
    },
    onError: (error: any) => {
      setIsRunning(null);
      showErrorMessage(`❌ Mobile contacts import failed: ${error.message}`);
    },
  });

  const cleanAndMergeMutation = useMutation({
    mutationFn: () => ingestionAPI.cleanAndMerge(),
    onSuccess: (response) => {
      setIsRunning(null);
      refetch();
      
      // Invalidate and refetch all contact-related queries to refresh the contacts page automatically
      console.log('🔄 Invalidating contact queries after clean and merge...');
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey;
          const shouldInvalidate = Array.isArray(queryKey) && 
                 queryKey.length > 0 && 
                 typeof queryKey[0] === 'string' && 
                 queryKey[0].toLowerCase().includes('contact');
          if (shouldInvalidate) {
            console.log('🔄 Invalidating query:', queryKey);
          }
          return shouldInvalidate;
        }
      });
      
      // Force refetch of contact queries
      queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey;
          return Array.isArray(queryKey) && 
                 queryKey.length > 0 && 
                 typeof queryKey[0] === 'string' && 
                 queryKey[0].toLowerCase().includes('contact');
        }
      });
      console.log('✅ Contact queries invalidation and refetch completed');
      
      // Also trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('contactsUpdated'));
      
      // Use only inserted contacts as these are the actual new clean and merged contacts
      const cleanAndMergedCount = response.data?.inserted || 0;
      showSuccessMessage(`✅ Data cleaning and merging completed successfully! ${cleanAndMergedCount} contacts clean and merged.`);
    },
    onError: (error: any) => {
      setIsRunning(null);
      showErrorMessage(`❌ Data cleaning and merging failed: ${error.message}`);
    },
  });

  const ingestionSources = [
    // Zoho CRM sync hidden as requested
    // {
    //   id: 'zoho',
    //   name: 'Zoho CRM',
    //   description: 'Import contacts and leads from Zoho CRM',
    //   icon: Database,
    //   color: 'bg-blue-500',
    //   mutation: runZohoCRMMutation,
    // },
    {
      id: 'mail-contacts',
      name: 'Mail Contacts',
      description: 'Import contacts from various mail services',
      icon: Mail,
      color: 'bg-purple-500',
      requiresMailAccount: true,
      subServices: [
        {
          id: 'gmail',
          name: 'Gmail Contacts',
          description: 'Import contacts from Gmail address book',
          color: 'bg-red-500',
          mutation: runGmailMutation,
        },
                 // Outlook, Yahoo, and Zoho contacts hidden as requested
         // {
         //   id: 'outlook',
         //   name: 'Outlook Contacts',
         //   description: 'Import contacts from Outlook address book',
         //   color: 'bg-blue-500',
         //   mutation: runOutlookMutation,
         // },
         // {
         //   id: 'yahoo',
         //   name: 'Yahoo Contacts',
         //   description: 'Import contacts from Yahoo address book',
         //   color: 'bg-yellow-500',
         //   mutation: runYahooMutation,
         // },
         // {
         //   id: 'zoho',
         //   name: 'Zoho Contacts',
         //   description: 'Import contacts from Zoho address book',
         //   color: 'bg-orange-500',
         //   mutation: runZohoMailMutation,
         // },
      ],
    },
    {
      id: 'invoice',
      name: 'Invoice System',
      description: 'Import customer data from invoice system',
      icon: Database,
      color: 'bg-green-500',
      mutation: runInvoiceMutation,
    },
    {
      id: 'mobile',
      name: 'Mobile Contacts',
      description: 'Import contacts from mobile device',
      icon: Database,
      color: 'bg-purple-500',
      mutation: runMobileMutation,
    },
  ];

  const handleRunIngestion = (sourceId: string) => {
    if (sourceId === 'gmail' || sourceId === 'outlook' || sourceId === 'yahoo' || sourceId === 'zoho') {
      // For Gmail, Outlook, Yahoo, Zoho, we'll handle it directly in the UI, no modal needed
      return;
    }

    setIsRunning(sourceId);
    const source = ingestionSources.find(s => s.id === sourceId);
    if (source && source.mutation) {
      source.mutation.mutate();
    }
  };

  const handleGmailIngestion = () => {
    if (!selectedMailAccount) {
      showErrorMessage('Please select a Gmail account first');
      return;
    }
    
    setIsRunning('gmail');
    runGmailMutation.mutate();
  };

  const handleOutlookIngestion = () => {
    if (!selectedMailAccount) {
      showErrorMessage('Please select an Outlook account first');
      return;
    }
    
    setIsRunning('outlook');
    runOutlookMutation.mutate();
  };

  const handleYahooIngestion = () => {
    if (!selectedMailAccount) {
      showErrorMessage('Please select a Yahoo account first');
      return;
    }
    
    setIsRunning('yahoo');
    runYahooMutation.mutate();
  };

  const handleZohoIngestion = () => {
    if (!selectedMailAccount) {
      showErrorMessage('Please select a Zoho account first');
      return;
    }
    
    setIsRunning('zoho');
    runZohoMailMutation.mutate();
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'running':
        return 'Running';
      default:
        return 'Not Started';
    }
  };

  // Helper function to render mail account selection UI
  const renderMailAccountSelection = (source: any, isRunning: string | null, mutation: any) => {
    const serviceType = source.id === 'gmail' ? 'GMAIL' : 
                       source.id === 'outlook' ? 'OUTLOOK' : 
                       source.id === 'yahoo' ? 'YAHOO' : 'ZOHO';
    const filteredAccounts = mailAccounts.filter(acc => acc.serviceType === serviceType);
    
    if (filteredAccounts.length === 0) {
      return (
        <div className="text-center py-3">
          <p className="text-sm text-gray-600 mb-2">No {source.name} accounts available</p>
          <a
            href="/mail-accounts"
            className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Add {source.name} Account
          </a>
        </div>
      );
    }
    
    return (
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Select {source.name} Account:
          </label>
          
          <select
            value={selectedMailAccount}
            onChange={(e) => setSelectedMailAccount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">Choose a {source.name} account...</option>
            {filteredAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.email})
              </option>
            ))}
          </select>
          
          {/* Gmail Sync Type Selector */}
          {source.id === 'gmail' && selectedMailAccount && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sync Type:
              </label>
              <select
                value={gmailSyncType}
                onChange={(e) => setGmailSyncType(e.target.value as 'gmail-contacts-only' | 'all-contacts')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="gmail-contacts-only">🔒 Gmail Contacts Only</option>
                <option value="all-contacts">📧 All Contacts (Previous Behavior)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {gmailSyncType === 'gmail-contacts-only' 
                  ? 'Only imports contacts from Gmail address book'
                  : 'Imports all contacts (previous behavior)'
                }
              </p>
            </div>
          )}
          
          {selectedMailAccount && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-600">
                ✓ {filteredAccounts.find(acc => acc.id === selectedMailAccount)?.email} selected
              </span>
              <button
                onClick={source.id === 'gmail' ? handleGmailIngestion : 
                        source.id === 'outlook' ? handleOutlookIngestion : 
                        source.id === 'yahoo' ? handleYahooIngestion : handleZohoIngestion}
                disabled={isRunning || mutation.isPending}
                className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning || mutation.isPending ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 mr-1" />
                    Start Sync
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Success Notification */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{errorMessage}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setErrorMessage(null)}
                  className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Sync</h1>
        <p className="text-gray-600">Import and sync data from various sources</p>
      </div>

      {/* Sync Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ingestionSources.map((source) => {
          const Icon = source.icon;
          const isCurrentlyRunning = isRunning === source.id;
          
          // Handle mail contacts with submenu
          if (source.id === 'mail-contacts' && source.subServices) {
            return (
              <div key={source.id} className="bg-white shadow rounded-lg p-6">
                <div 
                  className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200"
                  onClick={() => setExpandedMailContacts(!expandedMailContacts)}
                >
                  <div className="flex items-center">
                    <div className={`${source.color} p-2 rounded-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">{source.name}</h3>
                      <p className="text-sm text-gray-500">{source.description}</p>
                      <p className="text-sm text-blue-500 mt-1">
                        📧 {expandedMailContacts ? 'Click to collapse' : 'Click to expand'} - Multiple mail services available
                      </p>
                    </div>
                  </div>
                  
                  {/* Expand/Collapse indicator */}
                  <div className="flex items-center">
                    <div className="text-gray-500 transition-transform duration-200">
                      {expandedMailContacts ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      {expandedMailContacts ? 'Collapse' : 'Expand'}
                    </span>
                  </div>
                </div>

                {/* Submenu for mail services - only show when expanded */}
                {expandedMailContacts && (
                  <div className="space-y-3 border-t border-gray-200 pt-4 animate-in slide-in-from-top-2 duration-200">
                    {source.subServices.map((subService) => {
                      const isSubRunning = isRunning === subService.id;
                      
                      return (
                        <div key={subService.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:shadow-md transition-all duration-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <div className={`${subService.color} p-2 rounded-lg`}>
                                <Mail className="h-5 w-5 text-white" />
                              </div>
                              <div className="ml-3">
                                               <h4 className="text-md font-medium text-gray-900">{subService.name}</h4>
               <p className="text-sm text-gray-500">{subService.description}</p>
               {subService.id === 'gmail' && (
                 <p className="text-xs text-blue-600 mt-1">
                   🔒 Default: Only imports contacts from Gmail address book
                 </p>
               )}
                              </div>
                            </div>
                          </div>

                          {/* Account selection for this sub-service */}
                          {renderMailAccountSelection(subService, isRunning, subService.mutation)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Handle regular sources
          return (
            <div key={source.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`${source.color} p-2 rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">{source.name}</h3>
                    <p className="text-sm text-gray-500">{source.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleRunIngestion(source.id)}
                    disabled={isCurrentlyRunning || source.mutation?.isPending}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCurrentlyRunning || source.mutation?.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Import
                      </>
                    )}
                  </button>

                  <div className="flex items-center text-sm text-gray-500">
                    {getStatusIcon(source.mutation?.data?.data?.status)}
                    <span className="ml-2">{getStatusText(source.mutation?.data?.data?.status)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Clean and Merge */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Clean and Merge</h3>
            <p className="text-sm text-gray-500">
              Clean duplicate contacts and merge data from all sources
            </p>
          </div>
          <button
            onClick={() => {
              setIsRunning('clean-merge');
              cleanAndMergeMutation.mutate();
            }}
            disabled={isRunning === 'clean-merge' || cleanAndMergeMutation.isPending}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning === 'clean-merge' || cleanAndMergeMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Clean & Merge
              </>
            )}
          </button>
        </div>
      </div>

      {/* Latest Import Status - Hidden as requested */}
      {/* <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Latest Import Status</h3>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>

          {latestImport?.data ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Source</dt>
                  <dd className="mt-1 text-sm text-gray-900">{latestImport.data.source || 'Unknown'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 flex items-center text-sm text-gray-900">
                    {getStatusIcon(latestImport.data.status)}
                    <span className="ml-2">{getStatusText(latestImport.data.status)}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Run</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {latestImport.data.timestamp ? new Date(latestImport.data.timestamp).toLocaleString() : 'Unknown'}
                  </dd>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Database className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No import history</h3>
              <p className="mt-1 text-sm text-gray-500">
                Run your first import to see status here
              </p>
            </div>
          )}
        </div>
      </div> */}
    </div>
  );
};

export default Ingestion;

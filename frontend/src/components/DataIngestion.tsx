import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Download, 
  RefreshCw, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  Users,
  FileText,
  AlertCircle
} from 'lucide-react';

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

interface IngestionJob {
  id: string;
  accountId: string;
  accountName: string;
  accountEmail: string;
  serviceType: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  startTime: string;
  emailsProcessed: number;
  contactsExtracted: number;
  errors: number;
}

const DataIngestion: React.FC = () => {
  const [mailAccounts, setMailAccounts] = useState<MailAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isStartingJob, setIsStartingJob] = useState<boolean>(false);
  const [ingestionJobs, setIngestionJobs] = useState<IngestionJob[]>([]);
  const [gmailSyncType, setGmailSyncType] = useState<'gmail-contacts-only' | 'all-contacts'>('gmail-contacts-only');

  useEffect(() => {
    // Add a small delay to ensure backend is ready
    const timer = setTimeout(() => {
      fetchMailAccounts();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    console.log('mailAccounts state changed:', mailAccounts);
    console.log('mailAccounts length:', mailAccounts.length);
  }, [mailAccounts]);

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
            // Filter for Gmail accounts only and active accounts
            const gmailAccounts = result.data.filter((acc: MailAccount) => 
              acc.serviceType === 'GMAIL' && acc.isActive
            );
            console.log('Filtered Gmail accounts:', gmailAccounts);
            setMailAccounts(gmailAccounts);
          } else {
            setError('Failed to fetch mail accounts');
          }
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError);
          console.error('Response text was:', responseText);
          setError('Invalid JSON response from server');
        }
      } else {
        console.error('Response not ok:', response.status, response.statusText);
        console.error('Error response body:', responseText);
        setError(`Failed to fetch mail accounts: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error fetching mail accounts:', err);
      setError('Failed to fetch mail accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartIngestion = async () => {
    if (!selectedAccount) {
      setError('Please select a mail account first');
      return;
    }

    setIsStartingJob(true);
    setError('');
    setSuccess('');

    try {
      // Call the backend ingestion API for Gmail
      const timestamp = Date.now();
      const response = await fetch(`http://localhost:4002/ingestion/gmail/run?t=${timestamp}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'my-secret-api-key-123',
        },
        body: JSON.stringify({
          accountId: selectedAccount,
          accountEmail: mailAccounts.find((acc: MailAccount) => acc.id === selectedAccount)?.email,
          syncType: gmailSyncType
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        const selectedAcc = mailAccounts.find((acc: MailAccount) => acc.id === selectedAccount);
        if (!selectedAcc) throw new Error('Selected account not found');

        const newJob: IngestionJob = {
          id: Date.now().toString(),
          accountId: selectedAccount,
          accountName: selectedAcc.name,
          accountEmail: selectedAcc.email,
          serviceType: selectedAcc.serviceType,
          status: 'running',
          progress: 0,
          startTime: new Date().toISOString(),
          emailsProcessed: 0,
          contactsExtracted: 0,
          errors: 0
        };

        setIngestionJobs((prev: IngestionJob[]) => [newJob, ...prev]);
        const syncTypeText = gmailSyncType === 'gmail-contacts-only' ? 'Only Gmail contacts will be imported' : 'All contacts will be imported';
        setSuccess(`Gmail contacts sync started for ${selectedAcc.name} (${selectedAcc.email}) - ${syncTypeText}`);
        
        // Start progress simulation
        simulateProgress(newJob.id);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start ingestion');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start data ingestion');
    } finally {
      setIsStartingJob(false);
    }
  };

  const simulateProgress = (jobId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        setIngestionJobs((prev: IngestionJob[]) => 
          prev.map((job: IngestionJob) => 
            job.id === jobId 
              ? { ...job, status: 'completed', progress: 100, contactsExtracted: Math.floor(Math.random() * 50) + 10 }
              : job
          )
        );
      } else {
        setIngestionJobs((prev: IngestionJob[]) => 
          prev.map((job: IngestionJob) => 
            job.id === jobId 
              ? { ...job, progress: Math.floor(progress) }
              : job
          )
        );
      }
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'paused': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'paused': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Sync</h1>
        <p className="text-gray-600">Import contacts and data from various sources</p>
      </div>

      {/* Gmail Contacts Ingestion Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Mail className="w-8 h-8 text-red-500" />
                         <div>
               <h2 className="text-xl font-semibold text-gray-900">Gmail Contacts Sync</h2>
               <p className="text-gray-600">Import contacts from Gmail accounts</p>
               <p className="text-xs text-blue-600 mt-1">
                 🔒 Default: Only imports contacts from Gmail address book
               </p>
             </div>
          </div>
          <button
            onClick={fetchMailAccounts}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Debug Information */}
        <div className="mb-4 p-3 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Debug Info:</strong> Found {mailAccounts.length} Gmail accounts
          </p>
          {mailAccounts.length > 0 && (
            <div className="mt-2 text-xs text-gray-600">
              <strong>Accounts:</strong>
              {mailAccounts.map((acc: MailAccount) => (
                <div key={acc.id}>• {acc.name} ({acc.email})</div>
              ))}
            </div>
          )}
        </div>

        {/* Account Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Gmail Account
          </label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={mailAccounts.length === 0}
          >
            <option value="">{mailAccounts.length === 0 ? 'No Gmail accounts available' : 'Choose an account'}</option>
            {mailAccounts.map((account: MailAccount) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.email})
              </option>
            ))}
          </select>
        </div>

        {/* Gmail Sync Type Selection */}
        {selectedAccount && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sync Type:
            </label>
            <select
              value={gmailSyncType}
              onChange={(e) => setGmailSyncType(e.target.value as 'gmail-contacts-only' | 'all-contacts')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* Start Ingestion Button */}
        <button
          onClick={handleStartIngestion}
          disabled={!selectedAccount || isStartingJob}
          className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-5 h-5" />
          <span>{isStartingJob ? 'Starting...' : 'Start Sync'}</span>
        </button>

        {/* Error and Success Messages */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}
      </div>

      {/* Active Ingestion Jobs */}
      {ingestionJobs.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Sync Jobs</h3>
          <div className="space-y-4">
            {ingestionJobs.map((job: IngestionJob) => (
              <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(job.status)}
                    <span className={`font-medium ${getStatusColor(job.status)}`}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    Started: {new Date(job.startTime).toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{job.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${job.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-gray-500">Account</div>
                    <div className="font-medium">{job.accountName}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500">Email</div>
                    <div className="font-medium">{job.accountEmail}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500">Contacts</div>
                    <div className="font-medium">{job.contactsExtracted}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500">Errors</div>
                    <div className="font-medium">{job.errors}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataIngestion;

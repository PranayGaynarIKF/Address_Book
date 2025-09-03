import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Mail, 
  FileText, 
  Database, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  TestTube,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { dataSourceAPI } from '../services/dataSourceAPI';
import DataSourceModals from './DataSourceModals';

interface GmailAccount {
  id: string;
  email: string;
  isActive: boolean;
  lastSync: string;
  contactCount: number;
}

interface VcfFile {
  id: string;
  filename: string;
  size: number;
  uploadedAt: string;
  contactCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface InvoiceDatabase {
  id: string;
  name: string;
  server: string;
  database: string;
  isConnected: boolean;
  lastSync: string;
  contactCount: number;
}

const DataSourceManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'gmail' | 'vcf' | 'invoice'>('gmail');
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [isVcfModalOpen, setIsVcfModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Gmail Accounts - using the existing mail accounts API
  const { data: gmailAccounts, isLoading: gmailLoading } = useQuery({
    queryKey: ['gmail-accounts'],
    queryFn: async () => {
      const response = await fetch('http://localhost:4002/api/mail-accounts', {
        headers: { 'accept': '*/*' }
      });
      if (!response.ok) throw new Error('Failed to fetch Gmail accounts');
      const data = await response.json();
      // Filter only Gmail accounts
      return {
        data: data.data?.filter((account: any) => account.serviceType === 'GMAIL') || []
      };
    },
  });

  // VCF Files
  const { data: vcfFiles, isLoading: vcfLoading } = useQuery({
    queryKey: ['vcf-files'],
    queryFn: () => dataSourceAPI.getVcfFiles(),
  });

  // Invoice Databases
  const { data: invoiceDatabases, isLoading: invoiceLoading } = useQuery({
    queryKey: ['invoice-databases'],
    queryFn: () => dataSourceAPI.getInvoiceDatabases(),
  });

  // Gmail mutations
  const addGmailMutation = useMutation({
    mutationFn: async (data: { email: string; clientId: string; clientSecret: string }) => {
      // Create mail account first
      const createResponse = await fetch('http://localhost:4002/api/mail-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': '*/*'
        },
        body: JSON.stringify({
          name: data.email,
          email: data.email,
          serviceType: 'GMAIL',
          clientId: data.clientId,
          clientSecret: data.clientSecret,
          redirectUri: 'http://localhost:4002/api/mail-accounts/oauth-callback',
          password: 'oauth'
        })
      });
      
      if (!createResponse.ok) {
        throw new Error('Failed to create Gmail account');
      }
      
      const accountData = await createResponse.json();
      
      // Then initiate OAuth flow via mail-accounts endpoint
      const oauthResponse = await fetch('http://localhost:4002/api/mail-accounts/google-oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': '*/*'
        },
        body: JSON.stringify({
          email: data.email,
          clientId: data.clientId,
          clientSecret: data.clientSecret,
          redirectUri: 'http://localhost:4002/api/mail-accounts/oauth-callback'
        })
      });
      
      if (!oauthResponse.ok) {
        throw new Error('Failed to initiate OAuth');
      }
      
      const oauthData = await oauthResponse.json();
      const oauthUrl = oauthData.data?.oauthUrl || oauthData.oauthUrl;
      return { account: accountData, oauthUrl };
    },
    onSuccess: (data) => {
      // Open OAuth URL in new window
      window.open(data.oauthUrl, '_blank', 'width=600,height=700');
      queryClient.invalidateQueries({ queryKey: ['gmail-accounts'] });
      setIsGmailModalOpen(false);
    },
  });

  const syncGmailMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const response = await fetch(`http://localhost:4002/api/mail-accounts/${accountId}/sync`, {
        method: 'POST',
        headers: { 'accept': '*/*' }
      });
      if (!response.ok) throw new Error('Failed to sync Gmail contacts');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gmail-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  // VCF mutations
  const uploadVcfMutation = useMutation({
    mutationFn: (file: File) => dataSourceAPI.uploadVcfFile(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vcf-files'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  const processVcfMutation = useMutation({
    mutationFn: (fileId: string) => dataSourceAPI.processVcfFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vcf-files'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  // Invoice database mutations
  const addInvoiceDbMutation = useMutation({
    mutationFn: (data: { name: string; server: string; database: string; username: string; password: string; useWindowsAuth: boolean }) =>
      dataSourceAPI.addInvoiceDatabase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-databases'] });
      setIsInvoiceModalOpen(false);
    },
  });

  const syncInvoiceMutation = useMutation({
    mutationFn: (dbId: string) => dataSourceAPI.syncInvoiceContacts(dbId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-databases'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.vcf')) {
      uploadVcfMutation.mutate(file);
    }
  };

  const renderGmailTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Gmail Accounts</h3>
        <button
          onClick={() => setIsGmailModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={16} />
          Connect Gmail Account
        </button>
      </div>

      {gmailLoading ? (
        <div className="text-center py-8">Loading Gmail accounts...</div>
      ) : gmailAccounts?.data?.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Gmail accounts connected</h3>
          <p className="text-gray-600 mb-4">Connect your Gmail account to start syncing contacts</p>
          <button
            onClick={() => setIsGmailModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Connect Your First Gmail Account
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {gmailAccounts?.data?.map((account: any) => (
            <div key={account.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <Mail className="text-blue-600" size={20} />
                <div className="flex-1">
                  <h4 className="font-medium">{account.email}</h4>
                  <p className="text-sm text-gray-600">
                    {account.syncStatus === 'success' ? 'Connected' : 'Not Connected'}
                  </p>
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  account.isActive && account.syncStatus === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`} />
              </div>
              
              <div className="text-sm text-gray-600 mb-3">
                <p>Service: {account.serviceType}</p>
                {account.lastSync && (
                  <p>Last sync: {new Date(account.lastSync).toLocaleDateString()}</p>
                )}
                <p>Status: <span className="capitalize">{account.syncStatus || 'pending'}</span></p>
              </div>

              <div className="flex gap-2">
                {account.syncStatus === 'success' ? (
                  <button
                    onClick={() => syncGmailMutation.mutate(account.id)}
                    disabled={syncGmailMutation.isPending}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    {syncGmailMutation.isPending ? 'Syncing...' : 'Sync Contacts'}
                  </button>
                ) : (
                  <button
                    onClick={() => setIsGmailModalOpen(true)}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                  >
                    Complete Setup
                  </button>
                )}
                <button className="px-3 py-2 border rounded text-sm hover:bg-gray-50">
                  <Edit size={14} />
                </button>
                <button className="px-3 py-2 border rounded text-sm hover:bg-gray-50 text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSyncTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Upload className="text-green-600" size={24} />
          <div>
            <h3 className="text-lg font-semibold">Gmail Contacts Sync</h3>
            <p className="text-gray-600">Sync contacts from your connected Gmail accounts</p>
          </div>
        </div>

        {gmailLoading ? (
          <div className="text-center py-8">Loading Gmail accounts...</div>
        ) : gmailAccounts?.data?.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Gmail accounts connected</h3>
            <p className="text-gray-600 mb-4">Connect a Gmail account first to sync contacts</p>
            <button
              onClick={() => setActiveTab('gmail')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Go to Gmail Accounts
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {gmailAccounts?.data?.map((account: any) => (
                <div key={account.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-3 mb-3">
                    <Mail className="text-blue-600" size={20} />
                    <div className="flex-1">
                      <h4 className="font-medium">{account.email}</h4>
                      <p className="text-sm text-gray-600">
                        {account.syncStatus === 'success' ? 'Ready to sync' : 'Setup required'}
                      </p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      account.isActive && account.syncStatus === 'success' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-3">
                    <p>Service: {account.serviceType}</p>
                    {account.lastSync && (
                      <p>Last sync: {new Date(account.lastSync).toLocaleDateString()}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {account.syncStatus === 'success' ? (
                      <button
                        onClick={() => syncGmailMutation.mutate(account.id)}
                        disabled={syncGmailMutation.isPending}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        {syncGmailMutation.isPending ? 'Syncing...' : 'Sync Now'}
                      </button>
                    ) : (
                      <button
                        onClick={() => setActiveTab('gmail')}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                      >
                        Complete Setup
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Sync Options */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Sync Options</h4>
              <div className="space-y-2 text-sm text-blue-800">
                <p>• <strong>Gmail Contacts Only:</strong> Syncs only contacts from Gmail address book</p>
                <p>• <strong>All Contacts:</strong> Syncs all contacts from Gmail (previous behavior)</p>
                <p>• <strong>Incremental Sync:</strong> Only syncs new or updated contacts</p>
              </div>
            </div>

            {/* Recent Sync History */}
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Recent Sync History</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 text-center">
                  Sync history will appear here after your first sync
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderVcfTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">VCF Files</h3>
        <div className="flex gap-2">
          <label className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 cursor-pointer">
            <Upload size={16} />
            Upload VCF
            <input
              type="file"
              accept=".vcf,.vcard"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {vcfLoading ? (
        <div className="text-center py-8">Loading VCF files...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vcfFiles?.data?.map((file: VcfFile) => (
            <div key={file.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="text-green-600" size={20} />
                <div className="flex-1">
                  <h4 className="font-medium">{file.filename}</h4>
                  <p className="text-sm text-gray-600">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  file.status === 'completed' ? 'bg-green-500' :
                  file.status === 'processing' ? 'bg-yellow-500' :
                  file.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                }`} />
              </div>
              
              <div className="text-sm text-gray-600 mb-3">
                <p>Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}</p>
                <p>Contacts: {file.contactCount}</p>
                <p>Status: <span className="capitalize">{file.status}</span></p>
              </div>

              <div className="flex gap-2">
                {file.status === 'pending' && (
                  <button
                    onClick={() => processVcfMutation.mutate(file.id)}
                    disabled={processVcfMutation.isPending}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {processVcfMutation.isPending ? 'Processing...' : 'Process Now'}
                  </button>
                )}
                <button className="px-3 py-2 border rounded text-sm hover:bg-gray-50 text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderInvoiceTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Invoice Databases</h3>
        <button
          onClick={() => setIsInvoiceModalOpen(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700"
        >
          <Plus size={16} />
          Add Database
        </button>
      </div>

      {invoiceLoading ? (
        <div className="text-center py-8">Loading invoice databases...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {invoiceDatabases?.data?.map((db: InvoiceDatabase) => (
            <div key={db.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <Database className="text-purple-600" size={20} />
                <div className="flex-1">
                  <h4 className="font-medium">{db.name}</h4>
                  <p className="text-sm text-gray-600">{db.server}/{db.database}</p>
                </div>
                <div className={`w-2 h-2 rounded-full ${db.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>
              
              <div className="text-sm text-gray-600 mb-3">
                <p>Last sync: {new Date(db.lastSync).toLocaleDateString()}</p>
                <p>Contacts: {db.contactCount}</p>
                <p>Status: {db.isConnected ? 'Connected' : 'Disconnected'}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => syncInvoiceMutation.mutate(db.id)}
                  disabled={syncInvoiceMutation.isPending}
                  className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  {syncInvoiceMutation.isPending ? 'Syncing...' : 'Sync Now'}
                </button>
                <button className="px-3 py-2 border rounded text-sm hover:bg-gray-50">
                  <Edit size={14} />
                </button>
                <button className="px-3 py-2 border rounded text-sm hover:bg-gray-50 text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Data Source Manager</h1>
        <p className="text-gray-600 mt-2">
          Manage your contact data sources including Gmail accounts, VCF files, and invoice databases
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'gmail', label: 'Gmail Accounts', icon: Mail },
            { id: 'vcf', label: 'VCF Files', icon: FileText },
            { id: 'invoice', label: 'Invoice Databases', icon: Database }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'gmail' && renderGmailTab()}
        {activeTab === 'vcf' && renderVcfTab()}
        {activeTab === 'invoice' && renderInvoiceTab()}
      </div>

      {/* Data Source Modals */}
      <DataSourceModals
        isGmailModalOpen={isGmailModalOpen}
        isInvoiceModalOpen={isInvoiceModalOpen}
        onCloseGmail={() => setIsGmailModalOpen(false)}
        onCloseInvoice={() => setIsInvoiceModalOpen(false)}
        onSubmitGmail={addGmailMutation.mutate}
        onSubmitInvoice={addInvoiceDbMutation.mutate}
        isLoading={addGmailMutation.isPending || addInvoiceDbMutation.isPending}
      />
    </div>
  );
};

export default DataSourceManager;

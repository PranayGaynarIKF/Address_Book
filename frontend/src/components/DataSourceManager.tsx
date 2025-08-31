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

  // Gmail Accounts
  const { data: gmailAccounts, isLoading: gmailLoading } = useQuery({
    queryKey: ['gmail-accounts'],
    queryFn: () => dataSourceAPI.getGmailAccounts(),
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
    mutationFn: (data: { email: string; clientId: string; clientSecret: string }) =>
      dataSourceAPI.addGmailAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gmail-accounts'] });
      setIsGmailModalOpen(false);
    },
  });

  const syncGmailMutation = useMutation({
    mutationFn: (accountId: string) => dataSourceAPI.syncGmailContacts(accountId),
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
          Add Gmail Account
        </button>
      </div>

      {gmailLoading ? (
        <div className="text-center py-8">Loading Gmail accounts...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {gmailAccounts?.data?.map((account: GmailAccount) => (
            <div key={account.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <Mail className="text-blue-600" size={20} />
                <div className="flex-1">
                  <h4 className="font-medium">{account.email}</h4>
                  <p className="text-sm text-gray-600">{account.contactCount} contacts</p>
                </div>
                <div className={`w-2 h-2 rounded-full ${account.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>
              
              <div className="text-sm text-gray-600 mb-3">
                <p>Last sync: {new Date(account.lastSync).toLocaleDateString()}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => syncGmailMutation.mutate(account.id)}
                  disabled={syncGmailMutation.isPending}
                  className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  {syncGmailMutation.isPending ? 'Syncing...' : 'Sync Now'}
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

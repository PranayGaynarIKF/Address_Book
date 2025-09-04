import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Mail, Database, FileText, Eye, EyeOff } from 'lucide-react';

interface GmailAccountForm {
  email: string;
  clientId: string;
  clientSecret: string;
  name: string;
}

interface InvoiceDatabaseForm {
  name: string;
  server: string;
  database: string;
  username: string;
  password: string;
  useWindowsAuth: boolean;
}

interface DataSourceModalsProps {
  isGmailModalOpen: boolean;
  isInvoiceModalOpen: boolean;
  onCloseGmail: () => void;
  onCloseInvoice: () => void;
  onSubmitGmail: (data: GmailAccountForm) => void;
  onSubmitInvoice: (data: InvoiceDatabaseForm) => void;
  isLoading?: boolean;
  editingGmailItem?: any;
  onEditGmail?: (data: { id: string; data: GmailAccountForm }) => void;
}

const GmailAccountModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GmailAccountForm) => void;
  isLoading?: boolean;
  editingItem?: any;
  onEdit?: (data: { id: string; data: GmailAccountForm }) => void;
}> = ({ isOpen, onClose, onSubmit, isLoading, editingItem, onEdit }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<GmailAccountForm>();
  const isEditing = !!editingItem;

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        reset({
          email: editingItem.email || '',
          clientId: editingItem.clientId || '',
          clientSecret: editingItem.clientSecret || ''
        });
      } else {
        reset();
      }
    }
  }, [isOpen, reset, editingItem]);

  const handleFormSubmit = (data: GmailAccountForm) => {
    if (isEditing && onEdit) {
      onEdit({ id: editingItem.id, data });
    } else {
      onSubmit(data);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Mail className="text-blue-600" size={20} />
            {isEditing ? 'Edit Gmail Account' : 'Add Gmail Account'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gmail Address
            </label>
            <input
              type="email"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Must be a valid email address'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your.email@gmail.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Google Client ID
            </label>
            <input
              type="text"
              {...register('clientId', { required: 'Client ID is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your Google OAuth Client ID"
            />
            {errors.clientId && (
              <p className="text-red-500 text-sm mt-1">{errors.clientId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Google Client Secret
            </label>
            <input
              type="password"
              {...register('clientSecret', { required: 'Client Secret is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your Google OAuth Client Secret"
            />
            {errors.clientSecret && (
              <p className="text-red-500 text-sm mt-1">{errors.clientSecret.message}</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Setup Instructions:</h4>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Go to <a href="https://console.developers.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
              <li>2. Create a new project or select existing one</li>
              <li>3. Enable Gmail API</li>
              <li>4. Create OAuth 2.0 credentials</li>
              <li>5. Add redirect URI: <code className="bg-blue-100 px-1 rounded">http://localhost:4002/api/mail-accounts/oauth-callback</code></li>
            </ol>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Account' : 'Add Account')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InvoiceDatabaseModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InvoiceDatabaseForm) => void;
  isLoading?: boolean;
}> = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<InvoiceDatabaseForm>();
  const [showPassword, setShowPassword] = useState(false);
  const useWindowsAuth = watch('useWindowsAuth');

  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const handleFormSubmit = (data: InvoiceDatabaseForm) => {
    onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Database className="text-purple-600" size={20} />
            Add Invoice Database
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Connection Name
            </label>
            <input
              type="text"
              {...register('name', { required: 'Connection name is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., Main Invoice DB"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Server Address
            </label>
            <input
              type="text"
              {...register('server', { required: 'Server address is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="localhost or server IP"
            />
            {errors.server && (
              <p className="text-red-500 text-sm mt-1">{errors.server.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Database Name
            </label>
            <input
              type="text"
              {...register('database', { required: 'Database name is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="invoice_db"
            />
            {errors.database && (
              <p className="text-red-500 text-sm mt-1">{errors.database.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useWindowsAuth"
              {...register('useWindowsAuth')}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="useWindowsAuth" className="text-sm text-gray-700">
              Use Windows Authentication
            </label>
          </div>

          {!useWindowsAuth && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  {...register('username', { 
                    required: !useWindowsAuth ? 'Username is required' : false 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="SQL Server username"
                />
                {errors.username && (
                  <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', { 
                      required: !useWindowsAuth ? 'Password is required' : false 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                    placeholder="SQL Server password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>
            </>
          )}

          <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
            <h4 className="text-sm font-medium text-purple-800 mb-2">Connection Test:</h4>
            <p className="text-sm text-purple-700">
              The connection will be tested automatically when you save. Make sure the SQL Server is accessible and the credentials are correct.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add Database'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DataSourceModals: React.FC<DataSourceModalsProps> = ({
  isGmailModalOpen,
  isInvoiceModalOpen,
  onCloseGmail,
  onCloseInvoice,
  onSubmitGmail,
  onSubmitInvoice,
  isLoading = false,
  editingGmailItem,
  onEditGmail
}) => {
  return (
    <>
      <GmailAccountModal
        isOpen={isGmailModalOpen}
        onClose={onCloseGmail}
        onSubmit={onSubmitGmail}
        isLoading={isLoading}
        editingItem={editingGmailItem}
        onEdit={onEditGmail}
      />
      <InvoiceDatabaseModal
        isOpen={isInvoiceModalOpen}
        onClose={onCloseInvoice}
        onSubmit={onSubmitInvoice}
        isLoading={isLoading}
      />
    </>
  );
};

export default DataSourceModals;

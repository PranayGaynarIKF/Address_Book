import React from 'react';
import { 
  AlertTriangle, 
  X, 
  Trash2, 
  User, 
  Building,
  Mail,
  Phone
} from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemType: 'contact' | 'tag' | 'account' | 'owner' | 'template' | 'general';
  itemDetails?: {
    name?: string;
    email?: string;
    company?: string;
    phone?: string;
  };
  isLoading?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemType,
  itemDetails,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const getItemIcon = () => {
    switch (itemType) {
      case 'contact':
        return <User className="h-8 w-8 text-red-500" />;
      case 'tag':
        return <Trash2 className="h-8 w-8 text-red-500" />;
      case 'account':
        return <Mail className="h-8 w-8 text-red-500" />;
      case 'owner':
        return <User className="h-8 w-8 text-red-500" />;
      case 'template':
        return <Trash2 className="h-8 w-8 text-red-500" />;
      default:
        return <AlertTriangle className="h-8 w-8 text-red-500" />;
    }
  };

  const getItemTypeColor = () => {
    switch (itemType) {
      case 'contact':
        return 'from-red-500 to-red-600';
      case 'tag':
        return 'from-orange-500 to-orange-600';
      case 'account':
        return 'from-blue-500 to-blue-600';
      case 'owner':
        return 'from-purple-500 to-purple-600';
      case 'template':
        return 'from-green-500 to-green-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all duration-300 ease-in-out sm:my-8 sm:align-middle sm:max-w-lg sm:w-full animate-scale-in">
          {/* Header */}
          <div className={`bg-gradient-to-r ${getItemTypeColor()} px-6 py-4 relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                  {getItemIcon()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {title}
                  </h3>
                  <p className="text-sm text-white/90">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-110 backdrop-blur-sm"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-gray-900 font-medium mb-2">
                  {message}
                </p>
                
                {/* Item Details */}
                {itemDetails && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Item Details:</h4>
                    <div className="space-y-2">
                      {itemDetails.name && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">Name:</span>
                          <span>{itemDetails.name}</span>
                        </div>
                      )}
                      {itemDetails.email && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">Email:</span>
                          <span>{itemDetails.email}</span>
                        </div>
                      )}
                      {itemDetails.company && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">Company:</span>
                          <span>{itemDetails.company}</span>
                        </div>
                      )}
                      {itemDetails.phone && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">Phone:</span>
                          <span>{itemDetails.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-800 font-medium">
                        Warning: This action is permanent
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        Once deleted, this item cannot be recovered. Please make sure you want to proceed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Trash2 className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                    <span>Yes, Delete</span>
                  </div>
                )}
              </button>
              
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all duration-200 group disabled:opacity-50"
              >
                <div className="flex items-center justify-center space-x-2">
                  <X className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                  <span>Cancel</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;

import React from 'react';
import { X, AlertTriangle, Users, Trash2 } from 'lucide-react';

interface TagDeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tagName: string;
  contactCount: number;
  isLoading?: boolean;
}

export const TagDeleteConfirmationModal: React.FC<TagDeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  tagName,
  contactCount,
  isLoading = false
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-full">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Delete Tag</h3>
                <p className="text-red-100 text-sm">This action cannot be undone</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors duration-200"
              disabled={isLoading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {contactCount > 0 ? (
            // Tag is in use - show warning
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-orange-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Cannot Delete Tag
                  </h4>
                  <p className="text-gray-600 mb-3">
                    The tag <span className="font-semibold text-gray-900">"{tagName}"</span> is currently applied to{' '}
                    <span className="font-semibold text-orange-600">{contactCount}</span> contact(s).
                  </p>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-orange-800 text-sm">
                      <strong>To delete this tag:</strong>
                    </p>
                    <ol className="list-decimal list-inside text-orange-700 text-sm mt-2 space-y-1">
                      <li>Remove the tag from all contacts first</li>
                      <li>Then try deleting the tag again</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Tag is not in use - show normal confirmation
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-red-100 p-3 rounded-full">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Delete Tag
                  </h4>
                  <p className="text-gray-600 mb-3">
                    Are you sure you want to delete the tag{' '}
                    <span className="font-semibold text-gray-900">"{tagName}"</span>?
                  </p>
                  <p className="text-red-600 text-sm">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 font-medium"
              disabled={isLoading}
            >
              {contactCount > 0 ? 'Close' : 'Cancel'}
            </button>
            {contactCount === 0 && (
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Tag</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

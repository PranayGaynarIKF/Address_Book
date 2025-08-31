import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, User, Mail, Phone, Building, Save, Loader } from 'lucide-react';
import { ContactResponseDto, CreateContactDto } from '../types';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: ContactResponseDto | null;
  onSubmit: (data: CreateContactDto) => void;
  isLoading?: boolean;
}

const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  contact,
  onSubmit,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateContactDto>({
    defaultValues: {
      name: contact?.name || '',
      companyName: contact?.companyName || '',
      email: contact?.email || '',
      mobileE164: contact?.mobileE164 || '',
      relationshipType: contact?.relationshipType || 'CLIENT',
      sourceSystem: 'INVOICE',
      sourceRecordId: contact?.sourceRecordId || `manual_${Date.now()}`,
    },
  });

  useEffect(() => {
    if (contact) {
      reset({
        name: contact.name,
        companyName: contact.companyName,
        email: contact.email,
        mobileE164: contact.mobileE164,
        relationshipType: contact.relationshipType || 'CLIENT',
        sourceSystem: contact.sourceSystem,
        sourceRecordId: contact.sourceRecordId,
      });
    } else {
      reset({
        name: '',
        companyName: '',
        email: '',
        mobileE164: '',
        relationshipType: 'CLIENT',
        sourceSystem: 'INVOICE',
        sourceRecordId: `manual_${Date.now()}`,
      });
    }
  }, [contact, reset]);

  const handleFormSubmit = (data: CreateContactDto) => {
    onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all duration-300 ease-in-out sm:my-8 sm:align-middle sm:max-w-lg sm:w-full animate-scale-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {contact ? 'Edit Contact' : 'Add New Contact'}
                  </h3>
                  <p className="text-sm text-primary-100">
                    {contact ? 'Update contact information' : 'Create a new contact entry'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className="px-6 py-6">
            <div className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('name', { required: 'Name is required' })}
                      type="text"
                      id="name"
                      className="input-enhanced pl-10"
                      placeholder="Enter name"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 animate-fade-in-up">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('companyName', { required: 'Company name is required' })}
                      type="text"
                      id="companyName"
                      className="input-enhanced pl-10"
                      placeholder="Enter company name"
                    />
                  </div>
                  {errors.companyName && (
                    <p className="mt-1 text-sm text-red-600 animate-fade-in-up">
                      {errors.companyName.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Contact Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                      type="email"
                      id="email"
                      className="input-enhanced pl-10"
                      placeholder="Enter email address"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 animate-fade-in-up">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="mobileE164" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('mobileE164')}
                      type="tel"
                      id="mobileE164"
                      className="input-enhanced pl-10"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              </div>

              {/* Company Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="relationshipType" className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship Type *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      {...register('relationshipType', { required: 'Relationship type is required' })}
                      id="relationshipType"
                      className="input-enhanced pl-10"
                    >
                      <option value="CLIENT">Client</option>
                      <option value="VENDOR">Vendor</option>
                      <option value="LEAD">Lead</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  {errors.relationshipType && (
                    <p className="mt-1 text-sm text-red-600 animate-fade-in-up">
                      {errors.relationshipType.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="sourceSystem" className="block text-sm font-medium text-gray-700 mb-2">
                    Source System *
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      {...register('sourceSystem', { required: 'Source system is required' })}
                      id="sourceSystem"
                      className="input-enhanced pl-10"
                    >
                      <option value="INVOICE">Invoice</option>
                      <option value="GMAIL">Gmail</option>
                      <option value="ZOHO">Zoho</option>
                      <option value="ASHISH">Ashish</option>
                      <option value="MOBILE">Mobile</option>
                    </select>
                  </div>
                  {errors.sourceSystem && (
                    <p className="mt-1 text-sm text-red-600 animate-fade-in-up">
                      {errors.sourceSystem.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="sourceRecordId" className="block text-sm font-medium text-gray-700 mb-2">
                  Source Record ID *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...register('sourceRecordId', { required: 'Source record ID is required' })}
                    type="text"
                    id="sourceRecordId"
                    className="input-enhanced pl-10"
                    placeholder="Enter source record ID"
                  />
                </div>
                {errors.sourceRecordId && (
                  <p className="mt-1 text-sm text-red-600 animate-fade-in-up">
                    {errors.sourceRecordId.message}
                  </p>
                )}
              </div>


            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary flex-1 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    {contact ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Save className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                    {contact ? 'Update Contact' : 'Create Contact'}
                  </div>
                )}
              </button>
              
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;

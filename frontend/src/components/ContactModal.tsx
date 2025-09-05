import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Building, 
  Save, 
  Loader, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  Briefcase,
  Globe,
  Hash
} from 'lucide-react';
import { ContactResponseDto, CreateContactDto, UpdateContactDto } from '../types';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: ContactResponseDto | null;
  onSubmit: (data: CreateContactDto | UpdateContactDto) => void;
  isLoading?: boolean;
}

const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  contact,
  onSubmit,
  isLoading = false,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formStep, setFormStep] = useState(1);
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    trigger,
    formState: { errors, isValid, isDirty, isSubmitting, isSubmitted, submitCount, touchedFields, dirtyFields },
  } = useForm<CreateContactDto | UpdateContactDto>({
    mode: 'onChange',
    defaultValues: {
      name: contact?.name || '',
      companyName: contact?.companyName || '',
      email: contact?.email || '',
      mobileE164: contact?.mobileE164 || '',
      relationshipType: contact?.relationshipType || 'CLIENT',
      sourceSystem: 'INVOICE',
      sourceRecordId: contact?.sourceRecordId || `manual_${Date.now()}`,
    } as any,
  });

  const watchedFields = watch();

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
      } as any);
      setFormStep(1);
      setShowAdvanced(false);
    } else {
      reset({
        name: '',
        companyName: '',
        email: '',
        mobileE164: '',
        relationshipType: 'CLIENT',
        sourceSystem: 'INVOICE',
        sourceRecordId: `manual_${Date.now()}`,
      } as any);
      setFormStep(1);
      setShowAdvanced(false);
    }
  }, [contact, reset]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset();
      setFormStep(1);
      setShowAdvanced(false);
    }
  }, [isOpen, reset]);

  // Debug when modal opens for editing or creating
  useEffect(() => {
    if (isOpen) {
      console.log('🔍 Modal opened:', {
        isEdit: !!contact,
        contactId: contact?.id,
        contactName: contact?.name,
        formValid: isValid,
        formDirty: isDirty,
        currentFormData: watch()
      });
    }
  }, [isOpen, contact, isValid, isDirty, watch]);

  const handleFormSubmit = (data: CreateContactDto | UpdateContactDto) => {
    console.log('📝 ContactModal form submitted:', { 
      isEdit: !!contact, 
      contactId: contact?.id, 
      formData: data,
      formValid: isValid,
      formDirty: isDirty,
      errors: errors,
      watchData: watch(),
      formState: { isSubmitting, isSubmitted, submitCount, touchedFields, dirtyFields }
    });
    
    if (!isValid) {
      console.error('❌ Form validation failed:', errors);
      console.error('❌ Form state details:', {
        isValid,
        isDirty,
        isSubmitting: isSubmitting,
        isSubmitted: isSubmitted,
        submitCount: submitCount,
        touchedFields: touchedFields,
        dirtyFields: dirtyFields
      });
      return;
    }
    
    // Filter out fields that shouldn't be sent in different request types
    let submitData = { ...data };
    if (contact) {
      // For updates, remove sourceSystem and sourceRecordId as they're not in UpdateContactDto
      const { sourceSystem, sourceRecordId, ...updateData } = submitData as any;
      submitData = updateData;
      console.log('🔄 Filtered data for update:', submitData);
    } else {
      // For creates, no additional filtering needed
      console.log('🔄 Data for create:', submitData);
    }
    
    console.log('✅ Form validation passed, calling onSubmit with:', submitData);
    onSubmit(submitData);
  };

  const handleClose = () => {
    if (isDirty && !contact) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        reset();
        onClose();
      }
    } else {
      reset();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all duration-300 ease-in-out sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full animate-scale-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 px-8 py-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {contact ? 'Edit Contact' : 'Add New Contact'}
                  </h3>
                  <p className="text-sm text-primary-100 mt-1">
                    {contact ? 'Update contact information' : 'Create a new contact entry'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-110 backdrop-blur-sm"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Progress Indicator */}
            <div className="mt-4 flex space-x-2">
              <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                formStep >= 1 ? 'bg-white/60' : 'bg-white/20'
              }`}></div>
              <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                formStep >= 2 ? 'bg-white/60' : 'bg-white/20'
              }`}></div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className="px-8 py-8">
            <div className="space-y-8">
              {/* Step 1: Basic Information */}
            <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Basic Information</h4>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                      Full Name *
                  </label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    <input
                        {...register('name', { 
                          required: 'Name is required',
                          minLength: { value: 2, message: 'Name must be at least 2 characters' }
                        })}
                      type="text"
                      id="name"
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                        placeholder="Enter full name"
                        onFocus={() => setFormStep(1)}
                    />
                      {watchedFields.name && !errors.name && (
                        <CheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                      )}
                  </div>
                  {errors.name && (
                      <div className="flex items-center space-x-2 text-red-600 text-sm animate-fade-in-up">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.name.message}</span>
                      </div>
                  )}
                </div>

                  {/* Company Field */}
                  <div className="space-y-2">
                    <label htmlFor="companyName" className="block text-sm font-semibold text-gray-700">
                    Company Name *
                  </label>
                    <div className="relative group">
                      <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    <input
                        {...register('companyName', { 
                          required: 'Company name is required',
                          minLength: { value: 2, message: 'Company name must be at least 2 characters' }
                        })}
                      type="text"
                      id="companyName"
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                      placeholder="Enter company name"
                        onFocus={() => setFormStep(1)}
                    />
                      {watchedFields.companyName && !errors.companyName && (
                        <CheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                      )}
                  </div>
                  {errors.companyName && (
                      <div className="flex items-center space-x-2 text-red-600 text-sm animate-fade-in-up">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.companyName.message}</span>
                      </div>
                  )}
                </div>
              </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                      Email Address
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    <input
                      {...register('email', {
                        required: false,
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Please enter a valid email address',
                        },
                      })}
                      type="email"
                      id="email"
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                      placeholder="Enter email address"
                        onFocus={() => setFormStep(1)}
                    />
                      {watchedFields.email && !errors.email && (
                        <CheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                      )}
                  </div>
                  {errors.email && (
                      <div className="flex items-center space-x-2 text-red-600 text-sm animate-fade-in-up">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.email.message}</span>
                      </div>
                  )}
                </div>

                  {/* Phone Field */}
                  <div className="space-y-2">
                    <label htmlFor="mobileE164" className="block text-sm font-semibold text-gray-700">
                    Phone Number
                  </label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    <input
                        {...register('mobileE164', {
                          pattern: {
                            value: /^[+]?[1-9][\d]{0,15}$/,
                            message: 'Please enter a valid phone number',
                          },
                        })}
                      type="tel"
                      id="mobileE164"
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                      placeholder="Enter phone number"
                        onFocus={() => setFormStep(1)}
                      />
                      {watchedFields.mobileE164 && !errors.mobileE164 && (
                        <CheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                      )}
                    </div>
                    {errors.mobileE164 && (
                      <div className="flex items-center space-x-2 text-red-600 text-sm animate-fade-in-up">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.mobileE164.message}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2: Additional Information */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Briefcase className="h-4 w-4 text-primary-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Additional Information</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                  >
                    {showAdvanced ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span>{showAdvanced ? 'Hide' : 'Show'} Advanced</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Relationship Type */}
                  <div className="space-y-2">
                    <label htmlFor="relationshipType" className="block text-sm font-semibold text-gray-700">
                    Relationship Type *
                  </label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    <select
                      {...register('relationshipType', { required: 'Relationship type is required' })}
                      id="relationshipType"
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all duration-200 text-gray-900 bg-white appearance-none cursor-pointer"
                        onFocus={() => setFormStep(2)}
                    >
                      <option value="CLIENT">Client</option>
                      <option value="VENDOR">Vendor</option>
                      <option value="LEAD">Lead</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  {errors.relationshipType && (
                      <div className="flex items-center space-x-2 text-red-600 text-sm animate-fade-in-up">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.relationshipType.message}</span>
                      </div>
                    )}
                  </div>

                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Source System */}
                  <div className="space-y-2">
                    <label htmlFor="sourceSystem" className="block text-sm font-semibold text-gray-700">
                    Source System *
                  </label>
                    <div className="relative group">
                      <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    <select
                        {...register('sourceSystem', { required: !contact ? 'Source system is required' : false })}
                      id="sourceSystem"
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all duration-200 text-gray-900 bg-white appearance-none cursor-pointer"
                        onFocus={() => setFormStep(2)}
                    >
                      <option value="INVOICE">Invoice</option>
                      <option value="GMAIL">Gmail</option>
                      <option value="MOBILE">Mobile</option>
                    </select>
                  </div>
                  {errors.sourceSystem && (
                      <div className="flex items-center space-x-2 text-red-600 text-sm animate-fade-in-up">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.sourceSystem.message}</span>
                      </div>
                  )}
                </div>
              </div>

                {/* Advanced Fields */}
                {showAdvanced && (
                  <div className="space-y-6 p-6 bg-gray-50 rounded-xl border border-gray-200 animate-fade-in-up">
                    <div className="space-y-2">
                      <label htmlFor="sourceRecordId" className="block text-sm font-semibold text-gray-700">
                  Source Record ID *
                </label>
                      <div className="relative group">
                        <Hash className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                  <input
                          {...register('sourceRecordId', { required: !contact ? 'Source record ID is required' : false })}
                    type="text"
                    id="sourceRecordId"
                          className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                    placeholder="Enter source record ID"
                  />
                        {watchedFields.sourceRecordId && !errors.sourceRecordId && (
                          <CheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                        )}
                </div>
                {errors.sourceRecordId && (
                        <div className="flex items-center space-x-2 text-red-600 text-sm animate-fade-in-up">
                          <AlertCircle className="h-4 w-4" />
                          <span>{errors.sourceRecordId.message}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>


            {/* Action Buttons */}
            <div className="mt-10 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                  disabled={isLoading || !isValid}
                  onClick={async (e) => {
                    e.preventDefault(); // Prevent default form submission
                    
                    console.log('🔘 Submit button clicked:', {
                      isLoading,
                      isValid,
                      isDirty,
                      contact: !!contact,
                      errors,
                      formState: { isSubmitting, isSubmitted, submitCount, touchedFields, dirtyFields },
                      watchData: watch()
                    });
                    
                    // Force form validation
                    const validationResult = await trigger();
                    console.log('🔍 Form validation result:', validationResult);
                    
                    if (validationResult) {
                      console.log('✅ Validation passed, submitting form...');
                      handleSubmit(handleFormSubmit)();
                    } else {
                      console.error('❌ Form validation failed on button click');
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-4 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                    <div className="flex items-center justify-center space-x-3">
                      <Loader className="h-5 w-5 animate-spin" />
                      <span>{contact ? 'Updating Contact...' : 'Creating Contact...'}</span>
                  </div>
                ) : (
                    <div className="flex items-center justify-center space-x-3">
                      <Save className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                      <span>{contact ? 'Update Contact' : 'Create Contact'}</span>
                  </div>
                )}
              </button>
              
              <button
                type="button"
                  onClick={handleClose}
                  className="flex-1 bg-gray-100 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all duration-200 group"
              >
                  <div className="flex items-center justify-center space-x-3">
                    <X className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                    <span>Cancel</span>
                  </div>
              </button>
              </div>
              
              {/* Form Status */}
              <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-500">
                {isDirty && (
                  <div className="flex items-center space-x-2 text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>You have unsaved changes</span>
                  </div>
                )}
                {!isDirty && isValid && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Form is ready to submit</span>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;

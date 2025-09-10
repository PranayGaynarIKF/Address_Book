import React, { useState, useCallback } from 'react';
import { MessageSquare, Send, X, CheckCircle, XCircle, Phone, User } from 'lucide-react';
import TemplateSelector from '../TemplateSelector';
import TemplateCreationModal from '../TemplateCreationModal';

interface WhatsAppButtonProps {
  contactId: string;
  contactName: string;
  phone?: string;
  className?: string;
}

const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ 
  contactId, 
  contactName, 
  phone, 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('basic');
  const [customMessage, setCustomMessage] = useState('');
  const [language, setLanguage] = useState('en');
  const [isSending, setIsSending] = useState(false);
  const [lastStatus, setLastStatus] = useState<'success' | 'error' | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedTemplateData, setSelectedTemplateData] = useState<any>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Simple template definitions
  const templates = [
    { id: 'basic', name: 'Basic Welcome', text: 'Hi {{name}}, welcome to our service! How can we help you today?' },
    { id: 'follow_up', name: 'Follow Up', text: 'Hi {{name}}, just following up on our recent conversation. Is there anything else you need?' },
    { id: 'reminder', name: 'Appointment Reminder', text: 'Hi {{name}}, this is a friendly reminder about your upcoming appointment.' },
    { id: 'custom', name: 'Custom Message', text: '' }
  ];

  // Stable open/close functions
  const openModal = useCallback(() => {
    console.log('🔍 Opening modal for:', contactName);
    setSelectedTemplate('basic');
    setCustomMessage('');
    setLastStatus(null);
    setIsSending(false);
    setIsOpen(true);
  }, [contactName]);

  const closeModal = useCallback(() => {
    console.log('🔍 Closing modal');
    setIsOpen(false);
    setSelectedTemplate('basic');
    setCustomMessage('');
    setLastStatus(null);
    setIsSending(false);
  }, []);

  const handleOldTemplateChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('🔍 Template changed to:', e.target.value);
    setSelectedTemplate(e.target.value);
  }, []);

  const handleCustomMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log('🔍 Custom message changed to:', e.target.value);
    setCustomMessage(e.target.value);
  }, []);

  const handleLanguageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('🔍 Language changed to:', e.target.value);
    setLanguage(e.target.value);
  }, []);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
  };

  const handleTemplateChange = (template: any) => {
    setSelectedTemplateData(template);
    if (template) {
      setCustomMessage(template.body.replace(/\\n/g, '\n'));
    }
  };

  const handleCreateTemplate = () => {
    setShowTemplateModal(true);
  };

  const handleTemplateCreated = (newTemplate: any) => {
    setSelectedTemplateId(newTemplate.id);
    setSelectedTemplateData(newTemplate);
    setCustomMessage(newTemplate.body.replace(/\\n/g, '\n'));
  };

  const sendMessage = async () => {
    if (!selectedTemplateId || !contactId || !phone) {
      alert('❌ Please select a template and ensure contact has phone number');
      return;
    }

    try {
      setIsSending(true);
      
      // Extract country code and phone number from the phone prop
      const countryCode = phone.startsWith('91') ? '91' : '91'; // Default to India
      const phoneNumber = phone.replace(/^91/, '');
      
      // Generate personalized message from template
      let templateText = '';
      if (selectedTemplateData) {
        // Use the selected template data
        templateText = selectedTemplateData.body.replace(/\{\{name\}\}/g, contactName);
      } else {
        // Fallback to custom message
        templateText = customMessage || `Hi ${contactName}, thank you for your interest!`;
      }
      
      // Use ONLY the working /whatsapp/send-text-message endpoint
      const response = await fetch(`http://localhost:4002/whatsapp/send-text-message`, {
        method: 'POST',
        headers: {
          'X-API-Key': '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN', // Corrected API Key
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          phone_number_id: "690875100784871",
          customer_country_code: countryCode,
          customer_number: phoneNumber,
          data: {
            type: "text",
            context: {
              body: templateText, // Dynamically generated text from template
              preview_url: false
            }
          },
          reply_to: null,
          myop_ref_id: `button_${Date.now()}_${contactId}`
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Message sent successfully:', result);
      
      // Show success message
      alert(`✅ Template message sent successfully to ${contactName}!`);
      
      // Reset form and close modal
      setSelectedTemplate('basic');
      setCustomMessage('');
      setLanguage('en');
      closeModal();
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      alert(`❌ Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  };

  if (!phone) {
    return null;
  }

  return (
    <>
      {/* WhatsApp Button */}
      <button
        onClick={openModal}
        className={`inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md cursor-pointer ${className}`}
        title={`Send WhatsApp message to ${contactName}`}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        WhatsApp
      </button>

      {/* Completely Stable Message Modal */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              width: '100%',
              maxWidth: '448px',
              margin: '0 auto',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{
              backgroundColor: '#059669',
              color: 'white',
              padding: '16px',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: 0
                }}>
                  Send WhatsApp Message
                </h3>
                <button
                  onClick={closeModal}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <X style={{ width: '20px', height: '20px' }} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '16px' }}>
              {/* Contact Info */}
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <User style={{ width: '16px', height: '16px', color: '#2563eb' }} />
                  <span style={{
                    fontWeight: '500',
                    color: '#1e3a8a'
                  }}>
                    {contactName}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '4px'
                }}>
                  <Phone style={{ width: '12px', height: '12px', color: '#2563eb' }} />
                  <span style={{
                    fontSize: '14px',
                    color: '#1d4ed8'
                  }}>
                    {phone}
                  </span>
                </div>
              </div>

              {/* Template Selection */}
              <div style={{ marginBottom: '16px' }}>
                <TemplateSelector
                  channel="WHATSAPP"
                  selectedTemplate={selectedTemplateId}
                  onTemplateSelect={handleTemplateSelect}
                  onTemplateChange={handleTemplateChange}
                  onCreateTemplate={handleCreateTemplate}
                />
              </div>

              {/* Custom Message */}
              {selectedTemplateId && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Your Message:
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={handleCustomMessageChange}
                    placeholder={`Hi ${contactName}, how are you?`}
                    style={{
                      width: '100%',
                      height: '80px',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'none',
                      fontFamily: 'inherit',
                      cursor: 'text',
                      backgroundColor: 'white'
                    }}
                    disabled={isSending}
                  />
                </div>
              )}

              {/* Language Selection */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Language:
                </label>
                <select
                  value={language}
                  onChange={handleLanguageChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    cursor: 'pointer',
                    backgroundColor: 'white'
                  }}
                  disabled={isSending}
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="gu">Gujarati</option>
                </select>
              </div>

              {/* Status Display */}
              {lastStatus && (
                <div style={{
                  marginBottom: '16px',
                  padding: '12px',
                  borderRadius: '6px',
                  border: `1px solid ${lastStatus === 'success' ? '#bbf7d0' : '#fecaca'}`,
                  backgroundColor: lastStatus === 'success' ? '#f0fdf4' : '#fef2f2'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: lastStatus === 'success' ? '#166534' : '#dc2626'
                  }}>
                    {lastStatus === 'success' ? (
                      <>
                        <CheckCircle style={{ width: '16px', height: '16px' }} />
                        <span>Message sent successfully! 🎉</span>
                      </>
                    ) : (
                      <>
                        <XCircle style={{ width: '16px', height: '16px' }} />
                        <span>Failed to send message</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px'
              }}>
                <button
                  onClick={closeModal}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                  disabled={isSending}
                  onMouseEnter={(e) => {
                    if (!isSending) {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSending) {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={sendMessage}
                  disabled={isSending || !selectedTemplateId}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'white',
                    backgroundColor: isSending || !selectedTemplateId ? '#9ca3af' : '#059669',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isSending || !selectedTemplateId ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSending && selectedTemplateId) {
                      e.currentTarget.style.backgroundColor = '#047857';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSending && selectedTemplateId) {
                      e.currentTarget.style.backgroundColor = '#059669';
                    }
                  }}
                >
                  {isSending ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid white',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send style={{ width: '16px', height: '16px' }} />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS for spinner animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />

      {/* Template Creation Modal */}
      <TemplateCreationModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onTemplateCreated={handleTemplateCreated}
        channel="WHATSAPP"
      />
    </>
  );
};

export default WhatsAppButton;

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, MessageSquare, Users, FileText, Eye } from 'lucide-react';
import { messagesAPI, contactsAPI, templatesAPI } from '../services/api';
import { SendMessageDto } from '../types';

const Messages: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedContact, setSelectedContact] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState('');

  const { data: contacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsAPI.getAll(),
  });

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesAPI.getAll(),
  });

  const previewMutation = useMutation({
    mutationFn: (data: { templateId: string; variables: Record<string, string> }) =>
      messagesAPI.preview(data),
    onSuccess: (response) => {
      setPreview(response.data.preview);
    },
  });

  const sendMutation = useMutation({
    mutationFn: (data: SendMessageDto) => messagesAPI.send(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setSelectedContact('');
      setSelectedTemplate('');
      setVariables({});
      setPreview('');
    },
  });

  const handlePreview = () => {
    if (selectedTemplate) {
      previewMutation.mutate({
        templateId: selectedTemplate,
        variables,
      });
    }
  };

  const handleSend = () => {
    if (selectedContact && selectedTemplate) {
      sendMutation.mutate({
        contactId: selectedContact,
        templateId: selectedTemplate,
        variables: Object.keys(variables).length > 0 ? variables : undefined,
      });
    }
  };

  const selectedTemplateData = templates?.data?.find(t => t.id === selectedTemplate);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Send Messages</h1>
        <p className="text-gray-600">Send messages to your contacts using templates</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Message Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Compose Message</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Contact
              </label>
              <select
                value={selectedContact}
                onChange={(e) => setSelectedContact(e.target.value)}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Choose a contact...</option>
                {contacts?.data?.data?.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name} {contact.email ? `(${contact.email})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Choose a template...</option>
                {templates?.data?.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.type})
                  </option>
                ))}
              </select>
            </div>

            {selectedTemplateData && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Variables
                </label>
                <div className="text-sm text-gray-600 mb-2">
                  {selectedTemplateData.content}
                </div>
                <div className="space-y-2">
                  {extractVariables(selectedTemplateData.content).map((variable) => (
                    <div key={variable}>
                      <label className="block text-xs font-medium text-gray-700">
                        {variable}
                      </label>
                      <input
                        type="text"
                        value={variables[variable] || ''}
                        onChange={(e) => setVariables(prev => ({ ...prev, [variable]: e.target.value }))}
                        className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder={`Enter value for ${variable}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handlePreview}
                disabled={!selectedTemplate}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </button>
              <button
                onClick={handleSend}
                disabled={!selectedContact || !selectedTemplate || sendMutation.isPending}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendMutation.isPending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>

        {/* Message Preview */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Message Preview</h3>
          
          {preview ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-900 whitespace-pre-wrap">{preview}</div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No preview</h3>
              <p className="mt-1 text-sm text-gray-500">
                Select a template and click preview to see your message
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Messages */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Messages</h3>
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No messages yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Send your first message to see it here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to extract variables from template content
function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{([^}]+)\}\}/g);
  if (!matches) return [];
  return matches.map(match => match.slice(2, -2));
}

export default Messages;

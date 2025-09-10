import React, { useState, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Maximize2, Minimize2 } from 'lucide-react';

interface TemplateCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateCreated: (template: any) => void;
  channel: 'EMAIL' | 'WHATSAPP' | 'SMS';
}

const TemplateCreationModal: React.FC<TemplateCreationModalProps> = ({
  isOpen,
  onClose,
  onTemplateCreated,
  channel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    body: '',
    isActive: true
  });

  // Quill editor configuration
  const quillModules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  }), []);

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet', 'indent',
    'align', 'link', 'image'
  ];
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:4002/simple-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          channel: channel
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create template');
      }

      const newTemplate = await response.json();
      onTemplateCreated(newTemplate);
      
      // Reset form
      setFormData({
        name: '',
        body: '',
        isActive: true
      });
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg p-6 w-full mx-4 ${isMaximized ? 'max-w-6xl h-[90vh]' : 'max-w-2xl'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Create {channel} Template
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={`space-y-4 ${isMaximized ? 'h-full flex flex-col' : ''}`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter template name"
            />
          </div>

          <div className={`${isMaximized ? 'flex-1 flex flex-col' : ''}`}>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Template Body
              </label>
              <button
                type="button"
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title={isMaximized ? 'Minimize editor' : 'Maximize editor'}
              >
                {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
            <div className={`border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 ${isMaximized ? 'flex-1' : ''}`}>
              <div className={`react-quill-wrapper ${isMaximized ? 'h-full' : 'h-64'}`}>
                <ReactQuill
                  value={formData.body}
                  onChange={(content) => setFormData(prev => ({ ...prev, body: content }))}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Enter template body. Use variables like {name}, {company}, etc. Format your template with rich text - it will be sent as HTML."
                  style={{ 
                    height: '100%',
                    border: 'none'
                  }}
                  theme="snow"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Use variables like {'{name}'}, {'{company}'}, {'{phone}'} for personalization. Format your template with rich text.
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Active
            </label>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className={`flex justify-end space-x-3 ${isMaximized ? 'mt-4' : ''}`}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemplateCreationModal;

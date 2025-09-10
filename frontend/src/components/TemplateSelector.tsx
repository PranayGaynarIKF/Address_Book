import React, { useState, useEffect } from 'react';

interface Template {
  id: string;
  name: string;
  body: string;
  channel: string;
  isActive: boolean;
}

interface TemplateSelectorProps {
  channel: 'EMAIL' | 'WHATSAPP' | 'SMS';
  selectedTemplate: string;
  onTemplateSelect: (templateId: string) => void;
  onTemplateChange: (template: Template | null) => void;
  onCreateTemplate: () => void;
  className?: string;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  channel,
  selectedTemplate,
  onTemplateSelect,
  onTemplateChange,
  onCreateTemplate,
  className = ''
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, [channel]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:4002/simple-templates');
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      
      const allTemplates = await response.json();
      const channelTemplates = allTemplates.filter((template: Template) => 
        template.channel === channel && template.isActive
      );
      
      setTemplates(channelTemplates);
      
      // Auto-select first template if none selected
      if (channelTemplates.length > 0 && !selectedTemplate) {
        onTemplateSelect(channelTemplates[0].id);
        onTemplateChange(channelTemplates[0]);
      }
    } catch (err) {
      setError('Failed to load templates');
      console.error('Error fetching templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    onTemplateSelect(templateId);
    
    const selectedTemplate = templates.find(t => t.id === templateId);
    onTemplateChange(selectedTemplate || null);
  };

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Template
        </label>
        <button
          type="button"
          onClick={onCreateTemplate}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          + Create New
        </button>
      </div>
      
      <select
        value={selectedTemplate}
        onChange={handleTemplateChange}
        disabled={isLoading}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        <option value="">
          {isLoading ? 'Loading templates...' : 'Select a template'}
        </option>
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name}
          </option>
        ))}
      </select>

      {error && (
        <p className="text-red-600 text-xs">{error}</p>
      )}

      {selectedTemplateData && (
        <div className="mt-2 p-3 bg-gray-50 rounded-md">
          <p className="text-xs text-gray-600 mb-1">Preview:</p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">
            {selectedTemplateData.body.replace(/\\n/g, '\n')}
          </p>
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;

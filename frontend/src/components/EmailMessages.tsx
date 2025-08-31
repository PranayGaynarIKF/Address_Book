import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Search, 
  Filter, 
  MoreVertical, 
  Star, 
  StarOff, 
  Archive, 
  Trash2, 
  Reply, 
  Forward,
  Download,
  Eye,
  EyeOff,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface EmailMessage {
  id: string;
  subject: string;
  sender: {
    name: string;
    email: string;
  };
  recipients: {
    name: string;
    email: string;
  }[];
  content: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  receivedAt: string;
  serviceType: string;
  labels: string[];
}

const EmailMessages: React.FC = () => {
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [messagesPerPage] = useState(20);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  // Mock data for demonstration
  const mockMessages: EmailMessage[] = [
    {
      id: '1',
      subject: 'Welcome to our platform!',
      sender: { name: 'Support Team', email: 'support@company.com' },
      recipients: [{ name: 'You', email: 'user@example.com' }],
      content: 'Thank you for joining our platform. We\'re excited to have you on board!',
      isRead: false,
      isStarred: true,
      hasAttachments: false,
      receivedAt: '2024-01-15T10:30:00Z',
      serviceType: 'GMAIL',
      labels: ['INBOX', 'IMPORTANT']
    },
    {
      id: '2',
      subject: 'Monthly Newsletter - January 2024',
      sender: { name: 'Marketing Team', email: 'marketing@company.com' },
      recipients: [{ name: 'You', email: 'user@example.com' }],
      content: 'Check out our latest updates and news for January 2024...',
      isRead: true,
      isStarred: false,
      hasAttachments: true,
      receivedAt: '2024-01-14T15:45:00Z',
      serviceType: 'OUTLOOK',
      labels: ['INBOX', 'NEWSLETTER']
    },
    {
      id: '3',
      subject: 'Project Update Meeting',
      sender: { name: 'Project Manager', email: 'pm@company.com' },
      recipients: [{ name: 'You', email: 'user@example.com' }],
      content: 'Hi team, let\'s discuss the latest project updates...',
      isRead: true,
      isStarred: false,
      hasAttachments: false,
      receivedAt: '2024-01-13T09:15:00Z',
      serviceType: 'GMAIL',
      labels: ['INBOX', 'WORK']
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setMessages(mockMessages);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleLabelFilter = (label: string) => {
    setSelectedLabels(prev => 
      prev.includes(label) 
        ? prev.filter(l => l !== label)
        : [...prev, label]
    );
    setCurrentPage(1);
  };

  const toggleStar = (messageId: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isStarred: !msg.isStarred }
          : msg
      )
    );
  };

  const toggleRead = (messageId: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isRead: !msg.isRead }
          : msg
      )
    );
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         message.sender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         message.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLabels = selectedLabels.length === 0 || 
                         selectedLabels.some(label => message.labels.includes(label));
    
    return matchesSearch && matchesLabels;
  });

  const paginatedMessages = filteredMessages.slice(
    (currentPage - 1) * messagesPerPage,
    currentPage * messagesPerPage
  );

  const totalPages = Math.ceil(filteredMessages.length / messagesPerPage);

  const availableLabels = Array.from(new Set(messages.flatMap(msg => msg.labels)));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (viewMode === 'detail' && selectedMessage) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* Message Detail View */}
        <div className="mb-6">
          <button
            onClick={() => setViewMode('list')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Messages
          </button>
          
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedMessage.subject}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>From: {selectedMessage.sender.name} &lt;{selectedMessage.sender.email}&gt;</span>
                  <span>To: {selectedMessage.recipients.map(r => r.name).join(', ')}</span>
                  <span>{new Date(selectedMessage.receivedAt).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleStar(selectedMessage.id)}
                  className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
                >
                  {selectedMessage.isStarred ? <Star className="h-5 w-5 text-yellow-500" /> : <StarOff className="h-5 w-5" />}
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <Reply className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <Forward className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">{selectedMessage.content}</p>
              </div>
              
              {selectedMessage.hasAttachments && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Attachments</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Download className="h-4 w-4" />
                    <span>document.pdf (2.3 MB)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Messages</h1>
          <p className="text-gray-600">Manage and organize your emails</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsLoading(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Labels Filter */}
          <div className="flex flex-wrap gap-2">
            {availableLabels.map(label => (
              <button
                key={label}
                onClick={() => handleLabelFilter(label)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedLabels.includes(label)
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {paginatedMessages.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No messages found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div>
            {paginatedMessages.map((message) => (
              <div
                key={message.id}
                className={`border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors ${
                  !message.isRead ? 'bg-blue-50' : ''
                }`}
              >
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Star */}
                    <button
                      onClick={() => toggleStar(message.id)}
                      className="text-gray-400 hover:text-yellow-500 transition-colors"
                    >
                      {message.isStarred ? <Star className="h-4 w-4 text-yellow-500" /> : <StarOff className="h-4 w-4" />}
                    </button>

                    {/* Read/Unread indicator */}
                    <button
                      onClick={() => toggleRead(message.id)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {message.isRead ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>

                    {/* Message content */}
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        setSelectedMessage(message);
                        setViewMode('detail');
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-medium ${!message.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                              {message.sender.name}
                            </span>
                            {message.hasAttachments && (
                              <span className="text-blue-600">📎</span>
                            )}
                          </div>
                          <p className={`text-sm ${!message.isRead ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                            {message.subject}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {message.content}
                          </p>
                        </div>
                        <div className="text-right text-sm text-gray-500 ml-4">
                          <div>{new Date(message.receivedAt).toLocaleDateString()}</div>
                          <div className="text-xs">{message.serviceType}</div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1">
                      <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                        <Archive className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Labels */}
                  {message.labels.length > 0 && (
                    <div className="flex gap-2 mt-2 ml-10">
                      {message.labels.map(label => (
                        <span
                          key={label}
                          className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * messagesPerPage) + 1} to {Math.min(currentPage * messagesPerPage, filteredMessages.length)} of {filteredMessages.length} messages
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailMessages;

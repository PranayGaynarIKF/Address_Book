import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Download, 
  Users, 
  Mail, 
  Phone, 
  Building,
  FileText,
  Eye,
  MoreVertical,
  ChevronDown,
  X,
  Tag
} from 'lucide-react';
import { contactsAPI } from '../../services/api';
// Excel export functionality - using a simple CSV approach instead of XLSX
const exportToCSV = (data: any[], filename: string) => {
  if (!data.length) return;
  
  // Convert data to CSV format
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(',')
    )
  ].join('\n');
  
  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ContactTags component to display tags for a contact
const ContactTags: React.FC<{ contactId: string }> = ({ contactId }) => {
  console.log('ContactTags component rendered for contactId:', contactId);
  
  // Very simple test - just show a test tag for every contact
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="text-xs text-gray-600">ID: {contactId.substring(0, 8)}...</span>
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
        <Tag className="h-3 w-3 mr-1" />
        Test Tag
      </span>
    </div>
  );
};

interface ContactListProps {
  className?: string;
}

const ContactList: React.FC<ContactListProps> = ({ className = '' }) => {
  // State for filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSourceSystem, setSelectedSourceSystem] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setCurrentPageSize] = useState(10); // Reduced from 20 to 10 for faster loading
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when searching
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch contacts with filters - Optimized for performance
  const { data: contacts, isLoading, error, isFetching } = useQuery({
    queryKey: ['contactList', currentPage, pageSize, debouncedSearchTerm, selectedFilter, selectedSourceSystem],
    queryFn: () => {
      const params: any = { page: currentPage, limit: pageSize };
      
      if (selectedSourceSystem !== 'all') {
        params.sourceSystem = selectedSourceSystem;
      }
      
      if (debouncedSearchTerm) {
        params.q = debouncedSearchTerm;
      }
      
      return contactsAPI.getAll(params);
    },
    staleTime: 5 * 60 * 1000, // Reduced to 5 minutes for fresher data
    gcTime: 15 * 60 * 1000, // Reduced to 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1, // Reduce retries for faster failure handling
    refetchInterval: false, // Disable auto-refetch
  });

  // Memoize filtered contacts for better performance
  const filteredContacts = useMemo(() => contacts?.data?.data || [], [contacts?.data?.data]);
  const totalContacts = contacts?.data?.total || 0;
  const totalPages = Math.ceil(totalContacts / pageSize);

  // Export to CSV function
  const handleExportToCSV = () => {
    if (!filteredContacts.length) return;

    // Prepare data for export
    const exportData = filteredContacts.map(contact => ({
      'Name': contact.name || '',
      'Email': contact.email || '',
      'Mobile': contact.mobileE164 || '',
      'Company': contact.companyName || '',
      'Source System': contact.sourceSystem || '',
      'Relationship Type': contact.relationshipType || '',
      'Data Quality Score': contact.dataQualityScore || '',
      'Created At': contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : '',
      'Updated At': contact.updatedAt ? new Date(contact.updatedAt).toLocaleDateString() : '',
    }));

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0];
    const filename = `contacts_export_${date}.csv`;

    // Export using the CSV function
    exportToCSV(exportData, filename);
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().substring(0, 2);
  };

  // Get status color
  const getStatusColor = (contact: any) => {
    if (contact.companyName) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedFilter('all');
    setSelectedSourceSystem('all');
    setCurrentPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || selectedFilter !== 'all' || selectedSourceSystem !== 'all';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Users className="h-7 w-7 mr-3 text-primary-600" />
              Contact List
            </h1>
            <p className="text-gray-600 mt-2">
              View, filter, and export your contacts in a comprehensive list format
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
                         <button
               onClick={handleExportToCSV}
               disabled={!filteredContacts.length || isLoading}
               className="btn-secondary flex items-center justify-center space-x-2 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <Download className="h-5 w-5" />
               <span>Export to CSV</span>
             </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                 <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Contacts
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                             <input
                 type="text"
                 placeholder="Search by name, email, mobile, or company..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
               />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>

                     {/* Source System Filter */}
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">
               Source System
             </label>
             <select
               value={selectedSourceSystem}
               onChange={(e) => setSelectedSourceSystem(e.target.value)}
               className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
             >
               <option value="all">All Sources</option>
               <option value="MOBILE">Mobile</option>
               <option value="GMAIL">Gmail</option>
               <option value="ZOHO">Zoho</option>
               <option value="INVOICE">Invoice</option>
               <option value="ASHISH">Ashish</option>
             </select>
           </div>
           
           {/* Page Size Selector */}
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">
               Page Size
             </label>
             <select
               value={pageSize}
               onChange={(e) => {
                 setCurrentPageSize(Number(e.target.value));
                 setCurrentPage(1); // Reset to first page
               }}
               className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
             >
               <option value={10}>10 per page</option>
               <option value={20}>20 per page</option>
               <option value={50}>50 per page</option>
               <option value={100}>100 per page</option>
             </select>
           </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="font-medium">Active Filters:</span>
                {searchTerm && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    Search: "{searchTerm}"
                  </span>
                )}
                {selectedSourceSystem !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    Source: {selectedSourceSystem}
                  </span>
                )}
                {selectedFilter !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                    Status: {selectedFilter}
                  </span>
                )}
              </div>
              
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-3 py-1 rounded transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      {contacts?.data && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-primary-600" />
                <strong className="text-gray-900">{totalContacts}</strong>
                <span>total contacts</span>
              </span>
              <span className="text-gray-400">•</span>
              <span className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-blue-600" />
                <strong className="text-gray-900">{filteredContacts.length}</strong>
                <span>showing</span>
              </span>
              <span className="text-gray-400">•</span>
              <span className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-green-600" />
                <strong className="text-gray-900">{currentPage}</strong>
                <span>of {totalPages}</span>
              </span>
            </div>

            {debouncedSearchTerm && (
              <div className="flex items-center space-x-2 text-sm">
                <Search className="h-4 w-4 text-orange-600" />
                <span className="text-gray-600">Search results for:</span>
                <span className="font-medium text-gray-900">"{debouncedSearchTerm}"</span>
              </div>
            )}
          </div>
        </div>
      )}

             {/* Loading State - Optimized */}
       {isLoading && (
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
           <div className="animate-pulse">
             <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
             <div className="space-y-3">
               {[...Array(8)].map((_, i) => (
                 <div key={i} className="h-16 bg-gray-200 rounded"></div>
               ))}
             </div>
           </div>
         </div>
       )}
       
       {/* Fetching State - Show when updating data */}
       {!isLoading && isFetching && (
         <div className="fixed top-4 right-4 z-50">
           <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
             <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
             <span className="text-sm">Updating...</span>
           </div>
         </div>
       )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <X className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error loading contacts</h3>
              <p className="mt-1 text-sm text-red-700">
                <strong>Error:</strong> {error.message || 'Failed to load contacts'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contacts List */}
      {!isLoading && !error && filteredContacts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>                  
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-800">
                              {getInitials(contact.name)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                          <div className="text-sm text-gray-500 flex items-center space-x-2">
                            {contact.email && (
                              <span className="flex items-center space-x-1">
                                <Mail className="h-3 w-3" />
                                <span>{contact.email}</span>
                              </span>
                            )}
                                                         {contact.mobileE164 && (
                               <span className="flex items-center space-x-1">
                                 <Phone className="h-3 w-3" />
                                 <span>{contact.mobileE164}</span>
                               </span>
                             )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contact.companyName ? (
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{contact.companyName}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {contact.sourceSystem || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contact)}`}>
                        {contact.companyName ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-primary-600 hover:text-primary-900 transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredContacts.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {hasActiveFilters 
              ? 'Try adjusting your search or filters to find contacts.'
              : 'Get started by adding your first contact.'
            }
          </p>
        </div>
      )}

      {/* Pagination - Optimized */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <span>Showing page {currentPage} of {totalPages}</span>
              <span className="text-gray-400">•</span>
              <span>{filteredContacts.length} of {totalContacts} contacts</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || isFetching}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (page > totalPages) return null;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      disabled={isFetching}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        page === currentPage
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || isFetching}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
          
          {/* Quick Navigation */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || isFetching}
                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                First
              </button>
              <span className="text-gray-400">•</span>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || isFetching}
                className="px-2 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactList;

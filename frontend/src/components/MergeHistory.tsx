import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, 
  Filter, 
  Search, 
  Eye, 
  TrendingUp,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
// Import merge history API service - API client for merge history operations
import { mergeHistoryAPI } from '../services/mergeHistoryAPI';

interface MergeHistoryItem {
  id: string;
  mergeType: 'AUTO_MERGE' | 'MANUAL_MERGE' | 'DEDUPLICATION';
  primaryContactName: string;
  mergedContactName?: string;
  sourceSystem: string;
  mergeReason: 'SAME_PHONE' | 'SIMILAR_NAME' | 'EXACT_MATCH' | 'DUPLICATE_ENTRY';
  mergeDetails: any;
  mergedAt: string;
  mergedBy: string;
  beforeQualityScore: number;
  afterQualityScore: number;
  involvedSourceSystems: string[];
}

const MergeHistory: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedMergeType, setSelectedMergeType] = useState('all');
  const [selectedSourceSystem, setSelectedSourceSystem] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: mergeHistory, isLoading, error } = useQuery({
    queryKey: ['mergeHistory', currentPage, pageSize, selectedMergeType, selectedSourceSystem, startDate, endDate],
    queryFn: () => mergeHistoryAPI.getMergeHistory({
      page: currentPage,
      limit: pageSize,
      mergeType: selectedMergeType !== 'all' ? selectedMergeType : undefined,
      sourceSystem: selectedSourceSystem !== 'all' ? selectedSourceSystem : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    }),
  });

  const { data: statistics } = useQuery({
    queryKey: ['mergeStatistics'],
    queryFn: () => mergeHistoryAPI.getStatistics(),
  });

  const getMergeTypeIcon = (mergeType: string) => {
    switch (mergeType) {
      case 'AUTO_MERGE':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'MANUAL_MERGE':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'DEDUPLICATION':
        return <FileText className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getMergeReasonColor = (reason: string) => {
    switch (reason) {
      case 'EXACT_MATCH':
        return 'bg-red-100 text-red-800';
      case 'SIMILAR_NAME':
        return 'bg-yellow-100 text-yellow-800';
      case 'SAME_PHONE':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading merge history</h3>
              <div className="mt-2 text-sm text-red-700">
                {error.message || 'Failed to load merge history data'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Merge History</h1>
          <p className="text-gray-600">Track all contact merges and deduplication activities</p>
        </div>
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <span className="text-sm text-gray-600">Total Merges: {statistics?.totalMerges || 0}</span>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Merges</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalMerges}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Recent (7 days)</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.recentMerges}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Auto Deduplication</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.mergesByType?.DEDUPLICATION || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Manual Merges</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.mergesByType?.MANUAL_MERGE || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by contact names..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-enhanced pl-10 w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Merge Type</label>
            <select
              value={selectedMergeType}
              onChange={(e) => setSelectedMergeType(e.target.value)}
              className="input-enhanced min-w-[150px]"
            >
              <option value="all">All Types</option>
              <option value="AUTO_MERGE">Auto Merge</option>
              <option value="MANUAL_MERGE">Manual Merge</option>
              <option value="DEDUPLICATION">Deduplication</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source System</label>
            <select
              value={selectedSourceSystem}
              onChange={(e) => setSelectedSourceSystem(e.target.value)}
              className="input-enhanced min-w-[150px]"
            >
              <option value="all">All Sources</option>
              <option value="INVOICE">Invoice</option>
              <option value="GMAIL">Gmail</option>
              <option value="ZOHO">Zoho</option>
              <option value="ASHISH">Ashish</option>
              <option value="MOBILE">Mobile</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-enhanced"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-enhanced"
            />
          </div>
        </div>
      </div>

      {/* Merge History Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Merge History</h3>
          <p className="text-sm text-gray-600">
            Showing {mergeHistory?.data?.length || 0} of {mergeHistory?.total || 0} merges
          </p>
        </div>

        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading merge history...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Merge Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quality Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mergeHistory?.data?.map((item: MergeHistoryItem) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.primaryContactName}
                        </div>
                        {item.mergedContactName && (
                          <div className="text-sm text-gray-500">
                            ← {item.mergedContactName}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          {item.mergeDetails?.reason || 'No reason provided'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getMergeTypeIcon(item.mergeType)}
                        <span className="ml-2 text-sm text-gray-900">
                          {item.mergeType.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{item.sourceSystem}</div>
                      <div className="text-xs text-gray-500">
                        {item.involvedSourceSystems.join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          {item.beforeQualityScore} →
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {item.afterQualityScore}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(item.mergedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                        onClick={() => {
                          // Show detailed merge information
                          console.log('Merge details:', item);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {mergeHistory && mergeHistory.total > pageSize && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * pageSize) + 1} to{' '}
                {Math.min(currentPage * pageSize, mergeHistory.total)} of{' '}
                {mergeHistory.total} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage * pageSize >= mergeHistory.total}
                  className="btn-secondary disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MergeHistory;

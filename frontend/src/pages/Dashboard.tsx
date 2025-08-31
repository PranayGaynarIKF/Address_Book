import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  UserCheck, 
  FileText, 
  TrendingUp, 
  Activity, 
  Zap,
  ArrowUpRight,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { contactsAPI, ownersAPI, templatesAPI } from '../services/api';
import BackendTest from '../components/BackendTest';

const Dashboard: React.FC = () => {
  const { data: contacts, isLoading: contactsLoading, error: contactsError } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsAPI.getAll(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: owners, isLoading: ownersLoading, error: ownersError } = useQuery({
    queryKey: ['owners'],
    queryFn: () => ownersAPI.getAll(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: templates, isLoading: templatesLoading, error: templatesError } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesAPI.getAll(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Helper function to safely get data values
  const getSafeValue = (data: any, fallback: number = 0) => {
    if (!data) return fallback;
    if (typeof data === 'number') return data;
    if (data.data && typeof data.data === 'number') return data.data;
    if (data.data && Array.isArray(data.data)) return data.data.length;
    if (Array.isArray(data)) return data.length;
    return fallback;
  };



  const stats = [
    {
      name: 'Total Contacts',
      value: getSafeValue(contacts, 0),
      change: '+12%',
      changeType: 'positive',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      loading: contactsLoading,
      error: contactsError,
    },
    {
      name: 'Data Owners',
      value: getSafeValue(owners, 0),
      change: '+8%',
      changeType: 'positive',
      icon: UserCheck,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      loading: ownersLoading,
      error: ownersError,
    },
    {
      name: 'Message Templates',
      value: getSafeValue(templates, 0),
      change: '+15%',
      changeType: 'positive',
      icon: FileText,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      loading: templatesLoading,
      error: templatesError,
    },
    {
      name: 'Active Campaigns',
      value: 3,
      change: '+2',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      loading: false,
      error: null,
    },
  ];

  // Generate recent activities based on actual data
  const recentActivities = React.useMemo(() => {
    const activities = [];
    
    // Add contact activity if we have contacts
    if (contacts && getSafeValue(contacts, 0) > 0) {
      activities.push({
        id: 1,
        type: 'contact_added',
        message: `${getSafeValue(contacts, 0)} contacts available`,
        time: 'Recently updated',
        icon: Users,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      });
    }
    
    // Add template activity if we have templates
    if (templates && getSafeValue(templates, 0) > 0) {
      activities.push({
        id: 2,
        type: 'template_created',
        message: `${getSafeValue(templates, 0)} message templates available`,
        time: 'Recently updated',
        icon: FileText,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
      });
    }
    
    // Add owner activity if we have owners
    if (owners && getSafeValue(owners, 0) > 0) {
      activities.push({
        id: 3,
        type: 'owner_available',
        message: `${getSafeValue(owners, 0)} data owners available`,
        time: 'Recently updated',
        icon: UserCheck,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      });
    }
    
    // Add sync activity
    activities.push({
      id: 4,
      type: 'ingestion_completed',
      message: 'Data sync available',
      time: 'Ready to use',
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    });
    
    return activities;
  }, [contacts, owners, templates]);

  const quickActions = [
    {
      name: 'Add Contact',
      description: 'Create a new contact entry',
      icon: Users,
      href: '/contacts',
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
    },
    {
      name: 'Create Template',
      description: 'Design a new message template',
      icon: FileText,
      href: '/templates',
      color: 'from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700',
    },
    {
      name: 'Send Message',
      description: 'Send a message to contacts',
      icon: TrendingUp,
      href: '/messages',
      color: 'from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700',
    },
    {
      name: 'Run Sync',
      description: 'Import data from external sources',
      icon: Zap,
      href: '/ingestion',
      color: 'from-orange-500 to-orange-600',
      hoverColor: 'hover:from-orange-600 hover:to-orange-700',
    },
  ];

  return (
    <div className="space-y-8 relative">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-primary-100/30 to-purple-100/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-gradient-to-tr from-indigo-100/30 to-blue-100/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      {/* Welcome Section */}
      <div className="text-center animate-fade-in-up">
        <h1 className="text-4xl font-bold gradient-text mb-4">
          Welcome to IKF PhoneBook! 👋
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Here's what's happening with your professional contact management system today
        </p>
      </div>

      {/* Backend Connection Test */}
      <div className="mb-6">
        <BackendTest />
      </div>

      {/* Error Messages */}
      {(contactsError || ownersError || templatesError) && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 mb-2">⚠️ Data Loading Issues</h3>
          <div className="space-y-2 text-sm text-red-700">
            {contactsError && (
              <div>• <strong>Contacts:</strong> {contactsError.message || 'Failed to load contacts'}</div>
            )}
            {ownersError && (
              <div>• <strong>Owners:</strong> {ownersError.message || 'Failed to load owners'}</div>
            )}
            {templatesError && (
              <div>• <strong>Templates:</strong> {templatesError.message || 'Failed to load templates'}</div>
            )}
          </div>
          <div className="mt-3 text-xs text-red-600">
            Please check your backend connection and try refreshing the page.
          </div>
        </div>
      )}

      {/* Data Status and Refresh */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${contactsLoading ? 'bg-yellow-500' : contactsError ? 'bg-red-500' : 'bg-green-500'}`}></div>
              <span className="text-sm text-gray-600">Contacts</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${ownersLoading ? 'bg-yellow-500' : ownersError ? 'bg-red-500' : 'bg-green-500'}`}></div>
              <span className="text-sm text-gray-600">Owners</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${templatesLoading ? 'bg-yellow-500' : templatesError ? 'bg-red-500' : 'bg-green-500'}`}></div>
              <span className="text-sm text-gray-600">Templates</span>
            </div>
          </div>
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Dashboard
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
                         <div 
               key={stat.name}
               className="card-interactive group animate-fade-in-up relative overflow-hidden"
               style={{ animationDelay: `${index * 100}ms` }}
             >
               <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -skew-y-1"></div>
                             <div className="relative z-10 p-6">
                 <div className="flex items-center justify-between">
                   <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                     <Icon className="h-6 w-6 text-white" />
                   </div>
                   <div className={`text-sm font-medium ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                     {stat.change}
                   </div>
                 </div>
                                   <div className="mt-4">
                    {stat.loading ? (
                      <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                      </div>
                    ) : stat.error ? (
                      <div className="text-red-600">
                        <p className="text-lg font-semibold">Error</p>
                        <p className="text-sm">Failed to load data</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-gray-900">
                          {stat.value || 0}
                        </p>
                        <p className="text-sm text-gray-600">{stat.name}</p>
                      </>
                    )}
                  </div>
                 <div className="mt-4 flex items-center text-sm text-gray-500">
                   <TrendingUp className="h-4 w-4 mr-1" />
                   <span>From last month</span>
                 </div>
               </div>
            </div>
          );
        })}
      </div>



      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card animate-slide-in-left">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-primary-600" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <a
                      key={action.name}
                      href={action.href}
                      className="group block p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${action.color} ${action.hoverColor} flex items-center justify-center transition-all duration-200 group-hover:scale-110`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors duration-200">
                            {action.name}
                          </h3>
                          <p className="text-sm text-gray-500">{action.description}</p>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-200" />
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="card animate-slide-in-left" style={{ animationDelay: '200ms' }}>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-primary-600" />
                Recent Activities
              </h2>
              <div className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <div 
                        key={activity.id}
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 group animate-fade-in-up"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className={`w-8 h-8 rounded-lg ${activity.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                          <Icon className={`h-4 w-4 ${activity.color}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                          <p className="text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm">No recent activities</p>
                    <p className="text-xs">Data will appear here once loaded</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* System Status */}
          <div className="card animate-slide-in-right">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                System Status
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <span className="flex items-center text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">API Services</span>
                  <span className="flex items-center text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Healthy
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">External Integrations</span>
                  <span className="flex items-center text-sm text-yellow-600">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                    Warning
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="card animate-slide-in-right" style={{ animationDelay: '200ms' }}>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary-600" />
                Upcoming Tasks
              </h2>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <p className="text-sm font-medium text-blue-900">Data Backup</p>
                  <p className="text-xs text-blue-600">Scheduled for tomorrow</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <p className="text-sm font-medium text-purple-900">Template Review</p>
                  <p className="text-xs text-purple-600">Due in 2 days</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                  <p className="text-sm font-medium text-orange-900">System Update</p>
                  <p className="text-xs text-orange-600">Scheduled for next week</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

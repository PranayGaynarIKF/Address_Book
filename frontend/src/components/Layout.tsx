import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Users, 
  UserCheck, 
  FileText, 
  MessageSquare, 
  Database, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  Settings,
  Bell,
  Link as LinkIcon,
  History,
  Mail,
  Shield,
  MessageCircle,
  Tag,
  List
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Contacts', href: '/contacts', icon: Users },
    { name: 'Contact List', href: '/contact-list', icon: List },
    { name: 'Owners', href: '/owners', icon: UserCheck },
    { name: 'Templates', href: '/templates', icon: FileText },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'WhatsApp', href: '/whatsapp', icon: MessageCircle },
    { name: 'Email', href: '/email', icon: Mail },
    { name: 'Mail Accounts', href: '/mail-accounts', icon: Shield },
    { name: 'Sync', href: '/ingestion', icon: Database },
    { name: 'Data Sources', href: '/data-sources', icon: LinkIcon },
    { name: 'Merge History', href: '/merge-history', icon: History },
    { name: 'Tag Management', href: '/tag-management', icon: Tag },
  ];

  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
         <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 relative overflow-hidden">
       {/* Background Decorative Elements */}
       <div className="fixed inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-primary-100/20 to-purple-100/20 rounded-full blur-3xl animate-pulse"></div>
         <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-tr from-indigo-100/20 to-blue-100/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
       </div>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
             <div className={`
         fixed inset-y-0 left-0 z-50 w-64 bg-white/90 backdrop-blur-2xl border-r border-gray-200/50
         transform transition-all duration-500 ease-in-out lg:translate-x-0
         ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
         shadow-2xl shadow-gray-900/10
       `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
                <img src="/ikf-logo.svg" alt="IKF Logo" className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">IKF PhoneBook</h1>
                <p className="text-xs text-gray-500">Management System</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                                 <Link
                   key={item.name}
                   to={item.href}
                   className={`
                     group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ease-in-out relative overflow-hidden
                     ${active 
                       ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25' 
                       : 'text-gray-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-purple-50 hover:text-primary-600 hover:scale-105'
                     }
                   `}
                   onClick={() => setSidebarOpen(false)}
                 >
                   <div className="absolute inset-0 bg-gradient-to-r from-primary-100/20 to-purple-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                     <Icon className={`
                     h-5 w-5 mr-3 transition-all duration-200 ease-in-out relative z-10
                     ${active ? 'text-white' : 'text-gray-500 group-hover:text-primary-600'}
                   `} />
                   <span className="relative z-10">{item.name}</span>
                   {active && (
                     <ChevronRight className="h-4 w-4 ml-auto text-white/80 relative z-10" />
                   )}
                 </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-200/50">
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {user?.email ? `${user.email.split('@')[0]}` : 'User'}
                </p>
                <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
              </div>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <Settings className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full mt-3 flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all duration-200 ease-in-out hover:scale-105"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <Menu className="h-6 w-6 text-gray-600" />
              </button>
              <div className="hidden sm:block">
                <h2 className="text-lg font-semibold text-gray-900">
                  {navigation.find(item => isActive(item.href))?.name || 'Dashboard'}
                </h2>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 relative">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-200">
                <span className="text-white font-medium text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <div className="animate-fade-in-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

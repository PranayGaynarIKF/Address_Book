import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import ContactDetail from './pages/ContactDetail';
import Owners from './pages/Owners';
import OwnerDetail from './pages/OwnerDetail';
import Templates from './pages/Templates';
import TemplateDetail from './pages/TemplateDetail';
import Messages from './pages/Messages';
import WhatsApp from './pages/WhatsApp';
import Ingestion from './pages/Ingestion';
import Email from './pages/Email';
import MailAccounts from './pages/MailAccounts';
import DataSourceManager from './components/DataSourceManager';
import MergeHistory from './components/MergeHistory';
import OAuthCallback from './components/OAuthCallback';
import TagManagement from './components/TagManagement/TagManagement';
import ContactList from './components/ContactList/ContactList';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const router = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>,
  },
  {
    path: '/contacts',
    element: <ProtectedRoute><Layout><Contacts /></Layout></ProtectedRoute>,
  },
  {
    path: '/contacts/:id',
    element: <ProtectedRoute><Layout><ContactDetail /></Layout></ProtectedRoute>,
  },
  {
    path: '/owners',
    element: <ProtectedRoute><Layout><Owners /></Layout></ProtectedRoute>,
  },
  {
    path: '/owners/:id',
    element: <ProtectedRoute><Layout><OwnerDetail /></Layout></ProtectedRoute>,
  },
  {
    path: '/templates',
    element: <ProtectedRoute><Layout><Templates /></Layout></ProtectedRoute>,
  },
  {
    path: '/templates/:id',
    element: <ProtectedRoute><Layout><TemplateDetail /></Layout></ProtectedRoute>,
  },
  {
    path: '/messages',
    element: <ProtectedRoute><Layout><Messages /></Layout></ProtectedRoute>,
  },
  {
    path: '/whatsapp',
    element: <ProtectedRoute><Layout><WhatsApp /></Layout></ProtectedRoute>,
  },
  {
    path: '/ingestion',
    element: <ProtectedRoute><Layout><Ingestion /></Layout></ProtectedRoute>,
  },
  {
    path: '/email',
    element: <ProtectedRoute><Layout><Email /></Layout></ProtectedRoute>,
  },
  {
    path: '/mail-accounts',
    element: <ProtectedRoute><Layout><MailAccounts /></Layout></ProtectedRoute>,
  },
  {
    path: '/data-sources',
    element: <ProtectedRoute><Layout><DataSourceManager /></Layout></ProtectedRoute>,
  },
  {
    path: '/merge-history',
    element: <ProtectedRoute><Layout><MergeHistory /></Layout></ProtectedRoute>,
  },
  {
    path: '/tag-management',
    element: <ProtectedRoute><Layout><TagManagement /></Layout></ProtectedRoute>,
  },
  {
    path: '/contact-list',
    element: <ProtectedRoute><Layout><ContactList /></Layout></ProtectedRoute>,
  },
  {
    path: '/oauth-callback',
    element: <OAuthCallback />,
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import Login from './pages/Login';
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
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <Layout><Dashboard /></Layout>,
  },
  {
    path: '/contacts',
    element: <Layout><Contacts /></Layout>,
  },
  {
    path: '/contacts/:id',
    element: <Layout><ContactDetail /></Layout>,
  },
  {
    path: '/owners',
    element: <Layout><Owners /></Layout>,
  },
  {
    path: '/owners/:id',
    element: <Layout><OwnerDetail /></Layout>,
  },
  {
    path: '/templates',
    element: <Layout><Templates /></Layout>,
  },
  {
    path: '/templates/:id',
    element: <Layout><TemplateDetail /></Layout>,
  },
  {
    path: '/messages',
    element: <Layout><Messages /></Layout>,
  },
  {
    path: '/whatsapp',
    element: <Layout><WhatsApp /></Layout>,
  },
  {
    path: '/ingestion',
    element: <Layout><Ingestion /></Layout>,
  },
  {
    path: '/email',
    element: <Layout><Email /></Layout>,
  },
  {
    path: '/mail-accounts',
    element: <Layout><MailAccounts /></Layout>,
  },
  {
    path: '/data-sources',
    element: <Layout><DataSourceManager /></Layout>,
  },
  {
    path: '/merge-history',
    element: <Layout><MergeHistory /></Layout>,
  },
  {
    path: '/tag-management',
    element: <Layout><TagManagement /></Layout>,
  },
  {
    path: '/contact-list',
    element: <Layout><ContactList /></Layout>,
  },
  {
    path: '/oauth-callback',
    element: <OAuthCallback />,
  },
]);

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
};

export default App;

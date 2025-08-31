# IKF PhoneBook

A modern React-based frontend for the IKF PhoneBook/CRM system built with React Router 7, TypeScript, and Tailwind CSS.

## Features

- **Modern UI/UX**: Built with Tailwind CSS for a clean, responsive design
- **TypeScript**: Full type safety throughout the application
- **React Router 7**: Latest routing with nested routes and dynamic navigation
- **State Management**: React Query for server state management
- **Form Handling**: React Hook Form for efficient form management
- **Responsive Design**: Mobile-first approach with responsive sidebar navigation

## Pages & Functionality

### 🔐 Authentication
- Login page with email/password and Google OAuth support
- JWT token management
- Protected routes

### 📊 Dashboard
- Overview statistics (contacts, owners, templates, messages)
- Recent activity feed
- Quick action buttons

### 👥 Contacts Management
- View all contacts with search and filtering
- Add new contacts
- Edit existing contacts
- Delete contacts
- Contact detail view

### 👤 Data Owners
- Manage data ownership
- Create and edit owners
- Associate contacts with owners
- Owner detail view

### 📝 Message Templates
- Create message templates (SMS, WhatsApp, Email)
- Template variable support ({{firstName}}, {{company}})
- Edit and delete templates
- Template detail view

### 💬 Messaging
- Send messages using templates
- Preview messages with variables
- Message history tracking

### 🔄 Data Ingestion
- Import from multiple sources (Zoho CRM, Gmail, Invoice systems, Mobile)
- Clean and merge duplicate contacts
- Import status tracking

## Tech Stack

- **React 18** - Modern React with hooks
- **React Router 7** - Latest routing solution
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **React Query (TanStack Query)** - Server state management
- **React Hook Form** - Performant forms with validation
- **Axios** - HTTP client for API calls
- **Lucide React** - Beautiful, consistent icons

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Your NestJS backend running (default: http://localhost:3000)

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd ikf-phonebook
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure your backend URL:**
   
   Create a `.env` file in the root directory:
   ```env
   REACT_APP_API_URL=http://localhost:3000
   ```
   
   Or modify the default URL in `src/services/api.ts`

4. **Start the development server:**
   ```bash
   npm start
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main layout with sidebar navigation
│   └── ContactModal.tsx # Contact add/edit modal
├── pages/              # Page components
│   ├── Login.tsx       # Authentication page
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Contacts.tsx    # Contacts list and management
│   ├── Owners.tsx      # Data owners management
│   ├── Templates.tsx   # Message templates
│   ├── Messages.tsx    # Send messages
│   ├── Ingestion.tsx   # Data import management
│   └── [Detail pages]  # Individual item detail views
├── services/           # API service layer
│   └── api.ts         # All API endpoints and axios configuration
├── types/              # TypeScript type definitions
│   └── index.ts       # API response types and interfaces
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── App.tsx             # Main app component with routing
└── index.tsx           # Application entry point
```

## API Integration

The frontend is designed to work with your NestJS backend API. All endpoints are configured in `src/services/api.ts`:

- **Authentication**: `/auth/login`, `/auth/google/*`
- **Contacts**: `/contacts` (CRUD operations)
- **Owners**: `/owners` (CRUD operations)
- **Templates**: `/templates` (CRUD operations)
- **Messages**: `/messages/*` (send, preview, history)
- **Ingestion**: `/ingestion/*` (data import operations)

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App (not recommended)

## Customization

### Styling
- Modify `tailwind.config.js` for theme customization
- Update `src/index.css` for global styles
- Use Tailwind utility classes throughout components

### API Configuration
- Update `src/services/api.ts` for different backend URLs
- Modify API endpoints as needed
- Add new API services following the existing pattern

### Routing
- Update `src/App.tsx` for new routes
- Add new page components in `src/pages/`
- Update navigation in `src/components/Layout.tsx`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow the existing code structure and patterns
2. Use TypeScript for all new code
3. Follow the established naming conventions
4. Test your changes thoroughly
5. Update documentation as needed

## License

This project is part of the Phonebook/CRM system.

## Support

For issues or questions, please refer to your development team or create an issue in the project repository.

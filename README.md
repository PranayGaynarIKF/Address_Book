# Address Book System

A complete address book management system with NestJS backend API and React frontend.

## 🏗️ Project Structure

```
Address_Book/
├── backend/          # NestJS API server
├── frontend/         # React web application
├── README.md         # This file
└── .gitignore        # Git ignore rules
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### Backend Setup
```bash
cd backend
npm install
npm run start:dev
```

The backend will run on `http://localhost:4002`

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

The frontend will run on `http://localhost:3000`

## ✨ Features

### Backend (NestJS)
- RESTful API endpoints
- Contact management
- Email integration (Gmail OAuth)
- WhatsApp messaging
- Data synchronization
- User authentication
- Database integration (SQL Server)

### Frontend (React)
- Modern React with TypeScript
- TanStack Query for data fetching
- Tailwind CSS for styling
- Contact management interface
- Email composition
- WhatsApp integration
- Tag management system
- Data ingestion/sync interface

## 🔧 API Endpoints

- `GET /contacts` - Get all contacts
- `POST /contacts` - Create new contact
- `GET /owners` - Get data owners
- `POST /email/messages/send` - Send emails
- `POST /whatsapp/send-text-message` - Send WhatsApp messages
- `POST /ingestion/gmail/run` - Run Gmail sync

## 📁 Key Components

### Backend
- `apps/api/src/` - Main API application
- `apps/api/src/contacts/` - Contact management
- `apps/api/src/email/` - Email services
- `apps/api/src/auth/` - Authentication
- `apps/api/src/whatsapp/` - WhatsApp integration

### Frontend
- `src/pages/` - Main page components
- `src/components/` - Reusable components
- `src/services/` - API service layer
- `src/types/` - TypeScript type definitions

## 🚀 Deployment

### Backend
```bash
cd backend
npm run build
npm run start:prod
```

### Frontend
```bash
cd frontend
npm run build
```

## 🔑 Environment Variables

### Backend
- `DATABASE_URL` - Database connection string
- `JWT_SECRET` - JWT signing secret
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

### Frontend
- `REACT_APP_API_URL` - Backend API URL

## 📝 License

This project is proprietary to IKF Technologies.

## 👥 Contributors

- Pranay Gaynar (IKF Technologies)

---

**Note**: Make sure to configure your environment variables and database connections before running the application.

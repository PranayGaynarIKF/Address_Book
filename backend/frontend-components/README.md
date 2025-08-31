# Frontend Components

This directory contains React TypeScript components for the tagging system frontend.

## Important Notes

- **These are FRONTEND components only**
- **Do NOT compile with backend TypeScript**
- **Each component has its own tsconfig.json for frontend compilation**
- **These files are excluded from backend compilation via tsconfig.json**

## Components

- `TagDemo.tsx` - Demo component for testing the tagging system
- `TagManagement.tsx` - Full-featured tag management interface

## Usage

These components are designed to be used in a React frontend project where:
- React and React DOM are installed
- Axios is available for HTTP requests
- TypeScript is configured with JSX support

## Backend Integration

The backend API endpoints for the tagging system are available at:
- Base URL: `http://localhost:4002`
- API Documentation: `http://localhost:4002/docs`
- All endpoints require JWT authentication

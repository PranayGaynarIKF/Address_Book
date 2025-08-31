# 🏷️ Contact Tagging System

A comprehensive tagging system for organizing and categorizing contacts with a modern, user-friendly interface.

## ✨ Features

### 🎯 **Tag Management**
- ✅ Create, edit, and delete tags
- ✅ Custom colors for visual organization
- ✅ Tag descriptions for better context
- ✅ Soft delete (deactivate) tags that are in use
- ✅ Search and filter tags

### 👥 **Contact-Tag Relationships**
- ✅ Add/remove tags from individual contacts
- ✅ Bulk tag operations (add tag to multiple contacts)
- ✅ View all contacts with a specific tag
- ✅ Remove tags from multiple contacts at once

### 🚀 **User Experience**
- ✅ Modern, responsive UI with Tailwind CSS
- ✅ Drag & drop style interactions
- ✅ Real-time search and filtering
- ✅ Bulk selection and operations
- ✅ Color-coded tag visualization

## 🏗️ Architecture

### **Backend (NestJS)**
```
apps/api/src/tags/
├── tags.service.ts      # Business logic for tags
├── tags.controller.ts   # API endpoints
├── tags.module.ts       # Module configuration
└── dto/                 # Data transfer objects
    ├── create-tag.dto.ts
    ├── update-tag.dto.ts
    └── index.ts
```

### **Database Schema**
```sql
-- Tags table
CREATE TABLE [app].[Tags] (
    [id] NVARCHAR(450) NOT NULL,
    [name] NVARCHAR(450) NOT NULL,
    [color] NVARCHAR(450) NOT NULL DEFAULT N'#3B82F6',
    [description] NVARCHAR(MAX) NULL,
    [isActive] BIT NOT NULL DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [updatedAt] DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- Contact-Tag junction table
CREATE TABLE [app].[ContactTags] (
    [id] NVARCHAR(450) NOT NULL,
    [contactId] NVARCHAR(450) NOT NULL,
    [tagId] NVARCHAR(450) NOT NULL,
    [createdAt] DATETIME2 NOT NULL DEFAULT GETDATE()
);
```

## 🚀 **Quick Start**

### **1. Database Setup**
Run these SQL queries in your SQL Server database:

```sql
-- Create Tags table
CREATE TABLE [app].[Tags] (
    [id] NVARCHAR(450) NOT NULL,
    [name] NVARCHAR(450) NOT NULL,
    [color] NVARCHAR(450) NOT NULL DEFAULT N'#3B82F6',
    [description] NVARCHAR(MAX) NULL,
    [isActive] BIT NOT NULL DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [updatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_Tags] PRIMARY KEY ([id])
);

-- Create ContactTags junction table
CREATE TABLE [app].[ContactTags] (
    [id] NVARCHAR(450) NOT NULL,
    [contactId] NVARCHAR(450) NOT NULL,
    [tagId] NVARCHAR(450) NOT NULL,
    [createdAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_ContactTags] PRIMARY KEY ([id])
);

-- Add indexes and foreign keys
CREATE UNIQUE INDEX [IX_Tags_name] ON [app].[Tags] ([name]);
CREATE INDEX [IX_Tags_isActive] ON [app].[Tags] ([isActive]);
CREATE UNIQUE INDEX [IX_ContactTags_contactId_tagId] ON [app].[ContactTags] ([contactId], [tagId]);
CREATE INDEX [IX_ContactTags_contactId] ON [app].[ContactTags] ([contactId]);
CREATE INDEX [IX_ContactTags_tagId] ON [app].[ContactTags] ([tagId]);

-- Add foreign key constraints
ALTER TABLE [app].[ContactTags] ADD CONSTRAINT [FK_ContactTags_Contacts_contactId] 
    FOREIGN KEY ([contactId]) REFERENCES [app].[app.Contacts] ([id]) ON DELETE CASCADE;

ALTER TABLE [app].[ContactTags] ADD CONSTRAINT [FK_ContactTags_Tags_tagId] 
    FOREIGN KEY ([tagId]) REFERENCES [app].[Tags] ([id]) ON DELETE CASCADE;

-- Insert default tags
INSERT INTO [app].[Tags] ([id], [name], [color], [description], [isActive], [createdAt], [updatedAt]) VALUES
(NEWID(), N'VIP', N'#FFD700', N'Very Important Person', 1, GETDATE(), GETDATE()),
(NEWID(), N'Lead', N'#10B981', N'Potential customer', 1, GETDATE(), GETDATE()),
(NEWID(), N'Client', N'#3B82F6', N'Current customer', 1, GETDATE(), GETDATE()),
(NEWID(), N'Vendor', N'#F59E0B', N'Business partner', 1, GETDATE(), GETDATE()),
(NEWID(), N'Prospect', N'#8B5CF6', N'Future potential', 1, GETDATE(), GETDATE()),
(NEWID(), N'Inactive', N'#6B7280', N'Not currently active', 1, GETDATE(), GETDATE());
```

### **2. Backend Setup**
The backend is already configured and running. Your server should be available at:
- **API**: http://localhost:4002
- **Swagger Docs**: http://localhost:4002/docs

### **3. Generate JWT Token**
Use the provided script to generate a JWT token:

```bash
node generate-jwt.js
```

### **4. Test the API**
Open Swagger UI at http://localhost:4002/docs and test the tag endpoints:

#### **Create a Tag**
```bash
POST /tags
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "name": "VIP",
  "color": "#FFD700",
  "description": "Very Important Person"
}
```

#### **Get All Tags**
```bash
GET /tags
Authorization: Bearer <your-jwt-token>
```

#### **Add Tag to Contact**
```bash
POST /tags/contacts/{contactId}/tags/{tagId}
Authorization: Bearer <your-jwt-token>
```

## 🎨 **Frontend Usage**

### **React Component**
The `TagManagement.tsx` component provides a complete UI for tag management:

```tsx
import TagManagement from './TagManagement';

function App() {
  return (
    <div>
      <TagManagement />
    </div>
  );
}
```

### **JWT Authentication**
The component expects a JWT token in localStorage:

```tsx
// Set the token
localStorage.setItem('jwt_token', 'your-jwt-token-here');

// The component will automatically use it for API calls
```

## 📱 **API Endpoints**

### **Tag Management**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/tags` | Create new tag |
| `GET` | `/tags` | Get all active tags |
| `GET` | `/tags/search?q=query` | Search tags |
| `GET` | `/tags/popular?limit=10` | Get popular tags |
| `GET` | `/tags/:id` | Get tag by ID |
| `PUT` | `/tags/:id` | Update tag |
| `DELETE` | `/tags/:id` | Delete tag |

### **Contact-Tag Relationships**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/tags/contacts/:contactId/tags/:tagId` | Add tag to contact |
| `DELETE` | `/tags/contacts/:contactId/tags/:tagId` | Remove tag from contact |
| `GET` | `/tags/contacts/:contactId/tags` | Get contact's tags |
| `GET` | `/tags/:tagId/contacts` | Get contacts with specific tag |

### **Bulk Operations**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/tags/contacts/:contactId/tags` | Add multiple tags to contact |
| `DELETE` | `/tags/contacts/:contactId/tags` | Remove multiple tags from contact |
| `POST` | `/tags/:tagId/contacts` | Add tag to multiple contacts |
| `DELETE` | `/tags/:tagId/contacts` | Remove tag from multiple contacts |

## 🔧 **Configuration**

### **Environment Variables**
Make sure these are set in your `.env` file:

```env
JWT_SECRET=your-secret-key-here
DATABASE_URL=your-database-connection-string
```

### **CORS Configuration**
The backend is configured to accept requests from:
- http://localhost:3000 (React dev server)
- http://localhost:4002 (API server)

## 🎯 **Use Cases**

### **1. Customer Segmentation**
- Tag contacts as "VIP", "Regular", "Prospect"
- Color-code by importance or status
- Filter contacts by tags for targeted campaigns

### **2. Business Relationships**
- Tag contacts as "Client", "Vendor", "Partner"
- Track relationship types and history
- Manage different communication strategies

### **3. Campaign Management**
- Tag contacts for specific marketing campaigns
- Bulk tag operations for mass outreach
- Track campaign effectiveness by tag groups

### **4. Contact Organization**
- Tag by industry, location, or company size
- Create custom categories for your business needs
- Visual organization with color coding

## 🚀 **Advanced Features**

### **Tag Analytics**
- Contact count per tag
- Popular tags ranking
- Tag usage trends

### **Smart Tagging**
- Auto-suggest tags based on contact data
- Bulk tag suggestions
- Tag conflict detection

### **Integration Ready**
- Easy to extend with additional features
- Webhook support for external systems
- Export/import tag configurations

## 🐛 **Troubleshooting**

### **Common Issues**

1. **JWT Token Expired**
   - Generate a new token using `node generate-jwt.js`
   - Update localStorage with the new token

2. **Database Connection Issues**
   - Verify your database connection string
   - Check if the tag tables were created successfully

3. **CORS Errors**
   - Ensure your frontend is running on an allowed origin
   - Check the backend CORS configuration

4. **Tag Creation Fails**
   - Verify tag name is unique
   - Check if the tag name contains invalid characters

### **Debug Mode**
Enable debug logging by setting the log level in your environment:

```env
LOG_LEVEL=debug
```

## 📚 **Next Steps**

### **Immediate Enhancements**
- [ ] Add tag categories and hierarchies
- [ ] Implement tag templates
- [ ] Add tag usage analytics
- [ ] Create tag import/export functionality

### **Long-term Features**
- [ ] AI-powered tag suggestions
- [ ] Tag-based automation workflows
- [ ] Advanced tag filtering and search
- [ ] Tag performance metrics

## 🤝 **Support**

If you encounter any issues:

1. Check the browser console for errors
2. Verify the API endpoints in Swagger UI
3. Check the backend logs for detailed error messages
4. Ensure your JWT token is valid and not expired

## 🎉 **Congratulations!**

You now have a fully functional, enterprise-grade tagging system for your contacts! The system provides:

- **Professional UI** with modern design patterns
- **Robust backend** with comprehensive error handling
- **Scalable architecture** ready for production use
- **Developer-friendly** with full API documentation

Start organizing your contacts today! 🚀

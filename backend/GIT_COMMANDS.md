# Git Commands for GitHub Repository Setup

## 🚀 **Quick Setup (Run these commands in order)**

### **1. Initialize Git Repository**
```bash
git init
```

### **2. Add GitHub Remote**
```bash
git remote add origin https://github.com/PranayGaynarIKF/Automated_Contact_Collection.git
```

### **3. Verify Remote Added**
```bash
git remote -v
```

### **4. Add All Files**
```bash
git add .
```

### **5. Make Initial Commit**
```bash
git commit -m "Initial commit: NestJS API for Automated Contact Collection

- Multi-database architecture (Main + Invoice)
- Gmail OAuth integration for contact collection
- Database management and health monitoring
- API endpoints for ingestion and management
- Comprehensive error handling and logging
- Updated README with project documentation"
```

### **6. Push to GitHub**
```bash
git push -u origin main
```

## 🔧 **Alternative: Step-by-Step Setup**

### **Step 1: Check Git Status**
```bash
git status
```

### **Step 2: Check Remote Configuration**
```bash
git remote -v
```

### **Step 3: If Remote Already Exists, Remove and Re-add**
```bash
git remote remove origin
git remote add origin https://github.com/PranayGaynarIKF/Automated_Contact_Collection.git
```

### **Step 4: Check What Files Will Be Committed**
```bash
git status --porcelain
```

### **Step 5: Add Specific Files (if needed)**
```bash
git add apps/
git add packages/
git add prisma/
git add README.md
git add .gitignore
git add package.json
git add nest-cli.json
git add tsconfig.json
```

### **Step 6: Commit with Detailed Message**
```bash
git commit -m "Initial commit: NestJS API for Automated Contact Collection

Features:
- Multi-database architecture (Main + Invoice)
- Gmail OAuth integration for contact collection
- Database management and health monitoring
- API endpoints for ingestion and management
- Comprehensive error handling and logging
- Updated README with project documentation

Tech Stack:
- NestJS (Node.js)
- SQL Server with Prisma ORM
- Google OAuth 2.0
- JWT and API key authentication
- Swagger documentation"
```

### **Step 7: Push to GitHub**
```bash
git push -u origin main
```

## 🚨 **Troubleshooting Commands**

### **If Push Fails - Check Authentication**
```bash
# Check if you're authenticated
git config --list | grep user

# Set your Git credentials if needed
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### **If Branch Issues - Check Current Branch**
```bash
git branch
git branch -a
```

### **If Remote Issues - Check and Fix**
```bash
# Check current remote
git remote -v

# Remove and re-add remote
git remote remove origin
git remote add origin https://github.com/PranayGaynarIKF/Automated_Contact_Collection.git

# Verify remote
git remote -v
```

### **If Merge Issues - Reset and Start Over**
```bash
# Reset to clean state
git reset --hard HEAD
git clean -fd

# Start over
git add .
git commit -m "Initial commit: NestJS API for Automated Contact Collection"
git push -u origin main
```

## 📋 **What Gets Committed**

The `.gitignore` file ensures these files are **NOT** committed:
- ❌ `.env` (environment variables)
- ❌ `google-tokens.json` (Google OAuth tokens)
- ❌ `service-account.json` (service account keys)
- ❌ `node_modules/` (dependencies)
- ❌ `dist/` (build output)
- ❌ Log files and temporary files

These files **WILL** be committed:
- ✅ Source code (`apps/api/src/`)
- ✅ Configuration files (`package.json`, `tsconfig.json`)
- ✅ Database schema (`prisma/`)
- ✅ Documentation (`README.md`)
- ✅ Project configuration (`.gitignore`, `nest-cli.json`)

## 🔐 **GitHub Authentication**

You may be prompted for GitHub credentials. Use:
- **Username**: Your GitHub username
- **Password**: Your GitHub Personal Access Token (not your GitHub password)

### **Create Personal Access Token:**
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Select scopes: `repo`, `workflow`
4. Copy the token and use it as your password

## 🎉 **After Successful Push**

1. **Visit your repository**: https://github.com/PranayGaynarIKF/Automated_Contact_Collection
2. **Verify files are uploaded**
3. **Check README.md is displayed properly**
4. **Set up GitHub authentication for future pushes**

## 📚 **Future Development Commands**

### **Daily Development Workflow**
```bash
# Check status
git status

# Add changes
git add .

# Commit changes
git commit -m "Description of changes"

# Push to GitHub
git push origin main
```

### **Pull Latest Changes**
```bash
git pull origin main
```

### **Create Feature Branch**
```bash
git checkout -b feature/new-feature
# ... make changes ...
git add .
git commit -m "Add new feature"
git push origin feature/new-feature
```

---

**Need Help?** Run the PowerShell script `setup-git.ps1` for automated setup!

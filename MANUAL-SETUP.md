# Manual Setup Guide

## 🚀 Quick Setup (Choose One Method)

### Method 1: Run the Setup Script
```bash
# In PowerShell
.\setup-repository.ps1

# Or in Command Prompt
setup-repository.bat
```

### Method 2: Manual Commands
```bash
# 1. Copy backend project
Copy-Item -Path "..\Automation" -Destination ".\backend" -Recurse -Force

# 2. Copy frontend project
Copy-Item -Path "..\Automation Frontend" -Destination ".\frontend" -Recurse -Force

# 3. Initialize git
git init
git remote add origin https://github.com/PranayGaynarIKF/Address_Book.git
git branch -M main
```

## 📁 Final Structure
```
Address_Book_Combined/
├── backend/              # Your NestJS API
├── frontend/             # Your React app
├── README.md             # Project documentation
├── .gitignore            # Git ignore rules
├── setup-repository.ps1  # PowerShell setup script
├── setup-repository.bat  # Batch setup script
└── MANUAL-SETUP.md       # This file
```

## 🔧 Git Commands to Run

After setting up the structure:

```bash
# 1. Add all files
git add .

# 2. Commit
git commit -m "Initial commit: Add NestJS backend and React frontend"

# 3. Push to GitHub
git push -u origin main
```

## ✅ Verification

Check that:
- `backend/` contains your Automation project
- `frontend/` contains your Automation Frontend project
- Both projects have their `package.json` files
- No `node_modules/` folders are included (they're in .gitignore)

## 🆘 Troubleshooting

If you get errors:
1. Make sure both projects exist in the parent directory
2. Check that you have git installed
3. Verify your GitHub repository URL
4. Make sure you have write access to the repository

## 📞 Need Help?

The setup scripts will guide you through each step and show you exactly what's happening!

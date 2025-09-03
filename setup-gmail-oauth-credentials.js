#!/usr/bin/env node

/**
 * Gmail OAuth Setup Script
 * This script helps you set up Gmail OAuth credentials for email sending
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Gmail OAuth Setup Script');
console.log('============================\n');

// Check if .env file exists
const envPath = path.join(__dirname, 'backend', '.env');
const envExamplePath = path.join(__dirname, 'backend', 'env.example');

if (!fs.existsSync(envPath)) {
  console.log('❌ No .env file found in backend directory');
  console.log('📋 Creating .env file from env.example...\n');
  
  if (fs.existsSync(envExamplePath)) {
    const envContent = fs.readFileSync(envExamplePath, 'utf8');
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env file from env.example');
  } else {
    console.log('❌ env.example file not found');
    process.exit(1);
  }
} else {
  console.log('✅ .env file already exists');
}

console.log('\n🔑 Gmail OAuth Configuration Required:');
console.log('=====================================');
console.log('You need to set up Gmail OAuth credentials in your backend/.env file:');
console.log('');
console.log('1. Go to Google Cloud Console: https://console.cloud.google.com/');
console.log('2. Create a new project or select existing one');
console.log('3. Enable Gmail API:');
console.log('   - Go to "APIs & Services" > "Library"');
console.log('   - Search for "Gmail API"');
console.log('   - Click "Enable"');
console.log('');
console.log('4. Create OAuth 2.0 Credentials:');
console.log('   - Go to "APIs & Services" > "Credentials"');
console.log('   - Click "Create Credentials" > "OAuth 2.0 Client IDs"');
console.log('   - Choose "Web application"');
console.log('   - Set authorized redirect URIs:');
console.log('     * http://localhost:4002/api/mail-accounts/oauth-callback');
console.log('     * http://localhost:3000/oauth-callback');
console.log('');
console.log('5. Copy the Client ID and Client Secret');
console.log('');
console.log('6. Update your backend/.env file with:');
console.log('   GOOGLE_CLIENT_ID=your_actual_google_client_id_here');
console.log('   GOOGLE_CLIENT_SECRET=your_actual_google_client_secret_here');
console.log('   GOOGLE_REDIRECT_URI=http://localhost:4002/api/mail-accounts/oauth-callback');
console.log('');

// Check current .env content
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  if (envContent.includes('GOOGLE_CLIENT_ID=841363311636-sdfrlpv97qc32fbb2hhqlj3m7600kau8.apps.googleusercontent.com')) {
    console.log('⚠️  WARNING: You are using example Gmail credentials!');
    console.log('   These are placeholder values and will not work.');
    console.log('   Please replace them with your actual Google OAuth credentials.\n');
  }
  
  if (envContent.includes('your_actual_google_client_id_here')) {
    console.log('⚠️  WARNING: Gmail credentials are not configured!');
    console.log('   Please replace the placeholder values with your actual credentials.\n');
  }
  
  console.log('📋 Next Steps:');
  console.log('==============');
  console.log('1. Update your Gmail OAuth credentials in backend/.env');
  console.log('2. Start the backend server: cd backend && npm run start:dev');
  console.log('3. Test OAuth setup by visiting: http://localhost:4002/auth/google/login');
  console.log('4. Complete the OAuth flow to generate tokens');
  console.log('5. Test email sending functionality');
  console.log('');
  console.log('🔗 Useful URLs:');
  console.log('===============');
  console.log('- OAuth Login: http://localhost:4002/api/mail-accounts/google-oauth');
console.log('- OAuth Callback: http://localhost:4002/api/mail-accounts/oauth-callback');
  console.log('- Test Tokens: http://localhost:4002/email/test-tokens');
  console.log('');
  
} catch (error) {
  console.log('❌ Error reading .env file:', error.message);
}

console.log('✅ Setup script completed!');

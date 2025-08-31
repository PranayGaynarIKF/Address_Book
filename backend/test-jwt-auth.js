const jwt = require('jsonwebtoken');
require('dotenv').config();

// Test JWT authentication
async function testJWTAuth() {
  console.log('🧪 Testing JWT Authentication');
  console.log('==============================');
  
  // Check environment variables
  const JWT_SECRET = process.env.JWT_SECRET;
  const ADMIN_EMAILS = process.env.ADMIN_EMAILS;
  
  console.log(`JWT_SECRET: ${JWT_SECRET ? '✅ Set' : '❌ Not set'}`);
  console.log(`ADMIN_EMAILS: ${ADMIN_EMAILS ? '✅ Set' : '❌ Not set'}`);
  
  if (!JWT_SECRET) {
    console.log('\n❌ JWT_SECRET is not set in your .env file');
    console.log('   Please add: JWT_SECRET=your_secret_here');
    return;
  }
  
  if (!ADMIN_EMAILS) {
    console.log('\n❌ ADMIN_EMAILS is not set in your .env file');
    console.log('   Please add: ADMIN_EMAILS=your@email.com');
    return;
  }
  
  console.log(`\n📧 Admin emails: ${ADMIN_EMAILS}`);
  
  // Test token generation
  const testEmail = ADMIN_EMAILS.split(',')[0].trim();
  console.log(`\n🔐 Testing with email: ${testEmail}`);
  
  try {
    const payload = {
      email: testEmail,
      sub: testEmail,
      iat: Math.floor(Date.now() / 1000)
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    console.log('✅ JWT token generated successfully!');
    console.log(`\n📋 Token: ${token}`);
    
    // Test token verification
    console.log('\n🔍 Verifying token...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token verification successful!');
    console.log(`   Email: ${decoded.email}`);
    console.log(`   Expires: ${new Date(decoded.exp * 1000).toISOString()}`);
    
    console.log('\n🚀 Your JWT authentication is working!');
    console.log('\n📖 Usage:');
    console.log('   1. In Swagger UI: Click Authorize → Enter token');
    console.log('   2. In API calls: Authorization: Bearer <token>');
    
  } catch (error) {
    console.log('❌ JWT test failed:', error.message);
  }
}

// Test Google OAuth configuration
function testGoogleOAuth() {
  console.log('\n\n🔍 Testing Google OAuth Configuration');
  console.log('=====================================');
  
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
  
  console.log(`GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Not set'}`);
  console.log(`GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Not set'}`);
  console.log(`GOOGLE_REDIRECT_URI: ${GOOGLE_REDIRECT_URI ? '✅ Set' : '❌ Not set'}`);
  
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.log('\n❌ Google OAuth credentials are missing');
    console.log('   Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file');
    return;
  }
  
  if (!GOOGLE_REDIRECT_URI) {
    console.log('\n❌ GOOGLE_REDIRECT_URI is not set');
    console.log('   Please set GOOGLE_REDIRECT_URI in your .env file');
    console.log('   Recommended: GOOGLE_REDIRECT_URI=http://localhost:4000/auth/google/callback');
    return;
  }
  
  console.log('\n✅ Google OAuth configuration looks good!');
  console.log(`   Redirect URI: ${GOOGLE_REDIRECT_URI}`);
  
  // Check if redirect URI matches your app
  if (GOOGLE_REDIRECT_URI.includes('localhost:3000')) {
    console.log('\n⚠️  Warning: Your redirect URI points to port 3000');
    console.log('   But your NestJS app runs on port 4000');
    console.log('   Consider updating to: http://localhost:4000/auth/google/callback');
  }
}

// Run tests
async function runTests() {
  await testJWTAuth();
  testGoogleOAuth();
}

runTests().catch(console.error);

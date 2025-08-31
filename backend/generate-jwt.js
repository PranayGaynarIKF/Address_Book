const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT configuration (same as your app)
const JWT_SECRET = process.env.JWT_SECRET || 'change_me';
const EXPIRES_IN = '24h';

// Function to generate JWT token
function generateJWTToken(email) {
  const payload = {
    email: email,
    sub: email,
    iat: Math.floor(Date.now() / 1000)
  };

  try {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN });
    
    // Decode the token to get the actual expiration time
    const decoded = jwt.decode(token);
    
    return {
      token: token,
      payload: payload,
      expiresAt: new Date(decoded.exp * 1000).toISOString()
    };
  } catch (error) {
    console.error('Error generating JWT token:', error.message);
    return null;
  }
}

// Function to verify JWT token
function verifyJWTToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      valid: true,
      payload: decoded,
      expiresAt: new Date(decoded.exp * 1000).toISOString()
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

// Main execution
if (require.main === module) {
  const email = process.argv[2] || 'admin@example.com';
  
  console.log('🔐 JWT Token Generator');
  console.log('========================');
  console.log(`JWT Secret: ${JWT_SECRET}`);
  console.log(`Expires In: ${EXPIRES_IN}`);
  console.log(`Email: ${email}`);
  console.log('');

  // Generate token
  const result = generateJWTToken(email);
  
  if (result) {
    console.log('✅ Generated JWT Token:');
    console.log('========================');
    console.log(`Token: ${result.token}`);
    console.log('');
    console.log('📋 Token Details:');
    console.log(`   Email: ${result.payload.email}`);
    console.log(`   Subject: ${result.payload.sub}`);
    console.log(`   Issued At: ${new Date(result.payload.iat * 1000).toISOString()}`);
    console.log(`   Expires At: ${result.expiresAt}`);
    console.log('');
    
    // Verify the token
    console.log('🔍 Verifying token...');
    const verification = verifyJWTToken(result.token);
    if (verification.valid) {
      console.log('✅ Token is valid!');
    } else {
      console.log('❌ Token verification failed:', verification.error);
    }
    
    console.log('');
    console.log('🚀 Usage:');
    console.log('   Add this header to your API requests:');
    console.log(`   Authorization: Bearer ${result.token}`);
    console.log('');
    console.log('   Or use in Swagger UI:');
    console.log(`   ${result.token}`);
  } else {
    console.log('❌ Failed to generate JWT token');
  }
}

module.exports = { generateJWTToken, verifyJWTToken };

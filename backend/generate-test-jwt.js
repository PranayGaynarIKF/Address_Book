const jwt = require('jsonwebtoken');

// Generate a test JWT token
function generateTestJWT() {
    const payload = {
        sub: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
    };

    // Use a simple secret for testing
    const secret = 'your-super-secret-jwt-key-change-this-in-production';
    
    try {
        const token = jwt.sign(payload, secret);
        console.log('🔐 Test JWT Token Generated:');
        console.log('=====================================');
        console.log(token);
        console.log('=====================================');
        console.log('\n📋 Copy this token and use it in the test page or frontend.');
        console.log('\n💡 You can also set it in browser console:');
        console.log(`localStorage.setItem('jwt_token', '${token}');`);
        
        return token;
    } catch (error) {
        console.error('❌ Error generating JWT:', error.message);
        return null;
    }
}

// Check if jsonwebtoken is installed
try {
    require('jsonwebtoken');
    generateTestJWT();
} catch (error) {
    console.log('❌ jsonwebtoken package not found. Installing...');
    console.log('Run: npm install jsonwebtoken');
    console.log('Then run this script again.');
}

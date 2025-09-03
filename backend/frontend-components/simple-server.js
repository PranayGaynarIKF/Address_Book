const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

console.log('🚀 Starting simple frontend server...');

// Simple server that serves HTML files
const server = http.createServer((req, res) => {
    console.log(`📥 ${req.method} ${req.url}`);
    
    let filePath = req.url === '/' ? '/login-page.html' : req.url;
    filePath = path.join(__dirname, filePath);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    
    // Handle OPTIONS preflight request
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Read and serve the file
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.log(`❌ Error reading ${filePath}: ${err.message}`);
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - File Not Found</h1>');
            return;
        }
        
        // Determine content type
        const ext = path.extname(filePath);
        let contentType = 'text/html';
        
        if (ext === '.js') contentType = 'text/javascript';
        else if (ext === '.css') contentType = 'text/css';
        else if (ext === '.json') contentType = 'application/json';
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
        console.log(`✅ Served ${filePath}`);
    });
});

// Start server with error handling
server.listen(PORT, '127.0.0.1', () => {
    console.log(`🎉 Server running at http://localhost:${PORT}`);
    console.log(`🔗 Login page: http://localhost:${PORT}/login-page.html`);
    console.log(`📁 Serving from: ${__dirname}`);
});

// Error handling
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use!`);
        console.error('💡 Try using a different port or kill the process using this port');
    } else {
        console.error('❌ Server error:', err);
    }
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
    });
});

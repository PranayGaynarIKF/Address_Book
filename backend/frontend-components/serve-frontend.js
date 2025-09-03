const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const FRONTEND_DIR = __dirname;

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    // Parse the URL
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // Default to login-page.html if root is requested
    if (pathname === '/') {
        pathname = '/login-page.html';
    }
    
    // Get the file path
    const filePath = path.join(FRONTEND_DIR, pathname);
    
    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // File not found
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - File Not Found</h1><p>The requested file could not be found.</p>');
            return;
        }
        
        // Get file extension
        const ext = path.extname(filePath);
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        
        // Read and serve the file
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<h1>500 - Internal Server Error</h1><p>Error reading the file.</p>');
                return;
            }
            
            // Set CORS headers
            res.writeHead(200, {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            });
            
            res.end(data);
        });
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Frontend server running at http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${FRONTEND_DIR}`);
    console.log(`🔗 Login page: http://localhost:${PORT}/login-page.html`);
    console.log(`🔗 Register page: http://localhost:${PORT}/register.html`);
    console.log(`🔗 Forgot password: http://localhost:${PORT}/forgot-password.html`);
    console.log(`🔗 Dashboard: http://localhost:${PORT}/dashboard.html`);
    console.log(`🔗 Contacts: http://localhost:${PORT}/contacts.html`);
    console.log(`🔗 Profile: http://localhost:${PORT}/profile.html`);
    console.log(`\n💡 Open http://localhost:${PORT} in your browser to access the login page`);
    console.log(`💡 This will avoid CORS issues that occur when opening HTML files directly`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down frontend server...');
    server.close(() => {
        console.log('✅ Frontend server stopped');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down frontend server...');
    server.close(() => {
        console.log('✅ Frontend server stopped');
        process.exit(0);
    });
});

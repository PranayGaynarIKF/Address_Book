@echo off
echo Starting Frontend Server...
echo.
echo This will start a local HTTP server to serve the frontend files
echo and avoid CORS issues that occur when opening HTML files directly.
echo.
echo The server will be available at: http://localhost:3000
echo.
pause
node serve-frontend.js
pause

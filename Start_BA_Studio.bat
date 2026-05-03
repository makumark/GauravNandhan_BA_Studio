@echo off
title Gaurav Nandhan BA Studio Server
echo Starting Gaurav Nandhan BA Studio...
echo Please wait while the local server starts up.
echo.
echo Once started, your browser will open automatically.
echo Keep this window open while using the app!
echo --------------------------------------------------

cd /d "d:\Gaurav Nandhan BA Studio"

:: Check if node_modules exists, if not run install
if not exist "node_modules\" (
    echo Installing required packages (first run only)...
    call npm install
)

:: Start the Next.js server in the background and capture output
start "BA Studio Server" cmd /c "npm run dev"

:: Wait a few seconds for the server to spin up
timeout /t 5 /nobreak > nul

:: Open the browser
start http://localhost:3000

echo.
echo Server is running! You can now use the application in your browser.
echo To shut down the app, simply close this command prompt window.
pause

@echo off
echo Installing ChipiPay and Clerk dependencies...
cd frontend
npm install @chipi-stack/chipi-react@latest @clerk/clerk-react@latest
echo Dependencies installed successfully!
echo.
echo Please update your .env file with:
echo VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
echo VITE_CHIPI_API_KEY=your_chipi_api_public_key
echo.
pause
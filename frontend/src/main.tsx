import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

import { ClerkProvider } from '@clerk/clerk-react';
import { ChipiProvider } from '@chipi-stack/chipi-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <ChipiProvider config={{ apiPublicKey: import.meta.env.VITE_CHIPI_API_KEY }}>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </ChipiProvider>
      </ClerkProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

import { Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Toaster } from 'react-hot-toast';

import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import StatusPage from './components/StatusPage';
import { BalanceProvider } from './contexts/BalanceContext';

function App() {
  const { isSignedIn, user } = useUser();

  if (!isSignedIn || !user) {
    return (
      <>
        <Toaster />
        <LoginPage />
      </>
    );
  }

  return (
    <>
      <Toaster />
      <BalanceProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BalanceProvider>
    </>
  );
}

export default App;

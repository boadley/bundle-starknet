import { useState, useEffect } from 'react';
import Header from '../components/Header';
import MainLayout from '../components/layout/MainLayout';
import BankTransferForm from '../components/BankTransferForm';
import AirtimeForm from '../components/AirtimeForm';
import AvailableBalanceCard from '../components/AvailableBalanceCard';
import QuickActionsRow from '../components/QuickActionsRow';
import TransactionHistorySection from '../components/TransactionHistorySection';
import ServicesGrid from '../components/ServicesGrid';
import ConnectWalletButton from '../components/ConnectWalletButton';
import { useBalance } from '../contexts/BalanceContext';
// import ExportWallet from '../components/ExportWallet';
import { IoChevronBackOutline } from 'react-icons/io5';

type ActiveView = 'home' | 'airtime' | 'bank' | 'wallet-setup';

export default function HomePage() {
  const { hasWallet, isCheckingWallet } = useBalance();
  const [activeView, setActiveView] = useState<ActiveView>('wallet-setup');

  // Check wallet existence and update view accordingly
  useEffect(() => {
    if (!isCheckingWallet) {
      if (hasWallet) {
        setActiveView('home');
      } else {
        setActiveView('wallet-setup');
      }
    }
  }, [hasWallet, isCheckingWallet]);

  const handleAirtimeClick = () => {
    setActiveView('airtime');
  };

  const handleBankTransferClick = () => {
    setActiveView('bank');
  };

  const handleBackToHome = () => {
    setActiveView('home');
  };

  // Show loading while checking wallet
  if (isCheckingWallet) {
    return (
      <div className="bg-primary min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  // Mobile-first design with desktop fallback
  return (
    <div className="bg-primary min-h-screen text-white">
      {/* Mobile Layout */}
      <div className="block lg:hidden">
        {activeView === 'wallet-setup' ? (
          <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">Setup Your Wallet</h2>
              <p className="text-secondary mb-8">Create your secure USDC wallet to start making payments</p>
            </div>
            <div className="w-full max-w-sm">
              <ConnectWalletButton />
              <button 
                onClick={() => setActiveView('home')}
                className="w-full mt-4 text-accent hover:text-accent/80 transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        ) : activeView === 'home' ? (
          <MainLayout activeTab="home">
            <Header />
            <main className="p-4">
              <AvailableBalanceCard />
              <QuickActionsRow onBankTransferClick={handleBankTransferClick} />
              <TransactionHistorySection />
              <ServicesGrid onAirtimeClick={handleAirtimeClick} />
              {/* Temporary: Remove before production */}
              {/* <ExportWallet /> */}
            </main>
          </MainLayout>
        ) : (
          <div>
            <Header />
            <main className="p-4">
              <button 
                onClick={handleBackToHome}
                className="flex items-center text-accent mb-6 hover:text-accent/80 transition-colors"
              >
                <IoChevronBackOutline className="w-5 h-5 mr-2" />
                Back
              </button>
              {activeView === 'airtime' && <AirtimeForm />}
              {activeView === 'bank' && <BankTransferForm />}
            </main>
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        {activeView === 'wallet-setup' ? (
          <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <Header />
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">Setup Your Wallet</h2>
              <p className="text-secondary mb-8">Create your secure USDC wallet to start making payments</p>
            </div>
            <div className="w-full max-w-sm">
              <ConnectWalletButton />
              <button 
                onClick={() => setActiveView('home')}
                className="w-full mt-4 text-accent hover:text-accent/80 transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        ) : (
          <>
            <Header />
            <main className="p-4 max-w-6xl mx-auto">
              <h1 className="text-2xl font-bold mb-8 text-left">Welcome back!</h1>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <BankTransferForm />
                <AirtimeForm />
              </div>
            </main>
          </>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useGetWallet } from '@chipi-stack/chipi-react';
import Header from '../components/Header';
import MainLayout from '../components/layout/MainLayout';
import BankTransferForm from '../components/BankTransferForm';
import AirtimeForm from '../components/AirtimeForm';
import AvailableBalanceCard from '../components/AvailableBalanceCard';
import QuickActionsRow from '../components/QuickActionsRow';
import TransactionHistorySection from '../components/TransactionHistorySection';
import ServicesGrid from '../components/ServicesGrid';
import ConnectWalletButton from '../components/ConnectWalletButton';
import { IoChevronBackOutline } from 'react-icons/io5';

type ActiveView = 'home' | 'airtime' | 'bank' | 'wallet-setup';

export default function HomePage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { getWalletAsync } = useGetWallet();
  const [activeView, setActiveView] = useState<ActiveView>('wallet-setup');
  const [isCheckingWallet, setIsCheckingWallet] = useState(true);

  // Check if wallet exists and auto-proceed to home
  useEffect(() => {
    const checkWalletAndProceed = async () => {
      if (!user) return;
      
      try {
        const token = await getToken();
        if (!token) return;
        
        await getWalletAsync({
          externalUserId: user.id,
          bearerToken: token,
        });
        
        // Wallet exists, proceed to home
        setActiveView('home');
      } catch (error) {
        // Wallet doesn't exist, stay on wallet-setup
        setActiveView('wallet-setup');
      } finally {
        setIsCheckingWallet(false);
      }
    };

    checkWalletAndProceed();
  }, [user, getToken, getWalletAsync]);

  const handleAirtimeClick = () => {
    setActiveView('airtime');
  };

  const handleBankTransferClick = () => {
    setActiveView('bank');
  };

  const handleBackToHome = () => {
    setActiveView('home');
  };

  // Mobile-first design with desktop fallback
  return (
    <div className="bg-primary min-h-screen text-white">
      {/* Mobile Layout */}
      <div className="block lg:hidden">
        {isCheckingWallet ? (
          <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-6 h-6 border-2 border-secondary border-t-accent rounded-full animate-spin mb-4"></div>
            <p className="text-secondary">Loading...</p>
          </div>
        ) : activeView === 'wallet-setup' ? (
          <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">Setup Your Wallet</h2>
              <p className="text-secondary mb-8">Create your secure USDC wallet to start making payments</p>
            </div>
            <div className="w-full max-w-sm">
              <ConnectWalletButton onWalletReady={() => setActiveView('home')} />
              <button 
                onClick={() => setActiveView('home')}
                className="w-full mt-4 text-accent hover:text-accent/80 transition-colors text-center py-2"
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
        {isCheckingWallet ? (
          <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-6 h-6 border-2 border-secondary border-t-accent rounded-full animate-spin mb-4"></div>
            <p className="text-secondary">Loading...</p>
          </div>
        ) : activeView === 'wallet-setup' ? (
          <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <Header />
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">Setup Your Wallet</h2>
              <p className="text-secondary mb-8">Create your secure USDC wallet to start making payments</p>
            </div>
            <div className="w-full max-w-sm">
              <ConnectWalletButton onWalletReady={() => setActiveView('home')} />
              <button 
                onClick={() => setActiveView('home')}
                className="w-full mt-4 text-accent hover:text-accent/80 transition-colors text-center py-2"
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

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useGetWallet } from '@chipi-stack/chipi-react';
import { getUSDCBalance } from '../utils/starknet';

interface BalanceContextType {
  balance: number | null;
  isLoading: boolean;
  walletAddress: string;
  hasWallet: boolean;
  isCheckingWallet: boolean;
  refreshBalance: () => Promise<void>;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export function BalanceProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { getWalletAsync } = useGetWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [hasWallet, setHasWallet] = useState(false);
  const [isCheckingWallet, setIsCheckingWallet] = useState(true);
  const lastFetchTime = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchWalletAndBalance = async (force = false) => {
    if (!user) {
      setBalance(null);
      setWalletAddress('');
      setHasWallet(false);
      setIsCheckingWallet(false);
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        setIsCheckingWallet(false);
        return;
      }

      const wallet = await getWalletAsync({
        externalUserId: user.id,
        bearerToken: token,
      });
      
      // ChipiPay returns wallet data if it exists, no status field
      const isWalletReady = !!wallet?.publicKey && !!wallet?.encryptedPrivateKey;
      
      setWalletAddress(wallet.publicKey || '');
      setHasWallet(isWalletReady);
      
      // Only fetch balance if forced or not fetched recently
      const now = Date.now();
      const TWO_MINUTES = 120000;
      
      if (isWalletReady && (force || now - lastFetchTime.current >= TWO_MINUTES)) {
        setIsLoading(true);
        
        // Pad address for balance checking
        let paddedAddress = wallet.publicKey;
        if (paddedAddress.startsWith('0x') && paddedAddress.length < 66) {
          paddedAddress = '0x00' + paddedAddress.slice(2);
        }
        
        const usdcBalance = await getUSDCBalance(paddedAddress);
        setBalance(usdcBalance);
        lastFetchTime.current = now;
      }
    } catch (error) {
      console.error('Failed to fetch wallet/balance:', error);
      setHasWallet(false);
      if (balance === null) setBalance(0);
    } finally {
      setIsLoading(false);
      setIsCheckingWallet(false);
    }
  };

  // Initial wallet and balance fetch on login
  useEffect(() => {
    if (user) {
      fetchWalletAndBalance(true); // Force fetch on login
    }
  }, [user]);

  // Set up 2-minute interval for balance updates
  useEffect(() => {
    if (user) {
      intervalRef.current = setInterval(() => {
        fetchWalletAndBalance(false);
      }, 120000); // 2 minutes
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user]);

  const refreshBalance = async () => {
    await fetchWalletAndBalance(true);
  };

  return (
    <BalanceContext.Provider value={{
      balance,
      isLoading,
      walletAddress,
      hasWallet,
      isCheckingWallet,
      refreshBalance
    }}>
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalance() {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return context;
}
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useGetWallet } from '@chipi-stack/chipi-react';
import { getUSDCBalance } from '../utils/starknet';

interface BalanceContextType {
  balance: number | null;
  isLoading: boolean;
  walletAddress: string;
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
  const lastFetchTime = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchBalance = async (force = false) => {
    if (!user) {
      setBalance(null);
      setWalletAddress('');
      return;
    }

    const now = Date.now();
    const TWO_MINUTES = 120000;
    
    // Skip if fetched recently and not forced
    if (!force && now - lastFetchTime.current < TWO_MINUTES) {
      return;
    }

    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const wallet = await getWalletAsync({
        externalUserId: user.id,
        bearerToken: token,
      });
      
      setWalletAddress(wallet.publicKey);
      
      // Pad address for balance checking
      let paddedAddress = wallet.publicKey;
      if (paddedAddress.startsWith('0x') && paddedAddress.length < 66) {
        paddedAddress = '0x00' + paddedAddress.slice(2);
      }
      
      const usdcBalance = await getUSDCBalance(paddedAddress);
      setBalance(usdcBalance);
      lastFetchTime.current = now;
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      if (balance === null) setBalance(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial balance fetch on login
  useEffect(() => {
    if (user) {
      fetchBalance(true); // Force fetch on login
    }
  }, [user]);

  // Set up 2-minute interval
  useEffect(() => {
    if (user) {
      intervalRef.current = setInterval(() => {
        fetchBalance(false);
      }, 120000); // 2 minutes
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user]);

  const refreshBalance = async () => {
    await fetchBalance(true);
  };

  return (
    <BalanceContext.Provider value={{
      balance,
      isLoading,
      walletAddress,
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
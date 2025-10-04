import { useState, useEffect, useRef } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useGetWallet } from '@chipi-stack/chipi-react';
import { getUSDCBalance } from '../utils/starknet';

export default function BalanceCard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { getWalletAsync } = useGetWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const lastFetchTime = useRef<number>(0);
  const FETCH_INTERVAL = 30000; // 30 seconds minimum between fetches

  // Fetch USDC balance with rate limiting
  useEffect(() => {
    const fetchBalance = async () => {
      if (!user) {
        setBalance(null);
        setWalletAddress('');
        return;
      }

      const now = Date.now();
      if (now - lastFetchTime.current < FETCH_INTERVAL) {
        return; // Skip if fetched recently
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
        
        // Get real USDC balance using starknet.js
        const usdcBalance = await getUSDCBalance(paddedAddress);
        setBalance(usdcBalance);
        lastFetchTime.current = now;
      } catch (error) {
        console.error('Failed to fetch balance:', error);
        if (balance === null) setBalance(0); // Only reset if no previous balance
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [user]);
  
  const getDisplayAddress = () => {
    if (walletAddress) {
      return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
    }
    return "Not connected";
  };

  // Convert USDC to NGN (1 USDC = 1600 NGN for demo)
  const usdcToNgn = 1600;
  const displayBalance = balance ?? 0;
  const balanceInNgn = (displayBalance * usdcToNgn).toFixed(2);
  const showLoading = isLoading && balance === null; // Only show loading on first load

  return (
    <div className="balance-card mb-8">
      <div className="text-sm text-secondary mb-2">
        {getDisplayAddress()}
      </div>
      <div className="text-4xl font-bold text-white mb-1">
        {showLoading ? (
          <div className="flex items-center">
            <div className="w-6 h-6 border-2 border-secondary border-t-accent rounded-full animate-spin mr-2"></div>
            Loading...
          </div>
        ) : user ? (
          <div className="flex items-center">
            {`₦${balanceInNgn}`}
            {isLoading && balance !== null && (
              <div className="w-4 h-4 border border-secondary border-t-accent rounded-full animate-spin ml-2 opacity-50"></div>
            )}
          </div>
        ) : (
          '₦0.00'
        )}
      </div>
      <div className="text-base text-secondary flex items-center justify-center gap-2">
        <span>USDC</span>
        {user && displayBalance > 0 && (
          <span className="text-sm">
            (${displayBalance.toFixed(2)} USDC)
          </span>
        )}
      </div>
    </div>
  );
}

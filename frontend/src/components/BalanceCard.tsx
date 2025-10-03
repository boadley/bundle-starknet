import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useGetWallet } from '@chipi-stack/chipi-react';

export default function BalanceCard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { getWalletAsync } = useGetWallet();
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');

  // Fetch USDC balance (mock for demo)
  useEffect(() => {
    const fetchBalance = async () => {
      if (!user) {
        setBalance(0);
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
        // Mock USDC balance - in production, fetch from ChipiPay API
        setBalance(100); // Demo: $100 USDC
      } catch (error) {
        console.error('Failed to fetch balance:', error);
        setBalance(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [user, getToken, getWalletAsync]);
  
  const getDisplayAddress = () => {
    if (walletAddress) {
      return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
    }
    return "Not connected";
  };

  // Convert USDC to NGN (1 USDC = 1600 NGN for demo)
  const usdcToNgn = 1600;
  const balanceInNgn = (balance * usdcToNgn).toFixed(2);

  return (
    <div className="balance-card mb-8">
      <div className="text-sm text-secondary mb-2">
        {getDisplayAddress()}
      </div>
      <div className="text-4xl font-bold text-white mb-1">
        {isLoading ? (
          <div className="flex items-center">
            <div className="w-6 h-6 border-2 border-secondary border-t-accent rounded-full animate-spin mr-2"></div>
            Loading...
          </div>
        ) : user ? (
          `₦${balanceInNgn}`
        ) : (
          '₦0.00'
        )}
      </div>
      <div className="text-base text-secondary flex items-center justify-center gap-2">
        <span>USDC</span>
        {user && balance > 0 && (
          <span className="text-sm">
            (${balance.toFixed(2)} USDC)
          </span>
        )}
      </div>
    </div>
  );
}

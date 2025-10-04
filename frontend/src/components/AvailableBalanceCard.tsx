import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useGetWallet } from '@chipi-stack/chipi-react';
import { IoEyeOutline, IoEyeOffOutline, IoChevronForwardOutline } from 'react-icons/io5';
import { getUSDCBalance } from '../utils/starknet';

export default function AvailableBalanceCard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { getWalletAsync } = useGetWallet();
  const [showBalance, setShowBalance] = useState(true);
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch USDC balance
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
        
        // Pad address for balance checking
        let paddedAddress = wallet.publicKey;
        if (paddedAddress.startsWith('0x') && paddedAddress.length < 66) {
          paddedAddress = '0x00' + paddedAddress.slice(2);
        }
        
        // Get real USDC balance using starknet.js
        const usdcBalance = await getUSDCBalance(paddedAddress);
        setBalance(usdcBalance);
      } catch (error) {
        console.error('Failed to fetch balance:', error);
        setBalance(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [user, getToken, getWalletAsync]);

  // Convert USDC to NGN (1 USDC = 1600 NGN)
  const usdcToNgn = 1600;
  const balanceInNgn = (balance * usdcToNgn).toFixed(2);

  const toggleBalanceVisibility = () => {
    setShowBalance(!showBalance);
  };

  return (
    <div className="bg-gradient-to-r from-accent/20 to-accent/10 rounded-2xl p-6 mb-6 border border-accent/20">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-white text-sm">Available Balance</span>
            <button
              onClick={toggleBalanceVisibility}
              className="text-white/70 hover:text-white transition-colors"
            >
              {showBalance ? (
                <IoEyeOutline className="w-4 h-4" />
              ) : (
                <IoEyeOffOutline className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="text-white text-3xl font-bold">
            {isLoading ? (
              <div className="flex items-center">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Loading...
              </div>
            ) : showBalance ? (
              user ? `₦${balanceInNgn}` : '₦0.00'
            ) : (
              '₦****'
            )}
          </div>
          {user && balance > 0 && showBalance && (
            <div className="text-white/70 text-sm mt-1">
              ${balance.toFixed(2)} USDC
            </div>
          )}
        </div>

        <button className="flex items-center space-x-1 text-white/70 hover:text-white transition-colors">
          <span className="text-sm">Transaction History</span>
          <IoChevronForwardOutline className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

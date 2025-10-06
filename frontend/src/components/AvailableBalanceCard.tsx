import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { IoEyeOutline, IoEyeOffOutline, IoChevronForwardOutline } from 'react-icons/io5';
import { useBalance } from '../contexts/BalanceContext';

export default function AvailableBalanceCard() {
  const { user } = useUser();
  const { balance, isLoading } = useBalance();
  const [showBalance, setShowBalance] = useState(true);

  // Convert USDC to NGN (1 USDC = 1600 NGN)
  const usdcToNgn = 1600;
  const displayBalance = balance ?? 0;
  const balanceInNgn = (displayBalance * usdcToNgn).toFixed(2);

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
            {isLoading && balance === null ? (
              <div className="flex items-center">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Loading...
              </div>
            ) : showBalance ? (
              <div className="flex items-center">
                {user ? `₦${balanceInNgn}` : '₦0.00'}
                {isLoading && balance !== null && (
                  <div className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin ml-2 opacity-50"></div>
                )}
              </div>
            ) : (
              '₦****'
            )}
          </div>
          {user && displayBalance > 0 && showBalance && (
            <div className="text-white/70 text-sm mt-1">
              ${displayBalance.toFixed(2)} USDC
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

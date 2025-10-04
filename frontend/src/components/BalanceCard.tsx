import { useUser } from '@clerk/clerk-react';
import { useBalance } from '../contexts/BalanceContext';

export default function BalanceCard() {
  const { user } = useUser();
  const { balance, isLoading, walletAddress } = useBalance();
  
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

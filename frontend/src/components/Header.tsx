import { useUser, useAuth } from '@clerk/clerk-react';
import { UserButton } from '@clerk/clerk-react';
import { useGetWallet } from '@chipi-stack/chipi-react';
import { IoHelpCircleOutline, IoNotificationsOutline } from 'react-icons/io5';
import { toast } from 'react-hot-toast';
import { useBalance } from '../contexts/BalanceContext';

export default function Header() {
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const { getWalletAsync } = useGetWallet();
  const { walletAddress } = useBalance();

  const handleNameClick = async () => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }
    
    try {
      let addressToCopy = walletAddress;
      
      // If wallet address not available in context, fetch it directly
      if (!addressToCopy) {
        const token = await getToken();
        if (!token) {
          toast.error('Authentication token not available');
          return;
        }
        
        const wallet = await getWalletAsync({
          externalUserId: user.id,
          bearerToken: token,
        });
        
        addressToCopy = wallet.publicKey;
      }
      
      // ChipiPay's publicKey needs padding with 00 after 0x if less than 64 chars
      let contractAddress = addressToCopy;
      if (contractAddress.startsWith('0x') && contractAddress.length < 66) {
        contractAddress = '0x00' + contractAddress.slice(2);
      }
      
      // Try modern clipboard API first, fallback for mobile browsers
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(contractAddress);
      } else {
        // Fallback for mobile browsers
        const textArea = document.createElement('textarea');
        textArea.value = contractAddress;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      toast.success('Wallet address copied to clipboard!');
    } catch (error) {
      console.error('Copy address error:', error);
      toast.error('Failed to copy wallet address');
    }
  };

  return (
    <header className="bg-primary p-4 flex justify-between items-center">
      {isSignedIn && user ? (
        <>
          {/* Left side - Profile and greeting */}
          <div className="flex items-center space-x-3">
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                  userButtonPopoverCard: "bg-primary border border-disabled",
                  userButtonPopoverText: "text-white"
                }
              }}
            />
            <div>
              <p className="text-sm text-secondary">Hi,</p>
              <p 
                className="text-white font-medium cursor-pointer hover:text-accent transition-colors"
                onClick={handleNameClick}
                title="Click to copy wallet address"
              >
                {user.firstName || user.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User'}
              </p>
            </div>
          </div>

          {/* Right side - Help and notifications */}
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-1 text-secondary hover:text-white transition-colors">
              <IoHelpCircleOutline className="w-5 h-5" />
              <span className="text-sm font-medium">HELP</span>
            </button>
            <button className="text-secondary hover:text-white transition-colors">
              <IoNotificationsOutline className="w-6 h-6" />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="text-2xl font-bold text-accent">Bundle</div>
        </>
      )}
    </header>
  );
}

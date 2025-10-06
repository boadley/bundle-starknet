import { useUser, useAuth } from '@clerk/clerk-react';
import { useCreateWallet } from '@chipi-stack/chipi-react';
import { toast } from 'react-hot-toast';
import { useBalance } from '../contexts/BalanceContext';

export default function ConnectWalletButton() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { createWalletAsync, isLoading: isCreating } = useCreateWallet();
  const { hasWallet, refreshBalance } = useBalance();

  const handleCreateWallet = async () => {
    if (!user) return;
    
    try {
      const token = await getToken();
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const encryptKey = user.id; // Use user ID as encryption key
      
      await createWalletAsync({
        params: {
          encryptKey,
          externalUserId: user.id,
        },
        bearerToken: token,
      });
      
      // Refresh balance context to update wallet state
      await refreshBalance();
      toast.success('Wallet created successfully!');
    } catch (error: any) {
      console.error('Error creating wallet:', error);
      toast.error(error.message || 'Failed to create wallet');
    }
  };

  if (!hasWallet) {
    return (
      <button
        onClick={handleCreateWallet}
        disabled={isCreating}
        className="btn-primary"
      >
        {isCreating ? 'Creating wallet...' : 'Create Wallet'}
      </button>
    );
  }

  return (
    <button className="text-white bg-transparent border border-disabled px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm">
      Wallet Ready
    </button>
  );
}

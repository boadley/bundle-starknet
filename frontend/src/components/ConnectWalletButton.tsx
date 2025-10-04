import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useCreateWallet, useGetWallet } from '@chipi-stack/chipi-react';
import { toast } from 'react-hot-toast';

interface ConnectWalletButtonProps {
  onWalletReady?: () => void;
}

export default function ConnectWalletButton({ onWalletReady }: ConnectWalletButtonProps) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { createWalletAsync, isLoading: isCreating } = useCreateWallet();
  const { getWalletAsync } = useGetWallet();
  const [hasWallet, setHasWallet] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkWalletExists();
  }, [user]);

  const checkWalletExists = async () => {
    if (!user) return;
    
    try {
      setIsChecking(true);
      const token = await getToken();
      if (!token) return;
      
      await getWalletAsync({
        externalUserId: user.id,
        bearerToken: token,
      });
      setHasWallet(true);
    } catch (error) {
      setHasWallet(false);
    } finally {
      setIsChecking(false);
    }
  };

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
      
      setHasWallet(true);
      toast.success('Wallet created successfully!');
      
      // Auto-proceed to home when wallet is created
      if (onWalletReady) {
        setTimeout(() => onWalletReady(), 1000); // Small delay to show success message
      }
    } catch (error: any) {
      console.error('Error creating wallet:', error);
      toast.error(error.message || 'Failed to create wallet');
    }
  };

  if (isChecking) {
    return (
      <button className="btn-primary" disabled>
        Checking wallet...
      </button>
    );
  }

  if (!hasWallet) {
    return (
      <button
        onClick={handleCreateWallet}
        disabled={isCreating}
        className="btn-primary w-full"
      >
        {isCreating ? 'Creating wallet...' : 'Create Wallet'}
      </button>
    );
  }

  return (
    <button className="w-full text-white bg-transparent border border-disabled px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm">
      Wallet Ready
    </button>
  );
}

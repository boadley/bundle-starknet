import { useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useTransfer, useGetWallet } from '@chipi-stack/chipi-react';
import { toast } from 'react-hot-toast';
import { initiatePayment } from '../services/apiService';
import { withRetry } from '../utils/retry';

export const useBundle = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { getWalletAsync } = useGetWallet();
  const { transferAsync, isLoading: isTransferring } = useTransfer();
  const [isLoading, setIsLoading] = useState(false);

  const executePayment = async (
    paymentType: 'bank' | 'airtime', 
    details: {
      amount: number;
      bankName?: string;
      accountNumber?: string;
      accountName?: string;
      phoneNumber?: string;
      network?: string;
    },
    onSuccess?: (transactionHash: string) => void,
    onError?: (error: string) => void
  ) => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    setIsLoading(true);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Get user's wallet
      const wallet = await getWalletAsync({
        externalUserId: user.id,
        bearerToken: token,
      });

      // Treasury address for receiving USDC payments
      const treasuryAddress = import.meta.env.VITE_TREASURY_ADDRESS as string;
      if (!treasuryAddress) {
        throw new Error('Treasury address not configured');
      }

      // Convert NGN to USDC (assuming 1 USDC = 1600 NGN for demo)
      const usdcAmount = (details.amount / 1600).toFixed(6);

      toast.success('Processing payment...');

      // Execute USDC transfer using ChipiPay
      const transferResponse = await transferAsync({
        bearerToken: token,
        params: {
          encryptKey: user.id, // Use user ID as encryption key
          wallet: {
            publicKey: wallet.publicKey,
            encryptedPrivateKey: wallet.encryptedPrivateKey,
          },
          amount: usdcAmount,
          token: "USDC" as any,
          recipient: treasuryAddress,
        },
      });

      const hash = transferResponse.hash || transferResponse.transactionHash;
      if (!hash) {
        throw new Error('Transaction hash not received');
      }

      console.log('USDC transfer completed:', { hash, amount: usdcAmount });
      toast.success('Payment submitted! Processing...');

      // Send transaction details to backend for fiat processing
      await withRetry(
        async () => {
          await initiatePayment({ 
            transactionHash: hash, 
            userAddress: wallet.publicKey,
            paymentType, 
            details 
          });
        },
        (error: any) => {
          const backendError = error?.response?.data?.error || error?.message || 'Unknown error';
          return `Payment verification failed: ${backendError}`;
        }
      );

      toast.success('Payment completed successfully!');
      
      if (onSuccess) {
        onSuccess(hash);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      const errorMessage = error?.message || 'Payment failed: Unknown error';
      
      toast.error(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { executePayment, isLoading: isLoading || isTransferring };
};

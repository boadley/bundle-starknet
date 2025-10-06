import { useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useTransfer, useGetWallet } from '@chipi-stack/chipi-react';
import { toast } from 'react-hot-toast';
import { initiatePayment } from '../services/apiService';
import { withRetry } from '../utils/retry';
import { useBalance } from '../contexts/BalanceContext';
import { padWalletAddress } from '../utils/address';
import type { ChainToken } from '@chipi-stack/types';

export const useBundle = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { getWalletAsync } = useGetWallet();
  const { transferAsync, isLoading: isTransferring } = useTransfer();
  const { refreshBalance } = useBalance();
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

      if (!wallet || !wallet.publicKey || !wallet.encryptedPrivateKey) {
        throw new Error('Wallet not found or incomplete');
      }

      // Treasury address for receiving USDC payments
      const rawTreasuryAddress = import.meta.env.VITE_TREASURY_ADDRESS as string;
      if (!rawTreasuryAddress) {
        throw new Error('Treasury address not configured');
      }
      const treasuryAddress = padWalletAddress(rawTreasuryAddress);

      // Convert NGN to USDC (1 USDC = 1600 NGN) with minimum amount validation
      const usdcAmount = Math.max(0.01, details.amount / 1600).toFixed(6); // Minimum 0.01 USDC

      toast.success('Processing payment...');

      // Note: Balance check removed - will be handled by ChipiPay
      
      console.log(`Attempting transfer of ${usdcAmount} USDC to ${treasuryAddress}`);

      // Pad wallet public key to 66 characters if needed
      const paddedPublicKey = padWalletAddress(wallet.publicKey);

      console.log('Transfer parameters:', {
        amount: usdcAmount,
        recipient: treasuryAddress,
        originalPublicKey: wallet.publicKey,
        paddedPublicKey: paddedPublicKey
      });

      // Execute transfer using ChipiPay - try with USDC first to test if it works
      const transferResponse = await transferAsync({
        bearerToken: token,
        params: {
          encryptKey: user.id,
          wallet: {
            publicKey: paddedPublicKey,
            encryptedPrivateKey: wallet.encryptedPrivateKey,
          },
          amount: usdcAmount,
          token: "USDC" as ChainToken,
          recipient: treasuryAddress,
        },
      });

      console.log('Transfer response:', transferResponse);
      
      if (!transferResponse) {
        throw new Error('No response received from transfer');
      }

      // Extract transaction hash from response
      const hash = typeof transferResponse === 'string' 
        ? transferResponse 
        : (transferResponse as any)?.transactionHash || (transferResponse as any)?.hash || transferResponse;
      
      if (!hash) {
        throw new Error('Transaction hash not found in response');
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
            details,
            // tokenAmount: usdcAmount, // Remove if not in type
            // tokenSymbol: 'USDC' // Remove if not in type
          });
        },
        (error: any) => {
          const backendError = error?.response?.data?.error || error?.message || 'Unknown error';
          return `Payment verification failed: ${backendError}`;
        }
      );

      toast.success('Payment completed successfully!');
      
      // Refresh balance after successful transaction
      console.log('Transaction completed, refreshing balance...');
      await refreshBalance();
      console.log('Balance refresh completed');
      
      if (onSuccess) {
        onSuccess(hash);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      console.error('Error details:', {
        message: error?.message,
        response: error?.response,
        data: error?.response?.data,
        stack: error?.stack
      });
      
      let errorMessage = 'Payment failed: Unknown error';
      
      if (error?.message?.includes('Cannot read properties of undefined')) {
        errorMessage = 'Transfer service error - please try again';
      } else if (error?.message?.includes('Insufficient USDC balance')) {
        errorMessage = error.message;
      } else if (error?.message?.includes('u256_sub Overflow')) {
        errorMessage = 'Insufficient USDC balance in wallet';
      } else if (error?.message?.includes('argent/multicall-failed')) {
        errorMessage = 'Transaction failed - please check your balance and try again';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
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

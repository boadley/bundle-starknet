import { useState, useEffect } from 'react';
import { IoClose, IoWalletOutline } from 'react-icons/io5';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useGetWallet } from '@chipi-stack/chipi-react';
import { getUSDCBalance } from '../utils/starknet';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  amount: string;
  recipient: string;
  transactionType: 'airtime' | 'bank';
  isLoading?: boolean;
  transactionFee?: string;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  amount,
  recipient,
  transactionType: _transactionType,
  isLoading = false,
  transactionFee = '₦10.00'
}: ConfirmationModalProps) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { getWalletAsync } = useGetWallet();
  const [balance, setBalance] = useState<number>(0);
  
  // Fetch USDC balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!user) {
        setBalance(0);
        return;
      }
      
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
      }
    };

    if (isOpen) {
      fetchBalance();
    }
  }, [user, getToken, getWalletAsync, isOpen]);

  // Convert USDC to NGN (1 USDC = 1600 NGN)
  const usdcToNgn = 1600;
  const balanceInNgn = (balance * usdcToNgn).toFixed(2);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
      {/* Bottom Sheet Modal */}
      <div className="w-full bg-primary rounded-t-3xl p-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-white hover:text-accent transition-colors"
            disabled={isLoading}
          >
            <IoClose className="w-6 h-6" />
          </button>
          <div className="text-2xl font-bold text-white">{amount}</div>
          <div className="w-8 h-8" /> {/* Spacer */}
        </div>

        {/* Transaction Details */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
          <p className="text-secondary text-base mb-4">{description}</p>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-secondary text-base">Recipient</span>
              <span className="text-white text-base font-medium">{recipient}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-secondary text-base">Amount</span>
              <span className="text-white text-base font-medium">₦{amount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-secondary text-base">Transaction Fee</span>
              <span className="text-white text-base font-medium">{transactionFee}</span>
            </div>
          </div>
        </div>

        {/* Payment Method Section */}
        <div className="mb-6">
          <h3 className="text-white text-lg font-semibold mb-4">Payment Method</h3>
          
          {/* Wallet Option */}
          <div className="bg-surface rounded-2xl p-4 border border-accent/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                  <IoWalletOutline className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-white font-medium">USDC Wallet</p>
                  <p className="text-secondary text-sm">
                    Available: ₦{balanceInNgn}
                  </p>
                </div>
              </div>
              <div className="w-4 h-4 border-2 border-accent rounded-full bg-accent flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Transaction Fee */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-disabled/20">
            <span className="text-secondary text-base">Transaction Fee</span>
            <span className="text-white text-base font-medium">{transactionFee}</span>
          </div>
        </div>

        {/* Pay Button */}
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="btn-primary"
        >
          {isLoading ? 'Processing...' : 'Pay'}
        </button>
      </div>
    </div>
  );
}

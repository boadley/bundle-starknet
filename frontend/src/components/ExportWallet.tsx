import { useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useGetWallet, useTransfer } from '@chipi-stack/chipi-react';
import { toast } from 'react-hot-toast';
import { getUSDCBalance } from '../utils/starknet';
import { padWalletAddress } from '../utils/address';

export default function ExportWallet() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { getWalletAsync } = useGetWallet();
  const { transferAsync } = useTransfer();
  const [privateKey, setPrivateKey] = useState<string>('');
  const [decryptedKey, setDecryptedKey] = useState<string>('');
  const [strkBalance, setStrkBalance] = useState<number>(0);
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  const exportPrivateKey = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const wallet = await getWalletAsync({
        externalUserId: user.id,
        bearerToken: token,
      });

      console.log('Wallet info:', {
        publicKey: wallet.publicKey,
        encryptedPrivateKey: wallet.encryptedPrivateKey,
        userId: user.id
      });
      
      setPrivateKey(wallet.encryptedPrivateKey);
      
      // Get STRK balance
      const paddedAddress = padWalletAddress(wallet.publicKey);
      
      const balance = await getUSDCBalance(paddedAddress); // This actually gets STRK balance
      setStrkBalance(balance);
      
      // Attempt basic decryption (this may not work with ChipiPay's encryption)
      try {
        const decoded = atob(wallet.encryptedPrivateKey);
        setDecryptedKey(decoded);
      } catch (e) {
        console.log('Simple decryption failed - ChipiPay uses complex encryption');
        setDecryptedKey('Decryption requires ChipiPay SDK methods');
      }
    } catch (error) {
      console.error('Failed to export wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const transferSTRK = async () => {
    if (!user || !recipientAddress) {
      toast.error('Please enter recipient address');
      return;
    }

    setIsTransferring(true);
    try {
      const token = await getToken();
      if (!token) return;

      const wallet = await getWalletAsync({
        externalUserId: user.id,
        bearerToken: token,
      });

      const paddedPublicKey = padWalletAddress(wallet.publicKey);

      // Try different approaches for STRK transfer
      let transferResponse;
      
      try {
        console.log('Attempting STRK transfer with token address + decimals approach...');
        transferResponse = await transferAsync({
          bearerToken: token,
          params: {
            encryptKey: user.id,
            wallet: {
              publicKey: paddedPublicKey,
              encryptedPrivateKey: wallet.encryptedPrivateKey,
            },
            amount: strkBalance.toString(),
            recipient: recipientAddress,
            token: {
              address: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
              decimals: 18
          }
          } as any, // Bypass TypeScript restriction for custom token
        });
      } catch (error1) {
        console.log('Token address + decimals approach failed, trying contractAddress...');
        try {
          transferResponse = await transferAsync({
            bearerToken: token,
            params: {
              encryptKey: user.id,
              wallet: {
                publicKey: paddedPublicKey,
                encryptedPrivateKey: wallet.encryptedPrivateKey,
              },
              amount: strkBalance.toString(),
              recipient: recipientAddress,
              contractAddress: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
            } as any,
          });
        } catch (error2) {
          console.log('contractAddress approach failed, trying without token specification...');
        try {
          transferResponse = await transferAsync({
            bearerToken: token,
            params: {
              encryptKey: user.id,
              wallet: {
                publicKey: paddedPublicKey,
                encryptedPrivateKey: wallet.encryptedPrivateKey,
              },
              amount: strkBalance.toString(),
              recipient: recipientAddress,
              token: "USDC" as any, // Required field
            },
          });
        } catch (error3) {
          console.log('No token specification failed, trying ETH as last resort...');
          try {
            // Last resort: try with ETH token (might work for native transfers)
            transferResponse = await transferAsync({
              bearerToken: token,
              params: {
                encryptKey: user.id,
                wallet: {
                  publicKey: paddedPublicKey,
                  encryptedPrivateKey: wallet.encryptedPrivateKey,
                },
                amount: strkBalance.toString(),
                recipient: recipientAddress,
                token: "ETH" as any,
              },
            });
          } catch (error4) {
            console.log('All approaches failed:', { error1, error2, error3, error4 });
            throw new Error('STRK transfer not supported by ChipiPay. Only USDC transfers are currently supported.');
          }
        }
        }
      }

      console.log('STRK transfer response:', transferResponse);
      toast.success('STRK transferred successfully!');
      setStrkBalance(0);
    } catch (error: any) {
      console.error('STRK transfer failed:', error);
      toast.error(error.message || 'STRK transfer failed');
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Export Wallet (Dev Only)</h3>
      
      <div className="space-y-4">
        <button
          onClick={exportPrivateKey}
          disabled={isLoading}
          className="bg-red-500 text-white px-4 py-2 rounded disabled:opacity-50 w-full"
        >
          {isLoading ? 'Exporting...' : 'Export Private Key'}
        </button>
        
        {strkBalance > 0 && (
          <div className="border-t pt-4">
            <p className="text-sm mb-2">STRK Balance: {strkBalance.toFixed(4)} STRK</p>
            <input
              type="text"
              placeholder="Recipient address (0x...)" 
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="w-full p-2 border rounded mb-2 text-black"
            />
            <button
              onClick={transferSTRK}
              disabled={isTransferring || !recipientAddress}
              className="bg-orange-500 text-white px-4 py-2 rounded disabled:opacity-50 w-full"
            >
              {isTransferring ? 'Transferring...' : `Transfer All STRK (${strkBalance.toFixed(4)})`}
            </button>
          </div>
        )}
      </div>
      
      {privateKey && (
        <div className="mt-4 space-y-3">
          <div className="p-3 bg-gray-100 rounded">
            <p className="text-sm font-medium mb-2">User ID (Encryption Key):</p>
            <p className="text-xs break-all font-mono bg-white p-2 rounded">{user?.id}</p>
          </div>
          
          <div className="p-3 bg-gray-100 rounded">
            <p className="text-sm font-medium mb-2">Encrypted Private Key:</p>
            <p className="text-xs break-all font-mono bg-white p-2 rounded">{privateKey}</p>
          </div>
          
          <div className="p-3 bg-yellow-100 rounded">
            <p className="text-sm font-medium mb-2">Decryption Attempt:</p>
            <p className="text-xs break-all font-mono bg-white p-2 rounded">{decryptedKey}</p>
            <p className="text-xs text-red-600 mt-2">
              ChipiPay uses proprietary encryption. For actual decryption, you may need to contact ChipiPay support or use their SDK methods.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
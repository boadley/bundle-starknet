import { useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useGetWallet } from '@chipi-stack/chipi-react';

export default function ExportWallet() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { getWalletAsync } = useGetWallet();
  const [privateKey, setPrivateKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

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

      // The encryptedPrivateKey needs to be decrypted with the encryptKey (user.id)
      console.log('Wallet info:', {
        publicKey: wallet.publicKey,
        encryptedPrivateKey: wallet.encryptedPrivateKey
      });
      
      // Note: You'll need to decrypt this manually or use ChipiPay's decryption method
      setPrivateKey(wallet.encryptedPrivateKey);
    } catch (error) {
      console.error('Failed to export wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Export Wallet</h3>
      <button
        onClick={exportPrivateKey}
        disabled={isLoading}
        className="bg-red-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isLoading ? 'Exporting...' : 'Export Private Key'}
      </button>
      
      {privateKey && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <p className="text-sm font-medium mb-2">Encrypted Private Key:</p>
          <p className="text-xs break-all font-mono">{privateKey}</p>
          <p className="text-xs text-red-600 mt-2">
            This is encrypted. You need to decrypt it with your encryption key (user ID).
          </p>
        </div>
      )}
    </div>
  );
}
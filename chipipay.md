# DOCUMENTATION FROM CHIPIPAY

Gasless

React with Clerk
================

Learn how to integrate Chipi Pay with your React application using Clerk for authentication and secure wallet storage.

1

Getting Started
---------------

To get started with Chipi Pay in your React application

Copy

Ask AI

    npm create vite@latest my-chipi-app -- --template react-ts
    cd my-chipi-app
    npm install
    

With Clerk, you can follow their [Quickstart Guide](https://clerk.com/docs/quickstarts/react) to get started with React + Vite.

2

Install the Chipi SDK
---------------------

First, install the required packages:

Copy

Ask AI

    # Install Chipi Pay SDK
    npm install @chipi-stack/chipi-react
    
    # Install Clerk
    npm install @clerk/clerk-react
    

3

Setup the Chipi SDK Provider
----------------------------

1.  Create a `.env` file in your project root and add your API keys:

Copy

Ask AI

    # Vite uses VITE_ prefix for environment variables
    VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
    VITE_CHIPI_API_KEY=your_chipi_api_public_key
    

2.  Set up the Chipi Pay provider in your application :

Copy

Ask AI

    // App.tsx
    
    import { ClerkProvider } from "@clerk/clerk-react";
    import { ChipiProvider } from "@chipi-stack/chipi-react";
    
    export default function App() {
      return (
        <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
          <ChipiProvider>
            {/* Your app components */}
          </ChipiProvider>
        </ClerkProvider>
      );
    }
    
    

4

Creating a Wallet
-----------------

Create a wallet creation component:

Copy

Ask AI

    // components/CreateWallet.tsx
    
    import { useState } from "react";
    import { useUser, useAuth } from "@clerk/clerk-react";
    import { useCreateWallet } from "@chipi-stack/chipi-react";
    
    export default function CreateWallet() {
      const { user } = useUser();
      const { getToken } = useAuth();
      const { createWalletAsync, isLoading } = useCreateWallet();
      const [encryptKey, setEncryptKey] = useState("");
      const [error, setError] = useState("");
      const [success, setSuccess] = useState("");
    
      const handleCreateWallet = async () => {
        if (!encryptKey) {
          setError("Please enter an encryption key");
          return;
        }
    
        try {
          setError("");
          setSuccess("");
          const token = await getToken();
    
          const response = await createWalletAsync({
            params: {
              encryptKey,
              externalUserId: user.id,
            },
            bearerToken: token || "",
          });
          
          console.log('createWalletResponse', response);
          setSuccess("Wallet created successfully!");
          setEncryptKey("");
        } catch (error) {
          setError(error.message || "Failed to create wallet");
          console.error("Error creating wallet:", error);
        }
      };
    
      return (
        <div className="space-y-4 p-4 border rounded-lg">
          <h2 className="text-xl font-semibold">Create Wallet</h2>
          
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {success && <div className="text-green-500 text-sm">{success}</div>}
          
          <div className="space-y-2">
            <input
              type="password"
              placeholder="Enter encryption key"
              value={encryptKey}
              onChange={(e) => setEncryptKey(e.target.value)}
              className="w-full p-2 border rounded"
            />
            
            <button
              onClick={handleCreateWallet}
              disabled={isLoading || !encryptKey}
              className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 w-full"
            >
              {isLoading ? "Creating..." : "Create Wallet"}
            </button>
          </div>
        </div>
      );
    }
    

5

Sending USDC Example
--------------------

Here’s an example of implementing a transfer flow with Clerk authentication:

Copy

Ask AI

    // components/Transfer.tsx
    
    import { useState } from "react";
    import { useUser, useAuth } from "@clerk/clerk-react";
    import { useTransfer, useGetWallet } from "@chipi-stack/chipi-react";
    
    const USDC_CONTRACT = "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8";
    
    export default function Transfer() {
      const { user } = useUser();
      const { getToken } = useAuth();
      const [amount, setAmount] = useState("");
      const [recipientAddress, setRecipientAddress] = useState("");
      const [encryptKey, setEncryptKey] = useState("");
      const [error, setError] = useState("");
      const [success, setSuccess] = useState("");
      const { getWalletAsync } = useGetWallet();
      const { transferAsync, isLoading: isLoadingTransfer } = useTransfer();
     
      const handleTransfer = async () => {
        if (!amount || !recipientAddress || !encryptKey) {
          setError("Please fill in all fields");
          return;
        }
    
        try {
          setError("");
          setSuccess("");
          const token = await getToken();
          
          if (!token) {
            setError("No bearer token found");
            return;
          }
    
          const wallet = await getWalletAsync({
            externalUserId: user.id,
            bearerToken: token,
          });
      
          // make the transfer
          const transferResponse = await transferAsync({
            bearerToken: token,
            params: {
              encryptKey,
              wallet: {
                publicKey: wallet.publicKey,
                encryptedPrivateKey: wallet.encryptedPrivateKey,
              },
              amount: String(amount),
              token: "USDC" as ChainToken,
              recipient: recipientAddress,
            },
          });
          console.log("transfer response", transferResponse);
          setSuccess("Transfer completed successfully!");
          
          // Clear form
          setAmount("");
          setRecipientAddress("");
          setEncryptKey("");
          
        } catch (error) {
          setError(error.message || "Transfer failed");
          console.error("Transfer error:", error);
        } 
      };
    
      return (
        <div className="space-y-4 p-4 border rounded-lg">
          <h2 className="text-xl font-semibold">Transfer USDC</h2>
          
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {success && <div className="text-green-500 text-sm">{success}</div>}
          
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Recipient Address"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="w-full p-2 border rounded"
            />
            
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 border rounded"
            />
            
            <input
              type="password"
              placeholder="Encryption Key"
              value={encryptKey}
              onChange={(e) => setEncryptKey(e.target.value)}
              className="w-full p-2 border rounded"
            />
            
            <button
              onClick={handleTransfer}
              disabled={isLoadingTransfer || !amount || !recipientAddress || !encryptKey}
              className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50 w-full"
            >
              {isLoadingTransfer ? "Processing..." : "Make Transfer"}
            </button>
          </div>
        </div>
      );
    }
    

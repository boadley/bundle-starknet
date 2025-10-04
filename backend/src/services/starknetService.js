// starknetService.js - Backend service for Starknet blockchain interactions
// Handles transaction confirmation via Starknet RPC polling
// Frontend submits signed tx hash; here we poll RPC until success or timeout
console.log('--- 3. Loading starknetService.js ---');

const { RpcProvider } = require('starknet');
const axios = require('axios');
require('dotenv').config();

// Starknet RPC provider
const provider = new RpcProvider({
  nodeUrl: 'https://starknet-mainnet.public.blastapi.io/rpc/v0_8',
});

// Poll interval and timeout for tx confirmation (in ms)
const POLL_INTERVAL = 3000; // 3s (Starknet blocks are ~10-15s)
const POLL_TIMEOUT = 60000; // 60s (longer for Starknet)
const MAX_RETRIES = 3; // Maximum retries for network errors

class StarknetService {
  // Confirm transaction by polling Starknet RPC
  // Input: txnHash from frontend
  // Returns: { success: bool, blockNumber: string, timestamp: string, error?: string }
  async confirmTransaction(txnHash) {
    const startTime = Date.now();
    let lastError = null;
    let retryCount = 0;

    console.log(`Starting Starknet transaction confirmation for ${txnHash}`);

    while (Date.now() - startTime < POLL_TIMEOUT) {
      try {
        // Get transaction receipt from Starknet RPC
        const receipt = await provider.getTransactionReceipt(txnHash);
        retryCount = 0; // Reset retry count on successful API call

        console.log(`Transaction ${txnHash} receipt:`, {
          status: receipt.execution_status,
          finality: receipt.finality_status,
          blockNumber: receipt.block_number
        });

        // Check if transaction is accepted on L2
        if (receipt.finality_status === 'ACCEPTED_ON_L2') {
          if (receipt.execution_status === 'SUCCEEDED') {
            console.log(`Transaction ${txnHash} confirmed successfully in block ${receipt.block_number}`);
            return {
              success: true,
              blockNumber: receipt.block_number,
              timestamp: new Date().toISOString(),
              executionStatus: receipt.execution_status,
              finalityStatus: receipt.finality_status
            };
          } else {
            const revertReason = receipt.revert_reason || 'Transaction execution failed';
            lastError = `Transaction failed: ${revertReason}`;
            console.error(lastError);
            return {
              success: false,
              error: lastError,
              blockNumber: receipt.block_number,
              timestamp: new Date().toISOString()
            };
          }
        }

        // Transaction is pending or accepted on L1
        if (receipt.finality_status === 'ACCEPTED_ON_L1' || receipt.finality_status === 'PENDING') {
          console.log(`Transaction ${txnHash} is ${receipt.finality_status.toLowerCase()}, waiting...`);
          await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
          continue;
        }

        // Unknown status
        lastError = `Unexpected finality status: ${receipt.finality_status}`;
        console.warn(lastError);
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
        continue;

      } catch (error) {
        // Transaction not found yet
        if (error.message?.includes('Transaction hash not found') || error.message?.includes('TXN_HASH_NOT_FOUND')) {
          console.log(`Transaction ${txnHash} not found yet, polling again...`);
          await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
          continue;
        }

        // Handle network errors with retry logic
        if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.message?.includes('network')) {
          retryCount++;
          if (retryCount <= MAX_RETRIES) {
            console.warn(`Network error (attempt ${retryCount}/${MAX_RETRIES}): ${error.message}. Retrying...`);
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL * retryCount));
            continue;
          }
        }

        lastError = error.message || 'Starknet RPC error';
        console.error(`RPC error: ${lastError}`);
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
      }
    }

    // Timeout or persistent error
    const timeoutError = `Transaction confirmation timeout after ${POLL_TIMEOUT/1000}s`;
    console.error(timeoutError);
    return {
      success: false,
      error: lastError || timeoutError,
      timestamp: null,
    };
  }

  // Optional: Query USDC balance
  async getUSDCBalance(accountAddress) {
    try {
      const USDC_CONTRACT = '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8';
      const balance = await provider.callContract({
        contractAddress: USDC_CONTRACT,
        entrypoint: 'balanceOf',
        calldata: [accountAddress]
      });
      return balance;
    } catch (error) {
      console.error('USDC balance query failed:', error);
      throw error;
    }
  }
}

module.exports = new StarknetService();

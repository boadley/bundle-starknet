import { RpcProvider, Contract, cairo, uint256 } from 'starknet';

// USDC token contract address on Starknet Mainnet
const USDC_CONTRACT_ADDRESS = '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8';

// Starknet provider using reliable public RPC
const provider = new RpcProvider({
  nodeUrl: 'https://starknet-mainnet.public.blastapi.io/rpc/v0_8',
});

// ERC20 ABI for balance checking
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'core::starknet::contract_address::ContractAddress' }],
    outputs: [{ name: 'balance', type: 'core::integer::u256' }],
    stateMutability: 'view',
  },
];

export async function getUSDCBalance(walletAddress: string): Promise<number> {
  try {
    console.log('Checking USDC balance for:', walletAddress);
    
    const contract = new Contract(ERC20_ABI, USDC_CONTRACT_ADDRESS, provider);
    const balance = await contract.call('balanceOf', [walletAddress]);
    
    console.log('Raw balance response:', balance);
    
    // Convert Uint256 to number (USDC has 6 decimals)
    const balanceUint256 = uint256.uint256ToBN(balance.balance);
    const balanceInUsdc = Number(balanceUint256) / (10 ** 6);
    
    console.log('USDC balance:', balanceInUsdc);
    return balanceInUsdc;
  } catch (error: any) {
    console.error('Error fetching USDC balance:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      data: error?.data
    });
    return 0;
  }
}
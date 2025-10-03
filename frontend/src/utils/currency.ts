// currency.ts - Utility functions for currency conversion
// USDC to NGN conversion for ChipiPay payments

export const USDC_NGN_RATE = 1600; // Mock rate: 1 USDC = 1600 NGN

export const calculateUsdcAmount = (ngnAmount: number): number => {
  return ngnAmount / USDC_NGN_RATE; // Returns USDC amount from NGN
};

export const MINIMUM_USDC = 0.01; // Minimum 0.01 USDC for transactions

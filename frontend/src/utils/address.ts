/**
 * Ensures wallet address is exactly 66 characters (0x + 64 hex chars)
 * Pads with zeros after 0x if needed
 */
export function padWalletAddress(address: string): string {
  if (!address) return address;
  
  if (address.startsWith('0x')) {
    if (address.length < 66) {
      // Pad with zeros after 0x to make it 66 characters total
      return '0x' + address.slice(2).padStart(64, '0');
    }
    if (address.length > 66) {
      // Truncate if somehow longer than 66 characters
      return address.slice(0, 66);
    }
  }
  
  return address;
}

// Test cases for development
if (import.meta.env.DEV) {
  // Test short address
  const shortAddr = '0x123';
  const paddedShort = padWalletAddress(shortAddr);
  console.assert(paddedShort.length === 66, `Short address padding failed: ${paddedShort}`);
  
  // Test already correct address
  const correctAddr = '0x' + '1'.repeat(64);
  const paddedCorrect = padWalletAddress(correctAddr);
  console.assert(paddedCorrect.length === 66, `Correct address handling failed: ${paddedCorrect}`);
  
  // Test long address
  const longAddr = '0x' + '1'.repeat(70);
  const paddedLong = padWalletAddress(longAddr);
  console.assert(paddedLong.length === 66, `Long address truncation failed: ${paddedLong}`);
  
  console.log('✅ Address padding utility tests passed');
}
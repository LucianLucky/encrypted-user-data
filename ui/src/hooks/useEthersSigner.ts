import { useMemo } from 'react';
import { useWalletClient } from 'wagmi';
import { ethers } from 'ethers';

export function useEthersSigner() {
  const { data: walletClient } = useWalletClient();
  return useMemo(() => {
    if (!walletClient) return null;
    const { account, chain, transport } = walletClient;
    const provider = new ethers.BrowserProvider(transport, chain);
    return provider.getSigner(account.address);
  }, [walletClient]);
}


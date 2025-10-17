import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Encrypted User Data',
  projectId: import.meta.env.VITE_WALLETCONNECT_ID || '00000000000000000000000000000000',
  chains: [sepolia],
  ssr: false,
});

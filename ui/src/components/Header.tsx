import { ConnectButton } from '@rainbow-me/rainbowkit';
// Removed old styles; minimal header kept inline in AppShell

export function Header() { return <div style={{display:'flex',justifyContent:'flex-end'}}><ConnectButton/></div>; }

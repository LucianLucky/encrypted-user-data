import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { RegisterUser } from './RegisterUser';
import { CreateApplication } from './CreateApplication';
import { ApplyAndStatus } from './ApplyAndStatus';

export function AppShell() {
  const [tab, setTab] = useState<'register' | 'create' | 'apply'>('register');
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Encrypted User Data</h2>
        <ConnectButton />
      </header>

      <nav style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <button onClick={() => setTab('register')} style={{ padding: '8px 12px', border: '1px solid #ddd', background: tab==='register'?'#eef':'#fff' }}>Register</button>
        <button onClick={() => setTab('create')} style={{ padding: '8px 12px', border: '1px solid #ddd', background: tab==='create'?'#eef':'#fff' }}>Create Application</button>
        <button onClick={() => setTab('apply')} style={{ padding: '8px 12px', border: '1px solid #ddd', background: tab==='apply'?'#eef':'#fff' }}>Apply & Status</button>
      </nav>

      {tab === 'register' && <RegisterUser />}
      {tab === 'create' && <CreateApplication />}
      {tab === 'apply' && <ApplyAndStatus />}
    </div>
  );
}


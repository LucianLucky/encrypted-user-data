import { useState } from 'react';
import type { CSSProperties } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { RegisterUser } from './RegisterUser';
import { CreateApplication } from './CreateApplication';
import { ApplyAndStatus } from './ApplyAndStatus';
import { Profile } from './Profile';

const containerStyle: CSSProperties = {
  minHeight: '100vh',
  padding: '2rem',
};

const cardStyle: CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: 'var(--radius-xl)',
  boxShadow: 'var(--shadow-xl)',
  overflow: 'hidden',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1.5rem 2rem',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.75rem',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
};

const iconStyle: CSSProperties = {
  fontSize: '2rem',
};

const navStyle: CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  padding: '1rem 2rem',
  background: 'var(--bg-secondary)',
  borderBottom: '1px solid var(--border-color)',
  overflowX: 'auto',
};

const tabButtonStyle = (active: boolean): CSSProperties => ({
  padding: '0.75rem 1.5rem',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  background: active ? 'var(--primary-color)' : 'transparent',
  color: active ? 'white' : 'var(--text-secondary)',
  fontWeight: active ? 600 : 500,
  fontSize: '0.875rem',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  whiteSpace: 'nowrap',
  boxShadow: active ? 'var(--shadow-md)' : 'none',
});

const contentStyle: CSSProperties = {
  padding: '2rem',
  minHeight: '400px',
};

export function AppShell() {
  const [tab, setTab] = useState<'register' | 'create' | 'apply' | 'profile'>('register');

  return (
    <div style={containerStyle}>
      <div style={cardStyle} className="fade-in">
        <header style={headerStyle}>
          <h1 style={titleStyle}>
            <span style={iconStyle}>🔐</span>
            Encrypted User Data
          </h1>
          <ConnectButton />
        </header>

        <nav style={navStyle}>
          <button
            onClick={() => setTab('register')}
            style={tabButtonStyle(tab === 'register')}
            onMouseEnter={(e) => {
              if (tab !== 'register') {
                e.currentTarget.style.background = 'var(--bg-tertiary)';
              }
            }}
            onMouseLeave={(e) => {
              if (tab !== 'register') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            📝 Register
          </button>
          <button
            onClick={() => setTab('create')}
            style={tabButtonStyle(tab === 'create')}
            onMouseEnter={(e) => {
              if (tab !== 'create') {
                e.currentTarget.style.background = 'var(--bg-tertiary)';
              }
            }}
            onMouseLeave={(e) => {
              if (tab !== 'create') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            ✏️ Create Application
          </button>
          <button
            onClick={() => setTab('apply')}
            style={tabButtonStyle(tab === 'apply')}
            onMouseEnter={(e) => {
              if (tab !== 'apply') {
                e.currentTarget.style.background = 'var(--bg-tertiary)';
              }
            }}
            onMouseLeave={(e) => {
              if (tab !== 'apply') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            📋 Apply & Status
          </button>
          <button
            onClick={() => setTab('profile')}
            style={tabButtonStyle(tab === 'profile')}
            onMouseEnter={(e) => {
              if (tab !== 'profile') {
                e.currentTarget.style.background = 'var(--bg-tertiary)';
              }
            }}
            onMouseLeave={(e) => {
              if (tab !== 'profile') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            👤 Profile
          </button>
        </nav>

        <div style={contentStyle} className="fade-in">
          {tab === 'register' && <RegisterUser />}
          {tab === 'create' && <CreateApplication />}
          {tab === 'apply' && <ApplyAndStatus />}
          {tab === 'profile' && <Profile />}
        </div>
      </div>
    </div>
  );
}

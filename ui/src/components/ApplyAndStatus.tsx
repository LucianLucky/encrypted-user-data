import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import { Contract } from 'ethers';
import { useZamaInstance } from '../hooks/useZamaInstance';

const headerSectionStyle: CSSProperties = {
  marginBottom: '2rem',
  textAlign: 'center',
};

const titleStyle: CSSProperties = {
  fontSize: '2rem',
  fontWeight: 700,
  marginBottom: '0.5rem',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

const subtitleStyle: CSSProperties = {
  fontSize: '1rem',
  color: 'var(--text-secondary)',
};

const containerStyle: CSSProperties = {
  maxWidth: '700px',
  margin: '0 auto',
  background: 'var(--bg-primary)',
  padding: '2rem',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-lg)',
  border: '1px solid var(--border-color)',
};

const formStyle: CSSProperties = {
  display: 'flex',
  gap: '1rem',
  alignItems: 'flex-end',
  flexWrap: 'wrap',
  marginBottom: '1.5rem',
};

const fieldStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  flex: '1',
  minWidth: '200px',
};

const labelStyle: CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 600,
  color: 'var(--text-primary)',
};

const inputStyle: CSSProperties = {
  padding: '0.75rem 1rem',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  fontSize: '1rem',
  transition: 'all 0.2s ease',
};

const buttonGroupStyle: CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
  flexWrap: 'wrap',
};

const actionButtonStyle: CSSProperties = {
  padding: '0.75rem 1.5rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  color: 'white',
  cursor: 'pointer',
  boxShadow: 'var(--shadow-sm)',
  transition: 'all 0.2s ease',
};

const resultCardStyle: CSSProperties = {
  marginTop: '1.5rem',
  padding: '1.5rem',
  background: 'var(--bg-secondary)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
};

const resultLabelStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--text-tertiary)',
  marginBottom: '0.5rem',
};

const resultValueStyle: CSSProperties = {
  padding: '0.875rem 1rem',
  background: 'var(--bg-primary)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  fontFamily: 'monospace',
  fontSize: '0.875rem',
  color: 'var(--text-primary)',
  wordBreak: 'break-all',
};

const clearResultStyle = (value: string): CSSProperties => ({
  padding: '1rem 1.5rem',
  background: value === 'true' ? 'var(--success-color)' : value === 'false' ? 'var(--danger-color)' : 'var(--bg-primary)',
  color: value === 'true' || value === 'false' ? 'white' : 'var(--text-primary)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  fontWeight: 600,
  fontSize: '1.125rem',
  textAlign: 'center',
});

const messageStyle = (isError: boolean): CSSProperties => ({
  marginTop: '1rem',
  padding: '1rem',
  background: isError ? '#fef2f2' : '#f0fdf4',
  borderRadius: 'var(--radius-md)',
  border: `1px solid ${isError ? 'var(--danger-color)' : 'var(--success-color)'}`,
  color: isError ? 'var(--danger-color)' : 'var(--success-color)',
  fontWeight: 500,
  textAlign: 'center',
});

export function ApplyAndStatus() {
  const signerPromise = useEthersSigner();
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const { instance } = useZamaInstance();
  const [appId, setAppId] = useState('');
  const [message, setMessage] = useState('');
  const [encryptedResult, setEncryptedResult] = useState<string>('');
  const [clearResult, setClearResult] = useState<string>('');

  async function onApply(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    if (!signerPromise || !CONTRACT_ADDRESS) {
      setMessage('Connect wallet and set contract address');
      return;
    }
    try {
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, await signerPromise);
      const tx = await contract.submitApplication(parseInt(appId));
      await tx.wait();
      setMessage('Applied');
    } catch (e:any) {
      setMessage(e?.message || 'Apply failed');
    }
  }

  async function onCheck() {
    setEncryptedResult('');
    setClearResult('');
    try {
      if (!publicClient || !CONTRACT_ADDRESS || !address || !instance) return;
      const data = await publicClient.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI as any,
        functionName: 'getApplicationResult',
        args: [BigInt(appId), address as `0x${string}`]
      });
      const handle = data as string;
      setEncryptedResult(handle);
      // user decrypt via relayer SDK
      // Build user-decrypt request (EIP712) is handled by SDK helper
      const keypair = instance.generateKeypair();
      const contractAddresses = [CONTRACT_ADDRESS];
      const startTime = Math.floor(Date.now()/1000).toString();
      const durationDays = '10';
      const eip712 = instance.createEIP712(keypair.publicKey, contractAddresses, startTime, durationDays);
      const signer = await signerPromise;
      const signature = await signer!.signTypedData(
        eip712.domain as any,
        { UserDecryptRequestVerification: (eip712 as any).types.UserDecryptRequestVerification } as any,
        eip712.message as any
      );
      const res = await instance.userDecrypt(
        [{ handle, contractAddress: CONTRACT_ADDRESS }],
        keypair.privateKey,
        keypair.publicKey,
        signature,
        contractAddresses,
        (await signerPromise)!.address,
        startTime,
        durationDays
      );
      const v = res[handle];
      const boolVal = v === true || v === 'true' || v === 1n;
      setClearResult(boolVal ? 'true' : 'false');
    } catch (e:any) {
      setMessage(e?.message || 'Check failed');
    }
  }

  const isError = message.includes('failed') || message.includes('Failed');

  return (
    <div>
      <div style={headerSectionStyle}>
        <h2 style={titleStyle}>📋 Apply & Check Status</h2>
        <p style={subtitleStyle}>Submit applications and check encrypted results</p>
      </div>

      <div style={containerStyle} className="fade-in">
        <form onSubmit={onApply} style={formStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>
              <span>📝 Application ID</span>
            </label>
            <input
              placeholder="Enter application ID"
              value={appId}
              onChange={e => setAppId(e.target.value)}
              style={inputStyle}
              inputMode="numeric"
            />
          </div>

          <div style={buttonGroupStyle}>
            <button
              type="submit"
              style={actionButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              ✓ Apply
            </button>
            <button
              type="button"
              onClick={onCheck}
              style={{ ...actionButtonStyle, background: 'var(--secondary-color)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              🔍 Check Status
            </button>
          </div>
        </form>

        {message && (
          <div style={messageStyle(isError)} className="fade-in">
            {isError ? '⚠️ ' : '✓ '}
            {message}
          </div>
        )}

        {encryptedResult && (
          <div style={resultCardStyle} className="fade-in">
            <div style={resultLabelStyle}>Encrypted Result</div>
            <div style={resultValueStyle}>
              {encryptedResult.slice(0, 42)}...
            </div>
          </div>
        )}

        {clearResult && (
          <div style={resultCardStyle} className="fade-in">
            <div style={resultLabelStyle}>Application Result</div>
            <div style={clearResultStyle(clearResult)}>
              {clearResult === 'true' ? '✓ Approved' : clearResult === 'false' ? '✗ Rejected' : clearResult}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

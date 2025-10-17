import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import { getCountryNameById, getCityNameById } from '../config/locations';

type RawUserData = {
  username: string;
  countryHandle: string;
  cityHandle: string;
  salaryHandle: string;
  birthYearHandle: string;
  registered: boolean;
};

type DecryptedUserData = {
  username: string;
  country: string;
  city: string;
  salary: string;
  birthYear: string;
};

const cardContainerStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '1.5rem',
  maxWidth: '1000px',
  margin: '0 auto',
};

const infoCardStyle: CSSProperties = {
  background: 'var(--bg-primary)',
  borderRadius: 'var(--radius-lg)',
  padding: '1.5rem',
  border: '1px solid var(--border-color)',
  boxShadow: 'var(--shadow-md)',
  transition: 'all 0.3s ease',
};

const fieldStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const labelStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--text-tertiary)',
};

const valueStyle: CSSProperties = {
  padding: '0.875rem 1rem',
  background: 'var(--bg-secondary)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  fontSize: '1rem',
  fontWeight: 500,
  color: 'var(--text-primary)',
  fontFamily: 'monospace',
  letterSpacing: '0.5px',
};

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

const buttonContainerStyle: CSSProperties = {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'center',
  marginTop: '2rem',
};

const primaryButtonStyle: CSSProperties = {
  padding: '0.875rem 2rem',
  fontSize: '1rem',
  fontWeight: 600,
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  color: 'white',
  cursor: 'pointer',
  boxShadow: 'var(--shadow-md)',
  transition: 'all 0.3s ease',
};

const statusBadgeStyle = (registered: boolean): CSSProperties => ({
  display: 'inline-block',
  padding: '0.5rem 1rem',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.875rem',
  fontWeight: 600,
  background: registered ? 'var(--success-color)' : 'var(--warning-color)',
  color: 'white',
  boxShadow: 'var(--shadow-sm)',
});

const loadingStyle: CSSProperties = {
  textAlign: 'center',
  padding: '3rem',
  color: 'var(--text-secondary)',
  fontSize: '1.125rem',
};

const emptyStateStyle: CSSProperties = {
  textAlign: 'center',
  padding: '3rem',
  color: 'var(--text-secondary)',
};

const statusMessageStyle: CSSProperties = {
  marginTop: '1.5rem',
  padding: '1rem',
  background: 'var(--bg-secondary)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  textAlign: 'center',
  color: 'var(--text-primary)',
  fontWeight: 500,
};

export function Profile() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const signerPromise = useEthersSigner();
  const { instance, isLoading: zamaLoading, error: zamaError } = useZamaInstance();

  const [loading, setLoading] = useState(false);
  const [rawUser, setRawUser] = useState<RawUserData | null>(null);
  const [decrypted, setDecrypted] = useState<DecryptedUserData | null>(null);
  const [status, setStatus] = useState<string>('');
  const [decrypting, setDecrypting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchUser() {
      if (!publicClient || !address || !CONTRACT_ADDRESS) {
        setRawUser(null);
        setDecrypted(null);
        return;
      }
      setLoading(true);
      setStatus('');
      try {
        const data = await publicClient.readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: CONTRACT_ABI as any,
          functionName: 'getUser',
          args: [address as `0x${string}`],
        });

        if (cancelled) return;

        const [username, country, city, salary, birthYear, registered] = data as [
          string,
          string,
          string,
          string,
          string,
          boolean
        ];

        if (!registered) {
          setRawUser({
            username,
            countryHandle: country,
            cityHandle: city,
            salaryHandle: salary,
            birthYearHandle: birthYear,
            registered,
          });
          setDecrypted(null);
          setStatus('User not registered yet.');
          return;
        }

        setRawUser({
          username,
          countryHandle: country,
          cityHandle: city,
          salaryHandle: salary,
          birthYearHandle: birthYear,
          registered,
        });
        setDecrypted(null);
      } catch (err: any) {
        if (!cancelled) {
          console.error('Failed to fetch user profile', err);
          setStatus(err?.message || 'Failed to load profile');
          setRawUser(null);
          setDecrypted(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchUser();

    return () => {
      cancelled = true;
    };
  }, [address, publicClient]);

  const isDecryptDisabled = useMemo(() => {
    if (!rawUser || !rawUser.registered) return true;
    if (!instance || !signerPromise || !CONTRACT_ADDRESS) return true;
    return false;
  }, [instance, rawUser, signerPromise]);

  function formatValue(value: unknown) {
    if (typeof value === 'bigint') return value.toString();
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'string') return value;
    if (value == null) return '';
    return String(value);
  }

  function extractNumber(value: unknown): number | null {
    if (typeof value === 'bigint') {
      if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) {
        return null;
      }
      return Number(value);
    }
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        return null;
      }
      return Math.trunc(value);
    }
    if (typeof value === 'string') {
      const parsed = Number.parseInt(value, 10);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  async function onDecrypt() {
    if (!rawUser || !instance || !signerPromise || !CONTRACT_ADDRESS) {
      setStatus('Missing encryption context or wallet');
      return;
    }
    try {
      setDecrypting(true);
      setStatus('');

      const signer = await signerPromise;
      if (!signer) {
        setStatus('Wallet signer unavailable');
        return;
      }

      const keypair = instance.generateKeypair();
      const contractAddresses = [CONTRACT_ADDRESS];
      const startTime = Math.floor(Date.now() / 1000).toString();
      const durationDays = '10';
      const eip712 = instance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTime,
        durationDays
      );

      const signature = await signer.signTypedData(
        eip712.domain as any,
        { UserDecryptRequestVerification: (eip712 as any).types.UserDecryptRequestVerification } as any,
        eip712.message as any
      );

      const handles = [
        { key: 'country', handle: rawUser.countryHandle },
        { key: 'city', handle: rawUser.cityHandle },
        { key: 'salary', handle: rawUser.salaryHandle },
        { key: 'birthYear', handle: rawUser.birthYearHandle },
      ];

      const requests = handles.map(({ handle }) => ({
        handle,
        contractAddress: CONTRACT_ADDRESS,
      }));

      const response = await instance.userDecrypt(
        requests,
        keypair.privateKey,
        keypair.publicKey,
        signature,
        contractAddresses,
        signer.address,
        startTime,
        durationDays
      );

      const rawCountryValue = response[rawUser.countryHandle];
      const rawCityValue = response[rawUser.cityHandle];
      const rawSalaryValue = response[rawUser.salaryHandle];
      const rawBirthYearValue = response[rawUser.birthYearHandle];

      const countryNumeric = extractNumber(rawCountryValue);
      const cityNumeric = extractNumber(rawCityValue);

      const countryName = countryNumeric != null ? getCountryNameById(countryNumeric) : null;
      const cityName = cityNumeric != null ? getCityNameById(cityNumeric) : null;

      const decryptedData: DecryptedUserData = {
        username: rawUser.username,
        country: countryName ?? formatValue(rawCountryValue),
        city: cityName ?? formatValue(rawCityValue),
        salary: formatValue(rawSalaryValue),
        birthYear: formatValue(rawBirthYearValue),
      };

      setDecrypted(decryptedData);
      setStatus('Decryption completed');
    } catch (err: any) {
      console.error('Decrypt failed', err);
      setStatus(err?.message || 'Decrypt failed');
    } finally {
      setDecrypting(false);
    }
  }

  const displayUsername = decrypted?.username ?? (rawUser && rawUser.username ? '***' : '');
  const displayCountry = decrypted?.country ?? (rawUser ? '***' : '');
  const displayCity = decrypted?.city ?? (rawUser ? '***' : '');
  const displaySalary = decrypted?.salary ?? (rawUser ? '***' : '');
  const displayBirthYear = decrypted?.birthYear ?? (rawUser ? '***' : '');

  return (
    <div>
      <div style={headerSectionStyle}>
        <h2 style={titleStyle}>👤 User Profile</h2>
        <p style={subtitleStyle}>View and manage your encrypted user data</p>
      </div>

      {!address && (
        <div style={emptyStateStyle}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔐</div>
          <h3>Connect Your Wallet</h3>
          <p>Please connect your wallet to view your profile.</p>
        </div>
      )}

      {address && (
        <>
          {loading && (
            <div style={loadingStyle}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
              <p>Loading your profile...</p>
            </div>
          )}

          {zamaError && (
            <div style={{ ...statusMessageStyle, borderColor: 'var(--danger-color)', background: '#fef2f2' }}>
              <span style={{ color: 'var(--danger-color)' }}>⚠️ {zamaError}</span>
            </div>
          )}

          {rawUser && !loading && (
            <div className="fade-in">
              <div style={cardContainerStyle}>
                <div style={infoCardStyle} className="slide-in">
                  <div style={fieldStyle}>
                    <span style={labelStyle}>Username</span>
                    <div style={valueStyle}>{displayUsername || '***'}</div>
                  </div>
                </div>

                <div style={infoCardStyle} className="slide-in">
                  <div style={fieldStyle}>
                    <span style={labelStyle}>Country</span>
                    <div style={valueStyle}>{displayCountry || '***'}</div>
                  </div>
                </div>

                <div style={infoCardStyle} className="slide-in">
                  <div style={fieldStyle}>
                    <span style={labelStyle}>City</span>
                    <div style={valueStyle}>{displayCity || '***'}</div>
                  </div>
                </div>

                <div style={infoCardStyle} className="slide-in">
                  <div style={fieldStyle}>
                    <span style={labelStyle}>Annual Salary</span>
                    <div style={valueStyle}>{displaySalary || '***'}</div>
                  </div>
                </div>

                <div style={infoCardStyle} className="slide-in">
                  <div style={fieldStyle}>
                    <span style={labelStyle}>Birth Year</span>
                    <div style={valueStyle}>{displayBirthYear || '***'}</div>
                  </div>
                </div>

                <div style={infoCardStyle} className="slide-in">
                  <div style={fieldStyle}>
                    <span style={labelStyle}>Status</span>
                    <div>
                      <span style={statusBadgeStyle(rawUser.registered)}>
                        {rawUser.registered ? '✓ Registered' : '○ Not Registered'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={buttonContainerStyle}>
                <button
                  onClick={onDecrypt}
                  disabled={isDecryptDisabled || decrypting || zamaLoading}
                  style={primaryButtonStyle}
                  onMouseEnter={(e) => {
                    if (!isDecryptDisabled && !decrypting && !zamaLoading) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                >
                  {decrypting ? '🔓 Decrypting...' : '🔑 Decrypt Data'}
                </button>
              </div>

              {status && (
                <div style={statusMessageStyle} className="fade-in">
                  {status}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

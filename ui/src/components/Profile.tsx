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

const fieldStyle: CSSProperties = {
  display: 'grid',
  gap: 4,
  textAlign: 'left',
};

const valueStyle: CSSProperties = {
  padding: '8px 10px',
  backgroundColor: '#f3f4f6',
  borderRadius: 4,
  border: '1px solid #d1d5db',
};

const layoutStyle: CSSProperties = {
  display: 'grid',
  gap: 16,
  maxWidth: 520,
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
      <h3>User Profile</h3>
      {!address && <p>Connect wallet to load your profile.</p>}
      {address && (
        <div style={layoutStyle}>
          {loading && <p>Loading profile...</p>}
          {zamaError && <p>{zamaError}</p>}
          {rawUser && !loading && (
            <>
              <label style={fieldStyle}>
                <span>Username</span>
                <span style={valueStyle}>{displayUsername || '***'}</span>
              </label>
              <label style={fieldStyle}>
                <span>Country</span>
                <span style={valueStyle}>{displayCountry || '***'}</span>
              </label>
              <label style={fieldStyle}>
                <span>City</span>
                <span style={valueStyle}>{displayCity || '***'}</span>
              </label>
              <label style={fieldStyle}>
                <span>Annual Salary</span>
                <span style={valueStyle}>{displaySalary || '***'}</span>
              </label>
              <label style={fieldStyle}>
                <span>Birth Year</span>
                <span style={valueStyle}>{displayBirthYear || '***'}</span>
              </label>
              <label style={fieldStyle}>
                <span>Status</span>
                <span style={valueStyle}>{rawUser.registered ? 'Registered' : 'Not Registered'}</span>
              </label>
            </>
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onDecrypt} disabled={isDecryptDisabled || decrypting || zamaLoading}>
              {decrypting ? 'Decrypting...' : 'Decrypt' }
            </button>
          </div>
          {status && <p>{status}</p>}
        </div>
      )}
    </div>
  );
}

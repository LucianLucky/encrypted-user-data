import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useAccount } from 'wagmi';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import { COUNTRIES, getCitiesForCountry } from '../config/locations';
import { Contract } from 'ethers';

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
  marginBottom: '0.5rem',
};

const infoBoxStyle: CSSProperties = {
  padding: '1rem',
  background: 'var(--primary-light)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--primary-color)',
  marginBottom: '2rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
};

const formContainerStyle: CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  background: 'var(--bg-primary)',
  padding: '2rem',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-lg)',
  border: '1px solid var(--border-color)',
};

const formStyle: CSSProperties = {
  display: 'grid',
  gap: '1.5rem',
};

const fieldStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
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

const submitButtonStyle: CSSProperties = {
  padding: '1rem 2rem',
  fontSize: '1rem',
  fontWeight: 600,
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  color: 'white',
  cursor: 'pointer',
  boxShadow: 'var(--shadow-md)',
  transition: 'all 0.3s ease',
  marginTop: '1rem',
};

const messageStyle = (isError: boolean): CSSProperties => ({
  marginTop: '1.5rem',
  padding: '1rem',
  background: isError ? '#fef2f2' : '#f0fdf4',
  borderRadius: 'var(--radius-md)',
  border: `1px solid ${isError ? 'var(--danger-color)' : 'var(--success-color)'}`,
  color: isError ? 'var(--danger-color)' : 'var(--success-color)',
  fontWeight: 500,
  textAlign: 'center',
});

export function RegisterUser() {
  const { address } = useAccount();
  const signerPromise = useEthersSigner();
  const { instance, isLoading: zamaLoading } = useZamaInstance();
  const defaultCountry = COUNTRIES[0]?.id.toString() ?? '';
  const defaultCity = COUNTRIES[0]?.cities[0]?.id.toString() ?? '';
  const [username, setUsername] = useState('');
  const [countryId, setCountryId] = useState(defaultCountry);
  const [cityId, setCityId] = useState(defaultCity);
  const [salary, setSalary] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const cityOptions = useMemo(() => {
    const parsed = Number.parseInt(countryId, 10);
    if (Number.isNaN(parsed)) {
      return [];
    }
    return getCitiesForCountry(parsed);
  }, [countryId]);

  useEffect(() => {
    if (!cityOptions.length) {
      if (cityId !== '') {
        setCityId('');
      }
      return;
    }
    const exists = cityOptions.some((option) => option.id.toString() === cityId);
    if (!exists) {
      setCityId(cityOptions[0].id.toString());
    }
  }, [cityOptions, cityId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    if (!address || !signerPromise || !instance || !CONTRACT_ADDRESS) {
      setMessage('Connect wallet, fill fields, and set contract address');
      return;
    }
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setMessage('Username is required');
      return;
    }
    if (!countryId || !cityId) {
      setMessage('Select country and city');
      return;
    }
    if (!salary.trim() || !birthYear.trim()) {
      setMessage('Enter salary and birth year');
      return;
    }
    setSubmitting(true);
    try {
      const country = Number.parseInt(countryId, 10);
      const city = Number.parseInt(cityId, 10);
      const year = Number.parseInt(birthYear, 10);

      if (Number.isNaN(country) || Number.isNaN(city)) {
        throw new Error('Invalid country or city selection');
      }
      if (Number.isNaN(year)) {
        throw new Error('Enter a valid birth year');
      }

      let sal: bigint;
      try {
        sal = BigInt(salary);
      } catch (error) {
        throw new Error('Enter a valid salary');
      }

      const buf = instance.createEncryptedInput(CONTRACT_ADDRESS, address);
      buf.add32(country);
      buf.add32(city);
      buf.add64(sal);
      buf.add16(year);
      const enc = await buf.encrypt();

      const signer = await signerPromise;
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.register(
        trimmedUsername,
        enc.handles[0],
        enc.handles[1],
        enc.handles[2],
        enc.handles[3],
        enc.inputProof
      );
      await tx.wait();
      setMessage('Registered successfully');
    } catch (e:any) {
      setMessage(e?.message || 'Register failed');
    } finally {
      setSubmitting(false);
    }
  }

  const isError = message.includes('failed') || message.includes('Failed') || message.includes('Invalid') || message.includes('Enter') || message.includes('required') || message.includes('Select');

  return (
    <div>
      <div style={headerSectionStyle}>
        <h2 style={titleStyle}>📝 Register User</h2>
        <p style={subtitleStyle}>Create your encrypted user profile</p>
      </div>

      <div style={infoBoxStyle} className="fade-in">
        <span style={{ fontSize: '1.5rem' }}>🔒</span>
        <p style={{ margin: 0, color: 'var(--primary-color)', fontWeight: 500 }}>
          All your data is encrypted end-to-end using Zama's FHE technology
        </p>
      </div>

      <div style={formContainerStyle} className="fade-in">
        <form onSubmit={onSubmit} style={formStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>
              <span>👤 Username</span>
            </label>
            <input
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              <span>🌍 Country</span>
            </label>
            <select
              value={countryId}
              onChange={e => setCountryId(e.target.value)}
              style={inputStyle}
            >
              {COUNTRIES.map((country) => (
                <option key={country.id} value={country.id.toString()}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              <span>🏙️ City</span>
            </label>
            <select
              value={cityId}
              onChange={e => setCityId(e.target.value)}
              style={inputStyle}
              disabled={!cityOptions.length}
            >
              {cityOptions.map((city) => (
                <option key={city.id} value={city.id.toString()}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              <span>💰 Annual Salary</span>
            </label>
            <input
              placeholder="Enter your annual salary"
              value={salary}
              onChange={e => setSalary(e.target.value)}
              style={inputStyle}
              inputMode="numeric"
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              <span>📅 Birth Year</span>
            </label>
            <input
              placeholder="Enter your birth year"
              value={birthYear}
              onChange={e => setBirthYear(e.target.value)}
              style={inputStyle}
              inputMode="numeric"
            />
          </div>

          <button
            disabled={submitting || zamaLoading}
            type="submit"
            style={submitButtonStyle}
            onMouseEnter={(e) => {
              if (!submitting && !zamaLoading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
          >
            {submitting ? '⏳ Submitting...' : '✨ Register Now'}
          </button>

          {message && (
            <div style={messageStyle(isError)} className="fade-in">
              {isError ? '⚠️ ' : '✓ '}
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

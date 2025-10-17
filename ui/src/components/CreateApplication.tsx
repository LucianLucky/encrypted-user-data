import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useEthersSigner } from '../hooks/useEthersSigner';
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
};

const formContainerStyle: CSSProperties = {
  maxWidth: '700px',
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

const rangeContainerStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1rem',
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

export function CreateApplication() {
  const signerPromise = useEthersSigner();
  const [country, setCountry] = useState('0');
  const [city, setCity] = useState('0');
  const [minSalary, setMinSalary] = useState('0');
  const [maxSalary, setMaxSalary] = useState('0');
  const [minYear, setMinYear] = useState('0');
  const [maxYear, setMaxYear] = useState('0');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const cityOptions = useMemo(() => {
    const parsed = Number.parseInt(country, 10);
    if (Number.isNaN(parsed) || parsed === 0) {
      return [];
    }
    return getCitiesForCountry(parsed);
  }, [country]);

  const disableCitySelection = useMemo(() => {
    const parsed = Number.parseInt(country, 10);
    return Number.isNaN(parsed) || parsed === 0;
  }, [country]);

  useEffect(() => {
    const parsedCountry = Number.parseInt(country, 10);
    if (Number.isNaN(parsedCountry) || parsedCountry === 0) {
      if (city !== '0') {
        setCity('0');
      }
      return;
    }

    if (!cityOptions.length) {
      if (city !== '0') {
        setCity('0');
      }
      return;
    }

    const exists = cityOptions.some((option) => option.id.toString() === city);
    if (!exists) {
      setCity(cityOptions[0].id.toString());
    }
  }, [country, city, cityOptions]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    if (!signerPromise || !CONTRACT_ADDRESS) {
      setMessage('Connect wallet and set contract address');
      return;
    }
    setSubmitting(true);
    try {
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, await signerPromise);
      const countryId = Number.parseInt(country, 10);
      const cityId = Number.parseInt(city, 10);

      if (Number.isNaN(countryId) || Number.isNaN(cityId)) {
        throw new Error('Invalid location selection');
      }

      const minSalaryValue = minSalary.trim() === '' ? '0' : minSalary;
      const maxSalaryValue = maxSalary.trim() === '' ? '0' : maxSalary;

      let minSalaryBig: bigint;
      let maxSalaryBig: bigint;
      try {
        minSalaryBig = BigInt(minSalaryValue);
      } catch (error) {
        throw new Error('Enter a valid minimum salary');
      }
      try {
        maxSalaryBig = BigInt(maxSalaryValue);
      } catch (error) {
        throw new Error('Enter a valid maximum salary');
      }

      if (maxSalaryBig !== 0n && minSalaryBig !== 0n && maxSalaryBig < minSalaryBig) {
        throw new Error('Maximum salary must be greater than minimum salary');
      }

      const minYearValue = minYear.trim() === '' ? '0' : minYear;
      const maxYearValue = maxYear.trim() === '' ? '0' : maxYear;

      const minYearNumber = Number.parseInt(minYearValue, 10);
      const maxYearNumber = Number.parseInt(maxYearValue, 10);

      if (Number.isNaN(minYearNumber) || Number.isNaN(maxYearNumber)) {
        throw new Error('Enter valid birth year limits');
      }
      if (maxYearNumber !== 0 && minYearNumber !== 0 && maxYearNumber < minYearNumber) {
        throw new Error('Maximum birth year must be greater than minimum birth year');
      }

      const tx = await contract.createApplication(
        countryId,
        cityId,
        minSalaryBig,
        maxSalaryBig,
        minYearNumber,
        maxYearNumber
      );
      await tx.wait();
      setMessage('Application created');
    } catch (e:any) {
      setMessage(e?.message || 'Create failed');
    } finally {
      setSubmitting(false);
    }
  }

  const isError = message.includes('failed') || message.includes('Failed') || message.includes('Invalid') || message.includes('Enter') || message.includes('must');

  return (
    <div>
      <div style={headerSectionStyle}>
        <h2 style={titleStyle}>✏️ Create Application</h2>
        <p style={subtitleStyle}>Define criteria for applicant matching</p>
      </div>

      <div style={formContainerStyle} className="fade-in">
        <form onSubmit={onSubmit} style={formStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>
              <span>🌍 Country</span>
            </label>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              style={inputStyle}
            >
              <option value="0">Any country</option>
              {COUNTRIES.map((option) => (
                <option key={option.id} value={option.id.toString()}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              <span>🏙️ City</span>
            </label>
            <select
              value={city}
              onChange={e => setCity(e.target.value)}
              style={inputStyle}
              disabled={disableCitySelection}
            >
              <option value="0">Any city</option>
              {cityOptions.map((option) => (
                <option key={option.id} value={option.id.toString()}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ ...labelStyle, marginBottom: '0.75rem', display: 'block' }}>
              <span>💰 Salary Range (0 = no limit)</span>
            </label>
            <div style={rangeContainerStyle}>
              <div style={fieldStyle}>
                <input
                  placeholder="Min salary"
                  value={minSalary}
                  onChange={e => setMinSalary(e.target.value)}
                  style={inputStyle}
                  inputMode="numeric"
                />
              </div>
              <div style={fieldStyle}>
                <input
                  placeholder="Max salary"
                  value={maxSalary}
                  onChange={e => setMaxSalary(e.target.value)}
                  style={inputStyle}
                  inputMode="numeric"
                />
              </div>
            </div>
          </div>

          <div>
            <label style={{ ...labelStyle, marginBottom: '0.75rem', display: 'block' }}>
              <span>📅 Birth Year Range (0 = no limit)</span>
            </label>
            <div style={rangeContainerStyle}>
              <div style={fieldStyle}>
                <input
                  placeholder="Min year"
                  value={minYear}
                  onChange={e => setMinYear(e.target.value)}
                  style={inputStyle}
                  inputMode="numeric"
                />
              </div>
              <div style={fieldStyle}>
                <input
                  placeholder="Max year"
                  value={maxYear}
                  onChange={e => setMaxYear(e.target.value)}
                  style={inputStyle}
                  inputMode="numeric"
                />
              </div>
            </div>
          </div>

          <button
            disabled={submitting}
            type="submit"
            style={submitButtonStyle}
            onMouseEnter={(e) => {
              if (!submitting) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
          >
            {submitting ? '⏳ Creating...' : '✨ Create Application'}
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

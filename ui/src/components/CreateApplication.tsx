import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import { COUNTRIES, getCitiesForCountry } from '../config/locations';
import { Contract } from 'ethers';

export function CreateApplication() {
  const signerPromise = useEthersSigner();
  const fieldStyle: CSSProperties = { display: 'grid', gap: 4, textAlign: 'left' };
  const inputStyle: CSSProperties = { padding: '8px 10px', borderRadius: 4, border: '1px solid #d1d5db' };
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

  return (
    <div>
      <h3>Create Application</h3>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 500 }}>
        <label style={fieldStyle}>
          <span>Country</span>
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
        </label>
        <label style={fieldStyle}>
          <span>City</span>
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
        </label>
        <label style={fieldStyle}>
          <span>Minimum Salary (0 ignore)</span>
          <input
            placeholder="min salary (0 ignore)"
            value={minSalary}
            onChange={e=>setMinSalary(e.target.value)}
            style={inputStyle}
            inputMode="numeric"
          />
        </label>
        <label style={fieldStyle}>
          <span>Maximum Salary (0 ignore)</span>
          <input
            placeholder="max salary (0 ignore)"
            value={maxSalary}
            onChange={e=>setMaxSalary(e.target.value)}
            style={inputStyle}
            inputMode="numeric"
          />
        </label>
        <label style={fieldStyle}>
          <span>Minimum Birth Year (0 ignore)</span>
          <input
            placeholder="min birth year (0 ignore)"
            value={minYear}
            onChange={e=>setMinYear(e.target.value)}
            style={inputStyle}
            inputMode="numeric"
          />
        </label>
        <label style={fieldStyle}>
          <span>Maximum Birth Year (0 ignore)</span>
          <input
            placeholder="max birth year (0 ignore)"
            value={maxYear}
            onChange={e=>setMaxYear(e.target.value)}
            style={inputStyle}
            inputMode="numeric"
          />
        </label>
        <button disabled={submitting} type="submit">{submitting? 'Submitting...':'Submit'}</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

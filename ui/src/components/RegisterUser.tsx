import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useAccount } from 'wagmi';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import { COUNTRIES, getCitiesForCountry } from '../config/locations';
import { Contract } from 'ethers';

export function RegisterUser() {
  const { address } = useAccount();
  const signerPromise = useEthersSigner();
  const { instance, isLoading: zamaLoading } = useZamaInstance();
  const fieldStyle: CSSProperties = { display: 'grid', gap: 4, textAlign: 'left' };
  const inputStyle: CSSProperties = { padding: '8px 10px', borderRadius: 4, border: '1px solid #d1d5db' };
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

  return (
    <div>
      <h3>Register User</h3>
      <p>All your data is encrypted by Zama.</p>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 500 }}>
        <label style={fieldStyle}>
          <span>Username</span>
          <input
            placeholder="username"
            value={username}
            onChange={e=>setUsername(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={fieldStyle}>
          <span>Country</span>
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
        </label>
        <label style={fieldStyle}>
          <span>City</span>
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
        </label>
        <label style={fieldStyle}>
          <span>Annual Salary</span>
          <input
            placeholder="annual salary"
            value={salary}
            onChange={e=>setSalary(e.target.value)}
            style={inputStyle}
            inputMode="numeric"
          />
        </label>
        <label style={fieldStyle}>
          <span>Birth Year</span>
          <input
            placeholder="birth year"
            value={birthYear}
            onChange={e=>setBirthYear(e.target.value)}
            style={inputStyle}
            inputMode="numeric"
          />
        </label>
        <button disabled={submitting || zamaLoading} type="submit">{submitting? 'Submitting...':'Submit'}</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

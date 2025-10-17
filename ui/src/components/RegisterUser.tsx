import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useAccount } from 'wagmi';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import { Contract } from 'ethers';

export function RegisterUser() {
  const { address } = useAccount();
  const signerPromise = useEthersSigner();
  const { instance, isLoading: zamaLoading } = useZamaInstance();
  const fieldStyle: CSSProperties = { display: 'grid', gap: 4, textAlign: 'left' };
  const inputStyle: CSSProperties = { padding: '8px 10px', borderRadius: 4, border: '1px solid #d1d5db' };
  const [username, setUsername] = useState('');
  const [countryId, setCountryId] = useState('');
  const [cityId, setCityId] = useState('');
  const [salary, setSalary] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    if (!address || !signerPromise || !instance || !CONTRACT_ADDRESS) {
      setMessage('Connect wallet, fill fields, and set contract address');
      return;
    }
    setSubmitting(true);
    try {
      const country = parseInt(countryId);
      const city = parseInt(cityId);
      const sal = BigInt(salary);
      const year = parseInt(birthYear);

      const buf = instance.createEncryptedInput(CONTRACT_ADDRESS, address);
      buf.add32(country);
      buf.add32(city);
      buf.add64(sal);
      buf.add16(year);
      const enc = await buf.encrypt();

      const signer = await signerPromise;
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.register(
        username,
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
          <span>Country Id</span>
          <input
            placeholder="country id"
            value={countryId}
            onChange={e=>setCountryId(e.target.value)}
            style={inputStyle}
            inputMode="numeric"
          />
        </label>
        <label style={fieldStyle}>
          <span>City Id</span>
          <input
            placeholder="city id"
            value={cityId}
            onChange={e=>setCityId(e.target.value)}
            style={inputStyle}
            inputMode="numeric"
          />
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

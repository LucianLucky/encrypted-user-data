import { useState } from 'react';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import { Contract } from 'ethers';

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
      const tx = await contract.createApplication(
        parseInt(country),
        parseInt(city),
        BigInt(minSalary),
        BigInt(maxSalary),
        parseInt(minYear),
        parseInt(maxYear)
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
        <input placeholder="country id (0 ignore)" value={country} onChange={e=>setCountry(e.target.value)} />
        <input placeholder="city id (0 ignore)" value={city} onChange={e=>setCity(e.target.value)} />
        <input placeholder="min salary (0 ignore)" value={minSalary} onChange={e=>setMinSalary(e.target.value)} />
        <input placeholder="max salary (0 ignore)" value={maxSalary} onChange={e=>setMaxSalary(e.target.value)} />
        <input placeholder="min birth year (0 ignore)" value={minYear} onChange={e=>setMinYear(e.target.value)} />
        <input placeholder="max birth year (0 ignore)" value={maxYear} onChange={e=>setMaxYear(e.target.value)} />
        <button disabled={submitting} type="submit">{submitting? 'Submitting...':'Submit'}</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}


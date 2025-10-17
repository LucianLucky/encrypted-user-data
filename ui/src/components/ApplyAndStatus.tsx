import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import { Contract } from 'ethers';
import { useZamaInstance } from '../hooks/useZamaInstance';

export function ApplyAndStatus() {
  const signerPromise = useEthersSigner();
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const { instance } = useZamaInstance();
  const fieldStyle: CSSProperties = { display: 'grid', gap: 4, textAlign: 'left' };
  const inputStyle: CSSProperties = { padding: '8px 10px', borderRadius: 4, border: '1px solid #d1d5db' };
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

  return (
    <div>
      <h3>Apply & Check Result</h3>
      <form onSubmit={onApply} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <label style={{ ...fieldStyle, minWidth: 160 }}>
          <span>Application Id</span>
          <input
            placeholder="application id"
            value={appId}
            onChange={e=>setAppId(e.target.value)}
            style={inputStyle}
            inputMode="numeric"
          />
        </label>
        <button type="submit">Apply</button>
        <button type="button" onClick={onCheck}>Check</button>
      </form>
      {message && <p>{message}</p>}
      {encryptedResult && <p>Encrypted: {encryptedResult.slice(0,18)}...</p>}
      {clearResult && <p>Clear: {clearResult}</p>}
    </div>
  );
}

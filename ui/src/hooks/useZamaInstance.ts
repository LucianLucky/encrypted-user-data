import { useEffect, useState } from 'react';
import { createInstance, type FhevmInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/web';

export function useZamaInstance() {
  const [instance, setInstance] = useState<FhevmInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const inst = await createInstance(SepoliaConfig);
        if (mounted) setInstance(inst);
      } catch (e:any) {
        if (mounted) setError(e?.message || 'Failed to init Zama instance');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { instance, isLoading: loading, error };
}

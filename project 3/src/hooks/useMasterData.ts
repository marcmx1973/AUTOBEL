import { useState, useEffect } from 'react';
import { fetchMasterData, type MasterDataType } from '../lib/supabase';

export function useMasterData() {
  const [masterData, setMasterData] = useState<MasterDataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchMasterData();
        setMasterData(data);
      } catch (err) {
        console.error('Error loading master data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load master data');
      } finally {
        setLoading(false);
      }
    };

    loadMasterData();
  }, []);

  return { masterData, loading, error };
}
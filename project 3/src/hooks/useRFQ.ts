import { useState, useEffect } from 'react';
import { fetchRFQ, fetchRFQComments, type RFQ, type RFQComment } from '../lib/supabase';

export function useRFQ(id: string) {
  const [rfq, setRFQ] = useState<RFQ | null>(null);
  const [comments, setComments] = useState<RFQComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRFQ = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [rfqData, commentsData] = await Promise.all([
          fetchRFQ(id),
          fetchRFQComments(id)
        ]);
        
        setRFQ(rfqData);
        setComments(commentsData);
      } catch (err) {
        console.error('Error loading RFQ:', err);
        setError(err instanceof Error ? err.message : 'Failed to load RFQ');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadRFQ();
    }
  }, [id]);

  return { rfq, comments, loading, error };
}
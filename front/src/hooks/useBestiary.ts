import { useState, useEffect, useCallback } from 'react';
import { bestiaryApi } from '../services/api';
import type {
  BestiarySummaryApi,
  BestiaryEntryApi,
  CreatureCategory,
  StatBlockType,
} from '../services/api';

export function useBestiary() {
  const [entries, setEntries] = useState<BestiarySummaryApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async (filters?: { category?: CreatureCategory; search?: string; statBlockType?: StatBlockType }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await bestiaryApi.list(filters);
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bestiary');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const getEntry = useCallback(async (id: number): Promise<BestiaryEntryApi> => {
    return bestiaryApi.get(id);
  }, []);

  const instantiate = useCallback(async (id: number, data: { sessionId?: number; name?: string }) => {
    return bestiaryApi.instantiate(id, data);
  }, []);

  return {
    entries,
    loading,
    error,
    loadEntries,
    getEntry,
    instantiate,
  };
}

// frontend/src/hooks/useJewelryAssets.js
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const useJewelryAssets = () => {
  const [categories, setCategories] = useState([]);
  const [beads,      setBeads]      = useState([]);
  const [chains,     setChains]     = useState([]);
  const [charms,     setCharms]     = useState([]);
  const [materials,  setMaterials]  = useState([]);
  const [colors,     setColors]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  const fetchAll = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const [categoriesRes, beadsRes, chainsRes, charmsRes, materialsRes, colorsRes] =
        await Promise.all([
          api.get('/customization/categories/', { signal }),
          api.get('/accessories/beads/',        { signal }),
          api.get('/accessories/chains/',       { signal }),
          api.get('/accessories/charms/',       { signal }),
          api.get('/accessories/materials/',    { signal }),
          api.get('/accessories/colors/',       { signal }),
        ]);

      if (!signal?.aborted) {
        setCategories(categoriesRes.data.results ?? categoriesRes.data ?? []);
        setBeads(     beadsRes.data.results      ?? beadsRes.data      ?? []);
        setChains(    chainsRes.data.results     ?? chainsRes.data     ?? []);
        setCharms(    charmsRes.data.results     ?? charmsRes.data     ?? []);
        setMaterials( materialsRes.data.results  ?? materialsRes.data  ?? []);
        setColors(    colorsRes.data.results     ?? colorsRes.data     ?? []);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      setError(err.response?.data?.error ?? 'Failed to load jewelry assets');
      console.error('useJewelryAssets:', err);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    const controller = new AbortController();
    fetchAll(controller.signal);
    return () => controller.abort();
  }, [fetchAll]);

  // Re-fetch silently whenever the browser tab regains focus
  // (covers the case where user adds a bead in admin while this tab is open)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchAll();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchAll]);

  return { categories, beads, chains, charms, materials, colors, loading, error };
};

export default useJewelryAssets;

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ytDownloaderHistory';
const MAX_ITEMS = 20;

export function useDownloadHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setHistory(JSON.parse(saved));
    } catch {
      setHistory([]);
    }
  }, []);

  const addEntry = useCallback((entry) => {
    setHistory((prev) => {
      const next = [
        { ...entry, id: Date.now(), timestamp: new Date().toISOString() },
        ...prev.filter((h) => h.url !== entry.url || h.format !== entry.format || h.platform !== entry.platform),
      ].slice(0, MAX_ITEMS);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch { /* storage full */ }

      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { history, addEntry, clearHistory };
}
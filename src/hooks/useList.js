import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

// Generic hook to load entity lists with optional filter
export function useList(entityName, filter = {}, sort = "-created_date", limit = 100) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await base44.entities[entityName].filter(filter, sort, limit);
      const list = Array.isArray(result) ? result : (Array.isArray(result?.data) ? result.data : (Array.isArray(result?.items) ? result.items : []));
      setData(list);
      setError(null);
    } catch (e) {
      setError(e);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [entityName, JSON.stringify(filter), sort, limit]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load, setData };
}

export function formatINR(n) {
  if (n == null) return "₹0";
  return "₹" + Number(n).toLocaleString("en-IN");
}
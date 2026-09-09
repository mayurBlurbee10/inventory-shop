"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";

const AccessContext = createContext(null);

function permKey(resource, action) {
  return `${resource}.${action}`;
}

export default function AccessControlProvider({ children }) {
  const [permissions, setPermissions] = useState({});
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWrapper("/api/access/permissions");
      if (!res.ok) throw new Error(`permissions HTTP ${res.status}`);
      const data = await res.json();
      setPermissions(data?.permissions || {});
      setRoles(Array.isArray(data?.roles) ? data.roles : []);
      setError(null);
    } catch (err) {
      setPermissions({});
      setRoles([]);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const can = useCallback(
    (resource, action) => Boolean(permissions[permKey(resource, action)]),
    [permissions]
  );

  const value = useMemo(
    () => ({ permissions, roles, loading, error, refresh, can }),
    [permissions, roles, loading, error, refresh, can]
  );

  return (
    <AccessContext.Provider value={value}>{children}</AccessContext.Provider>
  );
}

export function useAccess() {
  const ctx = useContext(AccessContext);
  if (!ctx) {
    throw new Error("useAccess must be used inside AccessControlProvider");
  }
  return ctx;
}

export function useCan(resource, action) {
  return useAccess().can(resource, action);
}

/** Hide children when not allowed */
export function Can({ resource, action, children, fallback = null }) {
  const allowed = useCan(resource, action);
  return allowed ? children : fallback;
}
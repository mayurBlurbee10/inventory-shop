"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

type PermissionMap = Record<string, boolean>;

type AccessContextValue = {
    permissions: PermissionMap;
    roles: string[];
    loading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
    can: (resource: string, action: string) => boolean;
};

const AccessContext = createContext<AccessContextValue | null>(null);

function permKey(resource: string, action: string) {
    return `${resource}.${action}`;
}

type PermissionsResult = { permissions: PermissionMap; roles: string[]; error: Error | null };

async function fetchPermissions(): Promise<PermissionsResult> {
    try {
        const data = await apiFetch<{ permissions?: PermissionMap; roles?: string[] }>("/api/access/permissions");
        return {
            permissions: data?.permissions || {},
            roles: Array.isArray(data?.roles) ? data.roles : [],
            error: null,
        };
    } catch (err) {
        // Fail closed: no permissions means everything is hidden
        return { permissions: {}, roles: [], error: err instanceof Error ? err : new Error(String(err)) };
    }
}

/** Loads the user's permission map once from GET /api/access/permissions (MStrategy Access Control). */
export default function AccessControlProvider({ children }: { children: React.ReactNode }) {
    const [permissions, setPermissions] = useState<PermissionMap>({});
    const [roles, setRoles] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const apply = useCallback((result: PermissionsResult) => {
        setPermissions(result.permissions);
        setRoles(result.roles);
        setError(result.error);
        setLoading(false);
    }, []);

    const refresh = useCallback(async () => {
        setLoading(true);
        apply(await fetchPermissions());
    }, [apply]);

    // First load: `loading` already starts true
    useEffect(() => {
        let active = true;
        fetchPermissions().then((result) => {
            if (active) apply(result);
        });
        return () => {
            active = false;
        };
    }, [apply]);

    const can = useCallback(
        (resource: string, action: string) => Boolean(permissions[permKey(resource, action)]),
        [permissions]
    );

    const value = useMemo(
        () => ({ permissions, roles, loading, error, refresh, can }),
        [permissions, roles, loading, error, refresh, can]
    );

    return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess() {
    const ctx = useContext(AccessContext);
    if (!ctx) {
        throw new Error("useAccess must be used inside AccessControlProvider");
    }
    return ctx;
}

export function useCan(resource: string, action: string) {
    return useAccess().can(resource, action);
}

/** Hide children when not allowed */
export function Can({
    resource,
    action,
    children,
    fallback = null,
}: {
    resource: string;
    action: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}) {
    const allowed = useCan(resource, action);
    return <>{allowed ? children : fallback}</>;
}

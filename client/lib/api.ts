const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

/** Error thrown by apiFetch; keeps the HTTP status and the server's error code (e.g. ACCESS_DENIED). */
export class ApiError extends Error {
    constructor(message: string, public status: number, public code?: string) {
        super(message);
        this.name = "ApiError";
    }
}

export async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = endpoint.startsWith("http")
        ? endpoint
        : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

    const activeShopId = typeof window !== "undefined" ? localStorage.getItem("active_shop_id") : null;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(activeShopId ? { "x-shop-id": activeShopId } : {}),
        ...(options.headers as Record<string, string>),
    };

    const res = await fetch(url, {
        ...options,
        headers,
        credentials: "include", // Ensure session cookies are sent
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        // 403 from MStrategy Access Control (RBAC/ABAC) middleware
        if (data.code === "ACCESS_DENIED") {
            throw new ApiError("You don't have permission to do this. Ask the shop owner for access.", res.status, data.code);
        }
        throw new ApiError(data.message || data.error || `HTTP error! status: ${res.status}`, res.status, data.code);
    }

    return data as T;
}

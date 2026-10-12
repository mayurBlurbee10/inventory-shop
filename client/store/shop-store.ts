import { create } from "zustand";
import { ApiError, apiFetch } from "@/lib/api";

export interface Shop {
    id: string;
    name: string;
    slug?: string;
    address?: string;
    phone?: string;
    currency: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

interface ShopState {
    shops: Shop[];
    activeShop: Shop | null;
    isLoading: boolean;
    hasFetched: boolean;
    // Set when loading shops failed, so the UI doesn't mistake an error for "no shops"
    error: { message: string; accessDenied: boolean } | null;
    fetchShops: () => Promise<void>;
    refreshShops: () => Promise<void>;
    selectShop: (shopId: string) => void;
    setActiveShop: (shop: Shop | null) => void;
}

export const useShop = create<ShopState>()((set, get) => ({
    shops: [],
    activeShop: null,
    isLoading: true,
    hasFetched: false,
    error: null,

    fetchShops: async () => {
        try {
            set({ isLoading: true, error: null });
            const res = await apiFetch<{ success: boolean; shops: Shop[] }>("/api/shops/my-shops");
            const userShops = res.shops || [];
            set({ shops: userShops, hasFetched: true });

            if (userShops.length > 0) {
                const storedId = typeof window !== "undefined" ? localStorage.getItem("active_shop_id") : null;
                const found = userShops.find((s) => s.id === storedId);

                if (found) {
                    set({ activeShop: found });
                } else {
                    set({ activeShop: userShops[0] });
                    if (typeof window !== "undefined") {
                        localStorage.setItem("active_shop_id", userShops[0].id);
                    }
                }
            } else {
                set({ activeShop: null });
                if (typeof window !== "undefined") {
                    localStorage.removeItem("active_shop_id");
                }
            }
        } catch (error) {
            console.error("[ShopStore] Failed to fetch shops:", error);
            set({
                shops: [],
                activeShop: null,
                hasFetched: true,
                error: {
                    message: error instanceof Error ? error.message : "Failed to load shops.",
                    accessDenied: error instanceof ApiError && error.code === "ACCESS_DENIED",
                },
            });
        } finally {
            set({ isLoading: false });
        }
    },

    refreshShops: async () => {
        await get().fetchShops();
    },

    selectShop: (shopId: string) => {
        const found = get().shops.find((s) => s.id === shopId);
        if (found) {
            set({ activeShop: found });
            if (typeof window !== "undefined") {
                localStorage.setItem("active_shop_id", found.id);
                window.location.reload();
            }
        }
    },

    setActiveShop: (shop: Shop | null) => {
        set({ activeShop: shop });
        if (shop && typeof window !== "undefined") {
            localStorage.setItem("active_shop_id", shop.id);
        }
    },
}));
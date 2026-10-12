// Resource / action keys registered in MStrategy Access Control (PAP application "Inventory Shop").
// Keep in sync with client/lib/access.ts and the PAP policy editor — keys are case-sensitive.

export const RESOURCES = {
    SHOP: "shop",
    STAFF: "staff",
    PRODUCT: "product",
    SALE: "sale",
    INVOICE: "invoice",
    DASHBOARD: "dashboard",
    // ABAC resource sets — the app picks these keys when the record matches the PAP condition
    HIGH_DISCOUNT_SALE: "high_discount_sale",
    HIGH_VALUE_SALE: "high_value_sale",
    RECENT_SALE: "recent_sale",
    STOCKED_PRODUCT: "stocked_product",
} as const;

export const ACTIONS = {
    VIEW: "view",
    CREATE: "create",
    UPDATE: "update",
    DELETE: "delete",
    ADJUST_STOCK: "adjust_stock",
    VOID: "void",
    DOWNLOAD: "download",
    VIEW_REVENUE: "view_revenue",
    INVITE: "invite",
    UPDATE_ROLE: "update_role",
    REMOVE: "remove",
} as const;

// Role given to every self sign-up (they create and own their shop)
export const DEFAULT_SIGNUP_ROLE = "owner";

// Must match the resource-set conditions in the PAP
export const ABAC_RULES = {
    HIGH_DISCOUNT_PERCENT: 20, // high_discount_sale: max_discount > 20
    HIGH_VALUE_TOTAL_CENTS: 5_000_000, // high_value_sale: total > 5000000 (50,000.00)
    RECENT_SALE_HOURS: 24, // recent_sale: age_hours <= 24
} as const;

type CartLine = { c_discount?: number | string; c_subtotal?: number | string };

function parseCart(cartItems: unknown): CartLine[] {
    if (Array.isArray(cartItems)) return cartItems;
    if (typeof cartItems === "string") {
        try {
            const parsed = JSON.parse(cartItems);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
}

export function saleMaxDiscount(cartItems: unknown): number {
    return Math.max(0, ...parseCart(cartItems).map((i) => Number(i.c_discount) || 0));
}

export function saleTotal(cartItems: unknown): number {
    return parseCart(cartItems).reduce((sum, i) => sum + (Number(i.c_subtotal) || 0), 0);
}

/** Resource key to check when creating a sale. */
export function saleCreateResource(cartItems: unknown): string {
    return saleMaxDiscount(cartItems) > ABAC_RULES.HIGH_DISCOUNT_PERCENT
        ? RESOURCES.HIGH_DISCOUNT_SALE
        : RESOURCES.SALE;
}

/** Resource key to check when voiding a sale: high value → recent → plain sale. */
export function saleVoidResource(sale: { cartItems: unknown; createdAt: Date | string }): string {
    if (saleTotal(sale.cartItems) > ABAC_RULES.HIGH_VALUE_TOTAL_CENTS) return RESOURCES.HIGH_VALUE_SALE;
    const ageHours = (Date.now() - new Date(sale.createdAt).getTime()) / 3_600_000;
    if (ageHours <= ABAC_RULES.RECENT_SALE_HOURS) return RESOURCES.RECENT_SALE;
    return RESOURCES.SALE;
}

/** Resource key to check when deleting a product. */
export function productDeleteResource(product: { p_stock: number }): string {
    return product.p_stock > 0 ? RESOURCES.STOCKED_PRODUCT : RESOURCES.PRODUCT;
}

// Staff module — the shop creator is always the owner; these are the roles that can be invited
export const OWNER_ROLE = "owner";
export const INVITABLE_ROLES = ["manager", "cashier", "stock_keeper", "viewer"] as const;
export type InvitableRole = (typeof INVITABLE_ROLES)[number];
// Only the shop owner may give someone the manager role (PAP roles have no hierarchy)
export const OWNER_ONLY_ROLES: readonly string[] = ["manager"];

// ABAC user attribute keys (PAP attribute variables) and their allowed values
export const USER_ATTRIBUTES = {
    EXPERIENCE_YEARS: "experience_years",
    EMPLOYMENT_TYPE: "employment_type",
} as const;
export const EMPLOYMENT_TYPES = ["full_time", "part_time"] as const;

export const INVITATION_TTL_DAYS = 7;

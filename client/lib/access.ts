// Resource / action keys registered in MStrategy Access Control (PAP application "Inventory Shop").
// Twin of server/src/constants/access.ts — keep both in sync with the PAP policy editor.

export const RESOURCES = {
    SHOP: "shop",
    STAFF: "staff",
    PRODUCT: "product",
    SALE: "sale",
    INVOICE: "invoice",
    DASHBOARD: "dashboard",
    // ABAC resource sets — picked when the record matches the PAP condition
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

// Must match the resource-set conditions in the PAP
export const ABAC_RULES = {
    HIGH_DISCOUNT_PERCENT: 20,
    HIGH_VALUE_TOTAL_CENTS: 5_000_000,
    RECENT_SALE_HOURS: 24,
} as const;

type CartLine = { c_discount?: number | string; c_subtotal?: number | string };

export function saleTotal(cartItems: CartLine[] = []): number {
    return cartItems.reduce((sum, i) => sum + (Number(i.c_subtotal) || 0), 0);
}

/** Resource key the backend checks when voiding this sale. */
export function saleVoidResource(sale: { cartItems: CartLine[]; createdAt?: string }): string {
    if (saleTotal(sale.cartItems) > ABAC_RULES.HIGH_VALUE_TOTAL_CENTS) return RESOURCES.HIGH_VALUE_SALE;
    const ageHours = (Date.now() - new Date(sale.createdAt || 0).getTime()) / 3_600_000;
    if (ageHours <= ABAC_RULES.RECENT_SALE_HOURS) return RESOURCES.RECENT_SALE;
    return RESOURCES.SALE;
}

/** Resource key the backend checks when deleting this product. */
export function productDeleteResource(product: { p_stock: number }): string {
    return product.p_stock > 0 ? RESOURCES.STOCKED_PRODUCT : RESOURCES.PRODUCT;
}

// Staff module — twin of the server's INVITABLE_ROLES / OWNER_ONLY_ROLES
export const OWNER_ROLE = "owner";
export const INVITABLE_ROLES = ["manager", "cashier", "stock_keeper", "viewer"] as const;
export const OWNER_ONLY_ROLES: readonly string[] = ["manager"];

export const ROLE_LABELS: Record<string, string> = {
    owner: "Owner",
    manager: "Manager",
    cashier: "Cashier",
    stock_keeper: "Stock Keeper",
    viewer: "Viewer",
};

export const ROLE_DESCRIPTIONS: Record<string, string> = {
    manager: "Runs the shop: products, sales, voids and the staff list.",
    cashier: "Uses the POS register and prints invoices.",
    stock_keeper: "Adds products and updates stock. Can't sell.",
    viewer: "Read-only access, including revenue.",
};

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
    full_time: "Full time",
    part_time: "Part time",
};

export function roleLabel(role?: string | null) {
    return role ? ROLE_LABELS[role] || role : "—";
}

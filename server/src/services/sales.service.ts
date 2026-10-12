import prisma from "../lib/db.js";
import { NotFoundError } from "../types/app-error.js";
import { escapeLikeBrackets } from "../utils/sql-like.js";
import type { CreateSaleInput } from "../validators/sales.validator.js";

export interface GetSalesOptions {
    page?: number;
    limit?: number;
    search?: string;
}

// SQL Server stores `cartItems` as a JSON string (NVARCHAR(MAX)); expose it as an array like the old Json column.
export function parseSale<T extends { cartItems: string }>(sale: T) {
    let cartItems: unknown[] = [];
    try {
        const parsed = JSON.parse(sale.cartItems);
        if (Array.isArray(parsed)) cartItems = parsed;
    } catch (error) {
        console.error("Failed to parse cartItems for sale:", error);
    }
    return { ...sale, cartItems };
}

export async function getSalesByShop(shopId: string, options: GetSalesOptions = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 25));
    const skip = (page - 1) * limit;

    const where: any = { shopId };

    if (options.search && options.search.trim() !== "") {
        const searchTerm = escapeLikeBrackets(options.search.trim());
        // SQL Server has no `mode: "insensitive"`; the *_CI_* database collation makes LIKE case-insensitive.
        where.OR = [
            { cust_name: { contains: searchTerm } },
            { cust_email: { contains: searchTerm } },
            { cust_contact: { contains: searchTerm } },
        ];
    }

    const [totalItems, sales] = await prisma.$transaction([
        prisma.sale.count({ where }),
        prisma.sale.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
        sales: sales.map(parseSale),
        pagination: {
            page,
            limit,
            totalItems,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
    };
}

export async function createSale(shopId: string, userId: string, input: CreateSaleInput) {
    const sale = await prisma.sale.create({
        data: {
            shopId,
            userId,
            cust_name: input.cust_name,
            cust_email: input.cust_email,
            cust_contact: input.cust_contact,
            cartItems: JSON.stringify(input.cartItems),
        },
    });

    // Update product stock for each item in cart, strictly scoped to shopId
    for (const item of input.cartItems) {
        try {
            await prisma.product.updateMany({
                where: {
                    id: item.c_id,
                    shopId,
                },
                data: {
                    p_stock: {
                        decrement: item.c_quantity,
                    },
                },
            });
        } catch (error) {
            console.error(`Failed to update stock for product ${item.c_id} in shop ${shopId}:`, error);
        }
    }

    return parseSale(sale);
}

export async function deleteSale(shopId: string, salesId: string) {
    const sale = await prisma.sale.findFirst({
        where: { id: salesId, shopId },
    });

    if (!sale) {
        throw new NotFoundError("Sale not found or access denied");
    }

    return parseSale(
        await prisma.sale.delete({
            where: { id: salesId },
        }),
    );
}

import { Router, type Request } from "express";
import prisma from "../lib/db.js";
import { requireAuth } from "../middleware/require-auth.middleware.js";
import { requireShop } from "../middleware/require-shop.middleware.js";
import { requireAccessControl, requireDynamicAccessControl } from "../middleware/access-control.middleware.js";
import { ACTIONS, RESOURCES, saleCreateResource, saleVoidResource } from "../constants/access.js";
import {
    getSales,
    createSale,
    deleteSale,
} from "../controllers/sales.controller.js";

export const salesRoutes = Router();

// Protect all sales routes with auth & shop isolation middleware
salesRoutes.use(requireAuth);
salesRoutes.use(requireShop);

// Discounts above the limit fall into the high_discount_sale resource set
async function saleCreatePairs(req: Request) {
    return [{ resource: saleCreateResource(req.body?.cartItems), action: ACTIONS.CREATE }];
}

// Voiding picks high_value_sale, recent_sale or plain sale depending on the sale
async function saleVoidPairs(req: Request) {
    const id = String(req.params.id || req.body?.salesId || "");
    const sale = id ? await prisma.sale.findFirst({ where: { id, shopId: req.shopId! } }) : null;
    if (!sale) return null;
    return [{ resource: saleVoidResource(sale), action: ACTIONS.VOID }];
}

salesRoutes.get("/", requireAccessControl(RESOURCES.SALE, ACTIONS.VIEW), getSales);
salesRoutes.post("/", requireDynamicAccessControl(saleCreatePairs), createSale);
salesRoutes.delete("/:id", requireDynamicAccessControl(saleVoidPairs), deleteSale);

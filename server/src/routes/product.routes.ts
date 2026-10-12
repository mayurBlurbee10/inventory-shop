import { Router, type Request } from "express";
import prisma from "../lib/db.js";
import { requireAuth } from "../middleware/require-auth.middleware.js";
import { requireShop } from "../middleware/require-shop.middleware.js";
import { requireAccessControl, requireDynamicAccessControl } from "../middleware/access-control.middleware.js";
import { ACTIONS, RESOURCES, productDeleteResource } from "../constants/access.js";
import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
} from "../controllers/product.controller.js";

export const productRoutes = Router();

// Protect all product routes with auth & shop isolation middleware
productRoutes.use(requireAuth);
productRoutes.use(requireShop);

function findShopProduct(req: Request) {
    const id = String(req.params.id || req.body?.productId || "");
    return id ? prisma.product.findFirst({ where: { id, shopId: req.shopId! } }) : null;
}

// Changing name/price/thumbnail needs product.update; changing stock needs product.adjust_stock
async function productUpdatePairs(req: Request) {
    const product = await findShopProduct(req);
    if (!product) return null;
    const data = req.body?.newdata || req.body || {};
    const pairs = [];
    const detailsChanged =
        (data.p_name !== undefined && data.p_name !== product.p_name) ||
        (data.p_price !== undefined && Number(data.p_price) !== product.p_price) ||
        (data.p_thumbnail !== undefined && data.p_thumbnail !== product.p_thumbnail);
    if (detailsChanged) pairs.push({ resource: RESOURCES.PRODUCT, action: ACTIONS.UPDATE });
    if (data.p_stock !== undefined && Number(data.p_stock) !== product.p_stock) {
        pairs.push({ resource: RESOURCES.PRODUCT, action: ACTIONS.ADJUST_STOCK });
    }
    return pairs;
}

// Products that still have stock fall into the stocked_product resource set
async function productDeletePairs(req: Request) {
    const product = await findShopProduct(req);
    if (!product) return null;
    return [{ resource: productDeleteResource(product), action: ACTIONS.DELETE }];
}

productRoutes.get("/", requireAccessControl(RESOURCES.PRODUCT, ACTIONS.VIEW), getProducts);
productRoutes.post("/", requireAccessControl(RESOURCES.PRODUCT, ACTIONS.CREATE), createProduct);
productRoutes.put("/:id", requireDynamicAccessControl(productUpdatePairs), updateProduct);
productRoutes.delete("/:id", requireDynamicAccessControl(productDeletePairs), deleteProduct);

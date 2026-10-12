import type { Express } from "express";
import { accessRoutes } from "./access.routes.js";
import { productRoutes } from "./product.routes.js";
import { salesRoutes } from "./sales.routes.js";
import shopRoutes from "./shop.routes.js";
import { staffRoutes } from "./staff.routes.js";
import { userRoutes } from "./user.routes.js";

export function registerRoutes(app: Express): void {
    app.use("/api/access", accessRoutes);
    app.use("/api/shops", shopRoutes);
    app.use("/api/staff", staffRoutes);
    app.use("/api/products", productRoutes);
    app.use("/api/sales", salesRoutes);
    app.use("/api/user", userRoutes);
}

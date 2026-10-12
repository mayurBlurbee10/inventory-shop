import { Router } from "express";
import { shopController } from "../controllers/shop.controller.js";
import { requireAuth } from "../middleware/require-auth.middleware.js";
import { requireAccessControl } from "../middleware/access-control.middleware.js";
import { ACTIONS, RESOURCES } from "../constants/access.js";

const router = Router();

router.use(requireAuth);

router.post("/onboarding", requireAccessControl(RESOURCES.SHOP, ACTIONS.CREATE), (req, res, next) => shopController.createShop(req, res, next));
router.get("/my-shops", requireAccessControl(RESOURCES.SHOP, ACTIONS.VIEW), (req, res, next) => shopController.getUserShops(req, res, next));
router.get("/:id", requireAccessControl(RESOURCES.SHOP, ACTIONS.VIEW), (req, res, next) => shopController.getShopById(req, res, next));
router.put("/:id", requireAccessControl(RESOURCES.SHOP, ACTIONS.UPDATE), (req, res, next) => shopController.updateShop(req, res, next));

export default router;

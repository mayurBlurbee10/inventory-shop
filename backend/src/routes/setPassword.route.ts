import express from "express";
import setPasswordController from "../controllers/setPassword.controller.ts";

const router = express.Router();

router.get("/", setPasswordController.getSetPassword);
router.post("/", setPasswordController.postSetPassword);

export default router;

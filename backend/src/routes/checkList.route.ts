import express from "express";
import checkListController from "../controllers/checkList.controller.ts";

const router = express.Router();

router.post("/", checkListController.createCheckList);
router.get("/", checkListController.getCheckLists);
router.put("/", checkListController.updateCheckList);
router.delete("/", checkListController.deleteCheckList);

export default router;


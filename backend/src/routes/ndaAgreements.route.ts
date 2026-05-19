import express from "express";
import ndaAgreementsController from "../controllers/ndaAgreements.controller.ts";

const router = express.Router();

router.get("/", ndaAgreementsController.getNdaAgreements);
router.post("/", ndaAgreementsController.createNdaAgreement);
router.put("/", ndaAgreementsController.updateNdaAgreement);
router.delete("/", ndaAgreementsController.deleteNdaAgreement);
router.post("/copy", ndaAgreementsController.copyNdaAgreement);
router.put("/default", ndaAgreementsController.setDefaultNdaAgreement);

export default router;

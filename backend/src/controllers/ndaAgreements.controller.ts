import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import ndaAgreementService from "../services/ndaAgreement.service.ts";
import { asyncHandler } from "../utils/helper.ts";

const isEmptyHtml = (html?: string | null) =>
  !html ||
  html.trim() === "" ||
  html.trim() === "<p></p>" ||
  html.trim() === "<p><br></p>";

const getNdaAgreements = asyncHandler(async (req: Request, res: Response) => {
  await logApiCall(req);
  const portalId = req.query.portalId as string;
  const hasPageParam = Object.prototype.hasOwnProperty.call(req.query, "page");
  const hasLimitParam = Object.prototype.hasOwnProperty.call(req.query, "limit");
  const usePagination = hasPageParam || hasLimitParam;

  if (!portalId) {
    return res.status(400).json({ error: "portalId is required" });
  }

  try {
    if (!usePagination) {
      const data = await ndaAgreementService.listByPortalId(portalId);
      return res.status(200).json({
        message: "NDA agreements fetched successfully.",
        data,
      });
    }

    const pageParam = Number((req.query.page as string) || 1);
    const limitParam = Number((req.query.limit as string) || 10);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(limitParam, 100)
        : 10;

    const result = await ndaAgreementService.listByPortalIdPaginated(
      portalId,
      page,
      limit
    );
    return res.status(200).json({
      message: "NDA agreements fetched successfully.",
      data: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching NDA agreements:", (error as Error).message);
    return res.status(500).json({
      error: "Failed to fetch NDA agreements.",
      details: (error as Error).message,
    });
  }
});

const createNdaAgreement = asyncHandler(async (req: Request, res: Response) => {
  await logApiCall(req);
  const { portalId, title, ndaType, description, fileId, originalFileName } =
    req.body;

  if (!portalId || !title || !ndaType) {
    return res.status(400).json({ error: "portalId, title, and ndaType are required" });
  }

  if (ndaType !== "editor" && ndaType !== "esign") {
    return res.status(400).json({ error: 'ndaType must be "editor" or "esign"' });
  }

  if (ndaType === "editor" && isEmptyHtml(description)) {
    return res.status(400).json({ error: "description is required for NDA editor type" });
  }

  if (ndaType === "esign" && !fileId) {
    return res.status(400).json({ error: "fileId is required for e-sign type" });
  }

  try {
    const row = await ndaAgreementService.createAgreement({
      portalId,
      title,
      ndaType,
      description: ndaType === "editor" ? description : null,
      fileId: ndaType === "esign" ? fileId : null,
      originalFileName: ndaType === "esign" ? originalFileName || null : null,
      isDefault: false,
    });
    return res.status(200).json({
      message: "NDA agreement created successfully.",
      data: row,
    });
  } catch (error) {
    console.error("Error creating NDA agreement:", (error as Error).message);
    return res.status(500).json({
      error: "Failed to create NDA agreement.",
      details: (error as Error).message,
    });
  }
});

const updateNdaAgreement = asyncHandler(async (req: Request, res: Response) => {
  await logApiCall(req);
  const { id, title, ndaType, description, fileId, originalFileName } = req.body;

  if (!id || !title || !ndaType) {
    return res.status(400).json({ error: "id, title, and ndaType are required" });
  }

  if (ndaType === "editor" && isEmptyHtml(description)) {
    return res.status(400).json({ error: "description is required for NDA editor type" });
  }

  if (ndaType === "esign" && !fileId) {
    return res.status(400).json({ error: "fileId is required for e-sign type" });
  }

  try {
    const existing = await ndaAgreementService.getById(id);
    if (!existing) {
      return res.status(404).json({ error: "NDA agreement not found" });
    }

    const updated = await ndaAgreementService.updateAgreement(id, {
      title,
      ndaType,
      description: ndaType === "editor" ? description : null,
      fileId: ndaType === "esign" ? fileId : null,
      originalFileName: ndaType === "esign" ? originalFileName || null : null,
    });

    return res.status(200).json({
      message: "NDA agreement updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating NDA agreement:", (error as Error).message);
    return res.status(500).json({
      error: "Failed to update NDA agreement.",
      details: (error as Error).message,
    });
  }
});

const deleteNdaAgreement = asyncHandler(async (req: Request, res: Response) => {
  await logApiCall(req);
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "id is required" });
  }

  try {
    await ndaAgreementService.deleteAgreement(id);
    return res.status(200).json({ message: "NDA agreement deleted successfully." });
  } catch (error) {
    console.error("Error deleting NDA agreement:", (error as Error).message);
    return res.status(500).json({
      error: "Failed to delete NDA agreement.",
      details: (error as Error).message,
    });
  }
});

const copyNdaAgreement = asyncHandler(async (req: Request, res: Response) => {
  await logApiCall(req);

  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "id is required" });
  }

  try {
    const copied = await ndaAgreementService.copyAgreement(id);
    return res.status(200).json({
      message: "NDA copied successfully.",
      data: copied,
    });
  } catch (error) {
    console.error("Error copying NDA agreement:", (error as Error).message);
    return res.status(500).json({
      error: "Failed to copy NDA agreement.",
      details: (error as Error).message,
    });
  }
});

const setDefaultNdaAgreement = asyncHandler(async (req: Request, res: Response) => {
  await logApiCall(req);
  const { agreementId, portalId } = req.body;

  if (!agreementId || !portalId) {
    return res.status(400).json({ error: "agreementId and portalId are required" });
  }

  try {
    const updated = await ndaAgreementService.setDefaultAgreement(
      agreementId,
      portalId
    );
    return res.status(200).json({
      message: "Default NDA agreement updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error(
      "Error setting default NDA agreement:",
      (error as Error).message
    );
    return res.status(500).json({
      error: "Failed to set default NDA agreement.",
      details: (error as Error).message,
    });
  }
});

export default {
  getNdaAgreements,
  createNdaAgreement,
  updateNdaAgreement,
  deleteNdaAgreement,
  copyNdaAgreement,
  setDefaultNdaAgreement,
};

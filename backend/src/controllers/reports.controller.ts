import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import { asyncHandler } from "../utils/helper.ts";
import { UserRole } from "../config/constants.ts";
import {
  listReportFiles,
  uploadReportFile as uploadReportFileToBox,
  getReportData,
  REPORT_TYPES,
  type ReportType,
} from "../services/reports.service.ts";

const EXCEL_REGEX = /\.(xlsx|xls)$/i;

const isValidReportType = (value: string): value is ReportType =>
  Object.prototype.hasOwnProperty.call(REPORT_TYPES, value);

const isPortalAdmin = (req: Request) => {
  const user = (req as any).user;
  return (
    user &&
    user.role !== UserRole.USER &&
    user.role !== UserRole.MODERATOR
  );
};

const getReportFiles = asyncHandler(async (req: Request, res: Response) => {
  await logApiCall(req);

  const portalId = (req.query.portalId as string) || "";
  if (!portalId) {
    return res.status(400).json({ error: "portalId is required" });
  }

  const pageParam = Number(req.query.page || 1);
  const limitParam = Number(req.query.limit || 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const limit =
    Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(limitParam, 100)
      : 10;

  try {
    const result = await listReportFiles(portalId, page, limit);
    return res.status(200).json({
      message: "Report files fetched successfully.",
      items: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching report files:", (error as Error).message);
    return res.status(500).json({
      error: "Failed to fetch report files.",
      details: (error as Error).message,
    });
  }
});

const uploadReportFile = asyncHandler(async (req: Request, res: Response) => {
  await logApiCall(req);

  const files = ((req as any).files || []) as Express.Multer.File[];
  const portalId = (req.body.portalId as string) || "";
  const reportType = (req.body.reportType as string) || "";
  const email = (req.body.email as string) || "";

  if (!portalId) {
    return res.status(400).json({ error: "portalId is required" });
  }

  if (!isValidReportType(reportType)) {
    return res.status(400).json({
      error: 'reportType must be "holdings" or "sector_returns"',
    });
  }

  if (!files?.length) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const file = files[0];

  if (!EXCEL_REGEX.test(file.originalname)) {
    return res.status(400).json({
      error: "Only Excel files (.xlsx, .xls) are allowed.",
    });
  }

  try {
    const uploadedFile = await uploadReportFileToBox(
      portalId,
      reportType,
      file,
      email,
    );

    await logApiCall(
      req,
      () => {},
      "reports-file-upload",
      null,
      String((uploadedFile as any)?.id || ""),
      String((uploadedFile as any)?.name || ""),
    );

    return res.status(200).json({
      message: "File uploaded successfully.",
      file: uploadedFile,
    });
  } catch (error) {
    console.error("Error uploading report file:", (error as Error).message);
    return res.status(500).json({
      error: "Failed to upload report file.",
      details: (error as Error).message,
    });
  }
});

const getReportDataHandler = asyncHandler(async (req: Request, res: Response) => {
  await logApiCall(req);

  if (!isPortalAdmin(req)) {
    return res.status(403).json({ error: "Admin access required." });
  }

  const portalId = (req.query.portalId as string) || "";
  const reportType = (req.query.reportType as string) || "";

  if (!portalId) {
    return res.status(400).json({ error: "portalId is required" });
  }

  if (!isValidReportType(reportType)) {
    return res.status(400).json({
      error: 'reportType must be "holdings" or "sector_returns"',
    });
  }

  try {
    const result = await getReportData(portalId, reportType);
    return res.status(200).json({
      message: "Report data fetched successfully.",
      file: result.file,
      data: result.data,
      formatError: result.formatError || null,
    });
  } catch (error) {
    console.error("Error fetching report data:", (error as Error).message);
    return res.status(500).json({
      error: "Failed to fetch report data.",
      details: (error as Error).message,
    });
  }
});

export default {
  getReportFiles,
  uploadReportFile,
  getReportData: getReportDataHandler,
};

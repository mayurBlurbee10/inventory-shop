import { Request, NextFunction } from "express";
import apiLogService from "../services/apiLogs.service.ts";

export const logApiCall = async (
  req: Request,
  next?: NextFunction,
  type?: string | null,
  createdBy?: string | null,
  fileId?: string | null,
  fileSource?: string | null
): Promise<void> => {
  const userId = (createdBy || (req.headers["x-user-id"] as string)) as string;
  const portalId = req.headers["x-portal-id"] as string;
  const apiType = (type || (req.headers["x-api-type"] as string)) as string;
  const taskId = (req.headers["x-task-id"] as string) || null;
  const taskType = (req.headers["x-task-type"] as string) || null;

  const isGetMethod =
    req.method === "GET" &&
    apiType !== "file-edit" &&
    apiType !== "file-preview" &&
    apiType !== "download";
  if (
    !userId ||
    !apiType ||
    !portalId ||
    ["undefined", "null", ""].includes(userId) ||
    ["undefined", "null", ""].includes(apiType) ||
    ["undefined", "null", ""].includes(portalId) ||
    isGetMethod
  ) {
    if (typeof next === "function") {
      return next();
    }
    return;
  }

  // Truncate source to 255 characters to match database column limit
  const source = `${req.method} ${req.originalUrl}`;
  const truncatedSource =
    source.length > 255 ? source.substring(0, 255) : source;

  const logEntry: any = {
    portalId: portalId ?? null,
    type: apiType,
    source: truncatedSource,
    fileSource: fileSource ?? null,
    taskId: taskId && !["undefined", "null", ""].includes(taskId) ? taskId : null,
    taskType: taskType && !["undefined", "null", ""].includes(taskType) ? taskType : null,
    userId: userId ?? null,
  };

  try {
    await apiLogService.createApiLogs(logEntry);
  } catch (error) {
    console.error("Error logging API call:", error);
  }

  if (typeof next === "function") {
    return next();
  }
};
import "reflect-metadata";
import { connectDatabase, getConnection } from "../config/db.ts";
import { ApiLogs } from "../entities/ApiLogs.ts";
import { Between } from "typeorm";

const createApiLogFromRequest = async (req: any) => {
  const userId = req.headers["x-user-id"] as string;
  const portalId = req.headers["x-portal-id"] as string;
  const apiType = req.headers["x-api-type"] as string;
  const taskId = (req.headers["x-task-id"] as string) || null;
  const taskType = (req.headers["x-task-type"] as string) || null;

  const isGetMethod =
    req.method === "GET" &&
    apiType !== "file-edit" &&
    apiType !== "file-preview" &&
    apiType !== "file-download";

  if (
    !userId ||
    !apiType ||
    !portalId ||
    ["undefined", "null", ""].includes(userId) ||
    ["undefined", "null", ""].includes(apiType) ||
    ["undefined", "null", ""].includes(portalId) ||
    isGetMethod
  ) {
    return;
  }

  const source = `${req.method} ${req.originalUrl}`;
  const truncatedSource =
    source.length > 255 ? source.substring(0, 255) : source;

  await createApiLogs({
    portalId,
    userId,
    type: apiType,
    source: truncatedSource,
    taskId: taskId && !["undefined", "null", ""].includes(taskId) ? taskId : null,
    taskType:
      taskType && !["undefined", "null", ""].includes(taskType) ? taskType : null,
  });
};


const createApiLogs = async (data: any) => {
  await connectDatabase();
  const connection = getConnection();
  const apiLogRepository = connection.getRepository(ApiLogs);
  try {
    const logData: any = {
      createdBy: data.userId ?? null,
      portalId: data.portalId ?? null,
      type: data.type || "unknown",
      source: data.source ?? null,
      taskId: data.taskId ?? null,
      taskType: data.taskType ?? null,
    };
    const apiLog = apiLogRepository.create(logData);
    await apiLogRepository.save(apiLog);
    return apiLog;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to create API log: ${message}`);
  }
};

const getApiLogs = async (portalId: string, filterYear: number) => {
  await connectDatabase();
  const connection = getConnection();
  const apiLogRepository = connection.getRepository(ApiLogs);

  try {
    const currentDate = new Date();
    const startOfRange = new Date(filterYear, currentDate.getMonth() - 11, 1);
    const endOfRange = new Date(
      filterYear,
      currentDate.getMonth() + 1,   
      0,
      23,
      59,
      59
    );

    const apiLogs = await apiLogRepository.find({
      where: {
        portalId: portalId,
        createdAt: Between(startOfRange, endOfRange),
      },
      relations: ["createdBy"],
    });

    return apiLogs;
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

const getApiLogsDateWise = async (
  portalId: string,
  startDate?: Date,
  endDate?: Date,
  userId?: string
) => {
  await connectDatabase();
  const connection = getConnection();
  const apiLogRepository = connection.getRepository(ApiLogs);

  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const startOfRange = new Date(currentYear, currentDate.getMonth() - 11, 1);
    const endOfRange = new Date(
      currentYear,
      currentDate.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    let whereCondition: any = {
      portalId: portalId,
      createdAt: Between(startDate || startOfRange, endDate || endOfRange),
    };

    if (userId) {
      whereCondition.createdBy = { id: userId };
    }

    const apiLogs = await apiLogRepository.find({
      where: whereCondition,
      relations: ["createdBy"],
    });

    return apiLogs;
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

export default {
  createApiLogFromRequest,
  createApiLogs,
  getApiLogs,
  getApiLogsDateWise,
};


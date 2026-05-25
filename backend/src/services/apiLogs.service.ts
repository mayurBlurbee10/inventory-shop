import "reflect-metadata";
import { ILike, Brackets } from "typeorm";
import { connectDatabase, getConnection } from "../config/db.ts";
import { ApiLogs } from "../entities/ApiLogs.ts";
import { Between } from "typeorm";
import { getBoxClient } from "../utils/boxClient.ts";

const client = getBoxClient();

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
  userId?: string | null,
  limit: number = 500,
  offset: number = 0,
  search?: string,
  sortBy: string = "createdAt",
  sortOrder: string = "DESC"
) => {
  await connectDatabase();
  const connection = getConnection();
  const apiLogRepository = connection.getRepository(ApiLogs);
  try {
    const query = apiLogRepository.createQueryBuilder("apiLog")
      .leftJoinAndSelect("apiLog.createdBy", "user")
      .where("apiLog.portalId = :portalId", { portalId });

    if (startDate && endDate) {
      query.andWhere("apiLog.createdAt BETWEEN :startDate AND :endDate", { startDate, endDate });
    }

    if (userId) {
      query.andWhere("user.id = :userId", { userId });
    }

    if (search) {
      query.andWhere(new Brackets(qb => {
        qb.where("apiLog.type LIKE :search", { search: `%${search}%` })
          .orWhere("user.firstName LIKE :search", { search: `%${search}%` })
          .orWhere("user.lastName LIKE :search", { search: `%${search}%` })
          .orWhere("apiLog.source LIKE :search", { search: `%${search}%` });
      }));
    }

    // Sorting
    let orderKey = "apiLog." + sortBy;
    if (sortBy === "user") {
      orderKey = "user.firstName";
    }
    query.orderBy(orderKey, sortOrder.toUpperCase() as "ASC" | "DESC");

    const apiLogs = await query.take(limit).skip(offset).getMany();

    // Resolve Box source objects similar to frontend
    const apiLogsWithSource = await Promise.all(
      apiLogs.map(async (apiLog: any) => {
        if (apiLog?.source) {
          try {
            if (apiLog?.type?.includes("file")) {
              const file = await client.files.getFileById(apiLog?.source);
              return { ...apiLog, source: file };
            } else {
              const folder = await client.folders.getFolderById(apiLog?.source);
              return { ...apiLog, source: folder };
            }
          } catch (err: any) {
            console.warn(
              `Failed to fetch ${apiLog?.type} with ID ${apiLog?.source}: ${err.message}`
            );
            return { ...apiLog, source: null };
          }
        }
        return apiLog;
      })
    );

    return apiLogsWithSource;
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

// Count logs for pagination with optional filters
const getApiLogsCount = async (
  portalId: string,
  startDate?: Date,
  endDate?: Date,
  userId?: string | null,
  search?: string
) => {
  await connectDatabase();
  const connection = getConnection();
  const apiLogRepository = connection.getRepository(ApiLogs);
  try {
    const query = apiLogRepository.createQueryBuilder("apiLog")
      .leftJoinAndSelect("apiLog.createdBy", "user")
      .where("apiLog.portalId = :portalId", { portalId });

    if (startDate && endDate) {
      query.andWhere("apiLog.createdAt BETWEEN :startDate AND :endDate", { startDate, endDate });
    }

    if (userId) {
      query.andWhere("user.id = :userId", { userId });
    }

    if (search) {
      query.andWhere(new Brackets(qb => {
        qb.where("apiLog.type LIKE :search", { search: `%${search}%` })
          .orWhere("user.firstName LIKE :search", { search: `%${search}%` })
          .orWhere("user.lastName LIKE :search", { search: `%${search}%` })
          .orWhere("apiLog.source LIKE :search", { search: `%${search}%` });
      }));
    }

    const count = await query.getCount();
    return count;
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

export default {
  createApiLogFromRequest,
  createApiLogs,
  getApiLogs,
  getApiLogsDateWise,
  getApiLogsCount,
};


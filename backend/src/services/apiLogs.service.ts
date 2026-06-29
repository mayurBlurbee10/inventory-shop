import "reflect-metadata";
import { ILike, Brackets } from "typeorm";
import { connectDatabase, getConnection } from "../config/db.ts";
import { ApiLogs } from "../entities/ApiLogs.ts";
import { Between } from "typeorm";
import { getBoxClient } from "../utils/boxClient.ts";

const client = getBoxClient();

const truncateLogValue = (value?: string | null) => {
  if (!value) {
    return null;
  }
  return value.length > 255 ? value.substring(0, 255) : value;
};

const applyApiLogSearch = (query: any, search?: string, searchField = "all") => {
  if (!search) {
    return;
  }

  const normalizedSearchField = ["fileSource", "user", "email"].includes(searchField)
    ? searchField
    : "all";
  const searchParam = { search: `%${search}%` };

  query.andWhere(new Brackets((qb) => {
    if (normalizedSearchField === "fileSource") {
      qb.where("apiLog.fileSource LIKE :search", searchParam);
      return;
    }

    if (normalizedSearchField === "user") {
      qb.where("user.firstName LIKE :search", searchParam)
        .orWhere("user.lastName LIKE :search", searchParam);
      return;
    }

    if (normalizedSearchField === "email") {
      qb.where("user.email LIKE :search", searchParam);
      return;
    }

    qb.where("apiLog.type LIKE :search", searchParam)
      .orWhere("apiLog.source LIKE :search", searchParam)
      .orWhere("apiLog.fileSource LIKE :search", searchParam)
      .orWhere("user.firstName LIKE :search", searchParam)
      .orWhere("user.lastName LIKE :search", searchParam)
      .orWhere("user.email LIKE :search", searchParam);
  }));
};

const getApiLogOrderKey = (sortBy?: string) => {
  const sortColumns: Record<string, string> = {
    createdAt: "apiLog.createdAt",
    type: "apiLog.type",
    source: "apiLog.source",
    fileSource: "apiLog.fileSource",
    user: "user.firstName",
    email: "user.email",
  };

  return sortBy ? sortColumns[sortBy] : null;
};

const createApiLogFromRequest = async (req: any) => {
  const userId = req.headers["x-user-id"] as string;
  const portalId = req.headers["x-portal-id"] as string;
  const apiType = req.headers["x-api-type"] as string;
  const taskId = (req.headers["x-task-id"] as string) || null;
  const taskType = (req.headers["x-task-type"] as string) || null;
  const fileSource = (req.headers["x-file-source"] as string) || null;

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

  const source = truncateLogValue(`${req.method} ${req.originalUrl}`);

  await createApiLogs({
    portalId,
    userId,
    type: apiType,
    source,
    fileSource: truncateLogValue(fileSource),
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
      fileSource: data.fileSource ?? null,
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
  sortBy?: string,
  sortOrder?: string,
  searchField: string = "all"
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

    applyApiLogSearch(query, search, searchField);

    const orderKey = getApiLogOrderKey(sortBy);
    if (orderKey && sortOrder) {
      query.orderBy(orderKey, sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC");
    }

    const apiLogs = await query.take(limit).skip(offset).getMany();

    return apiLogs;
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
  search?: string,
  searchField: string = "all"
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

    applyApiLogSearch(query, search, searchField);

    const count = await query.getCount();
    return count;
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

const getApiLogsForExport = async (
  portalId: string,
  startDate?: Date,
  endDate?: Date,
  userId?: string | null,
  search?: string,
  sortBy?: string,
  sortOrder?: string,
  searchField: string = "all"
) => {
  await connectDatabase();
  const connection = getConnection();
  const apiLogRepository = connection.getRepository(ApiLogs);
  try {
    const query = apiLogRepository
      .createQueryBuilder("apiLog")
      .leftJoinAndSelect("apiLog.createdBy", "user")
      .where("apiLog.portalId = :portalId", { portalId });

    if (startDate && endDate) {
      query.andWhere("apiLog.createdAt BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      });
    }

    if (userId) {
      query.andWhere("user.id = :userId", { userId });
    }

    applyApiLogSearch(query, search, searchField);

    const orderKey = getApiLogOrderKey(sortBy);
    if (orderKey && sortOrder) {
      query.orderBy(orderKey, sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC");
    }

    return await query.getMany();
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
  getApiLogsForExport,
};


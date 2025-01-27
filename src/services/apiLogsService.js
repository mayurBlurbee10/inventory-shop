import "reflect-metadata";
import { connectDatabase, getConnection } from "@/config/db";
import { ApiLogs } from "@/entities/ApiLogs";
import { Between } from "typeorm";

const createApiLogs = async (data) => {
  await connectDatabase();
  const connection = getConnection();
  const apiLogRepository = connection.getRepository(ApiLogs);
  try {
    const apiLog = apiLogRepository.create(data);
    await apiLogRepository.save(apiLog);
    return apiLog;
  } catch (error) {
    throw new Error("Failed to create API log.");
  }
};

const getApiLogs = async (portalName, filterYear) => {
  await connectDatabase();
  const connection = getConnection();
  const apiLogRepository = connection.getRepository(ApiLogs);

  try {
    const startOfYear = new Date(`${filterYear}-01-01T00:00:00Z`);
    const endOfYear = new Date(`${filterYear}-12-31T23:59:59Z`);

    const apiLogs = await apiLogRepository.find({
      where: {
        name: portalName,
        createdAt: Between(startOfYear, endOfYear),
      },
    });

    return apiLogs;
  } catch (error) {
    // throw new Error("Failed to get API log.");
    throw new Error(error.message);
  }
};

export default {
  createApiLogs,
  getApiLogs,
};

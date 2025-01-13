import "reflect-metadata";
import { connectDatabase, getConnection } from "@/config/db";
import { ApiLogs } from "@/entities/ApiLogs";

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

const getApiLogs = async () => {
  await connectDatabase();
  const connection = getConnection();
  const apiLogRepository = connection.getRepository(ApiLogs);
  try {
    const apiLog = apiLogRepository.find();
    return apiLog;
  } catch (error) {
    throw new Error("Failed to get API log.");
  }
};

export default {
  createApiLogs,
  getApiLogs
};

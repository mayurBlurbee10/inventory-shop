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
        name: portalName,
        createdAt: Between(startOfRange, endOfRange),
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

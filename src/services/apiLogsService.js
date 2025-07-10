import "reflect-metadata";
import { connectDatabase, getConnection } from "@/config/db";
import { ApiLogs } from "@/entities/ApiLogs";
import { Between } from "typeorm";
import userService from "./userService";
import BoxSDK from "box-node-sdk";

const sdk = new BoxSDK({
  clientID: process.env.BOX_CLIENT_ID,
  clientSecret: process.env.BOX_CLIENT_SECRET,
  appAuth: {
    keyID: process.env.BOX_PUBLIC_KEY_ID,
    privateKey: process.env.BOX_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    passphrase: process.env.BOX_PASSPHRASE,
    enterpriseID: process.env.BOX_ENTERPRISE_ID,
  },
});

const client = sdk.getAppAuthClient(
  "enterprise",
  process.env.BOX_ENTERPRISE_ID
);

const getRepository = async (entity) => {
  await connectDatabase();
  const connection = getConnection();
  return connection.getRepository(entity);
};

const createApiLogs = async (data) => {
  const apiLogRepository = await getRepository(ApiLogs);
  try {
    const apiLog = apiLogRepository.create(data);
    await apiLogRepository.save(apiLog);
    return apiLog;
  } catch (error) {
    throw new Error(error || "Failed to create API log.");
  }
};

const getApiLogs = async (portalName, filterYear) => {
 const apiLogRepository = await getRepository(ApiLogs);
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
        portalId: portalName,
        createdAt: Between(startOfRange, endOfRange),
      },
    });

    return apiLogs;
  } catch (error) {
    // throw new Error("Failed to get API log.");
    throw new Error(error.message);
  }
};

const getApiLogsDateWise = async (portalName, startDate, endDate, userId) => {
 const apiLogRepository = await getRepository(ApiLogs);
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

    let whereCondition = {
      portalId: portalName,
      createdAt: Between(startDate || startOfRange, endDate || endOfRange),
    };

    if (userId) {
      whereCondition.createdBy = { id: userId };
    }

    const apiLogs = await apiLogRepository.find({
      where: whereCondition,
      relations: ["createdBy"],
    });

    //  const apiLogsWithUser = await Promise.all(
    //    apiLogs.map(async (apiLog) => {
    //      const user = await userService.getUserById(apiLog?.userId);

    //      return { ...apiLog, user: user };
    //    })
    //  );

    const apiLogsWithSource = await Promise.all(
      apiLogs.map(async (apiLog) => {
        if (apiLog?.source) {
          try {
            if (apiLog?.type.includes("file")) {
              const file = await client.files.get(apiLog?.source);
              return { ...apiLog, source: file };
            } else {
              const folder = await client.folders.get(apiLog?.source);
              return { ...apiLog, source: folder };
            }
          } catch (err) {
            console.warn(
              `Failed to fetch ${apiLog?.type} with ID ${apiLog?.source}: ${err.message}`
            );
            return { ...apiLog, source: null };
          }
        } else {
          return apiLog;
        }
      })
    );

    return apiLogsWithSource;
  } catch (error) {
    throw new Error(error.message);
  }
};

const getApiLogsByUserId = async (userId) => {
 const apiLogRepository = await getRepository(ApiLogs);
  try {
    const apiLogs = await apiLogRepository.find({
      where: {
        createdBy: { id : userId }
      },
      relations: ["createdBy"],
    });

    const apiLogsWithSource = await Promise.all(
      apiLogs.map(async (apiLog) => {
        if (apiLog?.source) {
          if (apiLog?.type.includes("file")) {
            const file = await client.files.get(apiLog?.source);
            return { ...apiLog, source: file };
          } else {
            const folder = await client.folders.get(apiLog?.source);
            return { ...apiLog, source: folder };
          }
        } else {
          return apiLog;
        }
      })
    );

    return apiLogsWithSource;
  } catch (error) {
    throw new Error(error.message);
  }
};


const getApiLogsByType = async (portalId, type, userId) => {
 const apiLogRepository = await getRepository(ApiLogs);
  try {
    const now = new Date();
    let startDate, endDate;

    if (type === 'Day') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (type === 'Month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); // last day of month
    } else {
      // Default to Year
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    }

    const whereCondition = {
      portalId: portalId,
      createdAt: Between(startDate, endDate),
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
    throw new Error(error.message);
  }
};


export default {
  createApiLogs,
  getApiLogs,
  getApiLogsDateWise,
  getApiLogsByUserId,
  getApiLogsByType,
};
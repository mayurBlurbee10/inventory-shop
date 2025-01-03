import "reflect-metadata";
import { connectDatabase, getConnection } from "@/config/db";
import { ApiLogs } from "@/entities/ApiLogs";

const createApiLogs = async () => {
  await connectDatabase();
  const connection = getConnection();
  const apiLogRepository = connection.getRepository(ApiLogs);
  try {
    // const apiLog = apiLogRepository.delete({id : "36D43314-17C8-EF11-88CF-000D3AFB9C58"});
    const apiLog = apiLogRepository.find();
    // apiLog.company = { name: "crowley", logo: "/uploads/logo.png" };
    // apiLog.boxUsersFiles = [
    //   { id: "123456", name: "test", children: [] },
    //   {
    //     id: "445624",
    //     name: "demo",
    //     children: [{ id: "123456", name: "test", children: [] }],
    //   },
    // ];
    // await apiLogRepository.save(apiLog);
    return apiLog;
  } catch (error) {
    throw new Error("Failed to create API log.");
  }
};

// const getApiLogs = async (data) => {
//   await connectDatabase();
//   const connection = getConnection();
//   const apiLogRepository = connection.getRepository(ApiLog);
//   try {
//     const apiLog = apiLogRepository.find();
//     return apiLog;
//   } catch (error) {
//     throw new Error("Failed to create API log.");
//   }
// };

export default {
  createApiLogs,
};

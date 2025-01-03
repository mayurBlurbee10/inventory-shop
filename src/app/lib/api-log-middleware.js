import path from "path";
import { promises as fs } from "fs";
import apiLogService from "../../services/apiLogsService";

const dir = path.join(process.cwd(), "src", "app", "data");
const filePath = path.join(process.cwd(), "src", "app", "data", "api-log.json");

export async function ensureDirectory(directory) {
  try {
    await fs.access(directory);
    console.log("Directory exists:", directory);
  } catch {
    console.log("Creating directory:", directory);
    await fs.mkdir(directory, { recursive: true });
  }
}

export async function readJsonFile(filePath) {
  try {
    console.log("Reading users from:", filePath);
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.log("Error reading users file (or file not found):", error.message);
    return [];
  }
}

export async function writeJsonFile(parentPath, path, data) {
  try {
    await ensureDirectory(parentPath);
    await fs.writeFile(path, JSON.stringify(data, null, 2));
    console.log("Successfully wrote data to file");
  } catch (error) {
    console.error("Error writing data to file:", error);
    throw error;
  }
}

const formatDate = (date) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}-${day}-${year}`;
};

export const logApiCall = async (req, next) => {
  await ensureDirectory(dir);

  const data = await readJsonFile(filePath);

  const userId = req.headers.get("x-user-id");
  const portalId = req.headers.get("x-portal-id");
  const apiType = req.headers.get("x-api-type");

  if (!userId || !portalId || !apiType) {
    console.log("Missing required headers. Skipping logging.");
    if (typeof next === "function") {
      return next();
    }
    return;
  }

  const now = new Date();
  const logEntry = {
    date: formatDate(now),
    user: userId,
    portal: portalId,
    type: apiType,
  };

  data.push(logEntry);
  // const res = await apiLogService.createApiLogs(logEntry)
  const res = await apiLogService.createApiLogs();
  console.log("Response from api-log-middleware : ", res);
  // await writeJsonFile(dir, filePath, data);
  if (typeof next === "function") {
    next();
  }
};

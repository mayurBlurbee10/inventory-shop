import path from "path";
import { promises as fs } from "fs";
import apiLogService from "../../services/apiLogsService";
import userService from "@/services/userService";
import portalService from "@/services/portalService";
import apiLogsService from "../../services/apiLogsService";

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

function reverseSanitizeName(sanitizedName) {
  let reversedName = sanitizedName.endsWith("-")
    ? sanitizedName.slice(0, -1)
    : sanitizedName;

  reversedName = reversedName.replace(/-/g, " ");
  reversedName = reversedName
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return reversedName;
}

export const logApiCall = async (req, next, type = null, userId = null, fileId = null) => {
  await ensureDirectory(dir);
  // const data = await req.json();

  const isGetMethod =
    req.method === "GET" &&
    type !== "file-edit" &&
    type !== "file-preview" &&
    type !== "file-download";

  const XUserId = req.headers.get("x-user-id");
  const portalId = req.headers.get("x-portal-id");
  const apiType = req.headers.get("x-api-type");
  const user = userId ? userId : XUserId;

  console.log("User, PortalId, ApiType=============>", user, portalId, apiType);
  

  if (!user || !portalId || !apiType || ["undefined", "null", ""].includes(user) || ["undefined", "null", ""].includes(apiType) || ["undefined", "null", ""].includes(portalId) || isGetMethod) {
    console.log("Missing required headers. Skipping logging.");
    if (typeof next === "function") {
      return next();
    }
    return;
  }

  const userData = await userService.getUserById(user);
  const portalData = await portalService.getPortalByLegalName(reverseSanitizeName(portalId));

  const findPermission = userData?.userPermissions?.find((p) => p?.portalId === portalId);
  if (findPermission && findPermission?.apiLimit) {
    const ApiLimittype = findPermission?.apiLimit.per;

    const apiCallMonth = await apiLogsService.getApiLogsByType(portalId, ApiLimittype, userData.role === "user" ? userData.id : null);

    const sender = portalData?.portalCreatedAdmin;

    const limit = findPermission?.apiLimit?.limit;
    const step = Math.ceil(limit * 0.25); // 25% of limit
    const currentUsage = apiCallMonth.length;

    if (currentUsage >= limit) {
      const lastNotified = findPermission;
      const lastThreshold = lastNotified?.apiLimit?.threshold || 0;
      const currentThreshold = Math.floor(currentUsage / step) * step;

      if (currentThreshold > lastThreshold) {
        await apiLimitCrossEmail(
          sender.email,
          sender.name,
          userData.name,
          portalData.legalName,
          limit,
          findPermission.apiLimit.per,
          currentUsage - findPermission.apiLimit.limit
        );
        const updatedPermission = userData?.userPermissions?.map((item) =>
          item.portalId === portalId
            ? { ...item, apiLimit: { ...item?.apiLimit, threshold: currentThreshold, notifiedAt: new Date() } }
            : item
        );
        await userService.updateUser(user, {
          userPermissions: updatedPermission,
        });
      }
    }
  }

  const logEntry = {
    createdBy: user,
    portalId: portalId,
    type: type ? type : apiType,
    source: fileId
  };

  console.log("logEntry=================>", logEntry);
  

  // data.push(logEntry);
  const res = await apiLogService.createApiLogs(logEntry)
  // await writeJsonFile(dir, filePath, data);
  if (typeof next === "function") {
    next();
  }
};

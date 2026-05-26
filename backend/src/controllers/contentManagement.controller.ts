import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import contentManagementService from "../services/contentManagement.service.ts";
import { asyncHandler } from "../utils/helper.ts";
import path from "path";
import { promises as fs } from "fs";

const runtimeDataDir = process.env.CONTENT_DATA_DIR || path.join(process.cwd(), "data");
const legacyDataDir = path.join(process.cwd(), "src", "utils", "data");
const filePath = path.join(runtimeDataDir, "content-type.json");
const legacyFilePath = path.join(legacyDataDir, "content-type.json");

const ensureDirectory = async (directoryPath: string) => {
  await fs.mkdir(directoryPath, { recursive: true });
};

const readJsonFile = async (targetFilePath: string) => {
  try {
    const fileData = await fs.readFile(targetFilePath, "utf-8");
    return JSON.parse(fileData);
  } catch {
    return [];
  }
};

const createContentManagement = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const contentData = req.body;
    console.log("contentFromPOSTApi:", contentData);
    if (
      !contentData.title ||
      !contentData.type ||
      !contentData.value ||
      !contentData.portalId ||
      !contentData.fontSize
    ) {
      return res.status(400).json({
        error: "Missing required fields: title, type, value",
      });
    }

    const contentItems = await contentManagementService.getContentManagement(
      contentData.portalId
    );
    const existingIndex = contentItems.findIndex(
      (item: any) => item.title === contentData.title
    );
    if (existingIndex > -1) {
      await contentManagementService.removeOldEntry(contentItems[existingIndex]);
    }

    const contentUpdated =
      await contentManagementService.createContentManagement(contentData);
    return res.status(201).json(contentUpdated);
  } catch (error) {
    console.error("Error in POST /api/content:", error);
    return res.status(500).json({
      error: "Failed to save content item",
      details: (error as Error).message,
    });
  }
});

const getContentManagement = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { portalId } = req.query;
    const portal = (portalId || "root") as string;
    console.log("content portalId: ", portal);

    const contentItems = await contentManagementService.getContentManagement(portal);

    let defaultContentItems: any[] = [];
    if (portal != "default") {
      defaultContentItems =
        await contentManagementService.getContentManagement("default");
    }

    return res.status(200).json({
      portalContent: contentItems,
      defaultContent: defaultContentItems,
    });
  } catch (error) {
    console.error("Error in GET /api/content:", error);
    return res.status(500).json({
      error: "Failed to fetch content items",
      details: (error as Error).message,
    });
  }
});

const updateContentManagement = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const contentData = req.body;
    if (
      !contentData.id ||
      !contentData.title ||
      !contentData.type ||
      !contentData.portalId ||
      !contentData.fontSize ||
      (contentData.title !== "CoverPhoto" && !contentData.value)
    ) {
      return res.status(400).json({
        error: "Missing required fields: id, title, type, value, fontSize",
      });
    }

    const contentItem = await contentManagementService.getContentByTitle(
      contentData?.title,
      contentData.portalId
    );

    if (!contentItem) {
      return res.status(404).json({ error: "Content item not found" });
    }
    if (contentData.title === "CoverPhoto" && !contentData.value) {
      await contentManagementService.removeOldEntry(contentItem);
      return res.status(200).json({ message: "Content updated successfully." });
    } else {
      const contentUpdated = await contentManagementService.updateContentManagement({
        ...contentData,
        fontSize: contentData.fontSize,
      });
      return res.status(200).json(contentUpdated);
    }
  } catch (error) {
    console.error("Error in PUT /api/content:", error);
    return res.status(500).json({
      error: "Failed to update content item",
      details: (error as Error).message,
    });
  }
});

const deleteContentManagement = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const contentData = req.body;

    const contentItems = await contentManagementService.getContentManagement(
      contentData.portalId
    );
    const existingIndex = contentItems.findIndex(
      (item: any) => item.title === contentData.title
    );
    if (existingIndex > -1) {
      await contentManagementService.removeOldEntry(contentItems[existingIndex]);
    }

    return res.status(200).json({
      message: "Content removed successfully",
      data: contentItems,
    });
  } catch (error) {
    console.error("Error in DELETE /api/contentManagement:", error);
    return res.status(500).json({
      error: "Failed to delete content item",
      details: (error as Error).message,
    });
  }
});

const getContentTypes = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    await ensureDirectory(runtimeDataDir);

    // Keep backward compatibility with local source-tree JSON files.
    let contentTypes = await readJsonFile(filePath);
    if (contentTypes.length === 0 && runtimeDataDir !== legacyDataDir) {
      contentTypes = await readJsonFile(legacyFilePath);
    }

    return res.status(200).json(contentTypes);
  } catch (error) {
    console.error("Error in GET /api/content-type:", error);
    return res.status(500).json({
      error: "Failed to fetch content types",
      details: (error as Error).message,
    });
  }
});

const createContentType = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const contentTypeData = req.body;
    if (!contentTypeData.title || !contentTypeData.type) {
      return res.status(400).json({
        error: "Missing required fields: title, type",
      });
    }

    const contentTypes = (await contentManagementService.getContentManagement(
      contentTypeData.portalId
    )) as any[];
    console.log("ContentTypeData : ", contentTypeData);
    if (
      contentTypes.length !== 0 &&
      contentTypes.some((item: any) => item.title === contentTypeData.title)
    ) {
      return res.status(409).json({
        error: "Content type with the same title already exists",
      });
    }

    const newContentType = {
      title: contentTypeData.title,
      type: contentTypeData.type,
      portalId: contentTypeData.portalId,
    };

    contentTypes.push(newContentType);

    await contentManagementService.createContentManagement(newContentType);
    return res.status(201).json(newContentType);
  } catch (error) {
    console.error("Error in POST /api/content-type:", error);
    return res.status(500).json({
      error: "Failed to save content type",
      details: (error as Error).message,
    });
  }
});

export default {
  createContentManagement,
  getContentManagement,
  updateContentManagement,
  deleteContentManagement,
  getContentTypes,
  createContentType,
};


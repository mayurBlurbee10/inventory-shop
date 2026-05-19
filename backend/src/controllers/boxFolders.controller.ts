import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import { getBoxClient } from "../utils/box.ts";
import { asyncHandler } from "../utils/helper.ts";

const client = getBoxClient();

function isTrashedOrNotFoundError(error: unknown) {
  const err = error as any;
  const message =
    err?.response?.body?.message?.toLowerCase() ||
    err?.message?.toLowerCase() ||
    "";
  return (
    message.includes("trashed") ||
    err?.response?.body?.code === "item_not_found" ||
    err?.statusCode === 404 ||
    err?.response?.status === 404
  );
}

async function fetchCollaborators(itemId: string, type: string) {
  try {
    if (type === "folder") {
      const collaborations = await client.folders.getCollaborations(itemId);
      return collaborations.entries.map((collaboration: any) => ({
        id: collaboration.id,
        role: collaboration.role,
        user: collaboration.accessible_by,
        type: collaboration.type,
      }));
    } else {
      const collaborations = await client.files.getCollaborations(itemId);
      return collaborations.entries.map((collaboration: any) => ({
        id: collaboration.id,
        role: collaboration.role,
        user: collaboration.accessible_by,
        type: collaboration.type,
      }));
    }
  } catch (error) {
    console.error(
      `Error fetching collaborators for folder ${itemId}:`,
      (error as Error).message
    );
    return [];
  }
}

async function fetchNestedItems(folderId: string, limit: number = 100): Promise<any[]> {
  try {
    const folderItems = await client.folders.getItems(folderId, {
      fields:
        "id,name,type,shared_link,created_at,modified_at,collaborators,size",
      limit: limit,
    });

    const itemsWithCollaborators = await Promise.all(
      folderItems.entries.map(async (item: any) => {
        const collaborators =
          item.type === "folder"
            ? await fetchFolderCollaborators(item.id)
            : await fetchFileCollaborators(item.id);

        return {
          ...item,
          collaborators,
          children: item.type === "folder" ? await fetchNestedItems(item.id) : [],
        };
      })
    );

    return itemsWithCollaborators;
  } catch (error) {
    console.error(`Error fetching items for folder ${folderId}:`, error);
    return [];
  }
}

async function fetchFolderCollaborators(itemId: string) {
  try {
    const collaborations = await client.folders.getCollaborations(itemId);
    return collaborations.entries.map((collaboration: any) => {
      console.log("collaboration:", collaboration);
      return {
        id: collaboration.id,
        role: collaboration.role,
        user: collaboration.accessible_by,
      };
    });
  } catch (error) {
    console.error(
      `Error fetching collaborators for item ${itemId}:`,
      (error as Error).message
    );
    return [];
  }
}

async function fetchFileCollaborators(itemId: string) {
  try {
    const collaborations = await client.files.getCollaborations(itemId);
    return collaborations.entries.map((collaboration: any) => {
      console.log("collaboration:", collaboration);
      return {
        id: collaboration.id,
        role: collaboration.role,
        user: collaboration.accessible_by,
      };
    });
  } catch (error) {
    console.error(
      `Error fetching collaborators for item ${itemId}:`,
      (error as Error).message
    );
    return [];
  }
}

// POST /api/box/folders
const createFolder = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { name, boxFolderId } = req.body;

    // Create folder in the user's specific folder instead of root
    const userFolderId = boxFolderId;
    console.log("Creating folder in user folder:", userFolderId);

    const folder = await client.folders.create(userFolderId, name, {
      fields: ["id", "name", "path_collection", "created_at"],
    } as any);

    console.log("Created folder:", folder);

    // After creating the folder, let's verify it exists in the parent folder
    const parentFolder = await client.folders.getItems(userFolderId, {
      fields: "id,name,type",
    });

    console.log("Parent folder contents:", (parentFolder as any).entries);

    return res.status(200).json(folder);
  } catch (error) {
    console.error("Detailed error:", error);
    console.error("Error response:", (error as any).response?.body);
    return res.status(500).json({
      error: (error as any).response?.body?.message,
      details: (error as Error).message,
      response: (error as any).response?.body,
    });
  }
});

// GET /api/box/folders
const getFolders = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const folderId = (req.query.folderId as string) || "0";
    const collaboratedParam = (req.query.collaborated as string) ?? "[]";
    let collaborated: any[] = [];
    try {
      collaborated = JSON.parse(collaboratedParam);
    } catch {
      collaborated = [];
    }
    if (!Array.isArray(collaborated)) collaborated = [];
    const boxUserId = (req.query.boxUserId as string) || "";
    const limit = parseInt((req.query.limit as string) || "100", 10);
    const items: any[] = [];

    for (const element of collaborated) {
      try {
        const collaborators = await fetchCollaborators(
          element.folderId,
          element.type
        );

        const currentUserCollab = collaborators.find(
          (collab: any) =>
            collab?.item?.id === element?.folderId &&
            collab?.user?.id === boxUserId
        );

        const currentUserRole = currentUserCollab?.role || element.role;

        if (element.type === "folder") {
          const folder = await fetchNestedItems(element.folderId, limit);
          const folderDetails = await client.folders.get(element.folderId);
          items.push({
            ...folderDetails,
            children: folder,
            collaborators,
            currentUserRole: currentUserRole,
          });
        } else {
          const file = await client.files.get(element.folderId);
          items.push({
            ...file,
            collaborators,
            currentUserRole: currentUserRole,
          });
        }
      } catch (error) {
        if (isTrashedOrNotFoundError(error)) {
          console.warn(`Skipping trashed item: ${element.folderId}`);
          continue;
        }
        console.error(
          `Error processing element ${element.folderId}:`,
          (error as Error).message
        );
        throw error;
      }
    }

    const nestedItems = await fetchNestedItems(folderId, limit);
    return res.status(200).json({
      message: "Folder items fetched successfully",
      items: [...items, ...nestedItems],
    });
  } catch (error) {
    console.error("Error fetching folder items:", error);
    return res.status((error as any)?.response?.statusCode || 500).json({
      error: (error as Error).message,
    });
  }
});

const deleteFolderContents = async (folderId: string) => {
  const items = await client.folders.getItems(folderId, { fields: "id,type" });

  for (const item of items.entries as any[]) {
    if (item.type === "file") {
      await client.files.delete(item.id);
    } else if (item.type === "folder") {
      await client.folders.delete(item.id, { recursive: true });
    }
  }
};

const deleteFolderById = async (folderId: string, recursive = false) => {
  await client.folders.delete(folderId, { recursive: recursive });
};

// DELETE /api/box/folders
const deleteFolder = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req, () => {});
    const folderId = req.query.folderId as string;

    if (!folderId) {
      return res.status(400).json({ error: "No folderId provided" });
    }

    await deleteFolderById(folderId, false);

    return res.status(200).json({
      message: "Folder deleted successfully",
      folderId: folderId,
    });
  } catch (error) {
    console.error("Error deleting folder:", error);
    return res.status((error as any)?.response?.statusCode || 500).json({
      error: (error as any).response?.body?.message,
      details: (error as Error).message,
    });
  }
});

// POST /api/box/folders/:folderId/share
const shareFolder = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { folderId } = req.params;

    // Create a shared link for the folder
    const shared = await client.folders.update(folderId, {
      shared_link: {
        access: "open",
        permissions: {
          can_preview: true,
          can_download: true,
        } as any,
      },
    });

    return res.status(200).json({ shared_link: shared.shared_link });
  } catch (error) {
    console.error("Error sharing folder:", error);
    return res.status(500).json({
      error: "Failed to share folder",
    });
  }
});

export default {
  createFolder,
  getFolders,
  deleteFolder,
  shareFolder,
  deleteFolderContents,
  deleteFolderById,
};


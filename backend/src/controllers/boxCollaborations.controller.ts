import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import { getBoxClient, getBoxSDK } from "../utils/box.ts";
import { asyncHandler } from "../utils/helper.ts";
import userService from "../services/user.service.ts";

const client = getBoxClient();
const sdk = getBoxSDK();

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

async function fetchCollaboratorsForItem(itemId: string, type: string) {
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

async function fetchNestedItemsForCollaboration(
  folderId: string,
  role: string
) {
  const result: any[] = [];
  try {
    const folderItems = await client.folders.getItems(folderId, {
      fields:
        "id,description,name,type,owned_by,shared_link,created_at,modified_at,collaborators,size",
      limit: 100,
    });

    for (const item of folderItems.entries) {
      let collaborators: any[] = [];
      if (item.type == "folder") {
        const folderCollabs = await client.folders.getCollaborations(item.id);
        collaborators = folderCollabs.entries.map((collab: any) => ({
          id: collab.id,
          role: collab.role,
          user: collab.accessible_by,
        }));
      } else {
        const fileCollabs = await client.files.getCollaborations(item.id);
        collaborators = fileCollabs.entries.map((collab: any) => ({
          id: collab.id,
          role: collab.role,
          user: collab.accessible_by,
        }));
      }
      if (item.type === "folder") {
        const nestedItems = await fetchNestedItemsForCollaboration(
          item.id,
          role
        );
        result.push({
          ...item,
          collaborators,
          children: nestedItems,
          currentUserRole: role,
        });
      } else {
        result.push({ ...item, collaborators, currentUserRole: role });
      }
    }
  } catch (error) {
    console.error(
      `Error fetching items for folder ${folderId}:`,
      (error as Error).message
    );
  }

  return result;
}

async function fetchNestedFolderItems(folderId: string, limit: number = 100) {
  try {
    const folderItems = await client.folders.getItems(folderId, {
      fields:
        "id,name,type,shared_link,created_at,modified_at,collaborators,size",
      limit,
    });

    const itemsWithCollaborators = await Promise.all(
      folderItems.entries.map(async (item: any) => {
        const collaborators = await fetchCollaboratorsForItem(item.id, item.type);
        return {
          ...item,
          collaborators,
          children:
            item.type === "folder"
              ? await fetchNestedFolderItems(item.id)
              : [],
        };
      })
    );

    return itemsWithCollaborators;
  } catch (error) {
    console.error(`Error fetching items for folder ${folderId}:`, error);
    return [];
  }
}

async function getChildFolderByName(
  parentId: string,
  name: string,
  userClient: any
) {
  const items = await userClient.folders.getItems(parentId, {
    fields: "name,id,type",
  });
  return items.entries.find(
    (item: any) =>
      item.type === "folder" && item.name.toLowerCase() === name.toLowerCase()
  );
}

async function createFolderIfNotExists(
  parentId: string,
  name: string,
  userClient: any
) {
  const existing = await getChildFolderByName(parentId, name, userClient);
  if (existing) return existing.id;
  const created = await userClient.folders.create(parentId, name);
  return created.id;
}

async function ensureFolderPath(
  rootId: string,
  pathSegments: string[],
  userClient: any
) {
  let parentId = rootId;
  let rasId: string | null = null;
  for (const segment of pathSegments) {
    parentId = await createFolderIfNotExists(parentId, segment, userClient);
    if (segment?.toLowerCase() === "ras") {
      rasId = parentId;
    }
  }
  return { parentId, rasId };
}

async function listUserRootFolders(boxUserId: string) {
  try {
    const userClient = sdk.getAppAuthClient("user", boxUserId);

    const segments = ["RAS", "Clients"];
    const parentItem = await ensureFolderPath("0", segments, userClient);

    const result = await userClient.folders.getItems(parentItem?.parentId, {
      fields: "name,type,id,created_by",
      limit: 100,
    });
    return { rootItems: result.entries, rasId: parentItem?.rasId };
  } catch (error) {
    console.error("Error listing user root folders:", error);
    return { rootItems: [], rasId: null };
  }
}

// POST /api/box/collaborations
const getCollaborations = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      await logApiCall(req);
      const { collaborated, boxUserId } = req.body;
      let items: any[] = [];

      for (const element of collaborated) {
        try {
          const collaborators = await fetchCollaboratorsForItem(
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
            const folder = await fetchNestedItemsForCollaboration(
              element.folderId,
              currentUserRole
            );
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

      const user = await userService.getUserByBoxUserId(boxUserId);
      console.log("collaborated user", user);
      const folderItems = await fetchNestedFolderItems((user as any)?.folderId, 100);
      const userFoldersAtZero = await listUserRootFolders(boxUserId);

      return res.status(200).json({
        message: "Folder items fetched successfully",
        items: [...items, ...folderItems],
        boxItemsAtZero: userFoldersAtZero,
      });
    } catch (error) {
      console.error("Error fetching collaborated folder:", error);
      return res.status(500).json({
        error: "Failed to fetch collaborated folder",
        details: (error as Error).message,
      });
    }
  }
);

export default {
  getCollaborations,
};


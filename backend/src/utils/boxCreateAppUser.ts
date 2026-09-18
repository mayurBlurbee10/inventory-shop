import { getBoxClient } from "./boxClient.ts";

const BOX_USER_FIELDS = ["id", "name", "login", "external_app_user_id"];
const BOX_FOLDER_FIELDS = ["id", "name", "type", "parent"];

function getFolderEntries(result: any): any[] {
  return (
    result?.entries ||
    result?.rawData?.entries ||
    result?.data?.entries ||
    []
  );
}

function namesMatch(left?: string, right?: string) {
  return left?.trim().toLowerCase() === right?.trim().toLowerCase();
}

function getBoxErrorStatus(error: any): number | undefined {
  return (
    error?.statusCode ||
    error?.status ||
    error?.response?.statusCode ||
    error?.response?.status
  );
}

function getBoxErrorCode(error: any): string {
  return String(
    error?.code ||
      error?.response?.body?.code ||
      error?.data?.code ||
      ""
  ).toLowerCase();
}

function isBoxConflictError(error: any): boolean {
  const status = getBoxErrorStatus(error);
  const code = getBoxErrorCode(error);
  const message = String(error?.message || "");
  return (
    status === 409 ||
    code === "item_name_in_use" ||
    code === "conflict" ||
    message.includes("item_name_in_use")
  );
}

function isBoxItemNameInUse(error: any): boolean {
  const code = getBoxErrorCode(error);
  const message = String(error?.message || "");
  return (
    code === "item_name_in_use" ||
    message.includes("item_name_in_use") ||
    (getBoxErrorStatus(error) === 409 && message.toLowerCase().includes("same name"))
  );
}

function normalizeConflicts(value: any): any[] {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  return [value];
}

function getBoxConflictItems(error: any): any[] {
  return [
    ...normalizeConflicts(error?.contextInfo?.conflicts),
    ...normalizeConflicts(error?.context_info?.conflicts),
    ...normalizeConflicts(error?.data?.context_info?.conflicts),
    ...normalizeConflicts(error?.data?.contextInfo?.conflicts),
    ...normalizeConflicts(error?.response?.body?.context_info?.conflicts),
    ...normalizeConflicts(error?.response?.data?.context_info?.conflicts),
  ];
}

async function listChildItems(parentFolderId: string): Promise<any[]> {
  const client = getBoxClient();
  const items: any[] = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const result = await client.folders.getFolderItems(parentFolderId, {
      queryParams: {
        fields: BOX_FOLDER_FIELDS,
        limit,
        offset,
      },
    });
    const entries = getFolderEntries(result);
    items.push(...entries);
    if (entries.length < limit) {
      break;
    }
    offset += limit;
    if (offset >= 10000) {
      break;
    }
  }

  return items;
}

async function findChildFolder(parentFolderId: string, name: string) {
  const children = await listChildItems(parentFolderId);
  const match = children.find(
    (item: any) =>
      item.type === "folder" && namesMatch(item.name, name)
  );
  if (!match) {
    return null;
  }
  if (match.parent?.id && String(match.parent.id) !== String(parentFolderId)) {
    return null;
  }
  return match;
}

async function getFolderIfInParent(folderId: string, parentFolderId: string) {
  const client = getBoxClient();
  const details: any = await client.folders.getFolderById(String(folderId), {
    queryParams: { fields: ["id", "name", "type", "parent"] },
  });
  if (!details?.id || details.type === "file") {
    return null;
  }
  if (
    details.parent?.id &&
    String(details.parent.id) !== String(parentFolderId)
  ) {
    return null;
  }
  return details;
}

async function resolveExistingFolder(
  parentFolderId: string,
  name: string,
  error?: any
) {
  const conflicts = error ? getBoxConflictItems(error) : [];
  for (const conflict of conflicts) {
    if (!conflict?.id) {
      continue;
    }
    if (conflict.type && conflict.type !== "folder") {
      continue;
    }
    try {
      const details = await getFolderIfInParent(conflict.id, parentFolderId);
      if (details) {
        return details;
      }
    } catch {
      // Fall through to a parent listing lookup.
    }
  }

  return await findChildFolder(parentFolderId, name);
}

async function createChildFolder(parentFolderId: string, name: string) {
  const client = getBoxClient();
  try {
    return await client.folders.createFolder({
      name,
      parent: {
        id: String(parentFolderId),
      },
    });
  } catch (error: any) {
    if (isBoxItemNameInUse(error) || isBoxConflictError(error)) {
      const existing = await resolveExistingFolder(
        parentFolderId,
        name,
        error
      );
      if (existing) {
        return existing;
      }
    }
    throw error;
  }
}

export async function ensureSubfolder(
  parentFolderId: string,
  subfolderName: string
): Promise<any> {
  const existing = await findChildFolder(parentFolderId, subfolderName);
  if (existing) {
    return existing;
  }
  return await createChildFolder(parentFolderId, subfolderName);
}

export const getPortalRootFolderId = async () => {
  const devPortal = await ensureSubfolder("0", "dev-portals");
  if (!devPortal?.id) {
    throw new Error("dev-portals folder was not found");
  }

  return await ensureSubfolder(devPortal.id, "Universal Portal");
};

export type PortalFolderStructure = {
  rootFolderId: string;
  portalFolderId: string;
  portalContentFolderId: string;
  userUploadsFolderId: string;
};

export async function ensurePortalFolderStructure(
  portalId: string
): Promise<PortalFolderStructure> {
  const universalPortal = await getPortalRootFolderId();
  if (!universalPortal?.id) {
    throw new Error("Failed to resolve Universal Portal folder");
  }

  const portalFolder = await ensureSubfolder(universalPortal.id, portalId);
  const portalContentFolder = await ensureSubfolder(
    portalFolder.id,
    "Portal Content"
  );
  const userUploadsFolder = await ensureSubfolder(
    portalFolder.id,
    "User Uploads"
  );

  console.log("Portal folder structure:", {
    rootFolderId: universalPortal.id,
    portalFolderId: portalFolder.id,
    portalContentFolderId: portalContentFolder.id,
    userUploadsFolderId: userUploadsFolder.id,
  });

  return {
    rootFolderId: universalPortal.id,
    portalFolderId: portalFolder.id,
    portalContentFolderId: portalContentFolder.id,
    userUploadsFolderId: userUploadsFolder.id,
  };
}

function mapBoxAppUser(user: any) {
  return {
    userId: user.id,
    name: user.name,
    login: user.login,
  };
}

async function listBoxAppUsers(params: {
  filterTerm?: string;
  externalAppUserId?: string;
}) {
  const client = getBoxClient();
  const queryParams = {
    ...params,
    fields: BOX_USER_FIELDS,
    limit: 1000,
  };
  const users: any = await client.users.getUsers({
    queryParams,
    ...queryParams,
  } as any);
  return users?.entries || users?.rawData?.entries || [];
}

async function findBoxAppUser(userName: string, externalId?: string) {
  const expectedName = userName.trim().toLowerCase();
  const lookups: Array<{ filterTerm?: string; externalAppUserId?: string }> =
    [];

  if (externalId) {
    lookups.push({ externalAppUserId: externalId });
  }
  if (userName && userName !== externalId) {
    lookups.push({ externalAppUserId: userName });
  }
  lookups.push({ filterTerm: userName });

  for (const params of lookups) {
    try {
      const entries = await listBoxAppUsers(params);
      const match =
        entries.find((user: any) => {
          const externalAppUserId =
            user.externalAppUserId || user.external_app_user_id;
          return (
            (externalId && String(externalAppUserId) === String(externalId)) ||
            (userName && String(externalAppUserId) === String(userName))
          );
        }) ||
        entries.find((user: any) => namesMatch(user.name, expectedName));

      if (match) {
        return match;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export async function ensureBoxAppUser(userName: string, externalId: string) {
  const stableExternalId = userName || externalId;
  const existing = await findBoxAppUser(userName, stableExternalId);
  if (existing) {
    return mapBoxAppUser(existing);
  }

  const client = getBoxClient();
  try {
    const appUser: any = await client.users.createUser({
      name: userName,
      isPlatformAccessOnly: true,
      externalAppUserId: stableExternalId,
    });
    return mapBoxAppUser(appUser);
  } catch (error: any) {
    if (isBoxConflictError(error)) {
      const retry = await findBoxAppUser(userName, stableExternalId);
      if (retry) {
        return mapBoxAppUser(retry);
      }
    }
    throw error;
  }
}

export async function createBoxAppUser({
  userName,
  externalId,
  parentFolderId = "0",
  folderName,
}: {
  userName: string;
  externalId: string;
  parentFolderId?: string;
  folderName?: string;
}) {
  const appUser = await ensureBoxAppUser(userName, externalId);
  const folder = await ensureSubfolder(
    parentFolderId,
    folderName || userName
  );

  if (!folder?.id) {
    throw new Error(
      `Failed to create or reuse Box folder "${folderName || userName}"`
    );
  }

  return {
    ...appUser,
    folderId: folder.id,
  };
}

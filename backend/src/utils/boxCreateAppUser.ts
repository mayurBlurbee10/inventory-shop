import { getBoxClient } from "./boxClient.ts";

function getFolderEntries(result: any): any[] {
  return result?.entries || result?.rawData?.entries || [];
}

async function listChildFolders(parentFolderId: string): Promise<any[]> {
  const client = getBoxClient();
  const items = await client.folders.getFolderItems(parentFolderId, {
    queryParams: {
      fields: ["id", "name", "type", "parent"],
      limit: 1000,
    },
  });
  return getFolderEntries(items).filter((item: any) => item.type === "folder");
}

async function findChildFolder(parentFolderId: string, name: string) {
  const children = await listChildFolders(parentFolderId);
  const expectedName = name.trim().toLowerCase();
  const match = children.find(
    (item: any) => item.name?.trim().toLowerCase() === expectedName
  );
  if (!match) {
    return null;
  }
  if (match.parent?.id && String(match.parent.id) !== String(parentFolderId)) {
    return null;
  }
  return match;
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
    if (
      error?.response?.statusCode === 409 ||
      error?.statusCode === 409 ||
      error?.message?.includes("item_name_in_use")
    ) {
      const conflict = error?.response?.body?.context_info?.conflicts?.[0];
      if (conflict) {
        return conflict;
      }
      const retry = await findChildFolder(parentFolderId, name);
      if (retry) {
        return retry;
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

async function findExistingDevPortalsFolder() {
  const configuredId = process.env.DEV_PORTALS_FOLDER_ID?.trim();
  if (!configuredId) {
    throw new Error(
      "DEV_PORTALS_FOLDER_ID is required. Set it to the Box folder ID of the dev-portals folder you use in the Box UI."
    );
  }

  const client = getBoxClient();
  return await client.folders.getFolderById(configuredId, {
    queryParams: { fields: ["id", "name", "parent"] },
  });
}

export const getPortalRootFolderId = async () => {
  const devPortal = await findExistingDevPortalsFolder();
  if (!devPortal?.id) {
    throw new Error("dev-portals folder was not found");
  }

  const existingUniversalPortal = await findChildFolder(
    devPortal.id,
    "Universal Portal"
  );
  if (existingUniversalPortal) {
    return existingUniversalPortal;
  }

  console.log("Universal Portal folder not found. Creating it under dev-portals.");
  return await createChildFolder(devPortal.id, "Universal Portal");
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

export async function ensureBoxAppUser(userName: string, externalId: string) {
  const client = getBoxClient();

  const users: any = await client.users.getUsers({
  filterTerm: userName,
  fields: ["id","name","login"],
});

  if (users?.entries?.length > 0) {
    const existing = users.entries[0];
    return {
      userId: existing.id,
      name: existing.name,
      login: existing.login,
    };
  }

  try {
      const appUser: any = await client.users.createUser({
        name: userName,
        isPlatformAccessOnly: true,
        externalAppUserId: externalId,
      });
    return {
      userId: appUser.id,
      name: appUser.name,
      login: appUser.login,
    };
  } catch (error: any) {
    if (error?.statusCode === 409 || error?.response?.statusCode === 409) {
      const retry: any = await client.users.getUsers({
        filterTerm: userName,
        fields: ["id","name","login"],
      });
      const existing = retry?.entries?.[0];
      if (existing) {
        return {
          userId: existing.id,
          name: existing.name,
          login: existing.login,
        };
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
  const client = getBoxClient();

  // Search existing users
  const users: any = await client.users.getUsers({
    filterTerm: userName,
    fields: ["id","name","login"],
  });

  if (users?.entries?.length > 0) {
    const existing = users.entries[0];

    const searchResult: any = await client.search.searchForContent(
      {
        query: folderName || "",
        type: "folder",
        ancestorFolderIds: [parentFolderId],
        fields: ["id","name","parent"],
      }
    );

    const folderFound = searchResult?.entries?.find(
      (item: any) => {
        const isSameName =
          item?.name?.toLowerCase() ===
          folderName?.toLowerCase();

        const shouldCheckParent =
          parentFolderId !== "0" && item?.parent?.id;

        const isSameParent =
          item?.parent?.id?.toString() ===
          parentFolderId?.toString();

        return isSameName && (!shouldCheckParent || isSameParent);
      }
    );

    if (folderFound) {
      return {
        userId: existing.id,
        name: existing.name,
        login: existing.login,
        folderId: folderFound.id,
      };
    }

    try {
      const newFolder = await client.folders.createFolder(
        {
          parent: {
            id: parentFolderId.toString(),
          },
          name: folderName || userName,
        }
      );

      return {
        userId: existing.id,
        name: existing.name,
        login: existing.login,
        folderId: newFolder.id,
      };
    } catch (error: any) {
      if (
        error?.response?.statusCode === 409 ||
        error?.message?.includes("item_name_in_use")
      ) {
        const conflict =
          error?.response?.body?.context_info?.conflicts?.[0];

        if (conflict) {
          return {
            userId: existing.id,
            name: existing.name,
            login: existing.login,
            folderId: conflict.id,
          };
        }
      }

      throw error;
    }
  }

  let appUser: any;
  try {
    appUser = await client.users.createUser({
      name: userName,
      isPlatformAccessOnly: true,
      externalAppUserId: externalId,
    });
  } catch (error: any) {
    if (error?.statusCode === 409 || error?.response?.statusCode === 409) {
      const retry: any = await client.users.getUsers({
        filterTerm: userName,
        fields: ["id","name","login"],
      });
      appUser = retry?.entries?.[0];
      if (!appUser) {
        throw error;
      }
    } else {
      throw error;
    }
  }

  let folder: any;

  try {
    folder = await client.folders.createFolder(
      {
        parent: {
          id: parentFolderId.toString(),
        },
        name: folderName || userName,
      },
      
    );
  } catch (error: any) {
    if (
      error?.response?.statusCode === 409 ||
      error?.message?.includes("item_name_in_use")
    ) {
      folder =
        error?.response?.body?.context_info?.conflicts?.[0];
    } else {
      throw error;
    }
  }

  return {
    userId: appUser.id,
    name: appUser.name,
    login: appUser.login,
    folderId: folder?.id,
  };
}
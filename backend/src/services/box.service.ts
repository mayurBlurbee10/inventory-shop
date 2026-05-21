
import { GetUsersQueryParams } from "box-node-sdk/lib/managers/users";
import { getBoxClient, getUserBoxClient } from "../utils/boxClient.ts";
import userService from "./user.service.ts";
import { SearchResults } from "box-node-sdk/lib/schemas/searchResults";

const client = getBoxClient();

export async function createBoxAppUser({
  userName = "Test User",
  externalId = Date.now().toString(),
}: {
  userName?: string;
  externalId?: string;
}) {
  const user = await client.users.getUsers({
    filterTerm: userName,
    fields: ['id', 'name', 'login'],
  } satisfies GetUsersQueryParams);


  console.log("user", user);

  if (user?.entries && user.entries.length > 0) {
    const folder = await client.search.searchForContent({
      query: `"${userName}"`,
      type: 'folder',
      fields: ['id'],
    }) as SearchResults;

    if (!folder?.entries?.length) {
      const newFolder = await client.folders.createFolder({
        name: `${userName}'s Files`,
        parent: { id: "0" },
      });
      return {
        userId: user?.entries[0].id,
        name: user?.entries[0].name,
        login: user?.entries[0].login,
        folderId: newFolder?.id!,
      };
    }

    return {
      userId: user?.entries[0].id,
      name: user?.entries[0].name,
      login: user?.entries[0].login,
      folderId: folder?.entries[0].id,
    };
  }

  const appUser = await client.users.createUser({
    name: userName,
    externalAppUserId: externalId,
    isPlatformAccessOnly: true,
  });

  console.log("Created Box App User:", appUser);

  const folder = await client.folders.createFolder({
    name: `${appUser.name}'s Files`,
    parent: { id: "0" },
  });
  console.log("Created folder:", folder);

  await client.userCollaborations.createCollaboration({
    item: {
      id: folder?.id,
      type: "folder",
    },
    accessibleBy: {
      type: "user",
      id: appUser?.id,
    },
    role: "editor",
  });
  console.log("Granted folder access");

  return {
    userId: appUser.id,
    name: appUser.name,
    login: appUser.login,
    folderId: folder.id,
  };
}

export async function addCollaborator(
  itemId: string,
  userID: string,
  role: string,
  type: any
) {
  const collaboration = await client.userCollaborations.createCollaboration({
    item: {
      id: itemId,
      type: type,
    },
    accessibleBy: {
      id: userID,
      type: "user",
    },
    role: role,
  });
  return collaboration;
}

export async function getCollaboration(collaborationId: string) {
  const collaboration = await client.userCollaborations.getCollaborationById(collaborationId);
  return collaboration || null;
}

export async function updateCollaboratorRole(
  collaborationId: string,
  newRole: string
) {
  const updatedCollaboration =
    await client.userCollaborations.updateCollaborationById(collaborationId, {
      requestBody: {
        role: newRole as any,
      },
    });
  return updatedCollaboration;
}

export async function addCollaboratorId(
  folderId: string,
  userId: string,
  role?: string,
  type?: string
) {
  const user = await userService.getUserByBoxUserId(userId);

  if (user) {
    let collaborationIds = user.collaborationIds || [];
    const collabIndex = collaborationIds.findIndex(
      (collab: any) => collab.folderId == folderId
    );

    if (role) {
      if (collabIndex > -1) {
        collaborationIds[collabIndex].role = role;
        collaborationIds[collabIndex].type = type;
      } else {
        collaborationIds.push({ folderId, role, type });
      }
    } else {
      if (collabIndex > -1) {
        collaborationIds.splice(collabIndex, 1);
      }
    }

    await userService.addCollaboratorId(user.id, collaborationIds);
  }
}

export async function fetchFolderCollaborators(itemId: string) {
  try {
    const collaborations =
      await client.listCollaborations.getFolderCollaborations(itemId);
    return collaborations?.entries?.map((collaboration: any) => ({
      id: collaboration.id,
      role: collaboration.role,
      user: collaboration.accessibleBy,
    }));
  } catch (error) {
    console.error(
      `Error fetching collaborators for item ${itemId}:`,
      (error as Error).message,
    );
    return [];
  }
}

export async function fetchFileCollaborators(itemId: string) {
  try {
    const collaborations =
      await client.listCollaborations.getFileCollaborations(itemId);
    return collaborations?.entries?.map((collaboration: any) => ({
      id: collaboration.id,
      role: collaboration.role,
      user: collaboration.accessibleBy,
    }));
  } catch (error) {
    console.error(
      `Error fetching collaborators for item ${itemId}:`,
      (error as Error).message,
    );
    return [];
  }
}

export async function fetchNestedItems(
  folderId: string,
  limit: number = 100,
  boxUserId?: string,
) {
  try {
    let userClient = client;
    if (boxUserId) {
      userClient = getUserBoxClient(boxUserId);
    }
    const folderItems: any = await userClient.folders.getFolderItems(folderId, {
      queryParams: {
        fields: [
          "id",
          "name",
          "type",
          "shared_link",
          "created_at",
          "modified_at",
          "size",
          "tags",
        ],
        limit: limit,
      },
    });

    const itemsWithCollaborators: any = await Promise.all(
      (folderItems?.rawData?.entries || []).map(async (item: any) => {
        const collaborators =
          item.type === "folder"
            ? await fetchFolderCollaborators(item.id)
            : await fetchFileCollaborators(item.id);

        return {
          ...item,
          collaborators: collaborators,
          children:
            item.type === "folder"
              ? await fetchNestedItems(item.id, limit)
              : [],
        };
      }),
    );

    return itemsWithCollaborators;
  } catch (error) {
    console.error(
      `Error fetching items for folder ${folderId}:`,
      (error as Error).message,
    );
    return [];
  }
}

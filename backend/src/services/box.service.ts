import { getBoxClient, getBoxSDK } from "../utils/box.ts";
import userService from "./user.service.ts";

const client = getBoxClient();
const sdk = getBoxSDK();

export async function createBoxAppUser({
  userName = "Test User",
  externalId = Date.now().toString(),
}: {
  userName?: string;
  externalId?: string;
}) {
  const user = await client.enterprise.getUsers({
    filter_term: userName,
    fields: "id,name,login",
  });

  console.log("user", user);

  if (user?.entries.length > 0) {
    const folder = await client.search.query(`"${userName}'s Files"`, {
      type: "folder",
      fields: "id",
    });

    if (!folder?.entries.length) {
      const newfolder = await client.folders.create("0", `${userName}'s Files`);
      return {
        userId: user?.entries[0].id,
        name: user?.entries[0].name,
        login: user?.entries[0].login,
        folderId: newfolder.id,
      };
    }

    return {
      userId: user?.entries[0].id,
      name: user?.entries[0].name,
      login: user?.entries[0].login,
      folderId: folder?.entries[0].id,
    };
  }

  const appUser = await client.enterprise.addAppUser(userName, {
    external_app_user_id: externalId,
    is_platform_access_only: true,
  });

  console.log("Created Box App User:", appUser);

  const folder = await client.folders.create("0", `${appUser.name}'s Files`);
  console.log("Created folder:", folder);

  await client.collaborations.createWithUserID(
    appUser.id,
    folder.id,
    (client as any).collaborationRoles.EDITOR
  );
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
  type: string
) {
  const collaboration = await client.collaborations.create(
    { id: userID, type: "user" },
    itemId,
    role as any,
    { type: type as any }
  );
  return collaboration;
}

export async function getCollaboration(collaborationId: string) {
  const collaboration = await client.collaborations.get(collaborationId);
  return collaboration || null;
}

export async function updateCollaboratorRole(
  collaborationId: string,
  newRole: string
) {
  const updatedCollaboration = await client.collaborations.update(
    collaborationId,
    { role: newRole as any }
  );
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
    const collaborations = await client.folders.getCollaborations(itemId);
    return collaborations.entries.map((collaboration: any) => ({
      id: collaboration.id,
      role: collaboration.role,
      user: collaboration.accessible_by,
    }));
  } catch (error) {
    console.error(
      `Error fetching collaborators for item ${itemId}:`,
      (error as Error).message
    );
    return [];
  }
}

export async function fetchFileCollaborators(itemId: string) {
  try {
    const collaborations = await client.files.getCollaborations(itemId);
    return collaborations.entries.map((collaboration: any) => ({
      id: collaboration.id,
      role: collaboration.role,
      user: collaboration.accessible_by,
    }));
  } catch (error) {
    console.error(
      `Error fetching collaborators for item ${itemId}:`,
      (error as Error).message
    );
    return [];
  }
}

export async function fetchNestedItems(folderId: string, limit: number = 100) {
  try {
    const folderItems = await client.folders.getItems(folderId, {
      fields:
        "id,name,type,shared_link,created_at,modified_at,collaborators,size,tags",
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
          children:
            item.type === "folder"
              ? await fetchNestedItems(item.id, limit)
              : [],
        };
      })
    );

    return itemsWithCollaborators;
  } catch (error) {
    console.error(
      `Error fetching items for folder ${folderId}:`,
      (error as Error).message
    );
    return [];
  }
}

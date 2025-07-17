import { logApiCall } from "@/app/lib/api-log-middleware";
import boxService from "@/services/boxService";
import userService from "@/services/userService";
import BoxSDK from "box-node-sdk";
import { NextResponse } from "next/server";

const sdk = new BoxSDK({
  clientID: process.env.BOX_CLIENT_ID,
  clientSecret: process.env.BOX_CLIENT_SECRET,
  appAuth: {
    keyID: process.env.BOX_PUBLIC_KEY_ID,
    privateKey: process.env.BOX_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    passphrase: process.env.BOX_PASSPHRASE,
    enterpriseID: process.env.BOX_ENTERPRISE_ID,
  },
});

function isTrashedOrNotFoundError(error) {
  const message =
    error?.response?.body?.message?.toLowerCase() ||
    error?.message?.toLowerCase() ||
    "";
  return (
    message.includes("trashed") ||
    error?.response?.body?.code === "item_not_found" ||
    error?.statusCode === 404 ||
    error?.response?.status === 404
  );
}

const client = sdk.getAppAuthClient(
  "enterprise",
  process.env.BOX_ENTERPRISE_ID
);

// export async function POST(request) {
//   try {
//     await logApiCall(request);
//     const { collaborated } = await request.json();
//     let items = [];
//     for await (const element of collaborated) {
//       const folder = await fetchNestedItems(element.folderId, element.role);
//       const collaborators = await fetchCollaborators(element.folderId);
//       const folderName = await client.folders.get(element.folderId);

//       items.push({
//         ...folderName,
//         children: folder,
//         collaborators,
//         currentUserRole: element.role,
//       });
//     }

//     return NextResponse.json({
//       message: "Folder items fetched successfully",
//       items,
//     });
//   } catch (error) {
//     console.error("Error fetching collaborated folder:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch collaborated folder", details: error.message },
//       { status: 500 }
//     );
//   }
// }

export async function POST(request) {
  try {
    await logApiCall(request);
    const { collaborated, boxUserId } = await request.json();
    const items = [];

    for await (const element of collaborated) {
      try {
        const collaborators = await fetchCollaborators(
          element.folderId,
          element.type
        );

        let currentUserCollab = collaborators.find(
          (collab) =>
            collab?.item?.id === element?.folderId &&
            collab?.user?.id === boxUserId
        );

        let currentUserRole = currentUserCollab?.role || element.role;

        if (element.type === "folder") {
          const folder = await fetchNestedItems(
            element.folderId,
            currentUserRole,
            boxUserId
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
          error.message
        );
        throw error;
      }
    }
    const user = await userService.getUserByBoxUserId(boxUserId);
    console.log("collaborated user", user);
    const folderItems = await fetchNestedFolderItems(user?.folderId, 100);
    const userFoldersAtZero = await boxService.listUserRootFolders(boxUserId);
    return NextResponse.json({
      message: "Folder items fetched successfully",
      items: [...items, ...folderItems],
      boxItemsAtZero: userFoldersAtZero,
    });
  } catch (error) {
    console.error("Error fetching collaborated folder:", error);
    return NextResponse.json(
      { error: "Failed to fetch collaborated folder", details: error.message },
      { status: 500 }
    );
  }
}

async function fetchNestedItems(folderId, role) {
  const result = [];
  try {
    const folderItems = await client.folders.getItems(folderId, {
      fields:
        "id,description,name,type,owned_by,shared_link,created_at,modified_at,collaborators,size",
      limit: 100,
    });

    for (const item of folderItems.entries) {
      let collaborators = [];
      if (item.type == "folder") {
        collaborators = await fetchFolderCollaborators(item.id);
      } else {
        collaborators = await fetchFileCollaborators(item.id);
      }
      if (item.type === "folder") {
        const nestedItems = await fetchNestedItems(item.id, role);
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
      error.message
    );
  }

  return result;
}

async function fetchCollaborators(itemId, type) {
  try {
    if (type === "folder") {
      const collaborations = await client.folders.getCollaborations(itemId);
      return collaborations.entries.map((collaboration) => ({
        id: collaboration.id,
        role: collaboration.role,
        user: collaboration.accessible_by,
        type: collaboration.type,
      }));
    } else {
      const collaborations = await client.files.getCollaborations(itemId);
      return collaborations.entries.map((collaboration) => ({
        id: collaboration.id,
        role: collaboration.role,
        user: collaboration.accessible_by,
        type: collaboration.type,
      }));
    }
  } catch (error) {
    console.error(
      `Error fetching collaborators for folder ${itemId}:`,
      error.message
    );
    return [];
  }
}

async function fetchFolderCollaborators(itemId) {
  try {
    const collaborations = await client.folders.getCollaborations(itemId);
    return collaborations.entries.map((collaboration) => {
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
      error.message
    );
    return [];
  }
}

async function fetchFileCollaborators(itemId) {
  try {
    const collaborations = await client.files.getCollaborations(itemId);
    return collaborations.entries.map((collaboration) => {
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
      error.message
    );
    return [];
  }
}

export async function fetchNestedFolderItems(folderId, limit) {
  try {
    const folderItems = await client.folders.getItems(folderId, {
      fields:
        "id,name,type,shared_link,created_at,modified_at,collaborators,size",
      limit : limit, 
    });

    const itemsWithCollaborators = await Promise.all(
      folderItems.entries.map(async (item) => {
       const collaborators = await fetchCollaborators(item.id, item.type);

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

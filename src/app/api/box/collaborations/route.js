import { logApiCall } from "@/app/lib/api-log-middleware";
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
    const { collaborated } = await request.json();
    let items = [];
    for await (const element of collaborated) {
      if (element.type === 'folder') {
        const folder = await fetchNestedItems(element.folderId, element.role);
        const collaborators = await fetchCollaborators(element.folderId);
        const folderName = await client.folders.get(element.folderId);

        items.push({
          ...folderName,
          children: folder,
          collaborators,
          currentUserRole: element.role,
        });
      } else {
        const collaborators = await fetchCollaborators(element.folderId);
        const file = await client.files.get(element.folderId);
        items.push({
          ...file,
          collaborators,
          currentUserRole: element.role,
        })
      }
    }

    return NextResponse.json({
      message: "Folder items fetched successfully",
      items,
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
      fields: "id,description,name,type,owned_by,shared_link,created_at,modified_at,collaborators",
      limit: 100,
    });

    for (const item of folderItems.entries) {
      let collaborators = [];
      if (item.type === "folder") {
        collaborators = await fetchCollaborators(item.id);
        const nestedItems = await fetchNestedItems(item.id, role);
        result.push({ ...item, collaborators, children: nestedItems, currentUserRole: role });
      } else {
        result.push({ ...item, collaborators, currentUserRole: role });
      }
    }
  } catch (error) {
    console.error(`Error fetching items for folder ${folderId}:`, error.message);
  }

  return result;
}

async function fetchCollaborators(itemId) {
  try {
    const collaborations = await client.folders.getCollaborations(itemId);
    return collaborations.entries.map((collaboration) => ({
      id: collaboration.id,
      role: collaboration.role,
      user: collaboration.accessible_by,
      type: collaboration.type,
    }));
  } catch (error) {
    console.error(`Error fetching collaborators for folder ${itemId}:`, error.message);
    return [];
  }
}
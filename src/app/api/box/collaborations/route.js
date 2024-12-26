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

export async function POST(request) {
  try {
    await logApiCall(request);
    const { collaborated } = await request.json();
    let items = [];
    for await (const element of collaborated) {
      const folder = await fetchNestedItems(element.folderId, element.role);
      items.push(folder);
    }
    return Response.json({
      message: "Folder items fetched successfully",
      items,
    });
  } catch (error) {
    console.error("Error fetch collaborated folder:", error);
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
      fields: "id,name,type,shared_link,created_at,modified_at,collaborators",
      limit: 100,
    });

    const folderEntry = {
      id: folderId,
      name: folderItems.name,
      type: "folder",
      collaborators: [],
      children: [],
      currentUserRole: role,
    };

    for (const item of folderItems.entries) {
      let collaborators = [];
      // if(item.type == "folder"){
      //   collaborators = await fetchCollaborators(item.id);
      // }
      if (item.type === "folder") {
        // Recursively fetch items inside subfolder
        const nestedItems = await fetchNestedItems(item.id);
        // result.push({ ...item, collaborators, children: nestedItems, currentUserRole: role });
        folderEntry.children.push({
          ...item,
          collaborators,
          children: nestedItems,
          currentUserRole: role,
        });
      } else {
        // File, directly push to the result
        // result.push({ ...item, collaborators, currentUserRole: role });
        folderEntry.children.push({
          ...item,
          collaborators,
          currentUserRole: role,
        });
      }
    }
    result.push(folderEntry);
  } catch (error) {
    console.error(
      `Error fetching items for folder ${folderId}:`,
      error.message
    );
  }

  return result;
}

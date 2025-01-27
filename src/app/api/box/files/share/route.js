import {
  logApiCall,
  readJsonFile,
  writeJsonFile,
} from "@/app/lib/api-log-middleware";
import userService from "@/services/userService";
import BoxSDK from "box-node-sdk";
import { NextResponse } from "next/server";
import path from "path";

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

export async function GET(request) {
  try {
    await logApiCall(request);
    const fileId = request.nextUrl.searchParams.get("fileId");
    const isShareable =
      request.nextUrl.searchParams.get("isShareable") === "true";

    if (!fileId || isShareable === undefined) {
      return NextResponse.json(
        { error: "File ID and isShareable state are required." },
        { status: 400 }
      );
    }

    let response;

    if (isShareable) {
      response = await client.files.update(fileId, {
        shared_link: {
          access: "open", // Options: 'open', 'company', 'collaborators'
          permissions: {
            can_download: true,
            can_preview: true,
          },
        },
      });
    } else {
      response = await client.files.update(fileId, {
        shared_link: null,
      });
    }

    // const sharedLink = isShareable ? response.shared_link?.url : null;
    const sharedLink = isShareable
      ? `${process.env.NEXT_PUBLIC_APP_BASE_URL}/shared-file/${fileId}`
      : null;

    return NextResponse.json({
      message: isShareable
        ? "Shared link generated successfully."
        : "Shared link removed successfully.",
      fileId: fileId,
      sharedLink: sharedLink,
    });
  } catch (error) {
    console.error("Error updating shared link:", error);
    return NextResponse.json(
      {
        error: "Failed to update shared link.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await logApiCall(request);
    const { itemId, userID, role, updateRole, type = 'folder' } = await request.json();

    if (!itemId || !userID || !role) {
      return NextResponse.json(
        { error: "itemId, userID, and role are required." },
        { status: 400 }
      );
    }
    let response;
    if (updateRole) {
      // const collaborationId = await getCollaborationId(itemId, userID);
      const collaborationId = itemId;
      if (!collaborationId) {
        return NextResponse.json(
          { error: "Collaboration not found for the given userID and item." },
          { status: 404 }
        );
      }
      response = await updateCollaboratorRole(collaborationId, role);
    } else {
      response = await addCollaborator(itemId, userID, role, type);
    }
    await addCollaboratorId(response.item.id, userID, role, type);

    return NextResponse.json({
      success: true,
      message: updateRole
        ? `User's role updated to ${role} successfully.`
        : `User invited as ${role} successfully.`,
      response,
    });
  } catch (error) {
    console.error("Error adding collaborator:", error);
    return NextResponse.json(
      {
        error:
          error.response?.body.message || "Failed to share item via userID",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await logApiCall(request);
    const { searchParams } = new URL(request.url);
    const collaboratorId = searchParams.get("collaboratorId");
    const userId = searchParams.get("userId");
    if (!collaboratorId) {
      return NextResponse.json(
        { error: "No collaboratorId provided" },
        { status: 400 }
      );
    }
    const collaboration = await getCollaboration(collaboratorId);

    await client.collaborations.delete(collaboratorId);
    await addCollaboratorId(collaboration.item.id, userId);

    return NextResponse.json({
      message: "Collaborator remove successfully",
    });
  } catch (error) {
    console.error("Error removing collaborator:", error);
    return NextResponse.json(
      { error: "Failed to remove collaborator", details: error.message },
      { status: 500 }
    );
  }
}

/**
 *
 * @param role // 'viewer', 'editor', 'uploader', 'co-owner'
 *
 */
async function addCollaborator(itemId, userID, role, type) {
  const collaboration = await client.collaborations.create(
    { id: userID, type: "user" },
    itemId,
    role,
    {type}
  );
  return collaboration;
}

async function getCollaboration(collaborationId) {
  const collaboration = await client.collaborations.get(collaborationId);

  return collaboration || null;
}

async function updateCollaboratorRole(collaborationId, newRole) {
  const updatedCollaboration = await client.collaborations.update(
    collaborationId,
    { role: newRole }
  );

  return updatedCollaboration;
}

async function acceptCollaboration(collaborationId) {
  try {
    // const updatedCollaboration = await client.collaborations.update(collaborationId, {
    //   status: "accepted",
    // });
    const updatedCollaboration = await client.collaborations.respondToPending(
      collaborationId,
      "accepted"
    );
    return updatedCollaboration;
  } catch (error) {
    console.error("Error accepting collaboration:", error.message);
    throw error;
  }
}

async function pendingCollaboration() {
  return await client.collaborations.getPending();
}

async function addCollaboratorId(folderId, userId, role, type) {
  // const dataFilePath = path.join(process.cwd(), 'data', 'users.json');
  // const users = await readJsonFile(dataFilePath);
  // const index = users.findIndex(element => element.boxUserId == userId);

  // if (index > -1) {
  //   if (!users[index]['collaborationIds']) {
  //     users[index]['collaborationIds'] = [];
  //   }

  //   const collabIndex = users[index]['collaborationIds'].findIndex(
  //     collab => collab.folderId == folderId
  //   );

  //   if (role) {
  //     if (collabIndex > -1) {
  //       users[index]['collaborationIds'][collabIndex].role = role;
  //     } else {
  //       users[index]['collaborationIds'].push({ folderId, role });
  //     }
  //   } else {
  //     if (collabIndex > -1) {
  //       users[index]['collaborationIds'].splice(collabIndex, 1);
  //     }
  //   }

  //   await writeJsonFile(path.join(process.cwd(), 'data'), dataFilePath, users);
  // }

  // here userId is boxUserId
  const user = await userService.getUserByBoxUserId(userId);

  if (user) {
    let collaborationIds = user.collaborationIds;
    const collabIndex = collaborationIds.findIndex(
      (collab) => collab.folderId == folderId
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

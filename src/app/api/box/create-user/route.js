// src/app/api/box/create-user/route.js
import { NextResponse } from "next/server";
import BoxSDK from "box-node-sdk";
import { logApiCall } from "@/app/lib/api-log-middleware";

const sdk = new BoxSDK({
  clientID: process.env.BOX_CLIENT_ID,
  clientSecret: process.env.BOX_CLIENT_SECRET,
  appAuth: {
    keyID: process.env.BOX_PUBLIC_KEY_ID,
    privateKey: process.env.BOX_PRIVATE_KEY,
    passphrase: process.env.BOX_PASSPHRASE,
  },
});

const client = sdk.getAppAuthClient(
  "enterprise",
  process.env.BOX_ENTERPRISE_ID
);

export async function POST(request) {
  try {
    await logApiCall(request, () => {});
    const data = await request.json();
    const { userName = "Test User", externalId = Date.now().toString() } = data;

    const user = await client.enterprise.getUsers({
      filter_term: userName,
      fields: "id,name,login",
    });

    if (user?.entries.length > 0) {
      const folder = await client.search.query(`"${userName}'s Files"`, {
        type: "folder",
        fields: "id",
      });

      if (!folder?.entries.length > 0) {
        const newfolder = await client.folders.create("0", `${userName}'s Files`);

        return NextResponse.json({
          success: true,
          user: {
            userId: user?.entries[0].id,
            name: user?.entries[0].name,
            login: user?.entries[0].login,
            folderId: newfolder.id,
          },
        });
      }

      return NextResponse.json({
        success: true,
        user: {
          userId: user?.entries[0].id,
          name: user?.entries[0].name,
          login: user?.entries[0].login,
          folderId: folder?.entries[0].id,
        },
      });
    }

    // Create an app user
    const appUser = await client.enterprise.addAppUser(userName, {
      external_app_user_id: externalId,
      is_platform_access_only: true,
    });

    console.log("Created Box App User:", appUser);

    // Create a folder for the user
    const folder = await client.folders.create("0", `${appUser.name}'s Files`);
    console.log("Created folder:", folder);

    // Grant the user access to their folder
    await client.collaborations.createWithUserID(
      appUser.id,
      folder.id,
      client.collaborationRoles.EDITOR
    );
    console.log("Granted folder access");

    return NextResponse.json({
      success: true,
      user: {
        userId: appUser.id,
        name: appUser.name,
        login: appUser.login,
        folderId: folder.id,
      },
    });
  } catch (error) {
    console.error("Error creating Box app user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create Box user" },
      { status: 500 }
    );
  }
}

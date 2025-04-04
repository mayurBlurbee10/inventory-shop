import { NextResponse } from "next/server";
import BoxSDK from "box-node-sdk";
import { promises as fs } from "fs";
import path from "path";
import { cookies } from "next/headers";
import { logApiCall } from "@/app/lib/api-log-middleware";
import { generateToken } from "@/app/lib/jwt";
import * as bcrypt from "bcrypt";
import userService from "@/services/userService";
import { UserRole } from "@/config/constants";
import portalService from "@/services/portalService";

// Use the correct path to users.json in the data directory
const dataFilePath = path.join(process.cwd(), "data", "users.json");

// Helper to read users from JSON file
async function readUsers() {
  try {
    console.log("Reading users from:", dataFilePath);
    const data = await fs.readFile(dataFilePath, "utf8");
    const users = JSON.parse(data);
    console.log("Successfully read users:", users.length);
    return users;
  } catch (error) {
    console.error("Error reading users file:", error);
    return [];
  }
}

let boxService = null;

try {
  const sdk = new BoxSDK({
    clientID: process.env.BOX_CLIENT_ID,
    clientSecret: process.env.BOX_CLIENT_SECRET,
    appAuth: {
      keyID: process.env.BOX_PUBLIC_KEY_ID,
      privateKey: process.env.BOX_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      passphrase: process.env.BOX_PASSPHRASE,
    },
  });

  const client = sdk.getAppAuthClient(
    "enterprise",
    process.env.BOX_ENTERPRISE_ID
  );

  boxService = {
    async getUserFiles(userId, folderId) {
      try {
        console.log(
          "Fetching files for user:",
          userId,
          "from folder:",
          folderId
        );

        // Get the folder contents directly using the known folder ID
        const folderItems = await client.folders.get(folderId, {
          fields: "name,size,created_at,modified_at,path_collection",
        });

        console.log("Got folder info:", {
          name: folderItems.name,
          created: folderItems.created_at,
        });

        // Get all items in the folder
        const items = await client.folders.getItems(folderId, {
          fields:
            "name,size,created_at,modified_at,owned_by,shared_link,extension,permissions",
          limit: 1000,
        });

        console.log(`Found ${items.total_count} items in folder`);

        // Get user info
        const userInfo = await client.users.get(userId, {
          fields: "name,login,created_at,avatar_url,role",
        });

        return {
          user: userInfo,
          folder: folderItems,
          files: items.entries,
          total_count: items.total_count,
        };
      } catch (error) {
        console.error("Error in getUserFiles:", error);
        throw error;
      }
    },
  };
} catch (error) {
  console.error("Failed to initialize Box SDK:", error);
}

function sanitizeName(name) {
  let sanitizeName = name.trim().toLowerCase().replace(/\s+/g, "-");
  return sanitizeName.endsWith(".") ? sanitizeName.slice(0, -1) : sanitizeName;
}

export async function POST(request) {
  try {
    await logApiCall(request, () => {});
    const data = await request.json();
    console.log("Login attempt for:", data.email);

    // Read users from JSON file
    // const users = await readUsers();
    // console.log('Found', users.length, 'users in database');

    // Verify user credentials
    // const user = users.find(u =>
    //   u.email.toLowerCase() === data.email.toLowerCase() &&
    //   u.password === data.password
    // );

    // check user exist
    const user = await userService.getUserByEmail(data.email);

    let portalCreatedAdmin = null;
    if(data?.portalid){
      portalCreatedAdmin = await portalService.getPortalCreatedAdmin(data?.portalid);
    }
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials!! user not found with this email" },
        { status: 404 }
      );
    }

    console.log("DATA.PORTALID: ", data.portalid, user.portalId);
    // check if this is the same portal's user
    const userPermission =
      Array.isArray(user.permissions) &&
      user.permissions.find(
        (permission) => permission.portalId === data?.portalid
      );

    let userRole = userPermission?.role;

    if (!userPermission) {
      const superUserPermission =
        Array.isArray(user.permissions) &&
        user.permissions.find((permission) => permission.portalId === null);

      userRole = superUserPermission?.role;
    }
    if (data?.portalid && !userPermission) {
      if (userRole === UserRole.SUPER_ADMIN) {
        let allPortals = [];
        const userData = await userService.getUserById(user.id);
        if (userData?.groupMembersIds && userData.groupMembersIds?.length > 0) {
          for (const id of userData.groupMembersIds) {
            const groupPortals = await portalService.getPortalsByUser(
              String(id).toLowerCase()
            );
            console.log("groupPortal", groupPortals.portals)
            allPortals = [...allPortals, ...groupPortals.portals];
          }
        }
        const portals = await portalService.getPortalsByUser(
          String(user.id).toLowerCase()
        );
        console.log("portals", portals);
        allPortals = [...allPortals, ...portals.portals];
        // const portals = await portalService.getPortalsByUser(user.id);
        const portalOwners = allPortals.some(
          (portal) => sanitizeName(portal.legalName) === data.portalid
        );
        if (!portalOwners) {
          return NextResponse.json(
            { error: "This user does not have access to this portal" },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "This user does not have access to this portal" },
          { status: 403 }
        );
      }
    }
    
    if (data.role && data.role !== userRole) {
      return NextResponse.json(
        { error: "This user does not have access to this portal" },
        { status: 403 }
      );
    }

    // check if password is correct or not
    const isPasswordCorrect = await bcrypt.compare(
      data.password,
      user.password
    );

    if (!isPasswordCorrect) {
      console.log("Invalid credentials for:", data.email);
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    console.log("User found:", {
      email: user.email,
      boxUserId: user.boxUserId,
      folderId: user.folderId,
      role: user.role,
    });

    // If we have a Box service and user has Box IDs, fetch their files
    let boxData = null;
    //if you want to show user's file then use "user.folderId" and for showing portalCreatedAdmin's files then use portalCreatedAdmin's folderId
    if (boxService && user.boxUserId && portalCreatedAdmin && portalCreatedAdmin?.folderId) {   // changed to portalCreatedAdmin's folderId
      try {
        console.log(
          "Fetching Box data for user ID:",
          user.boxUserId,
          "folder ID:",
          user.folderId
        );
        boxData = await boxService.getUserFiles(user.boxUserId, user.folderId);
        console.log("Retrieved Box data:", {
          filesCount: boxData?.files?.length,
          userName: boxData?.user?.name,
          folderName: boxData?.folder?.name,
        });
      } catch (boxError) {
        console.error("Error fetching Box data:", boxError);
        // Don't fail the login if Box fetch fails
        boxData = {
          error: boxError.message,
          files: [],
          user: null,
          folder: null,
        };
      }
    }

    // Include role in the response and ensure it's properly set
    let userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: userRole,
      company: user.company,
      isOnboardingRequired: user.isOnboardingRequired,
      boxUserId: user.boxUserId,
      // boxFolderId: user.folderId,
      collaborationIds: user.collaborationIds,
      signRequestsIds: user.signRequestsId,
      permissions : user.permissions,
      isTNCAccepted : user.isTNCAccepted,
      title: user.title,
      phoneNo:user.phoneNo,
    };

    if(portalCreatedAdmin){
      userData.boxFolderId = portalCreatedAdmin?.folderId;
    }else {
      userData.boxFolderId = user?.folderId;
    }

    if (userRole != UserRole.SUPER_ADMIN) {
      userData.boxUserId = user.boxUserId;
      // userData.boxFolderId = user.folderId;
      userData.boxFiles = boxData?.files || [];
      userData.boxUserInfo = boxData?.user || null;
      userData.boxFolderInfo = boxData?.folder || null;
      userData.boxError = boxData?.error;
      userData.collaborationIds = user.collaborationIds;
    }

    const { boxFiles, boxUserInfo, boxFolderInfo, boxError, ...rest } =
      userData;

    const accessToken = await generateToken(rest, "168h");
    await userService.setUserAccessToken(data.email, accessToken);

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      user: userData,
      accessToken,
    });

    // Set cookie in response headers
    response.cookies.set("user", JSON.stringify(rest), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });
    response.cookies.set("token", accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    console.log("Sending response with user data:", userData);
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Authentication failed: " + error.message },
      { status: 500 }
    );
  }
}

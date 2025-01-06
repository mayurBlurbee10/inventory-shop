import { NextResponse } from 'next/server';
import BoxSDK from 'box-node-sdk';
import { promises as fs } from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
import { logApiCall } from '@/app/lib/api-log-middleware';
import { generateToken } from '@/app/lib/jwt';
import * as bcrypt from "bcrypt";
import userService from "@/services/userService";

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
      privateKey: process.env.BOX_PRIVATE_KEY,
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
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials!! user not found with this email" },
        { status: 404 }
      );
    }

    // check if password is correct or not
    const isPasswordCorrect = await bcrypt.compare(
      data.password,
      user.password
    );

    const hash = await bcrypt.hash(data.password, 10);
    console.log("Invalid isPasswordCorrect:", isPasswordCorrect);
    console.log("Invalid hash:", hash);

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
    if (boxService && user.boxUserId && user.folderId) {
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
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      company: user.company,
      boxUserId: user.boxUserId,
      boxFolderId: user.folderId,
      boxFiles: boxData?.files || [],
      boxUserInfo: boxData?.user || null,
      boxFolderInfo: boxData?.folder || null,
      boxError: boxData?.error,
      collaborationIds: user.collaborationIds,
      isOnboardingRequired: user.isOnboardingRequired
    };

    const {boxFiles,boxUserInfo,boxFolderInfo,boxError,...rest} = userData;

    const accessToken = await generateToken(rest, '168h');
    await userService.setUserAccessToken(data.email, accessToken)

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      user: userData,
      accessToken
    });

    // Set cookie in response headers
    response.cookies.set("user", JSON.stringify(rest), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });
    response.cookies.set('token', accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
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

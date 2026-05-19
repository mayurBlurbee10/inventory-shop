import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import userService from "../services/user.service.ts";
import { asyncHandler } from "../utils/helper.ts";
// @ts-expect-error - jsonwebtoken doesn't have type definitions
import jwt from "jsonwebtoken";

async function generateJWTAssertion() {
  const privateKey = process.env.BOX_PRIVATE_KEY?.replace(/\\n/g, "\n");

  const claims = {
    iss: process.env.BOX_CLIENT_ID,
    sub: process.env.BOX_ENTERPRISE_ID,
    box_sub_type: "enterprise",
    aud: "https://api.box.com/oauth2/token",
    jti: Math.random().toString(36).substring(2),
    exp: Math.floor(Date.now() / 1000) + 45,
  };

  return (jwt as any).sign(claims, privateKey, {
    algorithm: "RS512",
    header: {
      kid: process.env.BOX_PUBLIC_KEY_ID,
    },
  });
}

async function getAccessToken() {
  try {
    console.log("Generating JWT assertion...");
    const assertion = await generateJWTAssertion();
    console.log("JWT assertion generated");

    const tokenUrl = "https://api.box.com/oauth2/token";

    const params = new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      client_id: process.env.BOX_CLIENT_ID!,
      client_secret: process.env.BOX_CLIENT_SECRET!,
      assertion: assertion,
    });

    console.log("Requesting token with JWT params");

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    console.log("Token response status:", response.status);
    const responseText = await response.text();
    console.log("Token response body:", responseText);

    if (!response.ok) {
      throw new Error(
        `Failed to get access token: ${response.status} - ${responseText}`
      );
    }

    const data = JSON.parse(responseText);
    return data.access_token;
  } catch (error) {
    console.error("Detailed token error:", error);
    throw error;
  }
}

async function createAppUser(accessToken: string, email: string) {
  try {
    const response = await fetch("https://api.box.com/2.0/users", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: email.split("@")[0],
        login: email,
        is_platform_access_only: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create user: ${response.status} - ${errorText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Create user error:", error);
    throw error;
  }
}

async function createCollaboration(
  accessToken: string,
  userId: string,
  folderId: string,
  role: string
) {
  try {
    const response = await fetch("https://api.box.com/2.0/collaborations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        item: {
          type: "folder",
          id: folderId,
        },
        accessible_by: {
          type: "user",
          id: userId,
        },
        role: role,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to create collaboration: ${response.status} - ${errorText}`
      );
    }

    return response.json();
  } catch (error) {
    console.error("Collaboration error:", error);
    throw error;
  }
}

// GET /api/box/users
const getUsers = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const users = await userService.getUsers();
    return res.status(200).json(users);
  } catch (error) {
    console.error("Error fetch users:", error);
    return res.status(500).json({
      error: "Failed to fetch users",
      details: (error as Error).message,
    });
  }
});

// POST /api/box/users/create
const createBoxUser = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    console.log("Received request to create Box app user");

    const { email, accessLevel } = req.body;
    console.log("Creating app user with:", { email, accessLevel });

    if (!process.env.BOX_CLIENT_ID || !process.env.BOX_CLIENT_SECRET) {
      throw new Error("Missing Box credentials in environment variables");
    }

    const accessToken = await getAccessToken();
    console.log(
      "Access token received (first 10 chars):",
      accessToken.substring(0, 10) + "..."
    );

    const newUser = await createAppUser(accessToken, email);
    console.log("App user created:", newUser);

    const collaboration = await createCollaboration(
      accessToken,
      newUser.id,
      "0",
      accessLevel === "editor" ? "editor" : "viewer"
    );
    console.log("Collaboration created:", collaboration);

    return res.status(200).json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: email,
        login: newUser.login,
        accessLevel,
      },
      collaboration: {
        id: collaboration.id,
        status: collaboration.status,
        role: collaboration.role,
      },
    });
  } catch (error) {
    console.error("Detailed error:", {
      message: (error as Error).message,
      stack: (error as Error).stack,
      name: (error as Error).name,
    });

    return res.status(500).json({
      error: "Failed to create app user",
      details: (error as Error).message,
      type: (error as Error).name,
    });
  }
});

export default {
  getUsers,
  createBoxUser,
};


import { Request, Response } from "express";
import * as bcrypt from "bcrypt";
import { logApiCall } from "../utils/api-log-middleware.ts";
import { generateToken, generateRefreshToken } from "../utils/jwt.ts";
import { decodeJwt } from "jose";
import userService from "../services/user.service.ts";
import { UserRole } from "../config/constants.ts";
import portalService from "../services/portal.service.ts";
import { sanitizeName } from "../utils/commonUtils.ts";
import { asyncHandler } from "../utils/helper.ts";
import { validateAdminUser } from "../utils/data.ts";
import authService from "../services/auth.service.ts";
import { getBoxClient } from "../utils/boxClient.ts";

let boxService: any = null;

try {
  const client = getBoxClient();

  boxService = {
    async getUserFiles(userId: string, folderId: string) {
      try {
        console.log(
          "Fetching files for user:",
          userId,
          "from folder:",
          folderId
        );
        const folderItems = await client.folders.getFolderById(folderId, {
          queryParams: {
            fields: [
              "name",
              "size",
              "created_at",
              "modified_at",
              "path_collection",
            ],
          },
        });

        console.log("Got folder info:", {
          name: folderItems.name,
          created: folderItems.createdAt,
        });

        const items = await client.folders.getFolderItems(folderId, {
          queryParams: {
            fields: [
              "name",
              "size",
              "created_at",
              "modified_at",
              "owned_by",
              "shared_link",
              "extension",
              "permissions",
            ],
            limit: 1000,
          },
        });

        console.log(`Found ${items.totalCount} items in folder`);

         const userInfo = await client.users.getUserById(userId, {
          queryParams: {
            fields: ["name", "login", "created_at", "avatar_url", "role"],
          },
        });

        return {
          user: userInfo,
          folder: folderItems,
          files: items.entries,
          total_count: items.totalCount,
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

const login = asyncHandler(async (req: Request, res: Response) => {
  try {

    const data = req.body;
    console.log("Login attempt for:", data.email);

    const user = await userService.getUserByEmail(data.email);
    let portalCreatedAdmin = null;
    if (data?.portalid && data.portalid !== "root") {
      try {
        portalCreatedAdmin = await portalService.getPortalCreatedAdmin(
          data?.portalid
        );
      } catch (adminLookupError) {
        console.warn(
          `Portal admin not found for portal "${data.portalid}" — continuing login without portal admin context:`,
          (adminLookupError as Error).message
        );
      }
    }

    if (!user) {
      return res.status(404).json({
        error: "Invalid credentials!! user not found with this email",
      });
    }

    console.log("DATA.PORTALID: ", data.portalid, user.portalId);

    // check if this is the same portal's user
    const userPermission =
      Array.isArray(user.permissions) &&
      user.permissions.find(
        (permission: any) => permission.portalId === data?.portalid
      );

    let userRole = userPermission?.role;

    if (!userPermission) {
      const superUserPermission =
        Array.isArray(user.permissions) &&
        user.permissions.find((permission: any) => permission.portalId === null);

      userRole = superUserPermission?.role;
    }

    if (data?.portalid && !userPermission) {
      if (userRole === UserRole.SUPER_ADMIN) {
        let allPortals: any[] = [];
        const userData = await userService.getUserById(user.id);
        if (userData?.groupMembersIds && userData.groupMembersIds?.length > 0) {
          for (const id of userData.groupMembersIds) {
            const groupPortals = await portalService.getPortalsByUser(
              String(id).toLowerCase(),
              true
            );
            console.log("groupPortal", groupPortals.portals);
            allPortals = [...allPortals, ...groupPortals.portals];
          }
        }
        const portals = await portalService.getPortalsByUser(
          String(user.id).toLowerCase(),
          true
        );
        console.log("portals", portals);
        allPortals = [...allPortals, ...portals.portals];
        const portalOwners = allPortals.some(
          (portal: any) => sanitizeName(portal.legalName) === data.portalid
        );
        if (!portalOwners) {
          return res.status(403).json({
            error: "This user does not have access to this portal",
          });
        }
      } else {
        return res.status(403).json({
          error: "This user does not have access to this portal",
        });
      }
    }

    if (data.role && data.role !== userRole) {
      return res.status(403).json({
        error: "This user does not have access to this portal",
      });
    }
    console.log("Login USER : ", user);
    // check if password is correct or not
    const isPasswordCorrect = await bcrypt.compare(
      data.password,
      user.password
    );

    if (!isPasswordCorrect) {
      console.log("Invalid credentials for:", data.email);
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    console.log("User found:", {
      email: user.email,
      boxUserId: user.boxUserId,
      folderId: user.folderId,
      role: user.role,
    });

    let boxData = null;
    if (
      boxService &&
      user.boxUserId &&
      portalCreatedAdmin &&
      portalCreatedAdmin?.folderId
    ) {
      try {
        console.log(
          "Fetching Box data for user ID:",
          user.boxUserId,
          "folder ID:",
          portalCreatedAdmin?.folderId
        );
        boxData = await boxService.getUserFiles(
          user.boxUserId,
          user.folderId
        );
        console.log("Retrieved Box data:", {
          filesCount: boxData?.files?.length,
          userName: boxData?.user?.name,
          folderName: boxData?.folder?.name,
        });
      } catch (boxError) {
        console.error("Error fetching Box data:", boxError);
        boxData = {
          error: (boxError as Error).message,
          files: [],
          user: null,
          folder: null,
        };
      }
    }

    // Include role in the response and ensure it's properly set
    let userData: any = {
      id: user.id,
      portalId: userPermission?.portalId || "admin",
      email: user.email,
      firstName: user?.firstName,
      lastName: user?.lastName,
      role: userRole,
      company: user.company,
      isOnboardingRequired: user.isOnboardingRequired,
      boxUserId: user.boxUserId,
      // boxFolderId: user.folderId,
      collaborationIds: user.collaborationIds,
      signRequestsIds: user.signRequestsId,
      permissions: user.permissions,
      isTNCAccepted: user.isTNCAccepted,
      title: (user as any).title,
      phoneNo: (user as any).phoneNo,
      ndaPages: (user as any).ndaPages,
    };

    if (portalCreatedAdmin) {
      userData.boxFolderId = portalCreatedAdmin?.folderId;
    } else {
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

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: userRole,
      portalId: userPermission?.portalId || "admin",
      boxUserId: user.boxUserId,
      folderId: userData.boxFolderId,
    };

    const accessToken = await generateToken(tokenPayload, "24h");
    const refreshToken = await generateRefreshToken();

    await userService.setUserTokens(
      data.email,
      accessToken,
      refreshToken,
      null
    );

    const response = {
      success: true,
      user: userData,
      accessToken,
    };

    res.clearCookie("user", { path: "/" });
    res.clearCookie("token", { path: "/" });
    res.clearCookie("refreshToken", { path: "/" });

    res.cookie("user", JSON.stringify(rest), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });
    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log("Sending response with user data:", userData);
    return res.status(200).json(response);
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      error: "Authentication failed: " + (error as Error).message,
    });
  }
});

const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { email, password } = req.body;
    const user = validateAdminUser(email, password);

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials!! user not found with this email",
      });
    }

    // Don't send password back to client
    const { password: _, ...userData } = user;
    return res.status(200).json({ user: userData });
  } catch (error) {
    return res.status(500).json({ error: "Login failed" });
  }
});

const register = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { saved, userData, accessToken } = await authService.register(req.body);

    res.cookie("user", JSON.stringify(userData), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie("token", accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await logApiCall(req, () => { }, "register", saved?.id);

    return res.status(201).json({
      success: true,
      message: "User registered successfully. Please set your password.",
      user: saved,
      accessToken,
    });
  } catch (error) {
    console.error("Registration error:", error);
    const statusCode = (error as any)?.statusCode || 500;
    return res.status(statusCode).json({
      error: (error as Error)?.message || "Internal server error",
    });
  }
});

const setPassword = asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = await authService.setPassword(req.body);

    return res.status(200).json({
      success: true,
      message: "Password set successfully. Account is now active.",
      user,
    });
  } catch (error) {
    console.error("Set password error:", error);
    const statusCode = (error as any)?.statusCode || 500;
    return res.status(statusCode).json({
      error: (error as Error)?.message || "Internal server error",
    });
  }
});

const logout = asyncHandler(async (req: Request, res: Response) => {
  const userCookie = req.cookies?.user;
  let userId = undefined;
  if (userCookie) {
    try {
      const parsed = JSON.parse(userCookie);
      userId = parsed.id;
    } catch (e) { }
  }
  await logApiCall(req, () => { }, "logout", userId);

  res.clearCookie("user", { path: "/" });
  res.clearCookie("token", { path: "/" });
  res.clearCookie("refreshToken", { path: "/" });

  return res.status(200).json({ message: "User logout successfully" });
});

const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { refreshToken: providedRefreshToken, portalId } = req.body;

    const userCookie = req.cookies?.user;
    let userFromCookieId = undefined;
    if (userCookie) {
      try {
        const parsed = JSON.parse(userCookie);
        userFromCookieId = parsed.id;
      } catch (e) { }
    }

    const refreshTokenFromCookie = req.cookies?.refreshToken;
    const refreshTokenToUse = providedRefreshToken || refreshTokenFromCookie;

    let user = null;

    if (refreshTokenToUse) {
      user = await userService.getUserByRefreshToken(refreshTokenToUse);

      if (user && user.refreshToken !== refreshTokenToUse) {
        await logApiCall(req, () => { }, "logout", userFromCookieId);

        res.clearCookie("user", { path: "/" });
        res.clearCookie("token", { path: "/" });
        res.clearCookie("refreshToken", { path: "/" });

        return res.status(401).json({ error: "Invalid refresh token" });
      }
    }

    if (!user) {
      const token =
        req.cookies?.token ||
        req.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        await logApiCall(req, () => { }, "logout", userFromCookieId);

        res.clearCookie("user", { path: "/" });
        res.clearCookie("token", { path: "/" });
        res.clearCookie("refreshToken", { path: "/" });

        return res.status(400).json({ error: "Token required" });
      }

      const decoded = decodeJwt(token);

      user = await userService.getUserById(decoded.id as string);
    }

    if (!user) {
      await logApiCall(req, () => { }, "logout", userFromCookieId);

      res.clearCookie("user", { path: "/" });
      res.clearCookie("token", { path: "/" });
      res.clearCookie("refreshToken", { path: "/" });

      return res.status(401).json({ error: "Unable to identify user" });
    }

    const portalPermission = user?.permissions?.find(
      (p: any) => p.portalId === portalId
    );

    const userData = {
      id: user.id,
      email: user.email,
      role: portalPermission?.role,
      portalId,
    };

    const newAccessToken = await generateToken(userData, "24h");
    const newRefreshToken = await generateRefreshToken();

    await userService.setUserTokens(
      user.email,
      newAccessToken,
      newRefreshToken,
      null
    );

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie("token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    res.clearCookie("token", { path: "/" });
    res.clearCookie("refreshToken", { path: "/" });
    return res.status(500).json({ error: (error as Error).message });
  }
});

export default {
  login,
  adminLogin,
  register,
  setPassword,
  logout,
  refreshToken,
};

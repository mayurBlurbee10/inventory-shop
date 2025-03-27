import { logApiCall } from "@/app/lib/api-log-middleware";
import { generateToken } from "@/app/lib/jwt";
import { UserRole } from "@/config/constants";
import portalService from "@/services/portalService";
import userService from "@/services/userService";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    await logApiCall(request);
    const data = await request.json();
    const user = await userService.getUserByEmail(data.email);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials!! user not found with this email" },
        { status: 404 }
      );
    }
    let portalCreatedAdmin = null;
    if(portalCreatedAdmin){
      portalCreatedAdmin = await portalService.getPortalCreatedAdmin(data?.portalid);
    }
    const userPermission =
      Array.isArray(user.permissions) &&
      user.permissions.find(
        (permission) => permission.portalId === data.portalid
      );

    let userRole;
    if (!userPermission) {
      const userIsSuperAdminPermission =
        Array.isArray(user.permissions) &&
        user.permissions.find(
          (permission) => permission.role === UserRole.SUPER_ADMIN
        );
      if (userIsSuperAdminPermission) {
        userRole = userIsSuperAdminPermission.role;
      } else {
        return NextResponse.json(
          { error: "This user does not have access to this portal" },
          { status: 403 }
        );
      }
    }else {
      userRole = userPermission?.role;
    }

    const userData = {
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
      permissions: user.permissions,
    };

    if(portalCreatedAdmin){
      userData.boxFolderId = portalCreatedAdmin?.folderId
    } else {
      userData.boxFolderId = user.folderId
    }

    const accessToken = await generateToken(userData, "168h");
    await userService.setUserAccessToken(data.email, accessToken, "okta");
    const response = NextResponse.json({
      success: true,
      user: userData,
      accessToken,
    });
    response.cookies.set("user", JSON.stringify(userData), {
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
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Authentication failed: " + error.message },
      { status: 500 }
    );
  }
}

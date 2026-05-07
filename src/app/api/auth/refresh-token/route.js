import { generateRefreshToken, generateToken } from "@/app/lib/jwt";
import { NextResponse } from "next/server";
import { decodeJwt } from "jose";
import userService from "@/services/userService";
import { logApiCall } from "@/app/lib/api-log-middleware";

export async function POST(req) {
  try {
    const body = await req.json();
    const { refreshToken: providedRefreshToken, portalId } = body;

    const userFromCookie = req.cookies.get("user")?.value;
    const refreshTokenFromCookie = req.cookies.get("refreshToken")?.value;
    const refreshTokenToUse = providedRefreshToken || refreshTokenFromCookie;

    let user = null;

    if (refreshTokenToUse) {
      user = await userService.getUserByRefreshToken(refreshTokenToUse);

      if (user && user.refreshToken !== refreshTokenToUse) {
        await logApiCall(req, () => {}, "logout", userFromCookie?.id);
        const response = NextResponse.json(
          { error: "Invalid refresh token" },
          { status: 401 },
        );
        response.cookies.delete("user");
        response.cookies.delete("token");
        response.cookies.delete("refreshToken");
        return response;
      }
    }

    if (!user) {
      const token =
        req.cookies.get("token")?.value ||
        req.headers.get("authorization")?.replace("Bearer ", "");

      if (!token) {
        await logApiCall(req, () => {}, "logout", userFromCookie?.id);
        const response = NextResponse.json(
          { error: "Token required" },
          { status: 400 },
        );
        response.cookies.delete("user");
        response.cookies.delete("token");
        response.cookies.delete("refreshToken");
        return response;
      }

      const decoded = decodeJwt(token);

      user = await userService.getUserById(decoded.id);
    }

    if (!user) {
      await logApiCall(req, () => {}, "logout", userFromCookie?.id);
      const response = NextResponse.json(
        { error: "Unable to identify user" },
        { status: 401 },
      );
      response.cookies.delete("user");
      response.cookies.delete("token");
      response.cookies.delete("refreshToken");
      return response;
    }

    const portalPermission = user?.permissions?.find(
      (p) => p.portalId === portalId,
    );

    const userData = {
      id: user.id,
      email: user.email,
      role: portalPermission?.role,
      portalId,
    };

    const newAccessToken = await generateToken(userData, "24h");
    const newRefreshToken = await generateRefreshToken();

    const response = NextResponse.json({
      success: true,
      accessToken: newAccessToken,
    });

    await userService.setUserTokens(
      user.email,
      newAccessToken,
      newRefreshToken,
      null,
    );

    response.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    response.cookies.set("token", newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hr
    });

    return response;
  } catch (error) {
    const response = NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
    response.cookies.delete("token");
    response.cookies.delete("refreshToken");
    return response;
  }
}

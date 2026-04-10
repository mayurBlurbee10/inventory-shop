import { NextResponse } from "next/server";
import { logApiCall } from "@/app/lib/api-log-middleware";
import { createBoxAppUser } from "@/app/lib/boxCreateAppUser";
import userService from "@/services/userService";
import { UserRole } from "@/config/constants";
import { generateToken, generateNanoToken } from "@/app/lib/jwt";

function sanitizeUserResponse(user) {
  if (!user) return null;
  const plain = JSON.parse(JSON.stringify(user));
  delete plain.password;
  delete plain.extra;
  delete plain.accessToken;
  delete plain.resetPasswordToken;
  return plain;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { companyName, firstName, lastName, email, phone, title, portal } =
      body;

    if (!firstName || !lastName || !email || !companyName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const portalId = portal || "root";

    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
      );
    }

    let boxUser;
    try {
      boxUser = await createBoxAppUser({
        userName: email,
        externalId: `user_${Date.now()}`,
      });
    } catch (boxError) {
      console.error("Box registration error:", boxError);
      return NextResponse.json(
        {
          error:
            boxError?.message ||
            "Could not create Box account. Please try again later.",
        },
        { status: 502 },
      );
    }

    const resolvedTitle = (title && String(title).trim()) || "User";
    const resetPasswordToken = await generateNanoToken();

    const newUser = {
      email,
      phoneNo: phone ? String(phone).trim() : null,
      firstName,
      lastName,
      password: null,
      company: { name: companyName },
      collaborationIds: [],
      groupMembersIds: [],
      role: UserRole.USER,
      permissions: [
        {
          portalId: portalId,
          role: UserRole.USER,
        },
      ],
      portalId,
      title: resolvedTitle,
      boxUserId: boxUser.userId,
      folderId: boxUser.folderId,
      isOnboardingRequired: false,
      isTNCAccepted: false,
      authStrategy: "email",
      resetPasswordToken,
    };

    const saved = await userService.createUser(newUser);
    const userData = {
      id: saved.id,
      portalId: saved?.portalId || portalId,
      email: saved.email,
      role: saved?.role ,
      boxUserId: saved.boxUserId,
      boxFolderId: saved.folderId,
    };

    const accessToken = await generateToken(userData, "168h");
    await userService.setUserAccessToken(saved.email, accessToken);

    const response = NextResponse.json(
      {
        success: true,
        message: "User registered successfully. Please set your password.",
        user: saved,
        accessToken,
      },
      { status: 201 },
    );

    response.cookies.set("user", JSON.stringify(userData), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    response.cookies.set("token", accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    await logApiCall(request, () => {}, "register", saved?.id);
    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 },
    );
  }
}

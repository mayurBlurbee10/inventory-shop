import { NextResponse } from "next/server";
import * as bcrypt from "bcrypt";
import userService from "@/services/userService";

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
    const { userId, password } = body;

    if (!userId || !password) {
      return NextResponse.json(
        { error: "User ID and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return NextResponse.json(
        {
          error:
            "Password must contain uppercase, lowercase, and numbers",
        },
        { status: 400 }
      );
    }

    const user = await userService.getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.password) {
      return NextResponse.json(
        { error: "Password has already been set for this user" },
        { status: 400 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const updated = await userService.updateUser(userId, {
      password: hashedPassword,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Password set successfully. Account is now active.",
        user: sanitizeUserResponse(updated),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Set password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

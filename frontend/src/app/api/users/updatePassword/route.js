import { logApiCall } from "@/app/lib/api-log-middleware";
import { sendSetPasswordEmail } from "@/app/lib/email";
import { generateNanoToken } from "@/app/lib/jwt";
import { UserRole } from "@/config/constants";
import userService from "@/services/userService";
import { NextResponse } from "next/server";
import * as bcrypt from "bcrypt";

export async function POST(request) {
  try {
    await logApiCall(request);
    const { email, portalid,oldPassword, newPassword } = await request.json();
    const user = await userService.getUserByEmail(email, portalid);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials!! user not found with this email" },
        { status: 404 }
      );
    }
    const userPermission =
      Array.isArray(user.permissions) &&
      user.permissions.find((permission) => permission.portalId === portalid);

    if (!userPermission) {
      return NextResponse.json(
        { error: "This user does not have access to this portal" },
        { status: 403 }
      );
    }

    const isCorrectOldPassword = await bcrypt.compare(oldPassword, user?.password)

    if (!isCorrectOldPassword) {
        return NextResponse.json(
          { error: "Old password is wrong" },
          { status: 403 }
        );
      }

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(newPassword, salt);

    const updatedUser = await userService.updateUser(user?.id, {
      extra: newPassword,
      password: password,
    });

    return NextResponse.json({
      message: "Password sent successfully",
      data : updatedUser
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Email send failed: " + error.message },
      { status: 500 }
    );
  }
}

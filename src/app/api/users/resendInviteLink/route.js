import { logApiCall } from "@/app/lib/api-log-middleware";
import { sendSetPasswordEmail } from "@/app/lib/email";
import { generateNanoToken } from "@/app/lib/jwt";
import { UserRole } from "@/config/constants";
import userService from "@/services/userService";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    await logApiCall(request);
    const data = await request.json();
    const user = await userService.getUserByEmail(data.email, data.portalid);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials!! user not found with this email" },
        { status: 404 }
      );
    }
    const userPermission =
      Array.isArray(user.permissions) &&
      user.permissions.find(
        (permission) => permission.portalId === data.portalid
      );

    if (!userPermission) {
      return NextResponse.json(
        { error: "This user does not have access to this portal" },
        { status: 403 }
      );
    }
    const token = user?.resetPasswordToken
      ? user.resetPasswordToken
      : await generateNanoToken();

    await userService.setResetPasswordToken(user.email, token);

    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.MASTER) {
      sendSetPasswordEmail(user.email, user.name, token, userPermission.portalId,false,'reset');
    }

    return NextResponse.json({
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Email send failed: " + error.message },
      { status: 500 }
    );
  }
}

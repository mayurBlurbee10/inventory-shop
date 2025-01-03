import { logApiCall } from "@/app/lib/api-log-middleware";
import userService from "@/services/userService";
import { NextResponse } from "next/server";
import path from "path";

const dir = path.join(process.cwd(), "data");
const filePath = path.join(dir, "users.json");

export async function GET(request) {
  try {
    await logApiCall(request);

    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json(
        { error: "token is required." },
        { status: 400 }
      );
    }

    const selectedUser = await userService.getUserByResetPasswordToken(token);
    if (!selectedUser) {
      return NextResponse.json(
        { error: "Link may have expired." },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Valid link." }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/setPassword:", error);
    return NextResponse.json(
      { error: "Failed to set password", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await logApiCall(request);
    const { token, password } = await request.json();
    if (!token || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const message = await userService.setPasswordByResetPasswordToken(token, password);
    return NextResponse.json({ message }, { status: 200 });

  } catch (error) {
    console.error("Error in POST /api/setPassword:", error);
    return NextResponse.json(
      { error: "Failed to set password", details: error.message },
      { status: 500 }
    );
  }
}
